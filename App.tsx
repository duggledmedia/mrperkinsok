import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, X, Download, Truck, User as UserIcon, Send, CreditCard, Filter, ChevronDown, SlidersHorizontal, ImageOff, AlertTriangle, CheckCircle, MapPin, Calendar, DollarSign, ExternalLink, Loader2, PackageX, Box, ClipboardList, LogOut, Lock, Search, Edit3, Plus, Minus, ChevronsDown, Percent, Users, UserPlus, Mail, Shield, Eye, LayoutGrid, List, MessageCircle, Crown, RefreshCw, Trash2, Save } from 'lucide-react';
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
  addNewProduct: (product: Product) => void;
  deleteProduct: (id: string) => void;
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
  setDolarBlue: (val: number) => void; // Allow manual override
  formatPrice: (ars: number) => string;
  calculateFinalPriceARS: (product: Product) => number; // Returns ARS directly
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
  // Inicializamos con los productos base, pero la verdad vendrá del useEffect
  const [products, setProducts] = useState<Product[]>(PRODUCTS.map(p => ({
      ...p,
      margin_retail: 50,
      margin_wholesale: 15
  })));

  // SYNC: Cargar overrides y nuevos productos desde el servidor
  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const response = await fetch('/api/products');
        if (response.ok) {
          const overrides = await response.json();
          
          // 1. Crear Mapa con productos base (constantes)
          const productMap = new Map<string, Product>();
          PRODUCTS.forEach(p => {
             productMap.set(p.id, { ...p, margin_retail: 50, margin_wholesale: 15 });
          });

          // 2. Aplicar overrides del servidor (incluye nuevos y borrados)
          Object.entries(overrides).forEach(([id, data]: [string, any]) => {
              if (data.deleted) {
                  productMap.delete(id);
              } else {
                  const existing = productMap.get(id);
                  if (existing) {
                      // Actualizar existente
                      productMap.set(id, { ...existing, ...data });
                  } else {
                      // Es un producto nuevo creado en admin
                      // Aseguramos que tenga estructura mínima
                      productMap.set(id, { 
                          id, 
                          nombre: 'Nuevo Producto',
                          marca: 'Genérico', 
                          precio_usd: 0, 
                          stock: 0, 
                          tags_olfativos: [],
                          presentacion_ml: 100,
                          genero: 'Unisex',
                          image: 'https://via.placeholder.com/150',
                          margin_retail: 50,
                          margin_wholesale: 15,
                          ...data 
                      });
                  }
              }
          });

          setProducts(Array.from(productMap.values()));
        }
      } catch (error) {
        console.warn("Could not fetch product updates", error);
      }
    };

    fetchUpdates();
    const interval = setInterval(fetchUpdates, 4000); // Polling un poco más lento
    return () => clearInterval(interval);
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // DOLAR BLUE
  const [dolarBlue, setDolarBlue] = useState(1220); 
  
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [alertData, setAlertData] = useState<AlertData>({ isOpen: false, title: '', message: '', type: 'info' });

  // Filters
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

  const calculateFinalPriceARS = (product: Product): number => {
    const margin = pricingMode === 'wholesale' 
      ? (product.margin_wholesale ?? 15)
      : (product.margin_retail ?? 50);
    
    const costoEnPesos = product.precio_usd * dolarBlue;
    const precioFinal = costoEnPesos * (1 + margin / 100);
    
    return Math.ceil(precioFinal);
  };

  const formatPrice = (ars: number) => {
    return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ars);
  };

  const persistUpdate = async (id: string, updates: Partial<Product> | { deleted: boolean }) => {
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, updates })
        });
      } catch (e) {
        console.error("Failed to persist product update", e);
        showAlert("Error de Conexión", "No se pudo guardar en el servidor.", "error");
      }
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
    persistUpdate(id, updates);
  };

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      persistUpdate(id, { deleted: true });
  };

  const addNewProduct = (product: Product) => {
      setProducts(prev => [...prev, product]);
      // Remove id from object spread to avoid duplication if needed, but here we need to send the whole object as "updates" for a new key
      // The API handler merges updates into existing or new keys.
      // We pass the whole product object minus the ID as the updates, and the ID as ID.
      const { id, ...rest } = product;
      persistUpdate(id, rest);
  };

  const bulkUpdateMargins = async (type: 'retail' | 'wholesale', value: number) => {
    const key = type === 'retail' ? 'margin_retail' : 'margin_wholesale';
    const newProducts = products.map(p => ({
      ...p,
      [key]: value
    }));
    setProducts(newProducts);

    const updatesArray = newProducts.map(p => ({
      id: p.id,
      updates: { [key]: value }
    }));

    try {
        await fetch('/api/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updatesArray })
        });
        showAlert("Actualización Masiva Exitosa", `Se ha actualizado el margen ${type === 'retail' ? 'minorista' : 'mayorista'} al ${value}% para todos los productos.`, 'success');
    } catch (error) {
        showAlert("Error", "Falló la actualización masiva.", "error");
    }
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
      if (currentQty + quantity > product.stock) {
         if(!silent) showAlert("Perkins dice:", `Disculpe, stock insuficiente.`, 'info');
         return prev;
      }
      if (existing) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item);
      return [...prev, { ...product, quantity: quantity }];
    });
    if (!silent && cart.length === 0) setIsCartOpen(true);
  };

  const decreaseFromCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity > 1) return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity - 1 } : item);
        else return prev.filter(item => item.id !== product.id);
      }
      return prev;
    });
  };

  const removeFromCart = (productId: string) => setCart(prev => prev.filter(item => item.id !== productId));
  const clearCart = () => setCart([]);
  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);

  const login = (email: string, pass: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
    if (user) {
      if (!user.active) {
         showAlert("Cuenta Inactiva", "Esta cuenta aún no ha sido confirmada.", "error");
         return false;
      }
      setCurrentUser(user);
      return true;
    }
    return false;
  };

  const logout = () => setCurrentUser(null);
  const addUser = (user: User) => setUsers(prev => [...prev, user]);
  const toggleUserStatus = (email: string) => setUsers(prev => prev.map(u => u.email === email ? { ...u, active: !u.active } : u));
  const deleteUser = (email: string) => setUsers(prev => prev.filter(u => u.email !== email));
  const closeAlert = () => setAlertData(prev => ({ ...prev, isOpen: false }));

  return (
    <AppContext.Provider value={{ 
      products, updateProduct, addNewProduct, deleteProduct, bulkUpdateMargins,
      cart, addToCart, decreaseFromCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, orders, addOrder, 
      currentUser, login, logout, users, addUser, toggleUserStatus, deleteUser, isAdmin: currentUser?.role === 'admin',
      dolarBlue, setDolarBlue, formatPrice, calculateFinalPriceARS,
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

const QuantityControl: React.FC<{ product: Product, quantityInCart: number, onAdd: () => void, onRemove: () => void, compact?: boolean }> = ({ product, quantityInCart, onAdd, onRemove, compact }) => {
  const isOutOfStock = product.stock <= 0;
  if (isOutOfStock) return null;
  if (quantityInCart === 0) return <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className={`bg-neutral-800 hover:bg-gold-600 hover:text-black text-gold-500 border border-gold-600/50 rounded flex items-center justify-center transition-colors uppercase tracking-widest ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-3 py-1.5'}`}>Agregar</button>;
  return <div className={`flex items-center bg-neutral-900 border border-gold-600/30 rounded overflow-hidden ${compact ? 'h-5' : 'h-8'}`}><button onClick={(e) => { e.stopPropagation(); onRemove(); }} className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-5 h-full' : 'w-8 h-full'}`}><Minus size={compact ? 10 : 14} /></button><span className={`flex items-center justify-center bg-black text-white font-bold border-x border-gold-600/30 ${compact ? 'w-5 text-[9px]' : 'w-8 text-sm'}`}>{quantityInCart}</span><button onClick={(e) => { e.stopPropagation(); onAdd(); }} className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-5 h-full' : 'w-8 h-full'}`}><Plus size={compact ? 10 : 14} /></button></div>;
};

const Header: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const { cart, setIsCartOpen, filterBrand, setFilterBrand, availableBrands, filterGender, setFilterGender, availableGenders, viewMode, setViewMode } = useStore();
    useEffect(() => { const h = () => setScrolled(window.scrollY > 80); window.addEventListener('scroll', h); return () => window.removeEventListener('scroll', h); }, []);
    const cartTotalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
    return <header className={`fixed top-0 left-0 w-full z-50 transition-all duration-700 ${scrolled ? 'bg-luxury-black/95 backdrop-blur-md border-b border-gold-600/20 py-1' : 'bg-gradient-to-b from-black/80 to-transparent py-2'}`}><div className="container mx-auto px-2"><div className="flex items-center justify-between gap-2 h-10 relative"><div className="flex-shrink-0 z-20 cursor-pointer w-8 md:w-auto" onClick={() => window.scrollTo(0,0)}><img src={PERKINS_IMAGES.LOGO} className={`transition-all duration-700 ease-[cubic-bezier(0.33,1,0.68,1)] object-contain drop-shadow-[0_0_15px_rgba(212,175,55,0.4)] ${scrolled ? 'h-7 md:h-8' : 'h-8 md:h-10'}`} onError={(e) => { e.currentTarget.src = PERKINS_IMAGES.HOLA; }}/></div><div className="flex-1 flex flex-col md:flex-row justify-center items-center gap-2 min-w-0"><div className="flex items-center gap-1 w-full max-w-[280px]"><div className="relative flex-1 min-w-0"><select value={filterGender} onChange={(e) => setFilterGender(e.target.value)} className="w-full appearance-none bg-black/40 backdrop-blur text-gray-300 hover:text-gold-400 text-[10px] border border-neutral-800 rounded-full pl-2 pr-4 py-1 outline-none cursor-pointer truncate">{availableGenders.map(g => <option key={g} value={g} className="bg-black">{g}</option>)}</select></div><div className="relative flex-[1.5] min-w-0"><select value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)} className="w-full appearance-none bg-black/40 backdrop-blur text-gray-300 hover:text-gold-400 text-[10px] border border-neutral-800 rounded-full pl-2 pr-4 py-1 outline-none cursor-pointer truncate">{availableBrands.map(b => <option key={b} value={b} className="bg-black text-gray-300">{b}</option>)}</select></div></div></div><div className="flex-shrink-0 z-20 flex items-center gap-1"><div className="flex gap-1 bg-black/40 backdrop-blur border border-neutral-800 rounded-lg p-0.5"><button onClick={() => setViewMode('grid')} className={`p-1 rounded transition-colors ${viewMode === 'grid' ? 'bg-gold-600 text-black' : 'text-gray-500 hover:text-white'}`}><LayoutGrid size={14} /></button><button onClick={() => setViewMode('list')} className={`p-1 rounded transition-colors ${viewMode === 'list' ? 'bg-gold-600 text-black' : 'text-gray-500 hover:text-white'}`}><List size={14} /></button></div><button onClick={() => setIsCartOpen(true)} className="relative text-gold-400 hover:text-white transition-colors p-2 md:p-3 group"><ShoppingBag size={20} className="group-hover:drop-shadow-[0_0_8px_rgba(212,175,55,0.6)] transition-all md:w-5 md:h-5" />{cartTotalItems > 0 && (<span className="absolute top-0 right-0 bg-red-600 text-white text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center border border-black shadow-lg">{cartTotalItems}</span>)}</button></div></div></div></header>;
};

const VideoHero = () => {
    const [textIndex, setTextIndex] = useState(0);
    const changingWords = ["Vos", "Tu Pareja", "Tu Familia"];
    useEffect(() => { const i = setInterval(() => setTextIndex(p => (p+1)%3), 3000); return () => clearInterval(i); }, []);
    return <div className="relative h-[85vh] w-full bg-luxury-black overflow-hidden"><div className="absolute inset-0 bg-black/40 flex items-center justify-center"><h1 className="text-5xl font-serif text-gold-500">Mr. Perkins</h1></div></div>;
};

const ProductGridItem: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
  const { cart, addToCart, decreaseFromCart, calculateFinalPriceARS, formatPrice } = useStore();
  const [imgError, setImgError] = useState(false);
  const cartItem = cart.find(i => i.id === product.id);
  const qty = cartItem ? cartItem.quantity : 0;
  const price = calculateFinalPriceARS(product);
  const isOutOfStock = product.stock <= 0;
  return <div onClick={onClick} className={`group relative bg-neutral-900/50 rounded-lg overflow-hidden border border-neutral-800 hover:border-gold-600/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] cursor-pointer flex flex-col h-full ${isOutOfStock ? 'opacity-60' : ''}`}><div className="relative aspect-square overflow-hidden bg-white/5">{!imgError ? <img src={product.image} loading="lazy" onError={() => setImgError(true)} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}/> : <div className="w-full h-full flex items-center justify-center text-gold-600 bg-neutral-900"><ImageOff size={16} /></div>}{isOutOfStock && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"><span className="text-red-500 font-bold border-2 border-red-500 px-2 py-1 text-[8px] rounded uppercase tracking-widest transform -rotate-12">Agotado</span></div>}</div><div className="p-2 flex flex-col flex-1"><div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5 truncate">{product.marca}</div><h3 className="text-white font-medium text-[10px] md:text-xs leading-tight mb-2 group-hover:text-gold-400 transition-colors line-clamp-2 min-h-[2.5em]">{product.nombre}</h3><div className="mt-auto flex flex-col gap-1"><div className="text-gold-500 font-bold text-xs md:text-sm">{formatPrice(price)}</div><div onClick={e => e.stopPropagation()} className="w-full"><QuantityControl product={product} quantityInCart={qty} onAdd={() => addToCart(product)} onRemove={() => decreaseFromCart(product)} compact/></div></div></div></div>;
};

const ProductListItem: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
    const { cart, addToCart, decreaseFromCart, calculateFinalPriceARS, formatPrice } = useStore();
    const qty = cart.find(i => i.id === product.id)?.quantity || 0;
    return <div onClick={onClick} className="flex gap-4 p-4 border-b border-neutral-800"><img src={product.image} className="w-16 h-16 object-cover rounded" /><div><div className="text-white">{product.nombre}</div><div className="text-gold-500">{formatPrice(calculateFinalPriceARS(product))}</div></div></div>;
};

const ProductModal: React.FC<{ product: Product | null, onClose: () => void }> = ({ product, onClose }) => {
    if(!product) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}><div className="bg-neutral-900 p-8 rounded text-white" onClick={e=>e.stopPropagation()}><h2>{product.nombre}</h2><button onClick={onClose}>Cerrar</button></div></div>;
};
const PerkinsChatModal = ({onClose}:{onClose:()=>void}) => null;
const CartDrawer = () => null;

const Catalog: React.FC = () => {
  const { products, viewMode, filterBrand, filterGender, sortPrice, calculateFinalPriceARS, isCartOpen } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPerkinsOpen, setIsPerkinsOpen] = useState(false);

  const filteredProducts = useMemo(() => {
      let res = products.filter(p => !p.deleted);
      if (filterBrand !== 'Fabricante') res = res.filter(p => p.marca === filterBrand);
      if (filterGender !== 'Para Todos') res = res.filter(p => p.genero === filterGender);
      if (sortPrice !== 'none') {
          res.sort((a, b) => {
              const priceA = calculateFinalPriceARS(a);
              const priceB = calculateFinalPriceARS(b);
              return sortPrice === 'asc' ? priceA - priceB : priceB - priceA;
          });
      }
      return res;
  }, [products, filterBrand, filterGender, sortPrice, calculateFinalPriceARS]);

  return (
    <div className="min-h-screen bg-neutral-900 text-gray-200 font-sans selection:bg-gold-500/30 pb-20">
      <Header />
      <VideoHero />
      <FloatingPricingBar />
      <main className="container mx-auto px-4 relative z-20 -mt-20">
         <div className="flex justify-between items-end mb-6 px-2">
            <div>
                <h2 className="text-2xl font-serif text-white">Catálogo Exclusivo</h2>
                <p className="text-xs text-gold-500 uppercase tracking-widest">{filteredProducts.length} Fragancias Disponibles</p>
            </div>
         </div>
         <div className={`grid gap-4 md:gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5' : 'grid-cols-1'}`}>
            {filteredProducts.map(product => (
               viewMode === 'grid' ? <ProductGridItem key={product.id} product={product} onClick={() => setSelectedProduct(product)} /> : <ProductListItem key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
            ))}
         </div>
         {filteredProducts.length === 0 && <div className="py-20 text-center"><PackageX size={48} className="mx-auto text-neutral-700 mb-4"/><p className="text-gray-500">No se encontraron productos.</p></div>}
      </main>
      <Footer />
      <CartDrawer /> 
      <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
      {isPerkinsOpen && <PerkinsChatModal onClose={() => setIsPerkinsOpen(false)} />}
      <button onClick={() => setIsPerkinsOpen(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 rounded-full border-2 border-gold-500 shadow-[0_0_30px_rgba(212,175,55,0.4)] overflow-hidden bg-black hover:scale-110 transition-transform group"><img src={PERKINS_IMAGES.EXCELENTE} className="w-full h-full object-cover" alt="Chat" /></button>
    </div>
  );
};

// --- ADMIN COMPONENTS ---

// COMPONENT: Product Edit Modal (For Admin)
const AdminProductModal: React.FC<{ 
  product: Product | null, 
  onClose: () => void, 
  onSave: (id: string, updates: Partial<Product>) => void,
  isNew?: boolean,
  onCreate?: (p: Product) => void
}> = ({ product, onClose, onSave, isNew, onCreate }) => {
    const [formData, setFormData] = useState<Partial<Product>>({});
    
    useEffect(() => {
        if (product) {
            setFormData({...product});
        } else if (isNew) {
            setFormData({
                nombre: '', marca: '', precio_usd: 0, stock: 0, 
                presentacion_ml: 100, genero: 'Unisex', 
                tags_olfativos: [], margin_retail: 50, margin_wholesale: 15,
                image: 'https://via.placeholder.com/300?text=No+Image'
            });
        }
    }, [product, isNew]);

    const handleSave = () => {
        if (isNew && onCreate && formData.nombre) {
            const newProduct = {
                id: `prod-custom-${Date.now()}`,
                nombre: formData.nombre || 'Nuevo',
                marca: formData.marca || 'Generico',
                precio_usd: Number(formData.precio_usd) || 0,
                stock: Number(formData.stock) || 0,
                presentacion_ml: Number(formData.presentacion_ml) || 100,
                genero: formData.genero || 'Unisex',
                tags_olfativos: formData.tags_olfativos || [],
                image: formData.image,
                margin_retail: Number(formData.margin_retail) || 50,
                margin_wholesale: Number(formData.margin_wholesale) || 15
            } as Product;
            onCreate(newProduct);
        } else if (product && onSave) {
            onSave(product.id, formData);
        }
        onClose();
    };

    if (!product && !isNew) return null;

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center px-4 animate-fade-in">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-neutral-900 w-full max-w-2xl rounded-xl border border-gold-600/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-neutral-800 flex justify-between items-center bg-black">
                    <h3 className="text-xl font-bold text-gold-500 font-serif">{isNew ? 'Nuevo Producto' : 'Editar Producto'}</h3>
                    <button onClick={onClose} className="text-gray-500 hover:text-white"><X size={24}/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                             <label className="text-xs text-gray-500 uppercase">Nombre</label>
                             <input className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.nombre || ''} onChange={e => setFormData({...formData, nombre: e.target.value})} />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 uppercase">Marca</label>
                             <input className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.marca || ''} onChange={e => setFormData({...formData, marca: e.target.value})} />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 uppercase">Género</label>
                             <select className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.genero || 'Unisex'} onChange={e => setFormData({...formData, genero: e.target.value})}>
                                <option value="Hombre">Hombre</option><option value="Mujer">Mujer</option><option value="Unisex">Unisex</option>
                             </select>
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 uppercase">Costo USD</label>
                             <input type="number" className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.precio_usd || 0} onChange={e => setFormData({...formData, precio_usd: Number(e.target.value)})} />
                        </div>
                        <div>
                             <label className="text-xs text-gray-500 uppercase">Stock</label>
                             <input type="number" className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.stock || 0} onChange={e => setFormData({...formData, stock: Number(e.target.value)})} />
                        </div>
                        <div className="p-3 bg-neutral-800/30 rounded border border-neutral-800">
                             <label className="text-xs text-green-500 uppercase font-bold">Margen Minorista (%)</label>
                             <input type="number" className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.margin_retail || 50} onChange={e => setFormData({...formData, margin_retail: Number(e.target.value)})} />
                        </div>
                        <div className="p-3 bg-neutral-800/30 rounded border border-neutral-800">
                             <label className="text-xs text-blue-500 uppercase font-bold">Margen Mayorista (%)</label>
                             <input type="number" className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.margin_wholesale || 15} onChange={e => setFormData({...formData, margin_wholesale: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2">
                             <label className="text-xs text-gray-500 uppercase">Tags Olfativos (separados por coma)</label>
                             <input className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.tags_olfativos?.join(', ') || ''} onChange={e => setFormData({...formData, tags_olfativos: e.target.value.split(',').map(s => s.trim())})} />
                        </div>
                        <div className="col-span-2">
                             <label className="text-xs text-gray-500 uppercase">URL Imagen</label>
                             <input className="w-full bg-black border border-neutral-700 rounded p-2 text-white text-xs" value={formData.image || ''} onChange={e => setFormData({...formData, image: e.target.value})} />
                             {formData.image && <div className="mt-2 h-20 w-20 rounded overflow-hidden border border-neutral-700"><img src={formData.image} className="w-full h-full object-cover" /></div>}
                        </div>
                    </div>
                </div>
                <div className="p-4 border-t border-neutral-800 bg-black flex justify-end gap-2">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white">Cancelar</button>
                    <button onClick={handleSave} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded flex items-center gap-2"><Save size={16}/> Guardar Cambios</button>
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
  const { 
    orders, currentUser, login, logout, formatPrice, products, updateProduct, addNewProduct, deleteProduct,
    bulkUpdateMargins, users, addUser, toggleUserStatus, deleteUser,
    showAlert, addOrder, dolarBlue, setDolarBlue
  } = useStore();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'users'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalRetail, setGlobalRetail] = useState(50);
  const [globalWholesale, setGlobalWholesale] = useState(15);
  const isApiConfigured = isApiKeyConfigured();

  // User Management
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('seller');

  // Manual Order
  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualOrderData, setManualOrderData] = useState({ clientName: '', total: 0, description: '' });

  // Product Editing
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const filteredInventory = products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.marca.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleCreateUser = () => {
     if(!newUserEmail || !newUserPass || !newUserName) { showAlert("Error", "Complete todos los campos.", "error"); return; }
     if(users.some(u => u.email === newUserEmail)) { showAlert("Error", "El email ya está registrado.", "error"); return; }
     addUser({ email: newUserEmail, pass: newUserPass, name: newUserName, role: newUserRole, active: false });
     showAlert("Usuario Creado", `Se ha enviado un correo de confirmación a ${newUserEmail}.`, "success");
     setNewUserEmail(''); setNewUserPass(''); setNewUserName('');
  };

  const handleManualOrder = () => {
      if(!manualOrderData.clientName || manualOrderData.total <= 0) return;
      const newOrder: Order = { id: `MAN-${Date.now()}`, customerName: manualOrderData.clientName, total: manualOrderData.total, items: [], address: 'Venta Manual / Mostrador', deliveryDate: new Date().toISOString().split('T')[0], status: 'delivered', timestamp: Date.now(), type: 'retail', createdBy: currentUser?.email };
      addOrder(newOrder); setShowManualOrder(false); setManualOrderData({ clientName: '', total: 0, description: '' }); showAlert("Pedido Agregado", "La venta manual se ha registrado correctamente.", "success");
  };

  if (!currentUser) {
    // Login Screen (Same as before)
    return (
      <div className="min-h-screen bg-neutral-900 flex items-center justify-center p-4">
        <div className="bg-black p-8 rounded-xl border border-gold-600/30 w-full max-w-md text-center shadow-[0_0_50px_rgba(212,175,55,0.1)]">
          <div className="w-20 h-20 bg-neutral-900 rounded-full flex items-center justify-center mx-auto mb-6 border border-gold-500/30"><UserIcon className="w-10 h-10 text-gold-500" /></div>
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
        <div className="p-6 border-b border-neutral-800"><h1 className="text-xl font-serif text-gold-500 tracking-wider">MR. PERKINS</h1><span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">{currentUser.role === 'admin' ? <Shield size={10} className="text-gold-500"/> : <UserIcon size={10}/>}{currentUser.role === 'admin' ? 'Administrador' : 'Vendedor'}</span></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><ClipboardList size={20} /><span className="font-medium">Pedidos</span></button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inventory' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><Box size={20} /><span className="font-medium">Inventario {currentUser.role !== 'admin' && '(Solo Lectura)'}</span></button>
          {currentUser.role === 'admin' && <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><Users size={20} /><span className="font-medium">Usuarios</span></button>}
        </nav>
        <div className="p-4 border-t border-neutral-800"><div className="mb-4 px-2"><p className="text-xs text-gray-500">Sesión iniciada como:</p><p className="text-sm font-bold text-white truncate">{currentUser.name}</p></div><button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"><LogOut size={16} /> Cerrar Sesión</button></div>
      </aside>

      <main className="flex-1 p-8 ml-64 md:ml-0 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-white mb-1">{activeTab === 'orders' && 'Gestión de Pedidos'}{activeTab === 'inventory' && 'Control de Stock'}{activeTab === 'users' && 'Administración de Usuarios'}</h2>
            {isApiConfigured && <span className="text-green-500 text-xs flex items-center gap-1"><CheckCircle size={12}/> Sistema IA Operativo</span>}
          </div>
          {/* MANUAL DOLAR OVERRIDE */}
          {activeTab === 'inventory' && currentUser.role === 'admin' && (
             <div className="bg-black border border-gold-600/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(212,175,55,0.1)]">
                <span className="text-gold-500 text-xs font-bold uppercase tracking-widest">Cotización Dolar Blue</span>
                <div className="flex items-center gap-1 text-white font-serif text-lg">
                    <span>$</span>
                    <input 
                      type="number" 
                      value={dolarBlue} 
                      onChange={(e) => setDolarBlue(Number(e.target.value))} 
                      className="bg-transparent w-16 text-right outline-none border-b border-neutral-700 focus:border-gold-500 transition-colors"
                    />
                </div>
                <div className="text-[10px] text-gray-500">Editale</div>
             </div>
          )}
        </header>

        {activeTab === 'orders' && (
            // Order logic remains same
            <div className="space-y-6">
                 {/* ... Order stats ... */}
                 <div className="flex justify-between items-center mb-4">
                     <div className="grid grid-cols-3 gap-4 flex-1 mr-4">
                        <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Total</h3><span className="text-2xl font-serif text-white">{orders.length}</span></div>
                        <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Pendientes</h3><span className="text-2xl font-serif text-gold-500">{orders.filter(o => o.status === 'pending').length}</span></div>
                        <div className="bg-black border border-neutral-800 p-4 rounded-lg"><h3 className="text-gray-500 text-xs uppercase tracking-wider mb-2">Facturación</h3><span className="text-xl font-serif text-white">{formatPrice(orders.reduce((acc, o) => acc + o.total, 0))}</span></div>
                     </div>
                     <button onClick={() => setShowManualOrder(!showManualOrder)} className="bg-gold-600 text-black font-bold py-3 px-6 rounded-lg hover:bg-gold-500 flex items-center gap-2"><Plus size={20} /> Nuevo Pedido Manual</button>
                 </div>
                 {showManualOrder && (
                     <div className="bg-neutral-800/50 p-6 rounded-lg border border-gold-600/30 mb-6 animate-fade-in">
                         <h3 className="text-lg font-bold text-white mb-4">Cargar Pedido Manual</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                             <input type="text" placeholder="Nombre Cliente" value={manualOrderData.clientName} onChange={e => setManualOrderData({...manualOrderData, clientName: e.target.value})} className="bg-black border border-neutral-700 p-3 rounded text-white" />
                             <div className="flex items-center gap-2"><span className="text-gray-400">ARS</span><input type="number" placeholder="Total ARS" value={manualOrderData.total} onChange={e => setManualOrderData({...manualOrderData, total: Number(e.target.value)})} className="bg-black border border-neutral-700 p-3 rounded text-white flex-1" /></div>
                             <button onClick={handleManualOrder} className="bg-green-600 hover:bg-green-500 text-white font-bold rounded p-3">Confirmar Venta</button>
                         </div>
                     </div>
                 )}
                 <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
                    {orders.length === 0 ? <div className="p-12 text-center text-gray-500"><ClipboardList size={48} className="mx-auto mb-4 opacity-20" /><p>No hay pedidos registrados.</p></div> : (
                      <div className="divide-y divide-neutral-800">{orders.map(order => (
                          <div key={order.id} className="p-6 hover:bg-neutral-900/50 transition-colors">
                            <div className="flex flex-col md:flex-row justify-between mb-4">
                               <div>
                                  <div className="flex items-center gap-3 mb-1"><span className="text-gold-500 font-bold">{order.id}</span><span className="bg-yellow-900/30 text-yellow-500 text-xs px-2 py-0.5 rounded border border-yellow-900/50 uppercase">{order.status}</span><span className={`text-xs px-2 py-0.5 rounded border uppercase ${order.type === 'wholesale' ? 'bg-blue-900/30 border-blue-800 text-blue-400' : 'bg-green-900/30 border-green-800 text-green-400'}`}>{order.type === 'wholesale' ? 'Mayorista' : 'Minorista'}</span></div>
                                  <h4 className="text-white font-medium">{order.customerName}</h4>{order.createdBy && <p className="text-xs text-gray-600 mt-1">Cargado por: {order.createdBy}</p>}
                               </div>
                               <div className="text-right mt-2 md:mt-0"><div className="text-gold-500 font-bold text-xl">{formatPrice(order.total)}</div><div className="text-xs text-gray-500">{order.deliveryDate}</div></div>
                            </div>
                            {order.items.length > 0 && (<div className="bg-neutral-900/50 rounded p-3 text-sm"><ul className="space-y-1">{order.items.map((item, idx) => (<li key={idx} className="flex justify-between text-gray-300"><span>{item.quantity}x {item.nombre}</span><span>{formatPrice((item.precio_usd * dolarBlue * (1 + (order.type === 'wholesale' ? (item.margin_wholesale||15) : (item.margin_retail||50))/100)) * item.quantity)}</span></li>))}</ul></div>)}
                          </div>
                        ))}
                      </div>
                    )}
                 </div>
            </div>
        )}

        {activeTab === 'inventory' && (
          <div className="space-y-6">
             {currentUser.role === 'admin' && (
                <div className="bg-neutral-800/30 border border-neutral-700 p-6 rounded-lg mb-6">
                    <h3 className="text-gold-500 font-serif mb-4 flex items-center gap-2"><SlidersHorizontal size={18} /> Configuración Global</h3>
                    <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex-1 bg-black/50 p-4 rounded border border-neutral-800">
                            <label className="block text-gray-400 text-xs mb-2 uppercase">Margen Minorista Global (%)</label>
                            <div className="flex gap-2"><input type="number" value={globalRetail} onChange={(e) => setGlobalRetail(Number(e.target.value))} className="bg-neutral-900 border border-neutral-700 rounded p-2 text-white w-20 text-center" /><button onClick={() => bulkUpdateMargins('retail', globalRetail)} className="bg-gold-600 text-black px-4 rounded font-bold hover:bg-gold-500 text-sm">Aplicar a Todos</button></div>
                        </div>
                        {/* We hide the Global Wholesale input if desired, but kept it here for utility. User asked to remove 'Margen WHSLE del CSM' which usually implies the column table clutter. */}
                        <div className="flex-1 bg-black/50 p-4 rounded border border-neutral-800 flex items-center justify-end">
                            <button onClick={() => setIsCreatingProduct(true)} className="bg-green-700 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-bold flex items-center gap-2"><Plus size={20}/> Agregar Producto</button>
                        </div>
                    </div>
                </div>
             )}

            <div className="flex items-center bg-black border border-neutral-800 rounded-lg px-4 py-3 mb-6">
               <Search className="text-gray-500 mr-2" size={20} />
               <input type="text" placeholder="Buscar por nombre o marca..." className="bg-transparent border-none outline-none text-white w-full placeholder-gray-600" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            </div>

            <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden overflow-x-auto">
               <table className="w-full text-left text-sm whitespace-nowrap">
                 <thead className="bg-neutral-900 text-gray-400 uppercase tracking-wider text-xs font-medium">
                   <tr>
                     <th className="p-4">Producto</th>
                     <th className="p-4 text-center">Costo USD</th>
                     <th className="p-4 text-center text-gray-600">Costo ARS</th>
                     {currentUser.role === 'admin' && (
                         <>
                            <th className="p-4 text-center bg-neutral-800/30">Margen Retail</th>
                            <th className="p-4 text-center bg-neutral-800/30">Precio Retail</th>
                            {/* REMOVED WHOLESALE COLUMNS AS REQUESTED */}
                         </>
                     )}
                     <th className="p-4 text-center">Stock</th>
                     {currentUser.role === 'admin' && <th className="p-4 text-right">Acciones</th>}
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-neutral-800">
                   {filteredInventory.map(product => {
                       const costoARS = Math.ceil(product.precio_usd * dolarBlue);
                       const retailPrice = costoARS * (1 + (product.margin_retail || 50)/100);
                       
                       return (
                         <tr key={product.id} className="hover:bg-neutral-900/30 transition-colors group">
                           <td className="p-4 max-w-xs"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded bg-neutral-800 overflow-hidden flex-shrink-0"><img src={product.image} alt="" className="w-full h-full object-cover" /></div><div><div className="text-white font-medium truncate">{product.nombre}</div><div className="text-gray-500 text-xs">{product.marca}</div></div></div></td>
                           
                           {/* ADMIN VIEW */}
                           {currentUser.role === 'admin' ? (
                               <>
                                    <td className="p-4 text-center font-bold text-gray-300">${product.precio_usd}</td>
                                    <td className="p-4 text-center text-gray-600 font-mono text-xs">{formatPrice(costoARS)}</td>
                                    
                                    <td className="p-4 text-center bg-neutral-800/30"><div className="flex items-center justify-center gap-1"><span className="text-green-400 font-bold">{product.margin_retail || 50}</span><span className="text-xs text-gray-500">%</span></div></td>
                                    <td className="p-4 text-center bg-neutral-800/30 text-green-400 font-bold">{formatPrice(retailPrice)}</td>
                                    
                                    <td className="p-4 text-center"><span className={`font-bold ${product.stock === 0 ? 'text-red-500' : 'text-white'}`}>{product.stock}</span></td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <button onClick={() => setEditingProduct(product)} className="p-2 hover:bg-blue-900/30 text-blue-500 rounded transition-colors" title="Editar Detalles"><Edit3 size={16} /></button>
                                            <button onClick={() => { if(window.confirm('¿Eliminar este producto?')) deleteProduct(product.id) }} className="p-2 hover:bg-red-900/30 text-red-500 rounded transition-colors" title="Eliminar"><Trash2 size={16} /></button>
                                        </div>
                                    </td>
                               </>
                           ) : (
                               <>
                                    <td className="p-4 text-center text-gray-500"><span className="flex items-center justify-center gap-1"><Lock size={12}/> {product.precio_usd}</span></td>
                                    <td className="p-4 text-center"><div className={`inline-block px-2 py-1 rounded text-xs font-bold ${product.stock > 0 ? 'bg-green-900/30 text-green-500' : 'bg-red-900/30 text-red-500'}`}>{product.stock} Unidades</div></td>
                               </>
                           )}
                         </tr>
                       );
                   })}
                 </tbody>
               </table>
            </div>
            
            {/* EDIT MODAL */}
            {(editingProduct || isCreatingProduct) && (
                <AdminProductModal 
                    product={editingProduct}
                    isNew={isCreatingProduct}
                    onClose={() => { setEditingProduct(null); setIsCreatingProduct(false); }}
                    onSave={updateProduct}
                    onCreate={addNewProduct}
                />
            )}
          </div>
        )}

        {/* User Management code ... */}
        {activeTab === 'users' && currentUser.role === 'admin' && (
             <div className="space-y-6">
                 {/* ... create user form ... */}
                 <div className="bg-neutral-800/30 border border-neutral-700 p-6 rounded-lg mb-6">
                    <h3 className="text-white font-bold mb-4 flex items-center gap-2"><UserPlus size={18} className="text-gold-500" /> Crear Nuevo Usuario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
                        <div className="md:col-span-1"><label className="text-xs text-gray-500 uppercase">Nombre</label><input type="text" value={newUserName} onChange={e => setNewUserName(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1" placeholder="Nombre completo" /></div>
                        <div className="md:col-span-1"><label className="text-xs text-gray-500 uppercase">Email</label><input type="email" value={newUserEmail} onChange={e => setNewUserEmail(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1" placeholder="email@empresa.com" /></div>
                        <div className="md:col-span-1"><label className="text-xs text-gray-500 uppercase">Contraseña</label><input type="text" value={newUserPass} onChange={e => setNewUserPass(e.target.value)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1" placeholder="********" /></div>
                        <div className="md:col-span-1"><label className="text-xs text-gray-500 uppercase">Rol</label><select value={newUserRole} onChange={e => setNewUserRole(e.target.value as UserRole)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white mt-1"><option value="seller">Vendedor</option><option value="admin">Administrador</option></select></div>
                        <div className="md:col-span-1"><button onClick={handleCreateUser} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold p-2 rounded flex justify-center gap-2 items-center"><Mail size={16} /> Crear y Enviar</button></div>
                    </div>
                 </div>
                 <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-neutral-900 text-gray-400 uppercase tracking-wider text-xs font-medium"><tr><th className="p-4">Usuario</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr></thead>
                        <tbody className="divide-y divide-neutral-800">{users.map(user => (<tr key={user.email} className="hover:bg-neutral-900/30"><td className="p-4"><div className="font-bold text-white">{user.name}</div><div className="text-gray-500 text-xs">{user.email}</div></td><td className="p-4"><span className={`px-2 py-1 rounded text-xs uppercase font-bold border ${user.role === 'admin' ? 'bg-purple-900/30 border-purple-800 text-purple-400' : 'bg-blue-900/30 border-blue-800 text-blue-400'}`}>{user.role}</span></td><td className="p-4"><button onClick={() => toggleUserStatus(user.email)} className={`flex items-center gap-2 px-2 py-1 rounded border transition-colors ${user.active ? 'border-green-800 text-green-400 hover:bg-green-900/20' : 'border-yellow-800 text-yellow-500 hover:bg-yellow-900/20'}`}>{user.active ? <CheckCircle size={14} /> : <AlertTriangle size={14} />}{user.active ? 'Activo' : 'Pendiente/Inactivo'}</button></td><td className="p-4 text-right"><button onClick={() => deleteUser(user.email)} className="text-red-500 hover:text-red-400 p-2 hover:bg-red-900/20 rounded"><LogOut size={16} /></button></td></tr>))}</tbody>
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