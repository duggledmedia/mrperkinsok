import { Product, Brand, PaymentMethod } from '../types';

export const INITIAL_BRANDS: Brand[] = [
  {
    marca: 'Mr. Perkins',
    imgUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=300&auto=format&fit=crop&q=80',
    description: 'Nuestra línea exclusiva de perfumes de nicho y desodorantes de alta concentración.'
  },
  {
    marca: 'Paco Rabanne',
    imgUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=300&auto=format&fit=crop&q=80',
    description: 'Fragancias audaces, metálicas y seductoras.'
  },
  {
    marca: 'Dior',
    imgUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=300&auto=format&fit=crop&q=80',
    description: 'Elegancia clásica y sofisticación francesa.'
  },
  {
    marca: 'Carolina Herrera',
    imgUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=300&auto=format&fit=crop&q=80',
    description: 'Glamour neoyorquino y notas sensuales insuperables.'
  },
  {
    marca: 'Chanel',
    imgUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=300&auto=format&fit=crop&q=80',
    description: 'Iconos intemporales de la alta perfumería mundial.'
  },
  {
    marca: 'Giorgio Armani',
    imgUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=300&auto=format&fit=crop&q=80',
    description: 'Frescura marina y masculinidad refinada.'
  },
  {
    marca: 'Natura',
    imgUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=300&auto=format&fit=crop&q=80',
    description: 'Ingredientes naturales y sustentabilidad del Amazonas.'
  },
  {
    marca: 'Calvin Klein',
    imgUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=300&auto=format&fit=crop&q=80',
    description: 'Minimalismo moderno y fragancias unisex urbanas.'
  }
];

