import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, X, Download, Truck, User as UserIcon, Send, CreditCard, Filter, ChevronDown, SlidersHorizontal, ImageOff, AlertTriangle, CheckCircle, MapPin, Calendar, DollarSign, ExternalLink, Loader2, PackageX, Box, ClipboardList, LogOut, Lock, Search, Edit3, Plus, Minus, ChevronsDown, Percent, Users, UserPlus, Mail, Shield, Eye, LayoutGrid, List, MessageCircle, Crown } from 'lucide-react';
import { PRODUCTS, PERKINS_IMAGES } from './constants';
import { Product, CartItem, Order, ChatMessage, ChatRole, User, UserRole } from './types';
import { sendMessageToPerkins, isApiKeyConfigured } from './services/geminiService';

// --- INITIAL USERS ---
const INITIAL_USERS: User[] = [
  { 
    email: 'diegomagia.online@gmail.com', 
    pass: 'Ak47iddqd-', 
    role: 'admin', 
    name: 'Diego Admin', 
    active: true 
  },
  { 
    email: 'cryptomarket20@outlook.es', 
    pass: 'JoacoElMejor', 
    role: 'admin', 
    name: 'Joaco Admin', 
    active: true 
  }
];

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
  
  // Auth & User Management
  currentUser: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  users: User[];
  addUser: (user: User) => void;
  toggleUserStatus: (email: string) => void;
  deleteUser: (email: string) => void;
  isAdmin: boolean;

  dolarBlue: number;
  formatPrice: (usd: number) => string;
  calculateFinalPrice: (product: Product) => number;
  // Pricing Mode
  pricingMode: 'retail' | 'wholesale';
  setPricingMode: (mode: 'retail' | 'wholesale') => void;
  // View Mode
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
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
  // Inicializamos productos con los datos base
  const [products, setProducts] = useState<Product[]>(PRODUCTS.map(p => ({
      ...p,
      margin_retail: 50,
      margin_wholesale: 15
  })));

  // SYNC: Cargar overrides desde el servidor al iniciar y periódicamente
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const overrides = await response.json();
          setProducts(currentProducts => currentProducts.map(p => {
            const override = overrides[p.id];
            // Si hay override, lo aplicamos sobre el producto base
            return override ? { ...p, ...override } : p;
          }));
        }
      } catch (error) {
        // Silent fail in offline mode to not annoy user
      }
    };

    fetchUpdates();
    // Polling más frecuente (cada 5s) para que los cambios se vean rápido
    const interval = setInterval(fetchUpdates, 5000);
    return () => clearInterval(interval);
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Auth State
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const [dolarBlue, setDolarBlue] = useState(1200);
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
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

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    // 1. Optimistic Update (Local)
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    
    // 2. Server Persist
    try {
      await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates })
      });
    } catch (e) {
      console.error("Failed to persist product update", e);
      showAlert("Error de Conexión", "El cambio se aplicó localmente pero no se pudo guardar en el servidor.", "error");
    }
  };

  const bulkUpdateMargins = async (type: 'retail' | 'wholesale', value: number) => {
    // Para updates masivos, iteramos y enviamos (idealmente sería un endpoint batch, pero por simplicidad...)
    const newProducts = products.map(p => ({
      ...p,
      [type === 'retail' ? 'margin_retail' : 'margin_wholesale']: value
    }));
    
    setProducts(newProducts);

    // Enviar updates en segundo plano para no bloquear
    newProducts.forEach(p => {
        fetch('/api/products', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                id: p.id, 
                updates: { [type === 'retail' ? 'margin_retail' : 'margin_wholesale']: value } 
            })
        }).catch(console.error);
    });
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

  // --- AUTH METHODS ---
  const login = (email: string, pass: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
    if (user) {
      if (!user.active) {
         showAlert("Cuenta Inactiva", "Esta cuenta aún no ha sido confirmada o ha sido desactivada.", "error");
         return false;
      }
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);

  const addUser = (user: User) => {
    setUsers(prev => [...prev, user]);
  };

  const toggleUserStatus = (email: string) => {
    setUsers(prev => prev.map(u => u.email === email ? { ...u, active: !u.active } : u));
  };

  const deleteUser = (email: string) => {
    setUsers(prev => prev.filter(u => u.email !== email));
  };

  const closeAlert = () => {
    setAlertData(prev => ({ ...prev, isOpen: false }));
  };

  return (
    <AppContext.Provider value={{ 
      products, updateProduct, bulkUpdateMargins,
      cart, addToCart, decreaseFromCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, orders, addOrder, 
      currentUser, login, logout, users, addUser, toggleUserStatus, deleteUser, isAdmin: currentUser?.role === 'admin',
      dolarBlue, formatPrice, calculateFinalPrice,
      pricingMode, setPricingMode, viewMode, setViewMode,
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

const Footer = () => (
  <footer className="bg-black border-t border-neutral-800 py-8 mt-12 relative z-10 pb-24">
    <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-500 font-serif">
      <div className="tracking-widest uppercase text-center md:text-left">Mr Perkins 2026 (c) Todos los derechos reservados.</div>
      <div className="tracking-wider text-center md:text-right">
        Diseñado y Programado por <a href="https://www.duggled.com.ar" target="_blank" rel="noopener noreferrer" className="text-gold-600 hover:text-gold-400 transition-colors font-bold">Duggled Media Design</a>
      </div>
    </div>
  </footer>
);

const FloatingPricingBar: React.FC = () => {
  const { pricingMode, setPricingMode } = useStore();
  
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-1">
        <button 
          onClick={() => setPricingMode('retail')}
          className={`px-5 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all duration-500 ${pricingMode === 'retail' ? 'bg-gold-600 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-gray-400 hover:text-white'}`}
        >
          Minorista
        </button>
        <button 
          onClick={() => setPricingMode('wholesale')}
          className={`px-5 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all duration-500 ${pricingMode === 'wholesale' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-400 hover:text-white'}`}
        >
          Mayorista
        </button>
      </div>
    </div>
  );
};

// COMPONENT: Quantity Control
const QuantityControl: React.FC<{ product: Product, quantityInCart: number, onAdd: () => void, onRemove: () => void, compact?: boolean }> = ({ product, quantityInCart, onAdd, onRemove, compact }) => {
  const isOutOfStock = product.stock <= 0;
  
  if (isOutOfStock) return null;

  if (quantityInCart === 0) {
    return (
      <button 
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={`bg-neutral-800 hover:bg-gold-600 hover:text-black text-gold-500 border border-gold-600/50 rounded flex items-center justify-center transition-colors uppercase tracking-widest ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-3 py-1.5'}`}
      >
        Agregar
      </button>
    );
  }

  return (
    <div className={`flex items-center bg-neutral-900 border border-gold-600/30 rounded overflow-hidden ${compact ? 'h-5' : 'h-8'}`}>
      <button 
        onClick={(e) => { e.stopPropagation(); onRemove(); }}
        className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-5 h-full' : 'w-8 h-full'}`}
      >
        <Minus size={compact ? 10 : 14} />
      </button>
      <span className={`flex items-center justify-center bg-black text-white font-bold border-x border-gold-600/30 ${compact ? 'w-5 text-[9px]' : 'w-8 text-sm'}`}>
        {quantityInCart}
      </span>
      <button 
        onClick={(e) => { e.stopPropagation(); onAdd(); }}
        className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-5 h-full' : 'w-8 h-full'}`}
      >
        <Plus size={compact ? 10 : 14} />
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
    viewMode, setViewMode
  } = useStore();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${scrolled ? 'bg-luxury-black/95 backdrop-blur-md border-b border-gold-600/20 py-1' : 'bg-gradient-to-b from-black/80 to-transparent py-2'}`}>
      <div className="container mx-auto px-2">
        <div className="flex items-center justify-between gap-2 h-10 relative">
          
          {/* LEFT: Logo */}
          <div className="flex-shrink-0 z-20 cursor-pointer w-8 md:w-auto" onClick={() => window.scrollTo(0,0)}>
            <img 
              src={PERKINS_IMAGES.LOGO} 
              alt="Mr. Perkins" 
              className={`transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] ${scrolled ? 'h-7 md:h-8' : 'h-8 md:h-10'}`}
              onError={(e) => { e.currentTarget.src = PERKINS_IMAGES.HOLA; }}
            />
          </div>

          {/* CENTER: Controls */}
          <div className="flex-1 flex flex-col md:flex-row justify-center items-center gap-2 min-w-0">
             {/* Filters */}
             <div className="flex items-center gap-1 w-full max-w-[280px]">
                <div className="relative flex-1 min-w-0">
                  <select 
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    className="w-full appearance-none bg-black/40 backdrop-blur text-gray-300 hover:text-gold-400 text-[10px] border border-neutral-800 rounded-full pl-2 pr-4 py-1 outline-none cursor-pointer truncate"
                  >
                     {availableGenders.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}
                  </select>
                </div>

                <div className="relative flex-[1.5] min-w-0">
                  <select 
                    value={filterBrand}
                    onChange={(e) => setFilterBrand(e.target.value)}
                    className="w-full appearance-none bg-black/40 backdrop-blur text-gray-300 hover:text-gold-400 text-[10px] border border-neutral-800 rounded-full pl-2 pr-4 py-1 outline-none cursor-pointer truncate"
                  >
                    {availableBrands.map(b => <option key={b} value={b} className="bg-black text-gray-300">{b}</option>)}
                  </select>
                </div>
             </div>
          </div>

          {/* RIGHT: View Toggle & Cart */}
          <div className="flex-shrink-0 z-20 flex items-center gap-1">
             {/* VIEW TOGGLE BUTTONS */}
             <div className="flex gap-1 bg-black/40 backdrop-blur border border-neutral-800 rounded-lg p-0.5">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-gold-600 text-black' : 'text-gray-500 hover:text-white'}`}
                  title="Vista Cuadrícula"
                >
                  <LayoutGrid size={14} />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-gold-600 text-black' : 'text-gray-500 hover:text-white'}`}
                  title="Vista Lista"
                >
                  <List size={14} />
                </button>
             </div>

             <button 
              onClick={() => setIsCartOpen(true)}
              className="relative text-gold-400 hover:text-white transition-colors p-2 md:p-3 group"
             >
               <ShoppingBag size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] transition-all md:w-5 md:h-5" />
               {cartTotalItems > 0 && (
                 <span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black shadow-lg">
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

// RESTORED VIDEO HERO
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

         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 cursor-pointer pointer-events-auto" onClick={handleScrollDown}>
            <div className="flex flex-col items-center gap-1 animate-bounce opacity-70 hover:opacity-100 transition-opacity">
                <span className="text-[10px] text-gold-400 uppercase tracking-widest font-light">Ver Catálogo</span>
                <ChevronsDown className="text-gold-500 w-6 h-6" />
            </div>
         </div>
    </div>
  );
};

// COMPONENT: Grid View Item (4 cols always)
const ProductGridItem: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
  const { cart, addToCart, decreaseFromCart, calculateFinalPrice, formatPrice } = useStore();
  const [imgError, setImgError] = useState(false);
  const cartItem = cart.find(i => i.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const price = calculateFinalPrice(product);
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-neutral-900/50 rounded-lg overflow-hidden border border-neutral-800 hover:border-gold-600/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] cursor-pointer flex flex-col h-full ${isOutOfStock ? 'opacity-60' : ''}`}
    >
      <div className="relative aspect-square overflow-hidden bg-white/5">
         {!imgError ? (
           <img 
             src={product.image} 
             alt={product.nombre} 
             loading="lazy"
             onError={() => setImgError(true)}
             className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-gold-600 bg-neutral-900"><ImageOff size={16} /></div>
         )}
         
         {isOutOfStock && (
           <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10">
             <span className="text-red-500 font-bold border-2 border-red-500 px-2 py-1 text-[8px] rounded uppercase tracking-widest transform -rotate-12">Agotado</span>
           </div>
         )}
         
         {!isOutOfStock && product.stock < 3 && (
            <div className="absolute top-1 left-1 z-10">
               <span className="bg-red-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded animate-pulse">
                 ¡Últimas {product.stock}!
               </span>
            </div>
         )}
      </div>
      
      <div className="p-2 flex flex-col flex-1">
        <div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5 truncate">{product.marca}</div>
        <h3 className="text-white font-medium text-[10px] md:text-xs leading-tight mb-2 group-hover:text-gold-400 transition-colors line-clamp-2 min-h-[2.5em]">
          {product.nombre}
        </h3>
        
        <div className="mt-auto flex flex-col gap-1">
          <div className="text-gold-500 font-bold text-xs md:text-sm">{formatPrice(price)}</div>
          <div onClick={e => e.stopPropagation()} className="w-full">
             <QuantityControl 
               product={product} 
               quantityInCart={qty} 
               onAdd={() => addToCart(product)} 
               onRemove={() => decreaseFromCart(product)} 
               compact
             />
          </div>
        </div>
      </div>
    </div>
  );
};

// COMPONENT: List View Item (Horizontal)
const ProductListItem: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
  const { cart, addToCart, decreaseFromCart, calculateFinalPrice, formatPrice } = useStore();
  const [imgError, setImgError] = useState(false);
  const cartItem = cart.find(i => i.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const price = calculateFinalPrice(product);
  const isOutOfStock = product.stock <= 0;

  return (
    <div 
      onClick={onClick}
      className={`group relative bg-neutral-900/80 rounded-lg overflow-hidden border-b border-neutral-800 hover:bg-neutral-800 transition-all duration-300 cursor-pointer flex items-center p-2 gap-3 ${isOutOfStock ? 'opacity-60' : ''}`}
    >
      <div className="relative w-16 h-16 md:w-20 md:h-20 flex-shrink-0 bg-white/5 rounded overflow-hidden">
         {!imgError ? (
           <img 
             src={product.image} 
             alt={product.nombre} 
             loading="lazy"
             onError={() => setImgError(true)}
             className={`w-full h-full object-cover transition-transform duration-700 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}
           />
         ) : (
           <div className="w-full h-full flex items-center justify-center text-gold-600 bg-neutral-900"><ImageOff size={16} /></div>
         )}
         
         {isOutOfStock && (
           <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
             <span className="text-red-500 font-bold text-[8px] uppercase">Agotado</span>
           </div>
         )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex justify-between items-start">
            <div>
                 <div className="text-[9px] text-gray-500 uppercase tracking-wider">{product.marca}</div>
                 <h3 className="text-white font-serif text-sm md:text-lg group-hover:text-gold-400 transition-colors truncate">
                    {product.nombre}
                 </h3>
                 <div className="flex gap-2 text-[9px] text-gray-400 mt-1">
                    <span className="border border-neutral-700 px-1 rounded">{product.genero}</span>
                    <span>{product.presentacion_ml} ML</span>
                 </div>
            </div>
            <div className="text-right sm:hidden">
                <span className="text-gold-500 font-bold text-sm">{formatPrice(price)}</span>
            </div>
        </div>
      </div>
      
      <div className="hidden sm:flex flex-col items-end gap-2 min-w-[100px] ml-4">
          <span className="text-gold-500 font-bold text-lg">{formatPrice(price)}</span>
          <div onClick={e => e.stopPropagation()}>
             <QuantityControl 
               product={product} 
               quantityInCart={qty} 
               onAdd={() => addToCart(product)} 
               onRemove={() => decreaseFromCart(product)} 
             />
          </div>
      </div>

      <div className="sm:hidden flex flex-col justify-end h-16" onClick={e => e.stopPropagation()}>
          <QuantityControl 
             product={product} 
             quantityInCart={qty} 
             onAdd={() => addToCart(product)} 
             onRemove={() => decreaseFromCart(product)} 
             compact
          />
      </div>
    </div>
  );
};

