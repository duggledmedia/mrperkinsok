import React, { useState, useEffect, useMemo } from 'react';
import { Product, Brand, PaymentMethod, CartItem, FilterState, SheetData } from './types';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_PAYMENT_METHODS } from './data/mockData';
import { fetchSheetDataClient } from './services/sheetService';
import { Navbar } from './components/Navbar';
import { AnimatedCarouselHeader } from './components/AnimatedCarouselHeader';
import { BrandGrid } from './components/BrandGrid';
import { ProductFilters } from './components/ProductFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PaymentMethodsSection } from './components/PaymentMethodsSection';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Sparkles, ShoppingBag, AlertCircle, RefreshCw, HeartHandshake, ShieldCheck, Truck, Check } from 'lucide-react';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS);
  const [isLive, setIsLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Cart State with LocalStorage persistence
  const [cartItems, setCartItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('mr_perkins_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('mr_perkins_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error('Error saving cart to local storage', e);
    }
  }, [cartItems]);

  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    brand: '',
    type: '',
    gender: '',
    inStockOnly: false,
    tag: '',
    sortBy: 'featured'
  });

  // Pagination / Load More for performance
  const [visibleCount, setVisibleCount] = useState(36);

  // Set of product IDs whose images failed to load
  const [failedImageIds, setFailedImageIds] = useState<Set<string>>(new Set());

  const handleImageError = (productId: string) => {
    setFailedImageIds((prev) => {
      if (prev.has(productId)) return prev;
      const next = new Set(prev);
      next.add(productId);
      return next;
    });
  };

  useEffect(() => {
    setVisibleCount(36);
  }, [filters, products]);

  // Valid products that have an image URL and haven't failed image loading
  const validProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.imgUrl || !p.imgUrl.trim()) return false;
      if (failedImageIds.has(p.id)) return false;
      return true;
    });
  }, [products, failedImageIds]);

  // Random 10 featured products selected for each user session/connection
  const featuredProducts = useMemo(() => {
    if (!validProducts || validProducts.length === 0) return [];
    const inStock = validProducts.filter((p) => p.stock !== 'No');
    const pool = inStock.length >= 10 ? inStock : validProducts;
    const shuffled = [...pool].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  }, [validProducts]);

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // Fetch Live Data from Backend / Google Sheet API with Direct Client Fallback
  const fetchSheetData = async () => {
    setIsSyncing(true);
    let data: SheetData | null = null;

    // 1. Try server API route first
    try {
      const response = await fetch('/api/sheet-data');
      if (response.ok) {
        data = await response.json();
      }
    } catch {
      // Ignore server API failure on Vercel/static hosts
    }

    // 2. If server API failed or was unavailable, fetch directly from Google Sheets client-side
    if (!data || !data.products || data.products.length === 0) {
      try {
        data = await fetchSheetDataClient();
      } catch (err: any) {
        console.warn('Fallback a datos locales por error en fetch directo', err);
      }
    }

    if (data && data.products && data.products.length > 0) {
      setProducts(data.products);
      if (data.brands && data.brands.length > 0) {
        setBrands(data.brands);
      }
      if (data.paymentMethods && data.paymentMethods.length > 0) {
        setPaymentMethods(data.paymentMethods);
      }
      setIsLive(data.isLive);
      setLastUpdated(data.lastUpdated || new Date().toISOString());
      setErrorMessage(null);
    } else {
      setIsLive(false);
      setErrorMessage('No se pudo conectar con Google Sheets. Mostrando inventario de respaldo.');
    }

    setIsSyncing(false);
  };

  useEffect(() => {
    fetchSheetData();
  }, []);

  // Filter & Sort Logic
  const filteredProducts = useMemo(() => {
    const normalize = (str: string) =>
      str
        ? str
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
        : '';

    return validProducts
      .filter((p) => {
        // Search Query match (Real-time multi-word search across name, brand, description, type, gender & tags)
        if (filters.search && filters.search.trim()) {
          const queryNorm = normalize(filters.search.trim());
          const queryTokens = queryNorm.split(/\s+/).filter(Boolean);

          const searchableText = normalize(
            `${p.producto} ${p.marca} ${p.tipo} ${p.genero} ${p.descripcion} ${(p.clasificacion || []).join(' ')}`
          );

          const matchesAllTokens = queryTokens.every((token) =>
            searchableText.includes(token)
          );

          if (!matchesAllTokens) {
            return false;
          }
        }

        // Brand Match
        if (filters.brand && p.marca.toLowerCase() !== filters.brand.toLowerCase()) {
          return false;
        }

        // Type Match
        if (filters.type && p.tipo.toLowerCase() !== filters.type.toLowerCase()) {
          return false;
        }

        // Gender Match
        if (filters.gender && p.genero.toLowerCase() !== filters.gender.toLowerCase()) {
          return false;
        }

        // Tag Match
        if (
          filters.tag &&
          !(p.clasificacion || []).some((t) => t.toLowerCase() === filters.tag.toLowerCase())
        ) {
          return false;
        }

        // Stock Match
        if (filters.inStockOnly && p.stock === 'No') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === 'price-asc') return a.precioVenta - b.precioVenta;
        if (filters.sortBy === 'price-desc') return b.precioVenta - a.precioVenta;
        if (filters.sortBy === 'name') return a.producto.localeCompare(b.producto);
        return 0; // featured default
      });
  }, [validProducts, filters]);

  // Cart Operations
  const handleAddToCart = (product: Product, quantity = 1, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    if (product.stock === 'No') return;

    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        return prev.map((item) =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { product, quantity }];
    });

    showToast(`🛒 ¡${product.producto} agregado al carrito!`);
  };

  const handleUpdateCartQuantity = (productId: string, delta: number) => {
    setCartItems((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const cartTotalCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-white text-black font-sans flex flex-col selection:bg-yellow-300 selection:text-black">
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-black text-yellow-300 border-3 border-yellow-300 px-4 py-3 shadow-[6px_6px_0px_0px_#FF007F] font-mono font-black text-xs uppercase animate-in slide-in-from-top-5 duration-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-lime-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sticky Navbar */}
      <Navbar
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* Hero Animated Carousel Header */}
      <AnimatedCarouselHeader
        products={featuredProducts}
        onSelectProduct={(p) => setSelectedProduct(p)}
        onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
        onImageError={handleImageError}
      />

      {/* Main Body Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 py-8 space-y-8">
        
        {/* Error / Offline Banner if applicable */}
        {errorMessage && (
          <div className="bg-yellow-100 border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-2 text-xs font-mono font-bold">
              <AlertCircle className="w-5 h-5 text-pink-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <button
              onClick={fetchSheetData}
              className="bg-black text-white px-3 py-1 text-xs font-mono font-bold hover:bg-pink-600 cursor-pointer flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" /> Reintentar
            </button>
          </div>
        )}

        {/* Brand Logos Grid Section */}
        <BrandGrid
          brands={brands}
          products={validProducts}
          selectedBrand={filters.brand}
          onSelectBrand={(brandName) => setFilters((prev) => ({ ...prev, brand: brandName }))}
        />

        {/* Product Filters Bar */}
        <ProductFilters
          filters={filters}
          onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
          onResetFilters={() =>
            setFilters({
              search: '',
              brand: '',
              type: '',
              gender: '',
              inStockOnly: false,
              tag: '',
              sortBy: 'featured'
            })
          }
          products={validProducts}
        />

        {/* Catalog Product Grid Header */}
        <div className="flex items-center justify-between border-b-4 border-black pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-black text-yellow-300 font-mono font-black text-xs px-2.5 py-1">
              CATÁLOGO MR. PERKINS
            </span>
            <span className="text-sm font-black font-sans uppercase">
              {filters.search
                ? `BÚSQUEDA: "${filters.search}"${filters.brand ? ` (${filters.brand.toUpperCase()})` : ''}`
                : filters.brand
                ? `MARCA: ${filters.brand.toUpperCase()}`
                : 'TODOS LOS PRODUCTOS'}
            </span>
          </div>
        </div>

        {/* Catalog Grid */}
        {filteredProducts.length === 0 ? (
          <div className="bg-slate-50 border-4 border-black p-12 text-center my-8 shadow-[6px_6px_0px_0px_#000] space-y-3">
            <Sparkles className="w-12 h-12 mx-auto text-pink-500" />
            <h3 className="text-2xl font-black uppercase font-sans">
              No se encontraron productos con estos filtros
            </h3>
            <p className="text-xs font-mono text-slate-600 max-w-md mx-auto">
              Probá modificando los términos de búsqueda o limpiando las marcas y filtros seleccionados.
            </p>
            <button
              onClick={() =>
                setFilters({
                  search: '',
                  brand: '',
                  type: '',
                  gender: '',
                  inStockOnly: false,
                  tag: '',
                  sortBy: 'featured'
                })
              }
              className="bg-yellow-300 hover:bg-yellow-400 border-2 border-black px-6 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] cursor-pointer"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6">
              {filteredProducts.slice(0, visibleCount).map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onSelectProduct={(p) => setSelectedProduct(p)}
                  onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
                  onImageError={handleImageError}
                />
              ))}
            </div>

            {/* Load More Products Button */}
            {filteredProducts.length > visibleCount && (
              <div className="flex flex-col items-center justify-center pt-4 pb-2 space-y-2">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 36)}
                  className="bg-yellow-300 hover:bg-yellow-400 text-black border-4 border-black px-8 py-3 font-black text-sm uppercase shadow-[6px_6px_0px_0px_#000] hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer font-sans tracking-wide"
                >
                  ⚡ MOSTRAR MÁS PRODUCTOS (+36)
                </button>
                <p className="text-xs font-mono font-bold text-slate-500">
                  Mostrando {Math.min(visibleCount, filteredProducts.length)} de {filteredProducts.length} productos
                </p>
              </div>
            )}
          </div>
        )}

        {/* Payment Methods Section */}
        <PaymentMethodsSection paymentMethods={paymentMethods} />

        {/* Value Proposition Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t-4 border-black">
          <div className="bg-yellow-300 border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-1">
            <Truck className="w-8 h-8 text-black mb-2" />
            <h4 className="font-black text-base uppercase font-sans">ENVÍO RÁPIDO Y SEGURO</h4>
            <p className="text-xs font-sans text-black/80 font-medium">
              Despachamos en 24hs a todo el territorio nacional con seguimiento online.
            </p>
          </div>

          <div className="bg-pink-400 border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-1">
            <ShieldCheck className="w-8 h-8 text-black mb-2" />
            <h4 className="font-black text-base uppercase font-sans">100% FRAGANCIAS ORIGINALES</h4>
            <p className="text-xs font-sans text-black/80 font-medium">
              Garantía de autenticidad en perfumes importados y nuestra línea de autor.
            </p>
          </div>

          <div className="bg-cyan-300 border-3 border-black p-5 shadow-[4px_4px_0px_0px_#000] space-y-1">
            <HeartHandshake className="w-8 h-8 text-black mb-2" />
            <h4 className="font-black text-base uppercase font-sans">ATENCIÓN PERSONALIZADA</h4>
            <p className="text-xs font-sans text-black/80 font-medium">
              Asesoramiento olfativo por WhatsApp para elegir tu fragancia ideal.
            </p>
          </div>
        </div>

      </main>

      {/* Brutalist Footer */}
      <footer className="bg-black text-white border-t-4 border-black mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-3">
            <div className="inline-block bg-yellow-300 text-black border-2 border-white px-3 py-1 font-black text-xl font-sans uppercase shadow-[3px_3px_0px_0px_#fff]">
              MR. PERKINS
            </div>
            <p className="text-xs font-sans text-slate-300 leading-relaxed">
              Marca registrada de fragancias de nicho, perfumes de diseñador y desodorantes corporales de alta intensidad.
            </p>
            <div className="text-[11px] font-mono text-yellow-300">
              © {new Date().getFullYear()} Mr. Perkins Argentina.
            </div>
          </div>

          <div className="space-y-2">
            <h5 className="font-mono font-black text-xs uppercase text-yellow-300 tracking-wider">
              INFORMACIÓN DE ENTREGA
            </h5>
            <ul className="text-xs font-sans space-y-1 text-slate-300">
              <li>• Envío sin cargo en CABA en compras mayores a $45.000 (*).</li>
              <li>• Hasta 3 cuotas sin interés con todas las tarjetas.</li>
              <li>• Despachos a todo el país vía Correo Argentino / Andreani.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <h5 className="font-mono font-black text-xs uppercase text-yellow-300 tracking-wider">
              BASE DE DATOS & HOJA DE CÁLCULO
            </h5>
            <p className="text-xs font-sans text-slate-300">
              Catálogo sincronizado dinámicamente en vivo con Google Sheets.
            </p>
          </div>

          <div className="space-y-2">
            <h5 className="font-mono font-black text-xs uppercase text-yellow-300 tracking-wider">
              CONTACTO COMERCIAL
            </h5>
            <p className="text-xs font-sans text-slate-300">
              Atención Telefónica y WhatsApp de Lunes a Sábados de 9 a 20 hs.
            </p>
            <div className="text-xs font-mono font-bold text-lime-400">
              WhatsApp: +54 9 11 2345-6789
            </div>
          </div>
        </div>
      </footer>

      {/* Modals & Floating Components */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
        onImageError={handleImageError}
      />

      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateCartQuantity}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        paymentMethods={paymentMethods}
      />

      {/* Floating WhatsApp Button */}
      <FloatingWhatsApp />
    </div>
  );
}
