import { Product } from '../types';

/**
 * Copies text or uses Web Share API if supported
 */
export async function shareProductLink(product: Product): Promise<{ success: boolean; method: string }> {
  const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
  const title = `MR. PERKINS - ${product.producto}`;
  const text = `🔥 ¡Mirá ${product.producto} en MR. PERKINS! ${product.marca} (${product.cantidad}) por $${product.precioVenta.toLocaleString('es-AR')}.\n` +
    `Imagen: ${product.imgUrl}\n`;

  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url
      });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return { success: false, method: 'cancelled' };
      }
    }
  }

  // Fallback to clipboard
  try {
    await navigator.clipboard.writeText(url);
    return { success: true, method: 'clipboard' };
  } catch {
    // Legacy fallback
    const input = document.createElement('input');
    input.value = url;
    document.body.appendChild(input);
    input.select();
    document.execCommand('copy');
    document.body.removeChild(input);
    return { success: true, method: 'clipboard' };
  }
}

/**
 * Formats WhatsApp direct share URL for a product
 */
export function getWhatsAppProductShareUrl(product: Product): string {
  const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
  const text = encodeURIComponent(
    `🔥 *¡Mirá este producto en MR. PERKINS!*\n\n` +
    `*${product.producto}*\n` +
    `*Marca:* ${product.marca}\n` +
    `*Cantidad:* ${product.cantidad}\n` +
    `*Precio:* $${product.precioVenta.toLocaleString('es-AR')} ARS\n\n` +
    `🖼️ *Foto:* ${product.imgUrl}\n` +
    `🔗 *Ver en la web:* ${url}`
  );
  return `https://api.whatsapp.com/send?text=${text}`;
}

/**
 * Copies search query link or uses Web Share API
 */
export async function shareSearchLink(query: string, brand?: string): Promise<{ success: boolean; method: string }> {
  const params = new URLSearchParams();
  if (query) params.set('q', query);
  if (brand) params.set('brand', brand);

  const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
  const title = `MR. PERKINS - Catálogo de Fragancias`;
  const text = `🔎 Mirá los resultados de búsqueda "${query || brand}" en MR. PERKINS:`;

  if (navigator.share) {
    try {
      await navigator.share({ title, text, url });
      return { success: true, method: 'native' };
    } catch (err: any) {
      if (err.name === 'AbortError') return { success: false, method: 'cancelled' };
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    return { success: true, method: 'clipboard' };
  } catch {
    return { success: false, method: 'error' };
  }
}

/**
 * Updates dynamic meta tags for OpenGraph previews when viewing a product modal
 */
export function updateOpenGraphMeta(product: Product | null) {
  if (typeof document === 'undefined') return;

  const defaultTitle = 'MR. PERKINS | Perfumes Importados y Fragancias en Oferta';
  const defaultDesc = 'Tienda de perfumes importados, colonias y cosmética. Precios increíbles, 3 cuotas sin interés y envíos a todo el país.';
  const defaultImage = 'https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png';

  document.title = product ? `${product.producto} - MR. PERKINS` : defaultTitle;

  const setMeta = (property: string, content: string) => {
    let tag = document.querySelector(`meta[property="${property}"]`) as HTMLMetaElement;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute('property', property);
      document.head.appendChild(tag);
    }
    tag.content = content;
  };

  if (product) {
    setMeta('og:title', `${product.producto} - MR. PERKINS`);
    setMeta('og:description', `${product.marca} (${product.cantidad}) - $${product.precioVenta.toLocaleString('es-AR')} ARS. ${product.descripcion || ''}`);
    setMeta('og:image', product.imgUrl);
    setMeta('og:url', `${window.location.origin}${window.location.pathname}?product=${product.id}`);
  } else {
    setMeta('og:title', defaultTitle);
    setMeta('og:description', defaultDesc);
    setMeta('og:image', defaultImage);
    setMeta('og:url', window.location.href);
  }
}
