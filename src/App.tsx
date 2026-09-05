import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Product, Brand, PaymentMethod, CartItem, FilterState, SheetData } from './types';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_PAYMENT_METHODS } from './data/mockData';
import { fetchSheetDataClient } from './services/sheetService';
import { Navbar } from './components/Navbar';
import { HeroEditorial } from './components/HeroEditorial';
import { IntentionsSection } from './components/IntentionsSection';
import { FragranceTest } from './components/FragranceTest';
import { MrPerkinsSelection } from './components/MrPerkinsSelection';
import { EditorialCuratedBlocks } from './components/EditorialCuratedBlocks';
import { DiscoveryKitSection } from './components/DiscoveryKitSection';
import { OffersSection } from './components/OffersSection';
import { BrandGrid } from './components/BrandGrid';
import { ProductFilters } from './components/ProductFilters';
import { ProductCard } from './components/ProductCard';
import { ProductDetailModal } from './components/ProductDetailModal';
import { PaymentMethodsSection } from './components/PaymentMethodsSection';
import { CartDrawer } from './components/CartDrawer';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import {
  Sparkles,
  AlertCircle,
  RefreshCw,
  HeartHandshake,
  ShieldCheck,
  Truck,
  Check,
  Store,
  Compass,
  ArrowRight
} from 'lucide-react';
import {
  BRAND_LOGO_PATH,
  WHATSAPP_PHONE_DISPLAY,
  WHATSAPP_PHONE_INTERNATIONAL,
  IntentionOption,
  trackFunnelEvent
} from './utils/constants';

