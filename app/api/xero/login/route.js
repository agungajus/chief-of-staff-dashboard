import { NextResponse } from 'next/server';
import { XeroClient } from 'xero-node';

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: ['https://chief-of-staff-dashboard-jjck.vercel.app/api/xero/callback'],
  scopes: 'openid profile email accounting.settings.read accounting.invoices.read offline_access'.split(' ')
});

export async function GET() {
  try {
    const consentUrl = await xero.buildConsentUrl();
    return NextResponse.redirect(consentUrl);
  } catch (error) {
    console.error("Xero Login Error:", error);
    return NextResponse.json({ error: 'Gagal membuat URL login' }, { status: 500 });
  }
}