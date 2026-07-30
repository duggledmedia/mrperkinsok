import React, { useRef } from 'react';
import { Brand, Product } from '../types';
import { Layers, ChevronLeft, ChevronRight } from 'lucide-react';

interface BrandGridProps {
  brands: Brand[];
  products: Product[];
  selectedBrand: string;
  onSelectBrand: (brandName: string) => void;
}

export const BrandGrid: React.FC<BrandGridProps> = ({
  brands,
  products,
  selectedBrand,
  onSelectBrand
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Compute total product count per brand
  const brandCounts: Record<string, number> = {};
  products.forEach((p) => {
    if (p.marca) {
      brandCounts[p.marca] = (brandCounts[p.marca] || 0) + 1;
    }
  });

  // Unique list of brand names
  const allBrandNames = Array.from(
    new Set([...brands.map((b) => b.marca), ...Object.keys(brandCounts)])
  ).filter(Boolean);

  // Fallback image if brand has no image
  const defaultImg = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80';

  // Construct full brand items list including "TODAS"
  const allItems = [
    {
      name: '',
      label: 'TODAS LAS MARCAS',
      count: products.length,
      imgUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400&auto=format&fit=crop&q=80'
    },
    ...allBrandNames.map((brandName) => {
      const brandObj = brands.find((b) => b.marca.toLowerCase() === brandName.toLowerCase());
      return {
        name: brandName,
        label: brandName,
        count: brandCounts[brandName] || 0,
        imgUrl: brandObj?.imgUrl || defaultImg
      };
    })
  ];

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const amount = direction === 'left' ? -300 : 300;
      scrollRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <section className="my-6">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-3 border-b-4 border-black pb-2">
        <div className="flex items-center gap-2.5">
          <div className="bg-cyan-300 border-2 border-black p-1.5 shadow-[2px_2px_0px_0px_#000]">
            <Layers className="w-5 h-5 text-black" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tight font-sans">
              MARCAS DE CATALOGO
            </h2>
            <p className="text-[11px] font-mono font-bold text-slate-600">
              Deslizá horizontalmente para explorar por marca
            </p>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {selectedBrand && (
            <button
              onClick={() => onSelectBrand('')}
              className="bg-yellow-300 hover:bg-yellow-400 border-2 border-black px-2.5 py-1 font-black text-[11px] uppercase shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <span>Ver Todas</span>
              <span className="bg-black text-white px-1 py-0.2 text-[9px] font-mono">✕</span>
            </button>
          )}

          {/* Scroll Arrows - Hidden on mobile */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              onClick={() => scroll('left')}
              className="bg-black text-white hover:bg-pink-500 hover:text-black p-1.5 border border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-colors"
              title="Anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="bg-black text-white hover:bg-pink-500 hover:text-black p-1.5 border border-black shadow-[2px_2px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 cursor-pointer transition-colors"
              title="Siguiente"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Horizontal Navigatable Brands Ribbon Container */}
      <div className="bg-slate-100 border-3 border-black p-2.5 shadow-[4px_4px_0px_0px_#000] relative">
        <div
          ref={scrollRef}
          className="flex items-center gap-2.5 overflow-x-auto scrollbar-thin scrollbar-thumb-black scrollbar-track-slate-200 py-1 px-0.5 scroll-smooth select-none"
        >
          {allItems.map((item, idx) => {
            const isSelected = selectedBrand.toLowerCase() === item.name.toLowerCase();

            return (
              <button
                key={`${item.name}-${idx}`}
                onClick={() => onSelectBrand(item.name)}
                className={`relative w-20 sm:w-24 h-20 sm:h-24 flex-shrink-0 border-2 border-black bg-white overflow-hidden group cursor-pointer transition-all duration-200 flex flex-col justify-between p-1.5 text-left ${
                  isSelected
                    ? 'shadow-[3px_3px_0px_0px_#EC4899] border-pink-500 ring-2 ring-black -translate-y-0.5 bg-yellow-50'
                    : 'shadow-[3px_3px_0px_0px_#000] hover:shadow-[4px_4px_0px_0px_#000] hover:-translate-y-0.5 hover:border-black'
                }`}
              >
                {/* Top Badges */}
                <div className="flex justify-between items-start w-full z-10">
                  {item.name === '' ? (
                    <span className="bg-pink-500 text-black text-[8px] font-mono font-black px-1 py-0.2 border border-black">
                      TODAS
                    </span>
                  ) : (
                    <span className="bg-black text-yellow-300 text-[8px] font-mono font-bold px-1 py-0.2 border border-black">
                      {item.count}
                    </span>
                  )}

                  {isSelected && (
                    <span className="bg-yellow-300 text-black text-[8px] font-mono font-black px-1 py-0.2 border border-black">
                      ✓
                    </span>
                  )}
                </div>

                {/* Center Logo */}
                <div className="w-full h-10 sm:h-12 my-auto flex items-center justify-center p-0.5 relative overflow-hidden">
                  <img
                    src={item.imgUrl}
                    alt={item.label}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-200"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImg;
                    }}
                  />
                </div>

                {/* Bottom Label */}
                <div className="w-full text-center z-10 bg-white/95 border border-black px-0.5 py-0.2">
                  <span className="font-extrabold text-[9px] uppercase font-sans text-black block truncate leading-none">
                    {item.label}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};

