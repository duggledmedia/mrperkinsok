export interface Product {
  id: string;
  stock: 'Si' | 'No' | string;
  producto: string;
  marca: string;
  cantidad: string;
  tipo: string;
  genero: string;
  precioCosto?: number; // Never exposed to end users
  precioVenta: number;
  descripcion: string;
  clasificacion: string[]; // parsed tags
  imgUrl: string;
}

export interface Brand {
  marca: string;
  imgUrl: string;
  description?: string;
}

export interface PaymentMethod {
  medio_de_pago: string;
  desc_mp: string;
  activo: 'Si' | 'No' | string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface SheetData {
  products: Product[];
  brands: Brand[];
  paymentMethods: PaymentMethod[];
  lastUpdated: string;
  isLive: boolean;
  error?: string;
}

export interface FilterState {
  search: string;
  brand: string;
  type: string;
  gender: string;
  inStockOnly: boolean;
  tag: string;
  sortBy: 'price-asc' | 'price-desc' | 'name' | 'featured';
}
