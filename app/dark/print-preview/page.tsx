'use client';

import { useEffect, useState } from 'react';

export default function PrintPreview() {
  const [reportData, setReportData] = useState<any>(null);

  useEffect(() => {
    // Get data from sessionStorage
    const data = sessionStorage.getItem('reportData');
    if (data) {
      setReportData(JSON.parse(data));
    }
  }, []);

  useEffect(() => {
    // Auto-open print dialog after short delay
    if (reportData) {
      const timer = setTimeout(() => {
        window.print();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [reportData]);

  if (!reportData) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-600">Loading report...</p>
      </div>
    );
  }

  const { symbol, date, statistics, tableData, chartsImage } = reportData;

  return (
    <>
      <style jsx global>{`
        @media print {
          body {
            print-color-adjust: exact;
            -webkit-print-color-adjust: exact;
          }

          .no-print {
            display: none !important;
          }

          .page-break {
            page-break-after: always;
          }

          table {
            page-break-inside: auto;
          }

          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }

          thead {
            display: table-header-group;
          }
        }

        @page {
          size: A4;
          margin: 20mm;
        }
      `}</style>

      <div className="bg-white min-h-screen p-8">
        {/* Print Button - Hidden when printing */}
        <div className="no-print mb-6 flex gap-4">
          <button
            onClick={() => window.print()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
          >
            🖨️ Print / Save as PDF
          </button>
          <button
            onClick={() => window.close()}
            className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 font-semibold"
          >
            Close
          </button>
        </div>

        {/* Report Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Options Trading Report
          </h1>
          <h2 className="text-2xl font-semibold text-blue-600 mb-1">
            {symbol}
          </h2>
          <p className="text-gray-600">{date}</p>
        </div>

        {/* Statistics Section */}
        <div className="mb-8">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            📊 Market Statistics
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Options</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalOptions}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Call/Put Ratio</p>
              <p className="text-2xl font-bold text-gray-900">
                {statistics.totalPuts > 0 ? (statistics.totalCalls / statistics.totalPuts).toFixed(2) : 'N/A'}
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded">
              <p className="text-sm text-gray-600">Calls</p>
              <p className="text-2xl font-bold text-green-700">{statistics.totalCalls}</p>
            </div>
            <div className="bg-red-50 p-4 rounded">
              <p className="text-sm text-gray-600">Puts</p>
              <p className="text-2xl font-bold text-red-700">{statistics.totalPuts}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Avg Volatility</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.avgVolatility.toFixed(2)}%</p>
            </div>
            <div className="bg-gray-50 p-4 rounded">
              <p className="text-sm text-gray-600">Total Volume (OI)</p>
              <p className="text-2xl font-bold text-gray-900">{statistics.totalVolume.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Analytics Charts */}
        {chartsImage && (
          <div className="mb-8 page-break">
            <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
              📊 Analytics Charts
            </h3>
            <div className="bg-white rounded-lg border border-gray-300 p-4">
              <img
                src={chartsImage}
                alt="Analytics Charts"
                className="w-full h-auto"
                style={{ maxHeight: '800px', objectFit: 'contain' }}
              />
            </div>
          </div>
        )}


        {/* Options Chain Table */}
        <div className="page-break">
          <h3 className="text-xl font-bold text-gray-900 mb-4 border-b-2 border-gray-300 pb-2">
            📈 Options Chain
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Type</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Date</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Strike</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Bid</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">Ask</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">IV %</th>
                  <th className="px-4 py-2 border border-gray-300 text-left text-sm font-semibold text-gray-700">OI</th>
                </tr>
              </thead>
              <tbody>
                {tableData.map((row: any, index: number) => {
                  const isCall = row.Quotes?.toLowerCase() === 'call';
                  const isPut = row.Quotes?.toLowerCase() === 'put';

                  return (
                    <tr
                      key={index}
                      className={isCall ? 'bg-green-50' : isPut ? 'bg-red-50' : ''}
                    >
                      <td className="px-4 py-2 border border-gray-300 text-sm">
                        <span className={`px-2 py-1 rounded font-bold text-xs ${
                          isCall ? 'bg-green-600 text-white' : isPut ? 'bg-red-600 text-white' : 'bg-gray-600 text-white'
                        }`}>
                          {isCall ? 'C' : isPut ? 'P' : '-'}
                        </span>
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">
                        {new Date(row.Date).toLocaleDateString('fr-CA')}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-sm font-semibold">
                        ${parseFloat(row.Strike_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">
                        ${parseFloat(row.bid_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">
                        ${parseFloat(row.ask_price).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">
                        {parseFloat(row.volatility).toFixed(2)}%
                      </td>
                      <td className="px-4 py-2 border border-gray-300 text-sm">
                        {(row.open_interest || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-8 pt-4 border-t-2 border-gray-300 text-center text-sm text-gray-600">
          <p>Generated with Options Trading Dashboard | {date}</p>
          <p className="mt-1">Montreal Exchange - Real-time Options Data</p>
        </div>
      </div>
    </>
  );
}
