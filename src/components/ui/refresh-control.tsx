import { RefreshControl, type RefreshControlProps } from 'react-native';

/**
 * Pull-to-refresh control tinted with the NEAT brand color (#032252).
 * Must spread all props — Android injects scroll content as `children`.
 */
export function PrimaryRefreshControl(props: RefreshControlProps) {
  return <RefreshControl {...props} tintColor="#032252" colors={['#032252']} />;
}
