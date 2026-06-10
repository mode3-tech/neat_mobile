import { useQuery } from '@tanstack/react-query';

import { accountService } from '@/services/account.service';
import { QUERY_KEYS } from '@/constants';

export function useAccountLimits() {
  return useQuery({
    queryKey: [QUERY_KEYS.ACCOUNT_LIMITS],
    queryFn: accountService.getLimits,
  });
}
