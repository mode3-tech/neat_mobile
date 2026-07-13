import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-[16px] font-bold text-[#1A1A1A] mt-6 mb-2">{children}</Text>
  );
}

function Paragraph({ children }: { children: React.ReactNode }) {
  return (
    <Text className="text-[14px] text-[#6B7280] leading-6 mb-3">{children}</Text>
  );
}

function Bullet({ children }: { children: React.ReactNode }) {
  return (
    <View className="flex-row mb-2">
      <Text className="text-[14px] text-[#6B7280] mr-2 leading-6">{'•'}</Text>
      <Text className="flex-1 text-[14px] text-[#6B7280] leading-6">{children}</Text>
    </View>
  );
}

function Lettered({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View className="flex-row mb-3">
      <Text className="text-[14px] text-[#6B7280] mr-2 leading-6 w-6">{label}</Text>
      <Text className="flex-1 text-[14px] text-[#6B7280] leading-6">{children}</Text>
    </View>
  );
}

export default function CloseAccountNoticeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-6 pt-2 pb-4">
        <TouchableOpacity
          className="border border-gray-200 rounded-full w-10 h-10 items-center justify-center"
          onPress={() => router.back()}
        >
          <MaterialCommunityIcons name="chevron-left" size={24} color="#374151" />
        </TouchableOpacity>
        <Text className="flex-1 text-center text-lg font-bold text-[#1A1A1A] mr-10">
          Account Cancellation Notice
        </Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className="text-[20px] font-bold text-[#1A1A1A] mt-2">
          NEATPay – Close Account
        </Text>
        <Text className="text-[13px] text-gray-400 mt-1 mb-3">Version 1.0</Text>

        <Paragraph>
          Before you cancel your NEATPay account, please read the following information
          carefully.
        </Paragraph>

        <SectionTitle>Account Closure Process</SectionTitle>
        <Paragraph>
          Follow the NEATPay account closure process to permanently close your account.
        </Paragraph>
        <Paragraph>
          Once your NEATPay account has been successfully closed:
        </Paragraph>
        <Bullet>You will no longer be able to access or use NEATPay services.</Bullet>
        <Bullet>
          Your rights and obligations under the NEAT Micro Credit Terms and Conditions
          shall terminate, except where otherwise required by law or expressly stated in
          the agreement.
        </Bullet>
        <Bullet>
          Your login credentials will be deactivated and access to the NEATPay
          application will be revoked.
        </Bullet>

        <Paragraph>In addition:</Paragraph>
        <Lettered label="(a)">
          Your identity, KYC information, and account records will be retained in
          accordance with applicable laws, CBN regulations, NDPA requirements, AML/CFT
          regulations, and other regulatory obligations.
        </Lettered>
        <Lettered label="(b)">
          Your transaction history and financial records will be archived for the legally
          required retention period and will no longer be accessible through your NEATPay
          account.
        </Lettered>
        <Lettered label="(c)">
          All standing instructions, scheduled transfers, automatic repayments, recurring
          collections, and direct debit mandates linked to your account will be cancelled.
        </Lettered>
        <Lettered label="(d)">
          Any promotional rewards, loyalty points, referral bonuses, cashback benefits,
          vouchers, coupons, or other incentives associated with your account will become
          invalid unless otherwise stated.
        </Lettered>
        <Lettered label="(e)">
          Any merchant services, payment services, third-party integrations, or linked
          applications connected to your NEATPay account will be terminated.
        </Lettered>
        <Lettered label="(f)">
          All debit cards, virtual cards, bank accounts, wallet accounts, virtual
          accounts, or payment instruments linked to your NEATPay account will be
          unlinked.
        </Lettered>
        <Lettered label="(g)">
          Any active financial products associated with your account, including but not
          limited to:
        </Lettered>
        <View className="ml-6">
          <Bullet>Savings Wallet</Bullet>
          <Bullet>Loan Wallet</Bullet>
          <Bullet>Investment Wallet</Bullet>
          <Bullet>Fixed Savings</Bullet>
          <Bullet>Loan Facilities</Bullet>
          <Bullet>Virtual Accounts</Bullet>
        </View>
        <Paragraph>
          shall be closed or handled in accordance with their respective terms and
          conditions.
        </Paragraph>
        <Lettered label="(h)">
          If you operate a NEATPay Business Account or Merchant Account, access to such
          services will also be terminated.
        </Lettered>

        <SectionTitle>Account Eligibility</SectionTitle>
        <Paragraph>The account requested for closure must:</Paragraph>
        <Bullet>
          Be fully verified in accordance with NEAT Micro Credit KYC requirements.
        </Bullet>
        <Bullet>Have accurate and up-to-date customer information.</Bullet>
        <Bullet>
          Not be under restriction, suspension, investigation, or regulatory hold.
        </Bullet>
        <Bullet>Not be involved in any ongoing fraud investigation.</Bullet>
        <Bullet>
          Meet all regulatory and compliance requirements before closure can proceed.
        </Bullet>

        <SectionTitle>Risk Assessment</SectionTitle>
        <Paragraph>
          To protect customers and the financial ecosystem, NEAT Micro Credit will conduct
          a risk assessment before approving an account closure request.
        </Paragraph>
        <Paragraph>Before your account can be closed:</Paragraph>
        <Bullet>There must be no pending transactions.</Bullet>
        <Bullet>There must be no disputed transactions.</Bullet>
        <Bullet>There must be no chargeback investigations.</Bullet>
        <Bullet>There must be no outstanding loan obligations.</Bullet>
        <Bullet>There must be no unpaid service charges or applicable fees.</Bullet>
        <Bullet>There must be no active repayment mandates.</Bullet>
        <Paragraph>
          If funds remain in your wallet or savings account, you must transfer or withdraw
          the available balance before your account can be closed.
        </Paragraph>
        <Paragraph>
          Where applicable, NEAT Micro Credit reserves the right to offset any outstanding
          obligations against available balances in accordance with applicable laws and
          agreed terms.
        </Paragraph>

        <SectionTitle>Verification Process</SectionTitle>
        <Paragraph>
          When you request to close your NEATPay account, NEAT Micro Credit will perform an
          identity verification process to confirm that the request is genuine.
        </Paragraph>
        <Paragraph>The verification process may include:</Paragraph>
        <Bullet>Password authentication</Bullet>
        <Bullet>PIN verification</Bullet>
        <Bullet>OTP verification</Bullet>
        <Bullet>Biometric verification (where applicable)</Bullet>
        <Bullet>Device authentication</Bullet>
        <Bullet>Security question validation</Bullet>
        <Bullet>Additional KYC verification where necessary</Bullet>
        <Paragraph>During this period, NEAT Micro Credit reserves the right to:</Paragraph>
        <Bullet>Temporarily restrict account access.</Bullet>
        <Bullet>Freeze all or part of the account balance.</Bullet>
        <Bullet>Delay account closure where suspicious activity is detected.</Bullet>
        <Bullet>Request additional documentation.</Bullet>
        <Bullet>
          Report suspected fraudulent activity to the appropriate regulatory or law
          enforcement authorities where required.
        </Bullet>

        <SectionTitle>Outstanding Obligations</SectionTitle>
        <Paragraph>
          Your account cannot be closed if any of the following exists:
        </Paragraph>
        <Bullet>Active loan balance</Bullet>
        <Bullet>Pending loan disbursement</Bullet>
        <Bullet>Pending withdrawal</Bullet>
        <Bullet>Pending transfer</Bullet>
        <Bullet>Pending savings withdrawal</Bullet>
        <Bullet>Failed transactions awaiting reconciliation</Bullet>
        <Bullet>Chargeback investigations</Bullet>
        <Bullet>Fraud investigation</Bullet>
        <Bullet>Regulatory restrictions</Bullet>
        <Bullet>Court order or legal restrictions</Bullet>
        <Paragraph>
          Where any of the above exists, the account closure request will remain pending
          until all obligations have been resolved.
        </Paragraph>

        <SectionTitle>Data Retention</SectionTitle>
        <Paragraph>
          Although your NEATPay account will be closed, NEAT Micro Credit is legally
          required to retain certain customer information and transaction records.
        </Paragraph>
        <Paragraph>
          This information may be retained for purposes including but not limited to:
        </Paragraph>
        <Bullet>Regulatory compliance</Bullet>
        <Bullet>CBN requirements</Bullet>
        <Bullet>Anti-Money Laundering (AML) compliance</Bullet>
        <Bullet>Counter Terrorism Financing (CTF) compliance</Bullet>
        <Bullet>Tax obligations</Bullet>
        <Bullet>Financial reporting</Bullet>
        <Bullet>Audit requirements</Bullet>
        <Bullet>Fraud prevention</Bullet>
        <Bullet>Legal proceedings</Bullet>
        <Bullet>Dispute resolution</Bullet>
        <Bullet>Internal risk management</Bullet>
        <Paragraph>
          Such records will be securely retained only for the period required by applicable
          laws and regulations and will not be used for purposes inconsistent with the NEAT
          Micro Credit Privacy Policy.
        </Paragraph>

        <SectionTitle>Important Notice</SectionTitle>
        <Paragraph>
          By submitting a request to close your NEATPay account, you acknowledge and agree
          that:
        </Paragraph>
        <Bullet>The account closure request is voluntary.</Bullet>
        <Bullet>All available funds have been withdrawn or transferred.</Bullet>
        <Bullet>Any outstanding obligations must be settled before closure.</Bullet>
        <Bullet>Certain information will continue to be retained as required by law.</Bullet>
        <Bullet>Account closure is irreversible once completed.</Bullet>
        <Bullet>
          A previously closed account may not be recoverable, and a new registration may be
          required to use NEATPay services again, subject to NEAT Micro Credit&rsquo;s
          onboarding requirements.
        </Bullet>
      </ScrollView>
    </SafeAreaView>
  );
}
