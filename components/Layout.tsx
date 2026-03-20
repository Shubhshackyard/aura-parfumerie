import React from 'react';
import { ShoppingBag, Menu, User, Sparkles, Store } from 'lucide-react';
import { ViewMode } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewMode;
  onNavigate: (view: ViewMode) => void;
  cartItemCount?: number;
  onOpenCart?: () => void;
}

export const Layout: React.FC<LayoutProps> = ({ 
  children, currentView, onNavigate, cartItemCount = 0, onOpenCart 
}) => {
  return (
    <div className="min-h-screen bg-brand-50 text-brand-900 font-sans selection:bg-brand-200">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-brand-50/80 backdrop-blur-md border-b border-brand-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            
            <div className="flex items-center space-x-4">
               {/* Mobile Menu Trigger (Visual only) */}
              <button className="md:hidden p-2 hover:bg-brand-100 rounded-full transition">
                <Menu className="w-6 h-6 text-brand-700" />
              </button>
              
              <div 
                className="flex items-center gap-2 cursor-pointer" 
                onClick={() => onNavigate('landing')}
              >
                <div className="w-8 h-8 bg-brand-800 rounded-full flex items-center justify-center text-white font-serif italic">
                  A
                </div>
                <span className="font-serif text-2xl font-semibold tracking-wide text-brand-900">
                  Aura
                </span>
              </div>
            </div>

            <div className="hidden md:flex space-x-8 text-sm uppercase tracking-widest font-medium text-brand-600">
              <button onClick={() => onNavigate('shop')} className={`hover:text-brand-900 transition ${currentView === 'shop' ? 'text-brand-900 underline underline-offset-4' : ''}`}>Shop</button>
              <a href="#" className="hover:text-brand-900 transition">About</a>
              <a href="#" className="hover:text-brand-900 transition">Journal</a>
              <a href="#" className="hover:text-brand-900 transition">Concierge</a>
            </div>

            <div className="flex items-center space-x-4">
              {(currentView === 'landing' || currentView === 'shop') ? (
                <>
                  <button 
                    onClick={onOpenCart}
                    className="p-2 hover:bg-brand-100 rounded-full transition relative group"
                  >
                    <ShoppingBag className="w-5 h-5" />
                    {cartItemCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-brand-700 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center">
                        {cartItemCount}
                      </span>
                    )}
                  </button>
                  <button 
                    onClick={() => onNavigate('crm')}
                    className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider border border-brand-300 rounded-full hover:bg-brand-800 hover:text-white transition-all"
                  >
                    <User className="w-4 h-4" />
                    Partner Login
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => onNavigate('shop')}
                  className="flex items-center gap-2 px-4 py-2 text-xs font-semibold uppercase tracking-wider bg-brand-800 text-white rounded-full hover:bg-brand-700 transition-all"
                >
                  <Store className="w-4 h-4" />
                  View Boutique
                </button>
              )}
            </div>

          </div>
        </div>
      </nav>

      <main className="relative">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-brand-900 text-brand-100 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="space-y-4">
              <span className="font-serif text-2xl text-white">Aura</span>
              <p className="text-sm text-brand-300 leading-relaxed">
                Crafting memories through scent. 
                Experience the ethereal beauty of nature's finest ingredients.
              </p>
            </div>
            <div>
              <h4 className="font-serif text-lg text-white mb-6">Collections</h4>
              <ul className="space-y-3 text-sm text-brand-300">
                <li className="hover:text-white cursor-pointer transition">Signature</li>
                <li className="hover:text-white cursor-pointer transition">Seasonal</li>
                <li className="hover:text-white cursor-pointer transition">Home Fragrance</li>
                <li className="hover:text-white cursor-pointer transition">Gift Sets</li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-lg text-white mb-6">Client Care</h4>
              <ul className="space-y-3 text-sm text-brand-300">
                <li className="hover:text-white cursor-pointer transition">Contact Concierge</li>
                <li className="hover:text-white cursor-pointer transition">Shipping & Returns</li>
                <li className="hover:text-white cursor-pointer transition">Scent Profiling</li>
                <li className="hover:text-white cursor-pointer transition">Track Order</li>
              </ul>
            </div>
            <div>
              <h4 className="font-serif text-lg text-white mb-6">Newsletter</h4>
              <p className="text-sm text-brand-300 mb-4">Join our inner circle for exclusive olfactory experiences.</p>
              <div className="flex gap-2">
                <input 
                  type="email" 
                  placeholder="Email address" 
                  className="bg-brand-800 border-none text-white text-sm px-4 py-2 rounded-md w-full focus:ring-1 focus:ring-brand-400 outline-none placeholder:text-brand-500"
                />
                <button className="bg-brand-100 text-brand-900 px-4 py-2 rounded-md text-sm font-medium hover:bg-white transition">
                  Join
                </button>
              </div>
            </div>
          </div>
          <div className="mt-16 pt-8 border-t border-brand-800 text-center text-xs text-brand-400">
            &copy; {new Date().getFullYear()} Aura Parfumerie. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};
