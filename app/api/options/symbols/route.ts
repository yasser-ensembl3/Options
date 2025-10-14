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

// GET: Récupérer la liste unique des symboles disponibles
export async function GET(request: Request) {
  let client;

  try {
    // Connexion à la base de données
    client = await pool.connect();

    const tableName = process.env.POSTGRES_TABLE || 'db_option';

    // Requête pour récupérer les symboles uniques (juste le code, pas tout le symbole)
    const query = `
      SELECT DISTINCT
        SPLIT_PART(symbol, ' ', 1) as symbol_code
      FROM ${tableName}
      WHERE symbol IS NOT NULL
      ORDER BY symbol_code ASC
    `;

    const result = await client.query(query);

    // Extraire les codes de symboles
    const symbols = result.rows.map(row => row.symbol_code);

    // Retourner la liste des symboles
    return NextResponse.json(symbols);

  } catch (error) {
    console.error('Erreur PostgreSQL:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Erreur lors de la récupération des symboles',
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
