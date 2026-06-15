import { Text, View } from 'react-native';

export interface TransactionSummary {
  provider: string;
  phone: string;
  /** Data plan name — only shown for data purchases. */
  plan?: string;
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
  amount,
  date,
}: TransactionSummary) {
  const rows = [
    { label: 'Service Provider', value: provider },
    { label: 'Phone Number', value: phone },
    ...(plan ? [{ label: 'Data plan', value: plan }] : []),
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
