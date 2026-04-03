import * as Sharing from 'expo-sharing';

export interface ReceiptData {
  sender: string;
  amount: string;
  recipientAccount: string;
  recipientName: string;
  bankName: string;
  reference: string;
  date: string;
  description: string;
}

export function buildReceiptHtml(data: ReceiptData): string {
  const rows = [
    { label: 'Sender', value: data.sender },
    { label: 'Amount', value: data.amount },
    { label: 'Recipient Account', value: data.recipientAccount },
    { label: 'Recipient Name', value: data.recipientName },
    ...(data.bankName ? [{ label: 'Bank Name', value: data.bankName }] : []),
    { label: 'Reference', value: data.reference },
    { label: 'Date', value: data.date },
  ];

  const rowsHtml = rows
    .map(
      (row, i) => `
      <tr>
        <td style="padding: 14px 0; color: #6B7280; font-size: 13px; ${
          i < rows.length - 1 ? 'border-bottom: 1px solid #F3F4F6;' : ''
        }">${row.label}</td>
        <td style="padding: 14px 0; text-align: right; font-weight: 600; font-size: 14px; color: #1A1A1A; ${
          i < rows.length - 1 ? 'border-bottom: 1px solid #F3F4F6;' : ''
        }">${row.value}</td>
      </tr>`,
    )
    .join('');

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #fff;
      padding: 40px 20px;
    }
    .container {
      max-width: 500px;
      margin: 0 auto;
    }
    .header {
      text-align: center;
      margin-bottom: 32px;
    }
    .brand {
      font-size: 18px;
      font-weight: 700;
      color: #472FF8;
      margin-bottom: 24px;
    }
    .success-icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: #16A34A;
      margin: 0 auto 16px;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .checkmark {
      color: #fff;
      font-size: 28px;
      line-height: 1;
    }
    .title {
      font-size: 22px;
      font-weight: 700;
      color: #1A1A1A;
      margin-bottom: 8px;
    }
    .description {
      font-size: 13px;
      color: #6B7280;
      line-height: 1.5;
    }
    .summary {
      border: 1px solid #E5E7EB;
      border-radius: 14px;
      padding: 0 16px;
      margin-top: 24px;
    }
    .summary table {
      width: 100%;
      border-collapse: collapse;
    }
    .footer {
      text-align: center;
      margin-top: 32px;
      font-size: 12px;
      color: #9CA3AF;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="brand">NeatPay</div>
      <div class="success-icon">
        <span class="checkmark">&#10003;</span>
      </div>
      <div class="title">Transaction Successful</div>
      <div class="description">${data.description}</div>
    </div>

    <div class="summary">
      <table>${rowsHtml}</table>
    </div>

    <div class="footer">NeatPay &middot; ${data.date}</div>
  </div>
</body>
</html>`;
}

export async function shareFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri);
}
