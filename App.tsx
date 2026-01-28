import React, { useState, useEffect, createContext, useContext, useRef, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { ShoppingBag, X, Truck, User as UserIcon, Send, CreditCard, ImageOff, AlertTriangle, CheckCircle, MapPin, Loader2, ClipboardList, LogOut, Lock, Search, Edit3, Users, UserPlus, Shield, LayoutGrid, List, Trash2, Save, Phone, MessageCircle, ChevronUp, ChevronDown, Package } from 'lucide-react';
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
  children?: React.ReactNode;
}
interface ErrorBoundaryState {
  hasError: boolean;
}
class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(error: any): ErrorBoundaryState {
    return { hasError: true };
  }
  componentDidCatch(error: any, errorInfo: any) {
    console.error("UI Crash:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-6 text-center">
          <AlertTriangle size={64} className="text-gold-500 mb-6" />
          <h1 className="text-3xl font-serif text-white mb-2">Interrupción del Sistema</h1>
          <p className="text-gray-400 mb-8 max-w-md">Nuestros servidores están experimentando una alta demanda. Por favor, recargue la página.</p>
          <button onClick={() => window.location.reload()} className="bg-gold-600 hover:bg-gold-500 text-black px-8 py-3 rounded-full font-bold uppercase tracking-widest transition-all">Reiniciar Sistema</button>
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
  cart: CartItem[];
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  decreaseFromCart: (product: Product) => void;
  clearCart: () => void;
  
  // Orders
  orders: Order[];
  addOrder: (order: Order) => void;
  updateOrderStatus: (orderId: string, status: string) => void;
  refreshOrders: () => Promise<void>;
  
  // Auth
  currentUser: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  users: User[];
  
  // Pricing & Display
  dolarBlue: number;
  setDolarBlue: (val: number) => void;
  formatPrice: (val: number) => string;
  calculateFinalPriceARS: (p: Product) => number;
  calculateProductCostARS: (p: Product) => number;
  pricingMode: 'retail' | 'wholesale';
  setPricingMode: (m: 'retail' | 'wholesale') => void;
  
  // Admin Product Management
  updateProduct: (id: string, updates: Partial<Product>) => void;
  addNewProduct: (p: Product) => void;
  deleteProduct: (id: string) => void;
  bulkUpdateMargins: (type: 'retail'|'wholesale', val: number) => void;

  // Filters
  viewMode: 'grid' | 'list';
  setViewMode: (v: 'grid'|'list') => void;
  filterBrand: string;
  setFilterBrand: (v: string) => void;
  filterGender: string;
  setFilterGender: (v: string) => void;
  availableBrands: string[];
  availableGenders: string[];

  // Utils
  showAlert: (title: string, msg: string, type?: 'success'|'error'|'info') => void;
  closeAlert: () => void;
  syncStatus: 'synced' | 'syncing' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(PRODUCTS);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  
  const [pricingMode, setPricingMode] = useState<'retail' | 'wholesale'>('retail');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [filterBrand, setFilterBrand] = useState('Fabricante');
  const [filterGender, setFilterGender] = useState('Para Todos');
  const [alertData, setAlertData] = useState<AlertData>({ isOpen: false, title: '', message: '', type: 'info' });
  const [syncStatus, setSyncStatus] = useState<'synced'|'syncing'|'error'>('synced');
  
  const [dolarBlue, setDolarBlueState] = useState(() => {
      const stored = localStorage.getItem('dolarBlue');
      const val = stored ? Number(stored) : 1230;
      return isNaN(val) ? 1230 : val;
  });

  const lastUpdateRef = useRef<number>(0);

  // --- SYNC ENGINE (PRODUCTS) ---
  useEffect(() => {
      const fetchProducts = async () => {
          if (Date.now() - lastUpdateRef.current < 5000) return;
          try {
              const res = await fetch(`/api/products?t=${Date.now()}`);
              if (res.ok) {
                  const overrides = await res.json();
                  const productMap = new Map<string, Product>();
                  PRODUCTS.forEach(p => productMap.set(p.id, { ...p }));
                  
                  Object.entries(overrides).forEach(([id, data]: [string, any]) => {
                      if (data.deleted) productMap.delete(id);
                      else {
                          const existing = productMap.get(id);
                          const merged = existing ? { ...existing, ...data } : { 
                              id, nombre: 'Nuevo', marca: 'Genérico', precio_usd: 0, stock: 0, 
                              tags_olfativos: [], presentacion_ml: 100, genero: 'Unisex', 
                              image: PERKINS_IMAGES.LOGO, ...data 
                          };
                          productMap.set(id, {
                              ...merged,
                              stock: Number(merged.stock) || 0,
                              precio_usd: Number(merged.precio_usd) || 0
                          });
                      }
                  });
                  setProducts(Array.from(productMap.values()));
                  setSyncStatus('synced');
              }
          } catch (e) {
              console.warn("Sync error:", e);
              setSyncStatus('error');
          }
      };
      fetchProducts();
      const interval = setInterval(fetchProducts, 10000);
      return () => clearInterval(interval);
  }, []);

  // --- ORDERS MANAGEMENT ---
  const refreshOrders = async () => {
      if (currentUser?.role !== 'admin') return;
      try {
          const res = await fetch('/api/get_orders');
          if (res.ok) {
              const data = await res.json();
              setOrders(data);
          }
      } catch (e) { console.error("Error fetching orders", e); }
  };

  useEffect(() => {
      if (currentUser?.role === 'admin') refreshOrders();
  }, [currentUser]);

  // --- CART LOGIC ---
  const addToCart = (product: Product) => {
      const stock = Number(product.stock) || 0;
      if (stock <= 0) {
          showAlert("Sin Stock", `Lo sentimos, ${product.nombre} está agotado.`, "error");
          return;
      }
      setCart(prev => {
          const exists = prev.find(i => i.id === product.id);
          const currentQty = exists ? exists.quantity : 0;
          if (currentQty + 1 > stock) {
              showAlert("Stock Máximo", "No hay más unidades disponibles.", "info");
              return prev;
          }
          if (exists) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
          return [...prev, { ...product, quantity: 1 }];
      });
      if (cart.length === 0) setIsCartOpen(true);
  };

  const decreaseFromCart = (product: Product) => {
      setCart(prev => {
          const exists = prev.find(i => i.id === product.id);
          if (!exists) return prev;
          if (exists.quantity > 1) return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity - 1 } : i);
          return prev.filter(i => i.id !== product.id);
      });
  };

  const removeFromCart = (id: string) => setCart(prev => prev.filter(i => i.id !== id));
  const clearCart = () => setCart([]);

  // --- PRICING ---
  const calculateFinalPriceARS = (p: Product) => {
      const margin = pricingMode === 'wholesale' ? (p.margin_wholesale ?? 15) : (p.margin_retail ?? 50);
      const base = (Number(p.precio_usd) || 0) * dolarBlue;
      return Math.ceil(base * (1 + margin / 100));
  };
  
  const calculateProductCostARS = (p: Product) => Math.ceil((Number(p.precio_usd) || 0) * dolarBlue);
  
  const formatPrice = (val: number) => {
      if (isNaN(val)) return "$ -";
      return new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(val);
  };

  // --- ACTIONS ---
  const updateProduct = async (id: string, updates: Partial<Product>) => {
      setProducts(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
      try {
          await fetch('/api/products', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ id, updates })
          });
      } catch (e) { console.error(e); showAlert("Error", "No se guardó el cambio.", "error"); }
  };

  const addNewProduct = async (p: Product) => {
      setProducts(prev => [...prev, p]);
      updateProduct(p.id, p);
  };

  const deleteProduct = (id: string) => {
      setProducts(prev => prev.filter(p => p.id !== id));
      updateProduct(id, { deleted: true });
  };

  const bulkUpdateMargins = async (type: 'retail' | 'wholesale', value: number) => {
      const key = type === 'retail' ? 'margin_retail' : 'margin_wholesale';
      const updatesArray = products.map(p => ({ id: p.id, updates: { [key]: value } }));
      setProducts(prev => prev.map(p => ({ ...p, [key]: value })));
      try {
          await fetch('/api/bulk-update', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ updatesArray })
          });
          showAlert("Éxito", "Márgenes actualizados masivamente.", "success");
      } catch (e) { showAlert("Error", "Falló actualización masiva.", "error"); }
  };

  const addOrder = (order: Order) => setOrders(prev => [order, ...prev]);
  
  const updateOrderStatus = async (orderId: string, status: string) => {
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
      const order = orders.find(o => o.id === orderId);
      if (order?.googleEventId) {
          fetch('/api/update_order_status', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ googleEventId: order.googleEventId, status })
          }).catch(console.error);
      }
  };

  const showAlert = (title: string, message: string, type: 'success'|'error'|'info'='info') => setAlertData({ isOpen: true, title, message, type });
  const closeAlert = () => setAlertData(prev => ({ ...prev, isOpen: false }));
  
  const availableBrands = useMemo(() => ['Fabricante', ...Array.from(new Set(products.map(p => p.marca)))], [products]);
  const availableGenders = useMemo(() => ['Para Todos', ...Array.from(new Set(products.map(p => p.genero)))], [products]);

  const login = (e: string, p: string) => {
      const user = users.find(u => u.email.toLowerCase() === e.toLowerCase() && u.pass === p);
      if (user) {
          if (!user.active) { showAlert("Cuenta Inactiva", "Contacte al admin.", "error"); return false; }
          setCurrentUser(user);
          return true;
      }
      return false;
  };

  const logout = () => setCurrentUser(null);
  const setDolarBlue = (v: number) => { if (v > 0) { setDolarBlueState(v); localStorage.setItem('dolarBlue', String(v)); } };

  return (
      <AppContext.Provider value={{
          products, cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, decreaseFromCart, clearCart,
          orders, addOrder, updateOrderStatus, refreshOrders,
          currentUser, login, logout, isAdmin: currentUser?.role === 'admin', users,
          dolarBlue, setDolarBlue, formatPrice, calculateFinalPriceARS, calculateProductCostARS, pricingMode, setPricingMode,
          updateProduct, addNewProduct, deleteProduct, bulkUpdateMargins,
          viewMode, setViewMode, filterBrand, setFilterBrand, filterGender, setFilterGender, availableBrands, availableGenders,
          showAlert, closeAlert, syncStatus
      }}>
          {children}
          {alertData.isOpen && (
              <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 animate-fade-in">
                  <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeAlert} />
                  <div className="relative bg-neutral-900 border border-gold-600/50 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center">
                      <div className="w-16 h-16 mx-auto mb-4 rounded-full overflow-hidden border-2 border-gold-500 bg-black">
                          <img src={PERKINS_IMAGES.EXCELENTE} className="w-full h-full object-cover"/>
                      </div>
                      <h3 className={`text-lg font-bold mb-2 ${alertData.type === 'error' ? 'text-red-500' : 'text-gold-500'}`}>{alertData.title}</h3>
                      <p className="text-gray-300 text-sm mb-6">{alertData.message}</p>
                      <button onClick={closeAlert} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-2 rounded">Entendido</button>
                  </div>
              </div>
          )}
      </AppContext.Provider>
  );
};

