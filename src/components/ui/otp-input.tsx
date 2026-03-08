import { useEffect, useRef } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  autoFocus?: boolean;
}

export function OtpInput({ value, onChange, length = 6, autoFocus = true }: OtpInputProps) {
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (autoFocus) {
      const t = setTimeout(() => inputRef.current?.focus(), 300);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);

  return (
    <Pressable style={styles.container} onPress={() => inputRef.current?.focus()}>
      {Array.from({ length }).map((_, i) => {
        const digit = value[i];
        const isActive = i === value.length && i < length;
        return (
          <View
            key={i}
            style={[
              styles.box,
              isActive && styles.activeBox,
              !!digit && styles.filledBox,
            ]}
          >
            <Text style={styles.digit}>{digit ?? ''}</Text>
          </View>
        );
      })}
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(t) => onChange(t.replace(/\D/g, '').slice(0, length))}
        keyboardType="number-pad"
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        maxLength={length}
        style={styles.hiddenInput}
        caretHidden
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: 10,
  },
  box: {
    flex: 1,
    height: 56,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeBox: {
    borderColor: '#472FF8',
    backgroundColor: '#fff',
  },
  filledBox: {
    borderColor: '#472FF8',
    backgroundColor: '#fff',
  },
  digit: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1A1A1A',
  },
  hiddenInput: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
  },
});
