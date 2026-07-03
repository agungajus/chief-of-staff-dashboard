import { NextResponse } from 'next/server';
import { XeroClient } from 'xero-node';
import { cookies } from 'next/headers';

const xero = new XeroClient({
  clientId: process.env.XERO_CLIENT_ID,
  clientSecret: process.env.XERO_CLIENT_SECRET,
  redirectUris: ['http://localhost:3000/api/xero/callback'],
  scopes: 'openid profile email accounting.settings.read accounting.invoices.read offline_access'.split(' ')
});

export async function GET(request) {
  try {
    const url = request.url;
    
    // Tukar kode jadi Token Set asli
    const tokenSet = await xero.apiCallback(url);
    
    // Ambil Tenant ID aktif
    await xero.updateTenants();
    const activeTenantId = xero.tenants[0].tenantId;

    // SIMPAN KE COOKIE (Step 1)
    const cookieStore = await cookies();
    
    // Token disimpan dalam bentuk string JSON, berlaku aman di sisi server (HTTP-only)
    cookieStore.set('xero_token', JSON.stringify(tokenSet), { httpOnly: true, secure: process.env.NODE_ENV === 'production' });
    cookieStore.set('xero_tenant_id', activeTenantId, { httpOnly: true, secure: process.env.NODE_ENV === 'production' });

    // Redirect BERSIH tanpa embel-embel data di URL
    return NextResponse.redirect(new URL('/', request.url));
    
  } catch (error) {
    console.error("Xero Callback Error:", error);
    return NextResponse.json({ error: 'Gagal memproses otentikasi Xero' }, { status: 500 });
  }
}