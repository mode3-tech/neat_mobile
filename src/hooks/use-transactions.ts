import { useMemo, useState, useCallback } from 'react';
import { useInfiniteQuery, useQueryClient } from '@tanstack/react-query';

import { transactionService } from '@/services/transaction.service';
import { filterTransactions, groupTransactionsByDay } from '@/utils/transaction.utils';
import { QUERY_KEYS } from '@/constants';
import type { TransactionFilter, DaySectionData } from '@/types/transaction.types';

const PAGE_SIZE = 20;

export function useTransactions() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // Reset to page 1 instead of refetching all loaded pages
  const handleRefresh = useCallback(() => {
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
    handleRefresh,
  };
}
