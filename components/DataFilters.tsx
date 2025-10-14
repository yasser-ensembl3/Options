'use client';

interface DataFiltersProps {
  filters: {
    quotes: string;
    minStrike: string;
    maxStrike: string;
    minVolatility: string;
    maxVolatility: string;
    isWeekly: string;
    minDate: string;
    maxDate: string;
  };
  onFilterChange: (filters: any) => void;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onSortChange: (column: string) => void;
}

export const DataFilters = ({
  filters,
  onFilterChange,
  sortBy,
  sortOrder,
  onSortChange,
}: DataFiltersProps) => {
  const updateFilter = (key: string, value: string) => {
    onFilterChange({ ...filters, [key]: value });
  };

  const resetFilters = () => {
    onFilterChange({
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

  return (
    <div className="bg-white p-6 rounded-lg shadow mb-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Filtres et Tri</h2>
        <button
          onClick={resetFilters}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          Réinitialiser
        </button>
      </div>

      {/* Filtres */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-6">
        {/* Type (Call/Put) */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type
          </label>
          <select
            value={filters.quotes}
            onChange={(e) => updateFilter('quotes', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="call">Call</option>
            <option value="put">Put</option>
          </select>
        </div>

        {/* Date Min */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Min
          </label>
          <input
            type="date"
            value={filters.minDate}
            onChange={(e) => updateFilter('minDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Date Max */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Date Max
          </label>
          <input
            type="date"
            value={filters.maxDate}
            onChange={(e) => updateFilter('maxDate', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Strike Min */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strike Min
          </label>
          <input
            type="number"
            value={filters.minStrike}
            onChange={(e) => updateFilter('minStrike', e.target.value)}
            placeholder="Min"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Strike Max */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Strike Max
          </label>
          <input
            type="number"
            value={filters.maxStrike}
            onChange={(e) => updateFilter('maxStrike', e.target.value)}
            placeholder="Max"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Volatilité Min */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volatilité Min
          </label>
          <input
            type="number"
            value={filters.minVolatility}
            onChange={(e) => updateFilter('minVolatility', e.target.value)}
            placeholder="Min"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Volatilité Max */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Volatilité Max
          </label>
          <input
            type="number"
            value={filters.maxVolatility}
            onChange={(e) => updateFilter('maxVolatility', e.target.value)}
            placeholder="Max"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Is Weekly */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Type d'option
          </label>
          <select
            value={filters.isWeekly}
            onChange={(e) => updateFilter('isWeekly', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Tous</option>
            <option value="1">Weekly</option>
            <option value="0">Standard</option>
          </select>
        </div>
      </div>

      {/* Tri */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Trier par
        </label>
        <div className="flex flex-wrap gap-2">
          {['Date', 'Strike_price', 'volatility', 'open_interest', 'bid_price', 'ask_price'].map((col) => (
            <button
              key={col}
              onClick={() => onSortChange(col)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                sortBy === col
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
  );
};
