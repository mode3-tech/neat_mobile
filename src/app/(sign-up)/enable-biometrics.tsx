import { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';

// import { authService } from '@/services/auth.service'; // TODO: uncomment when API is ready
import { useSignUpStore } from '@/stores/sign-up.store';
// import { useAuthStore } from '@/stores/auth.store'; // TODO: uncomment when API is ready

const PRIMARY = '#472FF8';

export default function EnableBiometricsScreen() {
  const [enabled, setEnabled] = useState(true);
  const [loading, setLoading] = useState(false);

  const store = useSignUpStore();
  // const setTokens = useAuthStore((s) => s.setTokens); // TODO: uncomment when API is ready
  // const setUser = useAuthStore((s) => s.setUser);     // TODO: uncomment when API is ready

  const handleComplete = () => {
    store.setBiometrics(enabled);
    store.reset();
    // TODO: call authService.register(...) and setTokens/setUser when API is ready
    // TODO: navigate to main app screen
    router.replace('/');
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>Back</Text>
      </TouchableOpacity>

      <Text style={styles.title}>Enable Biometrics</Text>
      <Text style={styles.subtitle}>Use fingerprint or Face ID</Text>

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Enable</Text>
        <Switch
          value={enabled}
          onValueChange={setEnabled}
          trackColor={{ false: '#E5E7EB', true: PRIMARY }}
          thumbColor="#fff"
        />
      </View>

      <View style={styles.spacer} />

      <View style={styles.footer}>
        <View style={styles.btnOuter}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={handleComplete}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.primaryBtnText}>Complete Setup</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
  },
  backBtn: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 28,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  toggleLabel: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '500',
  },
  spacer: {
    flex: 1,
  },
  footer: {
    paddingBottom: 16,
  },
  btnOuter: {
    borderWidth: 2,
    borderColor: 'rgba(71, 47, 248, 0.3)',
    borderRadius: 50,
    padding: 3,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 46,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: PRIMARY,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
