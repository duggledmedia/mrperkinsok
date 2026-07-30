import React, { useRef, useEffect } from 'react';
import { Brand, Product } from '../types';

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
  const isHovered = useRef(false);

  // Compute product count per brand
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

  const defaultImg = 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400&auto=format&fit=crop&q=80';

  // Construct list of brands with logos
  const brandList = allBrandNames.map((brandName) => {
    const brandObj = brands.find((b) => b.marca.toLowerCase() === brandName.toLowerCase());
    return {
      name: brandName,
      imgUrl: brandObj?.imgUrl || defaultImg,
      count: brandCounts[brandName] || 0,
    };
  });

  // Triplicate list for infinite seamless scrolling
  const displayList = brandList.length > 0 ? [...brandList, ...brandList, ...brandList] : [];

  // Start at a random logo position on load
  useEffect(() => {
    if (!scrollRef.current || brandList.length === 0) return;

    const timer = setTimeout(() => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const singleSetWidth = container.scrollWidth / 3;
        const randomIndex = Math.floor(Math.random() * brandList.length);
        const randomOffset = singleSetWidth + (randomIndex / brandList.length) * singleSetWidth;
        container.scrollLeft = randomOffset;
      }
    }, 50);

    return () => clearTimeout(timer);
  }, [brandList.length]);

  // Slow automatic continuous scrolling from right to left (scrollLeft increases)
  useEffect(() => {
    let animId: number;

    const step = () => {
      if (scrollRef.current && !isHovered.current) {
        const container = scrollRef.current;
        const singleSetWidth = container.scrollWidth / 3;

        container.scrollLeft += 0.8; // Slow smooth movement speed

        // Seamless wrap loop
        if (container.scrollLeft >= singleSetWidth * 2) {
          container.scrollLeft -= singleSetWidth;
        } else if (container.scrollLeft <= 0) {
          container.scrollLeft += singleSetWidth;
        }
      }
      animId = requestAnimationFrame(step);
    };

    animId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(animId);
  }, [brandList.length]);

  return (
    <div className="my-3 relative">
      {/* Animated White to Light-Gray Gradient Compact Outer Container */}
      <div className="animate-gradient-shimmer border-3 border-black p-1.5 sm:p-2 shadow-[3px_3px_0px_0px_#000] relative overflow-hidden">
        
        {/* Selected Brand Banner (Only shown when a brand is selected) */}
        {selectedBrand && (
          <div className="flex items-center justify-between mb-2 px-1 z-10 relative">
            <span className="bg-yellow-300 text-black border border-black px-2.5 py-0.5 font-mono font-black text-xs uppercase shadow-[1.5px_1.5px_0px_0px_#000]">
              MARCA: {selectedBrand}
            </span>
            <button
              onClick={() => onSelectBrand('')}
              className="bg-black text-white hover:bg-pink-600 border border-black px-2.5 py-0.5 font-mono text-[11px] font-bold uppercase shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer transition-colors"
            >
              VER TODAS ✕
            </button>
          </div>
        )}

        {/* Horizontal Floating Brand Logos Carousel Track */}
        <div
          ref={scrollRef}
          onMouseEnter={() => { isHovered.current = true; }}
          onMouseLeave={() => { isHovered.current = false; }}
          onTouchStart={() => { isHovered.current = true; }}
          onTouchEnd={() => { isHovered.current = false; }}
          className="flex items-center gap-6 sm:gap-10 md:gap-14 overflow-x-auto brand-scrollbar py-1 px-2 select-none"
        >
          {displayList.map((brand, idx) => {
            const isSelected = selectedBrand.toLowerCase() === brand.name.toLowerCase();

            return (
              <button
                key={`${brand.name}-${idx}`}
                onClick={() => onSelectBrand(isSelected ? '' : brand.name)}
                title={`Filtrar por ${brand.name}`}
                className={`relative flex-shrink-0 cursor-pointer transition-all duration-300 flex items-center justify-center p-1 group ${
                  isSelected
                    ? 'scale-110 opacity-100 filter drop-shadow-[0_8px_12px_rgba(236,72,153,0.6)]'
                    : 'opacity-85 hover:opacity-100 hover:scale-110 filter drop-shadow-[0_4px_6px_rgba(0,0,0,0.2)]'
                }`}
              >
                {/* Large Floating Logo Image without boxes or borders */}
                <div className="w-28 sm:w-40 md:w-48 h-20 sm:h-28 md:h-32 flex items-center justify-center">
                  <img
                    src={brand.imgUrl}
                    alt={brand.name}
                    className="w-full h-full object-contain filter transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = defaultImg;
                    }}
                  />
                </div>

                {/* Active pill indicator below if selected */}
                {isSelected && (
                  <span className="absolute -bottom-1 bg-pink-500 text-black font-mono font-black text-[10px] px-2 py-0.2 border border-black shadow-[1.5px_1.5px_0px_0px_#000]">
                    SELECCIONADA
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};



