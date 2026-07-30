import React from 'react';
import { FilterState, Product } from '../types';
import { Filter, RotateCcw, Check, ArrowUpDown, Tag } from 'lucide-react';

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

  const hasActiveFilters = Boolean(filters.type) || Boolean(filters.gender);

  return (
    <div className="bg-white border-3 border-black p-2 sm:p-2.5 mb-6 shadow-[4px_4px_0px_0px_#000]">
      {/* Compact Header & Controls Grid */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        {/* Left Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-pink-400 p-1 border border-black shadow-xs">
            <Filter className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-black uppercase text-xs font-sans tracking-wide">
            FILTRAR POR:
          </span>
        </div>

        {/* Filters Inline Form Row: ONLY Tipos & Genero */}
        <div className="grid grid-cols-2 gap-2 flex-1 max-w-lg">
          {/* Tipo Filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full bg-slate-50 border-2 border-black px-2.5 py-1.5 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer"
          >
            <option value="">TODOS LOS TIPOS</option>
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
            className="w-full bg-slate-50 border-2 border-black px-2.5 py-1.5 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer"
          >
            <option value="">TODOS LOS GÉNEROS</option>
            {availableGenders.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => onFilterChange({ type: '', gender: '' })}
            className="bg-black text-white hover:bg-pink-600 border border-black px-3 py-1.5 font-mono text-xs font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>LIMPIAR FILTROS</span>
          </button>
        )}
      </div>
    </div>
  );
};

