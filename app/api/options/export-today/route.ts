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

// GET: Récupérer toutes les options créées aujourd'hui
export async function GET(request: Request) {
  let client;

  try {
    // Connexion à la base de données
    client = await pool.connect();

    const tableName = process.env.POSTGRES_TABLE || 'db_option';

    // Requête pour récupérer toutes les options où created_at = aujourd'hui
    const query = `
      SELECT * FROM ${tableName}
      WHERE DATE(created_at) = CURRENT_DATE
      ORDER BY symbol ASC, expiration_date ASC, strike_price ASC
    `;

    const result = await client.query(query);

    // Retourner les données brutes (format PostgreSQL)
    return NextResponse.json(result.rows);

  } catch (error) {
    console.error('Erreur PostgreSQL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des données',
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
