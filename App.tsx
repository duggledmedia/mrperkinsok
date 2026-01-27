import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, X, Download, Truck, User, Send, CreditCard, Filter, ChevronDown, SlidersHorizontal, ImageOff, AlertTriangle, CheckCircle, MapPin, Calendar, DollarSign, ExternalLink, Loader2, PackageX, Box, ClipboardList, LogOut, Lock, Search, Edit3, Plus, Minus, ChevronsDown, Percent } from 'lucide-react';
import { PRODUCTS, PERKINS_IMAGES } from './constants';
import { Product, CartItem, Order, ChatMessage, ChatRole } from './types';
import { sendMessageToPerkins, isApiKeyConfigured } from './services/geminiService';

// --- CONTEXT ---
interface AlertData {
  isOpen: boolean;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => void;
  bulkUpdateMargins: (type: 'retail' | 'wholesale', value: number) => void;
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, silent?: boolean) => void;
  decreaseFromCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  orders: Order[];
  addOrder: (order: Order) => void;
  isAdmin: boolean;
  loginAdmin: (email: string, pass: string) => boolean;
  logoutAdmin: () => void;
  dolarBlue: number;
  formatPrice: (usd: number) => string;
  calculateFinalPrice: (product: Product) => number;
  // Pricing Mode
  pricingMode: 'retail' | 'wholesale';
  setPricingMode: (mode: 'retail' | 'wholesale') => void;
  // Filter State
  filterBrand: string;
  setFilterBrand: (v: string) => void;
  filterGender: string;
  setFilterGender: (v: string) => void;
  sortPrice: 'none' | 'asc' | 'desc';
  setSortPrice: (v: 'none' | 'asc' | 'desc') => void;
  availableBrands: string[];
  availableGenders: string[];
  // Custom Alert System
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  closeAlert: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PERKINS CUSTOM MODAL COMPONENT ---
const PerkinsModal: React.FC<{ data: AlertData; onClose: () => void }> = ({ data, onClose }) => {
  if (!data.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-luxury-card w-full max-w-sm rounded-2xl border border-gold-600/50 shadow-[0_0_30px_rgba(212,175,55,0.2)] overflow-hidden flex flex-col items-center text-center p-6 animate-slide-up">
        
        {/* Header Icon */}
        <div className="w-20 h-20 rounded-full border-2 border-gold-500 overflow-hidden shadow-lg mb-4 bg-black">
             <img src={PERKINS_IMAGES.EXCELENTE} className="w-full h-full object-cover" alt="Perkins" />
        </div>

        <h3 className="text-xl font-serif text-gold-500 mb-2 font-bold">{data.title}</h3>
        
        <div className="text-gray-300 text-sm mb-6 whitespace-pre-line leading-relaxed">
          {data.message}
        </div>

        <button 
          onClick={onClose}
          className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded-lg uppercase tracking-widest transition-colors"
        >
          Entendido
        </button>
      </div>
    </div>
  );
};

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Inicializamos productos agregando márgenes por defecto si no existen
  const [products, setProducts] = useState<Product[]>(() => 
    PRODUCTS.map(p => ({
      ...p,
      margin_retail: 50, // 50% ganancia minorista por defecto
      margin_wholesale: 15 // 15% ganancia mayorista por defecto
    }))
  );

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [dolarBlue, setDolarBlue] = useState(1200);
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  
  const [alertData, setAlertData] = useState<AlertData>({ isOpen: false, title: '', message: '', type: 'info' });

  // Global Filter State
  const [filterBrand, setFilterBrand] = useState<string>('Fabricante');
  const [filterGender, setFilterGender] = useState<string>('Para Todos');
  const [sortPrice, setSortPrice] = useState<'none' | 'asc' | 'desc'>('none');

  const availableBrands = useMemo(() => ['Fabricante', ...Array.from(new Set(products.map(p => p.marca)))], [products]);
  const availableGenders = useMemo(() => ['Para Todos', ...Array.from(new Set(products.map(p => p.genero)))], [products]);

  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        const data = await response.json();
        if (data && data.venta) {
          setDolarBlue(data.venta);
        }
      } catch (e) {
        console.error("Error fetching dolar blue", e);
      }
    };
    fetchDolar();
  }, []);

  // --- LOGICA DE PRECIOS ---
  const calculateFinalPrice = (product: Product): number => {
    const margin = pricingMode === 'wholesale' 
      ? (product.margin_wholesale || 15) 
      : (product.margin_retail || 50);
    
    // Costo Base * (1 + Margen%)
    return product.precio_usd * (1 + margin / 100);
  };

  const formatPrice = (usd: number) => {
    const ars = Math.ceil(usd * dolarBlue);
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ars);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
  };

  const bulkUpdateMargins = (type: 'retail' | 'wholesale', value: number) => {
    setProducts(prev => prev.map(p => ({
      ...p,
      [type === 'retail' ? 'margin_retail' : 'margin_wholesale']: value
    })));
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setAlertData({ isOpen: true, title, message, type });
  };

  const addToCart = (product: Product, quantity: number = 1, silent: boolean = false) => {
    if (product.stock <= 0) {
       showAlert("Perkins dice:", `Lo lamento profundamente, pero ${product.nombre} se encuentra actualmente agotado.`, 'error');
       return;
    }

    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      
      // Stock Check
      if (currentQty + quantity > product.stock) {
         if(!silent) showAlert("Perkins dice:", `Disculpe, stock insuficiente. Solo disponemos de ${product.stock} unidades.`, 'info');
         return prev;
      }
      // Max Limit (only for Retail)
      if (pricingMode === 'retail' && currentQty + quantity > 4) {
        if(!silent) showAlert("Perkins dice:", "Lo siento, permitimos un máximo de 4 unidades por fragancia en venta minorista.", 'error');
        return prev;
      }

      // Perkins compliment logic
      if (!silent && !existing) {
        const phrases = ["Excelente elección.", "Un clásico indiscutible.", "Sublime decisión.", "Exquisito gusto.", "Gran elección."];
        showAlert("Perkins dice:", phrases[Math.floor(Math.random() * phrases.length)], "success");
      }

      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      }
      return [...prev, { ...product, quantity: quantity }];
    });
    
    if (!silent && cart.length === 0) setIsCartOpen(true);
  };

  const decreaseFromCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity > 1) {
          return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item);
        } else {
          // Remove if 0
          return prev.filter(item => item.id !== product.id);
        }
      }
      return prev;
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const clearCart = () => setCart([]);

  const addOrder = (order: Order) => {
    setOrders(prev => [order, ...prev]);
  };

  const loginAdmin = (email: string, pass: string) => {
    if (email === 'diegomagia.online@gmail.com' && pass === 'Ak47iddqd-') {
      setIsAdmin(true);
      return true;
    }
    return false;
  };

  const logoutAdmin = () => setIsAdmin(false);

  const closeAlert = () => {
    setAlertData(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider value={{ 
      products, updateProduct, bulkUpdateMargins,
      cart, addToCart, decreaseFromCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, orders, addOrder, isAdmin, loginAdmin, logoutAdmin, dolarBlue, formatPrice, calculateFinalPrice,
      pricingMode, setPricingMode,
      filterBrand, setFilterBrand, filterGender, setFilterGender, sortPrice, setSortPrice, availableBrands, availableGenders,
      showAlert, closeAlert
    }}>
      {children}
      <PerkinsModal data={alertData} onClose={closeAlert} />
    </AppContext.Provider>
  );
};

