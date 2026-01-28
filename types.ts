
export interface Product {
  id: string;
  marca: string;
  nombre: string;
  presentacion_ml: number;
  genero: string;
  precio_usd: number; // Ahora actua como COSTO BASE
  tags_olfativos: string[];
  image?: string;
  stock: number;
  margin_retail?: number; // Porcentaje de ganancia minorista
  margin_wholesale?: number; // Porcentaje de ganancia mayorista
  deleted?: boolean; // Para borrado lógico
}

export interface CartItem extends Product {
  quantity: number;
}

export type PaymentMethod = 'mercadopago' | 'cash';
export type ShippingMethod = 'caba' | 'interior' | 'pickup';

export interface Order {
  id: string;
  googleEventId?: string; // ID del evento en Google Calendar para actualizaciones
  items: CartItem[];
  total: number;
  cost?: number; // Costo total de la mercadería al momento de la compra
  customerName: string;
  phone?: string;
  address: string;
  city?: string; // Localidad
  deliveryDate: string;
  deliveryTime?: string; // Horario de entrega
  shippingCost?: number; // Costo de envío
  payShippingNow?: boolean; // Si el envío se pagó con la compra
  status: 'pending' | 'shipped' | 'delivered' | 'cancelled';
  timestamp: number;
  type: 'retail' | 'wholesale'; // Tipo de orden
  paymentMethod: PaymentMethod;
  shippingMethod: ShippingMethod;
  createdBy?: string; // Email del usuario que creó la orden
}

export interface PerkinsGesture {
  name: string;
  url: string;
}

export enum ChatRole {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  role: ChatRole;
  text: string;
}

// --- AUTH TYPES ---
export type UserRole = 'admin' | 'seller';

export interface User {
  email: string;
  pass: string;
  role: UserRole;
  name: string;
  active: boolean; // Para simular confirmación de email
}