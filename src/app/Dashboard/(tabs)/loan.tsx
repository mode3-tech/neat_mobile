import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/theme/palette';

export default function LoanScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Loans</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: 24 },
  title: { fontSize: 22, fontWeight: '700', color: colors.ink, marginTop: 16 },
});
