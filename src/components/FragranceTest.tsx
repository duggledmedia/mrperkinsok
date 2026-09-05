import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { Sparkles, ArrowRight, ArrowLeft, RotateCcw, Check, ShoppingBag, Eye, Heart, Compass, ShieldCheck } from 'lucide-react';
import { trackFunnelEvent } from '../utils/constants';

interface FragranceTestProps {
  products: Product[];
  onSelectProduct: (product: Product) => void;
  onAddToCart: (product: Product, e?: React.MouseEvent) => void;
  onCloseTest?: () => void;
}

interface Question {
  id: string;
  stepTitle?: string;
  question: string;
  mrPerkinsIntro: string;
  options: {
    label: string;
    description: string;
    value: string;
    genderFilter?: 'Hombre' | 'Mujer' | 'Unisex' | 'Todos';
    tagBoost: string[];
  }[];
}

const RECIPIENT_QUESTION: Question = {
  id: 'recipient',
  question: '¿Para quién estamos buscando esta fragancia?',
  mrPerkinsIntro: 'Permítame comenzar por lo esencial. Cada fragancia interactúa con la piel y la ocasión de manera diferente.',
  options: [
    {
      label: 'Para mí (Masculino)',
      description: 'Fragancias masculinas con carácter, frescura o maderas nobles.',
      value: 'hombre',
      genderFilter: 'Hombre',
      tagBoost: ['hombre', 'masculino', 'caballero']
    },
    {
      label: 'Para mí (Femenino)',
      description: 'Aromas florales, dulces, frutales o ambarinos sofisticados.',
      value: 'mujer',
      genderFilter: 'Mujer',
      tagBoost: ['mujer', 'femenino', 'dama']
    },
    {
      label: 'Para mí (Unisex / Sin etiquetas)',
      description: 'Creaciones modernas y libres centradas puramente en el aroma.',
      value: 'unisex',
      genderFilter: 'Unisex',
      tagBoost: ['unisex', 'nicho', 'compartida']
    },
    {
      label: 'Es un regalo especial',
      description: 'Buscamos una fragancia con alta probabilidad de encantar a primera olida.',
      value: 'regalo',
      genderFilter: 'Todos',
      tagBoost: ['clásico', 'popular', 'versátil', 'elegante', 'regalo']
    }
  ]
};

const GIFT_TARGET_QUESTION: Question = {
  id: 'gift_target',
  question: '¿Para quién es el regalo?',
  mrPerkinsIntro: 'Un obsequio bien elegido jamás se olvida. ¿Hacia qué perfil nos orientamos?',
  options: [
    {
      label: 'Regalo para Hombre (Masculino)',
      description: 'Fragancias masculinas con carácter varonil, maderas nobles o frescor dinámico.',
      value: 'hombre',
      genderFilter: 'Hombre',
      tagBoost: ['hombre', 'masculino', 'caballero', 'regalo']
    },
    {
      label: 'Regalo para Mujer (Femenino)',
      description: 'Perfumes florales, dulces, gourmand o ambarinos para deslumbrarla.',
      value: 'mujer',
      genderFilter: 'Mujer',
      tagBoost: ['mujer', 'femenino', 'dama', 'regalo']
    },
    {
      label: 'Regalo Unisex (Sin distinción de género)',
      description: 'Creaciones versátiles y elegantes que encantan a cualquier persona.',
      value: 'unisex',
      genderFilter: 'Unisex',
      tagBoost: ['unisex', 'nicho', 'compartida', 'regalo']
    }
  ]
};

