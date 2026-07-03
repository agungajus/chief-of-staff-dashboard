import { NextResponse } from 'next/server';
import { XeroClient } from 'xero-node';
import { cookies } from 'next/headers';

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: ['http://localhost:3000/api/xero/callback'],
  scopes: 'openid profile email accounting.settings.read accounting.invoices.read offline_access'.split(' ')
});

export async function GET() {
  try {
    const cookieStore = await cookies();
    const tokenCookie = cookieStore.get('xero_token');
    const tenantIdCookie = cookieStore.get('xero_tenant_id');

    // Jika user belum login Xero, kembalikan status false tanpa error
    if (!tokenCookie || !tenantIdCookie) {
      return NextResponse.json({ connected: false });
    }

    let tokenSet = JSON.parse(tokenCookie.value);
    const tenantId = tenantIdCookie.value;

    xero.setTokenSet(tokenSet);

    // STEP 2: Fitur Auto-Refresh Token jika expired
    if (tokenSet.expires_at && (tokenSet.expires_at * 1000 < Date.now())) {
      console.log("🔄 Token Xero expired, merefresh otomatis...");
      tokenSet = await xero.refreshToken();
      // Simpan token baru hasil refresh ke cookie lagi
      cookieStore.set('xero_token', JSON.stringify(tokenSet), { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    }

    // Tarik data Bank asli
    const bankAccounts = await xero.accountingApi.getAccounts(tenantId, null, 'Type=="BANK"');
    let totalCash = 0;
    (bankAccounts.body.accounts || []).forEach(acc => {
      if (acc.currentBalance) totalCash += Number(acc.currentBalance);
    });

    // Tarik data Invoice asli
    const invoices = await xero.accountingApi.getInvoices(tenantId, null, 'Status=="AUTHORISED"');
    const today = new Date();
    const overdueCount = (invoices.body.invoices || []).filter(inv => {
      return inv.dueDate && new Date(inv.dueDate) < today;
    }).length;

    return NextResponse.json({
      connected: true,
      cash: `$${totalCash.toLocaleString()}`,
      invoicesOverdue: overdueCount
    });

  } catch (error) {
    console.error("Xero Data Fetch Error:", error);
    return NextResponse.json({ connected: false, error: 'Gagal memuat data Xero asli' }, { status: 500 });
  }
}