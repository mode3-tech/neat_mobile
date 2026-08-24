import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { transactionService } from '@/services/transaction.service';
import { filterTransactions, groupTransactionsByDay } from '@/utils/transaction.utils';
import { QUERY_KEYS } from '@/constants';
import type { TransactionFilter, DaySectionData } from '@/types/transaction.types';

const PAGE_SIZE = 20;

// How many extra pages a view may pull on its own to try to fill the screen.
// Bounds the walk: worst case a filter that matches nothing costs 5 requests,
// then the "Load more" footer takes over and each tap buys another 5.
const MAX_AUTO_PAGES = 5;

export function useTransactions() {
  const queryClient = useQueryClient();
  const [filter, setFilterState] = useState<TransactionFilter>('all');
  const [searchQuery, setSearchQueryState] = useState('');

  // Pagination is server-side over the *unfiltered* feed while filtering is
  // client-side, so a filtered view is usually shorter than the screen. A list
  // whose content doesn't fill the viewport reports "end reached" as soon as it
  // renders, and each page it pulls is mostly rows the filter discards — so it
  // fires again, and again. Ungated that was hundreds of back-to-back requests.
  // Only paginate once the user has actually dragged the list.
  //
  // This is damage control, not the fix: the real one is a `type` param on
  // /transaction/all so credit/debit are separate paginated feeds. Until then a
  // filtered view only shows matches from the pages loaded so far.
  const [hasScrolled, setHasScrolled] = useState(false);

  // …but the gate alone strands a short list. A list that doesn't fill the
  // screen can't be dragged, so `hasScrolled` never flips (Android emits no
  // drag at all on non-scrollable content) and pagination locks shut with no
  // way out — the user is told they have 3 credits when page 2 holds a 4th.
  //
  // So the gate covers the *scrollable* case only, and an underfilled list
  // instead walks pages deliberately, up to MAX_AUTO_PAGES, until it either
  // fills the screen or runs out of budget. Client-side filtering over a
  // server-paginated feed can't be both complete and cheap; the cap picks a
  // bounded cost and hands the rest to a "Load more" the user controls.
  const [viewportHeight, setViewportHeight] = useState(0);
  const [contentHeight, setContentHeight] = useState(0);

  // Auto-paging budget. Counted in pages *landed* rather than fetches issued —
  // it's derived from the query cache below, so it can't double-count a request
  // that hasn't resolved, and the effect never has to setState (a setState there
  // would re-run the effect before `isFetchingNextPage` had flipped and fire a
  // second request for the same page). Starts at 1: page 1 is free.
  const [autoPageBase, setAutoPageBase] = useState(1);

  // Read inside callbacks that must not take `pagesLoaded` as a dep — their
  // identity is passed down as list props.
  const pagesLoadedRef = useRef(0);

  // Changing the filter or search term re-collapses the list, which would
  // re-trigger the cascade off the previous scroll. Make them re-earn it.
  //
  // Only a filter change refills the auto-paging budget. A filter is one
  // deliberate tap — at most three of them — so a fresh budget is affordable.
  // Search is one call per keystroke: refilling there would grant 5 more pages
  // per character, and a 10-character query matching nothing would quietly walk
  // 50 requests deep. Search reuses whatever budget the view has left and falls
  // through to "Load more", which is a tap the user chose to make.
  const setFilter = useCallback((next: TransactionFilter) => {
    setHasScrolled(false);
    setAutoPageBase(pagesLoadedRef.current);
    setFilterState(next);
  }, []);

  const setSearchQuery = useCallback((next: string) => {
    setHasScrolled(false);
    setSearchQueryState(next);
  }, []);

  const {
    data,
    isLoading,
    isError,
    error,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isRefetching,
  } = useInfiniteQuery({
    queryKey: [QUERY_KEYS.TRANSACTIONS],
    queryFn: ({ pageParam }) =>
      transactionService.getAll({ limit: PAGE_SIZE, cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) =>
      lastPage.has_more ? (lastPage.next_cursor ?? undefined) : undefined,
  });

  const pagesLoaded = data?.pages.length ?? 0;
  pagesLoadedRef.current = pagesLoaded;
  const autoPagesUsed = Math.max(0, pagesLoaded - autoPageBase);

  // Flatten all pages, deduplicate by id (cursor shifts can cause overlaps)
  const allTransactions = useMemo(() => {
    if (!data?.pages) return [];
    const all = data.pages.flatMap((page) =>
      page.sections.flatMap((section) => section.transactions),
    );
    const seen = new Set<string>();
    return all.filter((tx) => {
      if (seen.has(tx.id)) return false;
      seen.add(tx.id);
      return true;
    });
  }, [data]);

  const sections: DaySectionData[] = useMemo(() => {
    const filtered = filterTransactions(allTransactions, filter, searchQuery);
    return groupTransactionsByDay(filtered);
  }, [allTransactions, filter, searchQuery]);

  const isFiltered = filter !== 'all' || searchQuery.trim().length > 0;

  const handleScrollBeginDrag = useCallback(() => setHasScrolled(true), []);

  const handleEndReached = useCallback(() => {
    if (hasScrolled && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasScrolled, hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Measured, not counted: row heights vary, day headers add up, and a tablet
  // fits far more than a phone. "Is there anything to scroll?" is the actual
  // question, so ask the layout rather than guessing at a row count.
  const handleLayout = useCallback((e: LayoutChangeEvent) => {
    setViewportHeight(e.nativeEvent.layout.height);
  }, []);

  const handleContentSizeChange = useCallback((_w: number, h: number) => {
    setContentHeight(h);
  }, []);

  // `contentHeight > 0` is the "we have actually measured" check, not a size
  // test. onContentSizeChange lands after native layout, a beat behind the
  // commit that rendered the rows, so without it every visit sees one render
  // where page 1 exists but content measures 0 — reads as underfilled and burns
  // a page. An empty list still measures non-zero: the container is flexGrow
  // with a full-height EmptyState inside it.
  const isUnderfilled =
    viewportHeight > 0 && contentHeight > 0 && contentHeight <= viewportHeight;
  const autoBudgetSpent = autoPagesUsed >= MAX_AUTO_PAGES;

  // Walk pages while the list can't be scrolled and budget remains. No setState
  // here on purpose — the only thing that re-runs this is a dep the query itself
  // moved (a page landing, a fetch starting), so each pass issues at most one
  // request and waits for it.
  useEffect(() => {
    if (viewportHeight === 0) return; // pre-layout; nothing measured yet
    if (!hasNextPage || isFetchingNextPage) return;
    if (!isUnderfilled) return; // scrollable — onEndReached owns it from here
    if (autoBudgetSpent) return; // the footer owns it from here
    fetchNextPage();
  }, [
    viewportHeight,
    isUnderfilled,
    hasNextPage,
    isFetchingNextPage,
    autoBudgetSpent,
    fetchNextPage,
  ]);

  // Shown only when the walk gave up on a list that still can't be scrolled —
  // the one state where the user would otherwise be looking at a dead end.
  const showLoadMore =
    hasNextPage && isUnderfilled && autoBudgetSpent && !isFetchingNextPage;

  // Refills the budget rather than fetching a single page: one tap should make
  // visible progress, and a page of the unfiltered feed may contribute nothing
  // to the current filter.
  const handleLoadMore = useCallback(() => {
    setAutoPageBase(pagesLoadedRef.current);
  }, []);

  // Reset to page 1 instead of refetching all loaded pages
  const handleRefresh = useCallback(() => {
    setHasScrolled(false);
    setAutoPageBase(1);
    queryClient.resetQueries({ queryKey: [QUERY_KEYS.TRANSACTIONS] });
  }, [queryClient]);

  return {
    sections,
    filter,
    setFilter,
    searchQuery,
    setSearchQuery,
    isFiltered,
    isLoading,
    isError,
    error,
    isFetchingNextPage,
    isRefetching,
    handleEndReached,
    handleScrollBeginDrag,
    handleRefresh,
    handleLayout,
    handleContentSizeChange,
    showLoadMore,
    handleLoadMore,
  };
}
