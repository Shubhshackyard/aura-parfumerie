import React, { useState, useEffect } from 'react';
import { About } from './components/About';
import { Auth } from './components/Auth';
import { CartDrawer } from './components/CartDrawer';
import { CrmDashboard } from './components/CrmDashboard';
import { Journal } from './components/Journal';
import { LandingPage } from './components/LandingPage';
import { Layout } from './components/Layout';
import { Offers } from './components/Offers';
import { InventoryOffers } from './components/InventoryOffers';
import { Shop } from './components/Shop';
import { UserProfile } from './components/UserProfile';
import { ViewMode, Product, CartItem, Order, User, Customer } from './types';
import { checkAuth, logout as authLogout } from './services/authService';
import { productsApi, ordersApi, usersApi } from './services/api';
import { MOCK_PRODUCTS, INITIAL_CUSTOMERS } from './constants';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<ViewMode>('landing');
  const [user, setUser] = useState<User | null>(null);
  
  // Data State
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>(INITIAL_CUSTOMERS);
  
  // Loading States
  const [isAuthChecking, setIsAuthChecking] = useState(true);
  const [isProductsLoading, setIsProductsLoading] = useState(true);
  const [isOrdersLoading, setIsOrdersLoading] = useState(false);
  
  // Error State
  const [error, setError] = useState<string | null>(null);
  
  // Cart State
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Check authentication on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        const result = await checkAuth();
        if (result.success && result.user) {
          setUser(result.user);
          // Navigate based on role
          if (result.user.role === 'admin') {
            setCurrentView('landing'); // Admins start at landing, can navigate to CRM
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
      } finally {
        setIsAuthChecking(false);
      }
    };

    initAuth();
  }, []);

  // Fetch products on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setIsProductsLoading(true);
      try {
        const result = await productsApi.getAll();
        if (result.success && result.products) {
          setProducts(result.products);
        } else {
          // Fallback to mock products if API fails
          console.warn('Failed to fetch products, using mock data:', result.error);
          setProducts(MOCK_PRODUCTS);
        }
      } catch (err) {
        console.error('Products fetch failed:', err);
        setProducts(MOCK_PRODUCTS);
      } finally {
        setIsProductsLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // Fetch user orders when user logs in
  useEffect(() => {
    const fetchOrders = async () => {
      if (!user) {
        setOrders([]);
        return;
      }

      setIsOrdersLoading(true);
      try {
        const result = await ordersApi.getAll();
        if (result.success && result.orders) {
          setOrders(result.orders);
        }
      } catch (err) {
        console.error('Orders fetch failed:', err);
      } finally {
        setIsOrdersLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  // Fetch customers for admin CRM
  useEffect(() => {
    const fetchCustomers = async () => {
      if (!user || user.role !== 'admin') {
        return;
      }

      try {
        const result = await usersApi.getAllCustomers();
        if (result.success && result.customers) {
          // Convert to Customer type format
          const formattedCustomers: Customer[] = result.customers.map(c => ({
            id: c.id,
            name: c.name,
            email: c.email,
            phone: c.phone,
            avatar: c.avatar,
            status: c.status,
            sentiment: c.sentiment,
            preferredNotes: c.preferredNotes,
            lastInteraction: c.lastInteraction,
            messages: c.messages || [],
            orders: c.orders,
          }));
          setCustomers(formattedCustomers.length > 0 ? formattedCustomers : INITIAL_CUSTOMERS);
        }
      } catch (err) {
        console.error('Customers fetch failed:', err);
        // Keep initial customers on error
      }
    };

    fetchCustomers();
  }, [user?.id, user?.role]);

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    // Navigate based on role
    const nextView = newUser.role === 'admin' ? 'landing' : 'shop';
    setCurrentView(nextView);
  };

  const handleLogout = () => {
    authLogout();
    setUser(null);
    setOrders([]);
    setCartItems([]);
    setCurrentView('landing');
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
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

  const handleUpdateCartQuantity = (variantId: string, quantity: number) => {
    setCartItems(prev => 
      prev.map(item => 
        item.variantId === variantId 
          ? { ...item, quantity: Math.max(1, quantity) }
          : item
      )
    );
  };

  const handlePlaceOrder = async (details: { name: string; email: string; phone: string; address: string }) => {
    if (!user) {
      // Redirect to auth if not logged in
      setCurrentView('auth');
      return;
    }

    try {
      const result = await ordersApi.create(cartItems, details);
      
      if (result.success && result.order) {
        setOrders(prev => [result.order!, ...prev]);
        setCartItems([]);
        return result.order;
      } else {
        // Show specific error to user
        const errorMessage = result.error || 'Failed to place order';
        setError(errorMessage);
        console.error('Order creation failed:', errorMessage);
        return undefined;
      }
    } catch (err: any) {
      console.error('Place order failed:', err);
      setError(err?.message || 'Network error. Please try again.');
      return undefined;
    }
  };

  // Show loading screen while checking auth
  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-brand-600 font-medium">Loading Aura...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      currentView={currentView} 
      onNavigate={setCurrentView}
      cartItemCount={cartItems.reduce((sum, i) => sum + i.quantity, 0)}
      onOpenCart={() => setIsCartOpen(true)}
      user={user}
      onLogout={handleLogout}
    >
      {currentView === 'landing' && <LandingPage 
        products={products} 
        onAddToCart={handleAddToCart} 
        onNavigate={setCurrentView} 
        onOpenChat={() => alert('Scent quiz coming soon!')}
      />}
      
      {currentView === 'shop' && (
        <Shop 
          products={products} 
          onAddToCart={handleAddToCart} 
          isLoading={isProductsLoading}
        />
      )}
      
      {currentView === 'about' && <About />}

      {currentView === 'offers' && <Offers products={products} onAddToCart={handleAddToCart} />}

      {currentView === 'inventory' && (
        <Shop 
          products={products} 
          onAddToCart={handleAddToCart} 
          isLoading={isProductsLoading}
        />
      )}
      
      {currentView === 'journal' && <Journal />}

      {currentView === 'crm' && (
        user?.role === 'admin' ? (
          <CrmDashboard 
            customers={customers} 
            setCustomers={setCustomers}
            products={products} 
            setProducts={setProducts}
            orders={orders} 
            setOrders={setOrders}
          />
        ) : (
          <div className="flex flex-col items-center justify-center min-h-[50vh] text-brand-500">
            <h2 className="text-xl font-serif mb-4">Staff Access Only</h2>
            <p className="mb-6">Please log in with an administrator account to view the CRM.</p>
            <button 
              onClick={() => setCurrentView('auth')} 
              className="bg-brand-900 text-white px-6 py-2 rounded-lg"
            >
              Go to Login
            </button>
          </div>
        )
      )}

      {currentView === 'auth' && (
        <Auth onLogin={handleLogin} onCancel={() => setCurrentView('landing')} />
      )}

      {currentView === 'profile' && user && (
        <UserProfile 
          user={user} 
          orders={orders} 
          onUpdateUser={handleUpdateUser}
          onLogout={handleLogout}
          isOrdersLoading={isOrdersLoading}
        />
      )}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-4 py-3 rounded-lg shadow-lg z-50 flex items-center gap-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white/80 hover:text-white">
            ✕
          </button>
        </div>
      )}

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        items={cartItems}
        onRemove={handleRemoveFromCart}
        onUpdateQuantity={handleUpdateCartQuantity}
        onPlaceOrder={handlePlaceOrder}
        isLoggedIn={!!user}
        onLoginRequired={() => setCurrentView('auth')}
        user={user}
      />
    </Layout>
  );
};

export default App;