const useStore = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useStore must be used within AppProvider');
  return context;
};

// --- COMPONENTS ---

// COMPONENT: Quantity Control
const QuantityControl: React.FC<{ product: Product, quantityInCart: number, onAdd: () => void, onRemove: () => void, compact?: boolean }> = ({ product, quantityInCart, onAdd, onRemove, compact }) => {
  const isOutOfStock = product.stock <= 0;
  
  if (isOutOfStock) return null;

  if (quantityInCart === 0) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={`bg-neutral-800 hover:bg-gold-600 hover:text-black text-gold-500 border border-gold-600/50 rounded flex items-center justify-center transition-colors uppercase tracking-widest ${compact ? 'text-[10px] px-2 py-1' : 'text-xs px-3 py-1.5'}`}
      >
        Agregar
      </button>
    );
  }

  return (
    <div className={`flex items-center bg-neutral-900 border border-gold-600/30 rounded overflow-hidden ${compact ? 'h-6' : 'h-8'}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-6 h-full' : 'w-8 h-full'}`}
      >
        <Minus size={compact ? 12 : 14} />
      </button>
      <span className={`flex items-center justify-center bg-black text-white font-bold border-x border-gold-600/30 ${compact ? 'w-6 text-[10px]' : 'w-8 text-sm'}`}>
        {quantityInCart}
      </span>
      <button 
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-6 h-full' : 'w-8 h-full'}`}
      >
        <Plus size={compact ? 12 : 14} />
      </button>
    </div>
  );
};

const Header: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const { 
    cart, setIsCartOpen, 
    filterBrand, setFilterBrand, availableBrands,
    filterGender, setFilterGender, availableGenders,
    pricingMode, setPricingMode
  } = useStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${scrolled ? 'bg-luxury-black/95 backdrop-blur-md border-b border-gold-600/20 py-2' : 'bg-gradient-to-b from-black/80 to-transparent py-4'}`}>
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between gap-2 h-14 relative">
          
          {/* LEFT: Logo */}
          <div className="flex-shrink-0 z-20 cursor-pointer w-10 md:w-auto" onClick={() => window.scrollTo(0,0)}>
            <img 
              src={PERKINS_IMAGES.LOGO} 
              alt="Mr. Perkins" 
              className={`transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] ${scrolled ? 'h-10 md:h-12' : 'h-12 md:h-16'}`}
              onError={(e) => { e.currentTarget.src = PERKINS_IMAGES.HOLA; }}
            />
          </div>

          {/* CENTER: Controls */}
          <div className="flex-1 flex flex-col md:flex-row justify-center items-center gap-2 min-w-0">
             
             {/* Pricing Mode Toggle */}
             <div className="flex bg-black/60 backdrop-blur rounded-full p-1 border border-neutral-800">
                <button 
                  onClick={() => setPricingMode('retail')}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all ${pricingMode === 'retail' ? 'bg-gold-600 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  Minorista
                </button>
                <button 
                  onClick={() => setPricingMode('wholesale')}
                  className={`px-3 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider transition-all ${pricingMode === 'wholesale' ? 'bg-gold-600 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  Mayorista
                </button>
             </div>

             {/* Filters */}
             <div className="flex items-center gap-1 w-full max-w-[280px]">
                <div className="relative flex-1 min-w-0">
                  <select 
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full appearance-none bg-black/40 backdrop-blur text-gray-300 hover:text-gold-400 text-[10px] border border-neutral-800 rounded-full pl-2 pr-4 py-1.5 outline-none cursor-pointer truncate"
                  >
                     {availableGenders.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
                  </select>
                </div>

                <div className="relative flex-[1.5] min-w-0">
                  <select 
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full appearance-none bg-black/40 backdrop-blur text-gray-300 hover:text-gold-400 text-[10px] border border-neutral-800 rounded-full pl-2 pr-4 py-1.5 outline-none cursor-pointer truncate"
                  >
                    {availableBrands.map(b => <option key={b} value={b} className="bg-black text-gray-300">{b}</option>)}
                  </select>
                </div>
             </div>
          </div>

          {/* RIGHT: Cart */}
          <div className="flex-shrink-0 z-20 w-10 md:w-auto flex justify-end">
             <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-gold-400 hover:text-white transition-colors p-2 md:p-3 group"
             >
               <ShoppingBag size={24} className="group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] transition-all md:w-7 md:h-7" />
               {cartTotalItems > 0 && (
                 <span className="absolute top-0 right-0 bg-red-600 text-white text-[9px] md:text-[10px] font-bold w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center border border-black shadow-lg">
                   {cartTotalItems}
                 </span>
               )}
             </button>
          </div>

        </div>
      </div>
    </header>
  );
};

