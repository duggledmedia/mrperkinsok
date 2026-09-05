import React, { useState, useEffect } from 'react';
import { ArrowRight, Compass } from 'lucide-react';
import { BRAND_LOGO_PATH, trackFunnelEvent } from '../utils/constants';

interface HeroEditorialProps {
  onStartTest: () => void;
  onGoToStore: () => void;
}

export const HeroEditorial: React.FC<HeroEditorialProps> = ({
  onStartTest,
  onGoToStore
}) => {
  const [mouseOffset, setMouseOffset] = useState({ x: 0, y: 0 });
  const [deviceTilt, setDeviceTilt] = useState({ x: 0, y: 0 });
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    // Mouse movement parallax for computers
    const handleMouseMove = (e: MouseEvent) => {
      const normX = (e.clientX / window.innerWidth) - 0.5;
      const normY = (e.clientY / window.innerHeight) - 0.5;
      setMouseOffset({
        x: normX * -28,
        y: normY * -20
      });
    };

    // Device orientation tilt for mobile devices
    const handleDeviceOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma !== null && e.beta !== null) {
        const normGamma = Math.max(-1, Math.min(1, e.gamma / 35));
        const normBeta = Math.max(-1, Math.min(1, (e.beta - 40) / 35));
        setDeviceTilt({
          x: normGamma * -24,
          y: normBeta * -18
        });
      }
    };

    // Scroll parallax & progressive blur
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('scroll', handleScroll, { passive: true });
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      window.addEventListener('deviceorientation', handleDeviceOrientation, { passive: true });
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('scroll', handleScroll);
      if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
        window.removeEventListener('deviceorientation', handleDeviceOrientation);
      }
    };
  }, []);

  const totalOffsetX = mouseOffset.x + deviceTilt.x;
  const parallaxY = scrollY * 0.35;
  const totalOffsetY = mouseOffset.y + deviceTilt.y + parallaxY;
  const blurAmount = Math.min(14, (scrollY / 380) * 14);

  const handleStartTestClick = () => {
    trackFunnelEvent('hero_cta_start_test');
    onStartTest();
  };

  const handleGoToStoreClick = () => {
    trackFunnelEvent('hero_cta_go_to_store');
    onGoToStore();
  };

  return (
    <section className="relative min-h-[540px] sm:min-h-[580px] md:min-h-[640px] flex items-center bg-[#0D0D0D] text-white border-b-4 border-black overflow-hidden">
      {/* Background Image Container with vertical coverage, zoom & parallax */}
      <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <img
          src="/MRP Fondo.png"
          alt="Mr . Perkins Fondo"
          className="w-full h-full min-h-full object-cover object-center will-change-transform"
          style={{
            transform: `translate3d(${totalOffsetX.toFixed(1)}px, ${totalOffsetY.toFixed(1)}px, 0) scale(1.18)`,
            filter: `blur(${blurAmount.toFixed(1)}px) brightness(0.52) contrast(1.15)`,
            transition: 'transform 0.12s ease-out, filter 0.1s ease-out'
          }}
        />

        {/* Editorial Gradients for Deep Legibility & Contrast */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/92 via-black/80 to-black/55" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D0D] via-transparent to-black/50" />
      </div>

      {/* Editorial Grid Texture */}
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#C99846_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-1" />

      {/* Decorative Warm Glow */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#E5A93C]/10 rounded-full blur-3xl pointer-events-none z-1" />

      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-20 relative z-10">
        {/* Main Editorial Content */}
        <div className="space-y-6 sm:space-y-7 text-left max-w-3xl">
          
          {/* Main Headline */}
          <div className="space-y-2">
            <h1 className="text-3xl sm:text-5xl md:text-6xl font-black uppercase tracking-tight leading-[1.1] font-serif text-white break-words">
              HAY MILES DE PERFUMES.{' '}
              <span className="text-[#E5A93C] block sm:inline">
                ENCONTREMOS EL TUYO.
              </span>
            </h1>
          </div>

          {/* Editorial Body / Subtitle */}
          <p className="text-base sm:text-lg text-slate-200 font-serif max-w-2xl leading-relaxed">
            No necesitás conocer todas las notas de fondo ni descifrar la química olfativa.{' '}
            <strong className="text-white font-semibold">Contanos qué te gusta, para qué momento lo buscás</strong> y Mr . Perkins hace el resto.
          </p>

          {/* Sommelier Dialogue Callout */}
          <div className="bg-[#171717]/90 backdrop-blur-xs border-l-4 border-[#E5A93C] p-4 sm:p-5 shadow-[4px_4px_0px_0px_#000] flex items-start gap-3.5">
            <div className="w-10 h-10 rounded-none bg-black border border-[#E5A93C] p-1 shrink-0 flex items-center justify-center">
              <img
                src={BRAND_LOGO_PATH}
                alt="Mr . Perkins Sommelier"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="space-y-1">
              <span className="font-mono text-[10px] font-black uppercase tracking-wider text-[#E5A93C] block">
                CONSEJO DE SOMMELIER
              </span>
              <p className="text-xs sm:text-sm font-serif italic text-slate-200">
                "Permítame hacerle unas breves preguntas. En menos de un minuto le diré con exactitud qué acordes harán que volteen a mirarlo."
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
            {/* Primary CTA */}
            <button
              onClick={handleStartTestClick}
              className="bg-[#E5A93C] hover:bg-[#d6982f] text-black border-3 border-black px-6 sm:px-8 py-3.5 sm:py-4 font-black text-xs sm:text-sm uppercase tracking-wider shadow-[4px_4px_0px_0px_#fff] hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer flex items-center justify-center gap-2.5 font-serif"
            >
              <Compass className="w-4 h-4 stroke-[2.5]" />
              <span>ENCONTRÁ TU PERFUME</span>
              <ArrowRight className="w-4 h-4 stroke-[2.5]" />
            </button>

            {/* Secondary CTA */}
            <button
              onClick={handleGoToStoreClick}
              className="bg-black/60 hover:bg-white/10 text-white border-2 border-white/60 hover:border-white px-5 sm:px-6 py-3.5 sm:py-4 font-black text-xs sm:text-sm uppercase tracking-wider transition-all cursor-pointer flex items-center justify-center gap-2 font-serif backdrop-blur-xs"
            >
              <span>YA SÉ QUÉ BUSCO (VER TIENDA)</span>
            </button>
          </div>

        </div>
      </div>
    </section>
  );
};
