import React from 'react';
import { FilterState, Product } from '../types';
import { Filter, RotateCcw, Search } from 'lucide-react';

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  products: Product[];
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  products
}) => {
  // Extract unique types and genders dynamically from loaded products
  const availableTypes = Array.from(new Set(products.map((p) => p.tipo).filter(Boolean))) as string[];
  const availableGenders = Array.from(new Set(products.map((p) => p.genero).filter(Boolean))) as string[];

  const hasActiveFilters =
    Boolean(filters.type) ||
    Boolean(filters.gender) ||
    Boolean(filters.search) ||
    (filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc');

  return (
    <div className="bg-white border-3 border-black p-2 sm:p-2.5 mb-5 shadow-[3px_3px_0px_0px_#000] space-y-2">
      {/* Top Row: Single Line Filter Row */}
      <div className="flex flex-row items-center justify-between gap-1 sm:gap-2">
        {/* Left Indicator */}
        <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
          <div className="bg-pink-400 p-0.5 sm:p-1 border border-black shadow-xs">
            <Filter className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-black" />
          </div>
          <span className="font-black uppercase text-[9px] sm:text-xs font-sans tracking-tight whitespace-nowrap">
            FILTRAR POR:
          </span>
        </div>

        {/* Dropdowns inline in single row */}
        <div className="grid grid-cols-3 gap-1 sm:gap-1.5 flex-1 min-w-0 max-w-lg">
          {/* Tipo Filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full bg-slate-50 border-2 border-black px-1 sm:px-2 py-1 font-bold text-[10px] sm:text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer truncate"
          >
            <option value="">TIPO</option>
            {availableTypes.map((t) => (
              <option key={t} value={t}>
                {t.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Género Filter */}
          <select
            value={filters.gender}
            onChange={(e) => onFilterChange({ gender: e.target.value })}
            className="w-full bg-slate-50 border-2 border-black px-1 sm:px-2 py-1 font-bold text-[10px] sm:text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer truncate"
          >
            <option value="">GÉNERO</option>
            {availableGenders.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Precio Sort Filter */}
          <select
            value={filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc' ? filters.sortBy : ''}
            onChange={(e) =>
              onFilterChange({
                sortBy: (e.target.value as 'price-asc' | 'price-desc') || 'featured'
              })
            }
            className="w-full bg-slate-50 border-2 border-black px-1 sm:px-2 py-1 font-bold text-[10px] sm:text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer truncate"
          >
            <option value="">PRECIO</option>
            <option value="price-asc">MENOR A MAYOR</option>
            <option value="price-desc">MAYOR A MENOR</option>
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => onFilterChange({ type: '', gender: '', search: '', sortBy: 'featured' })}
            className="bg-black text-white hover:bg-pink-600 border border-black px-2 py-1 font-mono text-[9px] sm:text-xs font-bold flex items-center justify-center gap-0.5 sm:gap-1 cursor-pointer transition-colors flex-shrink-0"
            title="Limpiar Filtros"
          >
            <RotateCcw className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
            <span className="hidden xs:inline">LIMPIAR</span>
          </button>
        )}
      </div>

      {/* Bottom Row: Search Bar directly below filters */}
      <div className="pt-1.5 border-t border-black/20">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-2.5 text-black pointer-events-none" />
          <input
            type="search"
            enterKeyHint="search"
            autoCapitalize="none"
            autoComplete="off"
            value={filters.search}
            onChange={(e) => onFilterChange({ search: e.target.value })}
            placeholder="Buscar por nombre de perfume, marca, desodorante..."
            className="w-full bg-slate-50 border-2 border-black pl-8 pr-7 py-1.5 font-bold text-[16px] sm:text-xs text-black placeholder:text-black/50 focus:outline-none focus:bg-yellow-100 focus:shadow-[2px_2px_0px_0px_#000] transition-all"
          />
          {filters.search && (
            <button
              onClick={() => onFilterChange({ search: '' })}
              className="absolute right-2 text-xs bg-black text-white px-1.5 py-0.2 font-mono font-bold hover:bg-pink-500 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

