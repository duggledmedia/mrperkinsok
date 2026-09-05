import React, { useState } from 'react';
import { ShoppingBag, Compass, Store, Sparkles, Tag, Menu, X, ArrowRight } from 'lucide-react';
import { BRAND_LOGO_PATH, trackFunnelEvent } from '../utils/constants';

interface NavbarProps {
  cartCount: number;
  onOpenCart: () => void;
  activeView: 'home' | 'tienda' | 'ofertas';
  onNavigate: (view: 'home' | 'tienda' | 'ofertas') => void;
  onStartTest: () => void;
  onScrollToBrands: () => void;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  cartCount,
  onOpenCart,
  activeView,
  onNavigate,
  onStartTest,
  onScrollToBrands
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTestClick = () => {
    trackFunnelEvent('navbar_encontra_tu_perfume_click');
    setIsMobileMenuOpen(false);
    onStartTest();
  };

  const handleNavClick = (view: 'home' | 'tienda' | 'ofertas') => {
    trackFunnelEvent(`navbar_nav_${view}`);
    setIsMobileMenuOpen(false);
    onNavigate(view);
  };

  const handleBrandsClick = () => {
    trackFunnelEvent('navbar_marcas_click');
    setIsMobileMenuOpen(false);
    onScrollToBrands();
  };

