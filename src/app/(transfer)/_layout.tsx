import { Stack } from 'expo-router';

export default function TransferLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* These three render <HeaderScreen>; the bulk-* screens are light. */}
      <Stack.Screen name="send-money" options={{ statusBarStyle: 'light' }} />
      <Stack.Screen
        name="transfer-review"
        options={{ statusBarStyle: 'light' }}
      />
      <Stack.Screen
        name="transfer-success"
        options={{ statusBarStyle: 'light' }}
      />
    </Stack>
  );
}
