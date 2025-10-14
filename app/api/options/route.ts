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

// Fonction pour transformer les données PostgreSQL au format attendu par le frontend (format n8n)
function transformDataToN8nFormat(rows: any[]) {
  return rows.map(row => ({
    // Mapping PostgreSQL -> format n8n attendu par le frontend
    id: row.symbol, // Utiliser symbol comme id car c'est la clé primaire
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    Quotes: row.quotes,
    Symbol: row.symbol,
    Date: row.expiration_date, // expiration_date -> Date
    Strike_price: row.strike_price,
    bid_price: row.bid_price,
    ask_price: row.ask_price,
    bid_size: row.bid_size,
    ask_size: row.ask_size,
    net_change: row.net_change,
    settlement_price: row.settlement_price,
    open_interest: row.open_interest,
    is_option: row.is_option ? 1 : 0, // boolean -> 0/1
    is_weekly: row.is_weekly ? 1 : 0, // boolean -> 0/1
    last_close_price: row.last_close_price,
    open_price: row.open_price,
    high_price: row.high_price,
    low_price: row.low_price,
    nb_trades: row.nb_trades,
    volatility: row.volatility,
  }));
}

// GET: Récupérer les options avec expiration proche (par défaut : 90 prochains jours)
export async function GET(request: Request) {
  let client;

  try {
    // Récupérer le paramètre 'days' depuis l'URL (par défaut 90 jours)
    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '90');
    const exportAll = url.searchParams.get('export') === 'all';

    // Connexion à la base de données
    client = await pool.connect();

    const tableName = process.env.POSTGRES_TABLE || 'db_option';

    let query;
    let result;

    if (exportAll) {
      // Export ALL : récupérer TOUTES les données
      query = `
        SELECT * FROM ${tableName}
        ORDER BY expiration_date ASC, strike_price ASC
      `;
      result = await client.query(query);
    } else {
      // Récupérer uniquement les options avec expiration dans les X prochains jours
      query = `
        SELECT * FROM ${tableName}
        WHERE expiration_date >= CURRENT_DATE
        AND expiration_date <= CURRENT_DATE + INTERVAL '${days} days'
        ORDER BY expiration_date ASC, strike_price ASC
      `;
      result = await client.query(query);
    }

    // Transformer les données au format attendu par le frontend
    const transformedData = transformDataToN8nFormat(result.rows);

    // Retourner les données
    return NextResponse.json(transformedData);

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

// POST: Récupérer les options d'un symbole spécifique (gardé pour compatibilité)
export async function POST(request: Request) {
  let client;

  try {
    const body = await request.json();
    const { symbol } = body;

    if (!symbol) {
      return NextResponse.json(
        { success: false, error: 'Symbole manquant' },
        { status: 400 }
      );
    }

    // Connexion à la base de données
    client = await pool.connect();

    const tableName = process.env.POSTGRES_TABLE || 'db_option';

    // Requête SQL avec les vrais noms de colonnes PostgreSQL
    // Le symbole dans la DB commence par le code suivi d'un espace (ex: "BTCQ 251017C17.50")
    // Donc on cherche tous les symboles qui commencent par le symbole sélectionné suivi d'un espace
    // Cela évite que "BN" ne matche "BNS"
    const query = `
      SELECT * FROM ${tableName}
      WHERE symbol LIKE $1
      ORDER BY expiration_date ASC, strike_price ASC
    `;

    const result = await client.query(query, [`${symbol} %`]);

    // Transformer les données au format attendu par le frontend
    const transformedData = transformDataToN8nFormat(result.rows);

    // Retourner les données au même format que n8n
    return NextResponse.json(transformedData);

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
