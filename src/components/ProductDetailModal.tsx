import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { X, ShoppingBag, MessageCircle, Truck, ShieldCheck, CreditCard, Share2, Sparkles, Award } from 'lucide-react';
import { shareProductLink, getWhatsAppProductShareUrl, updateOpenGraphMeta, getProductPageUrl } from '../utils/shareUtils';
import { WHATSAPP_PHONE_INTERNATIONAL, getMrPerkinsQuote, DISCOVERY_SAMPLE_PRICE, DISCOVERY_MIN_SAMPLES, DISCOVERY_MAX_SAMPLES } from '../utils/constants';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onAddToCart: (product: Product, quantity: number) => void;
  onAddDiscoverySample?: (product: Product) => void;
  onImageError?: (productId: string) => void;
  onShowToast?: (msg: string) => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
  onAddToCart,
  onAddDiscoverySample,
  onImageError,
  onShowToast
}) => {
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    updateOpenGraphMeta(product);
    return () => {
      updateOpenGraphMeta(null);
    };
  }, [product]);

  if (!product) return null;

  const isOut = product.stock === 'No';
  const installmentPrice = Math.round(product.precioVenta / 3);
  const { quote, occasion, family } = getMrPerkinsQuote(product);

  const handleSendWhatsappDirect = () => {
    const productUrl = getProductPageUrl(product.id);
    const text = encodeURIComponent(
      `¡Hola Mr. Perkins! Me interesa encargar el siguiente producto:\n\n` +
      `*Producto:* ${product.producto}\n` +
      `*Marca:* ${product.marca}\n` +
      `*Cantidad/Envase:* ${product.cantidad}\n` +
      `*Unidades:* ${quantity}\n` +
      `*Precio Total:* $${(product.precioVenta * quantity).toLocaleString('es-AR')} ARS\n\n` +
      `🔗 Ver producto: ${productUrl}\n\n` +
      `¿Tienen stock disponible y formas de envío a mi domicilio? ¡Gracias!`
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE_INTERNATIONAL}?text=${text}`, '_blank');
  };

  const handleShare = async () => {
    const res = await shareProductLink(product);
    if (res.success && onShowToast) {
      if (res.method === 'clipboard') {
        onShowToast(`🔗 ¡Enlace de ${product.producto} copiado!`);
      } else if (res.method === 'native') {
        onShowToast(`🔗 Compartiendo ${product.producto}`);
      }
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white border-4 border-black w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-[12px_12px_0px_0px_#000] relative p-4 sm:p-6 space-y-6">
        {/* Top Header Buttons: Share & Close */}
        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-50 flex items-center gap-2">
          <button
            onClick={handleShare}
            title="Compartir enlace con foto"
            className="bg-[#E5A93C] text-black hover:bg-amber-400 px-2.5 py-2 border-2 border-black font-black font-mono transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-5 h-5 stroke-[2.5]" />
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase hidden sm:inline">Compartir</span>
          </button>

          <button
            onClick={onClose}
            title="Cerrar ventana emergente"
            aria-label="Cerrar ventana"
            className="bg-black text-white hover:bg-pink-500 hover:text-black p-2 sm:p-2 border-2 border-black font-black font-mono transition-all cursor-pointer shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 flex items-center justify-center gap-1 group"
          >
            <X className="w-6 h-6 stroke-[3]" />
            <span className="text-[10px] sm:text-xs font-mono font-bold uppercase hidden sm:inline">Cerrar</span>
          </button>
        </div>

        {/* Modal Content Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start pt-10 sm:pt-2">
          {/* Image Column */}
          <div className="md:col-span-5 space-y-3">
            <div className="aspect-square bg-slate-100 border-4 border-black relative overflow-hidden shadow-[4px_4px_0px_0px_#000]">
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
              <div className="absolute top-2 left-2 bg-black text-[#E5A93C] text-xs font-black font-mono px-2 py-0.5 border border-white">
                {product.marca}
              </div>

              {isOut ? (
                <div className="absolute bottom-2 right-2 bg-pink-600 text-white font-black text-sm px-3 py-1 border-2 border-black rotate-2">
                  AGOTADO
                </div>
              ) : (
                <div className="absolute bottom-2 right-2 bg-emerald-400 text-black font-black text-xs px-2.5 py-1 border-2 border-black">
                  EN STOCK
                </div>
              )}
            </div>

            {/* Quick Guarantees Badges */}
            <div className="bg-amber-50 border-2 border-black p-3 space-y-1.5 text-xs font-mono font-bold shadow-[2px_2px_0px_0px_#000]">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-black shrink-0" />
                <span>Envío Gratis en CABA ($45.000+)</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-black shrink-0" />
                <span>Fragancias 100% Auténticas</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-black shrink-0" />
                <span>3 Cuotas sin interés de ${installmentPrice.toLocaleString('es-AR')}</span>
              </div>
            </div>
          </div>

          {/* Details Column */}
          <div className="md:col-span-7 space-y-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="bg-black text-[#E5A93C] text-xs font-mono px-2 py-0.5 font-bold">
                  ID #{product.id}
                </span>
                <span className="bg-amber-100 text-amber-950 text-xs font-mono px-2 py-0.5 border border-black font-bold uppercase">
                  {product.tipo}
                </span>
                <span className="bg-slate-100 text-black text-xs font-mono px-2 py-0.5 border border-black font-bold uppercase">
                  {product.genero}
                </span>
                <span className="bg-slate-200 text-black text-xs font-mono px-2 py-0.5 border border-black font-bold">
                  {product.cantidad}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight font-sans text-black break-words leading-tight">
                {product.producto}
              </h2>
            </div>

            {/* SOMMELIER CRITERIA: MR. PERKINS DICE */}
            <div className="bg-[#121212] text-white border-3 border-black p-4 space-y-2 shadow-[4px_4px_0px_0px_#E5A93C]">
              <div className="flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 text-[10px] font-mono font-black uppercase tracking-wider text-[#E5A93C]">
                  <Award className="w-3.5 h-3.5" />
                  <span>MR. PERKINS DICE</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">Familia: {family}</span>
              </div>
              <p className="text-xs sm:text-sm font-serif italic text-slate-200 leading-relaxed">
                "{quote}"
              </p>
              <div className="text-[10px] font-mono text-[#E5A93C] pt-1 border-t border-[#333]">
                ✦ Ocasión recomendada: <span className="text-white">{occasion}</span>
              </div>
            </div>

            {/* Description */}
            <div className="border-t-2 border-b-2 border-black py-3 space-y-2">
              <h4 className="text-xs font-mono font-black uppercase text-slate-500">
                Descripción del Catálogo
              </h4>
              <p className="text-sm font-sans text-slate-800 leading-relaxed">
                {product.descripcion || 'Sin descripción provista en el catálogo.'}
              </p>
            </div>

            {/* Tags */}
            {product.clasificacion && product.clasificacion.length > 0 && (
              <div className="space-y-1">
                <span className="text-xs font-mono font-bold uppercase text-slate-500">
                  Notas / Clasificación:
                </span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {product.clasificacion.map((tag, idx) => (
                    <span
                      key={idx}
                      className="bg-slate-100 text-black text-xs font-mono font-bold px-2 py-0.5 border border-black uppercase"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Price section */}
            <div className="bg-amber-50/50 border-3 border-black p-4 space-y-1">
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <span className="text-xs font-mono font-bold uppercase text-slate-600">
                  Precio Contado / Online
                </span>
                <span className="text-2xl sm:text-3xl font-black font-mono text-black">
                  ${(product.precioVenta * quantity).toLocaleString('es-AR')} ARS
                </span>
              </div>
              <p className="text-xs font-mono text-emerald-800 font-bold">
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
                      className="px-3 py-1 font-black text-sm hover:bg-[#E5A93C] border-r-2 border-black cursor-pointer"
                    >
                      -
                    </button>
                    <span className="px-4 py-1 font-mono font-black text-sm">
                      {quantity}
                    </span>
                    <button
                      onClick={() => setQuantity((q) => q + 1)}
                      className="px-3 py-1 font-black text-sm hover:bg-[#E5A93C] border-l-2 border-black cursor-pointer"
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
                      : 'bg-[#E5A93C] hover:bg-amber-500 text-black'
                  }`}
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>{isOut ? 'Agotado' : 'Agregar Frasco Completo'}</span>
                </button>

                <button
                  onClick={handleSendWhatsappDirect}
                  className="bg-[#25D366] hover:bg-green-500 text-black border-3 border-black py-3 px-4 font-black text-sm uppercase flex items-center justify-center gap-2 shadow-[4px_4px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer"
                >
                  <MessageCircle className="w-5 h-5" />
                  <span>Pedir por WhatsApp</span>
                </button>
              </div>

              {/* DEDICATED DISCOVERY KIT PURCHASE OPTION */}
              <div className="bg-[#FAF8F5] border-3 border-black p-4 space-y-3 shadow-[4px_4px_0px_0px_#000] mt-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#E5A93C] text-black px-2 py-0.5 text-xs font-mono font-black border border-black uppercase">
                      🧪 OPCIÓN KIT DE DESCUBRIMIENTO
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-600">Muestra / Decant</span>
                  </div>
                  <span className="font-mono font-black text-lg text-black">
                    ${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')} ARS
                  </span>
                </div>

                <p className="text-xs font-serif text-slate-700 leading-relaxed">
                  ¿Querés sentir su evolución en tu piel antes de adquirir el envase original? Sumá esta muestra a tu <strong>Kit de Descubrimiento (mínimo {DISCOVERY_MIN_SAMPLES}, máximo {DISCOVERY_MAX_SAMPLES} muestras)</strong>.
                </p>

                <div className="bg-amber-100/80 border border-amber-900/30 p-2 text-[11px] font-mono text-amber-950 leading-tight">
                  ✦ <strong>100% Reembolsable:</strong> Los ${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')} abonados por cada muestra se descuentan de tu compra futura de un perfume en frasco completo (no dentro de la misma compra del kit).
                </div>

                <button
                  onClick={() => {
                    if (onAddDiscoverySample) {
                      onAddDiscoverySample(product);
                    }
                    onClose();
                  }}
                  className="w-full bg-black hover:bg-[#E5A93C] text-white hover:text-black border-2 border-black py-2.5 px-3 font-mono font-black text-xs uppercase flex items-center justify-center gap-2 transition-all cursor-pointer shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5"
                >
                  <Sparkles className="w-4 h-4 text-[#E5A93C]" />
                  <span>+ AGREGAR MUESTRA AL KIT (${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')})</span>
                </button>
              </div>

              {/* Explicit Share & Back Row */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2">
                <a
                  href={getWhatsAppProductShareUrl(product)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 bg-[#25D366] hover:bg-green-500 text-black border-2 border-black py-2 px-3 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-center"
                >
                  <MessageCircle className="w-4 h-4 fill-black stroke-none shrink-0" />
                  <span>COMPARTIR EN WHATSAPP</span>
                </a>
                <button
                  onClick={handleShare}
                  className="flex-1 bg-white hover:bg-slate-100 text-black border-2 border-black py-2 px-3 font-black text-xs uppercase flex items-center justify-center gap-1.5 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-center"
                >
                  <Share2 className="w-4 h-4 shrink-0" />
                  <span>COPIAR / ENVIAR ENLACE</span>
                </button>
                <button
                  onClick={onClose}
                  className="bg-slate-100 hover:bg-slate-200 text-black border-2 border-black py-2 px-4 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer text-center"
                >
                  <span>VOLVER</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
