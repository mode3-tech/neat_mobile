import { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

/**
 * OPay-style success celebration: a green check that springs in while a burst
 * of confetti fans out and fades. Built on the core React Native `Animated`
 * API (the pattern already used in (profile)/success.tsx) — no extra
 * dependency and no Reanimated worklet/babel setup required.
 */

const CONFETTI_COLORS = [
  '#472FF8',
  '#16A34A',
  '#F59E0B',
  '#EF4444',
  '#06B6D4',
  '#EC4899',
];
const PIECE_COUNT = 18;

interface Piece {
  dx: number;
  dy: number;
  rotate: number;
  size: number;
  color: string;
}

function makePieces(): Piece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => {
    // Evenly spread the pieces around a circle, with a little jitter.
    const angle = (2 * Math.PI * i) / PIECE_COUNT + (Math.random() - 0.5) * 0.5;
    const distance = 80 + Math.random() * 70;
    return {
      dx: Math.cos(angle) * distance,
      dy: Math.sin(angle) * distance,
      rotate: Math.random() * 720 - 360,
      size: 6 + Math.random() * 6,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    };
  });
}

export function SuccessCelebration() {
  const scale = useRef(new Animated.Value(0)).current;
  const progress = useRef(new Animated.Value(0)).current;
  const pieces = useRef<Piece[]>(makePieces()).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: 1,
      friction: 5,
      tension: 80,
      useNativeDriver: true,
    }).start();
    Animated.timing(progress, {
      toValue: 1,
      duration: 1100,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [scale, progress]);

  return (
    <View
      className="items-center justify-center"
      style={{ width: 168, height: 112 }}
    >
      {pieces.map((p, idx) => {
        const translateX = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dx],
        });
        const translateY = progress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, p.dy],
        });
        const rotate = progress.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', `${p.rotate}deg`],
        });
        const opacity = progress.interpolate({
          inputRange: [0, 0.7, 1],
          outputRange: [1, 1, 0],
        });
        return (
          <Animated.View
            key={idx}
            style={{
              position: 'absolute',
              width: p.size,
              height: p.size,
              borderRadius: 2,
              backgroundColor: p.color,
              transform: [{ translateX }, { translateY }, { rotate }],
              opacity,
            }}
          />
        );
      })}

      <Animated.View
        style={{
          width: 112,
          height: 112,
          borderRadius: 56,
          backgroundColor: '#ECFDF5',
          alignItems: 'center',
          justifyContent: 'center',
          transform: [{ scale }],
        }}
      >
        <View
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#16A34A',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="checkmark" size={44} color="#fff" />
        </View>
      </Animated.View>
    </View>
  );
}
