'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, BarChart, Bar, ComposedChart, Area, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend, ReferenceLine } from 'recharts';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface SearchHistory {
  id: string;
  symbol: string;
  data: any[];
  timestamp: string;
}

interface StockPrice {
  symbol: string;
  last_price: number;
  bid_price: number;
  ask_price: number;
  scrape_date: string;
  created_at: string;
}

export default function DarkModePage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSymbol, setSelectedSymbol] = useState<string>('');
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([]);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [symbols, setSymbols] = useState<string[]>([]);
  const [loadingSymbols, setLoadingSymbols] = useState(true);
  const [stockPrice, setStockPrice] = useState<StockPrice | null>(null);
  const [loadingStockPrice, setLoadingStockPrice] = useState(false);

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

  // Charger les symboles depuis l'API au montage du composant
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setLoadingSymbols(true);
        const response = await axios.get('/api/options/symbols');
        setSymbols(response.data);
      } catch (err) {
        console.error('Erreur lors du chargement des symboles:', err);
        setError('Erreur lors du chargement des symboles');
      } finally {
        setLoadingSymbols(false);
      }
    };

    fetchSymbols();
  }, []);

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

  const filteredAndSortedData = useMemo(() => {
    if (!activeData || !Array.isArray(activeData)) return null;

    let filtered = activeData.filter((row: any) => {
      if (filters.quotes && row.Quotes?.toLowerCase() !== filters.quotes) {
        return false;
      }

      if (filters.minDate) {
        const rowDate = new Date(row.Date).getTime();
        const minDate = new Date(filters.minDate).getTime();
        if (rowDate < minDate) return false;
      }

      if (filters.maxDate) {
        const rowDate = new Date(row.Date).getTime();
        const maxDate = new Date(filters.maxDate).getTime();
        if (rowDate > maxDate) return false;
      }

      if (filters.minStrike && parseFloat(row.Strike_price) < parseFloat(filters.minStrike)) {
        return false;
      }

      if (filters.maxStrike && parseFloat(row.Strike_price) > parseFloat(filters.maxStrike)) {
        return false;
      }

      if (filters.minVolatility && parseFloat(row.volatility) < parseFloat(filters.minVolatility)) {
        return false;
      }

      if (filters.maxVolatility && parseFloat(row.volatility) > parseFloat(filters.maxVolatility)) {
        return false;
      }

      if (filters.isWeekly && row.is_weekly?.toString() !== filters.isWeekly) {
        return false;
      }

      return true;
    });

    filtered.sort((a: any, b: any) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (sortBy === 'Strike_price' || sortBy === 'volatility' || sortBy === 'open_interest' || sortBy === 'bid_price' || sortBy === 'ask_price') {
        aVal = parseFloat(aVal) || 0;
        bVal = parseFloat(bVal) || 0;
      }

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

  // Calculate statistics
  const statistics = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) {
      return {
        totalOptions: 0,
        totalCalls: 0,
        totalPuts: 0,
        avgVolatility: 0,
        totalVolume: 0,
        avgStrike: 0,
      };
    }

    const calls = filteredAndSortedData.filter((r: any) => r.Quotes?.toLowerCase() === 'call');
    const puts = filteredAndSortedData.filter((r: any) => r.Quotes?.toLowerCase() === 'put');
    const avgVol = filteredAndSortedData.reduce((sum: number, r: any) => sum + (parseFloat(r.volatility) || 0), 0) / filteredAndSortedData.length;
    const totalVol = filteredAndSortedData.reduce((sum: number, r: any) => sum + (parseFloat(r.open_interest) || 0), 0);
    const avgStrike = filteredAndSortedData.reduce((sum: number, r: any) => sum + (parseFloat(r.Strike_price) || 0), 0) / filteredAndSortedData.length;

    return {
      totalOptions: filteredAndSortedData.length,
      totalCalls: calls.length,
      totalPuts: puts.length,
      avgVolatility: avgVol,
      totalVolume: totalVol,
      avgStrike: avgStrike,
    };
  }, [filteredAndSortedData]);

  // 1. Price & IV by Strike (Volatility Smile)
  const volatilitySmileData = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return { calls: [], puts: [] };

    const calls = filteredAndSortedData
      .filter((r: any) => r.Quotes?.toLowerCase() === 'call')
      .map((r: any) => ({
        strike: parseFloat(r.Strike_price) || 0,
        iv: parseFloat(r.volatility) || 0,
        bid: parseFloat(r.bid_price) || 0,
        ask: parseFloat(r.ask_price) || 0,
        oi: parseFloat(r.open_interest) || 0,
        date: new Date(r.Date).toLocaleDateString('fr-CA'),
      }))
      .sort((a, b) => a.strike - b.strike);

    const puts = filteredAndSortedData
      .filter((r: any) => r.Quotes?.toLowerCase() === 'put')
      .map((r: any) => ({
        strike: parseFloat(r.Strike_price) || 0,
        iv: parseFloat(r.volatility) || 0,
        bid: parseFloat(r.bid_price) || 0,
        ask: parseFloat(r.ask_price) || 0,
        oi: parseFloat(r.open_interest) || 0,
        date: new Date(r.Date).toLocaleDateString('fr-CA'),
      }))
      .sort((a, b) => a.strike - b.strike);

    return { calls, puts };
  }, [filteredAndSortedData]);

  // 2. Volume by Strike (Top 15)
  const volumeByStrike = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];

    return filteredAndSortedData
      .sort((a: any, b: any) => (parseFloat(b.open_interest) || 0) - (parseFloat(a.open_interest) || 0))
      .slice(0, 15)
      .map((row: any) => ({
        strike: parseFloat(row.Strike_price).toFixed(0),
        type: row.Quotes?.toLowerCase(),
        volume: parseFloat(row.open_interest) || 0,
        label: `${row.Quotes?.toUpperCase()} $${parseFloat(row.Strike_price).toFixed(0)}`,
        date: new Date(row.Date).toLocaleDateString('fr-CA'),
      }));
  }, [filteredAndSortedData]);

  // 3. IV by Expiration
  const ivByExpiration = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];

    const grouped = filteredAndSortedData.reduce((acc: any, row: any) => {
      const date = new Date(row.Date).toLocaleDateString('fr-CA');
      if (!acc[date]) {
        acc[date] = {
          date,
          totalIV: 0,
          count: 0,
          totalVolume: 0,
        };
      }

      acc[date].totalIV += parseFloat(row.volatility) || 0;
      acc[date].totalVolume += parseFloat(row.open_interest) || 0;
      acc[date].count++;

      return acc;
    }, {});

    return Object.values(grouped)
      .map((item: any) => ({
        date: item.date,
        avgIV: item.count > 0 ? parseFloat((item.totalIV / item.count).toFixed(2)) : 0,
        volume: item.totalVolume,
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 12);
  }, [filteredAndSortedData]);

  // 4. Call/Put Ratio by Expiration
  const callPutRatioData = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];

    const grouped = filteredAndSortedData.reduce((acc: any, row: any) => {
      const date = new Date(row.Date).toLocaleDateString('fr-CA');
      if (!acc[date]) {
        acc[date] = {
          date,
          calls: 0,
          puts: 0,
          callVolume: 0,
          putVolume: 0,
        };
      }

      if (row.Quotes?.toLowerCase() === 'call') {
        acc[date].calls++;
        acc[date].callVolume += parseFloat(row.open_interest) || 0;
      } else if (row.Quotes?.toLowerCase() === 'put') {
        acc[date].puts++;
        acc[date].putVolume += parseFloat(row.open_interest) || 0;
      }

      return acc;
    }, {});

    return Object.values(grouped)
      .map((item: any) => ({
        date: item.date,
        calls: item.calls,
        puts: item.puts,
        ratio: item.puts > 0 ? parseFloat((item.calls / item.puts).toFixed(2)) : item.calls,
        callVolume: item.callVolume,
        putVolume: item.putVolume,
      }))
      .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 10);
  }, [filteredAndSortedData]);

  const handleScrape = async (symbol: string) => {
    if (!symbol) {
      setError('Veuillez sélectionner un symbole');
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Charger depuis PostgreSQL
      const response = await axios.post('/api/options', {
        symbol: symbol,
      }, {
        timeout: 60000,
      });

      const newSearch: SearchHistory = {
        id: Date.now().toString(),
        symbol: symbol,
        data: response.data,
        timestamp: new Date().toLocaleString('fr-CA'),
      };

      setSearchHistory(prev => [...prev, newSearch]);
      setActiveTab(newSearch.id);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        setError(err.message);
      } else {
        setError('Erreur inconnue');
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch stock price for a symbol
  const fetchStockPrice = async (symbol: string) => {
    try {
      setLoadingStockPrice(true);
      const response = await axios.get(`/api/stock-price?symbol=${symbol}`);
      if (response.data.success) {
        setStockPrice(response.data.data);
      } else {
        setStockPrice(null);
      }
    } catch (err) {
      console.error('Erreur lors du chargement du prix:', err);
      setStockPrice(null);
    } finally {
      setLoadingStockPrice(false);
    }
  };

  // Auto-fetch when symbol changes
  const handleSymbolChange = (symbol: string) => {
    setSelectedSymbol(symbol);
    if (symbol) {
      handleScrape(symbol);
      fetchStockPrice(symbol);
    } else {
      setStockPrice(null);
    }
  };

  const closeTab = (id: string) => {
    setSearchHistory(prev => prev.filter(s => s.id !== id));
    if (activeTab === id) {
      const remaining = searchHistory.filter(s => s.id !== id);
      setActiveTab(remaining.length > 0 ? remaining[remaining.length - 1].id : null);
    }
  };

  const [exportingPDF, setExportingPDF] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);

  const openPrintPreview = async () => {
    const activeSearch = searchHistory.find(s => s.id === activeTab);
    if (!activeSearch) return;

    setExportingPDF(true);
    setShowExportMenu(false);

    try {
      // Capture charts section as image
      const chartsSection = document.getElementById('charts-section');
      let chartsImage = '';

      if (chartsSection) {
        const canvas = await html2canvas(chartsSection, {
          scale: 2,
          backgroundColor: '#0f1419',
          logging: false,
        });
        chartsImage = canvas.toDataURL('image/png');
      }

      // Prepare data to pass to print window
      const reportData = {
        symbol: activeSearch.symbol,
        date: new Date().toLocaleDateString('fr-CA'),
        statistics,
        tableData: organizedTableData,
        chartsImage, // Add captured charts image
      };

      // Store data in sessionStorage
      sessionStorage.setItem('reportData', JSON.stringify(reportData));

      // Open print preview in new window
      window.open('/dark/print-preview', '_blank', 'width=1200,height=800');
    } catch (error) {
      console.error('Error preparing print preview:', error);
      alert('Error preparing print preview');
    } finally {
      setExportingPDF(false);
    }
  };

  const exportCurrentView = () => {
    const activeSearch = searchHistory.find(s => s.id === activeTab);
    if (!activeSearch || !filteredAndSortedData) return;

    setShowExportMenu(false);

    try {
      // Créer le JSON avec les données filtrées et triées actuelles
      const exportData = {
        symbol: activeSearch.symbol,
        exportDate: new Date().toISOString(),
        filters: filters,
        sortBy: sortBy,
        sortOrder: sortOrder,
        data: filteredAndSortedData,
        statistics: statistics,
      };

      // Convertir en JSON
      const jsonStr = JSON.stringify(exportData, null, 2);

      // Créer un blob et télécharger
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${activeSearch.symbol}_current_view_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting current view:', error);
      alert('Erreur lors de l\'export de la vue actuelle');
    }
  };

  const exportAllData = async () => {
    setShowExportMenu(false);

    try {
      // Appeler l'API pour récupérer toutes les données d'aujourd'hui
      const response = await axios.get('/api/options/export-today', {
        timeout: 120000, // 2 minutes timeout
      });

      const exportData = {
        exportDate: new Date().toISOString(),
        totalRecords: response.data.length,
        data: response.data,
      };

      // Convertir en JSON
      const jsonStr = JSON.stringify(exportData, null, 2);

      // Créer un blob et télécharger
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `all_options_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting all data:', error);
      alert('Erreur lors de l\'export de toutes les données');
    }
  };


  const resetFilters = () => {
    setFilters({
      quotes: '',
      minStrike: '',
      maxStrike: '',
      minVolatility: '',
      maxVolatility: '',
      isWeekly: '',
      minDate: '',
      maxDate: '',
    });
  };

  const updateFilter = (key: string, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  // Organize data: Call then Put for same date/strike
  const organizedTableData = useMemo(() => {
    if (!filteredAndSortedData || filteredAndSortedData.length === 0) return [];

    // Separate calls and puts
    const calls = filteredAndSortedData.filter((row: any) => row.Quotes?.toLowerCase() === 'call');
    const puts = filteredAndSortedData.filter((row: any) => row.Quotes?.toLowerCase() === 'put');

    // Sort by date then strike
    const sortByDateAndStrike = (a: any, b: any) => {
      const dateA = new Date(a.Date).getTime();
      const dateB = new Date(b.Date).getTime();
      if (dateA !== dateB) return dateA - dateB;
      const strikeA = parseFloat(a.Strike_price) || 0;
      const strikeB = parseFloat(b.Strike_price) || 0;
      return strikeA - strikeB;
    };

    calls.sort(sortByDateAndStrike);
    puts.sort(sortByDateAndStrike);

    const organized: any[] = [];
    const usedPuts = new Set<number>();

    // For each call, find matching put (same date AND strike)
    calls.forEach(call => {
      const callStrike = parseFloat(call.Strike_price) || 0;
      const callDate = new Date(call.Date).getTime();

      organized.push(call);

      const matchingPutIndex = puts.findIndex((put, index) => {
        if (usedPuts.has(index)) return false;
        const putStrike = parseFloat(put.Strike_price) || 0;
        const putDate = new Date(put.Date).getTime();
        return callDate === putDate && Math.abs(putStrike - callStrike) < 0.01;
      });

      if (matchingPutIndex !== -1) {
        organized.push(puts[matchingPutIndex]);
        usedPuts.add(matchingPutIndex);
      }
    });

    // Add remaining puts
    puts.forEach((put, index) => {
      if (!usedPuts.has(index)) {
        organized.push(put);
      }
    });

    return organized;
  }, [filteredAndSortedData]);

  // Render compact table
  const renderTable = () => {
    if (!organizedTableData || organizedTableData.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          Aucune donnée à afficher
        </div>
      );
    }

    // Get all columns from the first row, excluding internal fields
    const allColumns = organizedTableData.length > 0
      ? Object.keys(organizedTableData[0]).filter(col => !['id', 'createdAt', 'updatedAt', 'created_at', 'updated_at'].includes(col))
      : [];

    return (
      <div className="bg-[#1e2329] rounded-lg overflow-hidden border border-[#2b3139]">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px]" style={{ overscrollBehavior: 'contain' }}>
          <table className="min-w-full text-xs">
            <thead className="bg-[#252a30] border-b border-[#2b3139] sticky top-0 z-10">
              <tr>
                {allColumns.map((column) => (
                  <th
                    key={column}
                    className="px-3 py-2 text-left text-[10px] font-medium text-gray-400 uppercase tracking-wider whitespace-nowrap"
                  >
                    {column === 'Strike_price' ? 'Strike' : column === 'open_interest' ? 'OI' : column.replace(/_/g, ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2b3139]">
              {organizedTableData.map((row, rowIndex) => {
                const isCall = row.Quotes?.toLowerCase() === 'call';
                const isPut = row.Quotes?.toLowerCase() === 'put';

                return (
                  <tr
                    key={rowIndex}
                    className={`hover:bg-[#252a30] transition-colors ${
                      isCall ? 'bg-green-900/10' : isPut ? 'bg-red-900/10' : ''
                    }`}
                  >
                    {allColumns.map((column) => {
                      const value = row[column];
                      let displayValue = value?.toString() || '-';

                      // Special rendering for Quotes column
                      if (column === 'Quotes' || column === 'quotes') {
                        return (
                          <td key={`${rowIndex}-${column}`} className="px-3 py-2 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                isCall
                                  ? 'bg-green-600 text-white'
                                  : isPut
                                  ? 'bg-red-600 text-white'
                                  : 'bg-gray-600 text-white'
                              }`}
                            >
                              {isCall ? 'C' : isPut ? 'P' : '-'}
                            </span>
                          </td>
                        );
                      }

                      // Format date columns
                      if ((column.toLowerCase().includes('date') || column === 'Date') && value) {
                        try {
                          displayValue = new Date(value).toLocaleDateString('fr-CA');
                        } catch (e) {
                          displayValue = value?.toString() || '-';
                        }
                      }

                      // Format numeric columns (prices, volatility, etc.)
                      if (
                        (column.toLowerCase().includes('price') ||
                         column.toLowerCase().includes('volatility') ||
                         column.toLowerCase().includes('change')) &&
                        value !== null &&
                        value !== undefined &&
                        !isNaN(parseFloat(value))
                      ) {
                        displayValue = parseFloat(value).toFixed(2);
                      }

                      // Format integer columns (sizes, open interest)
                      if (
                        (column.toLowerCase().includes('size') ||
                         column.toLowerCase().includes('interest') ||
                         column.toLowerCase().includes('volume')) &&
                        value !== null &&
                        value !== undefined &&
                        !isNaN(parseInt(value))
                      ) {
                        displayValue = parseInt(value).toLocaleString();
                      }

                      return (
                        <td
                          key={`${rowIndex}-${column}`}
                          className="px-3 py-2 whitespace-nowrap text-gray-300"
                        >
                          {displayValue}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen bg-[#0f1419] py-4 px-4">
      <div className="max-w-[1800px] mx-auto">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-white mb-1">
            Options Trading Dashboard
          </h1>
          <p className="text-sm text-gray-400">
            Montreal Exchange - Real-time Options Data
          </p>
        </div>

        {/* Stock Price Section */}
        {stockPrice && (
          <div className="mb-4 bg-[#1e2329] p-5 rounded-lg border border-[#2b3139]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                {/* Symbol */}
                <div>
                  <div className="text-3xl font-bold text-white">
                    {stockPrice.symbol}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    Last Update: {new Date(stockPrice.created_at).toLocaleString('fr-CA', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </div>
                </div>

                {/* Last Price */}
                <div className="border-l border-[#2b3139] pl-6">
                  <div className="text-xs text-gray-400 mb-1">Last Price</div>
                  <div className="text-2xl font-bold text-green-400">
                    ${parseFloat(stockPrice.last_price.toString()).toFixed(2)}
                  </div>
                </div>

                {/* Bid Price */}
                <div className="border-l border-[#2b3139] pl-6">
                  <div className="text-xs text-gray-400 mb-1">Bid</div>
                  <div className="text-xl font-semibold text-blue-400">
                    ${parseFloat(stockPrice.bid_price.toString()).toFixed(2)}
                  </div>
                </div>

                {/* Ask Price */}
                <div className="border-l border-[#2b3139] pl-6">
                  <div className="text-xs text-gray-400 mb-1">Ask</div>
                  <div className="text-xl font-semibold text-red-400">
                    ${parseFloat(stockPrice.ask_price.toString()).toFixed(2)}
                  </div>
                </div>

                {/* Spread */}
                <div className="border-l border-[#2b3139] pl-6">
                  <div className="text-xs text-gray-400 mb-1">Spread</div>
                  <div className="text-lg font-semibold text-purple-400">
                    ${(parseFloat(stockPrice.ask_price.toString()) - parseFloat(stockPrice.bid_price.toString())).toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Loading indicator */}
              {loadingStockPrice && (
                <div className="flex items-center gap-2 text-gray-400">
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
                  <span className="text-sm">Updating...</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Top Controls Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          {/* Symbol Selection & Export */}
          <div className="bg-[#1e2329] p-4 rounded-lg border border-[#2b3139]">
            <label className="block text-xs font-medium text-gray-300 mb-2">Symbol & Export</label>
            <div className="flex gap-3 items-start">
              <div className="flex-1">
                <select
                  value={selectedSymbol}
                  onChange={(e) => handleSymbolChange(e.target.value)}
                  disabled={loadingSymbols}
                  className="w-full px-3 py-2 bg-[#252a30] border border-[#2b3139] rounded text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {loadingSymbols ? 'Loading symbols...' : `Select... (${symbols.length} available)`}
                  </option>
                  {symbols.map((symbol) => (
                    <option key={symbol} value={symbol}>
                      {symbol}
                    </option>
                  ))}
                </select>
                {selectedSymbol && (
                  <p className="mt-1 text-xs text-gray-400">
                    Selected: {selectedSymbol}
                  </p>
                )}
              </div>
              <div className="relative" style={{ minWidth: '140px' }}>
              <button
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={!filteredAndSortedData || exportingPDF}
                className={`w-full px-5 py-2 rounded text-sm font-semibold text-white transition-colors flex items-center justify-center gap-2 ${
                  !filteredAndSortedData || exportingPDF
                    ? 'bg-gray-600 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {exportingPDF ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
                    Preparing...
                  </span>
                ) : (
                  <>
                    Export
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </>
                )}
              </button>

              {showExportMenu && !exportingPDF && (
                <div className="absolute right-0 mt-2 w-64 bg-[#1e2329] border border-[#2b3139] rounded-lg shadow-lg z-50">
                  <button
                    onClick={openPrintPreview}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#252a30] transition-colors border-b border-[#2b3139]"
                  >
                    <div className="font-semibold">Export PDF</div>
                    <div className="text-xs text-gray-400">Toute la page avec graphiques</div>
                  </button>
                  <button
                    onClick={exportCurrentView}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#252a30] transition-colors border-b border-[#2b3139]"
                  >
                    <div className="font-semibold">Export Vue Actuelle (JSON)</div>
                    <div className="text-xs text-gray-400">Table filtrée et triée</div>
                  </button>
                  <button
                    onClick={exportAllData}
                    className="w-full text-left px-4 py-3 text-sm text-white hover:bg-[#252a30] transition-colors"
                  >
                    <div className="font-semibold">Export All Data (JSON)</div>
                    <div className="text-xs text-gray-400">Toutes les options d'aujourd'hui (DB)</div>
                  </button>
                </div>
              )}
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-[#1e2329] p-4 rounded-lg border border-[#2b3139]">
            <h3 className="text-xs font-medium text-gray-300 mb-3">Quick Stats</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-[#252a30] p-3 rounded text-center">
                <div className="text-xs text-gray-400 mb-1">Total</div>
                <div className="text-xl font-bold text-white">{statistics.totalOptions}</div>
              </div>
              <div className="bg-[#252a30] p-3 rounded text-center">
                <div className="text-xs text-gray-400 mb-1">Calls</div>
                <div className="text-xl font-bold text-green-400">{statistics.totalCalls}</div>
              </div>
              <div className="bg-[#252a30] p-3 rounded text-center">
                <div className="text-xs text-gray-400 mb-1">Puts</div>
                <div className="text-xl font-bold text-red-400">{statistics.totalPuts}</div>
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <div className="bg-[#252a30] p-2 rounded text-center">
                <div className="text-xs text-gray-400">Avg IV</div>
                <div className="text-sm font-semibold text-blue-400">{statistics.avgVolatility.toFixed(1)}%</div>
              </div>
              <div className="bg-[#252a30] p-2 rounded text-center">
                <div className="text-xs text-gray-400">Total OI</div>
                <div className="text-sm font-semibold text-purple-400">{statistics.totalVolume.toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}

        {/* Tabs */}
        {searchHistory.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            {searchHistory.map((search) => (
              <button
                key={search.id}
                onClick={() => setActiveTab(search.id)}
                className={`group flex items-center gap-2 px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  activeTab === search.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-[#1e2329] text-gray-300 hover:bg-[#252a30] border border-[#2b3139]'
                }`}
              >
                <span>{search.symbol}</span>
                <span className="text-xs opacity-70">{search.timestamp.split(' ')[1]}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(search.id);
                  }}
                  className="ml-1 hover:opacity-100 transition-opacity opacity-70"
                >
                  ×
                </button>
              </button>
            ))}
          </div>
        )}

        {/* Main Dashboard Grid - 2x2 Advanced Charts */}
        {activeData && filteredAndSortedData && (
          <div id="charts-section" className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

            {/* 1. Volatility Smile (IV by Strike) */}
            <div className="bg-[#1e2329] p-3 rounded-lg border border-[#2b3139]">
              <h3 className="text-xs font-semibold text-white mb-0.5">Volatility Smile</h3>
              <p className="text-[10px] text-gray-400 mb-2">Implied Volatility by Strike Price</p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                  <XAxis
                    dataKey="strike"
                    type="number"
                    domain={['dataMin', 'dataMax']}
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'Strike Price', position: 'insideBottom', offset: -5, fill: '#848e9c', fontSize: 10 }}
                  />
                  <YAxis
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'IV %', angle: -90, position: 'insideLeft', fill: '#848e9c', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #2b3139', borderRadius: '4px', fontSize: '11px' }}
                    labelStyle={{ color: '#e1e3e6' }}
                    formatter={(value: any, name: string) => {
                      if (name === 'iv') return [value + '%', 'IV'];
                      return [value, name];
                    }}
                  />
                  <Legend
                    wrapperStyle={{ fontSize: '11px' }}
                    iconType="line"
                  />
                  <Line
                    data={volatilitySmileData.calls}
                    type="monotone"
                    dataKey="iv"
                    stroke="#26a69a"
                    strokeWidth={2}
                    dot={{ fill: '#26a69a', r: 3 }}
                    name="Calls IV"
                    connectNulls
                  />
                  <Line
                    data={volatilitySmileData.puts}
                    type="monotone"
                    dataKey="iv"
                    stroke="#ef5350"
                    strokeWidth={2}
                    dot={{ fill: '#ef5350', r: 3 }}
                    name="Puts IV"
                    connectNulls
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* 2. Volume by Strike (Top Liquidity Zones) */}
            <div className="bg-[#1e2329] p-3 rounded-lg border border-[#2b3139]">
              <h3 className="text-xs font-semibold text-white mb-0.5">Volume by Strike</h3>
              <p className="text-[10px] text-gray-400 mb-2">Top 15 Strikes by Open Interest</p>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={volumeByStrike} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                  <XAxis
                    type="number"
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'Open Interest', position: 'insideBottom', offset: -5, fill: '#848e9c', fontSize: 10 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="label"
                    tick={{ fill: '#848e9c', fontSize: 9 }}
                    width={70}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #2b3139', borderRadius: '4px', fontSize: '11px' }}
                    labelStyle={{ color: '#e1e3e6' }}
                    formatter={(value: any) => [value.toLocaleString(), 'OI']}
                  />
                  <Bar dataKey="volume" radius={[0, 4, 4, 0]}>
                    {volumeByStrike.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.type === 'call' ? '#26a69a' : '#ef5350'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* 3. IV Term Structure */}
            <div className="bg-[#1e2329] p-3 rounded-lg border border-[#2b3139]">
              <h3 className="text-xs font-semibold text-white mb-0.5">IV Term Structure</h3>
              <p className="text-[10px] text-gray-400 mb-2">Average IV & Volume by Expiration</p>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={ivByExpiration}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#848e9c', fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'IV %', angle: -90, position: 'insideLeft', fill: '#848e9c', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'Volume', angle: 90, position: 'insideRight', fill: '#848e9c', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #2b3139', borderRadius: '4px', fontSize: '11px' }}
                    labelStyle={{ color: '#e1e3e6' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <Bar yAxisId="right" dataKey="volume" fill="#374151" name="Volume" opacity={0.5} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="avgIV"
                    stroke="#ffa726"
                    strokeWidth={2}
                    dot={{ fill: '#ffa726', r: 4 }}
                    name="Avg IV %"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 4. Call/Put Ratio & Sentiment */}
            <div className="bg-[#1e2329] p-3 rounded-lg border border-[#2b3139]">
              <h3 className="text-xs font-semibold text-white mb-0.5">Call/Put Ratio</h3>
              <p className="text-[10px] text-gray-400 mb-2">Market Sentiment by Expiration</p>
              <ResponsiveContainer width="100%" height={180}>
                <ComposedChart data={callPutRatioData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2b3139" />
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#848e9c', fontSize: 9 }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis
                    yAxisId="left"
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'Count', angle: -90, position: 'insideLeft', fill: '#848e9c', fontSize: 10 }}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fill: '#848e9c', fontSize: 10 }}
                    label={{ value: 'C/P Ratio', angle: 90, position: 'insideRight', fill: '#848e9c', fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#1e2329', border: '1px solid #2b3139', borderRadius: '4px', fontSize: '11px' }}
                    labelStyle={{ color: '#e1e3e6' }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px' }} />
                  <ReferenceLine yAxisId="right" y={1} stroke="#6b7280" strokeDasharray="3 3" label={{ value: 'Neutral', fill: '#6b7280', fontSize: 10 }} />
                  <Bar yAxisId="left" dataKey="calls" stackId="a" fill="#26a69a" name="Calls" />
                  <Bar yAxisId="left" dataKey="puts" stackId="a" fill="#ef5350" name="Puts" />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="ratio"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    dot={{ fill: '#3b82f6', r: 4 }}
                    name="C/P Ratio"
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

          </div>
        )}

        {/* Filters */}
        {activeData && (
          <div className="bg-[#1e2329] p-4 rounded-lg border border-[#2b3139] mb-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Filters</h3>
              <button
                onClick={resetFilters}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Type</label>
                <select
                  value={filters.quotes}
                  onChange={(e) => updateFilter('quotes', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="call">Call</option>
                  <option value="put">Put</option>
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Date Min</label>
                <input
                  type="date"
                  value={filters.minDate}
                  onChange={(e) => updateFilter('minDate', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Date Max</label>
                <input
                  type="date"
                  value={filters.maxDate}
                  onChange={(e) => updateFilter('maxDate', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Strike Min</label>
                <input
                  type="number"
                  value={filters.minStrike}
                  onChange={(e) => updateFilter('minStrike', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Strike Max</label>
                <input
                  type="number"
                  value={filters.maxStrike}
                  onChange={(e) => updateFilter('maxStrike', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Vol Min</label>
                <input
                  type="number"
                  value={filters.minVolatility}
                  onChange={(e) => updateFilter('minVolatility', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Vol Max</label>
                <input
                  type="number"
                  value={filters.maxVolatility}
                  onChange={(e) => updateFilter('maxVolatility', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-medium text-gray-400 mb-1">Weekly</label>
                <select
                  value={filters.isWeekly}
                  onChange={(e) => updateFilter('isWeekly', e.target.value)}
                  className="w-full px-2 py-1.5 bg-[#252a30] border border-[#2b3139] rounded text-xs text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">All</option>
                  <option value="1">Yes</option>
                  <option value="0">No</option>
                </select>
              </div>
            </div>

            <div className="mt-3">
              <label className="block text-[10px] font-medium text-gray-400 mb-2">Sort By</label>
              <div className="flex flex-wrap gap-2">
                {['Date', 'Strike_price', 'volatility', 'open_interest', 'bid_price', 'ask_price'].map((col) => (
                  <button
                    key={col}
                    onClick={() => handleSortChange(col)}
                    className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                      sortBy === col
                        ? 'bg-blue-600 text-white'
                        : 'bg-[#252a30] text-gray-300 hover:bg-[#2b3139] border border-[#2b3139]'
                    }`}
                  >
                    {col.replace('_', ' ')}
                    {sortBy === col && (
                      <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}


        {/* Options Table */}
        {organizedTableData && organizedTableData.length > 0 && (
          <div className="bg-[#1e2329] p-4 rounded-lg border border-[#2b3139]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">
                Options Chain ({organizedTableData.length})
              </h3>
              <p className="text-xs text-gray-400 flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                Scroll horizontalement pour plus de colonnes
              </p>
            </div>
            {renderTable()}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && searchHistory.length === 0 && (
          <div className="text-center py-20 bg-[#1e2329] rounded-lg border border-[#2b3139]">
            <svg className="mx-auto h-12 w-12 text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <p className="text-gray-400 text-sm">
              Select a symbol and click "Fetch Data" to start
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