export const INITIAL_PRODUCTS: Product[] = [
  {
    id: '1',
    stock: 'Si',
    producto: 'Mr. Perkins Black Elixir EdP',
    marca: 'Mr. Perkins',
    cantidad: '100 ml',
    tipo: 'Perfume',
    genero: 'Masculino',
    precioVenta: 78500,
    descripcion: 'Edición limitada Mr. Perkins. Notas intensas de ámbar negro, cuero toscano y bergamota ahumada. Alta fijación de 14 horas.',
    clasificacion: ['Amaderado', 'Intenso', 'Noche', 'Nicho', 'Cuero'],
    imgUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '2',
    stock: 'Si',
    producto: '1 Million Royal Eau de Parfum',
    marca: 'Paco Rabanne',
    cantidad: '100 ml',
    tipo: 'Perfume',
    genero: 'Masculino',
    precioVenta: 135000,
    descripcion: 'Una mezcla extravagante de madera de cedro fresco y lavanda con toques de benzoin radiante. Expresá tu individualidad.',
    clasificacion: ['Dulce', 'Amaderado', 'Fiesta', 'Ambarado'],
    imgUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '3',
    stock: 'Si',
    producto: 'Sauvage Elixir',
    marca: 'Dior',
    cantidad: '60 ml',
    tipo: 'Perfume',
    genero: 'Masculino',
    precioVenta: 189000,
    descripcion: 'Un perfume de concentración extraordinaria. Esencia de lavanda a medida, especias picantes y licor de maderas raras.',
    clasificacion: ['Especiado', 'Amaderado', 'Fresco', 'Noche'],
    imgUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '4',
    stock: 'No',
    producto: 'Good Girl Blush EdP',
    marca: 'Carolina Herrera',
    cantidad: '80 ml',
    tipo: 'Perfume',
    genero: 'Femenino',
    precioVenta: 142000,
    descripcion: 'Reinventa el icónico stiletto. Una explosión floral sensual con doble dosis de vainilla y peonías frescas.',
    clasificacion: ['Floral', 'Vainilla', 'Dulce', 'Elegante'],
    imgUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '5',
    stock: 'Si',
    producto: 'Mr. Perkins Citrus & Cedar Body Deodorant',
    marca: 'Mr. Perkins',
    cantidad: '150 ml',
    tipo: 'Desodorante',
    genero: 'Unisex',
    precioVenta: 18500,
    descripcion: 'Desodorante en aerosol con tecnología antibacteriana de 48 horas. Sin aluminio, fragancia fresca de limón de Sicilia y cedro.',
    clasificacion: ['Fresco', 'Citrico', 'Diario', 'Sin Aluminio'],
    imgUrl: 'https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '6',
    stock: 'Si',
    producto: 'Bleu de Chanel Parfum',
    marca: 'Chanel',
    cantidad: '100 ml',
    tipo: 'Perfume',
    genero: 'Masculino',
    precioVenta: 210000,
    descripcion: 'La elegancia suprema. Cítricos aromáticos seguidos por madera de sándalo de Nueva Caledonia extremadamente refinada.',
    clasificacion: ['Amaderado', 'Aromático', 'Oficina', 'Lujo'],
    imgUrl: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '7',
    stock: 'Si',
    producto: 'Acqua Di Giò Profondo',
    marca: 'Giorgio Armani',
    cantidad: '125 ml',
    tipo: 'Perfume',
    genero: 'Masculino',
    precioVenta: 165000,
    descripcion: 'Una inmersión profunda en el océano. Notas marinas intensas, mandarina verde y esencias aromáticas mediterráneas.',
    clasificacion: ['Acuático', 'Fresco', 'Verano', 'Cítrico'],
    imgUrl: 'https://images.unsplash.com/photo-1615397349754-cfa2066a298e?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '8',
    stock: 'Si',
    producto: 'Natura Homem Potence Desodorante Corporal',
    marca: 'Natura',
    cantidad: '100 ml',
    tipo: 'Desodorante',
    genero: 'Masculino',
    precioVenta: 16900,
    descripcion: 'Protección diaria con la fragancia intensa de Homem Potence. Sándalo, haba tonka y pimienta negra.',
    clasificacion: ['Amaderado', 'Especiado', 'Diario', 'Cuerpo'],
    imgUrl: 'https://images.unsplash.com/photo-1585386959984-a4155224a1ad?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '9',
    stock: 'No',
    producto: 'CK One Eau de Toilette',
    marca: 'Calvin Klein',
    cantidad: '200 ml',
    tipo: 'Colonia',
    genero: 'Unisex',
    precioVenta: 95000,
    descripcion: 'La icónica fragancia revolucionaria unisex. Notas de té verde, papaya y bergamota con un fondo suave de almizcle.',
    clasificacion: ['Unisex', 'Fresco', 'Cítrico', 'Casual'],
    imgUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '10',
    stock: 'Si',
    producto: 'Mr. Perkins Velvet Rose Mist',
    marca: 'Mr. Perkins',
    cantidad: '120 ml',
    tipo: 'Body Spray',
    genero: 'Femenino',
    precioVenta: 24900,
    descripcion: 'Bruma corporal perfumada hidratante con agua de rosas orgánicas, peonía y notas de frambuesa silvestre.',
    clasificacion: ['Floral', 'Fresco', 'Bruma', 'Hidratante'],
    imgUrl: 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '11',
    stock: 'Si',
    producto: '212 VIP Black EdP',
    marca: 'Carolina Herrera',
    cantidad: '100 ml',
    tipo: 'Perfume',
    genero: 'Masculino',
    precioVenta: 139000,
    descripcion: 'Fragancia nocturna con notas electrizantes de absenta, lavanda y vainilla negra ahumada.',
    clasificacion: ['Noche', 'Fiesta', 'Dulce', 'Aromático'],
    imgUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&auto=format&fit=crop&q=80'
  },
  {
    id: '12',
    stock: 'Si',
    producto: 'Fame Parfum',
    marca: 'Paco Rabanne',
    cantidad: '80 ml',
    tipo: 'Perfume',
    genero: 'Femenino',
    precioVenta: 148000,
    descripcion: 'Fragancia chipre afrutada con mango sucio, incienso puro y jazmín ultra-luminoso.',
    clasificacion: ['Frutal', 'Gourmand', 'Moda', 'Sensual'],
    imgUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80'
  }
];

export const INITIAL_PAYMENT_METHODS: PaymentMethod[] = [
  {
    medio_de_pago: 'Mercado Pago',
    desc_mp: 'Transferencia con CVU, saldo en cuenta o tarjetas de débito/crédito. Acreditación inmediata.',
    activo: 'Si'
  },
  {
    medio_de_pago: 'Tarjetas de Crédito (3 Cuotas sin Interés)',
    desc_mp: 'Hasta 3 cuotas fijas sin interés con Visa, Mastercard y American Express de todos los bancos.',
    activo: 'Si'
  },
  {
    medio_de_pago: 'Transferencia Bancaria / CBU',
    desc_mp: '10% de descuento EXTRA abonando por transferencia directa CBU/Alias. Envío inmediato.',
    activo: 'Si'
  },
  {
    medio_de_pago: 'Efectivo / Pago Contra Entrega',
    desc_mp: 'Pagá al recibir en CABA y GBA o retirando en nuestro punto de entrega exclusivo.',
    activo: 'Si'
  }
];
