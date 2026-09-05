import React from 'react';
import { FilterState, Product } from '../types';
import { Filter, RotateCcw, Search, Share2 } from 'lucide-react';
import { shareSearchLink } from '../utils/shareUtils';

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (newFilters: Partial<FilterState>) => void;
  onResetFilters: () => void;
  products: Product[];
  onShowToast?: (msg: string) => void;
}

export const ProductFilters: React.FC<ProductFiltersProps> = ({
  filters,
  onFilterChange,
  onResetFilters,
  products,
  onShowToast
}) => {
  // Extract unique types and genders dynamically from loaded products
  const availableTypes = Array.from(new Set(products.map((p) => p.tipo).filter(Boolean))) as string[];
  const availableGenders = Array.from(new Set(products.map((p) => p.genero).filter(Boolean))) as string[];

  const hasActiveFilters =
    Boolean(filters.type) ||
    Boolean(filters.gender) ||
    Boolean(filters.search) ||
    Boolean(filters.brand) ||
    (filters.sortBy === 'price-asc' || filters.sortBy === 'price-desc');

  const handleShareSearch = async () => {
    const res = await shareSearchLink(filters.search, filters.brand);
    if (res.success && onShowToast) {
      if (res.method === 'clipboard') {
        onShowToast(`🔗 ¡Enlace de búsqueda copiado al portapapeles!`);
      } else {
        onShowToast(`🔗 Compartiendo resultados de búsqueda`);
      }
    }
  };

  return (
    <div className="bg-white border-3 border-black p-2.5 sm:p-3 mb-5 shadow-[3px_3px_0px_0px_#000] space-y-2.5">
      {/* Top Row: Filter Indicator and Clear Button */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="bg-[#E5A93C] p-1 border border-black shadow-xs">
            <Filter className="w-3.5 h-3.5 text-black" />
          </div>
          <span className="font-black uppercase text-xs font-sans tracking-tight">
            FILTRAR POR:
          </span>
          {hasActiveFilters && (
            <span className="bg-black text-[#E5A93C] text-[10px] font-mono font-bold px-1.5 py-0.5 border border-black">
              FILTROS ACTIVOS
            </span>
          )}
        </div>

        {/* Clear Filters Button */}
        {hasActiveFilters && (
          <button
            onClick={() => onFilterChange({ type: '', gender: '', search: '', brand: '', sortBy: 'featured' })}
            className="bg-black text-white hover:bg-pink-600 border border-black px-2.5 py-1 font-mono text-[10px] sm:text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shrink-0"
            title="Limpiar Filtros"
          >
            <RotateCcw className="w-3 h-3" />
            <span>LIMPIAR</span>
          </button>
        )}
      </div>

      {/* Middle Row: Full-width responsive 3-column Dropdowns Grid */}
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
        {/* Tipo Filter */}
        <select
          value={filters.type}
          onChange={(e) => onFilterChange({ type: e.target.value })}
          className="w-full bg-slate-50 border-2 border-black px-2 py-1.5 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer truncate"
        >
          <option value="">TIPO (TODOS)</option>
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
          className="w-full bg-slate-50 border-2 border-black px-2 py-1.5 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer truncate"
        >
          <option value="">GÉNERO (TODOS)</option>
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
          className="w-full bg-slate-50 border-2 border-black px-2 py-1.5 font-bold text-xs text-black focus:bg-yellow-100 focus:outline-none cursor-pointer truncate"
        >
          <option value="">PRECIO (DEFECTO)</option>
          <option value="price-asc">MENOR A MAYOR</option>
          <option value="price-desc">MAYOR A MENOR</option>
        </select>
      </div>

      {/* Bottom Row: Search Bar directly below filters */}
      <div className="pt-2 border-t border-black/15 flex items-center gap-2">
        <div className="relative flex-1 flex items-center">
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

        {/* Share search link button */}
        {(filters.search || filters.brand) && (
          <button
            onClick={handleShareSearch}
            title="Compartir enlace de esta búsqueda"
            className="bg-yellow-300 hover:bg-yellow-400 text-black border-2 border-black px-2.5 py-1.5 font-mono text-xs font-black flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap flex-shrink-0"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Compartir Búsqueda</span>
          </button>
        )}
      </div>
    </div>
  );
};
