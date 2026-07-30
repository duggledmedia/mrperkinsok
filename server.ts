import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer, ViteDevServer } from 'vite';
import Papa from 'papaparse';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_PAYMENT_METHODS } from './src/data/mockData';
import { Product, Brand, PaymentMethod } from './src/types';

const SHEET_ID = '1Uhi-a3TPPsy1RFpzsCikX7hdRiEux5-piobX0vnwGhM';
const CATALOGO_GID = '809374575';

let cachedProducts: Product[] = INITIAL_PRODUCTS;

function formatImageUrl(rawUrl: string): string {
  if (!rawUrl) return '';
  let url = rawUrl.trim();

  // Convert Google Drive view/open links to direct image stream URLs
  if (url.includes('drive.google.com')) {
    const match = url.match(/\/d\/([a-zA-Z0-9_-]+)/) || url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://lh3.googleusercontent.com/d/${match[1]}`;
    }
  }

  // Convert Dropbox share links to raw image stream URLs
  if (url.includes('dropbox.com')) {
    return url.replace('?dl=0', '?raw=1').replace('www.dropbox.com', 'dl.dropboxusercontent.com');
  }

  return url;
}

function escapeHtml(str: string): string {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseArgentinePrice(val: any): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  let str = String(val).trim().replace(/[^0-9.,]/g, '');
  if (!str) return 0;

  if (str.includes('.') && str.includes(',')) {
    if (str.indexOf('.') < str.indexOf(',')) {
      str = str.replace(/\./g, '').replace(',', '.');
    } else {
      str = str.replace(/,/g, '');
    }
  } else if (str.includes(',')) {
    str = str.replace(',', '.');
  } else if (str.includes('.')) {
    const parts = str.split('.');
    if (parts.length > 2) {
      str = str.replace(/\./g, '');
    } else if (parts[1] && parts[1].length === 3) {
      str = str.replace(/\./g, '');
    }
  }

  const num = parseFloat(str);
  if (isNaN(num)) return 0;
  if (num > 0 && num < 1000) {
    return Math.round(num * 1000);
  }
  return num;
}

function extractPriceFromRow(row: Record<string, any>, idx: number): number {
  if (!row) return INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length]?.precioVenta || 78500;
  
  const candidateKeys = [
    'Precio Venta (ARS)', 'Precio Venta', 'Precio ARS', 'Precio', 'precio_venta',
    'Precio de Venta', 'P. Venta', 'Precio Contado', 'Precio Final', 'PRECIO VENTA',
    'PRECIO', 'Valor', 'PVP', 'PV'
  ];

  for (const candidate of candidateKeys) {
    if (row[candidate] !== undefined && row[candidate] !== null && String(row[candidate]).trim() !== '') {
      const parsed = parseArgentinePrice(row[candidate]);
      if (parsed > 0) return parsed;
    }
  }

  // Fuzzy search in key names
  const keys = Object.keys(row);
  for (const k of keys) {
    const kLower = k.toLowerCase();
    if ((kLower.includes('precio') || kLower.includes('price') || kLower.includes('venta')) && !kLower.includes('costo')) {
      const val = row[k];
      if (val !== undefined && val !== null && String(val).trim() !== '') {
        const parsed = parseArgentinePrice(val);
        if (parsed > 0) return parsed;
      }
    }
  }

  // Fallback to non-zero mock price if sheet column missing or 0
  return INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length]?.precioVenta || 78500;
}

async function fetchCsvFromGoogleSheet(sheetNameOrGid: { name?: string; gid?: string }) {
  let url = '';
  if (sheetNameOrGid.gid) {
    url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${sheetNameOrGid.gid}`;
  } else if (sheetNameOrGid.name) {
    url = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent(sheetNameOrGid.name)}`;
  }

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    }
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error(`La hoja de cálculo está privada o requiere iniciar sesión. Cambiá la privacidad a "Cualquiera con el enlace puede ver" en Google Sheets.`);
    }
    throw new Error(`Error HTTP ${response.status} al obtener la hoja de cálculo.`);
  }

  const text = await response.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  return parsed.data as Record<string, string>[];
}

