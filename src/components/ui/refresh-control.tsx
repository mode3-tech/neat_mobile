import { RefreshControl } from 'react-native';

interface PrimaryRefreshControlProps {
  refreshing: boolean;
  onRefresh: () => void;
}

/**
 * Pull-to-refresh control tinted with the NEAT brand color (#472FF8).
 * Wraps RN's RefreshControl so the tint/colors stay consistent across screens.
 */
export function PrimaryRefreshControl({
  refreshing,
  onRefresh,
}: PrimaryRefreshControlProps) {
  return (
    <RefreshControl
      refreshing={refreshing}
      onRefresh={onRefresh}
      tintColor="#472FF8"
      colors={['#472FF8']}
    />
  );
}
