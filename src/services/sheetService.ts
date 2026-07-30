import Papa from 'papaparse';
import { Product, Brand, PaymentMethod, SheetData } from '../types';
import { INITIAL_PRODUCTS, INITIAL_BRANDS, INITIAL_PAYMENT_METHODS } from '../data/mockData';

const SHEET_ID = '1Uhi-a3TPPsy1RFpzsCikX7hdRiEux5-piobX0vnwGhM';
const CATALOGO_GID = '809374575';

export function parseArgentinePrice(val: any): number {
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

export function extractPriceFromRow(row: Record<string, any>, idx: number): number {
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

  return INITIAL_PRODUCTS[idx % INITIAL_PRODUCTS.length]?.precioVenta || 78500;
}

async function fetchCsvFromUrl(url: string): Promise<Record<string, string>[]> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status} fetching CSV`);
  }
  const text = await response.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });
  return parsed.data as Record<string, string>[];
}

export async function fetchSheetDataClient(): Promise<SheetData> {
  // Try fetching Catalogo CSV
  let catalogRows: Record<string, string>[] = [];
  const catalogUrls = [
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=${CATALOGO_GID}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Catalogo')}`,
    `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv`
  ];

  for (const url of catalogUrls) {
    try {
      catalogRows = await fetchCsvFromUrl(url);
      if (catalogRows && catalogRows.length > 0) break;
    } catch (e) {
      console.warn('Attempt failed for catalog URL:', url, e);
    }
  }

  if (!catalogRows || catalogRows.length === 0) {
    throw new Error('No se pudo obtener el catálogo desde Google Sheets');
  }

  // Fetch Marcas
  let marcasRows: Record<string, string>[] = [];
  try {
    marcasRows = await fetchCsvFromUrl(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('Marcas')}`);
  } catch (e) {
    console.warn('No se pudo obtener hoja Marcas:', e);
  }

  // Fetch MediosPago
  let mediosPagoRows: Record<string, string>[] = [];
  try {
    mediosPagoRows = await fetchCsvFromUrl(`https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=${encodeURIComponent('MediosPago')}`);
  } catch (e) {
    console.warn('No se pudo obtener hoja MediosPago:', e);
  }

  // Process Products
  const products: Product[] = catalogRows.map((row, idx) => {
    const id = row['ID'] || row['id'] || String(idx + 1);
    const stockRaw = (row['Stock'] || row['stock'] || 'Si').trim();
    const stock = stockRaw.toLowerCase() === 'no' || stockRaw.toLowerCase() === 'false' || stockRaw.toLowerCase() === '0' ? 'No' : 'Si';
    const producto = row['Producto'] || row['producto'] || row['Nombre'] || '';
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
    const imgUrl = (row['img_url'] || row['imgUrl'] || row['Imagen'] || '').trim();

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
  }).filter(p => Boolean(p.producto) && Boolean(p.imgUrl));

  // Process Brands
  const brandsMap = new Map<string, Brand>();
  marcasRows.forEach((row) => {
    const marca = row['Marca'] || row['marca'] || '';
    const imgUrl = row['img_url'] || row['imgUrl'] || '';
    if (marca) {
      brandsMap.set(marca.toLowerCase(), { marca, imgUrl });
    }
  });

  // Ensure all product brands are included
  products.forEach((p) => {
    if (p.marca && !brandsMap.has(p.marca.toLowerCase())) {
      brandsMap.set(p.marca.toLowerCase(), {
        marca: p.marca,
        imgUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80'
      });
    }
  });

  const brands = Array.from(brandsMap.values());

  // Process Payment Methods
  const paymentMethods: PaymentMethod[] = mediosPagoRows.map((row) => {
    const medio_de_pago = row['medio_de_pago'] || row['Medio de pago'] || row['Medio'] || '';
    const desc_mp = row['desc_mp'] || row['Descripción'] || row['Descripcion'] || '';
    const activoRaw = (row['activo'] || row['Activo'] || 'Si').trim();
    const activo = activoRaw.toLowerCase() === 'no' ? 'No' : 'Si';
    return { medio_de_pago, desc_mp, activo };
  }).filter(pm => Boolean(pm.medio_de_pago));

  return {
    products: products.length > 0 ? products : INITIAL_PRODUCTS,
    brands: brands.length > 0 ? brands : INITIAL_BRANDS,
    paymentMethods: paymentMethods.length > 0 ? paymentMethods : INITIAL_PAYMENT_METHODS,
    lastUpdated: new Date().toISOString(),
    isLive: true
  };
}
