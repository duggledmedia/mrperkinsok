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
      {/* Top Banner Tag */}
      <div className="flex items-center justify-between border-b-3 border-black p-2 bg-slate-50">
        <span className="bg-black text-yellow-300 font-mono font-black text-xs px-2 py-0.5 uppercase border border-black truncate max-w-[150px]">
          {product.marca}
        </span>
        <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
          <span className="bg-cyan-200 px-1.5 py-0.5 border border-black uppercase">
            {product.tipo}
          </span>
          <span className="bg-purple-200 px-1.5 py-0.5 border border-black uppercase">
            {product.genero}
          </span>
        </div>
      </div>

      {/* Product Image Stage */}
      <div className="relative aspect-square bg-slate-100 border-b-3 border-black overflow-hidden flex items-center justify-center p-4">
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

        {/* Volume badge */}
        <div className="absolute top-2 left-2 bg-white text-black text-xs font-mono font-black px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000]">
          {product.cantidad}
        </div>

        {/* Stock Badge - REQUIRED BY PROMPT */}
        {isOut ? (
          <div className="absolute top-2 right-2 bg-pink-600 text-white font-black text-xs px-2.5 py-1 border-2 border-black shadow-[3px_3px_0px_0px_#000] rotate-2 z-10">
            AGOTADO
          </div>
        ) : (
          <div className="absolute top-2 right-2 bg-lime-400 text-black font-black text-[11px] px-2 py-0.5 border-2 border-black shadow-[2px_2px_0px_0px_#000] z-10">
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

      {/* Product Information Body */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <h3 className="font-extrabold text-base md:text-lg uppercase leading-tight font-sans group-hover:text-pink-600 transition-colors line-clamp-2">
            {product.producto}
          </h3>

          <p className="text-xs text-slate-600 mt-1 line-clamp-2 font-sans">
            {product.descripcion || 'Sin descripción disponible.'}
          </p>

          {/* Tag Chips */}
          {product.clasificacion && product.clasificacion.length > 0 && (
            <div className="flex items-center gap-1 flex-wrap mt-2">
              {product.clasificacion.slice(0, 3).map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-slate-100 text-black text-[10px] font-mono font-bold px-1.5 py-0.2 border border-black uppercase"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}
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
