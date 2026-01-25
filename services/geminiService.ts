import { GoogleGenAI, Chat } from "@google/genai";
import { PRODUCTS } from "../constants";

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
  // Si estás probando esto localmente y no puedes configurar variables de entorno,
  // pega tu API KEY dentro de las comillas de abajo.
  // ¡IMPORTANTE! No subas este código con tu clave a GitHub.
  const manualKey = ''; 
  
  return manualKey;
};

const API_KEY = getApiKey();

// Helper para verificar configuración desde la UI
export const isApiKeyConfigured = (): boolean => {
  return !!API_KEY && API_KEY.length > 10;
};

let chatSession: Chat | null = null;

const createPerkinsSession = (exchangeRate: number = 1200): Chat => {
  // Aseguramos que la instancia se cree solo si hay API KEY
  if (!API_KEY) {
    throw new Error("API Key missing");
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Contexto de productos con precios aproximados en ARS
  const productContext = PRODUCTS.map(p => 
    `- ${p.nombre} (${p.genero}): aprox $${Math.round(p.precio_usd * exchangeRate).toLocaleString('es-AR')} ARS. Notas: ${p.tags_olfativos.join(', ')}`
  ).join('\n');

  return ai.chats.create({
    model: 'gemini-3-flash-preview',
    config: {
      systemInstruction: `
        Eres Mr. Perkins, un distinguido y lujoso sommelier de fragancias Lattafa en Argentina.
        
        CATÁLOGO (Precios en Pesos Argentinos):
        ${productContext}

        REGLAS:
        1. Sé EXTREMADAMENTE CONCISO. Máximo 2 oraciones cortas por respuesta.
        2. Tono: Elegante, servicial, "luxury".
        3. Si recomiendas un perfume, DEBES escribir su nombre exacto entre corchetes para mostrar la foto. Ejemplo: "Le recomiendo el exquisito [Ajwad] por sus notas dulces."
        4. No uses listas largas.
        5. Objetivo: Vender.
      `,
    },
  });
};

export const sendMessageToPerkins = async (message: string, currentExchangeRate: number): Promise<string> => {
  if (!API_KEY) {
    console.warn("API KEY no encontrada. Revisa services/geminiService.ts o la configuración de Vercel.");
    return "Disculpe, mis conexiones neuronales están en mantenimiento. (Error: Falta configurar la API KEY en Vercel. Agregue la variable de entorno VITE_API_KEY).";
  }

  try {
    if (!chatSession) {
      chatSession = createPerkinsSession(currentExchangeRate);
    }

    const response = await chatSession.sendMessage({ message });
    return response.text || "Disculpe, no he podido procesar su solicitud.";
  } catch (error) {
    console.error("Error talking to Perkins:", error);
    // Reiniciar sesión en caso de error
    chatSession = null;
    return "Mil disculpas, ha ocurrido un error de comunicación. Intente nuevamente.";
  }
};