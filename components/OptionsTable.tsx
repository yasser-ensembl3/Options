'use client';

import { useMemo } from 'react';

interface OptionsTableProps {
  data: any[];
}

export const OptionsTable = ({ data }: OptionsTableProps) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée à afficher
      </div>
    );
  }

  // Organiser les données : par date croissante, puis Call/Put
  const organizedData = useMemo(() => {
    // Séparer calls et puts
    const calls = data.filter(row =>
      row.type?.toLowerCase() === 'call' ||
      row.Type?.toLowerCase() === 'call' ||
      row.Quotes?.toLowerCase() === 'call'
    );
    const puts = data.filter(row =>
      row.type?.toLowerCase() === 'put' ||
      row.Type?.toLowerCase() === 'put' ||
      row.Quotes?.toLowerCase() === 'put'
    );

    // Trier par date puis strike price
    const sortByDateAndStrike = (a: any, b: any) => {
      // D'abord trier par date
      const dateA = new Date(a.Date || a.date || a.expiration || 0).getTime();
      const dateB = new Date(b.Date || b.date || b.expiration || 0).getTime();

      if (dateA !== dateB) {
        return dateA - dateB;
      }

      // Si même date, trier par strike price
      const strikeA = a.strikePrice || a.strike_price || a.Strike_price || a.strike || a.Strike || 0;
      const strikeB = b.strikePrice || b.strike_price || b.Strike_price || b.strike || b.Strike || 0;
      return parseFloat(strikeA) - parseFloat(strikeB);
    };

    calls.sort(sortByDateAndStrike);
    puts.sort(sortByDateAndStrike);

    const organized: any[] = [];
    const usedPuts = new Set<number>();

    // Pour chaque call, chercher le put correspondant (même date ET même strike)
    calls.forEach(call => {
      const callStrike = parseFloat(call.strikePrice || call.strike_price || call.Strike_price || call.strike || call.Strike || 0);
      const callDate = new Date(call.Date || call.date || call.expiration || 0).getTime();

      organized.push(call);

      const matchingPutIndex = puts.findIndex((put, index) => {
        if (usedPuts.has(index)) return false;

        const putStrike = parseFloat(put.strikePrice || put.strike_price || put.Strike_price || put.strike || put.Strike || 0);
        const putDate = new Date(put.Date || put.date || put.expiration || 0).getTime();

        // Même date ET même strike price
        return callDate === putDate && Math.abs(putStrike - callStrike) < 0.01;
      });

      if (matchingPutIndex !== -1) {
        organized.push(puts[matchingPutIndex]);
        usedPuts.add(matchingPutIndex);
      }
    });

    // Ajouter les puts restants
    puts.forEach((put, index) => {
      if (!usedPuts.has(index)) {
        organized.push(put);
      }
    });

    return organized;
  }, [data]);

  // Vérifier si organizedData est vide
  if (organizedData.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        Aucune donnée à afficher
      </div>
    );
  }

  // Extraire les colonnes depuis la première ligne de données et filtrer
  const allColumns = Object.keys(organizedData[0]);
  const columns = allColumns.filter(col =>
    !['id', 'createdAt', 'updatedAt'].includes(col)
  );

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((column) => (
                <th
                  key={column}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {column}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {organizedData.map((row, rowIndex) => {
              const isCall = (row.type?.toLowerCase() === 'call' || row.Type?.toLowerCase() === 'call' || row.Quotes?.toLowerCase() === 'call');
              const isPut = (row.type?.toLowerCase() === 'put' || row.Type?.toLowerCase() === 'put' || row.Quotes?.toLowerCase() === 'put');

              return (
                <tr
                  key={rowIndex}
                  className={`hover:bg-gray-50 ${isCall ? 'bg-green-50' : isPut ? 'bg-red-50' : ''}`}
                >
                  {columns.map((column) => (
                    <td
                      key={`${rowIndex}-${column}`}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900"
                    >
                      {typeof row[column] === 'object' && row[column] !== null
                        ? JSON.stringify(row[column])
                        : row[column]?.toString() || '-'}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
        <p className="text-sm text-gray-700">
          Total : <span className="font-medium">{organizedData.length}</span> ligne{organizedData.length > 1 ? 's' : ''}
        </p>
      </div>
    </div>
  );
};
