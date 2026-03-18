import { useCallback, useEffect, useRef, useState } from 'react';
import { router } from 'expo-router';
import {
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageSourcePropType,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const SLIDE_DURATION = 3000;
const PRIMARY_COLOR = '#472FF8';
const BG_COLOR = '#d4d8FF';

interface Slide {
  id: string;
  image: ImageSourcePropType;
  title: string;
  description: string;
}

const SLIDES: Slide[] = [
  {
    id: '1',
    image: require('../../assets/images/welcome/frame1.png'),
    title: 'Instant Transfers',
    description:
      'Open your account in minutes, access instant loans, transfer money securely.',
  },
  {
    id: '2',
    image: require('../../assets/images/welcome/frame2.png'),
    title: 'Secure & Protected',
    description:
      'Your data and money are protected with advanced security and real-time monitoring.',
  },
  {
    id: '3',
    image: require('../../assets/images/welcome/frame3.png'),
    title: 'Get Quick Loans',
    description:
      'Apply in minutes, get fast approval, and receive funds directly to your wallet.',
  },
  {
    id: '4',
    image: require('../../assets/images/welcome/frame.png'),
    title: 'Airtime & Data Topup',
    description:
      'Verify your identity, get your account instantly, and enjoy seamless transfers.',
  },
];

const EXTENDED_SLIDES: Slide[] = [...SLIDES, { ...SLIDES[0], id: '1-clone' }];

export default function WelcomeScreen(): React.JSX.Element {
  const flatListRef = useRef<FlatList<Slide>>(null);
  const activeIndexRef = useRef(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const textOpacity = useRef(new Animated.Value(1)).current;

  const goToSlide = useCallback(
    (nextIndex: number) => {
      Animated.timing(textOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // Map to real slide index for text/dots
        const displayIndex = nextIndex >= SLIDES.length ? 0 : nextIndex;
        activeIndexRef.current = displayIndex;
        setActiveIndex(displayIndex);
        flatListRef.current?.scrollToIndex({ index: nextIndex, animated: true });

        // If we scrolled to the clone, silently reset to real slide 0
        if (nextIndex >= SLIDES.length) {
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({ index: 0, animated: false });
          }, 400);
        }

        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    },
    [textOpacity],
  );

  useEffect(() => {
    const timer = setInterval(() => {
      const nextIndex = activeIndexRef.current + 1;
      // Cap at clone index to prevent out-of-bounds
      if (nextIndex <= SLIDES.length) {
        goToSlide(nextIndex);
      }
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [goToSlide]);

  const handleCreateAccount = useCallback(() => {
    router.push('/(sign-up)/bvn-verification');
  }, []);

  const handleSignIn = useCallback(() => {
    router.push('/(sign-in)/sign-in');
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <FlatList
        ref={flatListRef}
        data={EXTENDED_SLIDES}
        horizontal
        pagingEnabled
        scrollEnabled={false}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        getItemLayout={(_, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Image
              source={item.image}
              style={styles.slideImage}
              resizeMode="cover"
            />
          </View>
        )}
        style={styles.flatList}
      />

      <Animated.View style={[styles.textContainer, { opacity: textOpacity }]}>
        <Text style={styles.title}>{SLIDES[activeIndex].title}</Text>
        <Text style={styles.description}>{SLIDES[activeIndex].description}</Text>
      </Animated.View>

      <View style={styles.dotsContainer}>
        {SLIDES.map((_, i) => (
          <View
            key={i}
            style={[styles.dot, i === activeIndex ? styles.activeDot : styles.inactiveDot]}
          />
        ))}
      </View>

      <View style={styles.spacer} />

      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={handleCreateAccount}
          activeOpacity={0.8}
        >
          <Text style={styles.primaryButtonText}>Create account</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleSignIn}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Sign In</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG_COLOR,
  },
  flatList: {
    flexGrow: 0,
    height: SCREEN_HEIGHT * 0.55,
    marginTop: 24,
  },
  slide: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.55,
    alignItems: 'center',
    justifyContent: 'flex-start',
    overflow: 'hidden',
  },
  slideImage: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.65,
  },
  textContainer: {
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: PRIMARY_COLOR,
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.3,
  },
  description: {
    fontSize: 14,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 22,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    width: 24,
    backgroundColor: PRIMARY_COLOR,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: 'rgba(61, 59, 243, 0.3)',
  },
  spacer: {
    flex: 1,
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  primaryButton: {
    backgroundColor: PRIMARY_COLOR,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor:"#FFFFFF",
     borderRadius: 50,
  },
  secondaryButtonText: {
    color: "#472FF8",
    fontSize: 16,
    fontWeight: '500',
  },
});
