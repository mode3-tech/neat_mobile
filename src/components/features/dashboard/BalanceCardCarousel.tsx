import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Image,
  ImageSourcePropType,
  NativeScrollEvent,
  NativeSyntheticEvent,
  ScrollView,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import Feather from '@expo/vector-icons/Feather';
import { router } from 'expo-router';

const CARD_MARGIN = 24;
const AUTO_ROTATE_INTERVAL = 4000;

interface BalanceCardCarouselProps {
  balanceVisible: boolean;
  onToggleVisibility: () => void;
  accountNumber?: string;
  availableBalance?: number;
  loanBalance?: number;
}

interface CardData {
  id: string;
  bgColor: string;
  label: string;
  accountNumber: string;
  title: string;
  amount: string;
  // buttons: { label: string; variant: 'dark' | 'light' }[];
  buttons: { label: string; icon?: keyof typeof Feather.glyphMap }[];
  image: ImageSourcePropType;
  imageSize?: { width: number; height: number };
}

function buildCards(
  accountNumber: string,
  availableBalance: number | undefined,
  loanBalance: number | undefined,
): CardData[] {
  const fmtBalance = (val: number | undefined) =>
    val !== undefined
      ? new Intl.NumberFormat('en-NG').format(val)
      : '---';

  return [
    {
      id: 'available',
      bgColor: '#472FF8',
      label: 'Neatpay Account',
      accountNumber,
      title: 'Available Balance',
      amount: fmtBalance(availableBalance),
      buttons: [{ label: 'Send Money', icon: 'send' }],
      image: require('../../../../assets/images/dashboard/ball.png'),
      imageSize: { width: 70, height: 70 },
    },
    {
      id: 'savings',
      bgColor: '#472FF8',
      label: 'Neatpay Account',
      accountNumber,
      title: 'Total Savings',
      amount: '---',
      buttons: [{ label: 'Deposit' }, { label: 'Withdraw' }],
      image: require('../../../../assets/images/dashboard/bag.png'),
      imageSize: { width: 80, height: 70 },
    },
    {
      id: 'loan',
      bgColor: '#472FF8',
      label: 'Neatpay Account',
      accountNumber,
      title: 'Loan Balance',
      amount: fmtBalance(loanBalance),
      buttons: [{ label: 'Make Repayment' }],
      image: require('../../../../assets/images/dashboard/barg.png'),
      imageSize: { width: 80, height: 70 },
    },
  ];
}