const useStore = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error("useStore must be used within AppProvider");
    return context;
};

// --- COMPONENTS ---

const ChatWidget = () => {
  const { products, dolarBlue } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: ChatRole.MODEL, text: "Bienvenido a Mr. Perkins. ¿Busca alguna fragancia en particular?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isOpen]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: ChatRole.USER, text: userMsg }]);
    setLoading(true);

    const response = await sendMessageToPerkins(userMsg, dolarBlue, products);
    setMessages(prev => [...prev, { role: ChatRole.MODEL, text: response }]);
    setLoading(false);
  };

  return (
    <>
      {!isOpen && (
        <button onClick={() => setIsOpen(true)} className="fixed bottom-6 right-6 z-40 bg-gold-600 hover:bg-gold-500 text-black p-4 rounded-full shadow-lg border-2 border-white/20 transition-all hover:scale-110 group">
          <MessageCircle size={28} className="group-hover:animate-pulse" />
          <span className="absolute -top-2 -right-2 w-4 h-4 bg-red-500 rounded-full animate-ping" />
        </button>
      )}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-80 md:w-96 bg-neutral-900 border border-gold-600/30 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up max-h-[500px]">
          <div className="bg-black p-4 flex justify-between items-center border-b border-neutral-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full border border-gold-500 overflow-hidden">
                <img src={PERKINS_IMAGES.HOLA} className="w-full h-full object-cover" />
              </div>
              <div>
                <h3 className="text-gold-500 font-bold text-sm">Mr. Perkins</h3>
                <div className="text-[10px] text-green-400 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"/> En línea</div>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white"><X size={18}/></button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-black/50 scrollbar-thin">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === ChatRole.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-3 rounded-2xl text-xs md:text-sm ${m.role === ChatRole.USER ? 'bg-neutral-800 text-white rounded-br-none' : 'bg-gold-600/10 text-gold-100 border border-gold-600/20 rounded-bl-none'}`}>
                  {m.text}
                </div>
              </div>
            ))}
            {loading && <div className="text-gray-500 text-xs italic animate-pulse ml-2">Mr. Perkins está escribiendo...</div>}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 bg-black border-t border-neutral-800 flex gap-2">
            <input 
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="Consulte sobre fragancias..."
              className="flex-1 bg-neutral-900 border border-neutral-700 rounded-full px-4 py-2 text-sm text-white focus:border-gold-500 outline-none"
            />
            <button onClick={handleSend} disabled={loading} className="p-2 bg-gold-600 text-black rounded-full hover:bg-gold-500 transition-colors disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

const CartDrawer = () => {
    const { isCartOpen, setIsCartOpen, cart, addToCart, decreaseFromCart, calculateFinalPriceARS, formatPrice, clearCart, addOrder, showAlert, calculateProductCostARS } = useStore();
    const [step, setStep] = useState<'cart'|'form'>('cart');
    const [loading, setLoading] = useState(false);
    const [info, setInfo] = useState({ name: '', phone: '', address: '', city: '', date: '', time: '15:00', payMethod: 'mercadopago' as PaymentMethod, shipMethod: 'caba' as ShippingMethod, payShip: false });

    if (!isCartOpen) return null;

    const total = cart.reduce((acc, i) => acc + (calculateFinalPriceARS(i) * i.quantity), 0);
    const cost = cart.reduce((acc, i) => acc + (calculateProductCostARS(i) * i.quantity), 0);
    
    const shipCost = info.shipMethod === 'caba' ? 7500 : 0;
    const finalTotal = total + (info.payShip ? shipCost : 0);

    const handleCheckout = async () => {
        if (!info.name || !info.phone || !info.date || (info.shipMethod !== 'pickup' && !info.address)) {
            showAlert("Faltan Datos", "Por favor complete todos los campos.", "error");
            return;
        }
        setLoading(true);
        const orderId = `ORD-${Date.now()}`;
        const payload = {
            orderId,
            customerName: info.name,
            phone: info.phone,
            address: info.shipMethod === 'pickup' ? 'Retiro Belgrano' : info.address,
            city: info.shipMethod === 'pickup' ? 'CABA' : info.city,
            deliveryDate: `${info.date} ${info.time}`,
            items: cart,
            total: finalTotal,
            totalCost: cost,
            paymentMethod: info.payMethod,
            shippingMethod: info.shipMethod,
            shippingCost: shipCost,
            payShippingNow: info.payShip
        };

        try {
            const res = await fetch('/api/schedule_delivery', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (!res.ok) throw new Error("Error de comunicación con el servidor.");

            if (info.payMethod === 'mercadopago') {
                const prefRes = await fetch('/api/create_preference', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        items: cart.map(i => ({ title: i.nombre, unit_price: calculateFinalPriceARS(i), quantity: i.quantity })),
                        shippingCost: info.payShip ? shipCost : 0,
                        external_reference: orderId
                    })
                });
                const prefData = await prefRes.json();
                if (prefData.init_point) window.location.href = prefData.init_point;
                else throw new Error("Error generando pago");
            } else {
                addOrder({ ...payload, status: 'pending', timestamp: Date.now(), type: 'retail' } as any);
                showAlert("Pedido Recibido", "¡Gracias por su compra! Lo contactaremos a la brevedad.", "success");
                clearCart();
                setIsCartOpen(false);
            }
        } catch (e: any) {
            console.error(e);
            showAlert("Error", e.message || "Hubo un problema al procesar el pedido.", "error");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex justify-end animate-fade-in">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsCartOpen(false)}/>
            <div className="relative w-full max-w-md bg-neutral-900 h-full shadow-2xl flex flex-col border-l border-gold-600/30 animate-slide-up">
                <div className="p-4 bg-black border-b border-neutral-800 flex justify-between items-center">
                    <h2 className="text-xl font-serif text-gold-500">Tu Carrito</h2>
                    <button onClick={() => setIsCartOpen(false)}><X className="text-gray-400 hover:text-white"/></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">
                    {cart.length === 0 ? (
                        <div className="text-center text-gray-500 mt-10">Tu carrito está vacío.</div>
                    ) : step === 'cart' ? (
                        <div className="space-y-4">
                            {cart.map(item => (
                                <div key={item.id} className="flex gap-3 bg-black/40 p-3 rounded border border-neutral-800">
                                    <img src={item.image} className="w-16 h-16 object-cover rounded border border-neutral-700"/>
                                    <div className="flex-1">
                                        <div className="text-sm font-bold text-white">{item.nombre}</div>
                                        <div className="text-xs text-gold-500">{formatPrice(calculateFinalPriceARS(item))} x {item.quantity}</div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button onClick={() => decreaseFromCart(item)} className="p-1 bg-neutral-800 rounded text-white">-</button>
                                        <span className="text-sm font-bold">{item.quantity}</span>
                                        <button onClick={() => addToCart(item)} className="p-1 bg-neutral-800 rounded text-white">+</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            <h3 className="text-xs uppercase text-gold-500 font-bold tracking-widest">Datos de Envío</h3>
                            <input className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm" placeholder="Nombre Completo" value={info.name} onChange={e => setInfo({...info, name: e.target.value})}/>
                            <input className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm" placeholder="Teléfono" value={info.phone} onChange={e => setInfo({...info, phone: e.target.value})}/>
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => setInfo({...info, shipMethod: 'caba'})} className={`p-2 rounded border text-xs font-bold ${info.shipMethod === 'caba' ? 'bg-gold-600 text-black' : 'border-neutral-700 text-gray-400'}`}>Moto CABA</button>
                                <button onClick={() => setInfo({...info, shipMethod: 'interior'})} className={`p-2 rounded border text-xs font-bold ${info.shipMethod === 'interior' ? 'bg-gold-600 text-black' : 'border-neutral-700 text-gray-400'}`}>Interior</button>
                                <button onClick={() => setInfo({...info, shipMethod: 'pickup'})} className={`p-2 rounded border text-xs font-bold ${info.shipMethod === 'pickup' ? 'bg-gold-600 text-black' : 'border-neutral-700 text-gray-400'}`}>Retiro</button>
                            </div>
                            {info.shipMethod !== 'pickup' && (
                                <div className="space-y-2">
                                    <input className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm" placeholder="Dirección" value={info.address} onChange={e => setInfo({...info, address: e.target.value})}/>
                                    <input className="w-full bg-black border border-neutral-700 p-3 rounded text-white text-sm" placeholder="Ciudad" value={info.city} onChange={e => setInfo({...info, city: e.target.value})}/>
                                </div>
                            )}
                            <div className="flex gap-2">
                                <input type="date" className="flex-1 bg-black border border-neutral-700 p-3 rounded text-white text-sm" value={info.date} onChange={e => setInfo({...info, date: e.target.value})}/>
                                <input type="time" className="w-24 bg-black border border-neutral-700 p-3 rounded text-white text-sm" value={info.time} onChange={e => setInfo({...info, time: e.target.value})}/>
                            </div>
                            <h3 className="text-xs uppercase text-gold-500 font-bold tracking-widest mt-4">Pago</h3>
                            <div className="flex gap-2">
                                <button onClick={() => setInfo({...info, payMethod: 'mercadopago'})} className={`flex-1 p-3 rounded border text-sm flex items-center justify-center gap-2 ${info.payMethod === 'mercadopago' ? 'border-blue-500 text-blue-400 bg-blue-900/20' : 'border-neutral-700 text-gray-400'}`}><CreditCard size={16}/> Mercado Pago</button>
                                <button onClick={() => setInfo({...info, payMethod: 'cash'})} className={`flex-1 p-3 rounded border text-sm flex items-center justify-center gap-2 ${info.payMethod === 'cash' ? 'border-green-500 text-green-400 bg-green-900/20' : 'border-neutral-700 text-gray-400'}`}>💵 Efectivo</button>
                            </div>
                        </div>
                    )}
                </div>
                <div className="p-4 bg-black border-t border-neutral-800">
                    <div className="flex justify-between items-center mb-4 text-xl font-bold text-white">
                        <span>Total:</span>
                        <span>{formatPrice(finalTotal)}</span>
                    </div>
                    {step === 'cart' ? (
                        <button onClick={() => { if(cart.length>0) setStep('form'); }} disabled={cart.length===0} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded disabled:opacity-50">Iniciar Compra</button>
                    ) : (
                        <div className="flex gap-2">
                            <button onClick={() => setStep('cart')} className="px-4 py-3 bg-neutral-800 text-white rounded">Volver</button>
                            <button onClick={handleCheckout} disabled={loading} className="flex-1 bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded flex justify-center items-center gap-2">
                                {loading ? <Loader2 className="animate-spin"/> : 'Confirmar Pedido'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ProductCard: React.FC<{ product: Product }> = ({ product }) => {
    const { addToCart, calculateFinalPriceARS, formatPrice } = useStore();
    const price = calculateFinalPriceARS(product);
    const hasStock = product.stock > 0;
    const isLuxury = product.precio_usd > 40;

    return (
        <div className={`group relative bg-neutral-900/50 rounded-lg overflow-hidden border transition-all duration-300 ${isLuxury ? 'border-gold-600/30' : 'border-neutral-800'} hover:border-gold-500/50 hover:shadow-[0_0_20px_rgba(212,175,55,0.1)]`}>
            {isLuxury && <div className="absolute top-2 left-2 z-10 bg-gold-600 text-black text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wider">Luxury</div>}
            <div className="relative aspect-square overflow-hidden bg-black">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-in-out" loading="lazy"/>
                {!hasStock && <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white font-bold uppercase tracking-widest text-xs border-2 border-white/20 m-4 backdrop-blur-sm">Agotado</div>}
            </div>
            <div className="p-4">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider mb-1 flex justify-between">
                    <span>{product.marca}</span>
                    <span className="text-neutral-600">{product.genero}</span>
                </div>
                <h3 className="text-white font-serif text-sm leading-tight mb-3 truncate group-hover:text-gold-400 transition-colors">{product.nombre}</h3>
                <div className="flex justify-between items-end">
                    <div className="flex flex-col">
                        <span className="text-gold-500 font-bold text-lg leading-none">{formatPrice(price)}</span>
                        <span className="text-[10px] text-gray-600 mt-1">{product.presentacion_ml}ml</span>
                    </div>
                    {hasStock && (
                        <button onClick={() => addToCart(product)} className="bg-neutral-800 hover:bg-gold-500 hover:text-black text-white rounded-full p-2.5 transition-all transform hover:scale-105 active:scale-95 shadow-lg">
                            <ShoppingBag size={16}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- PAGES ---

const Catalog = () => {
    const { products, viewMode, setViewMode, filterBrand, setFilterBrand, availableBrands, isCartOpen, setIsCartOpen, cart } = useStore();
    
    return (
        <div className="min-h-screen bg-luxury-black pb-20">
            <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/5 shadow-2xl">
                <div className="container mx-auto px-4 h-20 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src={PERKINS_IMAGES.LOGO} className="h-10 opacity-90 hover:opacity-100 transition-opacity cursor-pointer"/>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="hidden md:flex gap-2">
                            <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="bg-neutral-900/50 text-gray-300 text-xs rounded-full px-4 py-2 border border-neutral-700 outline-none hover:border-gold-600 transition-colors cursor-pointer">
                                {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <button onClick={() => setIsCartOpen(true)} className="relative text-gold-500 hover:text-gold-400 transition-colors p-2">
                            <ShoppingBag size={26}/>
                            {cart.length > 0 && <span className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-lg">{cart.reduce((a,c)=>a+c.quantity,0)}</span>}
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-24 container mx-auto px-4">
                <div className="mb-12 rounded-3xl bg-neutral-900 border border-gold-900/30 relative overflow-hidden min-h-[300px] flex items-center shadow-2xl">
                    <div className="absolute inset-0 bg-[url('https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.webp')] bg-cover bg-center opacity-40 mix-blend-overlay"/>
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent"/>
                    <div className="relative z-10 p-8 md:p-16 max-w-2xl">
                        <span className="text-gold-500 uppercase tracking-[0.2em] text-xs font-bold mb-4 block">Exclusive Collection</span>
                        <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">La Esencia del <br/><span className="text-gold-500 italic">Lujo Árabe</span></h1>
                        <p className="text-gray-400 text-sm md:text-lg mb-8 max-w-lg font-light leading-relaxed">Descubre fragancias que trascienden el tiempo. Una selección curada de las casas más prestigiosas de Dubai.</p>
                        <div className="flex gap-4">
                            <button className="px-8 py-3 bg-gold-600 text-black font-bold uppercase tracking-widest text-xs hover:bg-gold-500 transition-colors rounded-sm">Ver Catálogo</button>
                            <button className="px-8 py-3 border border-white/20 text-white font-bold uppercase tracking-widest text-xs hover:bg-white/10 transition-colors rounded-sm backdrop-blur-sm">Novedades</button>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                    {products.filter(p => !p.deleted && (filterBrand === 'Fabricante' || p.marca === filterBrand)).map(p => (
                        <ProductCard key={p.id} product={p}/>
                    ))}
                </div>
            </main>
            
            <ChatWidget />
            <CartDrawer />
        </div>
    );
};

const Admin = () => {
    const { currentUser, login, logout, isAdmin, products, updateProduct, orders, updateOrderStatus, refreshOrders, dolarBlue, setDolarBlue, bulkUpdateMargins, pricingMode, setPricingMode } = useStore();
    const [activeTab, setActiveTab] = useState<'inventory'|'orders'>('orders');
    const [loginData, setLoginData] = useState({email:'', pass:''});
    const [searchTerm, setSearchTerm] = useState('');

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black bg-[url('https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.webp')] bg-cover bg-no-repeat">
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm"/>
                <div className="relative z-10 bg-neutral-900 p-8 rounded-2xl border border-gold-600/20 w-full max-w-sm shadow-2xl">
                    <div className="flex justify-center mb-6"><img src={PERKINS_IMAGES.LOGO} className="h-12"/></div>
                    <h2 className="text-white text-xl font-serif text-center mb-6">Staff Access</h2>
                    <input className="w-full mb-4 bg-black border border-neutral-700 p-3 rounded-lg text-white focus:border-gold-500 outline-none transition-colors" placeholder="Email" value={loginData.email} onChange={e=>setLoginData({...loginData, email:e.target.value})}/>
                    <input className="w-full mb-6 bg-black border border-neutral-700 p-3 rounded-lg text-white focus:border-gold-500 outline-none transition-colors" type="password" placeholder="Password" value={loginData.pass} onChange={e=>setLoginData({...loginData, pass:e.target.value})}/>
                    <button onClick={() => login(loginData.email, loginData.pass)} className="w-full bg-gold-600 hover:bg-gold-500 text-black font-bold py-3 rounded-lg transition-colors shadow-lg shadow-gold-900/20">Ingresar al Sistema</button>
                </div>
            </div>
        );
    }

    const filteredProducts = products.filter(p => p.nombre.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="min-h-screen bg-black text-white">
            <div className="bg-neutral-900 border-b border-neutral-800 p-4 flex justify-between items-center sticky top-0 z-20">
                <div className="flex items-center gap-4">
                    <img src={PERKINS_IMAGES.LOGO} className="h-8"/>
                    <span className="text-xs text-gray-500 border-l border-gray-700 pl-4">Admin Console v2.0</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="bg-black px-4 py-2 rounded-lg border border-neutral-800 flex items-center gap-2">
                        <span className="text-xs text-gray-400">Dólar Blue:</span>
                        <input type="number" value={dolarBlue} onChange={e => setDolarBlue(Number(e.target.value))} className="w-16 bg-transparent text-gold-500 font-bold outline-none text-right"/>
                    </div>
                    <button onClick={logout} className="p-2 hover:bg-red-900/20 text-red-500 rounded-lg"><LogOut size={18}/></button>
                </div>
            </div>

            <div className="p-6 max-w-7xl mx-auto">
                <div className="flex gap-4 mb-6">
                    <button onClick={() => setActiveTab('orders')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='orders' ? 'bg-gold-600 text-black shadow-lg shadow-gold-900/20' : 'bg-neutral-900 text-gray-400 hover:text-white'}`}>Pedidos ({orders.filter(o=>o.status==='pending').length})</button>
                    <button onClick={() => setActiveTab('inventory')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab==='inventory' ? 'bg-gold-600 text-black shadow-lg shadow-gold-900/20' : 'bg-neutral-900 text-gray-400 hover:text-white'}`}>Inventario</button>
                </div>

                {activeTab === 'inventory' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center bg-neutral-900 p-4 rounded-xl border border-neutral-800">
                            <div className="relative w-96">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
                                <input placeholder="Buscar producto..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full bg-black border border-neutral-700 pl-10 pr-4 py-2 rounded-lg text-sm text-white focus:border-gold-500 outline-none"/>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => bulkUpdateMargins('retail', 50)} className="px-3 py-1 bg-neutral-800 text-xs text-gray-300 rounded border border-neutral-700 hover:border-gold-500">Reset Margins (50%)</button>
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {filteredProducts.map(p => (
                                <div key={p.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex gap-4 hover:border-gold-600/30 transition-colors">
                                    <img src={p.image} className="w-20 h-20 rounded-lg object-cover bg-black"/>
                                    <div className="flex-1 space-y-2">
                                        <div className="flex justify-between items-start">
                                            <h4 className="font-bold text-sm truncate w-40">{p.nombre}</h4>
                                            <span className={`text-[10px] px-2 py-0.5 rounded ${p.stock>0?'bg-green-900/30 text-green-400':'bg-red-900/30 text-red-400'}`}>{p.stock} un.</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <div>
                                                <label className="text-gray-500 block">Costo USD</label>
                                                <input type="number" value={p.precio_usd} onChange={e => updateProduct(p.id, { precio_usd: Number(e.target.value) })} className="w-full bg-black border border-neutral-700 rounded px-2 py-1 text-white"/>
                                            </div>
                                            <div>
                                                <label className="text-gray-500 block">Stock</label>
                                                <div className="flex items-center">
                                                    <button onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })} className="px-2 bg-neutral-800 rounded-l">-</button>
                                                    <span className="flex-1 text-center bg-black border-y border-neutral-800 py-0.5">{p.stock}</span>
                                                    <button onClick={() => updateProduct(p.id, { stock: p.stock + 1 })} className="px-2 bg-neutral-800 rounded-r">+</button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="space-y-4 animate-fade-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold text-white">Últimos Pedidos</h3>
                            <button onClick={refreshOrders} className="p-2 bg-neutral-800 rounded-full hover:bg-neutral-700"><CheckCircle size={16}/></button>
                        </div>
                        <div className="grid gap-3">
                            {orders.map(o => (
                                <div key={o.id} className="bg-neutral-900 p-4 rounded-xl border border-neutral-800 flex flex-col md:flex-row gap-4 items-start md:items-center">
                                    <div className={`p-3 rounded-full ${o.status==='pending'?'bg-yellow-500/10 text-yellow-500':o.status==='delivered'?'bg-green-500/10 text-green-500':'bg-gray-500/10 text-gray-500'}`}>
                                        <Package size={24}/>
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex flex-col md:flex-row justify-between md:items-center mb-2">
                                            <span className="font-bold text-lg text-white">{o.customerName}</span>
                                            <span className="text-xs text-gray-500 font-mono">{new Date(o.timestamp).toLocaleString()}</span>
                                        </div>
                                        <div className="text-sm text-gray-400 flex flex-wrap gap-4">
                                            <span className="flex items-center gap-1"><Phone size={12}/> {o.phone}</span>
                                            <span className="flex items-center gap-1"><MapPin size={12}/> {o.city}</span>
                                            <span className="text-gold-500 font-bold">{new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS' }).format(o.total)}</span>
                                        </div>
                                        <div className="mt-2 p-2 bg-black/30 rounded border border-white/5 text-xs text-gray-300">
                                            {o.items.map(i => `${i.quantity}x ${i.nombre}`).join(', ')}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 min-w-[140px]">
                                        <select value={o.status} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className={`w-full p-2 rounded text-xs font-bold uppercase tracking-wider outline-none border ${o.status==='pending'?'bg-yellow-900/20 text-yellow-500 border-yellow-500/30':o.status==='delivered'?'bg-green-900/20 text-green-500 border-green-500/30':'bg-neutral-800 text-gray-400 border-neutral-700'}`}>
                                            <option value="pending">Pendiente</option>
                                            <option value="shipped">Enviado</option>
                                            <option value="delivered">Entregado</option>
                                            <option value="cancelled">Cancelado</option>
                                        </select>
                                        {o.paymentMethod === 'mercadopago' && <span className="text-[10px] text-center text-blue-400 bg-blue-900/20 py-1 rounded border border-blue-900/30">MercadoPago</span>}
                                        {o.paymentMethod === 'cash' && <span className="text-[10px] text-center text-green-400 bg-green-900/20 py-1 rounded border border-green-900/30">Efectivo</span>}
                                    </div>
                                </div>
                            ))}
                            {orders.length === 0 && <div className="text-center py-10 text-gray-500">No hay pedidos registrados.</div>}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const App = () => {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <Routes>
            <Route path="/" element={<Catalog />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
};

export default App;