// CLASSIC PERKINS ADVISOR MODAL (VISUAL NOVEL STYLE)
const PerkinsChatModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { dolarBlue, products } = useStore();
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-welcome with classic vibe
  useEffect(() => {
    setTimeout(() => {
        setChatHistory([{ role: ChatRole.MODEL, text: "Bienvenido a mi Boutique. Soy Mr. Perkins. ¿En qué puedo asistirle hoy?" }]);
    }, 500);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: ChatRole.USER, text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    const response = await sendMessageToPerkins(`Contexto: Chat General de Asesoramiento. Pregunta: ${userMsg}`, dolarBlue, products);
    
    setIsTyping(false);
    setChatHistory(prev => [...prev, { role: ChatRole.MODEL, text: response }]);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={onClose} />
      <div className="relative bg-luxury-card w-full max-w-4xl h-[90vh] rounded-2xl border border-gold-600/50 shadow-[0_0_50px_rgba(212,175,55,0.15)] flex flex-col md:flex-row overflow-hidden animate-slide-up">
        
        {/* CLOSE BUTTON */}
        <button onClick={onClose} className="absolute top-4 right-4 z-50 text-white bg-black/50 p-2 rounded-full hover:bg-black transition-colors"><X size={24} /></button>

        {/* VISUAL PART (IMAGE) */}
        <div className="w-full md:w-1/2 bg-black relative flex items-end justify-center overflow-hidden border-b md:border-b-0 md:border-r border-gold-600/20">
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
            <img 
                src={PERKINS_IMAGES.HOLA} 
                className="h-full w-auto object-cover object-top md:object-center transform scale-110" 
                alt="Mr. Perkins"
            />
            <div className="absolute bottom-6 left-6 z-20">
                <h3 className="text-3xl font-serif text-gold-500 font-bold drop-shadow-lg">Mr. Perkins</h3>
                <p className="text-sm text-gray-300 uppercase tracking-widest drop-shadow-md">Su Asesor de Confianza</p>
            </div>
        </div>
        
        {/* CHAT PART */}
        <div className="w-full md:w-1/2 flex flex-col bg-neutral-900">
            <div className="p-4 border-b border-neutral-800 bg-black/50">
                <span className="text-gold-500 text-xs uppercase tracking-widest flex items-center gap-2"><Crown size={14}/> Sala de Consultas</span>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-900/30">
                {chatHistory.map((msg, idx) => (
                    <div key={idx} className={`flex ${msg.role === ChatRole.USER ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === ChatRole.USER ? 'bg-neutral-800 text-gray-100' : 'bg-[#1a1a1a] text-gold-100 border border-gold-600/20'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                {isTyping && (
                    <div className="flex items-center gap-2 text-gold-500/50 text-xs ml-4">
                        <Loader2 size={12} className="animate-spin" />
                        <span>Mr. Perkins está pensando...</span>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="p-4 bg-black border-t border-gold-600/20">
                <div className="flex gap-2 bg-neutral-900/50 border border-neutral-700 rounded-full p-1 pl-4 focus-within:border-gold-500 transition-colors">
                    <input 
                        type="text" 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Escriba su consulta aquí..."
                        className="flex-1 bg-transparent text-white text-sm outline-none placeholder-gray-600"
                    />
                    <button onClick={handleSend} className="bg-gold-600 hover:bg-gold-500 text-black rounded-full p-2.5 transition-colors shadow-lg shadow-gold-600/10"><Send size={18} /></button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const ProductModal: React.FC<{ product: Product | null, onClose: () => void }> = ({ product, onClose }) => {
  const { addToCart, cart, decreaseFromCart, calculateFinalPrice, formatPrice, dolarBlue, showAlert, products } = useStore();
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (product) {
        setChatHistory([{ role: ChatRole.MODEL, text: `Saludos. Soy Mr. Perkins. ¿Desea saber algo en particular sobre la fragancia "${product.nombre}"?` }]);
    }
  }, [product]);

  useEffect(() => {
    if (scrollRef.current) {
        scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory]);

  const handleSend = async () => {
    if (!chatInput.trim()) return;
    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { role: ChatRole.USER, text: userMsg }]);
    setChatInput("");
    setIsTyping(true);

    const response = await sendMessageToPerkins(`Contexto: Usuario pregunta sobre ${product?.nombre} (${product?.marca}). Pregunta: ${userMsg}`, dolarBlue, products);
    
    setIsTyping(false);
    setChatHistory(prev => [...prev, { role: ChatRole.MODEL, text: response }]);
  };

  if (!product) return null;

  const cartItem = cart.find(i => i.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const price = calculateFinalPrice(product);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-luxury-card w-full max-w-4xl h-[90vh] md:h-auto md:max-h-[90vh] rounded-2xl border border-gold-600/30 shadow-2xl flex flex-col md:flex-row overflow-hidden">
        
        <button onClick={onClose} className="absolute top-4 right-4 z-20 text-gray-400 hover:text-white bg-black/50 rounded-full p-2">
            <X size={24} />
        </button>

        {/* Image Section */}
        <div className="w-full md:w-1/2 bg-black relative">
            <img src={product.image} className="w-full h-full object-contain p-8" alt={product.nombre} />
        </div>

        {/* Details Section */}
        <div className="w-full md:w-1/2 flex flex-col bg-neutral-900">
            <div className="p-6 md:p-8 border-b border-neutral-800 flex-shrink-0">
                <div className="text-gold-500 text-sm uppercase tracking-widest mb-2">{product.marca}</div>
                <h2 className="text-3xl font-serif text-white mb-4">{product.nombre}</h2>
                <div className="flex flex-wrap gap-2 mb-6">
                    {product.tags_olfativos.map(tag => (
                        <span key={tag} className="text-xs bg-neutral-800 text-gray-300 px-2 py-1 rounded border border-neutral-700 capitalize">{tag}</span>
                    ))}
                </div>
                
                <div className="flex items-center justify-between mb-6">
                    <div className="text-3xl font-bold text-gold-400">{formatPrice(price)}</div>
                    <QuantityControl product={product} quantityInCart={qty} onAdd={() => addToCart(product)} onRemove={() => decreaseFromCart(product)} />
                </div>
            </div>

            {/* Chat Section */}
            <div className="flex-1 flex flex-col min-h-0 bg-black/30">
                <div className="p-3 bg-gold-900/20 border-b border-gold-600/10 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-gold-500/50 overflow-hidden"><img src={PERKINS_IMAGES.LOGO} className="w-full h-full object-cover"/></div>
                    <span className="text-gold-500 text-sm font-bold">Consultar a Mr. Perkins</span>
                </div>
                
                <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                    {chatHistory.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === ChatRole.USER ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === ChatRole.USER ? 'bg-neutral-800 text-white' : 'bg-gold-900/20 text-gold-100 border border-gold-600/20'}`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}
                    {isTyping && <div className="text-xs text-gray-500 ml-2 animate-pulse">Mr. Perkins está escribiendo...</div>}
                </div>

                <div className="p-4 border-t border-neutral-800 flex gap-2">
                    <input 
                        type="text" 
                        value={chatInput} 
                        onChange={e => setChatInput(e.target.value)} 
                        onKeyDown={e => e.key === 'Enter' && handleSend()}
                        placeholder="Pregunte sobre notas, ocasión, etc..."
                        className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white focus:border-gold-500 outline-none"
                    />
                    <button onClick={handleSend} className="bg-gold-600 hover:bg-gold-500 text-black rounded-full p-2"><Send size={18} /></button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const CartDrawer: React.FC = () => {
    const { isCartOpen, setIsCartOpen, cart, clearCart, decreaseFromCart, addToCart, calculateFinalPrice, formatPrice, removeFromCart, addOrder } = useStore();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ name: '', address: '', date: '' });
    
    if (!isCartOpen) return null;

    const total = cart.reduce((acc, item) => acc + calculateFinalPrice(item) * item.quantity, 0);

    const handleCheckout = async () => {
        if (!customerInfo.name || !customerInfo.address || !customerInfo.date) {
            alert("Por favor complete todos los datos de envío.");
            return;
        }
        setIsCheckingOut(true);

        try {
            // 1. Create Preference
            const items = cart.map(item => ({
                title: item.nombre,
                unit_price: calculateFinalPrice(item),
                quantity: item.quantity
            }));
            
            const response = await fetch('/api/create_preference', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    items, 
                    shippingCost: 0, 
                    external_reference: `ORDER-${Date.now()}` 
                })
            });
            const data = await response.json();
            
            if (data.init_point) {
                // 2. Schedule Delivery (Optimistic)
                const order: Order = {
                    id: `ORD-${Date.now()}`,
                    items: [...cart],
                    total: total,
                    customerName: customerInfo.name,
                    address: customerInfo.address,
                    deliveryDate: customerInfo.date,
                    status: 'pending',
                    timestamp: Date.now(),
                    type: 'retail' // Defaulting to retail for web checkout
                };
                
                await fetch('/api/schedule_delivery', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        orderId: order.id,
                        customerName: order.customerName,
                        address: order.address,
                        deliveryDate: order.deliveryDate,
                        items: order.items,
                        total: order.total
                    })
                });

                addOrder(order);
                clearCart();
                window.location.href = data.init_point;
            }
        } catch (error) {
            console.error(error);
            alert("Error al procesar el pago.");
        } finally {
            setIsCheckingOut(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-neutral-900 h-full shadow-2xl flex flex-col animate-slide-left border-l border-gold-600/20">
                <div className="p-6 border-b border-neutral-800 flex items-center justify-between bg-black">
                    <h2 className="text-xl font-serif text-white">Su Selección</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-400 hover:text-white"><X size={24} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-20">
                            <ShoppingBag size={48} className="mx-auto mb-4 opacity-20" />
                            <p>Su carrito está vacío.</p>
                        </div>
                    ) : (
                        <>
                            <div className="space-y-4">
                                {cart.map(item => (
                                    <div key={item.id} className="flex gap-4 bg-black/40 p-3 rounded-lg border border-neutral-800">
                                        <div className="w-16 h-16 bg-white/5 rounded overflow-hidden flex-shrink-0">
                                            <img src={item.image} className="w-full h-full object-cover" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex justify-between mb-1">
                                                <h4 className="font-medium text-white text-sm line-clamp-1">{item.nombre}</h4>
                                                <button onClick={() => removeFromCart(item.id)} className="text-gray-500 hover:text-red-500"><X size={14} /></button>
                                            </div>
                                            <p className="text-xs text-gray-400 mb-2">{item.marca}</p>
                                            <div className="flex items-center justify-between">
                                                <div className="text-gold-500 font-bold text-sm">{formatPrice(calculateFinalPrice(item) * item.quantity)}</div>
                                                <QuantityControl compact product={item} quantityInCart={item.quantity} onAdd={() => addToCart(item)} onRemove={() => decreaseFromCart(item)} />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="border-t border-neutral-800 pt-6">
                                <div className="flex justify-between text-xl font-serif text-white mb-6">
                                    <span>Total Estimado</span>
                                    <span className="text-gold-500">{formatPrice(total)}</span>
                                </div>

                                <div className="space-y-4 mb-6">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">Datos de Entrega</h3>
                                    <input type="text" placeholder="Nombre Completo" className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.name} onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})} />
                                    <input type="text" placeholder="Dirección de Envío" className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.address} onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})} />
                                    <input type="date" className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.date} onChange={e => setCustomerInfo({...customerInfo, date: e.target.value})} />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {cart.length > 0 && (
                    <div className="p-6 border-t border-neutral-800 bg-black">
                        <button 
                            onClick={handleCheckout} 
                            disabled={isCheckingOut}
                            className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-4 rounded-lg uppercase tracking-widest flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isCheckingOut ? <Loader2 className="animate-spin" /> : <CreditCard size={20} />}
                            Finalizar Compra
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

// UPDATED CATALOG: Grid Layout + Removed Count Text
const Catalog: React.FC = () => {
  const { products, filterBrand, filterGender, sortPrice, viewMode, setViewMode } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPerkinsChatOpen, setIsPerkinsChatOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      if (filterBrand !== 'Fabricante' && p.marca !== filterBrand) return false;
      if (filterGender !== 'Para Todos' && p.genero !== filterGender) return false;
      return true;
    }).sort((a, b) => {
      if (sortPrice === 'asc') return a.precio_usd - b.precio_usd;
      if (sortPrice === 'desc') return b.precio_usd - a.precio_usd;
      return 0;
    });
  }, [products, filterBrand, filterGender, sortPrice]);

  return (
    <div className="min-h-screen bg-neutral-900 pb-20 flex flex-col">
       <Header />
       <VideoHero />
       
       <div className="container mx-auto px-4 py-8 relative z-10 -mt-10 flex-1">
          {viewMode === 'grid' ? (
             // GRID VIEW - FORCED 4 COLUMNS EVEN ON MOBILE
             // KEY prop added to force re-render and trigger animations on view/filter change
             <div key={`grid-${filteredProducts.length}`} className="grid grid-cols-4 gap-2 md:gap-6">
                {filteredProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="animate-slide-up" 
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <ProductGridItem product={product} onClick={() => setSelectedProduct(product)} />
                  </div>
                ))}
             </div>
          ) : (
             // LIST VIEW - HORIZONTAL
             <div key={`list-${filteredProducts.length}`} className="flex flex-col gap-2 md:gap-4">
                {filteredProducts.map((product, index) => (
                  <div 
                    key={product.id} 
                    className="animate-slide-up" 
                    style={{ animationDelay: `${index * 0.05}s`, animationFillMode: 'both' }}
                  >
                    <ProductListItem product={product} onClick={() => setSelectedProduct(product)} />
                  </div>
                ))}
             </div>
          )}

          {filteredProducts.length === 0 && (
             <div className="text-center py-20">
                <p className="text-gray-500 text-lg">No se encontraron productos con los filtros seleccionados.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-4 text-gold-500 hover:underline"
                >
                  Limpiar Filtros
                </button>
             </div>
          )}
       </div>

       {/* Floating Perkins Button */}
       <div className="fixed bottom-2 right-4 z-50 animate-slide-up">
          <button 
            onClick={() => setIsPerkinsChatOpen(true)}
            className="w-16 h-16 rounded-full border-2 border-gold-500 shadow-[0_0_30px_rgba(212,175,55,0.5)] overflow-hidden hover:scale-110 transition-transform duration-300 relative group bg-black"
          >
             <img src={PERKINS_IMAGES.LOGO} className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors" />
          </button>
       </div>

       <FloatingPricingBar />
       <CartDrawer />
       <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
       {isPerkinsChatOpen && <PerkinsChatModal onClose={() => setIsPerkinsChatOpen(false)} />}
       <Footer />
    </div>
  );
};

