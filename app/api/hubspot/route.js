import { NextResponse } from 'next/server';

export async function GET() {
  // Ambil token dari brankas .env
  const token = process.env.HUBSPOT_ACCESS_TOKEN;

  try {
    // Ketuk pintu API HubSpot buat minta data Deals (Nama, Amount, Stage, dan Create Date)
    const response = await fetch('https://api.hubapi.com/crm/v3/objects/deals?properties=dealname,amount,dealstage,createdate', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();
    
    // Kembalikan datanya ke frontend kita
    return NextResponse.json(data);
    
  } catch (error) {
    console.error("Error fetching HubSpot deals:", error);
    return NextResponse.json({ error: 'Gagal narik data Deals' }, { status: 500 });
  }
}