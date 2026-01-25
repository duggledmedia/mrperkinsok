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
// Filename format expected: Brand_Name_Of_Perfume.jpg
// Special cases: Maison_Alhambra, Al_Haramain, French_Avenue have underscores in brand name
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
  } else if (nameWithoutExt.startsWith('Club_De_Nuit')) { // Armaf sometimes starts with Club
    brand = 'Armaf';
    name = nameWithoutExt.replace(/_/g, ' ');
  } else {
    const parts = nameWithoutExt.split('_');
    brand = parts[0];
    name = parts.slice(1).join(' ');
  }

  // Refine Gender Guess
  let gender = defaultGender;
  const lowerName = name.toLowerCase();
  if (lowerName.includes('women') || lowerName.includes('femme') || lowerName.includes('her') || lowerName.includes('lady')) gender = 'Mujer';
  if (lowerName.includes('men') || lowerName.includes('homme') || lowerName.includes('him') || lowerName.includes('male')) gender = 'Hombre';

  return {
    marca: brand,
    nombre: name,
    presentacion_ml: 100, // Default
    genero: gender,
    precio_usd: defaultPrice,
    tags_olfativos: defaultTags,
    imageFile: filename
  };
};

// Existing detailed data for Lattafa (preserved)
const LATTAFA_DATA: Record<string, Partial<Product>> = {
  "Lattafa_Ajwad.jpg": { precio_usd: 18, genero: "Unisex", tags_olfativos: ["oriental", "amaderado", "dulce", "vainilla"] },
  "Lattafa_Al_Qiam_Gold.jpg": { precio_usd: 24, genero: "Hombre", tags_olfativos: ["ambarado", "amaderado", "especiado"] },
  "Lattafa_Angham.jpg": { precio_usd: 26, genero: "Unisex", tags_olfativos: ["dulce", "afrutado", "almizcle"] },
  "Lattafa_Art_Of_Universe_Pride.jpg": { precio_usd: 37, genero: "Unisex", tags_olfativos: ["oriental", "amaderado", "floral"] },
  "Lattafa_Asad.jpg": { precio_usd: 24, genero: "Hombre", tags_olfativos: ["especiado", "vainilla", "amaderado"] },
  "Lattafa_Asad_Bourbon.jpg": { precio_usd: 30, genero: "Hombre", tags_olfativos: ["ambarado", "vainilla", "especiado"] },
  "Lattafa_Asad_Elixir.jpg": { precio_usd: 35, genero: "Hombre", tags_olfativos: ["oriental", "especiado", "amaderado"] },
  "Lattafa_Asad_Zanzibar.jpg": { precio_usd: 20, genero: "Hombre", tags_olfativos: ["oriental", "amaderado", "especiado"] },
  "Lattafa_Bade'e_Al_Oud_Honor_&_Glory.jpg": { precio_usd: 24, genero: "Unisex", tags_olfativos: ["oud", "resinoso", "amaderado"] },
  "Lattafa_Bade'e_Al_Oud_Noble_Blush.jpg": { precio_usd: 25, genero: "Mujer", tags_olfativos: ["oud", "dulce", "oriental"] },
  "Lattafa_Bade'e_Al_Oud_Oud_for_Glory.jpg": { precio_usd: 24, genero: "Unisex", tags_olfativos: ["oud", "amaderado", "oriental"] },
  "Lattafa_Bade'e_Al_Oud_Sublime.jpg": { precio_usd: 25, genero: "Unisex", tags_olfativos: ["oud", "dulce", "oriental"] },
  "Lattafa_Confidential_Private_Gold.jpg": { precio_usd: 19, genero: "Unisex", tags_olfativos: ["ambarado", "dulce", "oriental"] },
  "Lattafa_Eclaire.jpg": { precio_usd: 27, genero: "Mujer", tags_olfativos: ["floral", "dulce", "afrutado"] },
  "Lattafa_Eclaire_Banoffi.jpg": { precio_usd: 34, genero: "Mujer", tags_olfativos: ["gourmand", "vainilla", "dulce"] },
  "Lattafa_Emaan.jpg": { precio_usd: 24, genero: "Unisex", tags_olfativos: ["oriental", "amaderado", "almizcle"] },
  "Lattafa_Fakhar.jpg": { precio_usd: 25, genero: "Hombre", tags_olfativos: ["oriental", "amaderado", "especiado"] },
  "Lattafa_Fakhar_Gold_Extract.jpg": { precio_usd: 23, genero: "Unisex", tags_olfativos: ["dulce", "oriental", "amaderado"] },
  "Lattafa_Fakhar_Platin.jpg": { precio_usd: 24, genero: "Hombre", tags_olfativos: ["amaderado", "especiado", "fresco"] },
  "Lattafa_Haya_Women.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["floral", "afrutado", "dulce"] },
  "Lattafa_Khamrah.jpg": { precio_usd: 23, genero: "Unisex", tags_olfativos: ["gourmand", "vainilla", "canela"] },
  "Lattafa_Khamrah_Dukhan.jpg": { precio_usd: 21, genero: "Unisex", tags_olfativos: ["ahumado", "especiado", "oriental"] },
  "Lattafa_Khamrah_Qahwa.jpg": { precio_usd: 26, genero: "Unisex", tags_olfativos: ["cafe", "vainilla", "gourmand"] },
  "Lattafa_Mayar.jpg": { precio_usd: 26, genero: "Mujer", tags_olfativos: ["floral", "afrutado", "dulce"] },
  "Lattafa_Mayar_Cherry.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["cereza", "frutal", "dulce"] },
  "Lattafa_Mayar_Natural_Intense.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["floral", "dulce", "intenso"] },
  "Lattafa_Musaman_White_Intense.jpg": { precio_usd: 36, genero: "Unisex", tags_olfativos: ["amaderado", "oriental", "dulce"] },
  "Lattafa_Pride_Nebras.jpg": { precio_usd: 30, genero: "Unisex", tags_olfativos: ["vainilla", "cacao", "gourmand"] },
  "Lattafa_Pride_Pisa.jpg": { precio_usd: 41, genero: "Unisex", tags_olfativos: ["oriental", "amaderado", "dulce"] },
  "Lattafa_Qaed_Al_Fursan.jpg": { precio_usd: 19, genero: "Unisex", tags_olfativos: ["ananá", "amaderado", "oriental"] },
  "Lattafa_Qaed_Al_Fursan_Unlimited.jpg": { precio_usd: 19, genero: "Unisex", tags_olfativos: ["frutal", "amaderado"] },
  "Lattafa_Radio_Vintage.jpg": { precio_usd: 29, genero: "Hombre", tags_olfativos: ["amaderado", "especiado", "retro"] },
  "Lattafa_Sakeena.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["floral", "dulce", "oriental"] },
  "Lattafa_Teriaq.jpg": { precio_usd: 31, genero: "Unisex", tags_olfativos: ["oriental", "especiado", "amaderado"] },
  "Lattafa_Yara.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["floral", "cremoso", "dulce"] },
  "Lattafa_Yara_Candy.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["gourmand", "frutal", "dulce"] },
  "Lattafa_Yara_Elixir.jpg": { precio_usd: 39, genero: "Mujer", tags_olfativos: ["floral", "oriental", "dulce"] },
  "Lattafa_Yara_Moi.jpg": { precio_usd: 25, genero: "Mujer", tags_olfativos: ["floral", "dulce"] },
  "Lattafa_Yara_Tous.jpg": { precio_usd: 24, genero: "Mujer", tags_olfativos: ["floral", "afrutado", "dulce"] },
};

