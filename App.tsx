import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, X, Truck, User as UserIcon, Send, CreditCard, ImageOff, AlertTriangle, CheckCircle, MapPin, Loader2, ClipboardList, LogOut, Lock, Search, Edit3, Users, UserPlus, Shield, LayoutGrid, List, Trash2, Save, Phone } from 'lucide-react';
import { PRODUCTS, PERKINS_IMAGES } from './constants';
import { Product, CartItem, Order, ChatMessage, ChatRole, User, UserRole, PaymentMethod, ShippingMethod } from './types';
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

// --- ERROR BOUNDARY ---
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Uncaught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-black text-white p-4 text-center">
          <div>
            <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
            <h1 className="text-xl font-bold mb-2">Algo salió mal.</h1>
            <p className="text-gray-400 mb-4">La aplicación ha encontrado un error inesperado.</p>
            <button onClick={() => window.location.reload()} className="bg-gold-600 text-black px-4 py-2 rounded font-bold">Recargar Página</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

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
  updateOrderStatus: (orderId: string, status: 'pending' | 'shipped' | 'delivered' | 'cancelled') => void;
  fetchOrdersFromCalendar: () => void;
  
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
  setDolarBlue: (val: number) => void;
  formatPrice: (ars: number) => string;
  calculateFinalPriceARS: (product: Product) => number;
  calculateProductCostARS: (product: Product) => number;
  pricingMode: 'retail' | 'wholesale';
  setPricingMode: (mode: 'retail' | 'wholesale') => void;
  viewMode: 'grid' | 'list';
  setViewMode: (mode: 'grid' | 'list') => void;
  filterBrand: string;
  setFilterBrand: (v: string) => void;
  filterGender: string;
  setFilterGender: (v: string) => void;
  sortPrice: 'none' | 'asc' | 'desc';
  setSortPrice: (v: 'none' | 'asc' | 'desc') => void;
  availableBrands: string[];
  availableGenders: string[];
  showAlert: (title: string, message: string, type?: 'success' | 'error' | 'info') => void;
  closeAlert: () => void;
  syncStatus: 'synced' | 'syncing' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// --- PERKINS CUSTOM MODAL COMPONENT ---
const PerkinsModal: React.FC<{ data: AlertData; onClose: () => void }> = ({ data, onClose }) => {
  if (!data.isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-luxury-card w-full max-w-sm rounded-2xl border border-gold-600/50 shadow-[0_0_30px_rgba(212,175,55,0.2)] overflow-hidden flex flex-col items-center text-center p-6 animate-slide-up">
        <div className="w-20 h-20 rounded-full border-2 border-gold-500 overflow-hidden shadow-lg mb-4 bg-black">
             <img src={PERKINS_IMAGES.EXCELENTE} className="w-full h-full object-cover" alt="Perkins" />
        </div>
        <h3 className="text-xl font-serif text-gold-500 mb-2 font-bold">{data.title}</h3>
        <div className="text-gray-300 text-sm mb-6 whitespace-pre-line leading-relaxed">{data.message}</div>
        <button onClick={onClose} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded-lg uppercase tracking-widest transition-colors">Entendido</button>
      </div>
    </div>
  );
};

const AppProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const lastUpdateRef = useRef<number>(0); 
  const lastOverridesRef = useRef<string>(''); // IMPORTANTE: Evita re-renders innecesarios
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error'>('synced');

  useEffect(() => {
    const fetchUpdates = async () => {
      if (Date.now() - lastUpdateRef.current < 5000) {
          return; 
      }
      try {
        const response = await fetch(`/api/products?t=${Date.now()}`);
        if (response.ok) {
          const overrides = await response.json();
          const overridesStr = JSON.stringify(overrides);
          if (overridesStr === lastOverridesRef.current) {
              setSyncStatus('synced');
              return; 
          }
          lastOverridesRef.current = overridesStr;

          const productMap = new Map<string, Product>();
          PRODUCTS.forEach(p => { productMap.set(p.id, { ...p }); });
          Object.entries(overrides).forEach(([id, data]: [string, any]) => {
              if (data.deleted) {
                  productMap.delete(id);
              } else {
                  const existing = productMap.get(id);
                  const getMargin = (newVal: any, existingVal: number | undefined, defaultVal: number) => {
                      if (newVal !== null && newVal !== undefined) return Number(newVal);
                      if (existingVal !== undefined) return existingVal;
                      return defaultVal;
                  };
                  const marginRetail = getMargin(data.margin_retail, existing?.margin_retail, 50);
                  const marginWholesale = getMargin(data.margin_wholesale, existing?.margin_wholesale, 15);

                  if (existing) {
                      productMap.set(id, { 
                          ...existing, 
                          ...data,
                          precio_usd: data.precio_usd !== undefined && data.precio_usd !== null ? Number(data.precio_usd) : existing.precio_usd,
                          stock: data.stock !== undefined && data.stock !== null ? Number(data.stock) : existing.stock,
                          margin_retail: marginRetail,
                          margin_wholesale: marginWholesale
                      });
                  } else {
                      if (data.nombre && data.nombre !== 'Nuevo Producto') {
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
                              ...data,
                              margin_retail: marginRetail,
                              margin_wholesale: marginWholesale
                          });
                      }
                  }
              }
          });
          setProducts(Array.from(productMap.values()));
          setSyncStatus('synced');
        } else {
            console.warn("Sync fetch failed");
        }
      } catch (error) {
        console.warn("Could not fetch product updates", error);
        setSyncStatus('error');
      }
    };
    fetchUpdates();
    const interval = setInterval(fetchUpdates, 5000); 
    return () => clearInterval(interval);
  }, []);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  // ROBUST Initialization of Dolar Blue
  const [dolarBlue, setDolarBlueState] = useState(() => {
      try {
          const saved = localStorage.getItem('dolarBlue');
          const parsed = saved ? Number(saved) : 0;
          return !isNaN(parsed) && parsed > 0 ? parsed : 1230; 
      } catch {
          return 1230;
      }
  });
  
  const setDolarBlue = (val: number) => {
      if(!val || val <= 0 || isNaN(val)) return;
      setDolarBlueState(val);
      localStorage.setItem('dolarBlue', String(val));
  };

  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [alertData, setAlertData] = useState<AlertData>({ isOpen: false, title: '', message: '', type: 'info' });
  const [filterBrand, setFilterBrand] = useState<string>('Fabricante');
  const [filterGender, setFilterGender] = useState<string>('Para Todos');
  const [sortPrice, setSortPrice] = useState<'none' | 'asc' | 'desc'>('none');

  const availableBrands = useMemo(() => ['Fabricante', ...Array.from(new Set(products.map(p => p.marca)))], [products]);
  const availableGenders = useMemo(() => ['Para Todos', ...Array.from(new Set(products.map(p => p.genero)))], [products]);

  const fetchOrdersFromCalendar = async () => {
    try {
      const res = await fetch('/api/get_orders');
      if (res.ok) {
        const calendarOrders = await res.json();
        setOrders(calendarOrders);
      }
    } catch (e) {
      console.error("Failed to sync orders", e);
    }
  };

  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const response = await fetch('https://dolarapi.com/v1/dolares/blue');
        if(response.ok) {
            const data = await response.json();
            if (data && data.venta && data.venta > 0) setDolarBlue(data.venta); 
        }
      } catch (e) { console.error("Error fetching Dolar:", e); }
    };
    fetchDolar();
    fetchOrdersFromCalendar(); 
  }, []);

  const calculateFinalPriceARS = (product: Product): number => {
    const defaultRetail = 50;
    const defaultWholesale = 15;
    const retail = product.margin_retail !== undefined ? product.margin_retail : defaultRetail;
    const wholesale = product.margin_wholesale !== undefined ? product.margin_wholesale : defaultWholesale;
    const margin = pricingMode === 'wholesale' ? wholesale : retail;
    const safeDolar = dolarBlue > 0 ? dolarBlue : 1230;
    const costoEnPesos = product.precio_usd * safeDolar;
    return Math.ceil(costoEnPesos * (1 + margin / 100));
  };

  const calculateProductCostARS = (product: Product): number => {
    const safeDolar = dolarBlue > 0 ? dolarBlue : 1230;
    return Math.ceil(product.precio_usd * safeDolar);
  };

  const formatPrice = (ars: number) => {
      if (isNaN(ars)) return "$ -";
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(ars);
  }

  const persistUpdate = async (id: string, updates: Partial<Product> | { deleted: boolean }) => {
      lastUpdateRef.current = Date.now();
      setSyncStatus('syncing');
      try {
        await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, updates })
        });
        setSyncStatus('synced');
      } catch (e) {
        console.error("Failed to persist", e);
        setSyncStatus('error');
        showAlert("Error de Conexión", "No se pudo guardar en el servidor. Verifique su conexión.", "error");
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
      const { id, ...rest } = product;
      persistUpdate(id, rest);
  };

  const bulkUpdateMargins = async (type: 'retail' | 'wholesale', value: number) => {
    lastUpdateRef.current = Date.now();
    setSyncStatus('syncing');
    const key = type === 'retail' ? 'margin_retail' : 'margin_wholesale';
    const newProducts = products.map(p => ({ ...p, [key]: value }));
    setProducts(newProducts);
    const updatesArray = newProducts.map(p => ({ id: p.id, updates: { [key]: value } }));
    try {
        await fetch('/api/bulk-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ updatesArray })
        });
        setSyncStatus('synced');
        showAlert("Actualización Exitosa", `Margen ${type === 'retail' ? 'Minorista' : 'Mayorista'} actualizado a ${value}% para ${updatesArray.length} productos.`, 'success');
    } catch (error) {
        setSyncStatus('error');
        showAlert("Error", "Falló la actualización masiva.", "error");
    }
  };

  const showAlert = (title: string, message: string, type: 'success' | 'error' | 'info' = 'info') => setAlertData({ isOpen: true, title, message, type });

  const addToCart = (product: Product, quantity: number = 1, silent: boolean = false) => {
    if (product.stock <= 0) { showAlert("Perkins dice:", `Lo lamento, ${product.nombre} está agotado.`, 'error'); return; }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if ((existing ? existing.quantity : 0) + quantity > product.stock) {
         if(!silent) showAlert("Perkins dice:", `Stock insuficiente para agregar más.`, 'info');
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
  
  const updateOrderStatus = async (orderId: string, status: 'pending' | 'shipped' | 'delivered' | 'cancelled') => {
      const targetOrder = orders.find(o => o.id === orderId);
      if (!targetOrder) return;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
      if (targetOrder.googleEventId) {
          try {
              await fetch('/api/update_order_status', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ googleEventId: targetOrder.googleEventId, status })
              });
          } catch (e) {
              console.error("Failed to update status in backend", e);
              showAlert("Error Sincronización", "No se pudo actualizar el estado en el calendario.", "error");
          }
      }
  };

  const login = (email: string, pass: string): boolean => {
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.pass === pass);
    if (user) {
      if (!user.active) { showAlert("Cuenta Inactiva", "Confirme su email.", "error"); return false; }
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
      cart, addToCart, decreaseFromCart, removeFromCart, clearCart, isCartOpen, setIsCartOpen, orders, addOrder, updateOrderStatus, fetchOrdersFromCalendar,
      currentUser, login, logout, users, addUser, toggleUserStatus, deleteUser, isAdmin: currentUser?.role === 'admin',
      dolarBlue, setDolarBlue, formatPrice, calculateFinalPriceARS, calculateProductCostARS,
      pricingMode, setPricingMode, viewMode, setViewMode,
      filterBrand, setFilterBrand, filterGender, setFilterGender, sortPrice, setSortPrice, availableBrands, availableGenders,
      showAlert, closeAlert, syncStatus
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
      <div className="tracking-wider text-center md:text-right">Diseñado y Programado por <a href="#" className="text-gold-600 font-bold">Duggled Media Design</a></div>
    </div>
  </footer>
);

