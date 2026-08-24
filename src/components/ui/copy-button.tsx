import { useEffect, useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type TouchableOpacityProps,
} from 'react-native';
import Feather from '@expo/vector-icons/Feather';
import * as Clipboard from 'expo-clipboard';
import { toast } from 'sonner-native';

/** How long the "Copied" pill stays up. */
const COPIED_VISIBLE_MS = 2500;

// Loading placeholder used by the screens that copy an account number. Copying
// it — or claiming success on it — would be a lie while the summary is in
// flight, so treat it as "nothing to copy".
const PLACEHOLDER = '---';

// The trigger is usually just an icon, and Yoga lays an absolutely positioned
// child out against its parent's width — so a pill anchored straight to the
// wrapper gets ~15px to work with and the label wraps to one letter per line.
// The anchor is a fixed-width, transparent box instead: wide enough that the
// pill inside it measures naturally, aligned to whichever edge it hangs from.
// It only needs to fit the label, and it never intercepts touches.
const ANCHOR_WIDTH = 160;

// Neither zIndex nor elevation can lift the pill above a sibling of one of the
// wrapper's ancestors — that's a different stacking context. Where the space
// below the trigger belongs to such a sibling, use pillPlacement="above".
const styles = StyleSheet.create({
  anchor: {
    position: 'absolute',
    width: ANCHOR_WIDTH,
    zIndex: 10,
    elevation: 6,
  },
  anchorBelow: { top: '100%', paddingTop: 4 },
  anchorAbove: { bottom: '100%', paddingBottom: 4 },
  anchorRight: { right: 0, alignItems: 'flex-end' },
  anchorLeft: { left: 0, alignItems: 'flex-start' },
});

interface CopyButtonProps {
  /** Copied verbatim. Undefined, empty, or the '---' placeholder makes the button inert. */
  value?: string | null;
  /** The tappable content — an icon, or an icon + label row. */
  children: React.ReactNode;
  /** Pill text. Defaults to 'Copied' — the pill is anchored to what it copied,
   *  so naming the field again is usually redundant. */
  copiedLabel?: string;
  /** Applied to the TouchableOpacity, for callers that style the trigger itself. */
  className?: string;
  /** Which edge of the trigger the pill hangs from. */
  pillAlign?: 'left' | 'right';
  /** Which side of the trigger the pill hangs off. Use 'above' when the space
   *  below belongs to a later sibling — stacking props can't reach across it. */
  pillPlacement?: 'above' | 'below';
  hitSlop?: TouchableOpacityProps['hitSlop'];
  activeOpacity?: number;
  /** Fired after the value lands on the clipboard — e.g. for haptics. */
  onCopied?: () => void;
}

/**
 * Copy-to-clipboard trigger that confirms itself with a small "Copied" pill
 * directly beneath the tap target.
 *
 * It shows the confirmation in place rather than through the app-wide sonner
 * toast because sonner-native can only anchor top/bottom/center, and a banner
 * at the top of the screen reads as unrelated to the icon that spawned it.
 */
export function CopyButton({
  value,
  children,
  copiedLabel = 'Copied',
  className,
  pillAlign = 'right',
  pillPlacement = 'below',
  hitSlop,
  activeOpacity,
  onCopied,
}: CopyButtonProps): React.JSX.Element {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const handlePress = async () => {
    if (!value || value === PLACEHOLDER) return;

    try {
      await Clipboard.setStringAsync(value);
    } catch {
      // Confirming a copy that didn't happen is worse than a toast in the
      // wrong place, so fall back to sonner rather than showing the pill.
      toast.error('Could not copy');
      return;
    }

    // Re-tapping restarts the window rather than letting the first timer cut
    // the second confirmation short.
    if (timerRef.current) clearTimeout(timerRef.current);
    setCopied(true);
    timerRef.current = setTimeout(() => setCopied(false), COPIED_VISIBLE_MS);

    onCopied?.();
  };

  return (
    // hitSlop is repeated on the wrapper because it hit-tests first: a touch
    // outside its bounds never reaches the TouchableOpacity to consult the
    // slop there.
    <View className="relative" hitSlop={hitSlop}>
      <TouchableOpacity
        className={className}
        onPress={handlePress}
        hitSlop={hitSlop}
        activeOpacity={activeOpacity}
      >
        {children}
      </TouchableOpacity>

      {copied && (
        <View
          pointerEvents="none"
          style={[
            styles.anchor,
            pillPlacement === 'above' ? styles.anchorAbove : styles.anchorBelow,
            pillAlign === 'left' ? styles.anchorLeft : styles.anchorRight,
          ]}
        >
          <View className="flex-row items-center gap-1 rounded-full bg-[#032252] px-2.5 py-1">
            <Feather name="check" size={11} color="#FFFFFF" />
            <Text
              numberOfLines={1}
              className="text-white text-[11px] font-medium"
            >
              {copiedLabel}
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}
