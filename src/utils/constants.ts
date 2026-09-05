import { Product } from '../types';

export const WHATSAPP_PHONE_RAW = '1178248137';
export const WHATSAPP_PHONE_INTERNATIONAL = '5491178248137';
export const WHATSAPP_PHONE_DISPLAY = '+54 9 11 7824-8137';
export const WHATSAPP_DIRECT_LINK = `https://wa.me/${WHATSAPP_PHONE_INTERNATIONAL}`;

export const BRAND_LOGO_PATH = '/MRP logo.png';
export const BRAND_METAD_PATH = '/MRP metad.png';

// Discovery Kit Constants
export const DISCOVERY_SAMPLE_PRICE = 10000;
export const DISCOVERY_MIN_SAMPLES = 3;
export const DISCOVERY_MAX_SAMPLES = 5;

// Funnel tracking helper for CRO analytics
export function trackFunnelEvent(eventName: string, payload?: Record<string, any>) {
  try {
    if (typeof window !== 'undefined') {
      const eventData = {
        event: eventName,
        timestamp: new Date().toISOString(),
        ...payload
      };
      // Log for verification & send to window.dataLayer if Google Tag Manager is present
      (window as any).dataLayer = (window as any).dataLayer || [];
      (window as any).dataLayer.push(eventData);
      // Dispatch custom DOM event
      window.dispatchEvent(new CustomEvent('mrp_analytics', { detail: eventData }));
    }
  } catch {
    // Fail silently without disrupting user experience
  }
}

// Intentions for "¿Qué estás buscando hoy?" section
export interface IntentionOption {
  id: string;
  label: string;
  subtitle: string;
  badge: string;
  tags: string[];
  filterGender?: string;
  filterType?: string;
  description: string;
}

export const INTENTION_OPTIONS: IntentionOption[] = [
  {
    id: 'diario',
    label: 'Para todos los días',
    subtitle: 'Versátiles, limpios y duraderos',
    badge: 'Uso Diario',
    tags: ['cítrico', 'fresco', 'acuático', 'limpio', 'versátil', 'eau de toilette'],
    description: 'Fragancias comodín que nunca cansan. Ideales para arrancar la mañana con energía.'
  },
  {
    id: 'noche',
    label: 'Para la noche',
    subtitle: 'Intensos, magnéticos y con presencia',
    badge: 'Noche & Salidas',
    tags: ['oriental', 'ambarino', 'intenso', 'amaderado', 'eau de parfum', 'especiado'],
    description: 'Aromas que proyectan y se hacen sentir cuando cae el sol.'
  },
  {
    id: 'cita',
    label: 'Para una cita',
    subtitle: 'Seductores, cercanos y adictivos',
    badge: 'Seducción',
    tags: ['gourmand', 'dulce', 'vainilla', 'cuero', 'sensual', 'cálido'],
    description: 'Para distancias cortas. Fragancias magnéticas que invitan a acercarse.'
  },
  {
    id: 'oficina',
    label: 'Para la oficina',
    subtitle: 'Elegantes, discretos y profesionales',
    badge: 'Profesional',
    tags: ['fresco', 'elegante', 'amaderado', 'aromático', 'fougere', 'clásico'],
    description: 'Pulcritud y distinción sin invadir el espacio ajeno.'
  },
  {
    id: 'regalar',
    label: 'Para regalar',
    subtitle: 'Aciertos seguros que no fallan',
    badge: 'Acierto Seguro',
    tags: ['popular', 'versátil', 'clásico', 'eau de toilette', 'fresco'],
    description: 'Los favoritos universales con mayor tasa de elogios comprobada.'
  },
  {
    id: 'notar',
    label: 'Quiero que se note',
    subtitle: 'Alta estela y duración extrema',
    badge: 'Máxima Estela',
    tags: ['intenso', 'parfum', 'elixir', 'ambarino', 'oriental', 'fuerte'],
    description: 'Para quienes entran a un lugar y quieren que su perfume hable antes que ellos.'
  },
  {
    id: 'fresco',
    label: 'Algo fresco',
    subtitle: 'Cítricos, marinos y verdes',
    badge: 'Frescura Pura',
    tags: ['cítrico', 'acuático', 'marino', 'verde', 'limón', 'bergamota'],
    description: 'Sensación de ducha recién tomada, brisa marina y vitalidad.'
  },
  {
    id: 'dulce',
    label: 'Algo dulce',
    subtitle: 'Vainilla, cacao, haba tonka y caramelo',
    badge: 'Gourmand & Dulce',
    tags: ['dulce', 'vainilla', 'tonka', 'gourmand', 'cálido', 'canela'],
    description: 'Envolventes, acogedores y adictivos con toques golosos.'
  },
  {
    id: 'sorprendeme',
    label: 'Sorprendeme',
    subtitle: 'Notas inesperadas y carácter único',
    badge: 'Curaduría Niche',
    tags: ['nicho', 'exclusivo', 'oriental', 'madera', 'cuero', 'incienso'],
    description: 'La recomendación de autor de Mr. Perkins para salir de lo convencional.'
  }
];