const FILES_LIST = [
  "Afnan_9_AM_Dive.jpg",
  "Afnan_9_AM_Yellow.jpg",
  "Afnan_9_PM.jpg",
  "Afnan_9_PM_Elixir.jpg",
  "Afnan_9_PM_Pour_Femme.jpg",
  "Afnan_9_PM_Rebel.jpg",
  "Al_Haramain_Amber_Oud_Aqua_Dubai_Extrait.jpg",
  "Al_Haramain_Amber_Oud_Dubai_Night.jpg",
  "Al_Haramain_Amber_Oud_Gold.jpg",
  "Armaf_Arabians_Sky.jpg",
  "Armaf_Beach_Party.jpg",
  "Armaf_Club_De_Nuit_Iconic.jpg",
  "Armaf_Club_De_Nuit_Intense_Man.jpg",
  "Armaf_Club_De_Nuit_Precieux.jpg",
  "Armaf_Club_De_Nuit_Untold.jpg",
  "Armaf_Club_De_Nuit_Urban_Elixir.jpg",
  "Armaf_Club_De_Nuit_Women.jpg",
  "Armaf_Odyssey_Aqua.jpg",
  "Armaf_Odyssey_Bahamas.jpg",
  "Armaf_Odyssey_Candee.jpg",
  "Armaf_Odyssey_Homme.jpg",
  "Armaf_Odyssey_Homme_White_Edition.jpg",
  "Armaf_Odyssey_Limoni_Fresh.jpg",
  "Armaf_Odyssey_Mandarin_Sky.jpg",
  "Armaf_Odyssey_Mandarin_Sky_Elixir.jpg",
  "Armaf_Odyssey_Mango.jpg",
  "Armaf_Odyssey_Mega.jpg",
  "Bharara_King.jpg",
  "Emper_Stallion_53.jpg",
  "French_Avenue_Liquid_Brun.jpg",
  "French_Avenue_Spectre_GHOST.jpg",
  "French_Avenue_Vulcan_Feu.jpg",
  "Lattafa_Ajwad.jpg",
  "Lattafa_Al_Qiam_Gold.jpg",
  "Lattafa_Angham.jpg",
  "Lattafa_Art_Of_Universe_Pride.jpg",
  "Lattafa_Asad.jpg",
  "Lattafa_Asad_Bourbon.jpg",
  "Lattafa_Asad_Elixir.jpg",
  "Lattafa_Asad_Zanzibar.jpg",
  "Lattafa_Bade'e_Al_Oud_Honor_&_Glory.jpg",
  "Lattafa_Bade'e_Al_Oud_Noble_Blush.jpg",
  "Lattafa_Bade'e_Al_Oud_Oud_for_Glory.jpg",
  "Lattafa_Bade'e_Al_Oud_Sublime.jpg",
  "Lattafa_Confidential_Private_Gold.jpg",
  "Lattafa_Eclaire.jpg",
  "Lattafa_Eclaire_Banoffi.jpg",
  "Lattafa_Emaan.jpg",
  "Lattafa_Fakhar.jpg",
  "Lattafa_Fakhar_Gold_Extract.jpg",
  "Lattafa_Fakhar_Platin.jpg",
  "Lattafa_Haya_Women.jpg",
  "Lattafa_Khamrah.jpg",
  "Lattafa_Khamrah_Dukhan.jpg",
  "Lattafa_Khamrah_Qahwa.jpg",
  "Lattafa_Kit_Yara_Collection.jpg",
  "Lattafa_Mayar.jpg",
  "Lattafa_Mayar_Cherry.jpg",
  "Lattafa_Mayar_Natural_Intense.jpg",
  "Lattafa_Musaman_White_Intense.jpg",
  "Lattafa_Pride_Nebras.jpg",
  "Lattafa_Pride_Pisa.jpg",
  "Lattafa_Qaed_Al_Fursan.jpg",
  "Lattafa_Qaed_Al_Fursan_Unlimited.jpg",
  "Lattafa_Radio_Vintage.jpg",
  "Lattafa_Sakeena.jpg",
  "Lattafa_Teriaq.jpg",
  "Lattafa_The_Kingdom.jpg",
  "Lattafa_Victoria.jpg",
  "Lattafa_Yara.jpg",
  "Lattafa_Yara_Candy.jpg",
  "Lattafa_Yara_Elixir.jpg",
  "Lattafa_Yara_Moi.jpg",
  "Lattafa_Yara_Tous.jpg",
  "Maison_Alhambra_Glacier_Bold.jpg",
  "Maison_Alhambra_Glacier_Gold.jpg",
  "Maison_Alhambra_Jean_Lowe_Immortal.jpg",
  "Maison_Alhambra_Philos_Pura.jpg",
  "Maison_Alhambra_Salvo.jpg",
  "Maison_Alhambra_Your_Touch_Intense.jpg",
  "Rasasi_Hawas_Fire.jpg",
  "Rasasi_Hawas_HER.jpg",
  "Rasasi_Hawas_HIM.jpg",
  "Rasasi_Hawas_Ice.jpg",
  "Rave_Now.jpg",
  "Rave_Now_Women.jpg",
  "Rayhaan_Tropical_Vibe.jpg",
  "Xerjoff_Erba_Pura.jpg",
  "Zimaya_Tiramisu_Caramel.jpg",
  "Zimaya_Tiramisu_Coco.jpg"
];

const RAW_PRODUCTS = FILES_LIST.map(file => {
  // Parse base info from filename
  const basicInfo = parseProductFromFilename(file);
  
  // Override with specific Lattafa data if available
  if (LATTAFA_DATA[file]) {
    return { ...basicInfo, ...LATTAFA_DATA[file] };
  }
  
  // Specific Price overrides for non-Lattafa popular items (estimates)
  if (file.includes("Club_De_Nuit")) return { ...basicInfo, precio_usd: 40 };
  if (file.includes("Hawas")) return { ...basicInfo, precio_usd: 50 };
  if (file.includes("Xerjoff")) return { ...basicInfo, precio_usd: 150, tags_olfativos: ["nicho", "frutal", "almizcle"] };
  if (file.includes("9_PM")) return { ...basicInfo, precio_usd: 30 };
  
  return basicInfo;
});

export const PRODUCTS: Product[] = RAW_PRODUCTS.map((p, index) => ({
    ...p,
    id: `prod-${index}`,
    image: `${PRODUCT_IMAGES_BASE_URL}${p.imageFile}`
}));