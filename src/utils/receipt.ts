import * as Sharing from 'expo-sharing';

/**
 * Wrap a captured receipt image (a PNG data-URI from react-native-view-shot)
 * in minimal HTML so expo-print can render it to a PDF that is pixel-identical
 * to the on-screen receipt — logo included. The on-screen card is the single
 * source of truth; we never re-implement the receipt layout in HTML.
 */
export function buildReceiptHtml(imageDataUri: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #fff; padding: 24px; }
    img { display: block; width: 100%; max-width: 480px; margin: 0 auto; }
  </style>
</head>
<body>
  <img src="${imageDataUri}" />
</body>
</html>`;
}

export async function shareFile(uri: string): Promise<void> {
  if (!(await Sharing.isAvailableAsync())) return;
  await Sharing.shareAsync(uri);
}
