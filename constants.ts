
import { Product } from './types';

// Images for Mr. Perkins
export const PERKINS_IMAGES = {
  LOGO: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Logob.png",
  HOLA: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Hola.png",
  COMPARA: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Compara_Fragancia.png",
  EXCELENTE_2: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Excelente_2.png",
  EXCELENTE_3: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Excelente_3.png",
  EXPLICA_2: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Explica_2png.png",
  EXCELENTE: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Excelentepng.png",
  FRAGANCIA: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Fragancia.png",
  EXPLICA: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Explica.png",
  FRAGANCIA_3: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Fragancia3.png",
  FRAGANCIA_4: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Fragancia4.png",
  LOTENGO: "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Gestos/Lotengo.png",
};

// Base URL for product images in Supabase
const PRODUCT_IMAGES_BASE_URL = "https://xnvaqwwcfmpybhodcipl.supabase.co/storage/v1/object/public/PERKINS/Productos/";

// Helper to determine brand and format name from filename
const parseProductFromFilename = (filename: string, defaultPrice: number = 35, defaultGender: string = 'Unisex', defaultTags: string[] = ['importado', 'exclusivo']) => {
  const nameWithoutExt = filename.replace('.jpg', '');
  let brand = '';
  let name = '';

  if (nameWithoutExt.startsWith('Maison_Alhambra')) {
    brand = 'Maison Alhambra';
    name = nameWithoutExt.replace('Maison_Alhambra_', '').replace(/_/g, ' ');
  } else if (nameWithoutExt.startsWith('Al_Haramain')) {
    brand = 'Al Haramain';
    name = nameWithoutExt.replace('Al_Haramain_', '').replace(/_/g, ' ');
  } else if (nameWithoutExt.startsWith('French_Avenue')) {
    brand = 'French Avenue';
    name = nameWithoutExt.replace('French_Avenue_', '').replace(/_/g, ' ');
  } else if (nameWithoutExt.startsWith('Club_De_Nuit')) { 
    brand = 'Armaf';
    name = nameWithoutExt.replace(/_/g, ' ');
  } else if (nameWithoutExt.startsWith('Afnan')) { 
    brand = 'Afnan';
    name = nameWithoutExt.replace('Afnan_', '').replace(/_/g, ' ');
  } else if (nameWithoutExt.startsWith('Rasasi')) { 
    brand = 'Rasasi';
    name = nameWithoutExt.replace('Rasasi_', '').replace(/_/g, ' ');
  } else if (nameWithoutExt.startsWith('Armaf')) { 
    brand = 'Armaf';
    name = nameWithoutExt.replace('Armaf_', '').replace(/_/g, ' ');
  } else {
    const parts = nameWithoutExt.split('_');
    brand = parts[0];
    name = parts.slice(1).join(' ');
  }

  // Refine Gender Guess
  let gender = defaultGender;
  const lowerName = name.toLowerCase();
  if (lowerName.includes('women') || lowerName.includes('femme') || lowerName.includes('her') || lowerName.includes('lady') || lowerName.includes('pour femme')) gender = 'Mujer';
  if (lowerName.includes('men') || lowerName.includes('homme') || lowerName.includes('him') || lowerName.includes('male') || lowerName.includes('pour homme')) gender = 'Hombre';

  return {
    marca: brand,
    nombre: name,
    presentacion_ml: 100,
    genero: gender,
    precio_usd: defaultPrice,
    tags_olfativos: defaultTags,
    imageFile: filename,
    stock: 12, // Stock base saludable
    margin_retail: 50,
    margin_wholesale: 15
  };
};

