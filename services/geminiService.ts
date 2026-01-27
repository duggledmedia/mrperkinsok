import { GoogleGenAI, Chat } from "@google/genai";
import { Product } from "../types";

// Función para obtener la API KEY de forma segura en distintos entornos
const getApiKey = (): string => {
  // 1. Intenta leer variables de entorno estándar (Node/Vercel/Webpack)
  try {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
      return process.env.API_KEY;
    }
  } catch (e) {}

  // 2. Intenta leer variables de entorno de Vite
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_API_KEY;
    }
  } catch (e) {}

  // 3. FALLBACK MANUAL:
  const manualKey = ''; 
  
  return manualKey;
};

const API_KEY = getApiKey();

// Helper para verificar configuración desde la UI
export const isApiKeyConfigured = (): boolean => {
  return !!API_KEY && API_KEY.length > 10;
};

let chatSession: Chat | null = null;

// Modified to accept dynamic product list
const createPerkinsSession = (currentProducts: Product[], exchangeRate: number = 1200): Chat => {
  if (!API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Use the passed 'currentProducts' which includes CMS updates
  const productContext = currentProducts.map(p => {
    // Calculate approximate price based on current logic (assuming standard retail margin if not present)
    // Note: Perkins usually gives estimates, but we try to be accurate.
    const margin = p.margin_retail || 50;
    const finalPrice = Math.ceil(p.precio_usd * (1 + margin / 100) * exchangeRate);
    const stockStatus = p.stock <= 0 ? "(AGOTADO)" : "";
    
    return `- ${p.nombre} (${p.genero}) ${stockStatus}: aprox $${finalPrice.toLocaleString('es-AR')} ARS. Notas: ${p.tags_olfativos.join(', ')}`;
  }).join('\n');

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `
        Eres Mr. Perkins, un distinguido y lujoso sommelier de fragancias Lattafa en Argentina.
        
        CATÁLOGO ACTUALIZADO (Precios en Pesos Argentinos):
        ${productContext}

        REGLAS:
        1. Sé EXTREMADAMENTE CONCISO. Máximo 2 oraciones cortas por respuesta.
        2. Tono: Elegante, servicial, "luxury".
        3. Si el producto dice (AGOTADO), infórmalo amablemente.
        4. Si recomiendas un perfume, DEBES escribir su nombre exacto entre corchetes para mostrar la foto. Ejemplo: "Le recomiendo el exquisito [Ajwad] por sus notas dulces."
        5. Objetivo: Vender, resaltando exclusividad.
      `,
    },
  });
};

export const sendMessageToPerkins = async (message: string, currentExchangeRate: number, products: Product[]): Promise<string> => {
  if (!API_KEY) {
    console.warn("API KEY no encontrada.");
    return "Disculpe, mis conexiones neuronales están en mantenimiento. (Error: Falta configurar la API KEY en Vercel).";
  }

  try {
    // Always recreate session or update context if needed? 
    // For simplicity, we create a new session if products changed drastically, 
    // but here we simply recreate if null. To support dynamic price updates in same session, 
    // ideally we would send a system prompt update, but creating fresh session ensures latest data context.
    // Let's reset session if it doesn't exist or just create one.
    // NOTE: To properly reflect price changes instantly in an ongoing chat, we might need to recreate the session.
    // Let's stick to a singleton for continuity, but maybe we should allow reset.
    
    if (!chatSession) {
      chatSession = createPerkinsSession(products, currentExchangeRate);
    } 
    // If we wanted to force update context on every message, we would need to not use a singleton or use a tool.
    // For now, let's assume if the user refreshes they get new prices in chat. 
    // Or we can simple invalidate chatSession when entering the page.

    const response = await chatSession.sendMessage({ message });
    return response.text || "Disculpe, no he podido procesar su solicitud.";
  } catch (error) {
    console.error("Error talking to Perkins:", error);
    chatSession = null;
    return "Mil disculpas, ha ocurrido un error de comunicación. Intente nuevamente.";
  }
};