import { Image, Text, View } from 'react-native';

import { DetailRow } from '@/components/features/transaction/DetailRow';

export interface ReceiptRow {
  label: string;
  value: string;
  valueColor?: string;
}

/**
 * The shared receipt card — navy masthead, amount block, detail rows, support
 * footer. Rendered on screen in the transaction receipt screen and off-screen
 * as the ViewShot capture source after a transfer, so both the PNG and the PDF
 * come from this one layout.
 *
 * It exists as a component because the two screens each had their own copy and
 * a redesign landed on only one of them.
 */
export function ReceiptCard({
  amount,
  statusLabel,
  date,
  rows,
}: {
  /** Preformatted amount, e.g. "₦25,000,000.00". */
  amount: string;
  statusLabel: string;
  /** Preformatted date/time string. */
  date: string;
  rows: ReceiptRow[];
}): React.JSX.Element {
  return (
    // overflow-hidden so the navy band takes the card's rounded corners
    <View className="bg-white rounded-[16px] overflow-hidden">
      {/* Navy masthead: centred logo over a gold rule */}
      <View className="bg-[#032252] items-center py-5">
        <Image
          source={require('../../../../assets/images/welcome/NeatPayLogo.png')}
          className="w-28 h-9"
          resizeMode="contain"
        />
      </View>
      <View className="h-[3px] bg-[#F9B700]" />

      <View className="px-5 pt-6 pb-6">
        <Text className="text-[17px] font-bold text-[#032252] text-center">
          Transaction Receipt
        </Text>

        <Text className="text-[26px] font-bold text-[#032252] text-center mt-3">
          {amount}
        </Text>
        <Text className="text-[13px] text-[#6B7280] text-center mt-1">
          {statusLabel}
        </Text>
        <Text className="text-[12px] text-[#9CA3AF] text-center mt-1">
          {date}
        </Text>

        <View className="border-b border-[#EEF1F6] my-4" />

        {rows.map((row, i) => (
          <DetailRow
            key={row.label}
            label={row.label}
            value={row.value}
            valueColor={row.valueColor}
            isLast={i === rows.length - 1}
          />
        ))}

        {/* Support footer */}
        <View className="border-t border-[#EEF1F6] mt-4 pt-4">
          <Text className="text-[11px] leading-[17px] text-[#6B7280] text-center">
            Thank you for choosing NEATPay. If you experience any issues with
            your transaction, please contact our support team via{' '}
            <Text className="font-semibold text-[#032252]">
              customerservice@neatmicrocredit.com.ng
            </Text>{' '}
            or call{' '}
            <Text className="font-semibold text-[#032252]">+2347070192526</Text>.
          </Text>
        </View>
      </View>
    </View>
  );
}