// DATOS ORIGINALES RESTAURADOS Y AMPLIADOS
const CATALOG_DATA: Record<string, Partial<Product>> = {
  // --- LATTAFA ---
  "Lattafa_Ajwad.jpg": { precio_usd: 22, genero: "Unisex", tags_olfativos: ["dulce", "frutal", "almizcle"], stock: 20 },
  "Lattafa_Al_Qiam_Gold.jpg": { precio_usd: 28, genero: "Hombre", tags_olfativos: ["ambarado", "amaderado", "oud"], stock: 10 },
  "Lattafa_Angham.jpg": { precio_usd: 26, genero: "Unisex", tags_olfativos: ["dulce", "afrutado", "especiado"], stock: 15 },
  "Lattafa_Asad.jpg": { precio_usd: 24, genero: "Hombre", tags_olfativos: ["especiado", "vainilla", "tabaco"], stock: 50 },
  "Lattafa_Asad_Zanzibar.jpg": { precio_usd: 25, genero: "Hombre", tags_olfativos: ["coco", "marino", "fresco"], stock: 30 },
  "Lattafa_Bade'e_Al_Oud_Honor_&_Glory.jpg": { precio_usd: 28, genero: "Unisex", tags_olfativos: ["piña", "cremoso", "oud"], stock: 25 },
  "Lattafa_Bade'e_Al_Oud_Oud_for_Glory.jpg": { precio_usd: 26, genero: "Unisex", tags_olfativos: ["oud", "oscuro", "especiado"], stock: 40 },
  "Lattafa_Bade'e_Al_Oud_Sublime.jpg": { precio_usd: 26, genero: "Unisex", tags_olfativos: ["manzana", "rosa", "dulce"], stock: 18 },
  "Lattafa_Eclaire.jpg": { precio_usd: 35, genero: "Mujer", tags_olfativos: ["caramelo", "leche", "miel"], stock: 12 },
  "Lattafa_Fakhar.jpg": { precio_usd: 22, genero: "Hombre", tags_olfativos: ["fresco", "aromatico", "yuzu"], stock: 35 },
  "Lattafa_Fakhar_Gold_Extract.jpg": { precio_usd: 24, genero: "Unisex", tags_olfativos: ["tuberosa", "solar", "ambar"], stock: 15 },
  "Lattafa_Haya_Women.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["champagne", "fresa", "floral"], stock: 22 },
  "Lattafa_Khamrah.jpg": { precio_usd: 28, genero: "Unisex", tags_olfativos: ["datil", "canela", "vainilla"], stock: 60 },
  "Lattafa_Khamrah_Qahwa.jpg": { precio_usd: 30, genero: "Unisex", tags_olfativos: ["cafe", "cardamomo", "gourmand"], stock: 45 },
  "Lattafa_Mayar.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["litchi", "frambuesa", "floral"], stock: 18 },
  "Lattafa_Qaed_Al_Fursan.jpg": { precio_usd: 19, genero: "Unisex", tags_olfativos: ["piña", "azafran", "amaderado"], stock: 30 },
  "Lattafa_Yara.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["tropical", "cremoso", "vainilla"], stock: 80 },
  "Lattafa_Yara_Candy.jpg": { precio_usd: 26, genero: "Mujer", tags_olfativos: ["gominola", "frutal", "dulce"], stock: 25 },
  "Lattafa_Yara_Moi.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["jazmin", "melocoton", "caramelo"], stock: 20 },
  "Lattafa_Yara_Tous.jpg": { precio_usd: 25, genero: "Mujer", tags_olfativos: ["mango", "coco", "maracuya"], stock: 30 },
  "Lattafa_Teriaq.jpg": { precio_usd: 40, genero: "Unisex", tags_olfativos: ["miel", "almendra", "cuero"], stock: 10 },
  "Lattafa_Pride_Nebras.jpg": { precio_usd: 35, genero: "Unisex", tags_olfativos: ["cacao", "vainilla", "tonka"], stock: 15 },
  
  // --- AFNAN ---
  "Afnan_9_AM_Dive.jpg": { precio_usd: 32, genero: "Unisex", tags_olfativos: ["fresco", "azul", "citrico"], stock: 20 },
  "Afnan_9_PM.jpg": { precio_usd: 30, genero: "Hombre", tags_olfativos: ["vainilla", "manzana", "fiesta"], stock: 40 },
  
  // --- AL HARAMAIN ---
  "Al_Haramain_Amber_Oud_Gold.jpg": { precio_usd: 60, genero: "Unisex", tags_olfativos: ["frutal", "almizcle", "dulce"], stock: 15 },
  "Al_Haramain_Amber_Oud_Ruby.jpg": { precio_usd: 65, genero: "Unisex", tags_olfativos: ["almendra", "azafran", "maderas"], stock: 8 },
  
  // --- ARMAF ---
  "Armaf_Club_De_Nuit_Intense_Man.jpg": { precio_usd: 35, genero: "Hombre", tags_olfativos: ["limon", "abedul", "ahumado"], stock: 100 },
  "Armaf_Club_De_Nuit_Women.jpg": { precio_usd: 32, genero: "Mujer", tags_olfativos: ["rosa", "patchouli", "citrico"], stock: 20 },
  "Armaf_Club_De_Nuit_Untold.jpg": { precio_usd: 55, genero: "Unisex", tags_olfativos: ["azafran", "ambergris", "dupe BR540"], stock: 25 },
  "Armaf_Club_De_Nuit_Iconic.jpg": { precio_usd: 45, genero: "Hombre", tags_olfativos: ["azul", "citrico", "incienso"], stock: 15 },
  
  // --- RASASI ---
  "Rasasi_Hawas_HIM.jpg": { precio_usd: 50, genero: "Hombre", tags_olfativos: ["ciruela", "acuatico", "canela"], stock: 30 },
  "Rasasi_Hawas_Ice.jpg": { precio_usd: 55, genero: "Hombre", tags_olfativos: ["menta", "hielo", "frutal"], stock: 20 },

  // --- FRENCH AVENUE ---
  "French_Avenue_Liquid_Brun.jpg": { precio_usd: 45, genero: "Hombre", tags_olfativos: ["cardamomo", "vainilla", "elegante"], stock: 10 },
  
  // --- MAISON ALHAMBRA ---
  "Maison_Alhambra_Jean_Lowe_Immortal.jpg": { precio_usd: 28, genero: "Hombre", tags_olfativos: ["jengibre", "ambar", "citrico"], stock: 18 },
  "Maison_Alhambra_Kismet_Angel.jpg": { precio_usd: 25, genero: "Unisex", tags_olfativos: ["coñac", "canela", "haba tonka"], stock: 22 },
};

