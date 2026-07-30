import React from 'react';
import { ShoppingBag } from 'lucide-react';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      {/* Top Moving Marquee Ticker & Main Header Title (Scrolls away with page) */}
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

      {/* Main Header Title Bar (Scrolls away with the page) */}
      <header className="bg-white border-b-3 border-black py-2.5 px-4 shadow-[0_2px_0_0_#000]">
        <div className="max-w-7xl mx-auto flex items-center justify-center text-center">
          <button onClick={scrollToTop} className="cursor-pointer group flex flex-col items-center">
            <h1 className="text-lg sm:text-xl md:text-2xl font-black tracking-tight uppercase leading-none font-sans text-black group-hover:text-pink-600 transition-colors">
              MR. PERKINS
            </h1>
          </button>
        </div>
      </header>

      {/* FLOATING LOGO BOX (Top Left - Fixed on Scroll with Floating Animation) */}
      <div className="fixed top-2.5 left-2.5 sm:top-3.5 sm:left-4 z-50 animate-float">
        <button
          onClick={scrollToTop}
          title="Ir al inicio - Mr. Perkins"
          aria-label="Ir al inicio"
          className="bg-white border-3 border-black p-0.5 sm:p-1 shadow-[3px_3px_0px_0px_#000] hover:scale-105 active:scale-95 transition-transform overflow-hidden flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 cursor-pointer"
        >
          <img
            src="https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png"
            alt="Mr. Perkins Logo"
            className="w-full h-full object-contain"
          />
        </button>
      </div>

      {/* FLOATING CART BOX (Top Right - Fixed on Scroll with Floating Animation) */}
      <div className="fixed top-2.5 right-2.5 sm:top-3.5 sm:right-4 z-50 animate-float-delayed">
        <button
          onClick={onOpenCart}
          title="Abrir Carrito"
          className="bg-lime-300 hover:bg-lime-400 border-3 border-black px-2.5 py-1.5 sm:px-3.5 sm:py-2 font-black uppercase text-xs flex items-center gap-1.5 shadow-[3px_3px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer"
        >
          <ShoppingBag className="w-4 h-4 text-black stroke-[2.5]" />
          <span className="hidden sm:inline font-black text-black tracking-wide">MI CARRITO</span>
          <span className="bg-black text-lime-300 text-[10px] sm:text-[11px] px-1.5 py-0.2 font-mono font-bold border border-black">
            {cartCount}
          </span>
        </button>
      </div>
    </>
  );
};


