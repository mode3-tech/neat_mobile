import { useQuery } from '@tanstack/react-query';

import { accountService } from '@/services/account.service';
import { QUERY_KEYS } from '@/constants';

export function useAccountSummary() {
  return useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_SUMMARY],
    queryFn: accountService.getSummary,
  });
}