// Curated Editorial Quotes for "Mr. Perkins Dice"
export function getMrPerkinsQuote(product: Product): { quote: string; occasion: string; family: string } {
  const name = product.producto.toLowerCase();
  const desc = (product.descripcion || '').toLowerCase();
  const brand = product.marca.toLowerCase();

  let quote = "Un clásico equilibrado que destaca por su impecable relación de fijación y proyección.";
  let occasion = "Versátil / Todo momento";
  let family = "Amaderado Aromático";

  if (desc.includes('cítrico') || desc.includes('fresco') || desc.includes('marino') || name.includes('aqua') || name.includes('fresh')) {
    quote = "Limpio, energizante y peligrosamente fácil de usar. Es de esos perfumes que la gente asocia instantáneamente con buen gusto sin esfuerzo.";
    occasion = "Mañanas, primavera/verano, oficina y días cálidos";
    family = "Cítrico Acuático Refrescante";
  } else if (desc.includes('dulce') || desc.includes('vainilla') || desc.includes('gourmand') || name.includes('vanilla') || name.includes('elixir')) {
    quote = "Cálido y magnético. Abre con dulzura pero evoluciona hacia una base cremosa adictiva. Ideal cuando querés dejar una huella imborrable.";
    occasion = "Noches frías, citas íntimas y salidas nocturnas";
    family = "Oriental Gourmand Especiado";
  } else if (desc.includes('cuero') || desc.includes('tabaco') || desc.includes('madera') || desc.includes('oud') || name.includes('wood') || name.includes('black')) {
    quote = "Carácter rotundo. No pide disculpas ni permiso. La madera y los acordes oscuros le dan esa presencia de quien tiene el control.";
    occasion = "Otoño/invierno, eventos formales y noche";
    family = "Amaderado Cuero Noble";
  } else if (product.tipo.toLowerCase().includes('desodorante')) {
    quote = "Excelente concentración de fijación. Para complementar tu fragancia diaria o mantener frescura impecable durante 24 horas.";
    occasion = "Post ducha, gimnasio y uso diario continuo";
    family = "Desodorante Corporal de Alta Intensidad";
  } else if (brand.includes('dior') || brand.includes('chanel') || brand.includes('creed') || brand.includes('tom ford')) {
    quote = "Una pieza de alta perfumería. La nobleza de los aceites esenciales se percibe en cada transición de las notas de fondo.";
    occasion = "Ocasiones especiales y firmas personales";
    family = "Prestige Designer / Alta Concentración";
  }

  return { quote, occasion, family };
}

// Utility to shuffle an array using Fisher-Yates algorithm
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Utility to pick N random items from an array without mutating the original
export function getRandomSample<T>(array: T[], count: number): T[] {
  if (!array || array.length === 0) return [];
  if (array.length <= count) return shuffleArray(array);
  return shuffleArray(array).slice(0, count);
}