// LISTA COMPLETA DE ARCHIVOS PARA EL MAPEO
const FILES_LIST = [
  "Afnan_9_AM_Dive.jpg", "Afnan_9_AM_Yellow.jpg", "Afnan_9_PM.jpg", "Afnan_9_PM_Elixir.jpg", 
  "Afnan_9_PM_Pour_Femme.jpg", "Afnan_9_PM_Rebel.jpg", 
  "Al_Haramain_Amber_Oud_Aqua_Dubai_Extrait.jpg", "Al_Haramain_Amber_Oud_Dubai_Night.jpg", "Al_Haramain_Amber_Oud_Gold.jpg", 
  "Armaf_Arabians_Sky.jpg", "Armaf_Beach_Party.jpg", "Armaf_Club_De_Nuit_Iconic.jpg", 
  "Armaf_Club_De_Nuit_Intense_Man.jpg", "Armaf_Club_De_Nuit_Precieux.jpg", "Armaf_Club_De_Nuit_Untold.jpg", 
  "Armaf_Club_De_Nuit_Urban_Elixir.jpg", "Armaf_Club_De_Nuit_Women.jpg", 
  "Armaf_Odyssey_Aqua.jpg", "Armaf_Odyssey_Bahamas.jpg", "Armaf_Odyssey_Candee.jpg", 
  "Armaf_Odyssey_Homme.jpg", "Armaf_Odyssey_Homme_White_Edition.jpg", "Armaf_Odyssey_Limoni_Fresh.jpg", 
  "Armaf_Odyssey_Mandarin_Sky.jpg", "Armaf_Odyssey_Mandarin_Sky_Elixir.jpg", "Armaf_Odyssey_Mango.jpg", "Armaf_Odyssey_Mega.jpg", 
  "Bharara_King.jpg", "Emper_Stallion_53.jpg", 
  "French_Avenue_Liquid_Brun.jpg", "French_Avenue_Spectre_GHOST.jpg", "French_Avenue_Vulcan_Feu.jpg", 
  "Lattafa_Ajwad.jpg", "Lattafa_Al_Qiam_Gold.jpg", "Lattafa_Angham.jpg", "Lattafa_Art_Of_Universe_Pride.jpg", 
  "Lattafa_Asad.jpg", "Lattafa_Asad_Bourbon.jpg", "Lattafa_Asad_Elixir.jpg", "Lattafa_Asad_Zanzibar.jpg", 
  "Lattafa_Bade'e_Al_Oud_Honor_&_Glory.jpg", "Lattafa_Bade'e_Al_Oud_Noble_Blush.jpg", "Lattafa_Bade'e_Al_Oud_Oud_for_Glory.jpg", "Lattafa_Bade'e_Al_Oud_Sublime.jpg", 
  "Lattafa_Confidential_Private_Gold.jpg", "Lattafa_Eclaire.jpg", "Lattafa_Eclaire_Banoffi.jpg", "Lattafa_Emaan.jpg", 
  "Lattafa_Fakhar.jpg", "Lattafa_Fakhar_Gold_Extract.jpg", "Lattafa_Fakhar_Platin.jpg", 
  "Lattafa_Haya_Women.jpg", "Lattafa_Khamrah.jpg", "Lattafa_Khamrah_Dukhan.jpg", "Lattafa_Khamrah_Qahwa.jpg", "Lattafa_Kit_Yara_Collection.jpg", 
  "Lattafa_Mayar.jpg", "Lattafa_Mayar_Cherry.jpg", "Lattafa_Mayar_Natural_Intense.jpg", 
  "Lattafa_Musaman_White_Intense.jpg", "Lattafa_Pride_Nebras.jpg", "Lattafa_Pride_Pisa.jpg", 
  "Lattafa_Qaed_Al_Fursan.jpg", "Lattafa_Qaed_Al_Fursan_Unlimited.jpg", "Lattafa_Radio_Vintage.jpg", 
  "Lattafa_Sakeena.jpg", "Lattafa_Teriaq.jpg", "Lattafa_The_Kingdom.jpg", "Lattafa_Victoria.jpg", 
  "Lattafa_Yara.jpg", "Lattafa_Yara_Candy.jpg", "Lattafa_Yara_Elixir.jpg", "Lattafa_Yara_Moi.jpg", "Lattafa_Yara_Tous.jpg", 
  "Maison_Alhambra_Glacier_Bold.jpg", "Maison_Alhambra_Glacier_Gold.jpg", "Maison_Alhambra_Jean_Lowe_Immortal.jpg", 
  "Maison_Alhambra_Philos_Pura.jpg", "Maison_Alhambra_Salvo.jpg", "Maison_Alhambra_Your_Touch_Intense.jpg", 
  "Rasasi_Hawas_Fire.jpg", "Rasasi_Hawas_HER.jpg", "Rasasi_Hawas_HIM.jpg", "Rasasi_Hawas_Ice.jpg", 
  "Rave_Now.jpg", "Rave_Now_Women.jpg", "Rayhaan_Tropical_Vibe.jpg", "Xerjoff_Erba_Pura.jpg", "Zimaya_Tiramisu_Caramel.jpg", "Zimaya_Tiramisu_Coco.jpg"
];

const RAW_PRODUCTS = FILES_LIST.map(file => {
  const basicInfo = parseProductFromFilename(file);
  
  // Sobrescribir con datos específicos si existen en el catálogo
  if (CATALOG_DATA[file]) {
    return { ...basicInfo, ...CATALOG_DATA[file] };
  }
  
  return basicInfo;
});

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p) => ({
    ...p,
    // ID robusto basado en el nombre del archivo para consistencia
    id: p.imageFile.replace('.jpg', '').replace(/[^a-zA-Z0-9-_]/g, ''), 
    image: `${PRODUCT_IMAGES_BASE_URL}${p.imageFile}`
}));
