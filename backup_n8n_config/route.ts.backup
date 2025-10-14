import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { symbol } = body;

    // Construire l'URL avec le symbole en paramètre de query
    const url = new URL('https://n8n.virtuamada.com/webhook/f6645a25-ad42-4d85-92e9-f2301bce649d');

    if (symbol) {
      url.searchParams.append('symbol', symbol);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Erreur lors du scraping:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors du scraping' },
      { status: 500 }
    );
  }
}
