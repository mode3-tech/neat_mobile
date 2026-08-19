import { Stack } from 'expo-router';

export default function VasLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        // Every screen here renders <HeaderScreen>.
        statusBarStyle: 'light',
      }}
    />
  );
}
