import React from 'react';

export interface StickerData {
  text: string;
  bg: string;
  rotate: string;
  animation: string;
}

export const STICKER_POOL: StickerData[] = [
  { text: "Envío gratis en Caba!", bg: "bg-yellow-300", rotate: "rotate-[-4deg]", animation: "animate-bounce [animation-duration:5s]" },
  { text: "Hasta 3 Cuotas sin interés!", bg: "bg-pink-400", rotate: "rotate-[3deg]", animation: "animate-pulse [animation-duration:4s]" },
  { text: "Oferta de tiempo limitado!", bg: "bg-cyan-300", rotate: "rotate-[-2deg]", animation: "animate-bounce [animation-duration:6s]" },
  { text: "Oferta hasta agotar stock!!", bg: "bg-lime-300", rotate: "rotate-[4deg]", animation: "animate-pulse [animation-duration:4.5s]" },
  { text: "Envíos a todo el País.", bg: "bg-orange-300", rotate: "rotate-[-3deg]", animation: "animate-bounce [animation-duration:5.5s]" },
];

export function getProductStickers(productId: string): StickerData[] {
  let hash = 0;
  for (let i = 0; i < productId.length; i++) {
    hash = (hash << 5) - hash + productId.charCodeAt(i);
    hash |= 0;
  }
  const positiveHash = Math.abs(hash);
  
  // Decide 1 or 2 stickers (60% get 2 stickers, 40% get 1 sticker)
  const count = (positiveHash % 10) < 6 ? 2 : 1;
  
  const idx1 = positiveHash % STICKER_POOL.length;
  const idx2 = (positiveHash + 3) % STICKER_POOL.length;
  
  if (count === 1) {
    return [STICKER_POOL[idx1]];
  } else {
    const first = STICKER_POOL[idx1];
    const secondIndex = idx2 === idx1 ? (idx1 + 1) % STICKER_POOL.length : idx2;
    const second = STICKER_POOL[secondIndex];
    return [first, second];
  }
}

interface ComicStickerProps {
  text: string;
  bg: string;
  rotate?: string;
  animation?: string;
  className?: string;
}

export const ComicSticker: React.FC<ComicStickerProps> = ({
  text,
  bg,
  rotate = 'rotate-[-3deg]',
  animation = '',
  className = ''
}) => {
  return (
    <div className={`relative inline-flex flex-col items-start ${rotate} ${animation} z-20 pointer-events-none ${className}`}>
      {/* Speech Bubble Box */}
      <div className={`${bg} text-black font-black text-[9px] sm:text-[10px] leading-tight px-2 py-0.5 sm:py-1 border-2 border-black rounded-lg uppercase tracking-tight shadow-[2px_2px_0px_0px_#000] flex items-center gap-1 whitespace-nowrap`}>
        <span className="text-[10px]">💥</span>
        <span>{text}</span>
      </div>
      {/* Speech bubble tail pointer */}
      <div className="ml-3 -mt-[1px] w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-black"></div>
    </div>
  );
};
