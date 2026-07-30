import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Truck, CreditCard, MapPin, Share2 } from 'lucide-react';
import { shareProductLink } from '../utils/shareUtils';

interface AnimatedCarouselHeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onImageError?: (productId: string) => void;
  onShowToast?: (msg: string) => void;
}

const CIRCULAR_STICKERS = [
  {
    text: "3 CUOTAS SIN INTERÉS",
    bg: "bg-pink-400",
    textColor: "text-black",
    rotate: "rotate-6"
  },
  {
    text: "ENVÍO BONIFICADO EN CABA",
    bg: "bg-yellow-300",
    textColor: "text-black",
    rotate: "-rotate-6"
  },
  {
    text: "5% DE DESCUENTO EN EFECTIVO",
    bg: "bg-lime-300",
    textColor: "text-black",
    rotate: "rotate-3"
  },
  {
    text: "OFERTA HASTA AGOTAR STOCK",
    bg: "bg-cyan-300",
    textColor: "text-black",
    rotate: "-rotate-3"
  }
];

export const AnimatedCarouselHeader: React.FC<AnimatedCarouselHeaderProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onImageError,
  onShowToast
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotate spotlight product slower (10 seconds)
  useEffect(() => {
    if (products.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 10000);
    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  if (products.length === 0) return null;

  const currentProduct = products[currentIndex % products.length];
  const currentSticker = CIRCULAR_STICKERS[currentIndex % CIRCULAR_STICKERS.length];

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentProduct) return;
    const res = await shareProductLink(currentProduct);
    if (res.success && onShowToast) {
      if (res.method === 'clipboard') {
        onShowToast(`🔗 ¡Enlace de ${currentProduct.producto} copiado!`);
      } else if (res.method === 'native') {
        onShowToast(`🔗 Compartiendo ${currentProduct.producto}`);
      }
    }
  };

  return (
    <div className="bg-slate-950 text-white border-b-4 border-black overflow-hidden relative">
      {/* Brutalist Background Texture pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Banner Hero Container */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 md:py-6 flex flex-col items-start gap-5">
        
        {/* Top Header Statement (Left Aligned) */}
        <div className="flex flex-col items-center sm:items-start text-center sm:text-left gap-2 max-w-3xl w-full">
          <div className="flex flex-col sm:flex-row items-center justify-start gap-2 sm:gap-3">
            <div className="bg-white border-2 border-black p-1 shadow-[3px_3px_0px_0px_#fff] flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
              <img
                src="https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png"
                alt="Mr. Perkins Logo"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-black uppercase tracking-tight leading-none text-white drop-shadow-[2px_2px_0px_#000]">
                MR. PERKINS
              </h2>
              <span className="text-yellow-300 bg-black px-2 py-0.5 border border-yellow-300 inline-block mt-1 text-xs sm:text-sm font-mono font-bold uppercase">
                Todas las fragancias al mejor precio del mercado
              </span>
            </div>
          </div>

          <p className="text-slate-300 font-sans text-xs sm:text-sm mt-0.5">
            Fragancias importadas, Colonias, Desodorantes, Cuidado Capilar y de la Piel
          </p>
        </div>

        {/* Dynamic Rotating Spotlight Product Carousel Box */}
        <div className="w-full relative text-left">
          <div
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="bg-white text-black border-4 border-black p-3 sm:p-5 shadow-[6px_6px_0px_0px_#FF007F] relative transition-all overflow-hidden"
          >
            {/* Circular Sticker Badge Top Right */}
            {currentSticker && (
              <div
                className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-30 w-18 h-18 sm:w-22 sm:h-22 md:w-24 md:h-24 rounded-full ${currentSticker.bg} ${currentSticker.textColor} ${currentSticker.rotate} border-3 border-black shadow-[4px_4px_0px_0px_#000] flex items-center justify-center text-center font-black font-mono leading-none p-1.5 sm:p-2 text-[9px] sm:text-[11px] uppercase tracking-tight animate-pulse select-none cursor-default`}
              >
                <span>{currentSticker.text}</span>
              </div>
            )}

            {/* Giant animated repeating SALE background layer covering entire header area */}
            <div className="absolute -inset-36 sm:-inset-56 md:-inset-72 pointer-events-none z-0 overflow-hidden select-none opacity-25 flex flex-col justify-center -space-y-3 sm:-space-y-5 animate-sale-zoom">
              {/* Row 1: Sliding Left */}
              <div className="flex whitespace-nowrap animate-sale-slide-left gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r1-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-600 drop-shadow-[3px_3px_0px_#000] font-sans italic uppercase leading-none"
                  >
                    SALE★
                  </span>
                ))}
              </div>

              {/* Row 2: Sliding Right */}
              <div className="flex whitespace-nowrap animate-sale-slide-right gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r2-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-500 drop-shadow-[3px_3px_0px_#000] font-sans uppercase leading-none"
                  >
                    SALE!
                  </span>
                ))}
              </div>

              {/* Row 3: Sliding Left Fast */}
              <div className="flex whitespace-nowrap animate-sale-slide-left-fast gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r3-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-600 drop-shadow-[3px_3px_0px_#000] font-sans italic uppercase leading-none"
                  >
                    ★SALE
                  </span>
                ))}
              </div>

              {/* Row 4: Sliding Right */}
              <div className="flex whitespace-nowrap animate-sale-slide-right gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r4-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-500 drop-shadow-[3px_3px_0px_#000] font-sans uppercase leading-none"
                  >
                    SALE!
                  </span>
                ))}
              </div>

              {/* Row 5: Sliding Left */}
              <div className="flex whitespace-nowrap animate-sale-slide-left gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r5-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-600 drop-shadow-[3px_3px_0px_#000] font-sans italic uppercase leading-none"
                  >
                    SALE★
                  </span>
                ))}
              </div>

              {/* Row 6: Sliding Right */}
              <div className="flex whitespace-nowrap animate-sale-slide-right gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r6-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-500 drop-shadow-[3px_3px_0px_#000] font-sans uppercase leading-none"
                  >
                    SALE!
                  </span>
                ))}
              </div>

              {/* Row 7: Sliding Left Fast */}
              <div className="flex whitespace-nowrap animate-sale-slide-left-fast gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r7-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-600 drop-shadow-[3px_3px_0px_#000] font-sans italic uppercase leading-none"
                  >
                    ★SALE
                  </span>
                ))}
              </div>

              {/* Row 8: Sliding Right */}
              <div className="flex whitespace-nowrap animate-sale-slide-right gap-4">
                {[...Array(12)].map((_, i) => (
                  <span
                    key={`r8-${i}`}
                    className="font-black text-6xl sm:text-7xl md:text-8xl tracking-tighter text-red-500 drop-shadow-[3px_3px_0px_#000] font-sans uppercase leading-none"
                  >
                    SALE!
                  </span>
                ))}
              </div>
            </div>

            {/* Badge Header: OFERTAS DE LA SEMANA */}
            <div className="relative z-10 flex items-center justify-between border-b-2 border-black pb-2 mb-3 bg-white/80 backdrop-blur-xs pr-20">
              <div className="flex items-center gap-2">
                <span className="bg-yellow-300 text-black border border-black font-mono font-black text-[11px] sm:text-xs px-2.5 py-0.5 uppercase tracking-wider">
                  OFERTAS DE LA SEMANA
                </span>
              </div>
            </div>

            {/* Spotlight Product Details */}
            {currentProduct && (
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-3 sm:gap-4 items-center">
                {/* Image Box */}
                <div className="sm:col-span-5 relative group cursor-pointer" onClick={() => onSelectProduct(currentProduct)}>
                  <div className="aspect-square bg-slate-100 border-3 border-black overflow-hidden relative shadow-[4px_4px_0px_0px_#000]">
                    <img
                      src={currentProduct.imgUrl}
                      alt={currentProduct.producto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      onError={() => {
                        if (onImageError && currentProduct) {
                          onImageError(currentProduct.id);
                        }
                      }}
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.2 border border-white">
                      {currentProduct.marca}
                    </div>

                    {currentProduct.stock === 'No' ? (
                      <div className="absolute bottom-1.5 right-1.5 bg-pink-600 text-white font-black text-[10px] px-1.5 py-0.2 border border-black">
                        AGOTADO
                      </div>
                    ) : (
                      <div className="absolute bottom-1.5 right-1.5 bg-lime-400 text-black font-black text-[10px] px-1.5 py-0.2 border border-black">
                        EN STOCK
                      </div>
                    )}
                  </div>
                </div>

                {/* Details Box inside a blurry frosted container for high legibility over background */}
                <div className="sm:col-span-7 bg-white/90 backdrop-blur-md p-3.5 sm:p-4 border-3 border-black shadow-[4px_4px_0px_0px_#000] space-y-2 relative z-10">
                  <div className="flex items-center justify-between gap-1.5 flex-wrap">
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono font-bold">
                      <span className="bg-purple-200 text-black px-1.5 py-0.2 border border-black uppercase">
                        {currentProduct.tipo}
                      </span>
                      <span className="bg-cyan-200 text-black px-1.5 py-0.2 border border-black uppercase">
                        {currentProduct.genero}
                      </span>
                      <span className="bg-slate-200 text-black px-1.5 py-0.2 border border-black">
                        {currentProduct.cantidad}
                      </span>
                    </div>

                    {/* Share product button */}
                    <button
                      onClick={handleShare}
                      title="Compartir producto"
                      className="bg-yellow-300 hover:bg-yellow-400 text-black border border-black px-2 py-0.5 text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer shadow-[1.5px_1.5px_0px_0px_#000]"
                    >
                      <Share2 className="w-3 h-3" />
                      <span>Compartir</span>
                    </button>
                  </div>

                  <h3
                    onClick={() => onSelectProduct(currentProduct)}
                    className="text-base sm:text-lg md:text-xl font-black uppercase leading-tight hover:text-pink-600 cursor-pointer font-sans text-black"
                  >
                    {currentProduct.producto}
                  </h3>

                  <p className="text-[11px] sm:text-xs text-slate-800 line-clamp-2 font-sans leading-snug">
                    {currentProduct.descripcion}
                  </p>

                  <div className="pt-2 border-t border-black/20 flex flex-row items-center justify-between gap-2">
                    <div>
                      <span className="text-[9px] text-slate-600 font-mono uppercase block">Precio Venta</span>
                      <span className="text-lg sm:text-xl font-black text-black font-mono">
                        ${currentProduct.precioVenta.toLocaleString('es-AR')}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onSelectProduct(currentProduct)}
                        className="bg-slate-100 hover:bg-slate-200 border border-black px-2.5 py-1.5 font-bold text-[11px] uppercase cursor-pointer"
                      >
                        Ver
                      </button>
                      <button
                        disabled={currentProduct.stock === 'No'}
                        onClick={(e) => onAddToCart(currentProduct, e)}
                        className={`border-2 border-black px-3 py-1.5 font-black text-[11px] uppercase transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                          currentProduct.stock === 'No'
                            ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                            : 'bg-lime-400 hover:bg-lime-500 text-black'
                        }`}
                      >
                        {currentProduct.stock === 'No' ? 'Agotado' : '+ Agregar'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
