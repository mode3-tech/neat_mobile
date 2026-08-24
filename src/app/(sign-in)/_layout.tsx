import { Stack } from 'expo-router';

export default function SignInLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Only this screen is navy; the rest of the group is light. */}
      <Stack.Screen name="sign-in" options={{ statusBarStyle: 'light' }} />
    </Stack>
  );
}
