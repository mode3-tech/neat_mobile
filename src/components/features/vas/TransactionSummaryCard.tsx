import { Text, View } from 'react-native';

export interface TransactionSummary {
  provider: string;
  /** Recipient phone — shown for airtime/data purchases. */
  phone?: string;
  /** Data plan name — only shown for data purchases. */
  plan?: string;
  /** Smartcard number — only shown for cable purchases. */
  smartcard?: string;
  /** Cable package name — only shown for cable purchases. */
  packageName?: string;
  /** Number of months — only shown for cable purchases. */
  months?: string;
  amount: string;
  date: string;
}

function SummaryRow({
  label,
  value,
  isLast,
}: {
  label: string;
  value: string;
  isLast?: boolean;
}) {
  return (
    <View
      className={`flex-row justify-between items-center py-[14px] ${
        !isLast ? 'border-b border-[#F3F4F6]' : ''
      }`}
    >
      <Text className="text-[13px] text-[#6B7280]">{label}</Text>
      <Text className="text-sm font-semibold text-[#1A1A1A]">{value}</Text>
    </View>
  );
}

export default function TransactionSummaryCard({
  provider,
  phone,
  plan,
  smartcard,
  packageName,
  months,
  amount,
  date,
}: TransactionSummary) {
  const rows = [
    { label: 'Service Provider', value: provider },
    ...(phone ? [{ label: 'Phone Number', value: phone }] : []),
    ...(smartcard ? [{ label: 'Smartcard Number', value: smartcard }] : []),
    ...(plan ? [{ label: 'Data plan', value: plan }] : []),
    ...(packageName ? [{ label: 'Package', value: packageName }] : []),
    ...(months ? [{ label: 'Number of Months', value: months }] : []),
    { label: 'Amount', value: amount },
    { label: 'Transaction Date', value: date },
  ];

  return (
    <View className="bg-[#F9FAFB] rounded-[14px] px-4">
      {rows.map((row, i) => (
        <SummaryRow
          key={row.label}
          label={row.label}
          value={row.value}
          isLast={i === rows.length - 1}
        />
      ))}
    </View>
  );
}