const FloatingPricingBar: React.FC = () => {
  const { pricingMode, setPricingMode } = useStore();
  return (
    <div className="fixed bottom-2 left-1/2 -translate-x-1/2 z-40 animate-slide-up">
      <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-full p-1.5 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-1">
        <button onClick={() => setPricingMode('retail')} className={`px-5 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all duration-500 ${pricingMode === 'retail' ? 'bg-gold-600 text-black shadow-[0_0_20px_rgba(212,175,55,0.3)]' : 'text-gray-400 hover:text-white'}`}>Minorista</button>
        <button onClick={() => setPricingMode('wholesale')} className={`px-5 py-2 rounded-full text-xs uppercase font-bold tracking-widest transition-all duration-500 ${pricingMode === 'wholesale' ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'text-gray-400 hover:text-white'}`}>Mayorista</button>
      </div>
    </div>
  );
};

const QuantityControl: React.FC<{ product: Product, quantityInCart: number, onAdd: () => void, onRemove: () => void, compact?: boolean }> = ({ product, quantityInCart, onAdd, onRemove, compact }) => {
  const isOutOfStock = product.stock <= 0;
  if (isOutOfStock) return null;
  if (quantityInCart === 0) return <button onClick={(e) => { e.stopPropagation(); onAdd(); }} className={`bg-neutral-800 hover:bg-gold-600 hover:text-black text-gold-500 border border-gold-600/50 rounded flex items-center justify-center transition-colors uppercase tracking-widest ${compact ? 'text-[9px] px-1.5 py-0.5' : 'text-xs px-3 py-1.5'}`}>Agregar</button>;
  return <div className={`flex items-center bg-neutral-900 border border-gold-600/30 rounded overflow-hidden ${compact ? 'h-5' : 'h-8'}`}><button onClick={(e) => { e.stopPropagation(); onRemove(); }} className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-5 h-full' : 'w-8 h-full'}`}><span className="text-sm font-bold text-white">-</span></button><span className={`flex items-center justify-center bg-black text-white font-bold border-x border-gold-600/30 ${compact ? 'w-5 text-[9px]' : 'w-8 text-sm'}`}>{quantityInCart}</span><button onClick={(e) => { e.stopPropagation(); onAdd(); }} className={`flex items-center justify-center hover:bg-gold-600/20 text-gold-500 transition-colors ${compact ? 'w-5 h-full' : 'w-8 h-full'}`}><span className="text-sm font-bold text-white">+</span></button></div>;
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
    return (
      <div className="relative h-[85vh] w-full bg-luxury-black overflow-hidden group">
         <div className="absolute inset-0 z-0"><video className="w-full h-full object-cover opacity-90" muted autoPlay loop playsInline poster="https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.webp"><source src="https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.mp4" type="video/mp4" /></video><div className="absolute inset-0 bg-black/40" /></div>
         <div className="relative z-10 h-full flex flex-col justify-center px-6 md:px-16 pointer-events-none"><div className="animate-slide-up"><span className="block text-xl md:text-3xl text-gray-200 font-serif tracking-widest uppercase mb-2 drop-shadow-md">Los mejores Perfumes...</span><div className="flex flex-col md:flex-row md:items-baseline gap-2 md:gap-4"><span className="text-4xl md:text-6xl text-gray-300 font-serif italic font-light">Para</span><span className="text-5xl md:text-8xl font-bold font-serif text-gold-500 drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">{changingWords[textIndex]}</span></div></div></div>
      </div>
    );
};

