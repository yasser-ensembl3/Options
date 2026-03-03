"""
MX Options Scraper - Version Finale Corrigée
Scrape toutes les options du site m-x.ca et les insère dans PostgreSQL
Historique jour par jour
"""
import asyncio
import httpx
from bs4 import BeautifulSoup
import json
from datetime import datetime
from typing import List, Dict, Any
import psycopg2
from psycopg2.extras import execute_batch

# =============================================================================
# Configuration
# =============================================================================

BASE_URL = "https://www.m-x.ca"
ETF_OPTIONS_URL = f"{BASE_URL}/en/trading/data/options-list#etf"

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "mondb_test",
    "user": "mac",
    "password": ""
}

MAX_CONCURRENT_REQUESTS = 10

# =============================================================================
# Fonctions de scraping
# =============================================================================

async def fetch_companies_list() -> List[Dict[str, str]]:
    """Récupère la liste de toutes les compagnies depuis la page principale"""
    print("=" * 80)
    print("DÉBUT DU SCRAPING MX OPTIONS")
    print("=" * 80)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        try:
            response = await client.get(ETF_OPTIONS_URL, timeout=30.0)
            response.raise_for_status()
            html = response.text
            
            print(f"✓ Page principale chargée ({len(html)} caractères)")
            
            soup = BeautifulSoup(html, 'html.parser')
            companies = []
            
            rows = soup.select('tbody tr')
            
            for row in rows:
                name_cell = row.select_one('td:first-child')
                link_cell = row.select_one('td:nth-child(2) a')
                
                if name_cell and link_cell:
                    companies.append({
                        'name': name_cell.get_text(strip=True),
                        'link': link_cell.get('href')
                    })
            
            print(f"✓ {len(companies)} compagnies trouvées\n")
            
            return companies
            
        except Exception as e:
            print(f"✗ Erreur lors du chargement de la page principale: {e}")
            return []

async def scrape_company_options(client: httpx.AsyncClient, company_name: str, link: str) -> List[Dict[str, Any]]:
    """Scrape toutes les options d'une compagnie"""
    url = f"{BASE_URL}{link}"
    
    try:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        html = response.text
        
        soup = BeautifulSoup(html, 'html.parser')
        parent_rows = soup.select('tr.parent[data-row]')
        
        options_data = []
        for row in parent_rows:
            data_row = row.get('data-row')
            if not data_row:
                continue
            
            parsed = json.loads(data_row)
            
            for option_type, option_data in [('call', parsed.get('call', {})), ('put', parsed.get('put', {}))]:
                if option_data:
                    is_option_value = option_data.get('is_option')
                    is_weekly_value = option_data.get('is_weekly')
                    
                    options_data.append({
                        'symbol': option_data.get('symbol'),
                        'quotes': option_type,
                        'expiration_date': option_data.get('expiry_date'),
                        'strike_price': option_data.get('strike_price'),
                        'bid_price': option_data.get('bid_price'),
                        'ask_price': option_data.get('ask_price'),
                        'last_close_price': option_data.get('last_close_price'),
                        'open_price': option_data.get('open_price'),
                        'high_price': option_data.get('high_price'),
                        'low_price': option_data.get('low_price'),
                        'net_change': option_data.get('net_change'),
                        'settlement_price': option_data.get('settlement_price'),
                        'volatility': option_data.get('volatility'),
                        'bid_size': option_data.get('bid_size'),
                        'ask_size': option_data.get('ask_size'),
                        'open_interest': option_data.get('open_interest'),
                        'nb_trades': option_data.get('nb_trades'),
                        'is_option': bool(is_option_value) if is_option_value is not None else None,
                        'is_weekly': bool(is_weekly_value) if is_weekly_value is not None else None,
                        'created_at': datetime.now(),
                        'scrape_date': datetime.now().date()
                    })
        
        return options_data
        
    except Exception as e:
        print(f"  ✗ Erreur pour {company_name}: {e}")
        return []

async def scrape_stock_price(client: httpx.AsyncClient, company_name: str, link: str) -> Dict[str, Any]:
    """Scrape le prix actuel du stock depuis la page d'options"""
    url = f"{BASE_URL}{link}"
    
    try:
        response = await client.get(url, timeout=30.0)
        response.raise_for_status()
        html = response.text
        
        soup = BeautifulSoup(html, 'html.parser')
        
        # Trouve le div avec class="quote-info"
        quote_info = soup.select_one('div.quote-info')
        
        if not quote_info:
            return None
        
        # Trouve les balises <b> dans les <li>
        lis = quote_info.find_all('li')
        
        last_price = None
        bid_price = None
        ask_price = None
        
        for li in lis:
            text = li.get_text()
            b_tag = li.find('b')
            
            if 'Last price:' in text and b_tag:
                last_price = b_tag.get_text(strip=True)
            elif 'Bid price:' in text and b_tag:
                bid_price = b_tag.get_text(strip=True)
            elif 'Ask price:' in text and b_tag:
                ask_price = b_tag.get_text(strip=True)
        
        # Convertit en float
        def to_float(s):
            if not s:
                return None
            try:
                return float(s.replace(',', ''))
            except:
                return None
        
        # Extrait le symbol depuis le <h2> de la page
        symbol = None
        h2 = soup.find('h2')
        if h2:
            h2_text = h2.get_text(strip=True)
            # Format: "AAV – Advantage Oil & Gas Ltd."
            if '–' in h2_text:
                symbol = h2_text.split('–')[0].strip()
            elif '-' in h2_text:
                symbol = h2_text.split('-')[0].strip()
        
        return {
            'symbol': symbol,
            'last_price': to_float(last_price),
            'bid_price': to_float(bid_price),
            'ask_price': to_float(ask_price),
            'scrape_date': datetime.now().date(),
            'created_at': datetime.now()
        }
        
    except Exception as e:
        return None

