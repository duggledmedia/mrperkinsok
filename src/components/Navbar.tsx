import React from 'react';
import { ShoppingBag, Search } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  searchQuery,
  onSearchChange,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white border-b-4 border-black shadow-[0_4px_0_0_#000]">
      {/* Top Warning / Promo Bar */}
      <div className="bg-yellow-300 border-b-2 border-black px-4 py-1.5 font-mono text-xs font-bold uppercase tracking-wider overflow-x-auto flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 whitespace-nowrap">
          <span className="bg-black text-yellow-300 px-1.5 py-0.5 text-[10px] font-black">EXCLUSIVO</span>
          <span>⚡ Las Mejores Fragancias.. Al mejor Precio</span>
        </div>
        <div className="flex items-center gap-3 whitespace-nowrap text-[11px]">
          <span>🔥 ENVIOS GRATIS CABA EN COMPRAS $50.000+</span>
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between">
          <a href="#" className="flex items-center gap-3 group">
            <div className="bg-white border-3 border-black p-1 shadow-[4px_4px_0px_0px_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform overflow-hidden flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 flex-shrink-0">
              <img
                src="https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png"
                alt="Mr. Perkins Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black tracking-tighter uppercase leading-none font-sans">
                MR. PERKINS
              </h1>
              <p className="text-[11px] font-mono font-bold tracking-widest text-black/70 uppercase">
                Perfumes & Desodorantes
              </p>
            </div>
          </a>

          {/* Mobile Cart Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenCart}
              className="bg-lime-300 border-2 border-black p-2 font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="bg-black text-white text-xs px-1.5 py-0.5 font-mono">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:max-w-md relative">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-3 text-black pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar perfume, desodorante, marca (ej: Sauvage, Dior, Citrus)..."
              className="w-full bg-slate-50 border-3 border-black pl-10 pr-4 py-2 font-bold text-sm text-black placeholder:text-black/50 focus:outline-none focus:bg-white focus:shadow-[4px_4px_0px_0px_#000] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 text-xs bg-black text-white px-1.5 py-0.5 font-mono font-bold hover:bg-pink-500"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Desktop Cart Button */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onOpenCart}
            className="bg-lime-300 hover:bg-lime-400 border-3 border-black px-4 py-2 font-black uppercase text-sm flex items-center gap-2 shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-5 h-5" />
            <span>Mi Carrito</span>
            <span className="bg-black text-lime-300 text-xs px-2 py-0.5 font-mono font-bold border border-black">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
