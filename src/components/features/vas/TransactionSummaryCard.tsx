import { Switch, Text, View } from 'react-native';

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
  /** Meter number — only shown for electricity purchases. */
  meter?: string;
  /** Meter type ("Prepaid"/"Postpaid") — only shown for electricity. */
  meterType?: string;
  amount: string;
  date: string;
  /**
   * Formatted cashback that would be applied, e.g. "₦4.00". The row is omitted
   * unless this and `onToggleCashback` are both supplied — read-only callers
   * (the result screen) pass neither.
   */
  cashbackLabel?: string;
  cashbackOn?: boolean;
  onToggleCashback?: (on: boolean) => void;
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
  meter,
  meterType,
  amount,
  date,
  cashbackLabel,
  cashbackOn,
  onToggleCashback,
}: TransactionSummary) {
  const showCashback = !!cashbackLabel && !!onToggleCashback;

  const rows = [
    { label: 'Service Provider', value: provider },
    ...(meter ? [{ label: 'Meter Number', value: meter }] : []),
    ...(meterType ? [{ label: 'Type', value: meterType }] : []),
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
          isLast={!showCashback && i === rows.length - 1}
        />
      ))}

      {/* Its own node rather than a `rows` entry — SummaryRow renders text only. */}
      {showCashback ? (
        <View className="flex-row justify-between items-center py-[14px]">
          <Text className="text-[13px] text-[#6B7280]">
            Use Cashback ({cashbackLabel})
          </Text>
          <View className="flex-row items-center gap-2">
            <Text
              className={`text-sm ${
                cashbackOn
                  ? 'text-[#16A34A] font-semibold'
                  : 'text-[#9CA3AF] line-through'
              }`}
            >
              -{cashbackLabel}
            </Text>
            <Switch
              value={!!cashbackOn}
              onValueChange={onToggleCashback}
              trackColor={{ false: '#E5E7EB', true: '#032252' }}
              thumbColor="#fff"
              ios_backgroundColor="#E5E7EB"
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