const AdminPanel: React.FC = () => {
  const { 
    orders, currentUser, login, logout, formatPrice, products, updateProduct, 
    bulkUpdateMargins, calculateFinalPrice, users, addUser, toggleUserStatus, deleteUser,
    showAlert, addOrder
  } = useStore();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'users'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalRetail, setGlobalRetail] = useState(50);
  const [globalWholesale, setGlobalWholesale] = useState(15);
  const isApiConfigured = isApiKeyConfigured();

  // User Management Form State
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('seller');

  // Manual Order State
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({
      clientName: '',
      total: 0,
      description: ''
  });

  const filteredInventory = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.marca.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateUser = () => {
     if(!newUserEmail || !newUserPass || !newUserName) {
         showAlert("Error", "Complete todos los campos.", "error");
         return;
     }
     if(users.some(u => u.email === newUserEmail)) {
         showAlert("Error", "El email ya está registrado.", "error");
         return;
     }

     addUser({
         email: newUserEmail,
         pass: newUserPass,
         name: newUserName,
         role: newUserRole,
         active: false // Requires confirmation
     });

     showAlert("Usuario Creado", `Se ha enviado un correo de confirmación a ${newUserEmail} (Simulado). El usuario debe activar la cuenta.`, "success");
     setNewUserEmail('');
     setNewUserPass('');
     setNewUserName('');
  };

  const handleManualOrder = () => {
      if(!manualOrderData.clientName || manualOrderData.total <= 0) return;
      
      const newOrder: Order = {
          id: `MAN-${Date.now()}`,
          customerName: manualOrderData.clientName,
          total: manualOrderData.total,
          items: [], // Simplified for manual entry
          address: 'Venta Manual / Mostrador',
          deliveryDate: new Date().toISOString().split('T')[0],
          status: 'delivered',
          timestamp: Date.now(),
          type: 'retail',
          createdBy: currentUser?.email
      };
      
      addOrder(newOrder);
      setShowManualOrder(false);
      setManualOrderData({ clientName: '', total: 0, description: '' });
      showAlert("Pedido Agregado", "La venta manual se ha registrado correctamente.", "success");
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-black p-8 rounded-xl border border-gold-600/30 w-full max-w-md text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/30">
            <UserIcon className="w-10 h-10 text-gold-500" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">Perkins System</h2>
          <p className="text-gray-500 text-sm mb-8">Acceso exclusivo para personal autorizado.</p>
          <div className="space-y-4">
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(false); }} placeholder="Email Corporativo" className="w-full bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-white focus:border-gold-500 outline-none transition-colors" />
            <input type="password" value={pass} onChange={(e) => { setPass(e.target.value); setError(false); }} placeholder="Contraseña" className="w-full bg-neutral-900 border border-neutral-700 p-4 rounded-lg text-white focus:border-gold-500 outline-none transition-colors" />
          </div>
          {error && <div className="mt-4 p-3 bg-red-900/20 border border-red-800 rounded text-red-400 text-sm flex items-center gap-2 justify-center"><AlertTriangle size={16} /> Credenciales inválidas</div>}
          <button onClick={() => { if (!login(email, pass)) setError(true); }} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-4 rounded-lg uppercase tracking-widest mt-6 transition-colors shadow-lg hover:shadow-gold-500/20">Acceder al Sistema</button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-200 flex">
      <aside className="w-64 bg-black border-r border-neutral-800 flex-shrink-0 flex flex-col fixed h-full z-20 md:relative">
        <div className="p-6 border-b border-neutral-800">
            <h1 className="text-xl font-serif text-gold-500 tracking-wider">MR. PERKINS</h1>
            <span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">
                {currentUser.role === 'admin' ? <Shield size={10} className="text-gold-500"/> : <UserIcon size={10}/>}
                {currentUser.role === 'admin' ? 'Administrador' : 'Vendedor'}
            </span>
        </div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><ClipboardList size={20} /><span className="font-medium">Pedidos</span></button>
          
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inventory' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}>
             <Box size={20} />
             <span className="font-medium">Inventario {currentUser.role !== 'admin' && '(Solo Lectura)'}</span>
          </button>

          {currentUser.role === 'admin' && (
              <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}>
                <Users size={20} />
                <span className="font-medium">Usuarios</span>
              </button>
          )}
        </nav>
        <div className="p-4 border-t border-neutral-800">
             <div className="mb-4 px-2">
                 <p className="text-xs text-gray-500">Sesión iniciada como:</p>
                 <p className="text-sm font-bold text-white truncate">{currentUser.name}</p>
             </div>
             <button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"><LogOut size={16} /> Cerrar Sesión</button>
        </div>
      </aside>

      <main className="flex-1 p-8 ml-64 md:ml-0 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">
                {activeTab === 'orders' && 'Gestión de Pedidos'}
                {activeTab === 'inventory' && 'Control de Stock'}
                {activeTab === 'users' && 'Administración de Usuarios'}
            </h2>
            {isApiConfigured && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle size={12}/> Sistema IA Operativo</span>}
          </div>
        </header>

        {activeTab === 'orders' && (
          <div className="space-y-6">
             <div className="flex justify-between items-center mb-4">
                 <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
                    <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total</h3><span className="text-2xl font-serif text-white">{orders.length}</span></div>
                    <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Pendientes</h3><span className="text-2xl font-serif text-gold-500">{orders.filter(o => o.status === 'pending').length}</span></div>
                    <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Facturación</h3><span className="text-xl font-serif text-white">{formatPrice(orders.reduce((acc, o) => acc + o.total, 0))}</span></div>
                 </div>
                 <button 
                   onClick={() => setShowManualOrder(!showManualOrder)}
                   className="bg-gold-600 text-black font-bold py-3 px-6 rounded-lg hover:bg-gold-500 flex items-center gap-2"
                 >
                    <Plus size={20} /> Nuevo Pedido Manual
                 </button>
             </div>

             {showManualOrder && (
                 <div className="bg-neutral-800/50 p-6 rounded-lg border border-gold-600/30 mb-6 animate-fade-in">
                     <h3 className="text-lg font-bold text-white mb-4">Cargar Pedido Manual</h3>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                         <input type="text" placeholder="Nombre Cliente" value={manualOrderData.clientName} onChange={e => setManualOrderData({...manualOrderData, clientName: e.target.value})} className="bg-black border border-neutral-700 p-3 rounded text-white" />
                         <div className="flex items-center gap-2">
                            <span className="text-gray-400">USD</span>
                            <input type="number" placeholder="Total USD" value={manualOrderData.total} onChange={e => setManualOrderData({...manualOrderData, total: Number(e.target.value)})} className="bg-black border border-neutral-700 p-3 rounded text-white flex-1" />
                         </div>
                         <button onClick={handleManualOrder} className="bg-green-600 hover:bg-green-500 text-white font-bold rounded p-3">Confirmar Venta</button>
                     </div>
                 </div>
             )}

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
                              {order.createdBy && <p className="text-xs text-gray-600 mt-1">Cargado por: {order.createdBy}</p>}
                           </div>
                           <div className="text-right mt-2 md:mt-0">
                              <div className="text-gold-500 font-bold text-xl">{formatPrice(order.total)}</div>
                              <div className="text-xs text-gray-500">{order.deliveryDate}</div>
                           </div>
                        </div>
                        {order.items.length > 0 && (
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
                        )}
                      </div>
                    ))}
                  </div>
                )}
             </div>
          </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
             {/* Bulk Update Section - ADMIN ONLY */}
             {currentUser.role === 'admin' && (
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
             )}

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
                     {currentUser.role === 'admin' && (
                         <>
                            <th className="p-4 text-center bg-neutral-800/30">Margen Retail %</th>
                            <th className="p-4 text-center bg-neutral-800/30">Precio Final Retail</th>
                            <th className="p-4 text-center bg-blue-900/10">Margen Whsle %</th>
                            <th className="p-4 text-center bg-blue-900/10">Precio Final Whsle</th>
                         </>
                     )}
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
                       
                       {/* ADMIN VIEW */}
                       {currentUser.role === 'admin' ? (
                           <>
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
                           </>
                       ) : (
                           // SELLER VIEW (READ ONLY except Stock view)
                           <>
                                <td className="p-4 text-center text-gray-500">
                                    <span className="flex items-center justify-center gap-1"><Lock size={12}/> {product.precio_usd}</span>
                                </td>
                                <td className="p-4 text-center">
                                    <div className={`inline-block px-2 py-1 rounded text-xs font-bold ${product.stock > 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>
                                        {product.stock} Unidades
                                    </div>
                                </td>
                           </>
                       )}
                     </tr>
                   ))}
                 </tbody>
               </table>
            </div>
          </div>
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && (
             <div className="space-y-6">
                 {/* Create User Form */}
                 <div className="bg-neutral-800/30 border border-neutral-700 p-6 rounded-lg mb-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><UserPlus size={18} className="text-gold-500" /> Crear Nuevo Usuario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1">
                            <label className="text-xs text-gray-500 uppercase">Nombre</label>
                            <input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1" placeholder="Nombre completo" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs text-gray-500 uppercase">Email</label>
                            <input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1" placeholder="email@empresa.com" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs text-gray-500 uppercase">Contraseña</label>
                            <input type="text" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1" placeholder="********" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="text-xs text-gray-500 uppercase">Rol</label>
                            <select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1">
                                <option value="seller">Vendedor</option>
                                <option value="admin">Administrador</option>
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <button onClick={handleCreateUser} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold p-2 rounded flex justify-center gap-2 items-center">
                                <Mail size={16} /> Crear y Enviar
                            </button>
                        </div>
                    </div>
                 </div>

                 {/* User List */}
                 <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-900 text-gray-400 uppercase tracking-wider text-xs font-medium">
                            <tr>
                                <th className="p-4">Usuario</th>
                                <th className="p-4">Rol</th>
                                <th className="p-4">Estado</th>
                                <th className="p-4 text-right">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {users.map(user => (
                                <tr key={user.email} className="hover:bg-neutral-900/30">
                                    <td className="p-4">
                                        <div className="font-bold text-white">{user.name}</div>
                                        <div className="text-gray-500 text-xs">{user.email}</div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-1 rounded text-xs uppercase font-bold border ${user.role === 'admin' ? 'bg-purple-900/30 border-purple-800 text-purple-400' : 'bg-blue-900/30 border-blue-800 text-blue-400'}`}>
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <button 
                                          onClick={() => toggleUserStatus(user.email)}
                                          className={`flex items-center gap-2 px-2 py-1 rounded border transition-colors ${user.active ? 'border-green-800 text-green-400 hover:bg-green-900/20' : 'border-yellow-800 text-yellow-500 hover:bg-yellow-900/20'}`}
                                        >
                                            {user.active ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}
                                            {user.active ? 'Activo' : 'Pendiente/Inactivo'}
                                        </button>
                                    </td>
                                    <td className="p-4 text-right">
                                        <button onClick={() => deleteUser(user.email)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-900/20 rounded">
                                            <LogOut size={16} />
                                        </button>
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