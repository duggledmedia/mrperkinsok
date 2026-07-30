import React from 'react';
import { Brand, Product } from '../types';
import { Layers, Sparkles } from 'lucide-react';

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

  // Distribute items across 3 rows for multi-row infinite marquee
  const row1 = allItems.filter((_, idx) => idx % 3 === 0);
  const row2 = allItems.filter((_, idx) => idx % 3 === 1);
  const row3 = allItems.filter((_, idx) => idx % 3 === 2);

  // Duplicate items in each row to create seamless loop
  const duplicateRow = (rowItems: typeof allItems) => {
    if (rowItems.length === 0) return [];
    // Ensure at least 8 elements per loop
    let list = [...rowItems];
    while (list.length < 10) {
      list = [...list, ...rowItems];
    }
    return [...list, ...list];
  };

  const row1Loop = duplicateRow(row1);
  const row2Loop = duplicateRow(row2);
  const row3Loop = duplicateRow(row3);

  const renderBrandCard = (item: typeof allItems[0], indexKey: string) => {
    const isSelected = selectedBrand.toLowerCase() === item.name.toLowerCase();

    return (
      <button
        key={indexKey}
        onClick={() => onSelectBrand(item.name)}
        className={`relative w-28 h-28 sm:w-36 sm:h-36 flex-shrink-0 mx-2 border-3 border-black bg-gradient-to-b from-white via-slate-50 to-neutral-200 overflow-hidden group cursor-pointer transition-all duration-300 flex flex-col justify-between p-2 text-left ${
          isSelected
            ? 'shadow-[5px_5px_0px_0px_#EC4899] border-pink-500 ring-2 ring-black -translate-y-1 bg-gradient-to-b from-yellow-50 via-yellow-100 to-yellow-200'
            : 'shadow-[4px_4px_0px_0px_#000] hover:shadow-[6px_6px_0px_0px_#000] hover:-translate-y-1 hover:border-black'
        }`}
      >
        {/* Top Badges */}
        <div className="flex justify-between items-start w-full z-10">
          {item.name === '' ? (
            <span className="bg-pink-500 text-black text-[9px] font-mono font-black px-1.5 py-0.5 border border-black shadow-xs">
              TODAS
            </span>
          ) : (
            <span className="bg-black text-yellow-300 text-[9px] font-mono font-bold px-1.5 py-0.5 border border-black shadow-xs">
              {item.count} PROD
            </span>
          )}

          {isSelected && (
            <span className="bg-yellow-300 text-black text-[9px] font-mono font-black px-1 py-0.5 border border-black">
              ✓
            </span>
          )}
        </div>

        {/* Center Logo / Image Container */}
        <div className="w-full h-14 sm:h-18 my-auto flex items-center justify-center p-1 relative overflow-hidden">
          <img
            src={item.imgUrl}
            alt={item.label}
            className="w-full h-full object-contain group-hover:scale-115 transition-transform duration-300 drop-shadow-sm"
            onError={(e) => {
              (e.target as HTMLImageElement).src = defaultImg;
            }}
          />
        </div>

        {/* Bottom Label */}
        <div className="w-full text-center z-10 bg-white/90 backdrop-blur-xs border border-black px-1 py-0.5 shadow-xs">
          <span className="font-extrabold text-[10px] sm:text-xs uppercase font-sans text-black block truncate">
            {item.label}
          </span>
        </div>
      </button>
    );
  };

  return (
    <section className="my-8">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b-4 border-black pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-cyan-300 border-3 border-black p-2 shadow-[3px_3px_0px_0px_#000]">
            <Layers className="w-6 h-6 text-black" />
          </div>
          <div>
            <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-tight font-sans">
              MARCAS EXCLUSIVAS
            </h2>
            <p className="text-xs font-mono font-bold text-slate-600">
              Desplazamiento horizontal continuo en 3 filas (pasá el cursor para pausar)
            </p>
          </div>
        </div>

        {/* Reset Filter Button */}
        {selectedBrand && (
          <button
            onClick={() => onSelectBrand('')}
            className="bg-yellow-300 hover:bg-yellow-400 border-2 border-black px-4 py-1.5 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] active:translate-x-0.5 active:translate-y-0.5 transition-all cursor-pointer flex items-center gap-2"
          >
            <span>Mostrar Todas las Marcas</span>
            <span className="bg-black text-white px-1.5 py-0.5 text-[10px] font-mono">✕</span>
          </button>
        )}
      </div>

      {/* 3-Row Horizontal Infinite Marquee Container */}
      <div className="bg-gradient-to-b from-slate-100 via-slate-50 to-amber-50 border-4 border-black p-3 shadow-[6px_6px_0px_0px_#000] space-y-3 overflow-hidden">
        {/* Row 1: Left Scroll */}
        <div className="overflow-hidden whitespace-nowrap relative flex">
          <div className="animate-marquee hover:[animation-play-state:paused] flex items-center">
            {row1Loop.map((item, idx) => renderBrandCard(item, `row1-${idx}-${item.name}`))}
          </div>
        </div>

        {/* Row 2: Right Scroll (Reverse) */}
        <div className="overflow-hidden whitespace-nowrap relative flex">
          <div className="animate-marquee-reverse hover:[animation-play-state:paused] flex items-center">
            {row2Loop.map((item, idx) => renderBrandCard(item, `row2-${idx}-${item.name}`))}
          </div>
        </div>

        {/* Row 3: Left Scroll */}
        <div className="overflow-hidden whitespace-nowrap relative flex">
          <div className="animate-marquee hover:[animation-play-state:paused] flex items-center">
            {row3Loop.map((item, idx) => renderBrandCard(item, `row3-${idx}-${item.name}`))}
          </div>
        </div>
      </div>
    </section>
  );
};

