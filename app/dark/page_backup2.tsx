'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import axios from 'axios';
import { OptionsTable } from '@/components/OptionsTable';
import { DataFilters } from '@/components/DataFilters';
import { AIAnalysis } from '@/components/AIAnalysis';

interface SearchHistory {
  id: string;
  symbol: string;
  data: any[];
  timestamp: string;
}

export default function Home() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');

  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const [filters, setFilters] = useState({
    quotes: '',
    minStrike: '',
    maxStrike: '',
    minVolatility: '',
    maxVolatility: '',
    isWeekly: '',
    minDate: '',
    maxDate: '',
  });
  const [sortBy, setSortBy] = useState<string>('Date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const symbolsData: { [key: string]: string } = {
    'AAV': 'AAV - Advantage Energy Ltd',
    'ABX': 'ABX - Barrick Gold Corp',
    'AC': 'AC - Air Canada',
    'ACB': 'ACB - Aurora Cannabis Inc',
    'ACO': 'ACO - Atco Ltd',
    'ACQ': 'ACQ - Autocanada Inc',
    'AD': 'AD - Alaris Equity Partners Income Trust',
    'AEM': 'AEM - Agnico Eagle Mines Ltd',
    'AFN': 'AFN - Ag Growth International Inc',
    'AG': 'AG - First Majestic Silver Corp',
    'AGI': 'AGI - Alamos Gold Inc',
    'AI': 'AI - Atrium Mortgage Investment Corp',
    'AIF': 'AIF - Altus Group Ltd',
    'ALA': 'ALA - Altagas Ltd',
    'AMZN': 'AMZN - Amazon.com Inc',
    'AMD': 'AMD - Advanced Micro Devices Inc',
    'AAPL': 'AAPL - Apple Inc',
    'AP': 'AP - Allied Properties Reit',
    'AQN': 'AQN - Algonquin Power & Utilities Corp',
    'ARE': 'ARE - Aecon Group Inc',
    'ARX': 'ARX - Arc Resources Ltd',
    'ASTL': 'ASTL - Algoma Steel Group Inc',
    'ATD': 'ATD - Alimentation Couche-Tard Inc',
    'ATH': 'ATH - Athabasca Oil Corp',
    'ATRL': 'ATRL - Aeterna Zentaris Inc',
    'ATS': 'ATS - ATS Corp',
    'ATZ': 'ATZ - Aritzia Inc',
    'AX': 'AX - Artis Reit',
    'AYA': 'AYA - Aya Gold & Silver Inc',
    'BAM': 'BAM - Brookfield Asset Management Ltd',
    'BB': 'BB - Blackberry Ltd',
    'BBD': 'BBD - Bombardier Inc',
    'BCE': 'BCE - BCE Inc',
    'BDGI': 'BDGI - Badger Infrastructure Solutions Ltd',
    'BEI': 'BEI - Bellring Brands Inc',
    'BEP': 'BEP - Brookfield Renewable Partners L.P.',
    'BEPC': 'BEPC - Brookfield Renewable Corp',
    'BHC': 'BHC - Bausch Health Companies Inc',
    'BIP': 'BIP - Brookfield Infrastructure Partners L.P.',
    'BIR': 'BIR - Birchcliff Energy Ltd',
    'BITF': 'BITF - Bitfarms Ltd',
    'BLX': 'BLX - Boralex Inc',
    'BMO': 'BMO - Bank Of Montreal',
    'BN': 'BN - Brookfield Corp',
    'BNS': 'BNS - Bank Of Nova Scotia',
    'BRK': 'BRK - Berkshire Hathaway Inc',
    'BTCC': 'BTCC - Purpose Bitcoin ETF',
    'BTCQ': 'BTCQ - 3iq Coinshares Bitcoin ETF',
    'BTCX': 'BTCX - CI Galaxy Bitcoin ETF',
    'BTE': 'BTE - Baytex Energy Corp',
    'BTO': 'BTO - B2gold Corp',
    'CAE': 'CAE - CAE Inc',
    'CAR': 'CAR - Canadian Apt Properties Reit',
    'CAS': 'CAS - Cascades Inc',
    'CCA': 'CCA - Cogeco Communications Inc',
    'CCL': 'CCL - Carnival Corp',
    'CCO': 'CCO - Cameco Corp',
    'CF': 'CF - Canaccord Genuity Group Inc',
    'CFP': 'CFP - Canfor Corp',
    'CG': 'CG - Centerra Gold Inc',
    'CHE': 'CHE - Chemtrade Logistics Income Fund',
    'CGX': 'CGX - Cineplex Inc',
    'CHP': 'CHP - Choice Properties Reit',
    'CIA': 'CIA - Champion Iron Ltd',
    'CJ': 'CJ - Cardinal Energy Ltd',
    'CJT': 'CJT - Cargojet Inc',
    'CLS': 'CLS - Celestica Inc',
    'CM': 'CM - Canadian Imperial Bank Of Commerce',
    'CMG': 'CMG - Computer Modelling Group Ltd',
    'CNDX': 'CNDX - Ishares Core S&P U.S. Total Market Index ETF',
    'CNL': 'CNL - Collective Mining Ltd',
    'CNQ': 'CNQ - Canadian Natural Resources Ltd',
    'CNR': 'CNR - Canadian National Railway Co',
    'COST': 'COST - Costco Wholesale Corp',
    'CP': 'CP - Canadian Pacific Kansas City Ltd',
    'CPX': 'CPX - Capital Power Corp',
    'CRON': 'CRON - Cronos Group Inc',
    'CRR': 'CRR - Crew Energy Inc',
    'CS': 'CS - Capstone Copper Corp',
    'CSH': 'CSH - Chartwell Retirement Residences',
    'CTC': 'CTC - Canadian Tire Corp Ltd',
    'CU': 'CU - Canadian Utilities Ltd',
    'CVE': 'CVE - Cenovus Energy Inc',
    'CVO': 'CVO - Coveo Solutions Inc',
    'CWB1': 'CWB1 - Canadian Western Bank',
    'D': 'D - Dominion Energy Inc',
    'DFY': 'DFY - Definity Financial Corp',
    'DII': 'DII - Dorel Industries Inc',
    'DIR': 'DIR - Dream Industrial Reit',
    'DND': 'DND - Dye & Durham Ltd',
    'DOL': 'DOL - Dollarama Inc',
    'DOO': 'DOO - BRP Inc',
    'DPM': 'DPM - Dundee Precious Metals Inc',
    'DSG': 'DSG - Descartes Systems Group Inc',
    'EBIT': 'EBIT - Evolve Bitcoin ETF',
    'ECN': 'ECN - ECN Capital Corp',
    'EDR': 'EDR - Endeavour Silver Corp',
    'EDV': 'EDV - Endeavour Mining Corp',
    'EFN': 'EFN - Element Fleet Management Corp',
    'EFR': 'EFR - Energy Fuels Inc',
    'ELD': 'ELD - Eldorado Gold Corp',
    'EMA': 'EMA - Emera Inc',
    'EMP': 'EMP - Empire Co Ltd',
    'ENB': 'ENB - Enbridge Inc',
    'EQB': 'EQB - Equitable Group Inc',
    'EQX': 'EQX - Equinox Gold Corp',
    'ERO': 'ERO - Ero Copper Corp',
    'ETHH': 'ETHH - Purpose Ether ETF',
    'ETHQ': 'ETHQ - 3iq Coinshares Ether ETF',
    'ETHR': 'ETHR - Evolve Ether ETF',
    'ETHX': 'ETHX - CI Galaxy Ethereum ETF',
    'EXE': 'EXE - Extendicare Inc',
    'FCR': 'FCR - First Quantum Minerals Ltd',
    'FEC': 'FEC - Frontera Energy Corp',
    'FM': 'FM - First Quantum Minerals Ltd',
    'FNV': 'FNV - Franco-Nevada Corp',
    'FOM': 'FOM - Foran Mining Corp',
    'FRU': 'FRU - Freehold Royalties Ltd',
    'FSZ': 'FSZ - Fiera Capital Corp',
    'FTT': 'FTT - Finning International Inc',
    'FTS': 'FTS - Fortis Inc',
    'FVI': 'FVI - Fortuna Silver Mines Inc',
    'GDXD': 'GDXD - Horizons Gold Yield ETF',
    'GDXU': 'GDXU - Horizons Gold Producers ETF',
    'GEI': 'GEI - Gibson Energy Inc',
    'GFL': 'GFL - GFL Environmental Inc',
    'GIB': 'GIB - CGI Inc',
    'GIL': 'GIL - Gildan Activewear Inc',
    'GLXY': 'GLXY - Galaxy Digital Holdings Ltd',
    'GMIN': 'GMIN - Gmin - Garmin Ltd',
    'GOOG': 'GOOG - Alphabet Inc',
    'GOOS': 'GOOS - Canada Goose Holdings Inc',
    'GRT': 'GRT - Granite Reit',
    'GWO': 'GWO - Great-West Lifeco Inc',
    'H': 'H - Hydro One Ltd',
    'HBNK': 'HBNK - Horizons Canadian Bank Equal Weight ETF',
    'HBM': 'HBM - Hudbay Minerals Inc',
    'HMMJ': 'HMMJ - Horizons Marijuana Life Sciences Index ETF',
    'HND': 'HND - Horizons Natural Gas Bear ETF',
    'HNU': 'HNU - Horizons Natural Gas Bull ETF',
    'HOD': 'HOD - Horizons Crude Oil Bear ETF',
    'HPR': 'HPR - Horizons Active Cdn Preferred Share ETF',
    'HUT': 'HUT - Hut 8 Mining Corp',
    'HWX': 'HWX - Headwater Exploration Inc',
    'HXQ': 'HXQ - Horizons Nasdaq-100 Index ETF',
    'HXT': 'HXT - Horizons S&P/TSX 60 Index ETF',
    'IAG': 'IAG - Iamgold Corp',
    'IFC': 'IFC - Intact Financial Corp',
    'IFP': 'IFP - Interfor Corp',
    'IGM': 'IGM - IGM Financial Inc',
    'IMG': 'IMG - Iamgold Corp',
    'IMO': 'IMO - Imperial Oil Ltd',
    'IVN': 'IVN - Ivanhoe Mines Ltd',
    'K': 'K - Kellanova',
    'KEY': 'KEY - Keyera Corp',
    'KILO': 'KILO - KILO Gold Corp',
    'KNT': 'KNT - K92 Mining Inc',
    'KXS': 'KXS - Kinaxis Inc',
    'L': 'L - Loblaw Companies Ltd',
    'LAC': 'LAC - Lithium Americas Corp',
    'LB': 'LB - Laurentian Bank Of Canada',
    'LIF': 'LIF - Labrador Iron Ore Royalty Corp',
    'LNR': 'LNR - Linamar Corp',
    'LSPD': 'LSPD - Lightspeed Commerce Inc',
    'LUG': 'LUG - Lundin Gold Inc',
    'LUG1': 'LUG1 - Lundin Mining Corp',
    'LUN': 'LUN - Lundin Mining Corp',
    'MATR': 'MATR - Mattel Inc',
    'MDA': 'MDA - MDA Ltd',
    'MDI': 'MDI - Major Drilling Group International Inc',
    'MEG': 'MEG - MEG Energy Corp',
    'META': 'META - Meta Platforms Inc',
    'MFC': 'MFC - Manulife Financial Corp',
    'MFI1': 'MFI1 - Maple Leaf Foods Inc',
    'MG': 'MG - Magna International Inc',
    'MRE': 'MRE - Martinrea International Inc',
    'MRU': 'MRU - Metro Inc',
    'MSFT': 'MSFT - Microsoft Corp',
    'MTL': 'MTL - Mullen Group Ltd',
    'MX': 'MX - Methanex Corp',
    'NA': 'NA - National Bank Of Canada',
    'NG': 'NG - Novagold Resources Inc',
    'NFI': 'NFI - NFI Group Inc',
    'NGT': 'NGT - Newmont Corp',
    'NPI': 'NPI - Northland Power Inc',
    'NTR': 'NTR - Nutrien Ltd',
    'NVA': 'NVA - Nuvista Energy Ltd',
    'NVDA': 'NVDA - NVIDIA Corp',
    'NWC': 'NWC - North West Co Inc',
    'NWH': 'NWH - Northwest Healthcare Properties Reit',
    'NXE': 'NXE - NexGen Energy Ltd',
    'OBE': 'OBE - Obsidian Energy Ltd',
    'OGC': 'OGC - Oceanagold Corp',
    'OLA': 'OLA - Orla Mining Ltd',
    'ONEX': 'ONEX - Onex Corp',
    'OR': 'OR - Osisko Gold Royalties Ltd',
    'OTEX': 'OTEX - Open Text Corp',
    'OVV': 'OVV - Ovintiv Inc',
    'PAAS': 'PAAS - Pan American Silver Corp',
    'PAAS1': 'PAAS1 - Pan American Silver Corp',
    'PAAS2': 'PAAS2 - Pan American Silver Corp',
    'PBH': 'PBH - Premium Brands Holdings Corp',
    'PD': 'PD - Precision Drilling Corp',
    'PET': 'PET - Perpetual Energy Inc',
    'PEY': 'PEY - Peyto Exploration & Development Corp',
    'PHYS': 'PHYS - Sprott Physical Gold Trust',
    'PKI': 'PKI - Parkland Corp',
    'PMZ': 'PMZ - Photon Control Inc',
    'POU': 'POU - Paramount Resources Ltd',
    'POW': 'POW - Power Corp Of Canada',
    'PPL': 'PPL - Pembina Pipeline Corp',
    'PRL': 'PRL - Perpetual Resources Ltd',
    'PSLV': 'PSLV - Sprott Physical Silver Trust',
    'PSK': 'PSK - Prairiesky Royalty Ltd',
    'PXT': 'PXT - Parex Resources Inc',
    'QBR': 'QBR - Quebecor Inc',
    'QSR': 'QSR - Restaurant Brands International Inc',
    'RBA': 'RBA - Ritchie Bros. Auctioneers Inc',
    'RCI': 'RCI - Rogers Communications Inc',
    'REAL': 'REAL - Canadian Real Estate Investment Trust',
    'REI': 'REI - Riocan Reit',
    'RING': 'RING - Gold Bullion Development Corp',
    'RUS': 'RUS - Russel Metals Inc',
    'RY': 'RY - Royal Bank Of Canada',
    'SAP': 'SAP - Saputo Inc',
    'SCR': 'SCR - Score Media And Gaming Inc',
    'SEA': 'SEA - Seabridge Gold Inc',
    'SES': 'SES - Secure Energy Services Inc',
    'SHOP': 'SHOP - Shopify Inc',
    'SIA': 'SIA - Sienna Senior Living Inc',
    'SIL1': 'SIL1 - Silvergate Capital Corp',
    'SIS': 'SIS - Savaria Corp',
    'SJ': 'SJ - Stella-Jones Inc',
    'SLF': 'SLF - Sun Life Financial Inc',
    'SOBO': 'SOBO - Southbow Corp',
    'SOY': 'SOY - Soy Protein Corp',
    'SPB': 'SPB - Superior Plus Corp',
    'SRU': 'SRU - Smartcentres Reit',
    'SSL': 'SSL - Sandstorm Gold Ltd',
    'SSRM': 'SSRM - SSR Mining Inc',
    'STN': 'STN - Stantec Inc',
    'SU': 'SU - Suncor Energy Inc',
    'SVI': 'SVI - Storagevault Canada Inc',
    'SVM': 'SVM - Silvercorp Metals Inc',
    'SXJ': 'SXJ - Ishares S&P/TSX Capped Energy Index ETF',
    'SXO': 'SXO - Ishares S&P/TSX Composite High Dividend Index ETF',
    'SXV': 'SXV - Ishares S&P/TSX Composite Index ETF',
    'T': 'T - Telus Corp',
    'TA': 'TA - Transalta Corp',
    'TCL': 'TCL - Transcontinental Inc',
    'TD': 'TD - Toronto-Dominion Bank',
    'TECK': 'TECK - Teck Resources Ltd',
    'TECH': 'TECH - Evolve Technology ETF',
    'TFII': 'TFII - TFI International Inc',
    'TFPM': 'TFPM - Triple Flag Precious Metals Corp',
    'TIH': 'TIH - Toromont Industries Ltd',
    'TIXT': 'TIXT - TELUS International',
    'TLRY': 'TLRY - Tilray Brands Inc',
    'TNZ': 'TNZ - Tenaz Energy Corp',
    'TOU': 'TOU - Tourmaline Oil Corp',
    'TOY': 'TOY - Spin Master Corp',
    'TPZ': 'TPZ - Topaz Energy Corp',
    'TRI': 'TRI - Thomson Reuters Corp',
    'TRP': 'TRP - TC Energy Corp',
    'TRP1': 'TRP1 - TC Energy Corp',
    'TSLA': 'TSLA - Tesla Inc',
    'TSU': 'TSU - Trisura Group Ltd',
    'TVE': 'TVE - Tamarack Valley Energy Ltd',
    'TXG': 'TXG - Torex Gold Resources Inc',
    'U': 'U - Unity Software Inc',
    'USX': 'USX - Vanguard U.S. Total Market Index ETF',
    'USSX': 'USSX - Horizons S&P 500 Index ETF',
    'VAB': 'VAB - Vanguard Canadian Aggregate Bond Index ETF',
    'VET': 'VET - Vermilion Energy Inc',
    'VFV': 'VFV - Vanguard S&P 500 Index ETF',
    'VSB': 'VSB - Vanguard Canadian Short-Term Bond Index ETF',
    'VSC': 'VSC - Vanguard Canadian Short-Term Corporate Bond Index ETF',
    'WCN': 'WCN - Waste Connections Inc',
    'WCP': 'WCP - Whitecap Resources Inc',
    'WCP1': 'WCP1 - Whitecap Resources Inc',
    'WDO': 'WDO - Wesdome Gold Mines Ltd',
    'WEED': 'WEED - Canopy Growth Corp',
    'WEED1': 'WEED1 - Canopy Growth Corp',
    'WELL': 'WELL - WELL Health Technologies Corp',
    'WFG': 'WFG - West Fraser Timber Co Ltd',
    'WN': 'WN - George Weston Ltd',
    'WPM': 'WPM - Wheaton Precious Metals Corp',
    'WSP': 'WSP - WSP Global Inc',
    'WTE': 'WTE - Westshore Terminals Investment Corp',
    'X': 'X - Tmx Group Ltd',
    'XBB': 'XBB - Ishares Core Canadian Universe Bond Index ETF',
    'XCB': 'XCB - Ishares Canadian Corporate Bond Index ETF',
    'XCN': 'XCN - Ishares S&P/TSX Capped Composite Index ETF',
    'XDV': 'XDV - Ishares Canadian Select Dividend Index ETF',
    'XEG': 'XEG - Ishares S&P/TSX Capped Energy Index ETF',
    'XFN': 'XFN - Ishares S&P/TSX Capped Financials Index ETF',
    'XGD': 'XGD - Ishares S&P/TSX Global Gold Index ETF',
    'XIC': 'XIC - Ishares Core S&P/TSX Capped Composite Index ETF',
    'XIN': 'XIN - Ishares MSCI EAFE Index ETF',
    'XIU': 'XIU - Ishares S&P/TSX 60 Index ETF',
    'XRE': 'XRE - Ishares S&P/TSX Capped Reit Index ETF',
    'XSB': 'XSB - Ishares Core Canadian Short Term Bond Index ETF',
    'XSP': 'XSP - Ishares Core S&P 500 Index ETF',
    'XSU': 'XSU - Ishares S&P/TSX Capped Utilities Index ETF',
    'ZAG': 'ZAG - BMO Aggregate Bond Index ETF',
    'ZBK': 'ZBK - BMO Discount Bond Index ETF',
    'ZCN': 'ZCN - BMO S&P/TSX Capped Composite Index ETF',
    'ZDM': 'ZDM - BMO International Dividend ETF',
    'ZEB': 'ZEB - BMO Equal Weight Banks Index ETF',
    'ZGLD': 'ZGLD - BMO Gold Bullion ETF',
    'ZHY': 'ZHY - BMO High Yield US Corporate Bond Index ETF',
    'ZIU': 'ZIU - BMO S&P/TSX Equal Weight Industrials Index ETF',
    'ZLB': 'ZLB - BMO Low Volatility Canadian Equity ETF',
    'ZPR': 'ZPR - BMO Laddered Preferred Share Index ETF',
    'ZQQ': 'ZQQ - BMO Nasdaq 100 Equity Index ETF',
    'ZSP': 'ZSP - BMO S&P 500 Index ETF',
    'ZUB': 'ZUB - BMO US Preferred Share Index ETF',
    'ZUE': 'ZUE - BMO MSCI USA High Quality Index ETF',
    'ZUQ': 'ZUQ - BMO MSCI USA Quality Index ETF',
    'ZUT': 'ZUT - BMO US Put Write ETF'
  };

  const symbols = Object.keys(symbolsData).sort();

  // Données de l'onglet actif
  const activeData = useMemo(() => {
    const activeSearch = searchHistory.find(s => s.id === activeTab);
    return activeSearch?.data || null;
  }, [searchHistory, activeTab]);

  const handleSortChange = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Filtrer et trier les données
  const filteredAndSortedData = useMemo(() => {
    if (!activeData || !Array.isArray(activeData)) return null;

    let filtered = activeData.filter((row: any) => {
      // Filtre par type (Call/Put)
      if (filters.quotes && row.Quotes?.toLowerCase() !== filters.quotes) {
        return false;
      }

      // Filtre par Date Min
      if (filters.minDate) {
        const rowDate = new Date(row.Date).getTime();
        const minDate = new Date(filters.minDate).getTime();
        if (rowDate < minDate) return false;
      }

      // Filtre par Date Max
      if (filters.maxDate) {
        const rowDate = new Date(row.Date).getTime();
        const maxDate = new Date(filters.maxDate).getTime();
        if (rowDate > maxDate) return false;
      }

      // Filtre par Strike Min
      if (filters.minStrike && parseFloat(row.Strike_price) < parseFloat(filters.minStrike)) {
        return false;
      }

      // Filtre par Strike Max
      if (filters.maxStrike && parseFloat(row.Strike_price) > parseFloat(filters.maxStrike)) {
        return false;
      }

      // Filtre par Volatilité Min
      if (filters.minVolatility && parseFloat(row.volatility) < parseFloat(filters.minVolatility)) {
        return false;
      }

      // Filtre par Volatilité Max
      if (filters.maxVolatility && parseFloat(row.volatility) > parseFloat(filters.maxVolatility)) {
        return false;
      }

      // Filtre par is_weekly
      if (filters.isWeekly && row.is_weekly?.toString() !== filters.isWeekly) {
        return false;
      }

      return true;
    });

    // Trier les données
    filtered.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      // Conversion en nombre pour les colonnes numériques
      if (sortBy === 'Strike_price' || sortBy === 'volatility' || sortBy === 'open_interest' || sortBy === 'bid_price' || sortBy === 'ask_price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

      // Conversion en date
      if (sortBy === 'Date') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [activeData, filters, sortBy, sortOrder]);

  const handleScrape = async () => {
    if (!selectedSymbol) {
      setError('Veuillez sélectionner un symbole');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post('/api/options', {
        symbol: selectedSymbol,
      }, {
        timeout: 60000,
      });

      const newSearch: SearchHistory = {
        id: Date.now().toString(),
        symbol: selectedSymbol,
        data: response.data,
        timestamp: new Date().toLocaleString('fr-CA'),
      };

      setSearchHistory(prev => [...prev, newSearch]);
      setActiveTab(newSearch.id);

      console.log('Données reçues:', response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError('Erreur inconnue');
      }
      console.error('Erreur:', err);
    } finally {
      setLoading(false);
    }
  };

  const closeTab = (id: string) => {
    setSearchHistory(prev => prev.filter(s => s.id !== id));
    if (activeTab === id) {
      const remaining = searchHistory.filter(s => s.id !== id);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const exportToCSV = () => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return;

    // Récupérer les colonnes (sans id, createdAt, updatedAt)
    const allColumns = Object.keys(filteredAndSortedData[0]);
    const columns = allColumns.filter(col => !['id', 'createdAt', 'updatedAt'].includes(col));

    // Créer l'en-tête CSV
    const header = columns.join(',');

    // Créer les lignes CSV
    const rows = filteredAndSortedData.map(row => {
      return columns.map(col => {
        const value = row[col];
        // Échapper les valeurs contenant des virgules ou des guillemets
        if (value === null || value === undefined) return '';
        const stringValue = String(value);
        if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
          return `"${stringValue.replace(/"/g, '""')}"`;
        }
        return stringValue;
      }).join(',');
    });

    // Combiner en-tête et lignes
    const csv = [header, ...rows].join('\n');

    // Créer un blob et télécharger
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    const activeSearch = searchHistory.find(s => s.id === activeTab);
    const filename = `options_${activeSearch?.symbol || 'data'}_${new Date().toISOString().slice(0, 10)}.csv`;

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <main className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Options Viewer
          </h1>
          <p className="text-gray-600">
            Données du Montreal Exchange depuis PostgreSQL
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white p-6 rounded-lg shadow mb-6">
          <div className="mb-4">
            <label htmlFor="symbol" className="block text-sm font-medium text-gray-700 mb-2">
              Symbole
            </label>
            <select
              id="symbol"
              value={selectedSymbol}
              onChange={(e) => setSelectedSymbol(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Sélectionnez un symbole</option>
              {symbols.map((symbol) => (
                <option key={symbol} value={symbol}>
                  {symbol}
                </option>
              ))}
            </select>
            {selectedSymbol && (
              <p className="mt-2 text-sm text-gray-600 font-medium">
                {symbolsData[selectedSymbol]}
              </p>
            )}
          </div>

          <button
            onClick={handleScrape}
            disabled={loading || !selectedSymbol}
            className={`w-full px-6 py-3 rounded-lg font-semibold text-white transition-colors ${
              loading || !selectedSymbol
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700'
            }`}
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Chargement...
              </span>
            ) : (
              'Charger les données'
            )}
          </button>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Onglets Historique */}
        {searchHistory.length > 0 && (
          <div className="mb-6 flex flex-wrap gap-2">
            {searchHistory.map((search) => (
              <button
                key={search.id}
                onClick={() => setActiveTab(search.id)}
                className={`group flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                  activeTab === search.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
                }`}
              >
                <span>{search.symbol}</span>
                <span className="text-xs opacity-70">{search.timestamp}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(search.id);
                  }}
                  className={`ml-1 hover:opacity-100 transition-opacity ${
                    activeTab === search.id ? 'opacity-70' : 'opacity-50'
                  }`}
                >
                  ×
                </button>
              </button>
            ))}
          </div>
        )}

        {/* Analyse IA */}
        {activeData && Array.isArray(activeData) && (
          <AIAnalysis
            data={filteredAndSortedData || activeData}
            symbol={searchHistory.find(s => s.id === activeTab)?.symbol || ''}
          />
        )}

        {/* Filtres et Tri */}
        {activeData && Array.isArray(activeData) && (
          <DataFilters
            filters={filters}
            onFilterChange={setFilters}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={handleSortChange}
          />
        )}

        {/* Affichage des données en tableau */}
        {filteredAndSortedData && Array.isArray(filteredAndSortedData) && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">
                Résultats ({filteredAndSortedData.length} ligne{filteredAndSortedData.length > 1 ? 's' : ''})
              </h2>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Exporter CSV
              </button>
            </div>
            <OptionsTable data={filteredAndSortedData} />
          </div>
        )}

        {/* Message si aucune donnée */}
        {!loading && !error && searchHistory.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <p className="text-gray-500">
              Cliquez sur "Charger les données" pour commencer
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
