import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Sparkles, ChevronLeft, ChevronRight, Tag, Truck, CreditCard, MapPin } from 'lucide-react';
import { ComicSticker, getProductStickers } from './ComicSticker';

interface AnimatedCarouselHeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onImageError?: (productId: string) => void;
}

const PROMO_CARDS = [
  {
    id: 'promo-1',
    text: 'Envío sin cargo en Caba (*)',
    subtitle: 'En compras mayores a $45.000',
    bg: 'bg-yellow-300',
    textColor: 'text-black',
    icon: Truck,
    badge: 'GRATIS'
  },
  {
    id: 'promo-2',
    text: 'Hasta 3 cuotas sin interés',
    subtitle: 'Con todas las tarjetas bancarias',
    bg: 'bg-pink-400',
    textColor: 'text-black',
    icon: CreditCard,
    badge: '3 CUOTAS'
  },
  {
    id: 'promo-3',
    text: 'Envíos a todo el País',
    subtitle: 'Por Correo Argentino y Andreani',
    bg: 'bg-cyan-300',
    textColor: 'text-black',
    icon: MapPin,
    badge: 'NACONAL'
  }
];

export const AnimatedCarouselHeader: React.FC<AnimatedCarouselHeaderProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onImageError
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Auto rotate spotlight product
  useEffect(() => {
    if (products.length === 0 || isPaused) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 3800);
    return () => clearInterval(interval);
  }, [products.length, isPaused]);

  if (products.length === 0) return null;

  const currentProduct = products[currentIndex % products.length];

  return (
    <div className="bg-slate-950 text-white border-b-4 border-black overflow-hidden relative">
      {/* Brutalist Background Texture pattern */}
      <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px] pointer-events-none" />

      {/* Main Banner Hero Container */}
      <div className="max-w-7xl mx-auto px-3 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
          
          {/* Left Column: Brand Header Statement */}
          <div className="lg:col-span-5 space-y-3">
            <div className="inline-flex items-center gap-1.5 bg-pink-500 text-black border-2 border-black px-2.5 py-0.5 text-xs font-black uppercase shadow-[2px_2px_0px_0px_#fff]">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DESCUENTOS & DIRECTO DE STOCK</span>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="bg-white border-2 border-black p-1 shadow-[3px_3px_0px_0px_#fff] flex-shrink-0 w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 flex items-center justify-center">
                <img
                  src="https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png"
                  alt="Mr. Perkins Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-tight leading-none text-white drop-shadow-[2px_2px_0px_#000]">
                  MR. PERKINS
                </h2>
                <span className="text-yellow-300 bg-black px-1.5 py-0.5 border border-yellow-300 inline-block mt-0.5 text-xs sm:text-sm font-mono font-bold">
                  PERFUMERÍA IMPORTADA
                </span>
              </div>
            </div>

            <p className="text-slate-300 font-sans text-xs sm:text-sm max-w-md">
              Fragancias importadas y desodorantes de máxima concentración con stock en tiempo real.
            </p>
          </div>

          {/* Right Column: Dynamic Rotating Spotlight Product WITH ANIMATED COMIC STICKERS */}
          <div className="lg:col-span-7 relative">
            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="bg-white text-black border-4 border-black p-3 sm:p-5 shadow-[6px_6px_0px_0px_#FF007F] relative transition-all"
            >
              {/* Badge Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-300 text-black border border-black font-mono font-bold text-[11px] px-2 py-0.5">
                    PRODUCTO DESTACADO
                  </span>
                  <span className="text-[10px] font-mono font-extrabold uppercase bg-slate-100 px-1.5 py-0.5 border border-black">
                    {currentIndex + 1} / {products.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)}
                    className="bg-black text-white hover:bg-yellow-300 hover:text-black p-1 border border-black transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % products.length)}
                    className="bg-black text-white hover:bg-yellow-300 hover:text-black p-1 border border-black transition-colors cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Spotlight Product Details */}
              {currentProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
                  <div className="sm:col-span-5 relative group cursor-pointer" onClick={() => onSelectProduct(currentProduct)}>
                    <div className="aspect-square bg-slate-100 border-2 border-black overflow-hidden relative">
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

                      {/* Comic Bubble Stickers Overlay for Spotlight Product */}
                      <div className="absolute bottom-1.5 left-1.5 flex flex-col items-start gap-1 z-20 pointer-events-none">
                        {getProductStickers(currentProduct.id).map((s, idx) => (
                          <ComicSticker
                            key={idx}
                            text={s.text}
                            bg={s.bg}
                            rotate={s.rotate}
                            animation={s.animation}
                          />
                        ))}
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

                  <div className="sm:col-span-7 space-y-1.5">
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

                    <h3
                      onClick={() => onSelectProduct(currentProduct)}
                      className="text-base sm:text-lg md:text-xl font-black uppercase leading-tight hover:text-pink-600 cursor-pointer font-sans"
                    >
                      {currentProduct.producto}
                    </h3>

                    <p className="text-[11px] text-slate-700 line-clamp-2 font-sans leading-snug">
                      {currentProduct.descripcion}
                    </p>

                    <div className="pt-1 flex flex-row items-center justify-between gap-2">
                      <div>
                        <span className="text-[9px] text-slate-500 font-mono uppercase block">Precio Venta</span>
                        <span className="text-lg sm:text-xl font-black text-black font-mono">
                          ${currentProduct.precioVenta.toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onSelectProduct(currentProduct)}
                          className="bg-slate-100 hover:bg-slate-200 border border-black px-2 py-1 font-bold text-[11px] uppercase cursor-pointer"
                        >
                          Ver
                        </button>
                        <button
                          disabled={currentProduct.stock === 'No'}
                          onClick={(e) => onAddToCart(currentProduct, e)}
                          className={`border-2 border-black px-2.5 py-1 font-black text-[11px] uppercase transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
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
    </div>
  );
};
