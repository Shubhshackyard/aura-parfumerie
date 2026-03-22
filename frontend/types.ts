
export interface Message {
  id: string;
  sender: 'user' | 'agent' | 'system';
  content: string;
  timestamp: Date;
  channel?: 'web' | 'whatsapp' | 'telegram' | 'email';
}

export interface User {
  id: string;
  name: string;
  role: 'admin' | 'customer';
  email?: string;
  phone?: string;
  avatar?: string;
  address?: string;
  preferences?: string[];
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
  summary?: string;
  nextAction?: string;
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
  price: number;          // Base MRP per item
  image: string;
  offerString?: string;   // Original offer string like "180 for 2"
  category?: string;      // Product category
  maxStock?: number;      // Maximum available stock
}

export interface Order {
  id: string;
  customerDetails: {
    name: string;
    email: string;
    phone: string;
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

// Admin Order type with user details
export interface AdminOrder extends Order {
  userId: string;
  userEmail: string;
  userName: string;
}

export interface Offer {
  id: string;
  title: string;
  description: string;
  type: 'bundle' | 'discount';
  products: string[]; // product IDs
  discountPercentage: number;
  startDate?: string;
  endDate?: string;
  isActive: boolean;
}

export interface InventoryOffer {
  _id: string;
  id?: string;
  category: string;
  item: string;
  size: string;
  quantity: number;
  mrp: number;
  offer: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}



export type ViewMode = 'landing' | 'shop' | 'crm' | 'auth' | 'profile' | 'about' | 'journal' | 'concierge' | 'offers' | 'inventory';

export interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
}
