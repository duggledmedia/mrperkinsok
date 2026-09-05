import React from 'react';
import { PackageCheck, Sparkles, MessageCircle, ArrowRight, ShieldCheck, Check, ShoppingBag } from 'lucide-react';
import { WHATSAPP_PHONE_INTERNATIONAL, trackFunnelEvent, DISCOVERY_SAMPLE_PRICE, DISCOVERY_MIN_SAMPLES, DISCOVERY_MAX_SAMPLES } from '../utils/constants';

interface DiscoveryKitSectionProps {
  onGoToStore?: () => void;
  currentDiscoveryCount?: number;
}

export const DiscoveryKitSection: React.FC<DiscoveryKitSectionProps> = ({
  onGoToStore,
  currentDiscoveryCount = 0
}) => {
  const handleConsultKit = () => {
    trackFunnelEvent('discovery_kit_whatsapp_click');
    const text = encodeURIComponent(
      'Hola Mr . Perkins, me gustaría consultar por el Kit de Descubrimiento de muestras ($10.000 c/u, de 3 a 5 fragancias) para probar en mi piel antes de comprar el frasco completo.'
    );
    window.open(`https://wa.me/${WHATSAPP_PHONE_INTERNATIONAL}?text=${text}`, '_blank');
  };

  return (
    <section className="bg-[#121212] text-white py-12 sm:py-16 border-b-4 border-black relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="bg-[#1A1A1A] border-4 border-black p-4 sm:p-6 lg:p-10 shadow-[8px_8px_0px_0px_#E5A93C] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-8 space-y-4 text-left">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="inline-flex items-center gap-2 bg-[#E5A93C] text-black px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-widest border border-black">
                <PackageCheck className="w-3.5 h-3.5" />
                <span>EXPERIENCIA PREVIA EN PIEL</span>
              </div>
              <span className="bg-white text-black font-mono font-black text-xs px-2 py-0.5 border border-black shadow-[2px_2px_0px_0px_#E5A93C]">
                ${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')} CADA MUESTRA
              </span>
            </div>

            <h2 className="text-2xl sm:text-4xl font-black uppercase font-serif text-white tracking-tight break-words">
              PROBÁ ANTES DE ELEGIR:{' '}
              <span className="text-[#E5A93C] block sm:inline">
                KIT DE DESCUBRIMIENTO
              </span>
            </h2>

            <p className="text-sm sm:text-base text-slate-300 font-serif leading-relaxed max-w-2xl">
              ¿Indeciso entre dos o tres perfumes? Una fragancia evoluciona durante horas y debe sentirse en la propia piel.
              Por eso ahora podés agregar <strong className="text-white">cualquier perfume del catálogo como muestra a solo ${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')}</strong>.
            </p>

            {/* Terms & Conditions Notice Card */}
            <div className="bg-black/80 border-2 border-[#E5A93C] p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-[#E5A93C] uppercase tracking-wide">
                <Sparkles className="w-4 h-4 text-[#E5A93C]" />
                <span>CÓMO FUNCIONA EL KIT DE DESCUBRIMIENTO</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm font-serif text-slate-200">
                <li className="flex items-start gap-2">
                  <span className="text-[#E5A93C] font-mono font-bold">•</span>
                  <span><strong>Formato:</strong> Podés sumar muestras de <strong>mínimo {DISCOVERY_MIN_SAMPLES} y máximo {DISCOVERY_MAX_SAMPLES} fragancias</strong> de cualquier producto disponible en la tienda.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E5A93C] font-mono font-bold">•</span>
                  <span><strong>Precio fijo:</strong> Cada muestra cuesta exactamente <strong>${DISCOVERY_SAMPLE_PRICE.toLocaleString('es-AR')} ARS</strong>.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#E5A93C] font-mono font-bold">•</span>
                  <span><strong>100% Reembolsable en crédito:</strong> El importe abonado por tu kit se <strong>descuenta íntegramente de la compra de un frasco completo de perfume</strong> en tu siguiente pedido (no acumulable dentro de la misma compra del kit).</span>
                </li>
              </ul>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 text-xs font-mono text-slate-300">
              <div className="flex items-center gap-2 bg-black/60 p-2.5 border border-[#333]">
                <Check className="w-4 h-4 text-[#E5A93C] shrink-0" />
                <span>Mín. {DISCOVERY_MIN_SAMPLES} / Máx. {DISCOVERY_MAX_SAMPLES} muestras</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 p-2.5 border border-[#333]">
                <Check className="w-4 h-4 text-[#E5A93C] shrink-0" />
                <span>100% fragancias auténticas</span>
              </div>
              <div className="flex items-center gap-2 bg-black/60 p-2.5 border border-[#333]">
                <Check className="w-4 h-4 text-[#E5A93C] shrink-0" />
                <span>Se descuenta de tu futuro frasco</span>
              </div>
            </div>
          </div>

          {/* Right Action Column */}
          <div className="lg:col-span-4 bg-black border-2 border-[#E5A93C] p-6 space-y-4 text-center shadow-[4px_4px_0px_0px_#000]">
            <span className="text-[10px] font-mono uppercase tracking-widest text-[#E5A93C] block font-bold">
              ARMÁ TU PROPIO KIT
            </span>
            <h3 className="text-lg font-black uppercase text-white font-serif">
              ARMÁ TU KIT EN LA TIENDA
            </h3>
            
            {currentDiscoveryCount > 0 ? (
              <div className="bg-[#1F1F1F] p-2.5 border border-[#E5A93C] text-xs font-mono text-white">
                <span>Llevás </span>
                <strong className="text-[#E5A93C]">{currentDiscoveryCount}</strong>
                <span> de {DISCOVERY_MIN_SAMPLES} a {DISCOVERY_MAX_SAMPLES} muestras en el carrito.</span>
              </div>
            ) : (
              <p className="text-xs font-serif text-slate-300">
                En cada perfume podés presionar <strong>"+ Muestra Kit ($10.000)"</strong> y armar tu selección de 3 a 5 fragancias favoritas.
              </p>
            )}

            {onGoToStore && (
              <button
                onClick={onGoToStore}
                className="w-full bg-[#E5A93C] hover:bg-[#d6982f] text-black border-2 border-black py-3 px-4 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#fff] cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 font-serif"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>EXPLORAR CATÁLOGO Y ARMAR KIT</span>
              </button>
            )}

            <button
              onClick={handleConsultKit}
              className="w-full bg-[#25D366] hover:bg-green-500 text-black border-2 border-black py-2.5 px-4 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#fff] cursor-pointer transition-transform hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 font-serif"
            >
              <MessageCircle className="w-4 h-4 fill-black" />
              <span>CONSULTAR POR WHATSAPP</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
