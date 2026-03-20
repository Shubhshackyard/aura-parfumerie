import React, { useState } from 'react';
import { Layout } from './components/Layout';
import { LandingPage } from './components/LandingPage';
import { CrmDashboard } from './components/CrmDashboard';
import { ChatWidget } from './components/ChatWidget';
import { Shop } from './components/Shop';
import { CartDrawer } from './components/CartDrawer';
import { ViewMode, Customer, Message, Product, CartItem, Order } from './types';
import { INITIAL_CUSTOMERS, MOCK_PRODUCTS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Function to handle new messages from the public chat widget
  const handleNewChatMessage = (msg: Message) => {
    setCustomers(prev => {
      const targetCustomerId = 'c1'; 
      return prev.map(c => {
        if (c.id === targetCustomerId) {
          return {
            ...c,
            lastInteraction: new Date(),
            messages: [...c.messages, msg]
          };
        }
        return c;
      });
    });
  };

  // Cart Handlers
  const handleAddToCart = (item: CartItem) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.productId === item.productId && i.variantId === item.variantId);
      if (existing) {
        return prev.map(i => i.variantId === item.variantId ? { ...i, quantity: i.quantity + item.quantity } : i);
      }
      return [...prev, item];
    });
    setIsCartOpen(true);
  };

  const handleRemoveFromCart = (variantId: string) => {
    setCartItems(prev => prev.filter(i => i.variantId !== variantId));
  };

  const handlePlaceOrder = (details: { name: string; email: string; address: string }) => {
    const newOrder: Order = {
      id: `ORD-${Date.now().toString().slice(-6)}`,
      customerDetails: details,
      items: [...cartItems],
      total: cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      status: 'Pending',
      date: new Date()
    };

    setOrders(prev => [newOrder, ...prev]);
    setCartItems([]);
    
    // Also attach order to the customer history if they match email
    setCustomers(prev => prev.map(c => {
      if (c.email === details.email) {
        return { 
          ...c, 
          lastInteraction: new Date(),
          orders: [...(c.orders || []), newOrder] 
        };
      }
      return c;
    }));
  };

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      cartItemCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
      onOpenCart={() => setIsCartOpen(true)}
    >
      {currentView === 'landing' && (
        <>
          <LandingPage />
          <ChatWidget onNewMessage={handleNewChatMessage} />
        </>
      )}

      {currentView === 'shop' && (
        <>
          <Shop products={products} onAddToCart={handleAddToCart} />
          <ChatWidget onNewMessage={handleNewChatMessage} />
        </>
      )}
      
      {currentView === 'crm' && (
        <CrmDashboard 
          customers={customers} setCustomers={setCustomers}
          products={products} setProducts={setProducts}
          orders={orders} setOrders={setOrders}
        />
      )}

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onPlaceOrder={handlePlaceOrder}
      />
    </Layout>
  );
};

export default App;