import React from 'react';
import { Product } from '../types';
import { ShoppingBag, Eye, Tag } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e: React.MouseEvent) => void;
  onImageError?: (productId: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({
  product,
  onSelectProduct,
  onAddToCart,
  onImageError
}) => {
  const isOut = product.stock === 'No';

  return (
    <div
      onClick={() => onSelectProduct(product)}
      className="bg-white border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[10px_10px_0px_0px_#000] transition-all duration-200 flex flex-col justify-between relative group cursor-pointer overflow-hidden"
    >
      {/* Product Image Stage */}
      <div className="relative aspect-square bg-slate-100 border-b-3 border-black overflow-hidden flex items-center justify-center p-3 sm:p-4">
        <img
          src={product.imgUrl}
          alt={product.producto}
          loading="lazy"
          decoding="async"
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={() => {
            if (onImageError) {
              onImageError(product.id);
            }
          }}
        />

        {/* Volume badge - Smaller on mobile */}
        <div className="absolute top-1.5 left-1.5 sm:top-2 sm:left-2 bg-white text-black text-[9px] sm:text-xs font-mono font-black px-1.5 py-0.5 border sm:border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000]">
          {product.cantidad}
        </div>

        {/* Stock Badge - Smaller on mobile */}
        {isOut ? (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-pink-600 text-white font-black text-[9px] sm:text-xs px-1.5 py-0.5 sm:px-2.5 sm:py-1 border sm:border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[3px_3px_0px_0px_#000] rotate-2 z-10">
            AGOTADO
          </div>
        ) : (
          <div className="absolute top-1.5 right-1.5 sm:top-2 sm:right-2 bg-lime-400 text-black font-black text-[9px] sm:text-[11px] px-1.5 py-0.5 border sm:border-2 border-black shadow-[1.5px_1.5px_0px_0px_#000] sm:shadow-[2px_2px_0px_0px_#000] z-10">
            EN STOCK
          </div>
        )}

        {/* Quick inspection hover overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
          <span className="bg-yellow-300 text-black border-2 border-black font-black text-xs px-3 py-1.5 uppercase flex items-center gap-1.5 shadow-[3px_3px_0px_0px_#000]">
            <Eye className="w-4 h-4" /> VER DETALLES
          </span>
        </div>
      </div>

      {/* Product Information Body - Only display full product name cleanly */}
      <div className="p-2.5 sm:p-4 flex-1 flex flex-col justify-between space-y-2">
        <div className="flex-1 flex items-center">
          {/* Product Full Name (Full visibility, no truncation) */}
          <h3 className="font-black text-xs sm:text-sm md:text-base uppercase leading-tight font-sans text-black group-hover:text-pink-600 transition-colors break-words w-full">
            {product.producto}
          </h3>
        </div>

        {/* Price & Action Row */}
        <div className="pt-2 border-t-2 border-black flex items-center justify-between gap-1.5 flex-wrap sm:flex-nowrap">
          <div className="min-w-0">
            <span className="text-[9px] font-mono uppercase text-slate-500 font-bold block leading-none">
              Precio Venta
            </span>
            <span className="text-base sm:text-xl font-black text-black font-mono leading-none truncate block">
              ${product.precioVenta.toLocaleString('es-AR')}
            </span>
          </div>

          <button
            disabled={isOut}
            onClick={(e) => onAddToCart(product, e)}
            className={`border-2 border-black px-2 py-1 sm:px-3 sm:py-1.5 font-black text-[11px] sm:text-xs uppercase transition-all flex items-center gap-1 cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 whitespace-nowrap ${
              isOut
                ? 'bg-slate-200 text-slate-500 border-slate-400 cursor-not-allowed shadow-none'
                : 'bg-lime-300 hover:bg-lime-400 text-black hover:-translate-y-0.5'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 flex-shrink-0" />
            <span>{isOut ? 'Agotado' : 'Comprar'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
