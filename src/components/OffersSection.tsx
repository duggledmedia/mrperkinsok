import React from 'react';
import { Product } from '../types';
import { Sparkles, Tag, ShoppingBag, Eye, Percent, ArrowRight } from 'lucide-react';
import { trackFunnelEvent, getRandomSample } from '../utils/constants';

interface OffersSectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  onGoToStoreWithFilter: (tag: string) => void;
}

export const OffersSection: React.FC<OffersSectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onGoToStoreWithFilter
}) => {
  // Find products that are on sale or have the lowest/best prices in stock, varying each time the site is opened
  const offerProducts = React.useMemo(() => {
    const valid = products.filter((p) => p.imgUrl && p.stock !== 'No');
    // Sort by price to get the best value offerings pool, then randomly sample 4
    const sorted = [...valid].sort((a, b) => a.precioVenta - b.precioVenta);
    const candidatePool = sorted.slice(0, Math.min(16, sorted.length));
    return getRandomSample(candidatePool, 4);
  }, [products]);

  return (
    <section id="ofertas" className="bg-[#FAF8F5] py-12 sm:py-16 border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-black pb-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-pink-500 text-white px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-widest mb-1.5 border border-black shadow-[2px_2px_0px_0px_#000]">
              <Percent className="w-3.5 h-3.5" />
              <span>OPORTUNIDADES DE LA SEMANA</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black font-sans">
              OFERTAS & BENEFICIOS ACTIVOS
            </h2>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono font-bold text-slate-700">
            <span className="bg-yellow-300 border border-black px-2.5 py-1">
              ⚡ HASTA 3 CUOTAS SIN INTERÉS
            </span>
            <span className="bg-lime-300 border border-black px-2.5 py-1">
              ⚡ 5% OFF EN EFECTIVO
            </span>
          </div>
        </div>

        {/* 4 Spotlight Offer Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {offerProducts.map((product) => (
            <div
              key={product.id}
              className="bg-white border-3 border-black p-4 flex flex-col justify-between shadow-[5px_5px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#EC4899] transition-all group"
            >
              <div>
                {/* Image */}
                <div
                  className="aspect-square bg-slate-50 border-2 border-black overflow-hidden relative cursor-pointer mb-3"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.imgUrl}
                    alt={product.producto}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute top-2 left-2 bg-black text-[#E5A93C] text-[9px] font-mono font-bold px-2 py-0.5 border border-white">
                    {product.marca}
                  </div>
                  <div className="absolute top-2 right-2 bg-pink-500 text-white text-[9px] font-mono font-black px-2 py-0.5 border border-black animate-pulse">
                    OFERTA
                  </div>
                </div>

                {/* Details */}
                <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                  {product.tipo} • {product.cantidad}
                </span>

                <h3
                  onClick={() => onSelectProduct(product)}
                  className="text-sm sm:text-base font-black uppercase font-sans leading-snug hover:text-pink-600 cursor-pointer line-clamp-2 mt-1 break-words"
                >
                  {product.producto}
                </h3>
              </div>

              <div className="pt-3 mt-3 border-t border-black/15 space-y-2">
                <div className="flex flex-col xs:flex-row xs:items-baseline xs:justify-between gap-1">
                  <span className="text-lg font-black font-mono text-black">
                    ${product.precioVenta.toLocaleString('es-AR')}
                  </span>
                  <span className="text-[10px] font-mono text-pink-700 bg-pink-100 px-1.5 py-0.5 font-bold border border-pink-200 self-start xs:self-auto">
                    Oportunidad
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectProduct(product)}
                    className="bg-slate-100 hover:bg-slate-200 border border-black py-2 font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button
                    onClick={(e) => {
                      onAddToCart(product, e);
                      trackFunnelEvent('add_to_cart_from_offers', { productId: product.id });
                    }}
                    className="bg-pink-400 hover:bg-pink-500 text-black border-2 border-black py-2 font-black text-xs uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> + Agregar
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};
