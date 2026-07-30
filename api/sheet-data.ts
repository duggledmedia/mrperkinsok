import type { Request, Response } from 'express';
import Papa from 'papaparse';

const SHEET_ID = '1Uhi-a3TPPsy1RFpzsCikX7hdRiEux5-piobX0vnwGhM';
const CATALOGO_GID = '809374575';

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
  if (!row) return 78500;
  
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

  return 78500;
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
    throw new Error(`HTTP ${response.status} fetching sheet`);
  }

  const text = await response.text();
  const parsed = Papa.parse(text, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false
  });

  return parsed.data as Record<string, string>[];
}

export default async function handler(req: Request, res: Response) {
  try {
    let catalogRows: Record<string, string>[] = [];
    try {
      catalogRows = await fetchCsvFromGoogleSheet({ gid: CATALOGO_GID });
    } catch {
      catalogRows = await fetchCsvFromGoogleSheet({ name: 'Catalogo' });
    }

    let marcasRows: Record<string, string>[] = [];
    try {
      marcasRows = await fetchCsvFromGoogleSheet({ name: 'Marcas' });
    } catch {}

    let mediosPagoRows: Record<string, string>[] = [];
    try {
      mediosPagoRows = await fetchCsvFromGoogleSheet({ name: 'MediosPago' });
    } catch {}

    const products = catalogRows.map((row, idx) => {
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

    const brandsMap = new Map<string, { marca: string; imgUrl: string }>();
    marcasRows.forEach((row) => {
      const marca = row['Marca'] || row['marca'] || '';
      const imgUrl = row['img_url'] || row['imgUrl'] || '';
      if (marca) brandsMap.set(marca.toLowerCase(), { marca, imgUrl });
    });

    products.forEach((p) => {
      if (p.marca && !brandsMap.has(p.marca.toLowerCase())) {
        brandsMap.set(p.marca.toLowerCase(), {
          marca: p.marca,
          imgUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80'
        });
      }
    });

    const paymentMethods = mediosPagoRows.map((row) => {
      const medio_de_pago = row['medio_de_pago'] || row['Medio de pago'] || row['Medio'] || '';
      const desc_mp = row['desc_mp'] || row['Descripción'] || row['Descripcion'] || '';
      const activoRaw = (row['activo'] || row['Activo'] || 'Si').trim();
      const activo = activoRaw.toLowerCase() === 'no' ? 'No' : 'Si';
      return { medio_de_pago, desc_mp, activo };
    }).filter(pm => Boolean(pm.medio_de_pago));

    return res.status(200).json({
      products,
      brands: Array.from(brandsMap.values()),
      paymentMethods,
      lastUpdated: new Date().toISOString(),
      isLive: true
    });
  } catch (error: any) {
    return res.status(500).json({ error: error?.message || 'Error fetching sheet' });
  }
}
