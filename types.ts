export interface Product {
  id: string;
  marca: string;
  nombre: string;
  presentacion_ml: number;
  genero: string;
  precio_usd: number;
  tags_olfativos: string[];
  image?: string;
  stock: number; // Added stock management
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