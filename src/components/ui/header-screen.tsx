import type { ReactNode } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import DashboardHeader from '@/components/features/dashboard/DashboardHeader';

interface HeaderScreenProps {
  children: ReactNode;
  /**
   * Screens get the standard 24px gutter by default. Set false when the content
   * is full-bleed or pads itself.
   */
  padded?: boolean;
}

/**
 * Screen shell for anything that shows the navy DashboardHeader.
 *
 * It exists because the header has two requirements that are easy to get wrong
 * when each screen wires it up by hand:
 *
 *  - It must run edge to edge, so the screen's horizontal gutter has to sit on
 *    a wrapper *below* it, never on the root.
 *  - It pads itself with the top safe-area inset and paints behind the status
 *    bar, so the root must not also claim the 'top' edge — that insets twice
 *    and leaves a white strip above the navy.
 *
 * Both are encoded here once. To exclude the header from a screen, use a plain
 * SafeAreaView instead of this component.
 */
export function HeaderScreen({ children, padded = true }: HeaderScreenProps) {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['bottom']}>
      <DashboardHeader />
      <View className={padded ? 'flex-1 px-6' : 'flex-1'}>{children}</View>
    </SafeAreaView>
  );
}
