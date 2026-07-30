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
  // Extract unique types, genders, and tags dynamically from loaded products
  const availableTypes = Array.from(new Set(products.map((p) => p.tipo).filter(Boolean))) as string[];
  const availableGenders = Array.from(new Set(products.map((p) => p.genero).filter(Boolean))) as string[];
  
  const allTags = Array.from(
    new Set(products.flatMap((p) => p.clasificacion || []).filter(Boolean))
  ).sort() as string[];

  const hasActiveFilters =
    Boolean(filters.search) ||
    Boolean(filters.brand) ||
    Boolean(filters.type) ||
    Boolean(filters.gender) ||
    Boolean(filters.tag) ||
    filters.inStockOnly;

  return (
    <div className="bg-white border-3 border-black p-2.5 sm:p-3 mb-6 shadow-[4px_4px_0px_0px_#000]">
      {/* Compact Header & Controls Grid */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-2">
        {/* Left Indicator */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <div className="bg-pink-400 p-1 border border-black shadow-xs">
            <Filter className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-black uppercase text-xs font-sans tracking-wide">
            FILTROS
          </span>
          <span className="text-[10px] font-mono font-bold bg-yellow-300 px-1.5 py-0.2 border border-black">
            {products.length}
          </span>
        </div>

        {/* Filters Inline Form Row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 flex-1">
          {/* Tipo Filter */}
          <select
            value={filters.type}
            onChange={(e) => onFilterChange({ type: e.target.value })}
            className="w-full bg-slate-50 border-2 border-black px-2 py-1 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer"
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
            className="w-full bg-slate-50 border-2 border-black px-2 py-1 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer"
          >
            <option value="">TODOS LOS GÉNEROS</option>
            {availableGenders.map((g) => (
              <option key={g} value={g}>
                {g.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Tags Dropdown Menu (REQUERIDO POR EL USUARIO) */}
          <select
            value={filters.tag}
            onChange={(e) => onFilterChange({ tag: e.target.value })}
            className="w-full bg-pink-50 border-2 border-black px-2 py-1 font-bold text-xs text-black focus:bg-pink-200 focus:outline-none cursor-pointer"
          >
            <option value="">MENÚ ETIQUETAS / NOTAS</option>
            {allTags.map((tag) => (
              <option key={tag} value={tag}>
                #{tag.toUpperCase()}
              </option>
            ))}
          </select>

          {/* Ordenar por Filter */}
          <select
            value={filters.sortBy}
            onChange={(e) => onFilterChange({ sortBy: e.target.value as any })}
            className="w-full bg-slate-50 border-2 border-black px-2 py-1 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer"
          >
            <option value="featured">DESTACADOS</option>
            <option value="price-asc">MENOR PRECIO</option>
            <option value="price-desc">MAYOR PRECIO</option>
            <option value="name">NOMBRE (A-Z)</option>
          </select>

          {/* Solo Disponibles Toggle */}
          <button
            onClick={() => onFilterChange({ inStockOnly: !filters.inStockOnly })}
            className={`w-full border-2 border-black px-2 py-1 font-extrabold text-[11px] uppercase flex items-center justify-between transition-colors cursor-pointer ${
              filters.inStockOnly
                ? 'bg-lime-400 text-black shadow-xs'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <span className="truncate">SOLO STOCK</span>
            <div
              className={`w-3.5 h-3.5 border border-black flex items-center justify-center flex-shrink-0 ${
                filters.inStockOnly ? 'bg-black text-lime-400' : 'bg-white'
              }`}
            >
              {filters.inStockOnly && <Check className="w-2.5 h-2.5 stroke-[3]" />}
            </div>
          </button>
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={onResetFilters}
            className="bg-black text-white hover:bg-pink-600 border border-black px-2.5 py-1 font-mono text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer transition-colors flex-shrink-0"
          >
            <RotateCcw className="w-3 h-3" />
            <span>LIMPIAR</span>
          </button>
        )}
      </div>
    </div>
  );
};