const VideoHero: React.FC = () => {
  const [textIndex, setTextIndex] = useState(0);
  const [fadeText, setFadeText] = useState(true);
  const [entryAnimation, setEntryAnimation] = useState(false);

  const changingWords = [
    "Vos", "Tu Pareja", "Tu Familia", "Tu Amigo", "Tu Amiga", 
    "Tu Compañero", "Tu Vecina", "Tu Tía", "Tu Jefe"
  ];

  useEffect(() => {
    setTimeout(() => setEntryAnimation(true), 100);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setFadeText(false);
      setTimeout(() => {
        setTextIndex((prev) => (prev + 1) % changingWords.length);
        setFadeText(true);
      }, 500);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleScrollDown = () => {
    window.scrollTo({ top: window.innerHeight * 0.85, behavior: 'smooth' });
  };

  return (
    <div className="relative h-[85vh] w-full bg-luxury-black overflow-hidden group">
         <div className="absolute inset-0 z-0">
             <video 
                className="w-full h-full object-cover opacity-90"
                muted
                autoPlay
                loop
                playsInline
                poster="https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.webp"
             >
                <source src="https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.mp4" type="video/mp4" />
                <source src="https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.webm" type="video/webm" />
             </video>
             <div className="absolute inset-0 bg-black/40" />
             <div className="absolute bottom-0 left-0 w-full h-40 bg-gradient-to-t from-luxury-black via-luxury-black/80 to-transparent" />
         </div>

         <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 lg:px-24 pointer-events-none">
            <div className={`transition-all duration-1000 transform ${entryAnimation ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'}`}>
               <span className="block text-xl md:text-3xl text-gray-200 font-serif tracking-widest uppercase mb-2 drop-shadow-md">
                 Los mejores Perfumes...
               </span>
               <div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4">
                 <span className="text-4xl md:text-6xl text-gray-300 font-serif italic font-light">
                   Para
                 </span>
                 <span className={`text-5xl md:text-8xl font-bold font-serif text-gold-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)] transition-all duration-500 transform ${fadeText ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-4 scale-95'}`}>
                   {changingWords[textIndex]}
                 </span>
               </div>
            </div>
         </div>

         {/* Animated Scroll Down Indicator */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer pointer-events-auto" onClick={handleScrollDown}>
            <div className="flex flex-col items-center gap-1 animate-bounce opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gold-400 uppercase tracking-widest font-light">Ver Catálogo</span>
                <ChevronsDown className="text-gold-500 w-6 h-6" />
            </div>
         </div>
    </div>
  );
};

const ProductListItem: React.FC<{ product: Product; onClick: () => void }> = ({ product, onClick }) => {
  const { formatPrice, addToCart, decreaseFromCart, cart, calculateFinalPrice } = useStore();
  const [imgError, setImgError] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  
  const isOutOfStock = product.stock <= 0;
  const finalPrice = calculateFinalPrice(product);
  
  const cartItem = cart.find(i => i.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    );
    if (ref.current) observer.observe(ref.current);
    return () => { if (ref.current) observer.unobserve(ref.current); };
  }, []);
  
  return (
    <div 
      ref={ref}
      onClick={onClick}
      className={`group relative bg-luxury-card border-b border-neutral-800 p-2 sm:p-3 cursor-pointer hover:bg-neutral-800/80 transition-all duration-700 transform flex items-center gap-3 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20'} ${isOutOfStock ? 'opacity-60' : ''}`}
    >
      <div className="w-14 h-14 sm:w-16 sm:h-16 flex-shrink-0 bg-neutral-900 rounded-md overflow-hidden border border-neutral-800 group-hover:border-gold-500/50 transition-colors relative">
        {!imgError ? (
           <img src={product.image} alt={product.nombre} loading="lazy" onError={() => setImgError(true)} className={`w-full h-full object-cover transition-opacity ${isOutOfStock ? 'grayscale opacity-50' : 'opacity-90 group-hover:opacity-100'}`}/>
        ) : (
           <div className="w-full h-full flex items-center justify-center text-gold-600 bg-neutral-900"><ImageOff size={16} /></div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start">
           <div>
             <h3 className={`text-base sm:text-lg font-serif transition-colors truncate ${isOutOfStock ? 'text-gray-500 line-through' : 'text-white group-hover:text-gold-400'}`}>{product.nombre}</h3>
             <div className="flex items-center gap-2 flex-wrap">
                <span className="text-gold-600 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{product.marca}</span>
                <span className="text-gray-500 text-[10px] sm:text-xs">• {product.presentacion_ml} ML</span>
                <span className="text-gray-400 text-[10px] sm:text-xs border border-gray-700 rounded px-1">{product.genero}</span>
                {isOutOfStock ? (
                    <span className="bg-red-900/50 text-red-200 border border-red-800 text-[9px] px-1 rounded font-bold uppercase">Agotado</span>
                ) : (
                    product.stock < 3 && <span className="text-yellow-500 text-[9px] font-bold animate-pulse">¡Últimas {product.stock}!</span>
                )}
             </div>
           </div>
           <div className="text-right sm:hidden">
             <span className="text-white font-bold text-sm block">{formatPrice(finalPrice)}</span>
           </div>
        </div>
        
        <div className="hidden sm:block mt-1">
          <p className="text-[10px] sm:text-xs text-gray-500 truncate max-w-lg">{product.tags_olfativos.join(', ')}</p>
        </div>
      </div>

      <div className="hidden sm:flex flex-col items-end gap-1 ml-2">
        <span className="text-gold-500 font-bold text-lg">{formatPrice(finalPrice)}</span>
        <div onClick={(e) => e.stopPropagation()}>
           <QuantityControl 
             product={product} 
             quantityInCart={quantityInCart} 
             onAdd={() => addToCart(product, 1, false)} 
             onRemove={() => decreaseFromCart(product)} 
             compact 
           />
        </div>
      </div>
      
      <div className="sm:hidden text-gray-600">
         <ChevronDown className="-rotate-90 w-4 h-4" />
      </div>
    </div>
  );
};

const ProductModal: React.FC<{ product: Product | null; onClose: () => void }> = ({ product, onClose }) => {
  const { addToCart, decreaseFromCart, cart, formatPrice, calculateFinalPrice } = useStore();
  const [closing, setClosing] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => { setImgError(false); }, [product]);

  if (!product) return null;

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose(); }, 300);
  };

  const isOutOfStock = product.stock <= 0;
  const finalPrice = calculateFinalPrice(product);
  const cartItem = cart.find(i => i.id === product.id);
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  return (
    <div className={`fixed inset-0 z-[60] flex items-center justify-center px-4 ${closing ? 'animate-fade-out' : 'animate-fade-in'}`}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />
      <div className={`relative bg-luxury-card w-full max-w-2xl rounded-2xl border border-gold-600/30 shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh] ${closing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'} transition-all duration-300`}>
        <button onClick={handleClose} className="absolute top-4 right-4 text-gray-400 hover:text-white z-10"><X size={24} /></button>
        
        <div className="w-full md:w-1/2 h-64 md:h-auto bg-neutral-900 relative flex items-center justify-center">
          {!imgError ? (
            <img src={product.image} alt={product.nombre} onError={() => setImgError(true)} className={`w-full h-full object-cover ${isOutOfStock ? 'grayscale' : ''}`}/>
          ) : (
            <div className="text-center p-8"><ImageOff size={48} className="text-gold-500 mx-auto mb-2 opacity-50"/><p className="text-gray-500 text-xs">Imagen no disponible</p></div>
          )}
          {isOutOfStock && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                  <span className="bg-red-600 text-white font-bold px-4 py-2 text-xl border-2 border-white -rotate-12 shadow-lg">AGOTADO</span>
              </div>
          )}
        </div>

        <div className="w-full md:w-1/2 p-8 flex flex-col overflow-y-auto">
          <div className="mb-auto">
            <h2 className="text-3xl font-serif text-gold-500 mb-2">{product.nombre}</h2>
            <div className="flex gap-2 mb-6">
               <span className="bg-gold-900/20 text-gold-400 border border-gold-700/30 px-2 py-1 text-xs rounded uppercase tracking-wider">{product.marca}</span>
               <span className="bg-neutral-800 text-gray-300 border border-neutral-700 px-2 py-1 text-xs rounded uppercase tracking-wider">{product.presentacion_ml} ML</span>
            </div>
            
            <div className="mb-6">
              <h4 className="text-white text-sm font-bold mb-2 uppercase">Notas Olfativas</h4>
              <div className="flex flex-wrap gap-2">
                {product.tags_olfativos.map(tag => (
                  <span key={tag} className="text-xs text-gold-300 bg-gold-900/20 border border-gold-700/50 px-3 py-1 rounded-full capitalize">{tag}</span>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-6">
                <div className="text-3xl font-bold text-white">{formatPrice(finalPrice)}</div>
                {!isOutOfStock && product.stock < 5 && (
                    <span className="text-yellow-500 text-xs font-bold border border-yellow-700/50 px-2 py-1 rounded bg-yellow-900/20">Solo quedan {product.stock}</span>
                )}
            </div>
          </div>

          <div className="bg-neutral-900/50 p-4 rounded-lg border border-neutral-800">
             <div className="flex items-center justify-between mb-2">
                 <span className="text-gray-400 text-sm">Cantidad</span>
                 <span className="text-white font-bold">{quantityInCart > 0 ? quantityInCart : 0}</span>
             </div>
             <div className="flex gap-2 h-12">
                 <button 
                    onClick={() => decreaseFromCart(product)}
                    className="w-12 bg-neutral-800 border border-neutral-700 rounded text-gold-500 flex items-center justify-center hover:bg-neutral-700"
                    disabled={quantityInCart === 0}
                 >
                     <Minus />
                 </button>
                 <button 
                    onClick={() => addToCart(product, 1, false)}
                    className={`flex-1 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded uppercase tracking-widest transition-colors flex items-center justify-center gap-2 ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                    disabled={isOutOfStock}
                 >
                    {quantityInCart === 0 ? 'Agregar al Carrito' : 'Agregar Más'}
                 </button>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const CartDrawer: React.FC = () => {
  const { isCartOpen, setIsCartOpen, cart, addToCart, decreaseFromCart, removeFromCart, clearCart, addOrder, formatPrice, dolarBlue, showAlert, pricingMode, calculateFinalPrice } = useStore();
  const [step, setStep] = useState<'cart' | 'shipping' | 'payment'>('cart');
  const [processing, setProcessing] = useState(false);
  
  const [shippingData, setShippingData] = useState({ 
    name: '', phone: '', email: '', province: '', locality: '', address: '', date: '', 
    region: 'caba' as 'caba' | 'interior', paymentMethod: 'mp' as 'mp' | 'efectivo'
  });

  // Recalculate totals based on current pricing logic (margins)
  const totalUSD = cart.reduce((acc, item) => acc + (calculateFinalPrice(item) * item.quantity), 0);
  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  const getShippingCost = () => {
    if (shippingData.region === 'interior') return 0; // Pago en destino
    if (shippingData.region === 'caba') return 7999 / dolarBlue; 
    return 0;
  };

  const shippingCostUSD = getShippingCost();
  const shippingCostARS = shippingData.region === 'caba' ? 7999 : 0;

  const handleCheckout = async () => {
    if (step === 'cart') {
        // Validación Mayorista
        if (pricingMode === 'wholesale' && totalItems < 3) {
            showAlert("Perkins dice:", "Para acceder a los precios mayoristas, debe adquirir un mínimo de 3 unidades.", "error");
            return;
        }
        setStep('shipping');
    }
    else if (step === 'shipping') {
      if (!shippingData.name || !shippingData.phone || !shippingData.address || !shippingData.province || !shippingData.locality || !shippingData.date) {
        showAlert("Perkins dice:", "Por favor complete todos los campos obligatorios para asegurar un servicio de excelencia.", "error");
        return;
      }
      setStep('payment');
    }
    else if (step === 'payment') {
      setProcessing(true);
      const newOrder: Order = {
        id: `ORD-${Date.now()}`,
        items: [...cart],
        total: totalUSD,
        customerName: shippingData.name,
        address: `${shippingData.address}, ${shippingData.locality}, ${shippingData.province}`,
        deliveryDate: `${shippingData.date} (${shippingData.region.toUpperCase()})`,
        status: 'pending',
        timestamp: Date.now(),
        type: pricingMode
      };
      
      addOrder(newOrder);

      const backendItems = cart.map(item => ({
        title: item.nombre,
        quantity: item.quantity,
        unit_price: Math.ceil(calculateFinalPrice(item) * dolarBlue)
      }));

      if (shippingData.paymentMethod === 'mp') {
          try {
            const response = await fetch('/api/create_preference', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                items: backendItems,
                shippingCost: shippingCostARS,
                external_reference: newOrder.id
              }),
            });

            if (!response.ok) throw new Error('Error en API MP');
            const data = await response.json();
            
            if (data.init_point) {
               window.location.href = data.init_point;
            } else {
               showAlert("Perkins dice:", "Ha ocurrido un error al conectar con MercadoPago.", "error");
               setProcessing(false);
            }
          } catch (error) {
            console.error(error);
            showAlert("Perkins dice:", "Error del servidor.", "error");
            setProcessing(false);
          }
          return;
      }
      
      try {
         await fetch('/api/schedule_delivery', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({
              orderId: newOrder.id,
              customerName: shippingData.name,
              address: `${shippingData.address}, ${shippingData.locality}, ${shippingData.province}`,
              deliveryDate: shippingData.date,
              items: cart,
              total: formatPrice(totalUSD + shippingCostUSD)
            })
         });
      } catch (e) {
         console.error("Error agendando en calendar", e);
      } finally {
        setProcessing(false);
        showAlert("Perkins dice:", `¡Espléndido! Su pedido ha sido confirmado.\n\nMétodo de Pago: Efectivo\nEnvío agendado para: ${shippingData.date}`, "success");
        clearCart();
        setIsCartOpen(false);
        setStep('cart');
      }
    }
  };

  const mapUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${shippingData.address}, ${shippingData.locality}, ${shippingData.province}, Argentina`)}`;

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex justify-end">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
      <div className="relative w-full max-w-md bg-luxury-card h-full shadow-2xl flex flex-col border-l border-gold-600/30 animate-slide-up md:animate-none">
        <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-luxury-black">
          <h2 className="text-xl font-serif text-gold-500">
            {step === 'cart' && (pricingMode === 'wholesale' ? 'Carrito Mayorista' : 'Tu Carrito')}
            {step === 'shipping' && 'Datos de Entrega'}
            {step === 'payment' && 'Confirmación y Pago'}
          </h2>
          <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white"><X /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-gold-900 scrollbar-track-transparent">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag size={48} className="mb-4 opacity-50" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <>
              {step === 'cart' && (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex gap-4 bg-neutral-900/50 p-3 rounded-lg border border-neutral-800 items-center">
                      <img src={item.image} className="w-16 h-16 object-cover rounded" alt={item.nombre} />
                      <div className="flex-1">
                        <h4 className="text-white font-medium text-sm">{item.nombre}</h4>
                        <div className="flex items-center gap-2 mt-1">
                            <p className="text-gold-500 text-sm">{formatPrice(calculateFinalPrice(item))}</p>
                        </div>
                      </div>
                      <QuantityControl 
                        product={item} 
                        quantityInCart={item.quantity} 
                        onAdd={() => addToCart(item, 1, true)} 
                        onRemove={() => decreaseFromCart(item)} 
                        compact 
                      />
                    </div>
                  ))}
                  <div className="text-xs text-gray-500 text-center pt-2">
                     Cotización Dólar Blue: ${dolarBlue} ARS
                     {pricingMode === 'wholesale' && (
                        <p className={`mt-2 font-bold ${totalItems >= 3 ? 'text-green-500' : 'text-red-500'}`}>
                           Unidades: {totalItems}/3 {totalItems >= 3 ? '(Condición Cumplida)' : '(Faltan unidades)'}
                        </p>
                     )}
                  </div>
                </div>
              )}

              {step === 'shipping' && (
                <div className="space-y-4 text-sm">
                  <div className="flex gap-2 mb-4 p-1 bg-neutral-900 rounded-lg">
                    <button onClick={() => setShippingData({...shippingData, region: 'caba'})} className={`flex-1 py-2 rounded-md transition-colors ${shippingData.region === 'caba' ? 'bg-gold-600 text-black font-bold' : 'text-gray-400 hover:text-white'}`}>CABA</button>
                    <button onClick={() => setShippingData({...shippingData, region: 'interior'})} className={`flex-1 py-2 rounded-md transition-colors ${shippingData.region === 'interior' ? 'bg-gold-600 text-black font-bold' : 'text-gray-400 hover:text-white'}`}>Interior</button>
                  </div>

                  <div className="space-y-3">
                    <input type="text" placeholder="Nombre Completo *" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.name} onChange={e => setShippingData({...shippingData, name: e.target.value})} />
                    <input type="tel" placeholder="Teléfono *" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.phone} onChange={e => setShippingData({...shippingData, phone: e.target.value})} />
                    <input type="email" placeholder="Email (Opcional)" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.email} onChange={e => setShippingData({...shippingData, email: e.target.value})} />
                  </div>

                  <div className="space-y-3 pt-2 border-t border-neutral-800">
                    <h4 className="text-gold-500 font-serif">Dirección de Entrega</h4>
                    <div className="grid grid-cols-2 gap-3">
                        <input type="text" placeholder="Provincia *" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.province} onChange={e => setShippingData({...shippingData, province: e.target.value})} />
                        <input type="text" placeholder="Localidad/Zona *" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.locality} onChange={e => setShippingData({...shippingData, locality: e.target.value})} />
                    </div>
                    <input type="text" placeholder="Calle y Altura *" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.address} onChange={e => setShippingData({...shippingData, address: e.target.value})} />
                    
                    {(shippingData.address && shippingData.locality) && (
                        <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 text-gold-400 text-xs hover:text-white border border-gold-600/30 rounded py-2 hover:bg-gold-600/10 transition-colors"><MapPin size={14} /> Confirmar ubicación en Mapa</a>
                    )}
                  </div>

                  <div className="pt-2 border-t border-neutral-800">
                     <label className="block text-xs text-gray-400 mb-1">Fecha de Entrega Preferida *</label>
                     <input type="date" className="w-full bg-neutral-900 border border-neutral-700 rounded p-3 text-white focus:border-gold-500 outline-none" value={shippingData.date} min={new Date().toISOString().split("T")[0]} onChange={e => setShippingData({...shippingData, date: e.target.value})} />
                      {shippingData.region === 'caba' && (
                          <div className="mt-2 text-xs"><span className="text-gray-400">Envío CABA: $7999</span></div>
                      )}
                      {shippingData.region === 'interior' && (
                          <div className="mt-2 text-xs bg-neutral-800 p-2 rounded text-gray-300">
                             <p className="mb-1">Envío por <strong>Via Cargo</strong> (Pago en destino).</p>
                             <a href="https://viacargo.com.ar/cotizar-envio/" target="_blank" rel="noopener noreferrer" className="text-gold-500 underline flex items-center gap-1"><ExternalLink size={10} /> Cotizar costo de envío</a>
                          </div>
                      )}
                  </div>
                </div>
              )}

              {step === 'payment' && (
                 <div className="space-y-6 pt-4">
                    <div className="bg-neutral-900 p-4 rounded-lg space-y-2 text-sm border border-neutral-800">
                       <div className="flex justify-between"><span className="text-gray-400">Subtotal</span><span className="text-white">{formatPrice(totalUSD)}</span></div>
                       <div className="flex justify-between">
                           <span className="text-gray-400">Envío ({shippingData.region.toUpperCase()})</span>
                           <span className="text-gold-500">{shippingData.region === 'interior' ? 'A convenir (Via Cargo)' : `$${shippingCostARS.toLocaleString('es-AR')}`}</span>
                       </div>
                       <div className="pt-2 border-t border-neutral-800 flex justify-between text-lg font-bold"><span className="text-white">Total</span><span className="text-gold-500">{formatPrice(totalUSD + shippingCostUSD)}</span></div>
                    </div>

                    <div>
                        <h4 className="text-gray-300 mb-3 font-serif">Forma de Pago</h4>
                        <div className="space-y-2">
                            <button onClick={() => setShippingData({...shippingData, paymentMethod: 'mp'})} className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${shippingData.paymentMethod === 'mp' ? 'bg-[#009EE3]/10 border-[#009EE3] text-white' : 'bg-neutral-900 border-neutral-800 text-gray-500 hover:border-gray-600'}`}>
                               <span className="flex items-center gap-2"><CreditCard size={18}/> MercadoPago</span>
                               {shippingData.paymentMethod === 'mp' && <CheckCircle size={18} className="text-[#009EE3]"/>}
                            </button>
                            {shippingData.region === 'caba' && (
                                <button onClick={() => setShippingData({...shippingData, paymentMethod: 'efectivo'})} className={`w-full p-4 rounded-lg border flex items-center justify-between transition-all ${shippingData.paymentMethod === 'efectivo' ? 'bg-green-900/20 border-green-600 text-white' : 'bg-neutral-900 border-neutral-800 text-gray-500 hover:border-gray-600'}`}>
                                <span className="flex items-center gap-2"><DollarSign size={18}/> Efectivo Contra Entrega</span>
                                {shippingData.paymentMethod === 'efectivo' && <CheckCircle size={18} className="text-green-500"/>}
                                </button>
                            )}
                        </div>
                    </div>

                    {shippingData.paymentMethod === 'mp' && (
                        <div className={`bg-[#009EE3] p-4 rounded-lg cursor-pointer hover:bg-[#008ED0] transition-colors flex items-center justify-center gap-3 text-white font-bold ${processing ? 'opacity-70 pointer-events-none' : ''}`} onClick={handleCheckout}>
                          {processing ? <Loader2 className="animate-spin" /> : <CreditCard size={24} />} {processing ? 'Procesando...' : 'Pagar y Confirmar'}
                        </div>
                    )}
                     {shippingData.paymentMethod === 'efectivo' && (
                        <div className={`bg-green-600 p-4 rounded-lg cursor-pointer hover:bg-green-500 transition-colors flex items-center justify-center gap-3 text-white font-bold ${processing ? 'opacity-70' : ''}`} onClick={handleCheckout}>
                          {processing ? <Loader2 className="animate-spin" /> : <Truck size={24} />} {processing ? 'Procesando...' : 'Confirmar Pedido'}
                        </div>
                    )}
                 </div>
              )}
            </>
          )}
        </div>

        {cart.length > 0 && step !== 'payment' && (
          <div className="p-6 border-t border-neutral-800 bg-luxury-black">
             {step === 'cart' ? (
                <div className="space-y-4">
                     <div className="flex justify-between items-center"><span className="text-gray-400">Subtotal</span><span className="text-xl font-bold text-white">{formatPrice(totalUSD)}</span></div>
                     <button onClick={handleCheckout} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded-lg uppercase tracking-wider transition-colors">Iniciar Compra</button>
                </div>
             ) : (
                <div className="flex gap-2">
                    <button onClick={() => setStep('cart')} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-3 rounded-lg">Volver</button>
                    <button onClick={handleCheckout} className="flex-[2] bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded-lg">Continuar</button>
                </div>
             )}
          </div>
        )}
      </div>
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { orders, isAdmin, loginAdmin, logoutAdmin, formatPrice, products, updateProduct, bulkUpdateMargins, calculateFinalPrice } = useStore();
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalRetail, setGlobalRetail] = useState(50);
  const [globalWholesale, setGlobalWholesale] = useState(15);
  const isApiConfigured = isApiKeyConfigured();

  const filteredInventory = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-black p-8 rounded-xl border border-gold-600/30 w-full max-w-md text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/30">
            <User className="w-10 h-10 text-gold-500" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">Perkins Admin</h2>
          <p className="text-gray-500 text-sm mb-8">Acceso exclusivo para gestión.</p>
          <div className="space-y-4">
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(false); }} placeholder="Email Administrativo" className="w-full bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-white focus:border-gold-500 outline-none transition-colors" />
            <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false); }} placeholder="Contraseña" className="w-full bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-white focus:border-gold-500 outline-none transition-colors" />
          </div>
          {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm flex items-center gap-2 justify-center"><AlertTriangle size={16} /> Credenciales inválidas</div>}
          <button onClick={() => { if (!loginAdmin(email, pass)) setError(true); }} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-4 rounded-lg uppercase tracking-widest mt-6 transition-colors shadow-lg hover:shadow-gold-500/20">Acceder al Sistema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-200 flex">
      <aside className="w-64 bg-black border-r border-neutral-800 flex-shrink-0 flex flex-col fixed h-full z-20 md:relative">
        <div className="p-6 border-b border-neutral-800"><h1 className="text-xl font-serif text-gold-500 tracking-wider">MR. PERKINS</h1><span className="text-xs text-gray-500 uppercase tracking-widest">Backend</span></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><ClipboardList size={20} /><span className="font-medium">Pedidos</span></button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inventory' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><Box size={20} /><span className="font-medium">Inventario</span></button>
        </nav>
        <div className="p-4 border-t border-neutral-800"><button onClick={logoutAdmin} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"><LogOut size={16} /> Cerrar Sesión</button></div>
      </aside>

      <main className="flex-1 p-8 ml-64 md:ml-0 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{activeTab === 'orders' ? 'Gestión de Pedidos' : 'Control de Stock y Márgenes'}</h2>
            {isApiConfigured && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle size={12}/> Sistema IA Operativo</span>}
          </div>
          <div className="text-sm text-gray-500">Admin: {email}</div>
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total Pedidos</h3><span className="text-3xl font-serif text-white">{orders.length}</span></div>
                <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Pendientes</h3><span className="text-3xl font-serif text-gold-500">{orders.filter(o => o.status === 'pending').length}</span></div>
                <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Ingresos Estimados</h3><span className="text-3xl font-serif text-white">{formatPrice(orders.reduce((acc, o) => acc + o.total, 0))}</span></div>
             </div>

             <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
                {orders.length === 0 ? <div className="p-12 text-center text-gray-500"><ClipboardList size={48} className="mx-auto mb-4 opacity-20" /><p>No hay pedidos registrados.</p></div> : (
                  <div className="divide-y divide-neutral-800">
                    {orders.map(order => (
                      <div key={order.id} className="p-6 hover:bg-neutral-900/50 transition-colors">
                        <div className="flex flex-col md:flex-row justify-between mb-4">
                           <div>
                              <div className="flex items-center gap-3 mb-1">
                                <span className="text-gold-500 font-bold">{order.id}</span>
                                <span className="bg-yellow-900/30 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-900/50 uppercase">{order.status}</span>
                                <span className={`text-xs px-2 py-0.5 rounded border uppercase ${order.type === 'wholesale' ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-green-900/30 border-green-800 text-green-400'}`}>{order.type === 'wholesale' ? 'Mayorista' : 'Minorista'}</span>
                              </div>
                              <h4 className="text-white font-medium">{order.customerName}</h4>
                              <p className="text-sm text-gray-400">{order.address}</p>
                           </div>
                           <div className="text-right mt-2 md:mt-0">
                              <div className="text-gold-500 font-bold text-xl">{formatPrice(order.total)}</div>
                              <div className="text-xs text-gray-500">{order.deliveryDate}</div>
                           </div>
                        </div>
                        <div className="bg-neutral-900/50 rounded p-3 text-sm">
                           <ul className="space-y-1">
                             {order.items.map((item, idx) => (
                               <li key={idx} className="flex justify-between text-gray-300">
                                 <span>{item.quantity}x {item.nombre}</span>
                                 <span>{formatPrice(item.precio_usd * (1 + (order.type === 'wholesale' ? (item.margin_wholesale||15) : (item.margin_retail||50))/100) * item.quantity)}</span>
                               </li>
                             ))}
                           </ul>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
             {/* Bulk Update Section */}
             <div className="bg-neutral-800/30 border border-neutral-700 p-6 rounded-lg mb-6">
                <h3 className="text-gold-500 font-serif mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> Actualización Masiva de Márgenes</h3>
                <div className="flex flex-col md:flex-row gap-6">
                    <div className="flex-1 bg-black/50 p-4 rounded border border-neutral-800">
                        <label className="block text-gray-400 text-xs mb-2 uppercase">Margen Minorista Global (%)</label>
                        <div className="flex gap-2">
                           <input type="number" value={globalRetail} onChange={(e) => setGlobalRetail(Number(e.target.value))} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-20 text-center" />
                           <button onClick={() => bulkUpdateMargins('retail', globalRetail)} className="bg-gold-600 text-black px-4 rounded font-bold hover:bg-gold-500 text-sm">Aplicar a Todos</button>
                        </div>
                    </div>
                    <div className="flex-1 bg-black/50 p-4 rounded border border-neutral-800">
                        <label className="block text-gray-400 text-xs mb-2 uppercase">Margen Mayorista Global (%)</label>
                        <div className="flex gap-2">
                           <input type="number" value={globalWholesale} onChange={(e) => setGlobalWholesale(Number(e.target.value))} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-20 text-center" />
                           <button onClick={() => bulkUpdateMargins('wholesale', globalWholesale)} className="bg-gold-600 text-black px-4 rounded font-bold hover:bg-gold-500 text-sm">Aplicar a Todos</button>
                        </div>
                    </div>
                </div>
             </div>

            <div className="flex items-center bg-black border border-neutral-800 rounded-lg px-4 py-3 mb-6">
               <Search className="text-gray-500 mr-2" size={20} />
               <input type="text" placeholder="Buscar por nombre o marca..." className="bg-transparent border-none outline-none text-white w-full placeholder-gray-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
               <table className="w-full text-left text-sm">
                 <thead className="bg-neutral-900 text-gray-400 uppercase tracking-wider text-xs font-medium">
                   <tr>
                     <th className="p-4">Producto</th>
                     <th className="p-4 text-center">Costo Base (USD)</th>
                     <th className="p-4 text-center bg-neutral-800/30">Margen Minorista %</th>
                     <th className="p-4 text-center bg-neutral-800/30">Precio Final Retail</th>
                     <th className="p-4 text-center bg-blue-900/10">Margen Mayorista %</th>
                     <th className="p-4 text-center bg-blue-900/10">Precio Final Whsle</th>
                     <th className="p-4 text-center">Stock</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800">
                   {filteredInventory.map(product => (
                     <tr key={product.id} className="hover:bg-neutral-900/30 transition-colors group">
                       <td className="p-4 max-w-xs">
                         <div className="flex items-center gap-3">
                           <div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0"><img src={product.image} alt="" className="w-full h-full object-cover" /></div>
                           <div><div className="text-white font-medium truncate">{product.nombre}</div><div className="text-gray-500 text-xs">{product.marca}</div></div>
                         </div>
                       </td>
                       <td className="p-4 text-center">
                          <input type="number" value={product.precio_usd} onChange={(e) => updateProduct(product.id, { precio_usd: Number(e.target.value) })} className="w-16 bg-neutral-900 border border-neutral-700 rounded px-2 py-1 text-center text-white outline-none focus:border-gold-500" />
                       </td>
                       <td className="p-4 text-center bg-neutral-800/30">
                          <div className="flex items-center justify-center gap-1">
                             <input type="number" value={product.margin_retail || 50} onChange={(e) => updateProduct(product.id, { margin_retail: Number(e.target.value) })} className="w-14 bg-neutral-900 border border-neutral-700 rounded px-1 py-1 text-center text-green-400 font-bold outline-none focus:border-green-500" />
                             <span className="text-xs text-gray-500">%</span>
                          </div>
                       </td>
                       <td className="p-4 text-center bg-neutral-800/30 text-green-400 font-bold">
                           {formatPrice(product.precio_usd * (1 + (product.margin_retail || 50)/100))}
                       </td>
                       <td className="p-4 text-center bg-blue-900/10">
                          <div className="flex items-center justify-center gap-1">
                             <input type="number" value={product.margin_wholesale || 15} onChange={(e) => updateProduct(product.id, { margin_wholesale: Number(e.target.value) })} className="w-14 bg-neutral-900 border border-neutral-700 rounded px-1 py-1 text-center text-blue-400 font-bold outline-none focus:border-blue-500" />
                             <span className="text-xs text-gray-500">%</span>
                          </div>
                       </td>
                       <td className="p-4 text-center bg-blue-900/10 text-blue-400 font-bold">
                           {formatPrice(product.precio_usd * (1 + (product.margin_wholesale || 15)/100))}
                       </td>
                       <td className="p-4 text-center">
                          <input type="number" value={product.stock} onChange={(e) => updateProduct(product.id, { stock: Number(e.target.value) })} className={`w-14 bg-neutral-900 border rounded px-1 py-1 text-center font-bold outline-none ${product.stock === 0 ? 'border-red-900 text-red-500' : 'border-neutral-700 text-white'}`} />
                       </td>
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

// --- CHAT WIDGET ---
const ChatWidget: React.FC = () => {
  const { dolarBlue } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: ChatRole.USER, text: userMsg }]);
    setLoading(true);

    const responseText = await sendMessageToPerkins(userMsg, dolarBlue);
    
    setMessages(prev => [...prev, { role: ChatRole.MODEL, text: responseText }]);
    setLoading(false);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-40 bg-gold-600 hover:bg-gold-500 text-black p-4 rounded-full shadow-[0_0_20px_rgba(212,175,55,0.4)] transition-all hover:scale-110 flex items-center gap-2 group"
      >
        <div className="relative">
           <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border border-gold-600 animate-pulse" />
           <img src={PERKINS_IMAGES.LOGO} className="w-8 h-8 object-contain" alt="Perkins" />
        </div>
        <span className="font-bold uppercase tracking-wider hidden group-hover:block text-xs">Consultar</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-[90vw] md:w-96 h-[60vh] bg-luxury-card border border-gold-600/30 rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-slide-up">
      <div className="bg-luxury-black p-4 border-b border-neutral-800 flex justify-between items-center">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 rounded-full border border-gold-500/50 overflow-hidden bg-black">
              <img src={PERKINS_IMAGES.EXCELENTE} alt="Perkins" className="w-full h-full object-cover" />
           </div>
           <div>
              <h3 className="text-gold-500 font-serif font-bold">Mr. Perkins</h3>
              <p className="text-[10px] text-green-500 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> En línea</p>
           </div>
        </div>
        <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black/50">
         {messages.length === 0 && (
            <div className="text-center text-gray-500 text-sm mt-10">
               <p>¡Hola! Soy Mr. Perkins.</p>
               <p>¿En qué puedo asesorarlo hoy?</p>
            </div>
         )}
         {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === ChatRole.USER ? 'justify-end' : 'justify-start'}`}>
               <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.role === ChatRole.USER ? 'bg-gold-600 text-black rounded-tr-none' : 'bg-neutral-800 text-gray-200 rounded-tl-none border border-neutral-700'}`}>
                  {msg.text}
               </div>
            </div>
         ))}
         {loading && (
            <div className="flex justify-start">
                <div className="bg-neutral-800 text-gold-500 p-3 rounded-2xl rounded-tl-none border border-neutral-700 flex gap-1">
                   <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                   <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                   <span className="w-1.5 h-1.5 bg-gold-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      <div className="p-3 bg-luxury-black border-t border-neutral-800 flex gap-2">
         <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Escriba su consulta..."
            className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white focus:border-gold-500 outline-none"
         />
         <button onClick={handleSend} disabled={loading} className="bg-gold-600 hover:bg-gold-500 text-black p-2 rounded-full transition-colors disabled:opacity-50">
            <Send size={18} />
         </button>
      </div>
    </div>
  );
};

// --- CATALOG COMPONENT ---
const Catalog: React.FC = () => {
  const { products, filterBrand, filterGender, sortPrice, pricingMode } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchBrand = filterBrand === 'Fabricante' || p.marca === filterBrand;
      const matchGender = filterGender === 'Para Todos' || p.genero === filterGender;
      return matchBrand && matchGender;
    }).sort((a, b) => {
      if (sortPrice === 'asc') return a.precio_usd - b.precio_usd;
      if (sortPrice === 'desc') return b.precio_usd - a.precio_usd;
      return 0;
    });
  }, [products, filterBrand, filterGender, sortPrice]);

  return (
    <div className="min-h-screen bg-luxury-black text-gray-200 pb-20 font-sans">
      <Header />
      <VideoHero />
      
      <main className="container mx-auto px-2 md:px-4 py-8">
         <div className="flex justify-between items-center mb-6 px-1">
             <div>
                <h2 className="text-2xl md:text-3xl font-serif text-gold-500 drop-shadow-sm">
                    {pricingMode === 'wholesale' ? 'Catálogo Mayorista' : 'Colección Exclusiva'}
                </h2>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">
                    {filteredProducts.length} Fragancias Disponibles
                </p>
             </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map(product => (
               <ProductListItem 
                 key={product.id} 
                 product={product} 
                 onClick={() => setSelectedProduct(product)} 
               />
            ))}
         </div>

         {filteredProducts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-gray-500 opacity-60">
                <Search size={48} className="mb-4" />
                <p>No se encontraron resultados con los filtros actuales.</p>
            </div>
         )}
      </main>

      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      <CartDrawer />
      <ChatWidget />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Catalog />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
};

export default App;