const COMMON_QUESTIONS: Question[] = [
  {
    id: 'occasion',
    question: '¿En qué momento principal imaginás usando este perfume?',
    mrPerkinsIntro: 'Excelente. El contexto define la concentración y la estructura olfativa que debemos buscar.',
    options: [
      {
        label: 'Todos los días (Rutina, oficina, trabajo diario)',
        description: 'Aromas limpios y versátiles que no saturan tras horas de uso.',
        value: 'diario',
        tagBoost: ['fresco', 'cítrico', 'acuático', 'limpio', 'versátil']
      },
      {
        label: 'Noche, salidas y eventos sociales',
        description: 'Fragancias con peso aromático, calidez y presencia nocturna.',
        value: 'noche',
        tagBoost: ['oriental', 'ambarino', 'intenso', 'especiado', 'noche']
      },
      {
        label: 'Citas y encuentros íntimos',
        description: 'Aromas envolventes y seductores pensados para distancias cortas.',
        value: 'cita',
        tagBoost: ['gourmand', 'dulce', 'vainilla', 'cuero', 'sensual']
      },
      {
        label: 'Comodín absoluto (Día y noche sin complicaciones)',
        description: 'Un perfume firma que funciona impecable en cualquier situación.',
        value: 'versatil',
        tagBoost: ['versátil', 'clásico', 'fresco', 'aromático']
      }
    ]
  },
  {
    id: 'sensation',
    question: '¿Qué sensación querés transmitir al entrar a una habitación?',
    mrPerkinsIntro: 'El perfume es comunicación silenciosa. ¿Qué mensaje debe dar antes de que hables?',
    options: [
      {
        label: 'Pulcritud y frescura impecable',
        description: 'Sensación de camisa blanca planchada, ducha reconfortante y energía.',
        value: 'pulcro',
        tagBoost: ['limpio', 'acuático', 'cítrico', 'marino', 'ozónico']
      },
      {
        label: 'Misterio, seducción e intriga',
        description: 'De esos aromas que provocan que alguien pregunte: "¿qué perfume tenés puesto?".',
        value: 'seductor',
        tagBoost: ['ambarino', 'especiado', 'cuero', 'vainilla', 'dulce']
      },
      {
        label: 'Elegancia sobria y autoridad natural',
        description: 'Madurez, compostura y sofisticación sin estridencias.',
        value: 'elegante',
        tagBoost: ['amaderado', 'vetiver', 'cedro', 'elegante', 'fougere']
      },
      {
        label: 'Calidez dulce y reconfortante',
        description: 'Notas golosas, acarameladas y envolventes que transmiten cercanía.',
        value: 'calido',
        tagBoost: ['dulce', 'tonka', 'caramelo', 'gourmand', 'cálido']
      }
    ]
  },
  {
    id: 'family',
    question: '¿Qué acorde olfativo te llama más la atención por instinto?',
    mrPerkinsIntro: 'Confíe en su instinto; la memoria olfativa suele saber exactamente qué le gusta.',
    options: [
      {
        label: 'Cítricos & Acuáticos',
        description: 'Bergamota italiana, limón siciliano, mandarina y brisa marina.',
        value: 'citrico',
        tagBoost: ['cítrico', 'acuático', 'marino', 'bergamota', 'fresco']
      },
      {
        label: 'Maderas Nobles & Terrosos',
        description: 'Cedro de Virginia, sándalo cremoso, vetiver y toques de cuero.',
        value: 'amaderado',
        tagBoost: ['amaderado', 'madera', 'cedro', 'sándalo', 'vetiver']
      },
      {
        label: 'Gourmand & Dulces Cálidos',
        description: 'Vainilla bourbon, haba tonka tostada, café, miel y praliné.',
        value: 'gourmand',
        tagBoost: ['vainilla', 'dulce', 'tonka', 'gourmand', 'café']
      },
      {
        label: 'Especias & Ámbar Oriental',
        description: 'Canela, cardamomo, pimienta rosa, ámbar resinoso e incienso.',
        value: 'oriental',
        tagBoost: ['oriental', 'especiado', 'ámbar', 'cardamomo', 'canela']
      },
      {
        label: 'Florales Frescos & Aromáticos',
        description: 'Lavanda francesa, jazmín blanco, azahar y flores limpias.',
        value: 'floral',
        tagBoost: ['floral', 'aromático', 'lavanda', 'jazmín', 'flores']
      }
    ]
  },
  {
    id: 'projection',
    question: '¿Cómo preferís que sea la estela y presencia del perfume?',
    mrPerkinsIntro: 'Hablemos de modales olfativos: desde la discreción británica hasta la potencia expansiva.',
    options: [
      {
        label: 'Íntimo y discreto',
        description: 'Se percibe a corta distancia, ideal para abrazos y cercanía.',
        value: 'discreto',
        tagBoost: ['eau de toilette', 'suave', 'limpio', 'ligero']
      },
      {
        label: 'Equilibrio perfecto (1 a 2 metros)',
        description: 'Se siente al pasar sin resultar invasivo en espacios cerrados.',
        value: 'moderado',
        tagBoost: ['eau de toilette', 'eau de parfum', 'equilibrado']
      },
      {
        label: 'Alta proyección y estela imponente',
        description: 'Que permanezca en la habitación incluso después de retirarse.',
        value: 'fuerte',
        tagBoost: ['eau de parfum', 'parfum', 'elixir', 'intenso']
      }
    ]
  },
  {
    id: 'budget',
    question: '¿Qué tipo de formato o inversión tenés en mente?',
    mrPerkinsIntro: 'Última pregunta. En Mr. Perkins contamos con opciones para todos los niveles de exigencia.',
    options: [
      {
        label: 'Excelente relación precio-calidad',
        description: 'Gran rendimiento al precio más inteligente del mercado.',
        value: 'accesible',
        tagBoost: ['accesible', 'económico', 'desodorante']
      },
      {
        label: 'Gama media / Diseñador consagrado',
        description: 'Las marcas más celebradas y premiadas de la perfumería internacional.',
        value: 'medio',
        tagBoost: ['diseñador', 'importado', 'eau de parfum']
      },
      {
        label: 'Alta concentración o piezas exclusivas',
        description: 'Máxima concentración de esencias y formulaciones prémium.',
        value: 'premium',
        tagBoost: ['premium', 'parfum', 'elixir', 'lujo']
      }
    ]
  }
];

