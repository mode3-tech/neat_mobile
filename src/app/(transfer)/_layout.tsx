import { Stack } from 'expo-router';

export default function TransferLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Navy ground (either <HeaderScreen> or the PIN keypad) needs light
          status-bar icons; the remaining bulk-* screens are white. */}
      <Stack.Screen name="send-money" options={{ statusBarStyle: 'light' }} />
      <Stack.Screen
        name="transfer-review"
        options={{ statusBarStyle: 'light' }}
      />
      <Stack.Screen name="transfer-pin" options={{ statusBarStyle: 'light' }} />
      <Stack.Screen
        name="transfer-success"
        options={{ statusBarStyle: 'light' }}
      />
      <Stack.Screen
        name="bulk-transfer-pin"
        options={{ statusBarStyle: 'light' }}
      />
    </Stack>
  );
}
