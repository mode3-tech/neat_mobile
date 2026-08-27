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
import { NIN_LENGTH } from '@/constants';
import { validateName, validateNin } from '@/utils/signup-v2-validation';
import { BackButton } from '@/components/ui/back-button';

const PRIMARY = '#F9B700';
const PRIMARY_TEXT = '#032252';
const ERROR_COLOR = '#EF4444';

// The backend takes gender and marital_status as free strings — these are the
// app's chosen values, matching the lowercase examples in the OpenAPI spec.
// Chips rather than a text box: the field is closed in practice even though the
// API doesn't enforce it, and typos here would be invisible until support has
// to fix them.
const GENDERS = ['male', 'female'];
const MARITAL_STATUSES = ['single', 'married', 'divorced', 'widowed'];

/**
 * First of the two identity screens. v2 has the user type what v1 read off the
 * BVN/NIN records, so these fields have no v1 equivalent.
 */
export default function PersonalDetailsScreen() {
  const store = useSignUpV2Store();

  const [firstName, setFirstName] = useState(store.firstName);
  const [lastName, setLastName] = useState(store.lastName);
  const [gender, setGender] = useState(store.gender);
  const [maritalStatus, setMaritalStatus] = useState(store.maritalStatus);
  const [nin, setNin] = useState(store.nin);
  // Per-field, set on blur: the Proceed button is disabled until the form is
  // valid, so a submit-time flag would never fire and the user would get no
  // explanation for why it stays greyed out.
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const touch = (field: string) => setTouched((t) => ({ ...t, [field]: true }));

  const firstNameError = validateName(firstName, 'first name');
  const lastNameError = validateName(lastName, 'last name');
  const ninError = validateNin(nin);
  const genderError = gender ? '' : 'Please select your gender';
  const maritalError = maritalStatus ? '' : 'Please select your marital status';

  const isValid =
    !firstNameError && !lastNameError && !genderError && !maritalError && !ninError;

  // NIN uses the number pad, which has no return key — a full-length entry
  // that's still wrong should say so without waiting for a blur. Empty fields
  // stay silent throughout; the disabled button covers "not finished".
  const showNinError = !!nin && (touched.nin || nin.length >= NIN_LENGTH);
  const showFirstNameError = touched.firstName && !!firstName.trim();
  const showLastNameError = touched.lastName && !!lastName.trim();

  const handleProceed = () => {
    if (!isValid) return;
    store.setPersonalDetails({ firstName, lastName, gender, maritalStatus });
    store.setNin(nin);
    router.push('/(sign-up-v2)/address-details');
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
          <Text style={styles.title}>Your details</Text>
        </View>
        <Text style={styles.subtitle}>
          Enter your details exactly as they appear on your BVN and NIN records.
        </Text>

        <View style={styles.field}>
          <Text style={styles.label}>First name</Text>
          <View
            style={[
              styles.inputWrap,
              showFirstNameError && !!firstNameError && styles.inputWrapError,
            ]}
          >
            <TextInput
              style={styles.input}
              value={firstName}
              onChangeText={setFirstName}
              onBlur={() => touch('firstName')}
              placeholder="Enter your first name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {showFirstNameError && firstNameError ? (
            <Text style={styles.errorText}>{firstNameError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Last name</Text>
          <View
            style={[
              styles.inputWrap,
              showLastNameError && !!lastNameError && styles.inputWrapError,
            ]}
          >
            <TextInput
              style={styles.input}
              value={lastName}
              onChangeText={setLastName}
              onBlur={() => touch('lastName')}
              placeholder="Enter your last name"
              placeholderTextColor="#9CA3AF"
              autoCapitalize="words"
              autoCorrect={false}
            />
          </View>
          {showLastNameError && lastNameError ? (
            <Text style={styles.errorText}>{lastNameError}</Text>
          ) : null}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Gender</Text>
          <View style={styles.chipRow}>
            {GENDERS.map((value) => (
              <Chip
                key={value}
                label={value}
                selected={gender === value}
                onPress={() => setGender(value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Marital status</Text>
          <View style={styles.chipRow}>
            {MARITAL_STATUSES.map((value) => (
              <Chip
                key={value}
                label={value}
                selected={maritalStatus === value}
                onPress={() => setMaritalStatus(value)}
              />
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>NIN</Text>
          <View
            style={[styles.inputWrap, showNinError && !!ninError && styles.inputWrapError]}
          >
            <TextInput
              style={styles.input}
              value={nin}
              onChangeText={(t) => setNin(t.replace(/\D/g, '').slice(0, NIN_LENGTH))}
              onBlur={() => touch('nin')}
              placeholder="Enter your 11-digit NIN"
              placeholderTextColor="#9CA3AF"
              keyboardType="number-pad"
              maxLength={NIN_LENGTH}
            />
          </View>
          {showNinError && ninError ? (
            <Text style={styles.errorText}>{ninError}</Text>
          ) : (
            <Text style={styles.hint}>To check your NIN, dial *346#.</Text>
          )}
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

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[styles.chip, selected && styles.chipSelected]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
        {label.charAt(0).toUpperCase() + label.slice(1)}
      </Text>
    </TouchableOpacity>
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
  inputWrapError: {
    backgroundColor: '#fff',
    borderColor: ERROR_COLOR,
  },
  input: {
    fontSize: 15,
    color: '#1A1A1A',
    padding: 0,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 50,
    backgroundColor: '#F5F5F5',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  chipSelected: {
    backgroundColor: '#FFFBEF',
    borderColor: PRIMARY,
  },
  chipText: {
    fontSize: 14,
    color: '#374151',
  },
  chipTextSelected: {
    color: PRIMARY_TEXT,
    fontWeight: '600',
  },
  hint: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 6,
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
