import { NextResponse } from 'next/server';
import { Pool } from 'pg';

// Configuration de la connexion PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'mac',
  password: process.env.POSTGRES_PASSWORD || '',
  database: process.env.POSTGRES_DB || 'mondb_test',
});

// GET: Récupérer le prix de l'action pour un symbole donné
export async function GET(request: Request) {
  let client;

  try {
    const url = new URL(request.url);
    const symbol = url.searchParams.get('symbol');

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbole manquant' },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    client = await pool.connect();

    const tableName = 'db_stock_price';

    // Récupérer le prix le plus récent pour ce symbole (basé sur scrape_date)
    const query = `
      SELECT
        symbol,
        last_price,
        bid_price,
        ask_price,
        scrape_date,
        created_at
      FROM ${tableName}
      WHERE symbol = $1
      ORDER BY scrape_date DESC, created_at DESC
      LIMIT 1
    `;

    const result = await client.query(query, [symbol]);

    if (result.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Aucun prix trouvé pour ce symbole' },
        { status: 404 }
      );
    }

    // Retourner les données
    return NextResponse.json({
      success: true,
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Erreur PostgreSQL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération du prix',
        details: error instanceof Error ? error.message : 'Erreur inconnue'
      },
      { status: 500 }
    );
  } finally {
    // Libérer la connexion
    if (client) {
      client.release();
    }
  }
}