const ALL_POSSIBLE_QUESTIONS: Question[] = [
  RECIPIENT_QUESTION,
  GIFT_TARGET_QUESTION,
  ...COMMON_QUESTIONS
];

export const FragranceTest: React.FC<FragranceTestProps> = ({
  products,
  onSelectProduct,
  onAddToCart,
  onCloseTest
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState<{
    myChoice: Product;
    safeBet: Product;
    adventurous: Product;
    targetGender: 'hombre' | 'mujer' | 'unisex';
    isGift: boolean;
  } | null>(null);

  // Dynamically compute questions: if "regalo" was chosen in step 1, insert the gift recipient question!
  const activeQuestions = useMemo(() => {
    const list: Question[] = [RECIPIENT_QUESTION];
    if (answers['recipient'] === 'regalo') {
      list.push(GIFT_TARGET_QUESTION);
    }
    list.push(...COMMON_QUESTIONS);

    return list.map((q, idx) => ({
      ...q,
      stepTitle: `PASO ${idx + 1} DE ${list.length}`
    }));
  }, [answers['recipient']]);

  const activeQuestion = activeQuestions[currentStep] || activeQuestions[0];

  const handleSelectOption = (questionId: string, value: string) => {
    const updatedAnswers = { ...answers, [questionId]: value };
    // If recipient is changed from 'regalo' to another, clear any obsolete gift_target
    if (questionId === 'recipient' && value !== 'regalo') {
      delete updatedAnswers['gift_target'];
    }
    setAnswers(updatedAnswers);

    trackFunnelEvent('fragrance_test_step', {
      step: currentStep + 1,
      questionId,
      answerValue: value
    });

    if (currentStep < activeQuestions.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final step: trigger recommendation calculation
      calculateRecommendations(updatedAnswers);
    }
  };

  const calculateRecommendations = (finalAnswers: Record<string, string>) => {
    setIsAnalyzing(true);
    trackFunnelEvent('fragrance_test_completed', finalAnswers);

    setTimeout(() => {
      // 1. Determine target gender logically from answers
      let targetGender: 'hombre' | 'mujer' | 'unisex' = 'hombre';
      const isGift = finalAnswers['recipient'] === 'regalo';

      if (isGift) {
        if (finalAnswers['gift_target'] === 'mujer') targetGender = 'mujer';
        else if (finalAnswers['gift_target'] === 'unisex') targetGender = 'unisex';
        else targetGender = 'hombre';
      } else {
        if (finalAnswers['recipient'] === 'mujer') targetGender = 'mujer';
        else if (finalAnswers['recipient'] === 'unisex') targetGender = 'unisex';
        else targetGender = 'hombre';
      }

      // Initial candidate pool with images
      let pool = products.filter((p) => p.imgUrl && p.imgUrl.trim() !== '');
      if (pool.length === 0) pool = products;

      // 2. Strict gender filtering so recommendations are 100% coherent with user's request
      if (targetGender === 'hombre') {
        const strictlyMale = pool.filter((p) => {
          const g = (p.genero || '').toLowerCase();
          const isFemale = g.includes('mujer') || g.includes('femenin') || g.includes('dama');
          const isMale = g.includes('hombre') || g.includes('masculin') || g.includes('caballero');
          return isMale && !isFemale;
        });
        if (strictlyMale.length >= 3) {
          pool = strictlyMale;
        } else {
          // Fallback: exclude any feminine products
          pool = pool.filter((p) => {
            const g = (p.genero || '').toLowerCase();
            return !g.includes('mujer') && !g.includes('femenin');
          });
        }
      } else if (targetGender === 'mujer') {
        const strictlyFemale = pool.filter((p) => {
          const g = (p.genero || '').toLowerCase();
          const isFemale = g.includes('mujer') || g.includes('femenin') || g.includes('dama');
          const isMale = g.includes('hombre') || g.includes('masculin') || g.includes('caballero');
          return isFemale && !isMale;
        });
        if (strictlyFemale.length >= 3) {
          pool = strictlyFemale;
        } else {
          // Fallback: exclude any masculine products
          pool = pool.filter((p) => {
            const g = (p.genero || '').toLowerCase();
            return !g.includes('hombre') && !g.includes('masculin');
          });
        }
      } else {
        // Unisex request
        const strictlyUnisex = pool.filter((p) => {
          const g = (p.genero || '').toLowerCase();
          return g.includes('unisex') || g.includes('compartid');
        });
        if (strictlyUnisex.length >= 3) {
          pool = strictlyUnisex;
        }
      }

      // Collect all keyword boosters from user answers
      const allBoosters: string[] = [];
      ALL_POSSIBLE_QUESTIONS.forEach((q) => {
        const chosenVal = finalAnswers[q.id];
        const opt = q.options.find((o) => o.value === chosenVal);
        if (opt && opt.tagBoost) {
          allBoosters.push(...opt.tagBoost);
        }
      });

      // Specific dimensional criteria
      const familyAns = finalAnswers['family'];
      const occasionAns = finalAnswers['occasion'];
      const sensationAns = finalAnswers['sensation'];
      const projectionAns = finalAnswers['projection'];
      const budgetAns = finalAnswers['budget'];

      // Score each product logically according to the user's answers
      const scored = pool.map((p) => {
        let score = 0;
        const searchable = `${p.producto} ${p.marca} ${p.tipo} ${p.genero} ${p.descripcion} ${(p.clasificacion || []).join(' ')}`.toLowerCase();

        // Keyword boosters from chosen options
        allBoosters.forEach((booster) => {
          if (searchable.includes(booster.toLowerCase())) {
            score += 3;
          }
        });

        // Family match (high weight)
        if (familyAns === 'citrico' && (searchable.includes('cítrico') || searchable.includes('citrico') || searchable.includes('acuático') || searchable.includes('fresco') || searchable.includes('bergamota') || searchable.includes('marino') || searchable.includes('aqua') || searchable.includes('blue'))) score += 7;
        if (familyAns === 'amaderado' && (searchable.includes('amaderado') || searchable.includes('madera') || searchable.includes('cedro') || searchable.includes('vetiver') || searchable.includes('sándalo') || searchable.includes('wood'))) score += 7;
        if (familyAns === 'gourmand' && (searchable.includes('vainilla') || searchable.includes('dulce') || searchable.includes('tonka') || searchable.includes('gourmand') || searchable.includes('café') || searchable.includes('caramelo') || searchable.includes('praline'))) score += 7;
        if (familyAns === 'oriental' && (searchable.includes('oriental') || searchable.includes('ámbar') || searchable.includes('ambar') || searchable.includes('especiado') || searchable.includes('canela') || searchable.includes('incienso') || searchable.includes('cuero'))) score += 7;
        if (familyAns === 'floral' && (searchable.includes('floral') || searchable.includes('jazmín') || searchable.includes('lavanda') || searchable.includes('azahar') || searchable.includes('rosa') || searchable.includes('flores'))) score += 7;

        // Occasion match
        if (occasionAns === 'diario' && (searchable.includes('diario') || searchable.includes('fresco') || searchable.includes('limpio') || searchable.includes('versátil') || searchable.includes('eau de toilette') || p.tipo.toLowerCase().includes('toilette'))) score += 5;
        if (occasionAns === 'noche' && (searchable.includes('noche') || searchable.includes('intenso') || searchable.includes('oriental') || searchable.includes('parfum') || searchable.includes('elixir') || searchable.includes('black') || searchable.includes('noir'))) score += 5;
        if (occasionAns === 'cita' && (searchable.includes('sensual') || searchable.includes('seductor') || searchable.includes('dulce') || searchable.includes('vainilla') || searchable.includes('cuero') || searchable.includes('intenso'))) score += 5;
        if (occasionAns === 'versatil' && (searchable.includes('versátil') || searchable.includes('clásico') || searchable.includes('aromático') || searchable.includes('elegante'))) score += 5;

        // Sensation match
        if (sensationAns === 'pulcro' && (searchable.includes('limpio') || searchable.includes('fresco') || searchable.includes('acuático') || searchable.includes('cítrico'))) score += 4;
        if (sensationAns === 'seductor' && (searchable.includes('seductor') || searchable.includes('intenso') || searchable.includes('ambarino') || searchable.includes('especiado') || searchable.includes('misterio'))) score += 4;
        if (sensationAns === 'elegante' && (searchable.includes('elegante') || searchable.includes('amaderado') || searchable.includes('nobles') || searchable.includes('clásico') || searchable.includes('vetiver'))) score += 4;
        if (sensationAns === 'calido' && (searchable.includes('cálido') || searchable.includes('dulce') || searchable.includes('gourmand') || searchable.includes('tonka') || searchable.includes('vainilla'))) score += 4;

        // Projection match
        if (projectionAns === 'discreto' && (p.tipo.toLowerCase().includes('toilette') || p.tipo.toLowerCase().includes('colonia') || p.tipo.toLowerCase().includes('desodorante') || searchable.includes('suave') || searchable.includes('ligero') || searchable.includes('fresco'))) score += 4;
        if (projectionAns === 'moderado' && (p.tipo.toLowerCase().includes('toilette') || p.tipo.toLowerCase().includes('parfum') || searchable.includes('eau de'))) score += 4;
        if (projectionAns === 'fuerte' && (p.tipo.toLowerCase().includes('parfum') || searchable.includes('elixir') || searchable.includes('intenso') || searchable.includes('intense') || searchable.includes('royal'))) score += 5;

        // Budget preference
        if (budgetAns === 'accesible' && p.precioVenta < 60000) score += 5;
        if (budgetAns === 'medio' && p.precioVenta >= 55000 && p.precioVenta <= 130000) score += 5;
        if (budgetAns === 'premium' && p.precioVenta > 100000) score += 5;

        // Boost items in stock
        if (p.stock !== 'No') score += 3;

        // Micro tie-breaker so close contenders have dynamic fluidity
        const tieBreaker = Math.random() * 2.5;

        return { product: p, score: score + tieBreaker };
      });

      scored.sort((a, b) => b.score - a.score);

      // Top matching candidates pool (all strictly adhering to targetGender)
      const topPool = scored.slice(0, Math.min(16, scored.length)).map((s) => s.product);

      // 1. MI ELECCIÓN: Pick top candidate from top tier
      const topTier = topPool.slice(0, Math.min(4, topPool.length));
      const myChoice = topTier[Math.floor(Math.random() * topTier.length)] || pool[0];

      // Famous designer brands for "APUESTA SEGURA"
      const famousBrands = [
        'paco rabanne', 'carolina herrera', 'dior', 'chanel', 'armani',
        'antonio banderas', 'calvin klein', 'versace', 'polo', 'boss',
        'ralph lauren', 'jean paul gaultier', 'kenzo', 'givenchy', 'yves saint laurent', 'tommy',
        'natura', 'guerlain', 'lancome', 'prada', 'hermes'
      ];

      // 2. APUESTA SEGURA: Pick a recognized prestige/designer classic among candidates, different from myChoice
      const safeCandidates = topPool.filter(
        (p) => p.id !== myChoice.id && famousBrands.some((b) => p.marca.toLowerCase().includes(b))
      );
      let safeBet: Product;
      if (safeCandidates.length > 0) {
        safeBet = safeCandidates[Math.floor(Math.random() * safeCandidates.length)];
      } else {
        const remainingTop = topPool.filter((p) => p.id !== myChoice.id);
        safeBet = remainingTop[Math.floor(Math.random() * remainingTop.length)] || pool.find((p) => p.id !== myChoice.id) || myChoice;
      }

      // 3. SALIR DE LO OBVIO: Alternative brand or distinctive olfactory twist, distinct from myChoice and safeBet
      const adventurousCandidates = topPool.filter(
        (p) =>
          p.id !== myChoice.id &&
          p.id !== safeBet.id &&
          !famousBrands.some((b) => p.marca.toLowerCase().includes(b))
      );

      let adventurous: Product;
      if (adventurousCandidates.length > 0) {
        adventurous = adventurousCandidates[Math.floor(Math.random() * adventurousCandidates.length)];
      } else {
        const remainingPool = pool.filter((p) => p.id !== myChoice.id && p.id !== safeBet.id);
        adventurous = remainingPool[Math.floor(Math.random() * remainingPool.length)] || pool[1] || myChoice;
      }

      setResults({
        myChoice,
        safeBet,
        adventurous,
        targetGender,
        isGift
      });
      setIsAnalyzing(false);
    }, 1100);
  };

  const handleRestart = () => {
    setAnswers({});
    setResults(null);
    setCurrentStep(0);
    setIsAnalyzing(false);
  };

  return (
    <div id="encontra-tu-perfume" className="w-full bg-[#121212] text-white border-y-4 border-black relative overflow-hidden py-10 sm:py-16">
      {/* Background Graphic Accents */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#E5A93C]/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 relative z-10">
        
        {/* Header Branding / Sommelier Voice */}
        <div className="text-center mb-8 space-y-2">
          <div className="inline-flex items-center gap-2 bg-[#E5A93C] text-black px-3 py-1 font-mono font-black text-xs uppercase tracking-widest border border-black shadow-[3px_3px_0px_0px_#000]">
            <Compass className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>EL ASESOR OLFATIVO DE MR. PERKINS</span>
          </div>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tight text-white font-sans">
            ENCONTRÁ TU PERFUME
          </h2>

          <p className="text-sm sm:text-base text-[#D4AF37] font-serif italic max-w-xl mx-auto">
            "No necesitás ser un experto en notas de fondo ni pirámides olfativas. Unas breves preguntas y encontramos su firma ideal."
          </p>
        </div>

        {/* LOADING STATE / SOMMELIER DELIBERATION */}
        {isAnalyzing && (
          <div className="bg-[#1C1C1C] border-3 border-[#E5A93C] p-10 sm:p-16 text-center space-y-6 shadow-[8px_8px_0px_0px_#E5A93C]">
            <div className="w-16 h-16 border-4 border-[#E5A93C] border-t-transparent rounded-full animate-spin mx-auto" />
            <div className="space-y-2">
              <h3 className="text-2xl font-black uppercase text-white font-sans">
                Mr. Perkins está consultando su botica...
              </h3>
              <p className="text-xs font-mono text-[#D4AF37] max-w-md mx-auto">
                Cruzando acordes olfativos, fijación, proyección y las notas de su perfil personal.
              </p>
            </div>
          </div>
        )}

        {/* ACTIVE QUESTION STEP */}
        {!isAnalyzing && !results && activeQuestion && (
          <div className="bg-[#1C1C1C] border-3 border-[#E5A93C] p-5 sm:p-8 shadow-[8px_8px_0px_0px_#000] relative">
            
            {/* Step Progress Bar */}
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#333]">
              <div className="flex items-center gap-2">
                <span className="bg-black text-[#E5A93C] px-2.5 py-1 text-xs font-mono font-black border border-[#E5A93C]">
                  {activeQuestion.stepTitle}
                </span>
                <span className="text-xs font-mono text-slate-400">
                  {Math.round(((currentStep + 1) / activeQuestions.length) * 100)}% completado
                </span>
              </div>

              {currentStep > 0 && (
                <button
                  onClick={() => setCurrentStep((prev) => prev - 1)}
                  className="text-xs font-mono text-slate-300 hover:text-[#E5A93C] flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-3.5 h-3.5" /> Anterior
                </button>
              )}
            </div>

            {/* Sommelier Commentary Bubble */}
            <div className="bg-black/60 border-l-4 border-[#E5A93C] p-3 sm:p-4 mb-6">
              <p className="text-xs sm:text-sm font-serif italic text-slate-200">
                "{activeQuestion.mrPerkinsIntro}"
              </p>
            </div>

            {/* Question Heading */}
            <h3 className="text-xl sm:text-2xl font-black uppercase text-white mb-6 font-sans break-words leading-snug">
              {activeQuestion.question}
            </h3>

            {/* Options List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {activeQuestion.options.map((opt, idx) => {
                const isSelected = answers[activeQuestion.id] === opt.value;
                return (
                  <button
                    key={idx}
                    onClick={() => handleSelectOption(activeQuestion.id, opt.value)}
                    className={`text-left p-4 sm:p-5 border-2 transition-all cursor-pointer flex flex-col justify-between group ${
                      isSelected
                        ? 'bg-[#E5A93C] text-black border-[#E5A93C] shadow-[4px_4px_0px_0px_#fff]'
                        : 'bg-[#262626] hover:bg-[#333] text-white border-[#444] hover:border-[#E5A93C] shadow-[3px_3px_0px_0px_#000]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`text-sm sm:text-base font-black uppercase font-sans break-words leading-snug ${isSelected ? 'text-black' : 'text-white group-hover:text-[#E5A93C]'}`}>
                        {opt.label}
                      </span>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${isSelected ? 'border-black bg-black text-[#E5A93C]' : 'border-slate-500'}`}>
                        {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                      </div>
                    </div>
                    <p className={`text-xs ${isSelected ? 'text-black/85 font-medium' : 'text-slate-400'}`}>
                      {opt.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* RESULTS SCREEN */}
        {!isAnalyzing && results && (
          <div className="space-y-8 animate-in fade-in duration-300">
            {/* Top Conclusion Banner */}
            <div className="bg-[#1C1C1C] border-3 border-[#E5A93C] p-6 sm:p-8 text-center space-y-3 shadow-[8px_8px_0px_0px_#000]">
              <div className="inline-block bg-[#E5A93C] text-black px-3 py-1 font-mono font-black text-xs uppercase tracking-wider">
                {results.targetGender === 'hombre' && 'DIAGNÓSTICO OLFATIVO: PERFIL MASCULINO'}
                {results.targetGender === 'mujer' && 'DIAGNÓSTICO OLFATIVO: PERFIL FEMENINO'}
                {results.targetGender === 'unisex' && 'DIAGNÓSTICO OLFATIVO: PERFIL UNISEX'}
              </div>
              <h3 className="text-2xl sm:text-3xl font-black uppercase text-white font-sans">
                {results.isGift
                  ? 'MR. PERKINS SELECCIONÓ ESTAS 3 FRAGANCIAS PARA EL REGALO PERFECTO'
                  : 'MR. PERKINS ELIGIÓ ESTAS 3 FRAGANCIAS PARA VOS'}
              </h3>
              <p className="text-xs sm:text-sm font-serif italic text-slate-300 max-w-2xl mx-auto">
                {results.isGift
                  ? '"Considerando el perfil del agasajado y el propósito del obsequio, seleccioné una elección principal infalible, una alternativa clásica que nunca falla y una propuesta audaz para sorprender."'
                  : '"Analizando sus respuestas, seleccioné una elección principal indiscutida, una alternativa que nunca falla y una opción más audaz para salir de la norma."'}
              </p>
              <div className="pt-2">
                <button
                  onClick={handleRestart}
                  className="inline-flex items-center gap-1.5 text-xs font-mono text-[#E5A93C] hover:underline cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Repetir el test con otras preferencias
                </button>
              </div>
            </div>

            {/* 3 Result Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              
              {/* 1. MI ELECCIÓN */}
              <div className="bg-white text-black border-4 border-[#E5A93C] p-4 flex flex-col justify-between shadow-[6px_6px_0px_0px_#E5A93C] relative group mt-4 md:mt-0">
                <div className="absolute -top-3.5 left-4 bg-[#E5A93C] text-black px-2.5 py-0.5 font-mono font-black text-[11px] uppercase border border-black shadow-[2px_2px_0px_0px_#000]">
                  ★ MI ELECCIÓN DE SOMMELIER
                </div>

                <div className="pt-3 space-y-3">
                  <div
                    className="aspect-square bg-slate-100 border-2 border-black overflow-hidden relative cursor-pointer"
                    onClick={() => onSelectProduct(results.myChoice)}
                  >
                    <img
                      src={results.myChoice.imgUrl}
                      alt={results.myChoice.producto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black text-[#E5A93C] text-[9px] font-mono font-bold px-1.5 py-0.2 border border-white">
                      {results.myChoice.marca}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      {results.myChoice.tipo} • {results.myChoice.cantidad}
                    </span>
                    <h4
                      onClick={() => onSelectProduct(results.myChoice)}
                      className="text-base font-black uppercase font-sans hover:text-[#C99846] cursor-pointer line-clamp-2 break-words"
                    >
                      {results.myChoice.producto}
                    </h4>
                  </div>

                  <div className="bg-amber-50 border-l-3 border-[#E5A93C] p-2.5 text-[11px] font-serif italic text-slate-800 leading-snug">
                    "Es la respuesta exacta a su búsqueda: combina el tono y la fijación que mejor complementan sus respuestas."
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-col xs:flex-row xs:items-baseline xs:justify-between gap-1">
                    <span className="text-lg font-black font-mono">
                      ${results.myChoice.precioVenta.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 font-bold self-start xs:self-auto">
                      Hasta 3 cuotas s/i
                    </span>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectProduct(results.myChoice)}
                    className="bg-slate-100 hover:bg-slate-200 border border-black py-2.5 font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button
                    disabled={results.myChoice.stock === 'No'}
                    onClick={(e) => onAddToCart(results.myChoice, e)}
                    className="bg-[#E5A93C] hover:bg-amber-500 text-black border-2 border-black py-2.5 font-black text-xs uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Elegir
                  </button>
                </div>
              </div>

              {/* 2. APUESTA SEGURA */}
              <div className="bg-white text-black border-3 border-black p-4 flex flex-col justify-between shadow-[6px_6px_0px_0px_#000] relative group mt-4 md:mt-0">
                <div className="absolute -top-3.5 left-4 bg-lime-300 text-black px-2.5 py-0.5 font-mono font-black text-[11px] uppercase border border-black shadow-[2px_2px_0px_0px_#000]">
                  ✦ APUESTA SEGURA
                </div>

                <div className="pt-3 space-y-3">
                  <div
                    className="aspect-square bg-slate-100 border-2 border-black overflow-hidden relative cursor-pointer"
                    onClick={() => onSelectProduct(results.safeBet)}
                  >
                    <img
                      src={results.safeBet.imgUrl}
                      alt={results.safeBet.producto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.2 border border-white">
                      {results.safeBet.marca}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      {results.safeBet.tipo} • {results.safeBet.cantidad}
                    </span>
                    <h4
                      onClick={() => onSelectProduct(results.safeBet)}
                      className="text-base font-black uppercase font-sans hover:text-[#C99846] cursor-pointer line-clamp-2 break-words"
                    >
                      {results.safeBet.producto}
                    </h4>
                  </div>

                  <div className="bg-slate-50 border-l-3 border-lime-500 p-2.5 text-[11px] font-serif italic text-slate-800 leading-snug">
                    "Un clásico indiscutido con altísima aprobación. Imposible equivocarse con este acorde aromático."
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-col xs:flex-row xs:items-baseline xs:justify-between gap-1">
                    <span className="text-lg font-black font-mono">
                      ${results.safeBet.precioVenta.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 font-bold self-start xs:self-auto">
                      Hasta 3 cuotas s/i
                    </span>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectProduct(results.safeBet)}
                    className="bg-slate-100 hover:bg-slate-200 border border-black py-2.5 font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button
                    disabled={results.safeBet.stock === 'No'}
                    onClick={(e) => onAddToCart(results.safeBet, e)}
                    className="bg-lime-300 hover:bg-lime-400 text-black border-2 border-black py-2.5 font-black text-xs uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Elegir
                  </button>
                </div>
              </div>

              {/* 3. SALIR DE LO OBVIO */}
              <div className="bg-white text-black border-3 border-black p-4 flex flex-col justify-between shadow-[6px_6px_0px_0px_#000] relative group mt-4 md:mt-0">
                <div className="absolute -top-3.5 left-4 bg-cyan-300 text-black px-2.5 py-0.5 font-mono font-black text-[11px] uppercase border border-black shadow-[2px_2px_0px_0px_#000]">
                  ◆ SALIR DE LO OBVIO
                </div>

                <div className="pt-3 space-y-3">
                  <div
                    className="aspect-square bg-slate-100 border-2 border-black overflow-hidden relative cursor-pointer"
                    onClick={() => onSelectProduct(results.adventurous)}
                  >
                    <img
                      src={results.adventurous.imgUrl}
                      alt={results.adventurous.producto}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute top-1.5 left-1.5 bg-black text-white text-[9px] font-mono font-bold px-1.5 py-0.2 border border-white">
                      {results.adventurous.marca}
                    </div>
                  </div>

                  <div>
                    <span className="text-[10px] font-mono text-slate-500 uppercase block font-bold">
                      {results.adventurous.tipo} • {results.adventurous.cantidad}
                    </span>
                    <h4
                      onClick={() => onSelectProduct(results.adventurous)}
                      className="text-base font-black uppercase font-sans hover:text-[#C99846] cursor-pointer line-clamp-2 break-words"
                    >
                      {results.adventurous.producto}
                    </h4>
                  </div>

                  <div className="bg-slate-50 border-l-3 border-cyan-500 p-2.5 text-[11px] font-serif italic text-slate-800 leading-snug">
                    "Un acorde distintivo y magnético para quien no teme destacar y dejar una firma inolvidable."
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex flex-col xs:flex-row xs:items-baseline xs:justify-between gap-1">
                    <span className="text-lg font-black font-mono">
                      ${results.adventurous.precioVenta.toLocaleString('es-AR')}
                    </span>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-100 px-1.5 py-0.5 font-bold self-start xs:self-auto">
                      Hasta 3 cuotas s/i
                    </span>
                  </div>
                </div>

                <div className="pt-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onSelectProduct(results.adventurous)}
                    className="bg-slate-100 hover:bg-slate-200 border border-black py-2.5 font-bold text-xs uppercase flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Ver
                  </button>
                  <button
                    disabled={results.adventurous.stock === 'No'}
                    onClick={(e) => onAddToCart(results.adventurous, e)}
                    className="bg-cyan-300 hover:bg-cyan-400 text-black border-2 border-black py-2.5 font-black text-xs uppercase flex items-center justify-center gap-1 shadow-[2px_2px_0px_0px_#000] cursor-pointer"
                  >
                    <ShoppingBag className="w-3.5 h-3.5" /> Elegir
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  );
};