# =============================================================================
# Fonctions de base de données
# =============================================================================

def test_db_connection() -> bool:
    """Teste la connexion à la base de données"""
    print("=" * 80)
    print("VÉRIFICATION BASE DE DONNÉES")
    print("=" * 80)
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✓ Connexion PostgreSQL réussie")
        
        cursor.execute("""
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'db_option'
            );
        """)
        table_exists = cursor.fetchone()[0]
        
        if table_exists:
            cursor.execute("SELECT COUNT(*) FROM db_option;")
            count = cursor.fetchone()[0]
            print(f"✓ Table 'db_option' existe ({count} lignes actuelles)")
        else:
            print(f"✗ Table 'db_option' n'existe pas!")
            cursor.close()
            conn.close()
            return False
        
        cursor.close()
        conn.close()
        print()
        return True
        
    except Exception as e:
        print(f"✗ Erreur de connexion: {e}\n")
        return False

def insert_options_batch(options_data: List[Dict[str, Any]]) -> bool:
    """Insère un batch d'options dans la base de données"""
    if not options_data:
        return True
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        # Insertion avec gestion des doublons du même jour
        upsert_query = """
            INSERT INTO db_option (
                created_at, quotes, symbol, expiration_date, strike_price, 
                bid_price, ask_price, last_close_price, open_price, high_price, 
                low_price, net_change, settlement_price, volatility, 
                bid_size, ask_size, open_interest, nb_trades,
                is_option, is_weekly, scrape_date
            ) VALUES (
                %(created_at)s, %(quotes)s, %(symbol)s, %(expiration_date)s, %(strike_price)s, 
                %(bid_price)s, %(ask_price)s, %(last_close_price)s, %(open_price)s,
                %(high_price)s, %(low_price)s, %(net_change)s, %(settlement_price)s,
                %(volatility)s, %(bid_size)s, %(ask_size)s, %(open_interest)s,
                %(nb_trades)s, %(is_option)s, %(is_weekly)s, %(scrape_date)s
            )
            ON CONFLICT (symbol, scrape_date) 
            DO UPDATE SET
                created_at = EXCLUDED.created_at,
                quotes = EXCLUDED.quotes,
                expiration_date = EXCLUDED.expiration_date,
                strike_price = EXCLUDED.strike_price,
                bid_price = EXCLUDED.bid_price,
                ask_price = EXCLUDED.ask_price,
                last_close_price = EXCLUDED.last_close_price,
                open_price = EXCLUDED.open_price,
                high_price = EXCLUDED.high_price,
                low_price = EXCLUDED.low_price,
                net_change = EXCLUDED.net_change,
                settlement_price = EXCLUDED.settlement_price,
                volatility = EXCLUDED.volatility,
                bid_size = EXCLUDED.bid_size,
                ask_size = EXCLUDED.ask_size,
                open_interest = EXCLUDED.open_interest,
                nb_trades = EXCLUDED.nb_trades,
                is_option = EXCLUDED.is_option,
                is_weekly = EXCLUDED.is_weekly
        """
        
        execute_batch(cursor, upsert_query, options_data, page_size=100)
        conn.commit()
        
        cursor.execute("SELECT COUNT(*) FROM db_option;")
        total = cursor.fetchone()[0]
        
        print(f"    💾 {len(options_data)} lignes insérées | Total DB: {total}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"    ✗ Erreur d'insertion: {e}")
        return False

def insert_stock_prices_batch(prices_data: List[Dict[str, Any]]) -> bool:
    """Insère un batch de prix de stocks dans la base de données"""
    if not prices_data:
        return True
    
    try:
        conn = psycopg2.connect(**DB_CONFIG)
        cursor = conn.cursor()
        
        upsert_query = """
            INSERT INTO db_stock_price (
                symbol, last_price, bid_price, ask_price, scrape_date, created_at
            ) VALUES (
                %(symbol)s, %(last_price)s, %(bid_price)s, %(ask_price)s,
                %(scrape_date)s, %(created_at)s
            )
            ON CONFLICT (symbol, scrape_date) 
            DO UPDATE SET
                last_price = EXCLUDED.last_price,
                bid_price = EXCLUDED.bid_price,
                ask_price = EXCLUDED.ask_price,
                created_at = EXCLUDED.created_at
        """
        
        execute_batch(cursor, upsert_query, prices_data, page_size=100)
        conn.commit()
        
        cursor.execute("SELECT COUNT(*) FROM db_stock_price;")
        total = cursor.fetchone()[0]
        
        print(f"    💰 {len(prices_data)} prix insérés | Total DB: {total}")
        
        cursor.close()
        conn.close()
        return True
        
    except Exception as e:
        print(f"    ✗ Erreur d'insertion prix: {e}")
        return False

# =============================================================================
# Scraping et insertion progressive
# =============================================================================

async def scrape_and_insert_all(companies: List[Dict]) -> Dict[str, Any]:
    """Scrape toutes les compagnies (options + prix) et insère toutes les 10"""
    print("=" * 80)
    print("SCRAPING EN COURS (OPTIONS + PRIX)")
    print("=" * 80)
    
    total_companies = len(companies)
    total_options_scraped = 0
    total_prices_scraped = 0
    processed = 0
    errors = 0
    options_buffer = []
    prices_buffer = []
    
    start_time = datetime.now()
    
    async with httpx.AsyncClient(follow_redirects=True) as client:
        for i in range(0, total_companies, MAX_CONCURRENT_REQUESTS):
            scrape_batch = companies[i:i + MAX_CONCURRENT_REQUESTS]
            
            # Scrape options ET prix en parallèle
            options_tasks = [scrape_company_options(client, comp['name'], comp['link']) 
                           for comp in scrape_batch]
            prices_tasks = [scrape_stock_price(client, comp['name'], comp['link']) 
                          for comp in scrape_batch]
            
            all_tasks = options_tasks + prices_tasks
            results = await asyncio.gather(*all_tasks, return_exceptions=True)
            
            # Split results (première moitié = options, deuxième = prix)
            options_results = results[:len(scrape_batch)]
            prices_results = results[len(scrape_batch):]
            
            for j in range(len(scrape_batch)):
                processed += 1
                company = scrape_batch[j]
                options_result = options_results[j]
                price_result = prices_results[j]
                
                has_error = False
                
                # Process options
                if isinstance(options_result, Exception):
                    print(f"[{processed}/{total_companies}] ✗ {company['name']}: Erreur options")
                    has_error = True
                else:
                    total_options_scraped += len(options_result)
                    options_buffer.extend(options_result)
                
                # Process prix
                if isinstance(price_result, Exception) or price_result is None:
                    if not has_error:
                        print(f"[{processed}/{total_companies}] ⚠ {company['name']}: {len(options_result) if not isinstance(options_result, Exception) else 0} options, prix manquant")
                else:
                    total_prices_scraped += 1
                    prices_buffer.append(price_result)
                    if not has_error:
                        print(f"[{processed}/{total_companies}] ✓ {company['name']}: {len(options_result)} options + prix")
                
                if has_error:
                    errors += 1
            
            # Insère toutes les 10 compagnies
            if processed % 10 == 0:
                if options_buffer:
                    insert_options_batch(options_buffer)
                    options_buffer = []
                if prices_buffer:
                    insert_stock_prices_batch(prices_buffer)
                    prices_buffer = []
            
            if i + MAX_CONCURRENT_REQUESTS < total_companies:
                await asyncio.sleep(0.5)
    
    # Insère le reste
    if options_buffer:
        print(f"\nInsertion dernier batch options...")
        insert_options_batch(options_buffer)
    if prices_buffer:
        print(f"Insertion dernier batch prix...")
        insert_stock_prices_batch(prices_buffer)
    
    elapsed = (datetime.now() - start_time).total_seconds()
    
    return {
        'elapsed': elapsed,
        'processed': processed,
        'errors': errors,
        'total_options_scraped': total_options_scraped,
        'total_prices_scraped': total_prices_scraped
    }

# =============================================================================
# Main
# =============================================================================

async def main():
    """Point d'entrée principal"""
    overall_start = datetime.now()
    
    if not test_db_connection():
        print("Arrêt du script - problème de connexion DB")
        return
    
    companies = await fetch_companies_list()
    if not companies:
        print("Arrêt du script - aucune compagnie trouvée")
        return
    
    stats = await scrape_and_insert_all(companies)
    
    overall_elapsed = (datetime.now() - overall_start).total_seconds()
    
    print("\n" + "=" * 80)
    print("RÉSUMÉ FINAL")
    print("=" * 80)
    print(f"Temps total d'exécution: {overall_elapsed:.2f} secondes")
    print(f"Compagnies traitées: {stats['processed'] - stats['errors']}/{len(companies)}")
    print(f"Erreurs: {stats['errors']}")
    print(f"Options scrapées: {stats['total_options_scraped']}")
    print(f"Prix scrapés: {stats['total_prices_scraped']}")
    print(f"Statut: {'✓ SUCCÈS' if stats['errors'] == 0 else '⚠ PARTIEL'}")
    print(f"Timestamp fin: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    asyncio.run(main())