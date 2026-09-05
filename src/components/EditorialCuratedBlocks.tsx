import React from 'react';
import { Product } from '../types';
import { Sparkles, Eye, ShoppingBag, ArrowRight, Droplets, Flame, Award } from 'lucide-react';
import { trackFunnelEvent, getRandomSample } from '../utils/constants';

interface EditorialCuratedBlocksProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  onGoToStoreWithFilter: (searchTerm: string) => void;
}

export const EditorialCuratedBlocks: React.FC<EditorialCuratedBlocksProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onGoToStoreWithFilter
}) => {
  const valid = products.filter((p) => p.imgUrl && p.stock !== 'No');

  // 1. "Perfumes que huelen a limpio" (fresh, citrus, aquatic, ozonic)
  const cleanFragrances = React.useMemo(() => {
    const keywords = ['limpio', 'cítrico', 'acuático', 'fresco', 'marino', 'bergamota', 'aqua', 'blue', 'bleu'];
    const matches = valid.filter((p) => {
      const text = `${p.producto} ${p.marca} ${p.descripcion} ${(p.clasificacion || []).join(' ')}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    return getRandomSample(matches, 3);
  }, [valid]);

  // 2. "Perfumes para no pasar desapercibido" (amber, vanilla, spicy, leather, intense)
  const boldFragrances = React.useMemo(() => {
    const keywords = ['intenso', 'noche', 'oriental', 'cuero', 'ambar', 'especiado', 'elixir', 'parfum', 'black', 'noir', 'sauvage'];
    const matches = valid.filter((p) => {
      const text = `${p.producto} ${p.marca} ${p.descripcion} ${(p.clasificacion || []).join(' ')}`.toLowerCase();
      return keywords.some((kw) => text.includes(kw));
    });
    return getRandomSample(matches, 3);
  }, [valid]);

  // 3. "Clásicos que nunca fallan" (crowd pleasers, iconic designers)
  const classicFragrances = React.useMemo(() => {
    const designerBrands = ['paco rabanne', 'carolina herrera', 'dior', 'chanel', 'armani', 'calvin klein', 'antonio banderas'];
    const matches = valid.filter((p) => {
      const brand = p.marca.toLowerCase();
      return designerBrands.some((b) => brand.includes(b));
    });
    return getRandomSample(matches, 3);
  }, [valid]);

  return (
    <div className="space-y-16 py-8">
      {/* 1. PERFUMES QUE HUELEN A LIMPIO */}
      <section className="bg-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-black pb-4 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-cyan-200 text-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest border border-black">
              <Droplets className="w-3.5 h-3.5 text-cyan-800" />
              <span>COLECCIÓN EDITORIAL 01</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-black font-sans tracking-tight">
              PERFUMES QUE HUELEN A LIMPIO
            </h3>
            <p className="text-xs sm:text-sm font-serif italic text-slate-700">
              "Sensación de camisa recién planchada, brisa marina y pulcritud absoluta. Impecables para oficina y el día a día."
            </p>
          </div>

          <button
            onClick={() => onGoToStoreWithFilter('fresco')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-black hover:text-cyan-700 underline cursor-pointer shrink-0"
          >
            <span>Ver más fragancias limpias</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {cleanFragrances.map((product) => (
            <ProductMiniCard
              key={product.id}
              product={product}
              accentColor="bg-cyan-100 border-cyan-300"
              badgeText="Aroma Limpio"
              onSelect={() => onSelectProduct(product)}
              onAdd={(e) => onAddToCart(product, e)}
            />
          ))}
        </div>
      </section>

      {/* 2. PERFUMES PARA NO PASAR DESAPERCIBIDO */}
      <section className="bg-[#121212] text-white border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_#E5A93C]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-[#333] pb-4 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-[#E5A93C] text-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest border border-black">
              <Flame className="w-3.5 h-3.5 text-black" />
              <span>COLECCIÓN EDITORIAL 02</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-white font-sans tracking-tight">
              PARA NO PASAR DESAPERCIBIDO
            </h3>
            <p className="text-xs sm:text-sm font-serif italic text-[#E5A93C]">
              "Fragancias con estela expansiva, magnetismo nocturno y notas cálidas que permanecen horas después de que te fuiste."
            </p>
          </div>

          <button
            onClick={() => onGoToStoreWithFilter('noche')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-[#E5A93C] hover:underline cursor-pointer shrink-0"
          >
            <span>Ver más fragancias de noche</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {boldFragrances.map((product) => (
            <ProductMiniCard
              key={product.id}
              product={product}
              isDark
              accentColor="bg-amber-950 text-[#E5A93C] border-amber-700"
              badgeText="Estela Intensa"
              onSelect={() => onSelectProduct(product)}
              onAdd={(e) => onAddToCart(product, e)}
            />
          ))}
        </div>
      </section>

      {/* 3. CLÁSICOS QUE NUNCA FALLAN */}
      <section className="bg-[#FAF8F5] border-4 border-black p-6 sm:p-8 shadow-[8px_8px_0px_0px_#000]">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b-3 border-black pb-4 mb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 bg-lime-300 text-black px-2.5 py-0.5 font-mono text-[10px] font-black uppercase tracking-widest border border-black">
              <Award className="w-3.5 h-3.5 text-black" />
              <span>COLECCIÓN EDITORIAL 03</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black uppercase text-black font-sans tracking-tight">
              CLÁSICOS QUE NUNCA FALLAN
            </h3>
            <p className="text-xs sm:text-sm font-serif italic text-slate-700">
              "Las fórmulas consagradas que superaron el paso del tiempo. Elegancia probada y aprobación unánime."
            </p>
          </div>

          <button
            onClick={() => onGoToStoreWithFilter('clasico')}
            className="inline-flex items-center gap-1.5 text-xs font-mono font-black uppercase text-black hover:underline cursor-pointer shrink-0"
          >
            <span>Ver más clásicos</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {classicFragrances.map((product) => (
            <ProductMiniCard
              key={product.id}
              product={product}
              accentColor="bg-lime-100 border-lime-300 text-lime-900"
              badgeText="Clásico Infalible"
              onSelect={() => onSelectProduct(product)}
              onAdd={(e) => onAddToCart(product, e)}
            />
          ))}
        </div>
      </section>
    </div>
  );
};

interface ProductMiniCardProps {
  product: Product;
  badgeText: string;
  accentColor?: string;
  isDark?: boolean;
  onSelect: () => void;
  onAdd: (e: React.MouseEvent) => void;
}

const ProductMiniCard: React.FC<ProductMiniCardProps> = ({
  product,
  badgeText,
  accentColor = 'bg-slate-100',
  isDark = false,
  onSelect,
  onAdd
}) => {
  return (
    <div
      className={`border-3 border-black p-3.5 flex flex-col justify-between shadow-[4px_4px_0px_0px_#000] transition-all group ${
        isDark ? 'bg-[#1C1C1C] text-white' : 'bg-white text-black'
      }`}
    >
      <div>
        <div
          className="aspect-square bg-slate-100 border-2 border-black overflow-hidden relative cursor-pointer mb-2.5"
          onClick={onSelect}
        >
          <img
            src={product.imgUrl}
            alt={product.producto}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          <div className="absolute top-1.5 left-1.5 bg-black text-[#E5A93C] text-[9px] font-mono font-bold px-1.5 py-0.2 border border-white">
            {product.marca}
          </div>
          <div className={`absolute bottom-1.5 left-1.5 text-[9px] font-mono font-black px-1.5 py-0.2 border border-black ${accentColor}`}>
            {badgeText}
          </div>
        </div>

        <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
          {product.tipo} • {product.cantidad}
        </span>

        <h4
          onClick={onSelect}
          className="text-sm font-black uppercase font-sans leading-snug hover:text-[#C99846] cursor-pointer line-clamp-2 mt-0.5 break-words"
        >
          {product.producto}
        </h4>
      </div>

      <div className="pt-2.5 mt-2.5 border-t border-black/20 space-y-2">
        <div className="flex flex-col xs:flex-row xs:items-baseline xs:justify-between gap-1">
          <span className="text-base font-black font-mono">
            ${product.precioVenta.toLocaleString('es-AR')}
          </span>
          <span className="text-[9px] font-mono text-emerald-700 bg-emerald-100 px-1 py-0.2 font-bold self-start xs:self-auto">
            3 cuotas s/i
          </span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={onSelect}
            className={`border border-black py-2 text-[11px] font-bold uppercase flex items-center justify-center gap-1 cursor-pointer ${
              isDark ? 'bg-[#2A2A2A] hover:bg-[#333]' : 'bg-slate-100 hover:bg-slate-200'
            }`}
          >
            <Eye className="w-3 h-3" /> Ver
          </button>
          <button
            disabled={product.stock === 'No'}
            onClick={onAdd}
            className="bg-[#E5A93C] hover:bg-amber-500 text-black border border-black py-2 text-[11px] font-black uppercase flex items-center justify-center gap-1 shadow-[1.5px_1.5px_0px_0px_#000] cursor-pointer"
          >
            <ShoppingBag className="w-3 h-3" /> + Agregar
          </button>
        </div>
      </div>
    </div>
  );
};
