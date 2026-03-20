import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Menu, User as UserIcon, LogOut, Store, LayoutDashboard, X, Home, Info, Tag, Package } from 'lucide-react';
import { ViewMode, User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
  user: User | null;
  onLogout: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, currentView, onNavigate, cartItemCount = 0, onOpenCart, user, onLogout
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleNavigate = (view: ViewMode) => {
    onNavigate(view);
    setIsMobileMenuOpen(false);
  };

  const navLinks = [
    { view: 'shop' as ViewMode, label: 'Shop', icon: Store },
    { view: 'inventory' as ViewMode, label: 'Catalog', icon: Package },
    { view: 'offers' as ViewMode, label: 'Deals', icon: Tag },
    { view: 'about' as ViewMode, label: 'About', icon: Info },
  ];

  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 font-sans selection:bg-brand-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-50/80 backdrop-blur-md border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 sm:h-20">
            
            <div className="flex items-center space-x-3 sm:space-x-4">
               {/* Mobile Menu Trigger */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="md:hidden p-2 hover:bg-brand-100 rounded-full transition"
                aria-label="Open menu"
              >
                <Menu className="w-6 h-6 text-brand-700" />
              </button>
              
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => handleNavigate('landing')}
              >
                <div className="w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center text-white font-serif italic">
                  A
                </div>
                <span className="font-serif text-xl sm:text-2xl font-semibold tracking-wide text-brand-900">
                  Aura
                </span>
              </div>
            </div>

            <div className="hidden md:flex space-x-8 text-sm uppercase tracking-widest font-medium text-brand-600">
              {navLinks.map(({ view, label }) => (
                <button 
                  key={view}
                  onClick={() => handleNavigate(view)} 
                  className={`hover:text-brand-900 transition ${currentView === view ? 'text-brand-900 underline underline-offset-4' : ''}`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-2 sm:space-x-4">
              {/* Cart Icon - Show on most pages except maybe CRM/Auth */}
              {currentView !== 'crm' && (
                <button 
                  onClick={onOpenCart}
                  className="p-2 hover:bg-brand-100 rounded-full transition relative group"
                  aria-label="Open cart"
                >
                  <ShoppingBag className="w-5 h-5" />
                  {cartItemCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-brand-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}

              {user ? (
                <div className="flex items-center gap-2 sm:gap-3 pl-2 border-l border-brand-200">
                  <button 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-2 group"
                  >
                     <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full border border-brand-200 group-hover:border-brand-400 transition" />
                     <span className="text-sm font-medium hidden sm:block group-hover:text-brand-700">{user.name.split(' ')[0]}</span>
                  </button>
                  
                  {user.role === 'admin' && currentView !== 'crm' && (
                    <button 
                      onClick={() => handleNavigate('crm')}
                      className="text-xs bg-brand-800 text-white px-3 py-1.5 rounded-full hover:bg-brand-700 transition hidden sm:block"
                      title="CRM Dashboard"
                    >
                      <LayoutDashboard size={14} />
                    </button>
                  )}
                  
                  <button 
                    onClick={onLogout}
                    className="p-2 text-brand-400 hover:text-brand-800 hover:bg-brand-100 rounded-full transition hidden sm:block"
                    title="Logout"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={() => handleNavigate('auth')}
                  className={`flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-brand-300 rounded-full hover:bg-brand-800 hover:text-white transition-all ${currentView === 'auth' ? 'bg-brand-800 text-white' : ''}`}
                >
                  <UserIcon className="w-4 h-4" />
                  <span className="hidden sm:inline">Sign In</span>
                </button>
              )}

              {currentView === 'crm' && user?.role === 'admin' && (
                <button 
                  onClick={() => handleNavigate('shop')}
                  className="flex items-center gap-2 px-3 sm:px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-brand-800 text-white rounded-full hover:bg-brand-700 transition-all"
                >
                  <Store className="w-4 h-4" />
                  <span className="hidden sm:inline">View Boutique</span>
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60] md:hidden"
            />

            {/* Drawer */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 w-[280px] bg-white shadow-2xl z-[61] md:hidden flex flex-col"
            >
              {/* Drawer Header */}
              <div className="p-6 border-b border-brand-100 flex items-center justify-between bg-brand-50">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center text-white font-serif italic">
                    A
                  </div>
                  <span className="font-serif text-xl font-semibold text-brand-900">Aura</span>
                </div>
                <button 
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 hover:bg-brand-200 rounded-full transition"
                  aria-label="Close menu"
                >
                  <X size={20} className="text-brand-600" />
                </button>
              </div>

              {/* User Section (if logged in) */}
              {user && (
                <div className="p-4 border-b border-brand-100 bg-brand-50/50">
                  <button 
                    onClick={() => handleNavigate('profile')}
                    className="flex items-center gap-3 w-full"
                  >
                    <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-brand-200" />
                    <div className="text-left">
                      <p className="font-medium text-brand-900">{user.name}</p>
                      <p className="text-xs text-brand-500">{user.role === 'admin' ? 'Administrator' : 'View Profile'}</p>
                    </div>
                  </button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="flex-1 overflow-y-auto py-4">
                <div className="px-4 mb-2">
                  <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Menu</span>
                </div>
                
                <button
                  onClick={() => handleNavigate('landing')}
                  className={`w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors ${
                    currentView === 'landing' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'
                  }`}
                >
                  <Home size={20} />
                  <span className="font-medium">Home</span>
                </button>

                {navLinks.map(({ view, label, icon: Icon }) => (
                  <button
                    key={view}
                    onClick={() => handleNavigate(view)}
                    className={`w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors ${
                      currentView === view ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'
                    }`}
                  >
                    <Icon size={20} />
                    <span className="font-medium">{label}</span>
                  </button>
                ))}

                {/* Admin CRM Link */}
                {user?.role === 'admin' && (
                  <>
                    <div className="px-4 mt-6 mb-2">
                      <span className="text-[10px] font-bold text-brand-400 uppercase tracking-widest">Admin</span>
                    </div>
                    <button
                      onClick={() => handleNavigate('crm')}
                      className={`w-full flex items-center gap-4 px-6 py-3.5 text-left transition-colors ${
                        currentView === 'crm' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'
                      }`}
                    >
                      <LayoutDashboard size={20} />
                      <span className="font-medium">CRM Dashboard</span>
                    </button>
                  </>
                )}
              </div>

              {/* Bottom Section */}
              <div className="p-4 border-t border-brand-100">
                {user ? (
                  <button 
                    onClick={() => {
                      onLogout();
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition font-medium"
                  >
                    <LogOut size={18} />
                    Sign Out
                  </button>
                ) : (
                  <button 
                    onClick={() => handleNavigate('auth')}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-900 text-white rounded-lg hover:bg-brand-800 transition font-medium"
                  >
                    <UserIcon size={18} />
                    Sign In
                  </button>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-brand-900 text-brand-100 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            <div className="col-span-2 md:col-span-1 space-y-4">
              <span className="font-serif text-2xl text-white">Aura</span>
              <p className="text-sm text-brand-300 leading-relaxed">
                Crafting memories through scent. 
                Experience the ethereal beauty of nature's finest ingredients.
              </p>
            </div>
            <div>
              <h4 className="font-serif text-lg text-white mb-4 sm:mb-6">Collections</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-brand-300">
                <li onClick={() => onNavigate('shop')} className="hover:text-white cursor-pointer transition">Signature</li>
                <li onClick={() => onNavigate('shop')} className="hover:text-white cursor-pointer transition">Seasonal</li>
                <li onClick={() => onNavigate('shop')} className="hover:text-white cursor-pointer transition">Home Fragrance</li>
                <li onClick={() => onNavigate('shop')} className="hover:text-white cursor-pointer transition">Gift Sets</li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-lg text-white mb-4 sm:mb-6">Client Care</h4>
              <ul className="space-y-2 sm:space-y-3 text-sm text-brand-300">
                <li onClick={() => onNavigate('about')} className="hover:text-white cursor-pointer transition">Contact Us</li>
                <li onClick={() => onNavigate('about')} className="hover:text-white cursor-pointer transition">Shipping & Returns</li>
                <li onClick={() => onNavigate('inventory')} className="hover:text-white cursor-pointer transition">Browse Catalog</li>
                <li onClick={() => onNavigate('profile')} className="hover:text-white cursor-pointer transition">Track Order</li>
              </ul>
            </div>
            <div className="col-span-2 md:col-span-1">
              <h4 className="font-serif text-lg text-white mb-4 sm:mb-6">Newsletter</h4>
              <p className="text-sm text-brand-300 mb-4">Join our inner circle for exclusive olfactory experiences.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-brand-800 border-none text-white text-sm px-4 py-2.5 rounded-md w-full focus:ring-1 focus:ring-brand-400 outline-none placeholder:text-brand-500"
                />
                <button className="bg-brand-100 text-brand-900 px-4 py-2.5 rounded-md text-sm font-medium hover:bg-white transition whitespace-nowrap">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="mt-12 sm:mt-16 pt-8 border-t border-brand-800 text-center text-xs text-brand-400">
            &copy; {new Date().getFullYear()} Aura Parfumerie. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
