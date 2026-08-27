import { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { router } from 'expo-router';

import { useSignUpV2Store } from '@/stores/sign-up-v2.store';
import {
  validateAddress,
  validateName,
  validateRequired,
} from '@/utils/signup-v2-validation';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

/**
 * Second identity screen. Mother's maiden name sits here rather than with the
 * name fields because it is a security answer, not part of the user's own
 * identity — grouping it with the address keeps that distinction visible.
 */
export default function AddressDetailsScreen() {
  const store = useSignUpV2Store();

  const [mothersMaidenName, setMothersMaidenName] = useState(store.mothersMaidenName);
  const [address, setAddress] = useState(store.address);
  const [houseNo, setHouseNo] = useState(store.houseNo);
  // Per-field, set on blur — Proceed stays disabled until the form is valid, so
  // a submit-time flag would never fire and nothing would explain the greying.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const maidenNameError = validateName(mothersMaidenName, "mother's maiden name");
  const houseNoError = validateRequired(houseNo, 'Please enter your house number');
  const addressError = validateAddress(address);

  const isValid = !maidenNameError && !houseNoError && !addressError;

  // Empty fields stay silent — the disabled button covers "not finished".
  const showMaidenNameError = touched.maidenName && !!mothersMaidenName.trim();
  const showHouseNoError = touched.houseNo && !!houseNo.trim();
  const showAddressError = touched.address && !!address.trim();

  const handleProceed = () => {
    if (!isValid) return;
    store.setAddressDetails({ mothersMaidenName, address, houseNo });
    router.push('/(sign-up-v2)/create-password');
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        bottomOffset={20}
      >
        <View className="flex-row items-center gap-2 mt-4 mb-1.5">
          <BackButton className="" />
          <Text style={styles.title}>Almost there</Text>
        </View>
        <Text style={styles.subtitle}>
          A few last details to open your account.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>Mother's maiden name</Text>
          <View
            style={[
              styles.inputWrap,
              showMaidenNameError && !!maidenNameError && styles.inputWrapError,
            ]}
          >
            <TextInput
              style={styles.input}
              value={mothersMaidenName}
              onChangeText={setMothersMaidenName}
              onBlur={() => touch('maidenName')}
              placeholder="Enter your mother's maiden name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {showMaidenNameError && maidenNameError ? (
            <Text style={styles.errorText}>{maidenNameError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>House number</Text>
          <View
            style={[
              styles.inputWrap,
              showHouseNoError && !!houseNoError && styles.inputWrapError,
            ]}
          >
            <TextInput
              style={styles.input}
              value={houseNo}
              onChangeText={setHouseNo}
              onBlur={() => touch('houseNo')}
              placeholder="Enter your house number"
              placeholderTextColor="#9CA3AF"
              autoCorrect={false}
            />
          </View>
          {showHouseNoError && houseNoError ? (
            <Text style={styles.errorText}>{houseNoError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Street address</Text>
          <View
            style={[
              styles.inputWrap,
              styles.multilineWrap,
              showAddressError && !!addressError && styles.inputWrapError,
            ]}
          >
            <TextInput
              style={[styles.input, styles.multilineInput]}
              value={address}
              onChangeText={setAddress}
              onBlur={() => touch('address')}
              placeholder="Street, area, city and state"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              multiline
            />
          </View>
          {showAddressError && addressError ? (
            <Text style={styles.errorText}>{addressError}</Text>
          ) : null}
        </View>

        <View style={styles.spacer} />

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.primaryBtn, !isValid && styles.disabledBtn]}
            onPress={handleProceed}
            disabled={!isValid}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, !isValid && styles.disabledBtnText]}>
              Proceed
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
  },
  title: {
    fontSize: 22,
    lineHeight: 26,
    includeFontPadding: false,
    fontWeight: '700',
    color: PRIMARY_TEXT,
  },
  subtitle: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 28,
  },
  field: {
    marginBottom: 18,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  inputWrap: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  multilineWrap: {
    minHeight: 88,
  },
  inputWrapError: {
    backgroundColor: '#fff',
    borderColor: ERROR_COLOR,
  },
  input: {
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  multilineInput: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  errorText: {
    fontSize: 12,
    color: ERROR_COLOR,
    marginTop: 6,
  },
  spacer: {
    flex: 1,
    minHeight: 24,
  },
  footer: {
    paddingBottom: 16,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    borderRadius: 50,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: PRIMARY_TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
  disabledBtn: {
    backgroundColor: '#E5E7EB',
  },
  disabledBtnText: {
    color: '#9CA3AF',
  },
});
