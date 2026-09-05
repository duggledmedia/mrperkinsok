import React from 'react';
import { Product } from '../types';
import { Sparkles, Eye, ShoppingBag, ArrowRight, Award } from 'lucide-react';
import { getMrPerkinsQuote, trackFunnelEvent, getRandomSample } from '../utils/constants';

interface MrPerkinsSelectionProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  onViewAllSelection: () => void;
  onShowToast?: (msg: string) => void;
}

const CURATOR_TAGLINES = [
  "Para cuando querés que pregunten qué perfume estás usando",
  "Una compra difícil de errar: elegancia garantizada",
  "Limpio, energizante y peligrosamente fácil de usar",
  "Carácter imponente para citas o noches importantes",
  "Fijación extrema que deja una estela memorable",
  "La dosis justa de frescura para el ritmo de todos los días"
];

export const MrPerkinsSelection: React.FC<MrPerkinsSelectionProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onViewAllSelection,
  onShowToast
}) => {
  // Take up to 6 distinct products randomly picked from the best in stock each time the site is opened
  const curatedProducts = React.useMemo(() => {
    if (products.length === 0) return [];
    const inStock = products.filter((p) => p.stock !== 'No' && p.imgUrl && p.imgUrl.trim() !== '');
    const pool = inStock.length >= 6 ? inStock : products.filter((p) => p.imgUrl && p.imgUrl.trim() !== '');
    return getRandomSample(pool, 6);
  }, [products]);

  if (curatedProducts.length === 0) return null;

  return (
    <section className="bg-white py-12 sm:py-16 border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-black pb-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-[#E5A93C] text-black px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-widest mb-1.5 border border-black shadow-[2px_2px_0px_0px_#000]">
              <Award className="w-3.5 h-3.5" />
              <span>CURADURÍA DE AUTOR</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black font-sans">
              LA SELECCIÓN DE MR. PERKINS
            </h2>
          </div>
          
          <button
            onClick={() => {
              trackFunnelEvent('view_all_selection_click');
              onViewAllSelection();
            }}
            className="inline-flex items-center gap-2 bg-black hover:bg-slate-800 text-white border-2 border-black px-4 py-2 text-xs font-mono font-black uppercase tracking-wider shadow-[3px_3px_0px_0px_#E5A93C] cursor-pointer transition-all shrink-0"
          >
            <span>VER TODA LA TIENDA</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#E5A93C]" />
          </button>
        </div>

        {/* 6 Product Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {curatedProducts.map((product, idx) => {
            const tagline = CURATOR_TAGLINES[idx % CURATOR_TAGLINES.length];
            const { family } = getMrPerkinsQuote(product);

            return (
              <div
                key={product.id}
                className="bg-[#FAF8F5] border-3 border-black p-4 sm:p-5 flex flex-col justify-between shadow-[5px_5px_0px_0px_#000] hover:shadow-[7px_7px_0px_0px_#E5A93C] transition-all group relative"
              >
                {/* Curator Quote Header Bubble */}
                <div className="bg-white border-2 border-black p-2.5 mb-3 shadow-[2px_2px_0px_0px_#000] flex items-start gap-2">
                  <span className="text-base leading-none text-[#E5A93C]">❝</span>
                  <p className="text-[11px] font-serif italic text-slate-800 font-semibold leading-tight">
                    {tagline}
                  </p>
                </div>

                {/* Product Image Box */}
                <div
                  className="aspect-square bg-white border-2 border-black overflow-hidden relative cursor-pointer mb-3"
                  onClick={() => onSelectProduct(product)}
                >
                  <img
                    src={product.imgUrl}
                    alt={product.producto}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  
                  {/* Brand Tag */}
                  <div className="absolute top-2 left-2 bg-black text-[#E5A93C] text-[9px] font-mono font-bold px-2 py-0.5 border border-white">
                    {product.marca}
                  </div>

                  {/* Stock Tag */}
                  {product.stock === 'No' ? (
                    <div className="absolute bottom-2 right-2 bg-pink-600 text-white font-mono font-black text-[9px] px-2 py-0.5 border border-black">
                      AGOTADO
                    </div>
                  ) : (
                    <div className="absolute bottom-2 right-2 bg-emerald-400 text-black font-mono font-black text-[9px] px-2 py-0.5 border border-black">
                      EN STOCK
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap text-[10px] font-mono text-slate-600 font-bold">
                    <span className="bg-amber-100 text-amber-900 px-1.5 py-0.2 border border-amber-300">
                      {family}
                    </span>
                    <span>•</span>
                    <span>{product.cantidad}</span>
                  </div>

                  <h3
                    onClick={() => onSelectProduct(product)}
                    className="text-base font-black uppercase font-sans leading-snug hover:text-[#C99846] cursor-pointer line-clamp-2 break-words"
                  >
                    {product.producto}
                  </h3>

                  <p className="text-xs font-sans text-slate-600 line-clamp-2 leading-relaxed">
                    {product.descripcion}
                  </p>
                </div>

                {/* Price & Actions */}
                <div className="pt-3 mt-3 border-t-2 border-black/15 space-y-3">
                  <div className="flex flex-col xs:flex-row xs:items-baseline xs:justify-between gap-1">
                    <div>
                      <span className="text-[10px] font-mono text-slate-500 uppercase block font-semibold">
                        Precio contado / online
                      </span>
                      <span className="text-xl font-black font-mono text-black">
                        ${product.precioVenta.toLocaleString('es-AR')}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-800 bg-emerald-100 border border-emerald-300 px-2 py-0.5 font-bold self-start xs:self-auto">
                      Hasta 3 cuotas s/i
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => onSelectProduct(product)}
                      className="bg-white hover:bg-slate-100 border-2 border-black py-2 font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5" /> Ver
                    </button>
                    <button
                      disabled={product.stock === 'No'}
                      onClick={(e) => {
                        onAddToCart(product, e);
                        trackFunnelEvent('add_to_cart_from_selection', { productId: product.id });
                      }}
                      className={`border-2 border-black py-2 font-black text-xs uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer transition-all ${
                        product.stock === 'No'
                          ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                          : 'bg-[#E5A93C] hover:bg-amber-500 text-black'
                      }`}
                    >
                      <ShoppingBag className="w-3.5 h-3.5" /> + Agregar
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
};
