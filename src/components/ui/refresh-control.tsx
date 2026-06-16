import { RefreshControl, type RefreshControlProps } from 'react-native';

/**
 * Pull-to-refresh control tinted with the NEAT brand color (#472FF8).
 *
 * IMPORTANT: this must forward ALL props to the underlying RefreshControl.
 * When a ScrollView renders a `refreshControl` on Android it calls
 * `cloneElement(control, { style }, <scrollContent/>)` — i.e. it injects the
 * scroll content as `children` and a layout `style`. If this wrapper only
 * picked `refreshing`/`onRefresh` it would silently drop that content and the
 * screen would render blank. So spread `props` through and only override the
 * brand colors.
 */
export function PrimaryRefreshControl(props: RefreshControlProps) {
  return <RefreshControl {...props} tintColor="#472FF8" colors={['#472FF8']} />;
}