  return (
    <header className="sticky top-0 z-40 bg-[#0D0D0D] border-b-4 border-black text-white shadow-md">
      {/* Top Editorial Marquee */}
      <div className="bg-[#E5A93C] text-black border-b-2 border-black py-1 overflow-hidden whitespace-nowrap select-none font-mono font-black text-xs uppercase tracking-wider">
        <div className="inline-flex animate-marquee gap-8 items-center">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2">
                <span className="bg-black text-[#E5A93C] px-1.5 py-0.2 text-[10px] font-mono font-black">
                  Mr . Perkins
                </span>
                <span>SOMMELIER DE FRAGANCIAS</span>
              </span>
              <span>✦</span>
              <span>⚡ ENVÍOS A TODO EL PAÍS</span>
              <span>✦</span>
              <span>💳 HASTA 3 CUOTAS SIN INTERÉS</span>
              <span>✦</span>
              <span>💎 100% ORIGINALES CON GARANTÍA</span>
              <span>✦</span>
              <span>🌿 ASESORAMIENTO DIRECTO POR WHATSAPP</span>
              <span>✦</span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Main Sticky Navbar Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20 gap-2 sm:gap-4">
          
          {/* Logo & Brand Name */}
          <button
            onClick={() => handleNavClick('home')}
            className="flex items-center gap-2.5 sm:gap-3 text-left cursor-pointer group"
          >
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-black border-2 border-[#E5A93C] p-0.5 shadow-[2px_2px_0px_0px_#fff] group-hover:scale-105 transition-transform flex items-center justify-center shrink-0">
              <img
                src={BRAND_LOGO_PATH}
                alt="Mr. Perkins"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl font-black uppercase tracking-tight text-white font-serif leading-none group-hover:text-[#E5A93C] transition-colors">
                Mr . Perkins
              </span>
              <span className="text-[9px] sm:text-[10px] font-mono font-bold tracking-widest text-[#E5A93C] uppercase mt-0.5">
                Sommelier de Fragancias
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            
            {/* ENCONTRÁ TU PERFUME (Hero differentiator button) */}
            <button
              onClick={handleTestClick}
              className="bg-[#E5A93C] hover:bg-[#d6982f] text-black border-2 border-black px-3.5 py-1.5 font-sans font-black text-xs uppercase tracking-wide flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#fff] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ENCONTRÁ TU PERFUME</span>
            </button>

            {/* TIENDA */}
            <button
              onClick={() => handleNavClick('tienda')}
              className={`px-3 py-1.5 font-sans font-black text-xs uppercase tracking-wide border-2 transition-all cursor-pointer ${
                activeView === 'tienda'
                  ? 'bg-white text-black border-white shadow-[2px_2px_0px_0px_#E5A93C]'
                  : 'bg-transparent text-slate-200 border-transparent hover:border-white/40 hover:text-white'
              }`}
            >
              TIENDA
            </button>

            {/* MARCAS */}
            <button
              onClick={handleBrandsClick}
              className="px-3 py-1.5 font-sans font-bold text-xs uppercase tracking-wide text-slate-200 hover:text-[#E5A93C] transition-colors cursor-pointer"
            >
              MARCAS
            </button>

            {/* OFERTAS */}
            <button
              onClick={() => handleNavClick('ofertas')}
              className={`px-3 py-1.5 font-sans font-black text-xs uppercase tracking-wide border-2 transition-all cursor-pointer ${
                activeView === 'ofertas'
                  ? 'bg-pink-500 text-white border-pink-500 shadow-[2px_2px_0px_0px_#fff]'
                  : 'bg-transparent text-pink-400 border-transparent hover:border-pink-500/40'
              }`}
            >
              OFERTAS
            </button>
          </nav>

          {/* Right Action Area: Cart + Mobile Menu Toggle */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Cart Button */}
            <button
              onClick={onOpenCart}
              className="bg-lime-400 hover:bg-lime-500 text-black border-2 sm:border-3 border-black px-2.5 sm:px-3.5 py-1.5 font-black text-xs uppercase flex items-center gap-1.5 shadow-[2px_2px_0px_0px_#fff] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
              title="Abrir Carrito"
            >
              <ShoppingBag className="w-4 h-4 stroke-[2.5]" />
              <span className="hidden sm:inline font-sans">MI CARRITO</span>
              <span className="bg-black text-lime-400 font-mono text-[10px] sm:text-xs px-1.5 py-0.2 font-black border border-black">
                {cartCount}
              </span>
            </button>

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-white border-2 border-white/30 hover:border-white cursor-pointer"
              aria-label="Abrir menú"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>

        </div>

      </div>

      {/* Mobile Drawer Menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-[#121212] border-t-2 border-[#333] p-4 space-y-3 animate-in slide-in-from-top-2 duration-200">
          
          <button
            onClick={handleTestClick}
            className="w-full bg-[#E5A93C] text-black border-2 border-black p-3 font-sans font-black text-xs uppercase tracking-wide flex items-center justify-between shadow-[3px_3px_0px_0px_#fff]"
          >
            <span className="flex items-center gap-2">
              <Compass className="w-4 h-4 stroke-[2.5]" />
              ENCONTRÁ TU PERFUME (TEST)
            </span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleNavClick('home')}
              className={`p-2.5 text-xs font-black uppercase text-center border ${
                activeView === 'home' ? 'bg-white text-black border-white' : 'bg-[#1F1F1F] text-white border-[#333]'
              }`}
            >
              INICIO
            </button>
            <button
              onClick={() => handleNavClick('tienda')}
              className={`p-2.5 text-xs font-black uppercase text-center border ${
                activeView === 'tienda' ? 'bg-white text-black border-white' : 'bg-[#1F1F1F] text-white border-[#333]'
              }`}
            >
              TIENDA
            </button>
            <button
              onClick={() => handleNavClick('ofertas')}
              className={`p-2.5 text-xs font-black uppercase text-center border ${
                activeView === 'ofertas' ? 'bg-pink-500 text-white border-pink-500' : 'bg-[#1F1F1F] text-pink-400 border-[#333]'
              }`}
            >
              OFERTAS
            </button>
          </div>

          <button
            onClick={handleBrandsClick}
            className="w-full text-left p-2.5 bg-[#1F1F1F] border border-[#333] text-xs font-mono font-bold text-slate-300 uppercase"
          >
            EXPLORAR TODAS LAS MARCAS
          </button>
        </div>
      )}
    </header>
  );
};
