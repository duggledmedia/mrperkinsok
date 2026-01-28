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
  
  // Auth
  currentUser: User | null;
  login: (email: string, pass: string) => boolean;
  logout: () => void;
  isAdmin: boolean;
  users: User[];
  addUser: (user: User) => void;
  toggleUserStatus: (email: string) => void;
  deleteUser: (email: string) => void;

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
  sortPrice: 'none' | 'asc' | 'desc';
  setSortPrice: (v: 'none' | 'asc' | 'desc') => void;
  availableBrands: string[];
  availableGenders: string[];

  // Utils
  showAlert: (title: string, msg: string, type?: 'success'|'error'|'info') => void;
  closeAlert: () => void;
  syncStatus: 'synced' | 'syncing' | 'error';
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // --- STATE ---
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
  const [sortPrice, setSortPrice] = useState<'none'|'asc'|'desc'>('none');
  
  const [alertData, setAlertData] = useState<AlertData>({ isOpen: false, title: '', message: '', type: 'info' });
  const [syncStatus, setSyncStatus] = useState<'synced'|'syncing'|'error'>('synced');
  
  const [dolarBlue, setDolarBlueState] = useState(() => {
      const stored = localStorage.getItem('dolarBlue');
      const val = stored ? Number(stored) : 1230;
      return isNaN(val) ? 1230 : val;
  });

  const lastUpdateRef = useRef<number>(0);

  // --- SYNC ENGINE ---
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
                              stock: Number(merged.stock) || 0, // Ensure number
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
      const interval = setInterval(fetchProducts, 8000);
      return () => clearInterval(interval);
  }, []);

  // --- CART LOGIC (ROBUST) ---
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

  // --- UTILS ---
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

  // Users Management placeholders (simplificado)
  const addUser = (u: User) => setUsers(prev => [...prev, u]);
  const toggleUserStatus = (e: string) => setUsers(prev => prev.map(u => u.email === e ? { ...u, active: !u.active } : u));
  const deleteUser = (e: string) => setUsers(prev => prev.filter(u => u.email !== e));

  const setDolarBlue = (v: number) => {
      if (v > 0) {
          setDolarBlueState(v);
          localStorage.setItem('dolarBlue', String(v));
      }
  };

  return (
      <AppContext.Provider value={{
          products, cart, isCartOpen, setIsCartOpen, addToCart, removeFromCart, decreaseFromCart, clearCart,
          orders, addOrder, updateOrderStatus, fetchOrdersFromCalendar: async () => {}, // Simplificado
          currentUser, login, logout, isAdmin: currentUser?.role === 'admin', users, addUser, toggleUserStatus, deleteUser,
          dolarBlue, setDolarBlue, formatPrice, calculateFinalPriceARS, calculateProductCostARS, pricingMode, setPricingMode,
          updateProduct, addNewProduct, deleteProduct, bulkUpdateMargins,
          viewMode, setViewMode, filterBrand, setFilterBrand, filterGender, setFilterGender, sortPrice, setSortPrice, availableBrands, availableGenders,
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

// --- SUB-COMPONENTS (Simplified for robustness) ---

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

                            {info.shipMethod === 'caba' && (
                                <div className="bg-neutral-800 p-3 rounded border border-neutral-700 text-sm">
                                    <div className="flex justify-between mb-2"><span>Envío Moto:</span> <span>$7.500</span></div>
                                    <label className="flex items-center gap-2">
                                        <input type="checkbox" checked={info.payShip} onChange={e => setInfo({...info, payShip: e.target.checked})} />
                                        <span>Pagar envío ahora</span>
                                    </label>
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

    return (
        <div className={`group bg-neutral-900/50 rounded-lg overflow-hidden border border-neutral-800 hover:border-gold-600/50 transition-all ${!hasStock ? 'opacity-60' : ''}`}>
            <div className="relative aspect-square overflow-hidden bg-black">
                <img src={product.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" loading="lazy"/>
                {!hasStock && <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold uppercase tracking-widest text-xs border-2 border-white/20 m-4">Agotado</div>}
            </div>
            <div className="p-3">
                <div className="text-[10px] text-gray-500 uppercase tracking-wider">{product.marca}</div>
                <h3 className="text-white font-medium text-sm leading-tight mb-2 truncate">{product.nombre}</h3>
                <div className="flex justify-between items-center">
                    <span className="text-gold-500 font-bold">{formatPrice(price)}</span>
                    {hasStock && (
                        <button onClick={() => addToCart(product)} className="bg-white hover:bg-gold-500 hover:text-white text-black rounded-full p-2 transition-colors">
                            <ShoppingBag size={14}/>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

// --- MAIN PAGES ---

const Catalog = () => {
    const { products, viewMode, setViewMode, filterBrand, setFilterBrand, availableBrands, isCartOpen, setIsCartOpen, cart } = useStore();
    
    return (
        <div className="min-h-screen bg-luxury-black pb-20">
            <header className="fixed top-0 w-full z-50 bg-black/80 backdrop-blur border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <img src={PERKINS_IMAGES.LOGO} className="h-8"/>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex gap-2">
                            <select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} className="bg-neutral-900 text-gray-300 text-xs rounded-full px-3 py-1 border border-neutral-700 outline-none">
                                {availableBrands.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <button onClick={() => setIsCartOpen(true)} className="relative text-gold-500">
                            <ShoppingBag size={24}/>
                            {cart.length > 0 && <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">{cart.reduce((a,c)=>a+c.quantity,0)}</span>}
                        </button>
                    </div>
                </div>
            </header>

            <main className="pt-20 container mx-auto px-4">
                <div className="mb-8 p-6 rounded-2xl bg-gradient-to-r from-neutral-900 to-black border border-gold-900/30 relative overflow-hidden">
                    <div className="relative z-10">
                        <h1 className="text-3xl md:text-5xl font-serif text-white mb-2">Lattafa <span className="text-gold-500 italic">Argentina</span></h1>
                        <p className="text-gray-400 text-sm md:text-base max-w-lg">Descubre la exclusividad de las fragancias árabes. Envíos a todo el país.</p>
                    </div>
                    <div className="absolute right-0 top-0 h-full w-1/2 bg-[url('https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Perks.webp')] bg-cover opacity-20 mask-image-gradient"/>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {products.filter(p => !p.deleted && (filterBrand === 'Fabricante' || p.marca === filterBrand)).map(p => (
                        <ProductCard key={p.id} product={p}/>
                    ))}
                </div>
            </main>
            
            <CartDrawer />
        </div>
    );
};

const Admin = () => {
    const { currentUser, login, isAdmin, products, updateProduct } = useStore();
    const [email, setEmail] = useState('');
    const [pass, setPass] = useState('');

    if (!currentUser) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <div className="bg-neutral-900 p-8 rounded border border-neutral-800 w-full max-w-sm">
                    <h2 className="text-white text-xl font-bold mb-4">Acceso Perkins</h2>
                    <input className="w-full mb-3 bg-black border border-neutral-700 p-3 rounded text-white" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
                    <input className="w-full mb-6 bg-black border border-neutral-700 p-3 rounded text-white" type="password" placeholder="Pass" value={pass} onChange={e=>setPass(e.target.value)}/>
                    <button onClick={() => login(email, pass)} className="w-full bg-gold-600 text-black font-bold py-3 rounded">Ingresar</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white p-4">
            <h1 className="text-2xl font-bold mb-6 text-gold-500">Panel de Control</h1>
            <div className="grid gap-4">
                {products.map(p => (
                    <div key={p.id} className="bg-neutral-900 p-4 rounded flex justify-between items-center border border-neutral-800">
                        <div className="flex items-center gap-3">
                            <img src={p.image} className="w-10 h-10 rounded"/>
                            <div>
                                <div className="font-bold text-sm">{p.nombre}</div>
                                <div className="text-xs text-gray-500">Stock: {p.stock}</div>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => updateProduct(p.id, { stock: p.stock + 1 })} className="px-3 py-1 bg-neutral-800 rounded">+</button>
                            <button onClick={() => updateProduct(p.id, { stock: Math.max(0, p.stock - 1) })} className="px-3 py-1 bg-neutral-800 rounded">-</button>
                        </div>
                    </div>
                ))}
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