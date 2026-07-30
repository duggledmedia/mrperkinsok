import { Product } from '../types';

/**
 * Helper to fetch product image as a File for Web Share API
 */
async function fetchImageFile(imageUrl: string, fileName: string): Promise<File | null> {
  try {
    const res = await fetch(imageUrl, { mode: 'cors' });
    if (!res.ok) return null;
    const blob = await res.blob();
    const type = blob.type || 'image/jpeg';
    const ext = type.includes('png') ? 'png' : type.includes('webp') ? 'webp' : 'jpeg';
    return new File([blob], `${fileName}.${ext}`, { type });
  } catch (err) {
    console.warn('Could not fetch image for file sharing:', err);
    return null;
  }
}

/**
 * Copies product URL or uses Web Share API (attaching image file when supported)
 */
export async function shareProductLink(product: Product): Promise<{ success: boolean; method: string }> {
  const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
  const title = `MR. PERKINS - ${product.producto}`;
  const text = `🔥 ¡Mirá ${product.producto} (${product.marca}) por $${product.precioVenta.toLocaleString('es-AR')} en MR. PERKINS!\n\n🔗 ${url}`;

  if (navigator.share) {
    try {
      if (product.imgUrl && typeof navigator.canShare === 'function') {
        const imageFile = await fetchImageFile(product.imgUrl, product.producto.replace(/[^a-zA-Z0-9]/g, '_'));
        if (imageFile) {
          const shareData = {
            title,
            text,
            url,
            files: [imageFile]
          };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            return { success: true, method: 'native-file' };
          }
        }
      }

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
 * Formats WhatsApp direct share URL for a product without embedding raw image URL link in text
 */
export function getWhatsAppProductShareUrl(product: Product): string {
  const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;
  const text = encodeURIComponent(
    `🔥 *¡Mirá este producto en MR. PERKINS!*\n\n` +
    `*${product.producto}*\n` +
    `*Marca:* ${product.marca}\n` +
    `*Cantidad:* ${product.cantidad}\n` +
    `*Precio:* $${product.precioVenta.toLocaleString('es-AR')} ARS\n\n` +
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

  const defaultTitle = 'Mr. Perkins | Perfumes & Desodorantes';
  const defaultDesc = 'Las Mejores Fragancias.. Al mejor Precio. Perfumería importada y desodorantes de máxima concentración con envíos a todo el país.';
  const defaultImage = 'https://nzvatrocepzupcustphd.supabase.co/storage/v1/object/public/PERFUMES/Logis/logoix.png';

  document.title = product ? `${product.producto} - MR. PERKINS` : defaultTitle;

  const setMeta = (attrName: 'property' | 'name', attrVal: string, content: string) => {
    let tag = document.querySelector(`meta[${attrName}="${attrVal}"]`) as HTMLMetaElement;
    if (!tag) {
      tag = document.createElement('meta');
      tag.setAttribute(attrName, attrVal);
      document.head.appendChild(tag);
    }
    tag.content = content;
  };

  if (product) {
    const title = `${product.producto} - MR. PERKINS`;
    const desc = `${product.marca} (${product.cantidad}) - $${product.precioVenta.toLocaleString('es-AR')} ARS. ${product.descripcion || ''}`;
    const img = product.imgUrl;
    const url = `${window.location.origin}${window.location.pathname}?product=${encodeURIComponent(product.id)}`;

    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', desc);
    setMeta('property', 'og:image', img);
    setMeta('property', 'og:image:secure_url', img);
    setMeta('property', 'og:url', url);

    setMeta('name', 'twitter:title', title);
    setMeta('name', 'twitter:description', desc);
    setMeta('name', 'twitter:image', img);
  } else {
    setMeta('property', 'og:title', defaultTitle);
    setMeta('property', 'og:description', defaultDesc);
    setMeta('property', 'og:image', defaultImage);
    setMeta('property', 'og:image:secure_url', defaultImage);
    setMeta('property', 'og:url', window.location.href);

    setMeta('name', 'twitter:title', defaultTitle);
    setMeta('name', 'twitter:description', defaultDesc);
    setMeta('name', 'twitter:image', defaultImage);
  }
}