const ProductGridItem: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
  const { cart, addToCart, decreaseFromCart, calculateFinalPriceARS, formatPrice } = useStore();
  const [imgError, setImgError] = useState(false);
  const cartItem = cart.find(i => i.id === product.id);
  const price = calculateFinalPriceARS(product);
  const isOutOfStock = product.stock <= 0;
  return <div onClick={onClick} className={`group relative bg-neutral-900/50 rounded-lg overflow-hidden border border-neutral-800 hover:border-gold-600/50 transition-all duration-500 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)] cursor-pointer flex flex-col h-full ${isOutOfStock ? 'opacity-60' : ''}`}><div className="relative aspect-square overflow-hidden bg-white/5">{!imgError ? <img src={product.image} loading="lazy" onError={() => setImgError(true)} className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isOutOfStock ? 'grayscale opacity-50' : ''}`}/> : <div className="w-full h-full flex items-center justify-center text-gold-600 bg-neutral-900"><ImageOff size={16} /></div>}{isOutOfStock && <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-10"><span className="text-red-500 font-bold border-2 border-red-500 px-2 py-1 text-[8px] rounded uppercase tracking-widest transform -rotate-12">Agotado</span></div>}</div><div className="p-2 flex flex-col flex-1"><div className="text-[8px] text-gray-500 uppercase tracking-wider mb-0.5 truncate">{product.marca}</div><h3 className="text-white font-medium text-[10px] md:text-xs leading-tight mb-2 group-hover:text-gold-400 transition-colors line-clamp-2 min-h-[2.5em]">{product.nombre}</h3><div className="mt-auto flex flex-col gap-1"><div className="text-gold-500 font-bold text-xs md:text-sm">{formatPrice(price)}</div><div onClick={e => e.stopPropagation()} className="w-full"><QuantityControl product={product} quantityInCart={cartItem?.quantity || 0} onAdd={() => addToCart(product)} onRemove={() => decreaseFromCart(product)} compact/></div></div></div></div>;
};

const ProductListItem: React.FC<{ product: Product, onClick: () => void }> = ({ product, onClick }) => {
    const { cart, addToCart, decreaseFromCart, calculateFinalPriceARS, formatPrice } = useStore();
    return <div onClick={onClick} className="flex gap-4 p-4 border-b border-neutral-800"><img src={product.image} className="w-16 h-16 object-cover rounded" /><div><div className="text-white">{product.nombre}</div><div className="text-gold-500 font-bold">{formatPrice(calculateFinalPriceARS(product))}</div></div></div>;
};

const ProductModal: React.FC<{ product: Product | null, onClose: () => void }> = ({ product, onClose }) => {
    if(!product) return null;
    return <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" onClick={onClose}><div className="bg-neutral-900 p-8 rounded text-white max-w-lg w-full" onClick={e=>e.stopPropagation()}><h2 className="text-2xl font-serif text-gold-500 mb-4">{product.nombre}</h2><img src={product.image} className="w-full h-64 object-contain mb-4"/><button onClick={onClose} className="bg-neutral-800 text-white px-4 py-2 rounded">Cerrar</button></div></div>;
};

const PerkinsChatModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<ChatMessage[]>([{role: ChatRole.MODEL, text: 'Bienvenido a Mr. Perkins. ¿En qué puedo ayudarle?'}]);
    const { products, dolarBlue } = useStore();
    const handleSend = async () => {
        if(!input) return;
        const newHistory = [...messages, {role: ChatRole.USER, text: input}];
        setMessages(newHistory);
        setInput('');
        const reply = await sendMessageToPerkins(input, dolarBlue, products);
        setMessages([...newHistory, {role: ChatRole.MODEL, text: reply}]);
    };
    return <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"><div className="bg-neutral-900 w-full max-w-md h-[500px] flex flex-col rounded-xl border border-gold-600/30"><div className="p-4 border-b border-neutral-800 flex justify-between"><h3 className="text-gold-500 font-serif">Mr. Perkins AI</h3><button onClick={onClose}><X size={20}/></button></div><div className="flex-1 overflow-y-auto p-4 space-y-4">{messages.map((m,i)=><div key={i} className={`p-3 rounded-lg text-sm ${m.role===ChatRole.USER?'bg-neutral-800 ml-auto':'bg-gold-900/20 border border-gold-600/20'}`}>{m.text}</div>)}</div><div className="p-4 bg-black flex gap-2"><input className="flex-1 bg-neutral-900 border border-neutral-700 rounded px-3 py-2 text-white" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==='Enter'&&handleSend()}/><button onClick={handleSend} className="bg-gold-600 text-black p-2 rounded"><Send size={18}/></button></div></div></div>;
};

const CartDrawer: React.FC = () => {
    const { isCartOpen, setIsCartOpen, cart, clearCart, decreaseFromCart, addToCart, calculateFinalPriceARS, formatPrice, removeFromCart, addOrder, showAlert, calculateProductCostARS } = useStore();
    const [isCheckingOut, setIsCheckingOut] = useState(false);
    const [customerInfo, setCustomerInfo] = useState({ 
        name: '', 
        phone: '', 
        address: '', 
        city: '', 
        date: new Date().toISOString().split('T')[0],
        time: '15:00'
    });
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago');
    const [shippingMethod, setShippingMethod] = useState<ShippingMethod>('caba');
    
    const [isRaining, setIsRaining] = useState(false);
    const [payShippingNow, setPayShippingNow] = useState(false);
    const [checkingWeather, setCheckingWeather] = useState(false);

    if (!isCartOpen) return null;

    const safeCart = cart || []; 
    const cartTotal = safeCart.reduce((acc, item) => acc + calculateFinalPriceARS(item) * item.quantity, 0);
    const totalItems = safeCart.reduce((acc, item) => acc + item.quantity, 0);
    const totalVolumeCm3 = totalItems * 1500;
    
    let shippingCost = 0;
    if (shippingMethod === 'caba') {
        const baseCost = 7500;
        shippingCost = isRaining ? Math.ceil(baseCost * 1.5) : baseCost;
    } else {
        shippingCost = 0;
    }

    const finalTotal = cartTotal + (payShippingNow ? shippingCost : 0);

    const checkWeather = async () => {
        setCheckingWeather(true);
        try {
            const res = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-34.6037&longitude=-58.3816&current=weather_code&timezone=America%2FSao_Paulo');
            const data = await res.json();
            const code = data.current?.weather_code;
            const rainCodes = [51, 53, 55, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
            
            if (code !== undefined && rainCodes.includes(code)) {
                setIsRaining(true);
            } else {
                setIsRaining(false);
            }
        } catch (e) {
            console.error("Error checking weather", e);
        } finally {
            setCheckingWeather(false);
        }
    };

    useEffect(() => {
        if (shippingMethod === 'caba') {
            checkWeather();
        }
    }, [shippingMethod]);

    const handleCheckout = async () => {
        if (!customerInfo.name || (!customerInfo.address && shippingMethod !== 'pickup') || !customerInfo.date || !customerInfo.phone || (!customerInfo.city && shippingMethod !== 'pickup')) { 
            showAlert("Faltan Datos", "Por favor, complete todos los campos requeridos.", "error"); 
            return; 
        }

        const [hours] = customerInfo.time.split(':').map(Number);
        if (hours < 15 || hours >= 21) {
            showAlert("Horario Inválido", "Las entregas se realizan EXCLUSIVAMENTE entre las 15:00 y las 21:00 hs.", "error");
            return;
        }

        const dateObj = new Date(customerInfo.date + 'T00:00:00'); 
        const dayOfWeek = dateObj.getDay(); 
        if (dayOfWeek === 0) {
           showAlert("Día Inválido", "No realizamos entregas los domingos. Por favor seleccione de Lunes a Sábado.", "error");
           return;
        }
        
        setIsCheckingOut(true);
        const orderId = `ORD-${Date.now()}`;
        const totalCost = safeCart.reduce((acc, item) => acc + (calculateProductCostARS(item) * item.quantity), 0);
        
        const fullOrderData = {
             orderId,
             customerName: customerInfo.name,
             phone: customerInfo.phone,
             address: shippingMethod === 'pickup' ? 'Retiro en Belgrano' : customerInfo.address,
             city: shippingMethod === 'pickup' ? 'CABA' : customerInfo.city,
             deliveryDate: `${customerInfo.date} ${customerInfo.time}`,
             items: safeCart,
             total: finalTotal,
             totalCost: totalCost,
             paymentMethod,
             shippingMethod,
             shippingCost: shippingCost, 
             payShippingNow: payShippingNow
        };

        try {
            const scheduleResponse = await fetch('/api/schedule_delivery', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(fullOrderData) 
            });

            if (!scheduleResponse.ok) {
                // Try to parse error JSON, but be safe
                const errorData = await scheduleResponse.json().catch(() => ({}));
                throw new Error(errorData.error || "No se pudo conectar con el servidor de pedidos.");
            }

            if (paymentMethod === 'mercadopago') {
                const items = safeCart.map(item => ({ title: item.nombre, unit_price: calculateFinalPriceARS(item), quantity: item.quantity }));
                
                if (payShippingNow && shippingCost > 0) {
                     items.push({ title: "Envío Moto CABA (c/Recargo Lluvia si aplica)", unit_price: shippingCost, quantity: 1 });
                }

                const response = await fetch('/api/create_preference', { 
                    method: 'POST', 
                    headers: { 'Content-Type': 'application/json' }, 
                    body: JSON.stringify({ 
                        items, 
                        shippingCost: 0, 
                        external_reference: orderId 
                    }) 
                });
                
                if (!response.ok) {
                    throw new Error("Error al conectar con MercadoPago. Verifique sus credenciales.");
                }

                const data = await response.json();
                
                if (data.init_point) {
                    clearCart();
                    window.location.href = data.init_point;
                } else {
                    throw new Error("No se generó el link de pago correctamente.");
                }
            } else {
                const order: Order = { 
                    id: orderId, 
                    items: [...safeCart], 
                    total: finalTotal, 
                    cost: totalCost,
                    customerName: customerInfo.name, 
                    phone: customerInfo.phone,
                    address: shippingMethod === 'pickup' ? 'Retiro en Belgrano' : customerInfo.address, 
                    city: shippingMethod === 'pickup' ? 'CABA' : customerInfo.city,
                    deliveryDate: customerInfo.date, 
                    status: 'pending', 
                    timestamp: Date.now(), 
                    type: 'retail', 
                    paymentMethod: 'cash',
                    shippingMethod: shippingMethod
                };
                addOrder(order); 
                clearCart(); 
                setIsCartOpen(false);
                showAlert("¡Pedido Confirmado!", "Tu pedido ha sido registrado correctamente. Te contactaremos pronto.", "success");
            }
        } catch (error: any) { 
            console.error("Checkout Error:", error); 
            const msg = error.message || "Hubo un problema desconocido.";
            showAlert("Error en el Pedido", msg, "error"); 
        } finally { 
            setIsCheckingOut(false); 
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)} />
            <div className="relative w-full max-w-md bg-neutral-900 h-full shadow-2xl flex flex-col border-l border-gold-600/30 animate-slide-up">
                <div className="flex justify-between items-center p-6 border-b border-neutral-800 bg-black">
                    <h2 className="text-xl font-serif text-white flex items-center gap-2"><ShoppingBag className="text-gold-500" /> Tu Compra</h2>
                    <button onClick={() => setIsCartOpen(false)} className="text-gray-500 hover:text-white"><X size={24} /></button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    <div className="space-y-3">
                        {safeCart.length === 0 ? <p className="text-gray-500 text-center py-4">El carrito está vacío.</p> : safeCart.map(item => (
                            <div key={item.id} className="flex gap-3 items-center bg-black/40 p-3 rounded border border-neutral-800">
                                <img src={item.image} className="w-12 h-12 rounded object-cover border border-neutral-700"/>
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-white text-xs font-bold truncate">{item.nombre}</h4>
                                    <div className="text-gold-500 font-bold text-sm">{formatPrice(calculateFinalPriceARS(item)*item.quantity)}</div>
                                </div>
                                <QuantityControl compact product={item} quantityInCart={item.quantity} onAdd={()=>addToCart(item)} onRemove={()=>decreaseFromCart(item)}/>
                            </div>
                        ))}
                    </div>

                    {safeCart.length > 0 && (
                        <>
                            <div className="border-t border-neutral-800 pt-4">
                                <h3 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-3">Datos de Envío</h3>
                                <div className="space-y-3">
                                    <input placeholder="Nombre Completo" className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.name} onChange={e=>setCustomerInfo({...customerInfo,name:e.target.value})}/>
                                    <input placeholder="Teléfono / WhatsApp" className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.phone} onChange={e=>setCustomerInfo({...customerInfo,phone:e.target.value})}/>
                                    
                                    {shippingMethod !== 'pickup' && (
                                        <div className="flex gap-2">
                                            <input placeholder="Dirección y Altura" className="flex-[2] bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.address} onChange={e=>setCustomerInfo({...customerInfo,address:e.target.value})}/>
                                            <input placeholder="Localidad" className="flex-1 bg-black border border-neutral-700 p-3 rounded text-white text-sm outline-none focus:border-gold-600" value={customerInfo.city} onChange={e=>setCustomerInfo({...customerInfo,city:e.target.value})}/>
                                        </div>
                                    )}

                                    {/* SELECTOR MÉTODO ENVÍO */}
                                    <div className="grid grid-cols-3 gap-2">
                                        <button onClick={() => setShippingMethod('caba')} className={`p-2 rounded border text-[10px] md:text-xs font-bold uppercase flex flex-col items-center justify-center gap-1 ${shippingMethod === 'caba' ? 'bg-gold-600 text-black border-gold-600' : 'bg-transparent text-gray-400 border-neutral-700'}`}>
                                            <Truck size={14}/> Moto CABA
                                        </button>
                                        <button onClick={() => setShippingMethod('interior')} className={`p-2 rounded border text-[10px] md:text-xs font-bold uppercase flex flex-col items-center justify-center gap-1 ${shippingMethod === 'interior' ? 'bg-gold-600 text-black border-gold-600' : 'bg-transparent text-gray-400 border-neutral-700'}`}>
                                            <span className="text-xl">📦</span> Interior
                                        </button>
                                        <button onClick={() => setShippingMethod('pickup')} className={`p-2 rounded border text-[10px] md:text-xs font-bold uppercase flex flex-col items-center justify-center gap-1 ${shippingMethod === 'pickup' ? 'bg-gold-600 text-black border-gold-600' : 'bg-transparent text-gray-400 border-neutral-700'}`}>
                                            <MapPin size={14}/> Retiro
                                        </button>
                                    </div>

                                    {/* LÓGICA ESPECÍFICA POR MÉTODO */}
                                    {shippingMethod === 'caba' && (
                                        <div className="bg-neutral-800/50 p-3 rounded border border-neutral-700 space-y-2">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-300">Costo Base:</span>
                                                <span className="font-bold text-white">$7.500</span>
                                            </div>
                                            
                                            {checkingWeather ? (
                                                <div className="flex items-center gap-2 text-xs text-gold-500 animate-pulse">
                                                    <span>☁️ Chequeando clima (weather.com)...</span>
                                                </div>
                                            ) : (
                                                <label className="flex items-center gap-2 cursor-pointer group">
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isRaining ? 'bg-blue-500 border-blue-500' : 'border-neutral-500'}`}>
                                                        {isRaining && <CheckCircle size={12} className="text-white"/>}
                                                    </div>
                                                    <input type="checkbox" checked={isRaining} onChange={e => setIsRaining(e.target.checked)} className="hidden"/>
                                                    <span className={`text-sm ${isRaining ? 'text-blue-400 font-bold flex items-center gap-2' : 'text-gray-400 group-hover:text-white'}`}>
                                                        {isRaining ? <>🌧️ Lluvia detectada (+50%)</> : '☀️ Clima despejado (Sin recargo)'}
                                                    </span>
                                                </label>
                                            )}

                                            <div className="border-t border-neutral-700 pt-2 flex justify-between items-center text-sm">
                                                <span className="text-gold-500 font-bold">Total Envío:</span>
                                                <span className="text-gold-500 font-bold">{formatPrice(shippingCost)}</span>
                                            </div>
                                            <label className="flex items-center gap-2 cursor-pointer mt-2 bg-black/40 p-2 rounded border border-neutral-700">
                                                <input type="checkbox" checked={payShippingNow} onChange={e => setPayShippingNow(e.target.checked)} className="accent-green-500 w-4 h-4"/>
                                                <span className="text-xs text-white">Incluir envío en el pago ahora</span>
                                            </label>
                                        </div>
                                    )}

                                    {shippingMethod === 'interior' && (
                                        <div className="bg-blue-900/20 p-3 rounded border border-blue-800 text-xs text-blue-200">
                                            <p className="flex items-start gap-2 mb-2"><span className="text-lg">🚚</span> <strong>Via Cargo Online</strong></p>
                                            <div className="bg-black/40 p-2 rounded mb-2 border border-blue-900/50">
                                                <p className="text-gray-400 text-[10px] uppercase">Estimación de Bultos</p>
                                                <p className="font-bold">{totalItems} caja(s) aprox. (15x10x10 cm c/u)</p>
                                                <p className="text-gray-400 text-[10px]">Volumen Total: {totalVolumeCm3} cm³</p>
                                            </div>
                                            <p>El valor se calcula en base a estos bultos.</p>
                                            <p className="mt-1 font-bold text-gold-400">❗ SE ABONA EL ENVÍO EN DESTINO.</p>
                                        </div>
                                    )}

                                    {shippingMethod === 'pickup' && (
                                        <div className="bg-green-900/20 p-3 rounded border border-green-800 text-xs text-green-200">
                                            <p className="flex items-start gap-2"><MapPin className="flex-shrink-0 mt-0.5" size={14}/> <strong>Punto de Retiro:</strong></p>
                                            <p className="mt-1 ml-6">Olazábal y Av. del Libertador, Belgrano (CABA).</p>
                                            <p className="ml-6">Sin costo de envío.</p>
                                        </div>
                                    )}

                                    {/* FECHA Y HORA */}
                                    <div className="flex gap-2 bg-neutral-800/50 p-2 rounded border border-neutral-700">
                                        <div className="flex-1">
                                            <label className="text-[10px] text-gray-400 uppercase block mb-1">Fecha Entrega (Lun-Sab)</label>
                                            <input type="date" min={new Date().toISOString().split('T')[0]} className="w-full bg-transparent text-white text-sm outline-none" value={customerInfo.date} onChange={e=>setCustomerInfo({...customerInfo,date:e.target.value})}/>
                                        </div>
                                        <div className="flex-1 border-l border-neutral-700 pl-2">
                                            <label className="text-[10px] text-gray-400 uppercase block mb-1">Hora (15 a 21hs)</label>
                                            <input type="time" min="15:00" max="21:00" className="w-full bg-transparent text-white text-sm outline-none" value={customerInfo.time} onChange={e=>setCustomerInfo({...customerInfo,time:e.target.value})}/>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-neutral-800 pt-4">
                                <h3 className="text-gold-500 text-xs font-bold uppercase tracking-widest mb-3">Forma de Pago</h3>
                                <div className="space-y-2">
                                    <button onClick={() => setPaymentMethod('mercadopago')} className={`w-full flex items-center justify-between p-3 rounded border transition-colors ${paymentMethod === 'mercadopago' ? 'bg-blue-900/20 border-blue-500' : 'bg-transparent border-neutral-700 hover:bg-neutral-800'}`}>
                                        <div className="flex items-center gap-2">
                                            <CreditCard className={paymentMethod === 'mercadopago' ? 'text-blue-500' : 'text-gray-500'} size={18} />
                                            <span className={`text-sm font-bold ${paymentMethod === 'mercadopago' ? 'text-blue-400' : 'text-gray-400'}`}>Mercado Pago / Tarjetas</span>
                                        </div>
                                        {paymentMethod === 'mercadopago' && <CheckCircle size={16} className="text-blue-500"/>}
                                    </button>
                                    <button onClick={() => setPaymentMethod('cash')} className={`w-full flex items-center justify-between p-3 rounded border transition-colors ${paymentMethod === 'cash' ? 'bg-green-900/20 border-green-500' : 'bg-transparent border-neutral-700 hover:bg-neutral-800'}`}>
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl">💵</span>
                                            <span className={`text-sm font-bold ${paymentMethod === 'cash' ? 'text-green-400' : 'text-gray-400'}`}>Efectivo Contra Entrega</span>
                                        </div>
                                        {paymentMethod === 'cash' && <CheckCircle size={16} className="text-green-500"/>}
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {safeCart.length > 0 && (
                    <div className="p-6 bg-black border-t border-neutral-800">
                        <div className="flex flex-col gap-1 mb-4">
                            <div className="flex justify-between items-center text-sm text-gray-400">
                                <span>Subtotal Productos</span>
                                <span>{formatPrice(cartTotal)}</span>
                            </div>
                            {payShippingNow && shippingCost > 0 && (
                                <div className="flex justify-between items-center text-sm text-gold-500">
                                    <span>Envío (Agregado)</span>
                                    <span>+ {formatPrice(shippingCost)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-end mt-2 pt-2 border-t border-neutral-800">
                                <span className="text-white font-bold">Total Final</span>
                                <span className="text-2xl font-serif text-gold-500 font-bold">{formatPrice(finalTotal)}</span>
                            </div>
                        </div>
                        <button onClick={handleCheckout} disabled={isCheckingOut} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-4 rounded-lg uppercase tracking-widest transition-colors flex justify-center items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
                            {isCheckingOut ? <span className="animate-spin">⏳</span> : 'Confirmar Pedido'}
                        </button>
                        <p className="text-center text-[10px] text-gray-600 mt-2 flex justify-center items-center gap-1"><Lock size={10}/> Compra Segura</p>
                    </div>
                )}
            </div>
        </div>
    );
};

// ... AdminProductModal, AdminPanel, Catalog, App ...

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
                tags_olfativos: [], 
                margin_retail: 50, // Default 50
                margin_wholesale: 15, // Default 15
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
                margin_retail: Number(formData.margin_retail ?? 50),
                margin_wholesale: Number(formData.margin_wholesale ?? 15)
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
                             <input type="number" className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.margin_retail ?? 50} onChange={e => setFormData({...formData, margin_retail: Number(e.target.value)})} />
                        </div>
                        <div className="p-3 bg-neutral-800/30 rounded border border-neutral-800">
                             <label className="text-xs text-blue-500 uppercase font-bold">Margen Mayorista (%)</label>
                             <input type="number" className="w-full bg-black border border-neutral-700 rounded p-2 text-white" value={formData.margin_wholesale ?? 15} onChange={e => setFormData({...formData, margin_wholesale: Number(e.target.value)})} />
                        </div>
                        <div className="col-span-2">
                             <label className="text-xs text-gray-500 uppercase">Tags Olfativos</label>
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
                    <button onClick={handleSave} className="px-6 py-2 bg-gold-600 hover:bg-gold-500 text-black font-bold rounded flex items-center gap-2"><Save size={16}/> Guardar</button>
                </div>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
  const { 
    orders, currentUser, login, logout, formatPrice, products, updateProduct, addNewProduct, deleteProduct,
    bulkUpdateMargins, users, addUser, toggleUserStatus, deleteUser,
    showAlert, addOrder, dolarBlue, setDolarBlue, updateOrderStatus, calculateFinalPriceARS, calculateProductCostARS,
    syncStatus
  } = useStore();

  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState(false);
  const [activeTab, setActiveTab] = useState<'orders' | 'inventory' | 'users'>('orders');
  const [searchTerm, setSearchTerm] = useState('');
  const [globalRetail, setGlobalRetail] = useState(50);
  const [globalWholesale, setGlobalWholesale] = useState(15);
  const isApiConfigured = isApiKeyConfigured();

  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserPass, setNewUserPass] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('seller');

  const [showManualOrder, setShowManualOrder] = useState(false);
  const [manualCart, setManualCart] = useState<CartItem[]>([]);
  const [manualCustomerInfo, setManualCustomerInfo] = useState({ name: '', phone: '', address: '', city: '', date: new Date().toISOString().split('T')[0], time: '15:00' });
  const [manualPaymentMethod, setManualPaymentMethod] = useState<PaymentMethod>('cash');
  const [manualShippingMethod, setManualShippingMethod] = useState<ShippingMethod>('caba');
  const [manualSearch, setManualSearch] = useState('');

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);

  const filteredInventory = products.filter(p => !p.deleted && (p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || p.marca.toLowerCase().includes(searchTerm.toLowerCase())));

  const activeOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = activeOrders.reduce((acc, o) => acc + o.total, 0);
  const estimatedProfit = activeOrders.reduce((acc, o) => acc + (o.total - (o.cost || 0)), 0);

  const handleCreateUser = () => {
     if(!newUserEmail || !newUserPass || !newUserName) { showAlert("Error", "Complete todos los campos.", "error"); return; }
     if(users.some(u => u.email === newUserEmail)) { showAlert("Error", "El email ya está registrado.", "error"); return; }
     addUser({ email: newUserEmail, pass: newUserPass, name: newUserName, role: newUserRole, active: false });
     showAlert("Usuario Creado", `Se ha enviado un correo de confirmación a ${newUserEmail}.`, "success");
     setNewUserEmail(''); setNewUserPass(''); setNewUserName('');
  };

  const addToManualCart = (product: Product) => {
      setManualCart(prev => {
          const existing = prev.find(p => p.id === product.id);
          if (existing) return prev.map(p => p.id === product.id ? {...p, quantity: p.quantity + 1} : p);
          return [...prev, {...product, quantity: 1}];
      });
  };

  const removeFromManualCart = (id: string) => {
      setManualCart(prev => prev.filter(p => p.id !== id));
  };

  const handleManualOrder = async () => {
      if(!manualCustomerInfo.name || manualCart.length === 0) { showAlert("Error", "Ingrese nombre y productos.", "error"); return; }
      
      const [hours] = manualCustomerInfo.time.split(':').map(Number);
      if (hours < 15 || hours >= 21) {
          showAlert("Horario Inválido", "Las entregas se realizan EXCLUSIVAMENTE entre las 15:00 y las 21:00 hs.", "error");
          return;
      }

      const dateObj = new Date(manualCustomerInfo.date + 'T00:00:00'); 
      const dayOfWeek = dateObj.getDay(); 
      if (dayOfWeek === 0) {
         showAlert("Día Inválido", "No realizamos entregas los domingos. Por favor seleccione de Lunes a Sábado.", "error");
         return;
      }

      let shippingCost = 0;
      if (manualShippingMethod === 'caba') {
          shippingCost = 7500; 
      }

      const cartTotal = manualCart.reduce((acc, item) => acc + (calculateFinalPriceARS(item) * item.quantity), 0);
      const total = cartTotal + shippingCost;
      const cost = manualCart.reduce((acc, item) => acc + (calculateProductCostARS(item) * item.quantity), 0);
      const orderId = `MAN-${Date.now()}`;
      
      const newOrder: Order = { 
        id: orderId, 
        customerName: manualCustomerInfo.name,
        phone: manualCustomerInfo.phone,
        address: manualShippingMethod === 'pickup' ? 'Retiro en Belgrano' : manualCustomerInfo.address,
        city: manualShippingMethod === 'pickup' ? 'CABA' : manualCustomerInfo.city,
        total, 
        cost,
        items: manualCart, 
        deliveryDate: `${manualCustomerInfo.date} ${manualCustomerInfo.time}`, 
        status: 'delivered', 
        timestamp: Date.now(), 
        type: 'retail', 
        createdBy: currentUser?.email,
        paymentMethod: manualPaymentMethod,
        shippingMethod: manualShippingMethod,
        shippingCost: shippingCost,
        payShippingNow: true 
      };

      try {
          await fetch('/api/schedule_delivery', { 
             method: 'POST', 
             headers: { 'Content-Type': 'application/json' }, 
             body: JSON.stringify({
                 orderId,
                 customerName: manualCustomerInfo.name,
                 phone: manualCustomerInfo.phone,
                 address: manualShippingMethod === 'pickup' ? 'Retiro en Belgrano' : manualCustomerInfo.address,
                 city: manualShippingMethod === 'pickup' ? 'CABA' : manualCustomerInfo.city,
                 deliveryDate: `${manualCustomerInfo.date} ${manualCustomerInfo.time}`,
                 items: manualCart,
                 total,
                 totalCost: cost, 
                 paymentMethod: manualPaymentMethod,
                 shippingMethod: manualShippingMethod,
                 shippingCost,
                 payShippingNow: true
             }) 
          });

          addOrder(newOrder); 
          setShowManualOrder(false); 
          setManualCart([]);
          setManualCustomerInfo({ name: '', phone: '', address: '', city: '', date: new Date().toISOString().split('T')[0], time: '15:00' });
          showAlert("Venta Registrada", "La orden manual se ha guardado correctamente.", "success");
      } catch (e) {
          showAlert("Error", "No se pudo guardar la orden manual.", "error");
      }
  };

  if (!currentUser) {
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
    <div className="min-h-screen bg-neutral-900 text-gray-200 flex flex-col md:flex-row">
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-black border-t border-neutral-800 flex justify-around p-3 z-50">
          <button onClick={() => setActiveTab('orders')} className={`flex flex-col items-center gap-1 ${activeTab === 'orders' ? 'text-gold-500' : 'text-gray-500'}`}>
              <ClipboardList size={20}/>
              <span className="text-[10px] uppercase font-bold">Pedidos</span>
          </button>
          <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 ${activeTab === 'inventory' ? 'text-gold-500' : 'text-gray-500'}`}>
              <span className="text-xl">📦</span>
              <span className="text-[10px] uppercase font-bold">Stock</span>
          </button>
          {currentUser.role === 'admin' && (
              <button onClick={() => setActiveTab('users')} className={`flex flex-col items-center gap-1 ${activeTab === 'users' ? 'text-gold-500' : 'text-gray-500'}`}>
                  <Users size={20}/>
                  <span className="text-[10px] uppercase font-bold">Usuarios</span>
              </button>
          )}
          <button onClick={logout} className="flex flex-col items-center gap-1 text-red-500/70">
              <LogOut size={20}/>
              <span className="text-[10px] uppercase font-bold">Salir</span>
          </button>
      </nav>

      <aside className="w-64 bg-black border-r border-neutral-800 flex-shrink-0 hidden md:flex flex-col fixed h-full z-20">
        <div className="p-6 border-b border-neutral-800"><h1 className="text-xl font-serif text-gold-500 tracking-wider">MR. PERKINS</h1><span className="text-xs text-gray-500 uppercase tracking-widest flex items-center gap-1">{currentUser.role === 'admin' ? <Shield size={10} className="text-gold-500"/> : <UserIcon size={10}/>}{currentUser.role === 'admin' ? 'Administrador' : 'Vendedor'}</span></div>
        <nav className="flex-1 p-4 space-y-2">
          <button onClick={() => setActiveTab('orders')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'orders' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><ClipboardList size={20} /><span className="font-medium">Pedidos</span></button>
          <button onClick={() => setActiveTab('inventory')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'inventory' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><span className="text-xl">📦</span><span className="font-medium">Inventario</span></button>
          {currentUser.role === 'admin' && <button onClick={() => setActiveTab('users')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${activeTab === 'users' ? 'bg-gold-600/20 text-gold-400 border border-gold-600/30' : 'text-gray-400 hover:bg-neutral-900'}`}><Users size={20} /><span className="font-medium">Usuarios</span></button>}
        </nav>
        <div className="p-4 border-t border-neutral-800"><div className="mb-4 px-2"><p className="text-xs text-gray-500">Sesión iniciada como:</p><p className="text-sm font-bold text-white truncate flex items-center gap-2">{currentUser.name} {isApiConfigured && <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" title="Sistema IA Operativo"></span>}</p></div><button onClick={logout} className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors"><LogOut size={16} /> Cerrar Sesión</button></div>
      </aside>

      <main className="flex-1 p-4 md:p-8 ml-0 md:ml-64 pb-24 md:pb-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h2 className="text-xl md:text-2xl font-bold text-white mb-1">{activeTab === 'orders' && 'Gestión de Pedidos'}{activeTab === 'orders' && 'Gestión de Pedidos'}{activeTab === 'inventory' && 'Control de Stock'}{activeTab === 'users' && 'Administración de Usuarios'}</h2>
            <div className="flex items-center gap-2 mt-1">
                <span className={`w-2 h-2 rounded-full ${syncStatus === 'synced' ? 'bg-green-500' : syncStatus === 'syncing' ? 'bg-yellow-500 animate-pulse' : 'bg-red-500'}`}></span>
                <span className="text-[10px] text-gray-500 uppercase">{syncStatus === 'synced' ? 'Sincronizado' : syncStatus === 'syncing' ? 'Guardando...' : 'Error de Conexión'}</span>
            </div>
          </div>
          {activeTab === 'inventory' && currentUser.role === 'admin' && (
             <div className="bg-black border border-gold-600/30 px-4 py-2 rounded-lg flex items-center gap-3 shadow-[0_0_15px_rgba(212,175,55,0.1)] w-full md:w-auto justify-between">
                <span className="text-gold-500 text-xs font-bold uppercase tracking-widest">Dolar Blue</span>
                <div className="flex items-center gap-1 text-white font-serif text-lg"><span>$</span><input type="number" value={dolarBlue} onChange={(e) => setDolarBlue(Number(e.target.value))} className="bg-transparent w-16 text-right outline-none border-b border-neutral-700 focus:border-gold-500 transition-colors"/></div>
             </div>
          )}
        </header>

        {activeTab === 'orders' && (
            <div className="space-y-6">
                 <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-4">
                     <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 w-full md:w-auto md:flex-1 md:mr-4">
                        <div className="bg-black border border-neutral-800 p-3 md:p-4 rounded-lg">
                            <h3 className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider mb-2">Total Pedidos</h3>
                            <span className="text-xl md:text-2xl font-serif text-white">{orders.length}</span>
                        </div>
                        <div className="bg-black border border-neutral-800 p-3 md:p-4 rounded-lg">
                            <h3 className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider mb-2">Pendientes</h3>
                            <span className="text-xl md:text-2xl font-serif text-gold-500">{orders.filter(o => o.status === 'pending').length}</span>
                        </div>
                        <div className="bg-black border border-neutral-800 p-3 md:p-4 rounded-lg">
                            <h3 className="text-gray-500 text-[10px] md:text-xs uppercase tracking-wider mb-2">Facturación</h3>
                            <span className="text-lg md:text-xl font-serif text-white">{formatPrice(totalRevenue)}</span>
                        </div>
                        {currentUser.role === 'admin' && (
                            <div className="bg-black border border-green-900/30 p-3 md:p-4 rounded-lg relative overflow-hidden group">
                                <h3 className="text-green-600 text-[10px] md:text-xs uppercase tracking-wider mb-2 font-bold">Ganancia Est.</h3>
                                <span className="text-lg md:text-xl font-serif text-green-500">{formatPrice(estimatedProfit)}</span>
                                <span className="absolute top-2 right-2 text-green-500 text-xl">📈</span>
                            </div>
                        )}
                     </div>
                     <button onClick={() => setShowManualOrder(!showManualOrder)} className="w-full md:w-auto bg-gold-600 text-black font-bold py-3 px-6 rounded-lg hover:bg-gold-500 flex items-center justify-center gap-2"><span className="text-xl font-bold">+</span> Nueva Venta</button>
                 </div>
                 
                 {showManualOrder && (
                     <div className="bg-neutral-800/50 p-6 rounded-lg border border-gold-600/30 mb-6 animate-fade-in">
                         <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><CreditCard className="text-gold-500" /> Punto de Venta Manual</h3>
                         
                         <div className="mb-6 bg-black p-4 rounded border border-neutral-700">
                             <div className="flex gap-2 mb-2">
                                <Search className="text-gray-500" />
                                <input className="bg-transparent text-white outline-none w-full" placeholder="Buscar producto para agregar..." value={manualSearch} onChange={e=>setManualSearch(e.target.value)} />
                             </div>
                             {manualSearch && (
                                 <div className="max-h-40 overflow-y-auto mt-2 border-t border-neutral-800 pt-2">
                                     {products.filter(p=>p.nombre.toLowerCase().includes(manualSearch.toLowerCase()) || p.marca.toLowerCase().includes(manualSearch.toLowerCase())).map(p => (
                                         <div key={p.id} className="flex justify-between items-center p-2 hover:bg-neutral-800 cursor-pointer text-sm text-gray-300" onClick={() => { addToManualCart(p); setManualSearch(''); }}>
                                             <span>{p.nombre}</span>
                                             <span className="text-gold-500">{formatPrice(calculateFinalPriceARS(p))}</span>
                                         </div>
                                     ))}
                                 </div>
                             )}
                         </div>

                         <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                             <div className="space-y-3">
                                 <h4 className="text-xs uppercase text-gold-500 font-bold tracking-widest mb-2">Datos del Cliente y Entrega</h4>
                                 <input type="text" placeholder="Nombre Cliente" value={manualCustomerInfo.name} onChange={e => setManualCustomerInfo({...manualCustomerInfo, name: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 rounded text-white text-sm" />
                                 <input type="text" placeholder="Teléfono" value={manualCustomerInfo.phone} onChange={e => setManualCustomerInfo({...manualCustomerInfo, phone: e.target.value})} className="w-full bg-black border border-neutral-700 p-2 rounded text-white text-sm" />
                                 
                                 <div className="flex gap-2">
                                    <input type="text" placeholder="Dirección" value={manualCustomerInfo.address} onChange={e => setManualCustomerInfo({...manualCustomerInfo, address: e.target.value})} className="flex-[2] bg-black border border-neutral-700 p-2 rounded text-white text-sm" />
                                    <input type="text" placeholder="Ciudad" value={manualCustomerInfo.city} onChange={e => setManualCustomerInfo({...manualCustomerInfo, city: e.target.value})} className="flex-1 bg-black border border-neutral-700 p-2 rounded text-white text-sm" />
                                 </div>

                                 <div className="flex gap-2 bg-neutral-900/50 p-2 rounded border border-neutral-700">
                                     <div className="flex-1">
                                         <label className="text-[10px] text-gray-400 uppercase block mb-1">Fecha (Lun-Sab)</label>
                                         <input type="date" min={new Date().toISOString().split('T')[0]} value={manualCustomerInfo.date} onChange={e => setManualCustomerInfo({...manualCustomerInfo, date: e.target.value})} className="w-full bg-black text-white text-sm p-1 rounded outline-none border border-neutral-700 focus:border-gold-600"/>
                                     </div>
                                     <div className="flex-1 border-l border-neutral-700 pl-2">
                                         <label className="text-[10px] text-gray-400 uppercase block mb-1">Hora (15-21hs)</label>
                                         <input type="time" min="15:00" max="21:00" value={manualCustomerInfo.time} onChange={e => setManualCustomerInfo({...manualCustomerInfo, time: e.target.value})} className="w-full bg-black text-white text-sm p-1 rounded outline-none border border-neutral-700 focus:border-gold-600"/>
                                     </div>
                                 </div>

                                 <div className="flex gap-2">
                                     <select value={manualPaymentMethod} onChange={e=>setManualPaymentMethod(e.target.value as PaymentMethod)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white text-sm"><option value="cash">Efectivo</option><option value="mercadopago">MercadoPago</option></select>
                                     <select value={manualShippingMethod} onChange={e=>setManualShippingMethod(e.target.value as ShippingMethod)} className="w-full bg-black border border-neutral-700 p-2 rounded text-white text-sm"><option value="caba">Moto CABA</option><option value="interior">Envío Interior</option><option value="pickup">Retiro en Local</option></select>
                                 </div>
                             </div>

                             <div className="bg-black/40 border border-neutral-800 p-4 rounded flex flex-col h-full">
                                 <h4 className="text-xs uppercase text-gold-500 font-bold tracking-widest mb-2">Resumen Orden</h4>
                                 <div className="flex-1 overflow-y-auto mb-4 space-y-2 max-h-40">
                                     {manualCart.length === 0 ? <p className="text-gray-600 text-xs italic">Agregue productos...</p> : manualCart.map(item => (
                                         <div key={item.id} className="flex justify-between items-center text-sm text-gray-300 border-b border-neutral-800 pb-1">
                                             <span>{item.quantity}x {item.nombre}</span>
                                             <div className="flex items-center gap-2">
                                                 <span>{formatPrice(calculateFinalPriceARS(item) * item.quantity)}</span>
                                                 <button onClick={() => removeFromManualCart(item.id)} className="text-red-500"><Trash2 size={12}/></button>
                                             </div>
                                         </div>
                                     ))}
                                 </div>
                                 <div className="space-y-1 pt-2 border-t border-neutral-700">
                                     {manualShippingMethod === 'caba' && (
                                         <div className="flex justify-between items-center text-xs text-gray-400">
                                             <span>Envío (CABA Base):</span>
                                             <span>$7.500</span>
                                         </div>
                                     )}
                                     <div className="flex justify-between items-center text-white font-bold text-lg">
                                         <span>Total:</span>
                                         <span>{formatPrice(manualCart.reduce((acc, i) => acc + (calculateFinalPriceARS(i) * i.quantity), 0) + (manualShippingMethod === 'caba' ? 7500 : 0))}</span>
                                     </div>
                                 </div>
                                 <button onClick={handleManualOrder} className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 rounded mt-3">Confirmar Venta</button>
                             </div>
                         </div>
                     </div>
                 )}

                 <div className="bg-black border border-neutral-800 rounded-lg overflow-hidden">
                    {orders.length === 0 ? <div className="p-12 text-center text-gray-500"><ClipboardList size={48} className="mx-auto mb-4 opacity-20" /><p>No hay pedidos registrados.</p></div> : (
                      <div className="divide-y divide-neutral-800">{orders.map(order => (
                          <div key={order.id} className={`p-4 md:p-6 transition-colors ${order.status === 'cancelled' ? 'bg-red-900/10 opacity-60 grayscale-[0.5]' : 'hover:bg-neutral-900/50'}`}>
                            <div className="flex flex-col md:flex-row justify-between mb-2 gap-4">
                               <div className="flex-1">
                                   <div className="flex items-center gap-3 mb-2">
                                       <span className={`text-sm font-bold px-2 rounded ${order.status === 'cancelled' ? 'bg-red-900/30 text-red-500 line-through' : 'bg-gold-900/20 text-gold-500'}`}>{order.id}</span>
                                       <select 
                                            value={order.status} 
                                            onChange={(e) => updateOrderStatus(order.id, e.target.value as any)}
                                            className={`text-[10px] px-2 py-0.5 rounded border uppercase font-bold outline-none cursor-pointer ${
                                                order.status === 'pending' ? 'bg-yellow-900/30 text-yellow-500 border-yellow-900' :
                                                order.status === 'shipped' ? 'bg-blue-900/30 text-blue-500 border-blue-900' :
                                                order.status === 'cancelled' ? 'bg-red-900/30 text-red-500 border-red-900' :
                                                'bg-green-900/30 text-green-500 border-green-900'
                                            }`}
                                       >
                                           <option value="pending">Pendiente</option>
                                           <option value="shipped">Enviado</option>
                                           <option value="delivered">Entregado / Cobrado</option>
                                           <option value="cancelled">Cancelado</option>
                                       </select>
                                   </div>
                                   
                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-400">
                                       <div>
                                            <h4 className="text-white font-bold mb-1 flex items-center gap-2"><UserIcon size={12}/> {order.customerName}</h4>
                                            <p className="flex items-center gap-2"><Phone size={12}/> {order.phone || 'Sin teléfono'}</p>
                                            <p className="flex items-center gap-2"><MapPin size={12}/> {order.address}, {order.city}</p>
                                       </div>
                                       <div>
                                            <div className="flex gap-2 mb-1">
                                                {order.paymentMethod === 'mercadopago' ? 
                                                    <span className="text-[10px] flex items-center gap-1 text-blue-400 border border-blue-900 px-1 rounded bg-blue-900/20"><CreditCard size={10}/> MP</span> : 
                                                    <span className="text-[10px] flex items-center gap-1 text-green-400 border border-green-900 px-1 rounded bg-green-900/20"><span className="text-xs">💵</span> Efectivo</span>
                                                }
                                                {order.shippingMethod === 'caba' ? 
                                                    <span className="text-[10px] flex items-center gap-1 text-purple-400 border border-purple-900 px-1 rounded bg-purple-900/20"><Truck size={10}/> Moto</span> : 
                                                order.shippingMethod === 'pickup' ?
                                                    <span className="text-[10px] flex items-center gap-1 text-emerald-400 border border-emerald-900 px-1 rounded bg-emerald-900/20"><MapPin size={10}/> Retiro</span> :
                                                    <span className="text-[10px] flex items-center gap-1 text-orange-400 border border-orange-900 px-1 rounded bg-orange-900/20"><span className="text-[8px]">📦</span> Interior</span>
                                                }
                                            </div>
                                            <p className="flex items-center gap-2"><span className="text-xs">🕒</span> Entrega: {order.deliveryDate}</p>
                                       </div>
                                   </div>
                               </div>
                               <div className="flex flex-col justify-between items-end min-w-[120px]">
                                   <div className={`font-bold text-2xl ${order.status === 'cancelled' ? 'text-gray-600 line-through' : 'text-gold-500'}`}>{formatPrice(order.total)}</div>
                                   {currentUser.role === 'admin' && order.status !== 'cancelled' && (
                                       <div className="text-right">
                                            <div className="text-[10px] text-gray-600">Costo: {formatPrice(order.cost || 0)}</div>
                                            <div className="text-[10px] text-green-600 font-bold">Ganancia: {formatPrice(order.total - (order.cost || 0))}</div>
                                       </div>
                                   )}
                               </div>
                            </div>
                            
                            {order.items.length > 0 && order.status !== 'cancelled' && (
                                <div className="mt-4 bg-black/40 rounded border border-neutral-800 overflow-hidden">
                                    <table className="w-full text-left text-xs text-gray-400">
                                        <thead className="bg-neutral-800 text-gray-500">
                                            <tr><th className="p-2">Producto</th><th className="p-2 text-center">Cant</th><th className="p-2 text-right">Subtotal</th></tr>
                                        </thead>
                                        <tbody>
                                            {order.items.map((item, idx) => {
                                                const unitPrice = item.precio_usd * dolarBlue * (1 + (item.margin_retail||0)/100);
                                                return (
                                                    <tr key={idx} className="border-b border-neutral-800/50 last:border-0">
                                                        <td className="p-2 text-white">{item.nombre}</td>
                                                        <td className="p-2 text-center">{item.quantity}</td>
                                                        <td className="p-2 text-right text-gold-500">{formatPrice(unitPrice * item.quantity)}</td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
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
            <div className="flex justify-between items-center bg-black p-4 rounded border border-neutral-800">
               <div className="flex gap-4">
                  <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">Margen Retail Global</span>
                      <div className="flex items-center gap-1">
                          <input type="number" value={globalRetail} onChange={(e)=>setGlobalRetail(Number(e.target.value))} className="w-12 bg-transparent text-white border-b border-neutral-700 outline-none"/>
                          <button onClick={()=>bulkUpdateMargins('retail', globalRetail)} className="text-gold-500 hover:text-white"><Save size={14}/></button>
                      </div>
                  </div>
                  <div className="flex flex-col">
                      <span className="text-[10px] text-gray-500 uppercase">Margen Mayorista Global</span>
                      <div className="flex items-center gap-1">
                          <input type="number" value={globalWholesale} onChange={(e)=>setGlobalWholesale(Number(e.target.value))} className="w-12 bg-transparent text-white border-b border-neutral-700 outline-none"/>
                          <button onClick={()=>bulkUpdateMargins('wholesale', globalWholesale)} className="text-gold-500 hover:text-white"><Save size={14}/></button>
                      </div>
                  </div>
               </div>
               <div className="flex gap-2">
                   <div className="relative">
                       <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                       <input className="bg-neutral-900 border border-neutral-700 rounded-full pl-10 pr-4 py-2 text-sm text-white w-64 outline-none focus:border-gold-500" placeholder="Buscar producto..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}/>
                   </div>
                   <button onClick={() => { setEditingProduct(null); setIsCreatingProduct(true); }} className="bg-gold-600 text-black px-4 py-2 rounded font-bold hover:bg-gold-500 flex items-center gap-2"><span className="text-xl font-bold">+</span> Nuevo</button>
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredInventory.map(product => (
                    <div key={product.id} className="bg-black border border-neutral-800 rounded p-4 relative group hover:border-gold-600/50 transition-colors">
                        <div className="flex gap-4 mb-3">
                            <img src={product.image} className="w-16 h-16 rounded object-cover"/>
                            <div className="flex-1 min-w-0">
                                <div className="text-[10px] text-gray-500 uppercase truncate">{product.marca}</div>
                                <div className="text-white font-bold text-sm truncate mb-1" title={product.nombre}>{product.nombre}</div>
                                <div className="text-xs text-gray-400">Stock: <span className={product.stock < 5 ? 'text-red-500 font-bold' : 'text-green-500'}>{product.stock}</span></div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500 bg-neutral-900/50 p-2 rounded mb-3">
                            <div>Costo: <span className="text-white">${Math.ceil(product.precio_usd * dolarBlue)}</span></div>
                            <div>USD: <span className="text-white">${product.precio_usd}</span></div>
                            <div>Retail: <span className="text-gold-500">${calculateFinalPriceARS({...product, margin_retail: product.margin_retail ?? 50})}</span></div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => { setEditingProduct(product); setIsCreatingProduct(false); }} className="flex-1 bg-neutral-800 hover:bg-neutral-700 text-white py-1 rounded text-xs flex items-center justify-center gap-1"><Edit3 size={12}/> Editar</button>
                            <button onClick={() => { if(confirm('¿Eliminar producto?')) deleteProduct(product.id); }} className="px-2 bg-red-900/20 hover:bg-red-900/40 text-red-500 rounded flex items-center justify-center"><Trash2 size={14}/></button>
                        </div>
                    </div>
                ))}
            </div>
          </div>
        )}

        {activeTab === 'users' && currentUser.role === 'admin' && (
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-black border border-neutral-800 rounded p-6">
                    <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2"><UserPlus className="text-gold-500"/> Agregar Usuario</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <input placeholder="Nombre" className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white" value={newUserName} onChange={e=>setNewUserName(e.target.value)}/>
                        <input placeholder="Email" className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white" value={newUserEmail} onChange={e=>setNewUserEmail(e.target.value)}/>
                        <input placeholder="Contraseña" type="password" className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white" value={newUserPass} onChange={e=>setNewUserPass(e.target.value)}/>
                        <select className="bg-neutral-900 border border-neutral-700 p-2 rounded text-white" value={newUserRole} onChange={e=>setNewUserRole(e.target.value as UserRole)}>
                            <option value="seller">Vendedor</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>
                    <button onClick={handleCreateUser} className="bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 px-6 rounded">Crear Usuario</button>
                </div>

                <div className="bg-black border border-neutral-800 rounded overflow-hidden">
                    <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-neutral-800 text-gray-500 uppercase text-xs">
                            <tr><th className="p-4">Usuario</th><th className="p-4">Rol</th><th className="p-4">Estado</th><th className="p-4 text-right">Acciones</th></tr>
                        </thead>
                        <tbody className="divide-y divide-neutral-800">
                            {users.map(u => (
                                <tr key={u.email} className="hover:bg-neutral-900/50">
                                    <td className="p-4"><div className="text-white font-bold">{u.name}</div><div className="text-xs">{u.email}</div></td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.role === 'admin' ? 'bg-purple-900/30 text-purple-400' : 'bg-blue-900/30 text-blue-400'}`}>{u.role}</span></td>
                                    <td className="p-4"><span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${u.active ? 'bg-green-900/30 text-green-400' : 'bg-red-900/30 text-red-400'}`}>{u.active ? 'Activo' : 'Inactivo'}</span></td>
                                    <td className="p-4 text-right space-x-2">
                                        <button onClick={()=>toggleUserStatus(u.email)} className="text-gray-400 hover:text-white" title={u.active ? 'Desactivar' : 'Activar'}>{u.active ? <UserIcon size={16}/> : <CheckCircle size={16}/>}</button>
                                        <button onClick={()=>deleteUser(u.email)} className="text-red-500 hover:text-red-400" title="Eliminar"><Trash2 size={16}/></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        )}
      </main>
      
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
  );
};

const Catalog: React.FC = () => {
  const { 
      products, viewMode, filterBrand, filterGender, sortPrice, 
      pricingMode, isCartOpen, setIsCartOpen, currentUser, logout, isAdmin
  } = useStore();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showChat, setShowChat] = useState(false);

  // Filtering
  const filteredProducts = products.filter(p => {
      const matchBrand = filterBrand === 'Fabricante' || p.marca === filterBrand;
      const matchGender = filterGender === 'Para Todos' || p.genero === filterGender;
      return matchBrand && matchGender && !p.deleted;
  }).sort((a, b) => {
      if (sortPrice === 'none') return 0;
      return sortPrice === 'asc' ? a.precio_usd - b.precio_usd : b.precio_usd - a.precio_usd;
  });

  return (
      <div className="min-h-screen bg-neutral-900 pb-20">
          <Header />
          <CartDrawer />
          {selectedProduct && <ProductModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />}
          {showChat && <PerkinsChatModal onClose={() => setShowChat(false)} />}
          
          <main>
              <VideoHero />
              
              <div className="container mx-auto px-4 mt-8 relative z-20">
                  <div className="flex justify-between items-center mb-6">
                      <h2 className="text-2xl font-serif text-white"><span className="text-gold-500">Catálogo</span> {new Date().getFullYear()}</h2>
                      {currentUser && (
                          <div className="flex gap-2">
                               {isAdmin && <button onClick={() => window.location.href='/admin'} className="text-xs bg-neutral-800 text-gold-500 px-3 py-1 rounded border border-gold-600/30">Admin</button>}
                               <button onClick={logout} className="text-xs bg-neutral-800 text-gray-400 px-3 py-1 rounded">Salir</button>
                          </div>
                      )}
                  </div>

                  {filteredProducts.length === 0 ? (
                      <div className="text-center py-20 text-gray-500">
                          <p>No se encontraron fragancias con esos filtros.</p>
                          <button onClick={() => window.location.reload()} className="mt-4 text-gold-500 underline">Ver todo</button>
                      </div>
                  ) : (
                      <div className={`grid gap-4 md:gap-8 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
                          {filteredProducts.map(product => (
                              viewMode === 'grid' ? 
                              <ProductGridItem key={product.id} product={product} onClick={() => setSelectedProduct(product)} /> :
                              <ProductListItem key={product.id} product={product} onClick={() => setSelectedProduct(product)} />
                          ))}
                      </div>
                  )}
              </div>
          </main>

          <FloatingPricingBar />
          
          {/* PERKINS FAB */}
          <button onClick={() => setShowChat(true)} className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-black border-2 border-gold-500 shadow-[0_0_20px_rgba(212,175,55,0.4)] flex items-center justify-center hover:scale-110 transition-transform cursor-pointer overflow-hidden group">
               <img src={PERKINS_IMAGES.LOGO} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
          </button>
      </div>
  );
};

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <Routes>
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/" element={<Catalog />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;