import { Text } from 'react-native';

import { PRIVACY_POLICY_URL, TERMS_URL } from '@/constants';
import { openInAppBrowser } from '@/utils/open-in-app-browser';

export function SignupConsent({ className = '' }: { className?: string }) {
  return (
    <Text className={`text-[12px] leading-[18px] text-gray-500 text-center ${className}`}>
      By continuing, you agree to our{' '}
      <Text
        className="text-[#032252] font-medium"
        onPress={() => openInAppBrowser(TERMS_URL)}
      >
        Terms &amp; Conditions
      </Text>{' '}
      and{' '}
      <Text
        className="text-[#032252] font-medium"
        onPress={() => openInAppBrowser(PRIVACY_POLICY_URL)}
      >
        Privacy Policy
      </Text>
      .
    </Text>
  );
}
