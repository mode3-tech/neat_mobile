import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

export default function NewDeviceDetectedScreen() {
  const params = useLocalSearchParams<{ session_token: string }>();
  const sessionToken = Array.isArray(params.session_token)
    ? params.session_token[0]
    : params.session_token;

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace({
        pathname: '/(sign-in)/new-device-otp',
        params: { session_token: sessionToken },
      });
    }, 3000);
    return () => clearTimeout(timer);
  }, [sessionToken]);

  return (
    <View style={styles.container}>
      <View style={styles.imageSection}>
        <Image
          source={require('../../../assets/images/device.png')}
          style={styles.image}
          resizeMode="contain"
        />
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.title}>New Device{'\n'}Detected</Text>
        <Text style={styles.subtitle}>
          You're trying to log in from a new device.{'\n'}
          For security, we need to verify it's you.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  imageSection: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: 220,
    height: 220,
  },
  bottomCard: {
    backgroundColor: '#1a1145',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 32,
    paddingTop: 40,
    paddingBottom: 60,
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 14,
    color: '#B0B0C0',
    textAlign: 'center',
    lineHeight: 22,
  },
});