export default function App() {
  const [products, setProducts] = useState<Product[]>(INITIAL_PRODUCTS);
  const [brands, setBrands] = useState<Brand[]>(INITIAL_BRANDS);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(INITIAL_PAYMENT_METHODS);
  const [isLive, setIsLive] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Active View: 'home' (Discovery & Editorial) | 'tienda' (Full Catalog) | 'ofertas' (Deals)
  const [activeView, setActiveView] = useState<'home' | 'tienda' | 'ofertas'>('home');

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

  // Filter State for Tienda
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    brand: '',
    type: '',
    gender: '',
    inStockOnly: false,
    tag: '',
    sortBy: 'featured'
  });

  // Selected Intention ID if any
  const [activeIntentionId, setActiveIntentionId] = useState<string | null>(null);

  // Pagination / Load More for catalog performance
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

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Notification Toast State
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  }, []);

  // Deep linking: Read URL query parameters & path parameters on initial mount & data load
  const [hasProcessedInitialUrl, setHasProcessedInitialUrl] = useState(false);

  useEffect(() => {
    if (products.length === 0 || hasProcessedInitialUrl) return;

    const params = new URLSearchParams(window.location.search);
    let productId = params.get('producto') || params.get('product') || params.get('id');

    const path = window.location.pathname;
    const pathMatch = path.match(/^\/(?:producto|p)\/([^/]+)/i);
    if (pathMatch && pathMatch[1]) {
      productId = decodeURIComponent(pathMatch[1]);
    }

    const searchQuery = params.get('q') || params.get('search');
    const brandQuery = params.get('brand');
    const viewQuery = params.get('view');

    if (viewQuery === 'tienda' || viewQuery === 'ofertas') {
      setActiveView(viewQuery as 'tienda' | 'ofertas');
    }

    if (productId) {
      const targetId = String(productId).toLowerCase();
      const found = products.find((p) => String(p.id).toLowerCase() === targetId);
      if (found) {
        setSelectedProduct(found);
      }
    }

    if (searchQuery || brandQuery) {
      setActiveView('tienda');
      setFilters((prev) => ({
        ...prev,
        search: searchQuery || prev.search,
        brand: brandQuery || prev.brand
      }));
    }

    setHasProcessedInitialUrl(true);
  }, [products, hasProcessedInitialUrl]);

  // Handle browser back/forward history navigation (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      let productId = params.get('producto') || params.get('product') || params.get('id');
      const pathMatch = window.location.pathname.match(/^\/(?:producto|p)\/([^/]+)/i);
      if (pathMatch && pathMatch[1]) {
        productId = decodeURIComponent(pathMatch[1]);
      }

      if (productId) {
        const found = products.find((p) => String(p.id).toLowerCase() === String(productId).toLowerCase());
        if (found) {
          setSelectedProduct(found);
          return;
        }
      }
      setSelectedProduct(null);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  // Synchronize URL with active product modal or active search/brand query
  useEffect(() => {
    if (!hasProcessedInitialUrl) return;

    if (selectedProduct) {
      const cleanPath = `/producto/${encodeURIComponent(selectedProduct.id)}`;
      if (window.location.pathname !== cleanPath) {
        window.history.pushState({}, '', cleanPath);
      }
    } else {
      const url = new URL(window.location.href);
      url.pathname = '/';
      url.searchParams.delete('product');
      url.searchParams.delete('producto');
      url.searchParams.delete('id');

      if (activeView !== 'home') {
        url.searchParams.set('view', activeView);
      } else {
        url.searchParams.delete('view');
      }

      if (filters.search) {
        url.searchParams.set('q', filters.search);
      } else {
        url.searchParams.delete('q');
      }

      if (filters.brand) {
        url.searchParams.set('brand', filters.brand);
      } else {
        url.searchParams.delete('brand');
      }

      const newUrl = url.pathname + (url.search ? url.search : '');
      if (window.location.pathname.startsWith('/producto/') || window.location.pathname.startsWith('/p/')) {
        window.history.pushState({}, '', newUrl);
      } else {
        window.history.replaceState({}, '', newUrl);
      }
    }
  }, [selectedProduct, filters.search, filters.brand, activeView, hasProcessedInitialUrl]);

  // Fetch Live Data from Backend / Google Sheet API with Direct Client Fallback
  const fetchSheetData = async () => {
    setIsSyncing(true);
    let data: SheetData | null = null;

    try {
      const response = await fetch('/api/sheet-data');
      if (response.ok) {
        data = await response.json();
      }
    } catch {
      // Ignore server API failure on client static run
    }

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

  // Filter & Sort Logic for Tienda
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
        // Search Query match
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
        return 0;
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

  // Navigation handlers
  const handleStartFragranceTest = () => {
    setActiveView('home');
    setTimeout(() => {
      const el = document.getElementById('encontra-tu-perfume');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleScrollToBrands = () => {
    setActiveView('tienda');
    setTimeout(() => {
      const el = document.getElementById('marcas-grid');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 100);
  };

  const handleSelectIntention = (intention: IntentionOption) => {
    setActiveIntentionId(intention.id);
    setActiveView('tienda');

    // Apply appropriate filter based on intention
    setFilters((prev) => {
      const reset = {
        ...prev,
        search: '',
        brand: '',
        type: '',
        gender: '',
        inStockOnly: false,
        tag: '',
        sortBy: 'featured' as const
      };

      if (intention.id === 'diario') {
        return { ...reset, search: 'fresco' };
      }
      if (intention.id === 'noche') {
        return { ...reset, search: 'intenso' };
      }
      if (intention.id === 'cita') {
        return { ...reset, search: 'vainilla' };
      }
      if (intention.id === 'oficina') {
        return { ...reset, search: 'limpio' };
      }
      if (intention.id === 'regalar') {
        return { ...reset, inStockOnly: true };
      }
      if (intention.id === 'notar') {
        return { ...reset, search: 'parfum' };
      }
      if (intention.id === 'fresco') {
        return { ...reset, search: 'cítrico' };
      }
      if (intention.id === 'dulce') {
        return { ...reset, search: 'dulce' };
      }
      if (intention.id === 'sorprendeme') {
        return { ...reset, sortBy: 'price-desc' };
      }
      return reset;
    });

    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  const handleGoToStoreWithSearch = (searchQuery: string) => {
    setActiveView('tienda');
    setFilters((prev) => ({
      ...prev,
      search: searchQuery
    }));
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, 50);
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-black font-sans flex flex-col selection:bg-[#E5A93C] selection:text-black">
      
      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-20 right-4 z-50 bg-black text-[#E5A93C] border-3 border-[#E5A93C] px-4 py-3 shadow-[6px_6px_0px_0px_#000] font-mono font-black text-xs uppercase animate-in slide-in-from-top-5 duration-200 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main Sticky Navbar */}
      <Navbar
        cartCount={cartTotalCount}
        onOpenCart={() => setIsCartOpen(true)}
        activeView={activeView}
        onNavigate={(view) => {
          setActiveView(view);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onStartTest={handleStartFragranceTest}
        onScrollToBrands={handleScrollToBrands}
        searchQuery={filters.search}
        onSearchChange={(q) => setFilters((prev) => ({ ...prev, search: q }))}
      />

      {/* Error / Offline Banner if applicable */}
      {errorMessage && (
        <div className="max-w-7xl mx-auto px-4 w-full pt-4">
          <div className="bg-amber-100 border-3 border-black p-4 shadow-[4px_4px_0px_0px_#000] flex items-center justify-between flex-wrap gap-3">
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
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: HOME (DISCOVERY, EDITORIAL & SOMMELIER EXPERIENCE)                  */}
      {/* ========================================================================= */}
      {activeView === 'home' && (
        <div className="space-y-0">
          
          {/* 1. Hero Editorial */}
          <HeroEditorial
            onStartTest={handleStartFragranceTest}
            onGoToStore={() => {
              setActiveView('tienda');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />

          {/* 2. Bloque "¿Qué estás buscando hoy?" (Filtros de intención) */}
          <IntentionsSection
            onSelectIntention={handleSelectIntention}
            activeIntentionId={activeIntentionId}
          />

          {/* 3. Bloque "Encontrá tu perfume" (Interactive Sommelier Test) */}
          <FragranceTest
            products={validProducts}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
          />

          {/* 4. Bloque "La Selección de Mr. Perkins" */}
          <MrPerkinsSelection
            products={validProducts}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
            onViewAllSelection={() => {
              setActiveView('tienda');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={showToast}
          />

          {/* 5. Bloques Editoriales Curados (Huelen a limpio, No pasar desapercibido, Clásicos) */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <EditorialCuratedBlocks
              products={validProducts}
              onSelectProduct={(p) => setSelectedProduct(p)}
              onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
              onGoToStoreWithFilter={handleGoToStoreWithSearch}
            />
          </div>

          {/* 6. Kit de Descubrimiento (Probá antes de elegir) */}
          <DiscoveryKitSection />

          {/* 7. Ofertas & Oportunidades Activas */}
          <OffersSection
            products={validProducts}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
            onGoToStoreWithFilter={handleGoToStoreWithSearch}
          />

          {/* 8. Trust & Benefits Banner */}
          <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="bg-white border-3 border-black p-6 shadow-[5px_5px_0px_0px_#000] space-y-2">
                <Truck className="w-8 h-8 text-black mb-2" />
                <h4 className="font-black text-base uppercase font-sans">ENVÍO A TODO EL PAÍS</h4>
                <p className="text-xs font-sans text-slate-700 leading-relaxed">
                  Despachamos con empaque de alta protección y seguimiento por Correo y Andreani. Retiro en CABA.
                </p>
              </div>

              <div className="bg-white border-3 border-black p-6 shadow-[5px_5px_0px_0px_#000] space-y-2">
                <ShieldCheck className="w-8 h-8 text-black mb-2" />
                <h4 className="font-black text-base uppercase font-sans">100% ORIGINALES GARANTIZADOS</h4>
                <p className="text-xs font-sans text-slate-700 leading-relaxed">
                  Garantía estricta de procedencia y autenticidad en perfumes importados y fragancias de autor.
                </p>
              </div>

              <div className="bg-white border-3 border-black p-6 shadow-[5px_5px_0px_0px_#000] space-y-2">
                <HeartHandshake className="w-8 h-8 text-black mb-2" />
                <h4 className="font-black text-base uppercase font-sans">ASESORAMIENTO DIRECTO</h4>
                <p className="text-xs font-sans text-slate-700 leading-relaxed">
                  Atención humana por WhatsApp con Mr. Perkins para ayudarte a elegir tu fragancia ideal.
                </p>
              </div>
            </div>
          </section>

          {/* 9. Medios de Pago */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
            <PaymentMethodsSection paymentMethods={paymentMethods} />
          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW: TIENDA (DIRECT FULL CATALOG & ADVANCED FILTERS)                     */}
      {/* ========================================================================= */}
      {activeView === 'tienda' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          
          {/* Tienda View Header Banner */}
          <div className="bg-[#121212] text-white border-4 border-black p-6 sm:p-8 shadow-[6px_6px_0px_0px_#000] flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-2 bg-[#E5A93C] text-black px-2.5 py-0.5 font-mono text-[11px] font-black uppercase">
                <Store className="w-3.5 h-3.5" />
                <span>CATÁLOGO COMPLETO</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-black uppercase font-sans text-white">
                LA TIENDA DE MR. PERKINS
              </h1>
              <p className="text-xs sm:text-sm font-sans text-slate-300">
                Explorá todos los perfumes importados, nacionales y de autor con stock en tiempo real.
              </p>
            </div>

            <button
              onClick={handleStartFragranceTest}
              className="bg-[#E5A93C] hover:bg-amber-500 text-black border-2 border-black px-4 py-2.5 font-black text-xs uppercase flex items-center justify-center gap-2 shadow-[3px_3px_0px_0px_#fff] cursor-pointer shrink-0"
            >
              <Compass className="w-4 h-4 stroke-[2.5]" />
              <span>¿NO SABÉS QUÉ ELEGIR? HACÉ EL TEST</span>
            </button>
          </div>

          {/* Brand Logos Grid Section */}
          <div id="marcas-grid">
            <BrandGrid
              brands={brands}
              products={validProducts}
              selectedBrand={filters.brand}
              onSelectBrand={(brandName) => setFilters((prev) => ({ ...prev, brand: brandName }))}
            />
          </div>

          {/* Product Filters Bar */}
          <ProductFilters
            filters={filters}
            onFilterChange={(newFilters) => setFilters((prev) => ({ ...prev, ...newFilters }))}
            onResetFilters={() => {
              setActiveIntentionId(null);
              setFilters({
                search: '',
                brand: '',
                type: '',
                gender: '',
                inStockOnly: false,
                tag: '',
                sortBy: 'featured'
              });
            }}
            products={validProducts}
            onShowToast={showToast}
          />

          {/* Catalog Product Grid Header */}
          <div className="flex items-center justify-between border-b-4 border-black pb-3">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="bg-black text-[#E5A93C] font-mono font-black text-xs px-2.5 py-1">
                RESULTADOS ({filteredProducts.length})
              </span>
              <span className="text-sm font-black font-sans uppercase">
                {filters.search
                  ? `BÚSQUEDA: "${filters.search}"${filters.brand ? ` (${filters.brand.toUpperCase()})` : ''}`
                  : filters.brand
                  ? `MARCA: ${filters.brand.toUpperCase()}`
                  : 'TODAS LAS FRAGANCIAS'}
              </span>
            </div>
          </div>

          {/* Catalog Grid */}
          {filteredProducts.length === 0 ? (
            <div className="bg-white border-4 border-black p-12 text-center my-8 shadow-[6px_6px_0px_0px_#000] space-y-3">
              <Sparkles className="w-12 h-12 mx-auto text-[#E5A93C]" />
              <h3 className="text-2xl font-black uppercase font-sans">
                No se encontraron productos con estos filtros
              </h3>
              <p className="text-xs font-mono text-slate-600 max-w-md mx-auto">
                Probá modificando los términos de búsqueda o limpiando las marcas y filtros seleccionados.
              </p>
              <button
                onClick={() => {
                  setActiveIntentionId(null);
                  setFilters({
                    search: '',
                    brand: '',
                    type: '',
                    gender: '',
                    inStockOnly: false,
                    tag: '',
                    sortBy: 'featured'
                  });
                }}
                className="bg-[#E5A93C] hover:bg-amber-400 border-2 border-black px-6 py-2 font-black text-xs uppercase shadow-[3px_3px_0px_0px_#000] cursor-pointer"
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
                    onShowToast={showToast}
                  />
                ))}
              </div>

              {/* Load More Products Button */}
              {filteredProducts.length > visibleCount && (
                <div className="flex flex-col items-center justify-center pt-4 pb-2 space-y-2">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 36)}
                    className="bg-[#E5A93C] hover:bg-amber-500 text-black border-4 border-black px-8 py-3 font-black text-sm uppercase shadow-[6px_6px_0px_0px_#000] hover:-translate-y-0.5 active:translate-x-0 active:translate-y-0 transition-all cursor-pointer font-sans tracking-wide"
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

          {/* Payment Methods Section in Store */}
          <PaymentMethodsSection paymentMethods={paymentMethods} />

        </main>
      )}

      {/* ========================================================================= */}
      {/* VIEW: OFERTAS (EXCLUSIVE PROMOTIONS & OPPORTUNITIES)                      */}
      {/* ========================================================================= */}
      {activeView === 'ofertas' && (
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
          <OffersSection
            products={validProducts}
            onSelectProduct={(p) => setSelectedProduct(p)}
            onAddToCart={(p, e) => handleAddToCart(p, 1, e)}
            onGoToStoreWithFilter={handleGoToStoreWithSearch}
          />
          <PaymentMethodsSection paymentMethods={paymentMethods} />
        </main>
      )}

      {/* ========================================================================= */}
      {/* FOOTER EDITORIAL (MR. PERKINS - CURADOR DE FRAGANCIAS)                    */}
      {/* ========================================================================= */}
      <footer className="bg-[#0D0D0D] text-white border-t-4 border-black mt-16 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Col 1: Brand presentation */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-black border-2 border-[#E5A93C] p-0.5 flex items-center justify-center">
                <img
                  src={BRAND_LOGO_PATH}
                  alt="Mr. Perkins"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <span className="font-sans font-black text-lg text-white block uppercase leading-none">
                  MR. PERKINS
                </span>
                <span className="font-mono text-[10px] text-[#E5A93C] uppercase tracking-widest">
                  CURADOR DE FRAGANCIAS
                </span>
              </div>
            </div>

            <p className="text-xs font-serif italic text-slate-300 leading-relaxed">
              "No vendemos simplemente botellas. Encontramos la firma olfativa que hablará por usted antes de pronunciar una palabra."
            </p>
            
            <div className="text-[11px] font-mono text-[#E5A93C]">
              © {new Date().getFullYear()} Mr. Perkins Argentina.
            </div>
          </div>

          {/* Col 2: Navigation Links */}
          <div className="space-y-2">
            <h5 className="font-mono font-black text-xs uppercase text-[#E5A93C] tracking-wider">
              NAVEGACIÓN DIRECTA
            </h5>
            <ul className="text-xs font-sans space-y-2 text-slate-300">
              <li>
                <button
                  onClick={() => {
                    setActiveView('home');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white underline cursor-pointer"
                >
                  • Inicio & Experiencia Editorial
                </button>
              </li>
              <li>
                <button
                  onClick={handleStartFragranceTest}
                  className="hover:text-white underline cursor-pointer text-[#E5A93C]"
                >
                  • Encontrá tu Perfume (Test Interactivo)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveView('tienda');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white underline cursor-pointer"
                >
                  • Catálogo Completo (Tienda)
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setActiveView('ofertas');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white underline cursor-pointer"
                >
                  • Ofertas & Oportunidades
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Guarantees & Deliveries */}
          <div className="space-y-2">
            <h5 className="font-mono font-black text-xs uppercase text-[#E5A93C] tracking-wider">
              GARANTÍAS & BENEFICIOS
            </h5>
            <ul className="text-xs font-sans space-y-1.5 text-slate-300">
              <li>• Fragancias 100% originales con garantía estricta.</li>
              <li>• Hasta 3 cuotas sin interés con todas las tarjetas.</li>
              <li>• Despachos a todo el país vía Correo Argentino / Andreani.</li>
              <li>• Envíos rápidos en CABA y retiro coordinado.</li>
            </ul>
          </div>

          {/* Col 4: WhatsApp Contact */}
          <div className="space-y-2">
            <h5 className="font-mono font-black text-xs uppercase text-[#E5A93C] tracking-wider">
              ATENCIÓN PERSONALIZADA
            </h5>
            <p className="text-xs font-sans text-slate-300">
              Atención directa y asesoramiento con nuestro sommelier olfativo.
            </p>
            <div className="pt-1">
              <a
                href={`https://wa.me/${WHATSAPP_PHONE_INTERNATIONAL}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-[#25D366] text-black px-3 py-1.5 text-xs font-mono font-black uppercase border border-black shadow-[2px_2px_0px_0px_#fff]"
              >
                <span>WhatsApp: {WHATSAPP_PHONE_DISPLAY}</span>
              </a>
            </div>
            <p className="text-[10px] font-mono text-slate-500">
              Lunes a Sábados de 9 a 20 hs.
            </p>
          </div>

        </div>
      </footer>

      {/* Modals & Floating Components */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onAddToCart={(p, qty) => handleAddToCart(p, qty)}
        onImageError={handleImageError}
        onShowToast={showToast}
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
