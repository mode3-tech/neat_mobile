import { Redirect, Stack } from 'expo-router';

import { LOANS_ENABLED } from '@/constants';

export default function LoanLayout() {
  if (!LOANS_ENABLED) return <Redirect href="/Dashboard" />;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
       
        statusBarStyle: 'light',
      }}
    />
  );
}
