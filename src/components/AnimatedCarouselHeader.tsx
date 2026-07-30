import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { Truck, CreditCard, MapPin, Sparkles, ChevronLeft, ChevronRight, Tag } from 'lucide-react';

interface AnimatedCarouselHeaderProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
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
  onAddToCart
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

      {/* Top Continuous Marquee Belt */}
      <div className="bg-yellow-300 text-black border-b-3 border-black py-2.5 overflow-hidden whitespace-nowrap select-none font-mono font-black text-sm uppercase tracking-wider">
        <div className="inline-flex animate-marquee gap-8 items-center">
          {[...PROMO_CARDS, ...PROMO_CARDS, ...PROMO_CARDS, ...PROMO_CARDS].map((promo, idx) => (
            <div key={`${promo.id}-${idx}`} className="inline-flex items-center gap-2 px-3 py-1 bg-black text-yellow-300 border border-black font-sans text-xs font-extrabold shadow-[2px_2px_0px_0px_#000]">
              <promo.icon className="w-4 h-4 text-pink-400" />
              <span>{promo.text}</span>
              <span className="text-[10px] bg-yellow-300 text-black px-1 py-0.2 font-mono">{promo.badge}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Banner Hero Carousel Container */}
      <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Left Column: Brand Statement & Promotional Cards */}
          <div className="lg:col-span-6 space-y-4">
            <div className="inline-flex items-center gap-2 bg-pink-500 text-black border-2 border-black px-3 py-1 text-xs font-black uppercase shadow-[3px_3px_0px_0px_#fff]">
              <Sparkles className="w-4 h-4" />
              <span>LOS MEJORES PRECIOS, TODOS LOS DÍAS</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="bg-white border-3 border-black p-1.5 shadow-[4px_4px_0px_0px_#fff] flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 flex items-center justify-center">
                <img
                  src="https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png"
                  alt="Mr. Perkins Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight leading-none text-white drop-shadow-[2px_2px_0px_#000]">
                MR. PERKINS <br />
                <span className="text-yellow-300 bg-black px-2 py-0.5 border border-yellow-300 inline-block mt-1 text-2xl md:text-4xl">
                  PERFUMERÍA RADICAL
                </span>
              </h2>
            </div>

            <p className="text-slate-300 font-sans text-sm md:text-base max-w-lg">
              Los Mejores valores de importados y desodorantes de máxima concentración. 
              Stock actualizado en tiempo real directo desde nuestro laboratorio.
            </p>

            {/* Random Animated Promo Carteles Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              {PROMO_CARDS.map((card) => {
                const IconComponent = card.icon;
                return (
                  <div
                    key={card.id}
                    className={`${card.bg} ${card.textColor} border-3 border-black p-3 shadow-[4px_4px_0px_0px_#000] hover:-translate-y-1 transition-transform relative overflow-hidden`}
                  >
                    <div className="absolute top-1 right-1 bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.5">
                      {card.badge}
                    </div>
                    <IconComponent className="w-6 h-6 mb-1 text-black" />
                    <p className="font-extrabold text-xs leading-tight uppercase font-sans">
                      {card.text}
                    </p>
                    <p className="text-[10px] opacity-80 font-mono mt-0.5">
                      {card.subtitle}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Dynamic Rotating Spotlight Product */}
          <div className="lg:col-span-6">
            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              className="bg-white text-black border-4 border-black p-4 md:p-6 shadow-[8px_8px_0px_0px_#FF007F] relative transition-all"
            >
              {/* Badge Header */}
              <div className="flex items-center justify-between border-b-2 border-black pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="bg-yellow-300 text-black border border-black font-mono font-bold text-xs px-2 py-0.5">
                    PRODUCTO DESTACADO
                  </span>
                  <span className="text-xs font-mono font-extrabold uppercase bg-slate-100 px-2 py-0.5 border border-black">
                    {currentIndex + 1} / {products.length}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev - 1 + products.length) % products.length)}
                    className="bg-black text-white hover:bg-yellow-300 hover:text-black p-1.5 border border-black transition-colors cursor-pointer"
                    title="Anterior"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentIndex((prev) => (prev + 1) % products.length)}
                    className="bg-black text-white hover:bg-yellow-300 hover:text-black p-1.5 border border-black transition-colors cursor-pointer"
                    title="Siguiente"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Spotlight Product Details */}
              {currentProduct && (
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center">
                  <div className="sm:col-span-5 relative group cursor-pointer" onClick={() => onSelectProduct(currentProduct)}>
                    <div className="aspect-square bg-slate-100 border-3 border-black overflow-hidden relative">
                      <img
                        src={currentProduct.imgUrl}
                        alt={currentProduct.producto}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                      <div className="absolute top-2 left-2 bg-black text-white text-[10px] font-mono font-bold px-2 py-0.5 border border-white">
                        {currentProduct.marca}
                      </div>
                      {currentProduct.stock === 'No' ? (
                        <div className="absolute bottom-2 right-2 bg-pink-600 text-white font-black text-xs px-2 py-0.5 border border-black">
                          AGOTADO
                        </div>
                      ) : (
                        <div className="absolute bottom-2 right-2 bg-lime-400 text-black font-black text-xs px-2 py-0.5 border border-black">
                          EN STOCK
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="sm:col-span-7 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap text-xs font-mono font-bold">
                      <span className="bg-purple-200 text-black px-2 py-0.5 border border-black uppercase">
                        {currentProduct.tipo}
                      </span>
                      <span className="bg-cyan-200 text-black px-2 py-0.5 border border-black uppercase">
                        {currentProduct.genero}
                      </span>
                      <span className="bg-slate-200 text-black px-2 py-0.5 border border-black">
                        {currentProduct.cantidad}
                      </span>
                    </div>

                    <h3
                      onClick={() => onSelectProduct(currentProduct)}
                      className="text-xl md:text-2xl font-black uppercase leading-tight hover:text-pink-600 cursor-pointer font-sans"
                    >
                      {currentProduct.producto}
                    </h3>

                    <p className="text-xs text-slate-700 line-clamp-2 font-sans">
                      {currentProduct.descripcion}
                    </p>

                    <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <span className="text-xs text-slate-500 font-mono uppercase block">Precio Venta</span>
                        <span className="text-2xl font-black text-black font-mono">
                          ${currentProduct.precioVenta.toLocaleString('es-AR')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onSelectProduct(currentProduct)}
                          className="bg-slate-100 hover:bg-slate-200 border-2 border-black px-3 py-1.5 font-bold text-xs uppercase cursor-pointer"
                        >
                          Ver Detalle
                        </button>
                        <button
                          disabled={currentProduct.stock === 'No'}
                          onClick={(e) => onAddToCart(currentProduct, e)}
                          className={`border-2 border-black px-3 py-1.5 font-black text-xs uppercase transition-all shadow-[2px_2px_0px_0px_#000] cursor-pointer ${
                            currentProduct.stock === 'No'
                              ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                              : 'bg-lime-400 hover:bg-lime-500 text-black hover:-translate-y-0.5'
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