async function fetchAndCacheProducts(): Promise<Product[]> {
  try {
    let catalogRows: Record<string, string>[] = [];
    try {
      catalogRows = await fetchCsvFromGoogleSheet({ gid: CATALOGO_GID });
    } catch (err) {
      catalogRows = await fetchCsvFromGoogleSheet({ name: 'Catalogo' });
    }

    const products: Product[] = catalogRows.map((row, idx) => {
      const id = row['ID'] || row['id'] || String(idx + 1);
      const stockRaw = (row['Stock'] || row['stock'] || 'Si').trim();
      const stock = stockRaw.toLowerCase() === 'no' || stockRaw.toLowerCase() === 'false' || stockRaw.toLowerCase() === '0' ? 'No' : 'Si';
      const producto = row['Producto'] || row['producto'] || row['Nombre'] || 'Producto Mr. Perkins';
      const marca = row['Marca'] || row['marca'] || 'Mr. Perkins';
      const cantidad = row['Cantidad'] || row['cantidad'] || row['Contenido'] || '100 ml';
      const tipo = row['Tipo'] || row['tipo'] || 'Perfume';
      const genero = row['Género'] || row['genero'] || row['Genero'] || 'Unisex';
      const precioVenta = extractPriceFromRow(row, idx);
      const descripcion = row['Descripción'] || row['descripcion'] || row['Descripcion'] || '';
      const rawClasificacion = row['Clasificación (Etiquetas)'] || row['Clasificación'] || row['clasificacion'] || row['Etiquetas'] || '';
      const clasificacion = rawClasificacion
        ? rawClasificacion.split(',').map(s => s.trim()).filter(Boolean)
        : [tipo, genero];

      const rawImg = row['img_url'] || row['imgUrl'] || row['Imagen'] || '';
      const imgUrl = formatImageUrl(rawImg) || INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length]?.imgUrl || 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80';

      return {
        id,
        stock,
        producto,
        marca,
        cantidad,
        tipo,
        genero,
        precioVenta,
        descripcion,
        clasificacion,
        imgUrl
      };
    }).filter(p => Boolean(p.producto));

    if (products.length > 0) {
      cachedProducts = products;
      return products;
    }
  } catch (err) {
    console.warn('[Mr. Perkins Server] Warning during product fetch:', err);
  }
  return cachedProducts;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Preload products from Google Sheets on boot
  fetchAndCacheProducts().then((prods) => {
    console.log(`[Mr. Perkins Server] Preloaded ${prods.length} products for share metadata.`);
  }).catch((err) => {
    console.warn('[Mr. Perkins Server] Could not preload products on boot:', err);
  });

  app.use(express.json());

  // API Route: Live data from Google Sheets
  app.get('/api/sheet-data', async (req, res) => {
    try {
      // 1. Fetch Catalogo and refresh product cache
      const products = await fetchAndCacheProducts();

      // 2. Fetch Marcas
      let marcasRows: Record<string, string>[] = [];
      try {
        marcasRows = await fetchCsvFromGoogleSheet({ name: 'Marcas' });
      } catch (err) {
        console.warn('Hoja Marcas no encontrada o inaccesible', err);
      }

      // 3. Fetch MediosPago
      let mediosPagoRows: Record<string, string>[] = [];
      try {
        mediosPagoRows = await fetchCsvFromGoogleSheet({ name: 'MediosPago' });
      } catch (err) {
        console.warn('Hoja MediosPago no encontrada o inaccesible', err);
      }

      // Process Brands
      const brands: Brand[] = marcasRows.map((row) => {
        const marca = row['Marca'] || row['marca'] || '';
        const rawImg = row['img_url'] || row['imgUrl'] || '';
        const imgUrl = formatImageUrl(rawImg);
        return { marca, imgUrl };
      }).filter(b => Boolean(b.marca));

      // Process Payment Methods
      const paymentMethods: PaymentMethod[] = mediosPagoRows.map((row) => {
        const medio_de_pago = row['medio_de_pago'] || row['Medio de pago'] || row['Medio'] || '';
        const desc_mp = row['desc_mp'] || row['Descripción'] || row['Descripcion'] || '';
        const activoRaw = (row['activo'] || row['Activo'] || 'Si').trim();
        const activo = activoRaw.toLowerCase() === 'no' ? 'No' : 'Si';
        return { medio_de_pago, desc_mp, activo };
      }).filter(pm => Boolean(pm.medio_de_pago));

      res.json({
        products: products.length > 0 ? products : INITIAL_PRODUCTS,
        brands: brands.length > 0 ? brands : INITIAL_BRANDS,
        paymentMethods: paymentMethods.length > 0 ? paymentMethods : INITIAL_PAYMENT_METHODS,
        lastUpdated: new Date().toISOString(),
        isLive: true
      });

    } catch (error: any) {
      console.error('Error fetching Google Sheets data:', error?.message || error);
      // Graceful fallback to rich mock data
      res.json({
        products: INITIAL_PRODUCTS,
        brands: INITIAL_BRANDS,
        paymentMethods: INITIAL_PAYMENT_METHODS,
        lastUpdated: new Date().toISOString(),
        isLive: false,
        error: `Inaccesible directamente: ${error?.message || 'Permiso restringido en la hoja'}. Mostrando catálogo de respaldo.`
      });
    }
  });

  // Healthcheck endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', brand: 'Mr. Perkins' });
  });

  let viteDevServer: ViteDevServer | null = null;
  if (process.env.NODE_ENV !== 'production') {
    viteDevServer = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
  }

  // Intercept requests with ?product=ID to inject dynamic Open Graph meta tags (og:image, og:title, etc.)
  app.get('/', async (req, res, next) => {
    const productId = req.query.product as string;
    if (!productId) return next();

    let product = cachedProducts.find(
      (p) => String(p.id).toLowerCase() === String(productId).toLowerCase()
    );

    if (!product) {
      const refreshed = await fetchAndCacheProducts();
      product = refreshed.find(
        (p) => String(p.id).toLowerCase() === String(productId).toLowerCase()
      );
    }

    if (!product) return next();

    try {
      let rawHtml = '';
      if (process.env.NODE_ENV !== 'production') {
        const indexPath = path.join(process.cwd(), 'index.html');
        rawHtml = fs.readFileSync(indexPath, 'utf-8');
      } else {
        const distIndexPath = path.join(process.cwd(), 'dist', 'index.html');
        rawHtml = fs.readFileSync(distIndexPath, 'utf-8');
      }

      const pTitle = `${product.producto} (${product.marca}) - MR. PERKINS`;
      const pDesc = `🔥 ¡Mirá ${product.producto} en MR. PERKINS! Marca: ${product.marca} | ${product.cantidad} | Precio: $${product.precioVenta.toLocaleString('es-AR')} ARS. ${product.descripcion || ''}`;
      const pImg = formatImageUrl(product.imgUrl);
      const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'https';
      const host = req.headers['x-forwarded-host'] || req.get('host');
      const fullUrl = `${protocol}://${host}/?product=${encodeURIComponent(product.id)}`;

      // Construct complete set of social Open Graph meta tags for WhatsApp/Facebook/Twitter previews
      const ogMetaTags = `
    <!-- Dynamic Product Social Preview Tags -->
    <title>${escapeHtml(pTitle)}</title>
    <meta property="og:type" content="product" />
    <meta property="og:site_name" content="MR. PERKINS" />
    <meta property="og:title" content="${escapeHtml(pTitle)}" />
    <meta property="og:description" content="${escapeHtml(pDesc)}" />
    <meta property="og:image" content="${escapeHtml(pImg)}" />
    <meta property="og:image:secure_url" content="${escapeHtml(pImg)}" />
    <meta property="og:image:url" content="${escapeHtml(pImg)}" />
    <meta property="og:image:type" content="image/jpeg" />
    <meta property="og:image:width" content="800" />
    <meta property="og:image:height" content="800" />
    <meta property="og:image:alt" content="${escapeHtml(product.producto)}" />
    <meta property="og:url" content="${escapeHtml(fullUrl)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeHtml(pTitle)}" />
    <meta name="twitter:description" content="${escapeHtml(pDesc)}" />
    <meta name="twitter:image" content="${escapeHtml(pImg)}" />
    <meta name="twitter:image:src" content="${escapeHtml(pImg)}" />
    <link rel="image_src" href="${escapeHtml(pImg)}" />
      `;

      let html = rawHtml
        .replace(/<title>.*?<\/title>/gi, '')
        .replace(/<meta\s+property="og:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '')
        .replace(/<meta\s+name="twitter:[^"]*"\s+content="[^"]*"\s*\/?>/gi, '')
        .replace(/<link\s+rel="image_src"[^>]*\/?>/gi, '');

      html = html.replace('<head>', `<head>\n${ogMetaTags}`);

      if (process.env.NODE_ENV !== 'production' && viteDevServer) {
        html = await viteDevServer.transformIndexHtml(req.originalUrl, html);
      }

      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.send(html);
    } catch (err) {
      console.error('Error serving product OpenGraph meta HTML:', err);
      return next();
    }
  });

  // Vite middleware for development vs production
  if (process.env.NODE_ENV !== 'production' && viteDevServer) {
    app.use(viteDevServer.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Mr. Perkins Server] Listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