export default function BalanceCardCarousel({
  balanceVisible,
  onToggleVisibility,
  accountNumber = '---',
  availableBalance,
  loanBalance,
}: BalanceCardCarouselProps) {
  const { width: screenWidth } = useWindowDimensions();
  const cardWidth = screenWidth - CARD_MARGIN * 2;

  const CARDS = useMemo(
    () => buildCards(accountNumber, availableBalance, loanBalance),
    [accountNumber, availableBalance, loanBalance],
  );
  const EXTENDED_CARDS = useMemo(
    () => [...CARDS, CARDS[0]],
    [CARDS],
  );

  const [activeIndex, setActiveIndex] = useState(0);
  const scrollRef = useRef<ScrollView>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cardWidthRef = useRef(cardWidth);
  cardWidthRef.current = cardWidth;
  const cardsLengthRef = useRef(CARDS.length);
  cardsLengthRef.current = CARDS.length;
  const isResettingRef = useRef(false);

  const stopAutoRotate = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const startAutoRotate = useCallback(() => {
    stopAutoRotate();
    timerRef.current = setInterval(() => {
      setActiveIndex((prev) => {
        const next = prev + 1;
        const len = cardsLengthRef.current;
        // Guard against scrolling past the clone
        if (next > len) return prev;
        const totalCardWidth = cardWidthRef.current + CARD_MARGIN * 2;
        scrollRef.current?.scrollTo({ x: next * totalCardWidth, animated: true });

        if (next === len) {
          // Scrolled to the clone — after animation finishes, silently reset to real card 0
          setTimeout(() => {
            isResettingRef.current = true;
            scrollRef.current?.scrollTo({ x: 0, animated: false });
            setTimeout(() => {
              isResettingRef.current = false;
            }, 50);
          }, 400);
          return 0;
        }

        return next;
      });
    }, AUTO_ROTATE_INTERVAL);
  }, [stopAutoRotate]);

  useEffect(() => {
    startAutoRotate();
    return stopAutoRotate;
  }, [startAutoRotate, stopAutoRotate]);

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isResettingRef.current) return;

    const totalCardWidth = cardWidth + CARD_MARGIN * 2;
    const rawIndex = Math.round(e.nativeEvent.contentOffset.x / totalCardWidth);

    if (rawIndex >= CARDS.length) {
      // User swiped to the clone card — silently reset to real card 0
      isResettingRef.current = true;
      scrollRef.current?.scrollTo({ x: 0, animated: false });
      setTimeout(() => {
        isResettingRef.current = false;
      }, 50);
      setActiveIndex(0);
    } else {
      setActiveIndex(rawIndex);
    }

    startAutoRotate();
  };

  const renderCard = (card: CardData, index: number) => (
    <View
      key={`${card.id}-${index}`}
      className="rounded-2xl py-5 px-3 overflow-hidden justify-between"
      style={{ backgroundColor: card.bgColor, width: cardWidth, marginHorizontal: CARD_MARGIN, minHeight: 190 }}
    >
     

      {/* Header pill with border */}
      
      <View className="flex-row justify-between items-center  px-4 py-2">
        <Text className="text-white/90 text-[13px] font-medium">{card.label}</Text>
        <View className="flex-row items-center gap-2">
          <Text className="text-white/70 text-xs">{card.accountNumber}</Text>
          <TouchableOpacity
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            onPress={() => Clipboard.setStringAsync(card.accountNumber)}
          >
            <Feather name="copy" size={14} color="rgba(255,255,255,0.7)" />
          </TouchableOpacity>
        </View>
      </View>

   

      {/* Balance section */}
      <View className="mt-4 flex-row border border-white/30 rounded-3xl px-4 py-4">
        <View className=''>
          <View className="flex-row items-center gap-2">
            <Text className="text-white/75 text-xs">{card.title}</Text>
            <TouchableOpacity onPress={onToggleVisibility} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons
                name={balanceVisible ? 'eye-outline' : 'eye-off-outline'}
                size={16}
                color="rgba(255,255,255,0.75)"
              />
            </TouchableOpacity>
          </View>
          <Text className="text-white text-[24px] font-bold mt-1">
            {balanceVisible ? `₦${card.amount}` : '₦ ****'}
          </Text>
        </View>
           <Image
        source={card.image}
        className="absolute opacity-80"
        style={{ right: 10, top: 7, width: card.imageSize?.width ?? 70, height: card.imageSize?.height ?? 70 }}
        resizeMode="contain"
      />

       
      </View>

      {/* Action buttons */}
      <View className="flex-row  gap-2.5 mt-4">
        {/* variant removed — defaulting to dark style */}
        {card.buttons.map((btn) => (
          <TouchableOpacity
            key={btn.label}
            className={`rounded-full py-4 flex-row justify-center items-center ${
              card.buttons.length === 1 ? 'flex-1' : 'flex-1'
            } bg-white`}
            activeOpacity={0.85}
            onPress={() => {
              if (btn.label === 'Send Money') {
                router.push('/(transfer)/send-money');
              }
            }}
          >
            {btn.icon && (
              <Feather name={btn.icon} size={16} color="#472FF8" style={{ marginRight: 8 }} />
            )}
            <Text className="text-sm font-semibold text-[#472FF8]">
              {btn.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const snapOffsets = EXTENDED_CARDS.map((_, i) => i * (cardWidth + CARD_MARGIN * 2));

  return (
    <View className="mt-5">
      <ScrollView
        ref={scrollRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onScrollEnd}
        onScrollBeginDrag={stopAutoRotate}
        snapToOffsets={snapOffsets}
        decelerationRate="fast"
      >
        {EXTENDED_CARDS.map(renderCard)}
      </ScrollView>

      <View className="flex-row justify-center items-center gap-1.5 mt-3">
        {CARDS.map((card, i) => (
          <View
            key={card.id}
            className={`rounded-full ${
              i === activeIndex % CARDS.length ? 'w-2 h-2 bg-[#472FF8]' : 'w-1.5 h-1.5 bg-gray-300'
            }`}
          />
        ))}
      </View>
    </View>
  );
}
