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

export interface Order {
  id: string;
  items: CartItem[];
  total: number;
  customerName: string;
  address: string;
  deliveryDate: string;
  status: 'pending' | 'shipped' | 'delivered';
  timestamp: number;
  type: 'retail' | 'wholesale'; // Tipo de orden
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