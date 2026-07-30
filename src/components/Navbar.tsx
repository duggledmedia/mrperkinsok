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
      {/* Top Moving Marquee Ticker */}
      <div className="bg-yellow-300 border-b-2 border-black py-1 overflow-hidden whitespace-nowrap select-none font-mono font-black text-xs uppercase tracking-wider text-black">
        <div className="inline-flex animate-marquee gap-8 items-center">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2">
                <span className="bg-black text-yellow-300 px-1.5 py-0.2 text-[10px] font-mono font-black">
                  MR. PERKINS
                </span>
                <span>PERFUMERÍA IMPORTADA & DESODORANTES AL MEJOR PRECIO</span>
              </span>
              <span>✦</span>
              <span>⚡ ENVÍOS A TODO EL PAÍS</span>
              <span>✦</span>
              <span>💳 HASTA 3 CUOTAS SIN INTERÉS</span>
              <span>✦</span>
              <span>🔥 STOCK Y PRECIOS EN TIEMPO REAL</span>
              <span>✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Navbar */}
      <div className="max-w-7xl mx-auto px-3 py-2 flex flex-col md:flex-row items-center justify-between gap-2 md:gap-4">
        {/* Brand Logo & Name (Smaller) */}
        <div className="flex items-center gap-2.5 w-full md:w-auto justify-between">
          <a href="#" className="flex items-center gap-2.5 group">
            <div className="bg-white border-2 border-black p-0.5 shadow-[2px_2px_0px_0px_#000] group-hover:translate-x-0.5 group-hover:translate-y-0.5 transition-transform overflow-hidden flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 flex-shrink-0">
              <img
                src="https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png"
                alt="Mr. Perkins Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tighter uppercase leading-none font-sans">
                MR. PERKINS
              </h1>
              <p className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest text-black/70 uppercase">
                Perfumes & Desodorantes
              </p>
            </div>
          </a>

          {/* Mobile Cart Trigger */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={onOpenCart}
              className="bg-lime-300 border-2 border-black p-1.5 font-black flex items-center gap-1 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
            >
              <ShoppingBag className="w-4 h-4" />
              <span className="bg-black text-white text-[11px] px-1.5 py-0.2 font-mono">
                {cartCount}
              </span>
            </button>
          </div>
        </div>

        {/* Search Bar */}
        <div className="w-full md:max-w-md relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 absolute left-3 text-black pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar perfume, marca, desodorante..."
              className="w-full bg-slate-50 border-2 border-black pl-9 pr-7 py-1.5 font-bold text-xs text-black placeholder:text-black/50 focus:outline-none focus:bg-white focus:shadow-[3px_3px_0px_0px_#000] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 text-xs bg-black text-white px-1.5 py-0.2 font-mono font-bold hover:bg-pink-500"
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
            className="bg-lime-300 hover:bg-lime-400 border-2 border-black px-3.5 py-1.5 font-black uppercase text-xs flex items-center gap-2 shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Mi Carrito</span>
            <span className="bg-black text-lime-300 text-[11px] px-1.5 py-0.2 font-mono font-bold border border-black">
              {cartCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};
