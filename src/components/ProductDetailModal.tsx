import React, { useState } from 'react';
import { Product } from '../types';
import { X, ShoppingBag, MessageCircle, Truck, ShieldCheck, Tag, CreditCard } from 'lucide-react';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onImageError?: (productId: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onImageError
}) => {
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isOut = product.stock === 'No';
  const installmentPrice = Math.round(product.precioVenta / 3);

  const handleSendWhatsappDirect = () => {
    const text = encodeURIComponent(
      `¡Hola Mr. Perkins! Me interesa encargar el siguiente producto:\n\n` +
      `*Producto:* ${product.producto}\n` +
      `*Marca:* ${product.marca}\n` +
      `*Cantidad/Envase:* ${product.cantidad}\n` +
      `*Unidades:* ${quantity}\n` +
      `*Precio Total:* $${(product.precioVenta * quantity).toLocaleString('es-AR')} ARS\n\n` +
      `¿Tienen stock disponible y formas de envío a mi domicilio? ¡Gracias!`
    );
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border-4 border-black w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-[12px_12px_0px_0px_#000] relative p-6 space-y-6">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 bg-black text-white hover:bg-pink-500 hover:text-black p-2 border-2 border-black font-black font-mono transition-colors cursor-pointer"
        >
          <X className="w-6 h-6" />
        </button>

        {/* Modal Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          {/* Image Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="aspect-square bg-slate-100 border-4 border-black relative overflow-hidden">
              <img
                src={product.imgUrl}
                alt={product.producto}
                className="w-full h-full object-cover"
                onError={() => {
                  if (onImageError && product) {
                    onImageError(product.id);
                  }
                  onClose();
                }}
              />
              <div className="absolute top-2 left-2 bg-yellow-300 text-black text-xs font-black font-mono px-2 py-0.5 border border-black">
                {product.marca}
              </div>

              {isOut ? (
                <div className="absolute bottom-2 right-2 bg-pink-600 text-white font-black text-sm px-3 py-1 border-2 border-black rotate-2">
                  AGOTADO
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 bg-lime-400 text-black font-black text-xs px-2.5 py-1 border-2 border-black">
                  EN STOCK
                </div>
              )}
            </div>

            {/* Quick Guarantees Badges */}
            <div className="bg-yellow-100 border-2 border-black p-3 space-y-1.5 text-xs font-mono font-bold">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-black" />
                <span>Envío Gratis en CABA ($45.000+)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black" />
                <span>Fragancias 100% Originales</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black" />
                <span>3 Cuotas sin interés de ${installmentPrice.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black text-white text-xs font-mono px-2 py-0.5 font-bold">
                  ID #{product.id}
                </span>
                <span className="bg-purple-200 text-black text-xs font-mono px-2 py-0.5 border border-black font-bold uppercase">
                  {product.tipo}
                </span>
                <span className="bg-cyan-200 text-black text-xs font-mono px-2 py-0.5 border border-black font-bold uppercase">
                  {product.genero}
                </span>
                <span className="bg-slate-200 text-black text-xs font-mono px-2 py-0.5 border border-black font-bold">
                  {product.cantidad}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-sans text-black">
                {product.producto}
              </h2>
            </div>

            {/* Description */}
            <div className="border-t-2 border-b-2 border-black py-3 space-y-2">
              <h4 className="text-xs font-mono font-black uppercase text-slate-500">
                Descripción del Producto
              </h4>
              <p className="text-sm font-sans text-slate-800 leading-relaxed">
                {product.descripcion || 'Sin descripción provista en el catálogo.'}
              </p>
            </div>

            {/* Tags */}
            {product.clasificacion && product.clasificacion.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-slate-500">
                  Clasificación / Notas:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {product.clasificacion.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-pink-100 text-black text-xs font-mono font-bold px-2 py-0.5 border border-black uppercase"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price section */}
            <div className="bg-slate-50 border-3 border-black p-4 space-y-1">
              <div className="flex items-baseline justify-between">
                <span className="text-xs font-mono font-bold uppercase text-slate-600">
                  Precio de Venta
                </span>
                <span className="text-3xl font-black font-mono text-black">
                  ${(product.precioVenta * quantity).toLocaleString('es-AR')} ARS
                </span>
              </div>
              <p className="text-xs font-mono text-pink-600 font-bold">
                💳 Hasta 3 cuotas sin interés de ${installmentPrice.toLocaleString('es-AR')}
              </p>
            </div>

            {/* Actions & Quantity */}
            <div className="space-y-3 pt-2">
              {!isOut && (
                <div className="flex items-center gap-3">
                  <label className="text-xs font-mono font-bold uppercase">Cantidad:</label>
                  <div className="flex items-center border-2 border-black bg-white">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-1 font-black text-sm hover:bg-yellow-300 border-r-2 border-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-mono font-black text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 font-black text-sm hover:bg-yellow-300 border-l-2 border-black cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  disabled={isOut}
                  onClick={() => {
                    onAddToCart(product, quantity);
                    onClose();
                  }}
                  className={`border-3 border-black py-3 px-4 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer ${
                    isOut
                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                      : 'bg-lime-400 hover:bg-lime-500 text-black'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{isOut ? 'Agotado' : 'Agregar al Carrito'}</span>
                </button>

                <button
                  onClick={handleSendWhatsappDirect}
                  className="bg-[#25D366] hover:bg-green-500 text-black border-3 border-black py-3 px-4 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Pedir por WhatsApp</span>
                </button>
              </div>

              {/* Explicit Back to Catalog Button */}
              <div className="pt-2">
                <button
                  onClick={onClose}
                  className="w-full bg-slate-100 hover:bg-slate-200 text-black border-2 border-black py-2 px-4 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <span>← VOLVER AL CATÁLOGO</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
