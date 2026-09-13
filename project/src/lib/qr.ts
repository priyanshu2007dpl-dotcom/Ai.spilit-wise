import QRCode from 'qrcode';

/**
 * Generate a QR code data URL from a string (e.g., UPI payment string).
 */
export async function generateQRCode(data: string): Promise<string> {
  try {
    const qrDataUrl = await QRCode.toDataURL(data, {
      width: 300,
      margin: 2,
      color: {
        dark: '#482c20',
        light: '#fdfbf7',
      },
    });
    return qrDataUrl;
  } catch {
    return '';
  }
}

/**
 * Build a UPI payment string from a UPI ID, payee name, and amount.
 */
export function buildUpiString(upiId: string, payeeName: string, amount?: number): string {
  const params = new URLSearchParams();
  params.set('pa', upiId);
  params.set('pn', payeeName);
  if (amount && amount > 0) {
    params.set('am', amount.toFixed(2));
    params.set('cu', 'INR');
  }
  return `upi://pay?${params.toString()}`;
}
