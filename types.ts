export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  channel?: 'web' | 'whatsapp' | 'telegram' | 'email';
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
  status: 'Lead' | 'Active' | 'VIP' | 'At Risk';
  sentiment: 'Positive' | 'Neutral' | 'Negative';
  preferredNotes: string[];
  lastInteraction: Date;
  messages: Message[];
  orders?: Order[];
}

export type ProductType = 'EDP' | 'Extrait' | 'Cologne' | 'Roll-on' | 'Candle' | 'Incense' | 'Diffuser' | 'Car Perfume';

export interface ProductVariant {
  id: string;
  name: string; // e.g. "50ml Bottle", "Travel Spray"
  type: ProductType;
  price: number;
  stock: number;
  sku: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  category: 'Fine Fragrance' | 'Home Collection' | 'Accessories';
  notes: string[];
  image: string;
  variants: ProductVariant[];
}

export interface CartItem {
  productId: string;
  variantId: string;
  quantity: number;
  productName: string;
  variantName: string;
  price: number;
  image: string;
}

export interface Order {
  id: string;
  customerDetails: {
    name: string;
    email: string;
    address: string;
  };
  items: CartItem[];
  total: number;
  status: 'Pending' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: Date;
}

export interface Campaign {
  id: string;
  name: string;
  status: 'Draft' | 'Scheduled' | 'Sent';
  targetSegment: 'All' | 'VIP' | 'Active' | 'Lead' | 'At Risk';
  subject: string;
  content: string;
  scheduledDate: Date;
  stats?: {
    sent: number;
    opened: number;
    clicked: number;
  };
}

export type ViewMode = 'landing' | 'shop' | 'crm' | 'auth';

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
}
