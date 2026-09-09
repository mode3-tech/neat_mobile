import { useRef } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import QRCode from 'react-native-qrcode-svg';
import ViewShot, { captureRef } from 'react-native-view-shot';

import { accountService } from '@/services/account.service';
import { shareFile } from '@/utils/receipt';
import { HeaderScreen } from '@/components/ui/header-screen';
import { BackButton } from '@/components/ui/back-button';
import { CopyButton } from '@/components/ui/copy-button';

export default function BankTransferScreen() {
  const { data: accountSummary } = useQuery({
    queryKey: ['account-summary'],
    queryFn: accountService.getSummary,
  });

  const qrShotRef = useRef<ViewShot>(null);

  const accountName = accountSummary?.full_name;
  const bankName = accountSummary?.bank_name;
  const accountNumber = accountSummary?.account_number;

  const isReady = Boolean(accountName && bankName && accountNumber);

  const detailsText = isReady
    ? `Account Name: ${accountName}\nBank: ${bankName}\nAccount Number: ${accountNumber}`
    : '';

  const handleShareQr = async () => {
    try {
      const uri = await captureRef(qrShotRef, { format: 'png', quality: 1 });
      if (uri) await shareFile(uri);
    } catch {
      // user cancelled or capture failed
    }
  };

  return (
    <HeaderScreen>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <BackButton className="mt-4 mb-6" />

        <Text className="text-[22px] font-bold text-[#032252] text-center mb-1.5">
          Transfer to Your Account
        </Text>
        <Text className="text-[13px] text-[#6B7280] text-center leading-5 mb-8">
          Use these details to complete your{'\n'}deposit
        </Text>

        <View className="bg-[#F5F5F5] rounded-[14px] px-5 py-6 items-center">
          <Text className="text-[13px] text-[#6B7280] mb-1">Account Name</Text>
          <Text className="text-[17px] font-bold text-[#032252] mb-5">
            {accountName ?? '---'}
          </Text>

          <Text className="text-[13px] text-[#6B7280] mb-1">Bank</Text>
          <Text className="text-[17px] font-bold text-[#032252] mb-5">
            {bankName ?? '---'}
          </Text>

          <Text className="text-[13px] text-[#6B7280] mb-1">Account Number</Text>
          <Text className="text-[17px] font-bold text-[#032252]">
            {accountNumber ?? '---'}
          </Text>
        </View>

        {isReady && (
          // The gap belongs outside CopyButton: its pill anchors to the wrapper,
          // so a margin on the trigger itself would put "above" flush against
          // the details card instead of in the space between them.
          <View className="mt-5">
            <CopyButton
              value={detailsText}
              copiedLabel="Details copied"
              pillPlacement="above"
              pillAlign="right"
              className="flex-row items-center justify-center rounded-full border border-[#E5E7EB] py-3.5"
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons
                name="content-copy"
                size={16}
                color="#032252"
              />
              <Text className="text-[14px] font-semibold text-[#032252] ml-2">
                Copy Details
              </Text>
            </CopyButton>
          </View>
        )}

        <Text className="text-[13px] text-[#E59501] text-center mt-6">
          Transfers usually reflect within 5 minutes
        </Text>

        {isReady && (
          <>
            <ViewShot
              ref={qrShotRef}
              options={{ format: 'png', quality: 1 }}
              style={{ alignSelf: 'center', marginTop: 28 }}
            >
              <View
                collapsable={false}
                className="bg-white border border-[#E5E7EB] rounded-2xl px-8 py-6 items-center"
              >
                <Text className="text-[13px] font-semibold text-[#032252] mb-4">
                  Scan to get my account details
                </Text>

                <QRCode
                  value={detailsText}
                  size={160}
                  color="#032252"
                  backgroundColor="#FFFFFF"
                />

                <Text className="text-[12px] text-[#6B7280] mt-4">
                  {bankName}
                </Text>
                <Text className="text-[16px] font-bold text-[#032252] mt-0.5">
                  {accountNumber}
                </Text>
              </View>
            </ViewShot>

            <TouchableOpacity
              onPress={handleShareQr}
              activeOpacity={0.85}
              style={{ borderRadius: 50 }}
              className="flex-row items-center justify-center bg-[#F9B700] py-4 mt-5"
            >
              <MaterialCommunityIcons
                name="share-variant"
                size={18}
                color="#032252"
              />
              <Text className="text-[15px] font-semibold text-[#032252] ml-2">
                Share QR Code
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </HeaderScreen>
  );
}
