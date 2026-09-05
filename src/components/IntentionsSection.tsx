import React from 'react';
import { INTENTION_OPTIONS, IntentionOption, trackFunnelEvent } from '../utils/constants';
import { Compass, Sparkles, ArrowUpRight, Flame, Heart, Sun, Moon, Briefcase, Gift, ShieldAlert, Coffee } from 'lucide-react';

interface IntentionsSectionProps {
  onSelectIntention: (intention: IntentionOption) => void;
  activeIntentionId?: string | null;
}

const ICONS_MAP: Record<string, React.ReactNode> = {
  diario: <Sun className="w-5 h-5 text-black stroke-[2.5]" />,
  noche: <Moon className="w-5 h-5 text-black stroke-[2.5]" />,
  cita: <Heart className="w-5 h-5 text-black stroke-[2.5]" />,
  oficina: <Briefcase className="w-5 h-5 text-black stroke-[2.5]" />,
  regalar: <Gift className="w-5 h-5 text-black stroke-[2.5]" />,
  notar: <Flame className="w-5 h-5 text-black stroke-[2.5]" />,
  fresco: <Sparkles className="w-5 h-5 text-black stroke-[2.5]" />,
  dulce: <Coffee className="w-5 h-5 text-black stroke-[2.5]" />,
  sorprendeme: <Compass className="w-5 h-5 text-black stroke-[2.5]" />
};

export const IntentionsSection: React.FC<IntentionsSectionProps> = ({
  onSelectIntention,
  activeIntentionId
}) => {
  const handleIntentionClick = (item: IntentionOption) => {
    trackFunnelEvent('intention_card_click', { intentionId: item.id, label: item.label });
    onSelectIntention(item);
  };

  return (
    <section className="bg-[#FAF8F5] py-12 sm:py-16 border-b-4 border-black">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-black pb-4">
          <div>
            <div className="inline-block bg-black text-[#E5A93C] px-2.5 py-0.5 font-mono text-[11px] font-black uppercase tracking-widest mb-1.5">
              CURADURÍA POR OCASIÓN
            </div>
            <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-black font-sans">
              ¿QUÉ ESTÁS BUSCANDO HOY?
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-sans text-slate-700 max-w-md">
            Elegí tu estado de ánimo o momento de uso. Mr. Perkins clasifica las fragancias según la impresión que querés generar.
          </p>
        </div>

        {/* 9 Editorial Intentions Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
          {INTENTION_OPTIONS.map((item) => {
            const isActive = activeIntentionId === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleIntentionClick(item)}
                className={`text-left p-4 sm:p-5 border-3 border-black transition-all cursor-pointer flex flex-col justify-between group relative overflow-hidden ${
                  isActive
                    ? 'bg-[#E5A93C] text-black shadow-[5px_5px_0px_0px_#000] -translate-x-0.5 -translate-y-0.5'
                    : 'bg-white hover:bg-amber-50/70 text-black shadow-[4px_4px_0px_0px_#000] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[6px_6px_0px_0px_#000]'
                }`}
              >
                {/* Top Badge & Icon */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className={`text-[10px] font-mono font-black uppercase px-2 py-0.5 border border-black ${
                    isActive ? 'bg-black text-[#E5A93C]' : 'bg-slate-100 text-black'
                  }`}>
                    {item.badge}
                  </span>
                  
                  <div className="w-8 h-8 rounded-none bg-[#E5A93C] border-2 border-black flex items-center justify-center shrink-0 shadow-[2px_2px_0px_0px_#000] group-hover:rotate-6 transition-transform">
                    {ICONS_MAP[item.id] || <Compass className="w-4 h-4 text-black" />}
                  </div>
                </div>

                {/* Title & Subtitle */}
                <div className="space-y-1 my-1">
                  <h3 className="text-base sm:text-lg font-black uppercase font-sans tracking-tight leading-snug group-hover:text-black">
                    {item.label}
                  </h3>
                  <p className="text-xs font-mono font-bold text-slate-600">
                    {item.subtitle}
                  </p>
                </div>

                {/* Editorial Micro-Copy & Action */}
                <div className="pt-2.5 mt-2.5 border-t border-black/15 flex flex-col gap-2">
                  <p className="text-xs font-sans text-slate-700 leading-relaxed">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-end gap-1 font-mono text-[11px] font-black text-black group-hover:translate-x-0.5 transition-transform">
                    <span>EXPLORAR SELECCIÓN</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

      </div>
    </section>
  );
};
