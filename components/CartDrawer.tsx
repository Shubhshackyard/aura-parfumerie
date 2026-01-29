import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, CreditCard, ArrowRight, ShoppingBag, CheckCircle } from 'lucide-react';
import { CartItem, Order } from '../types';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (variantId: string) => void;
  onPlaceOrder: (details: { name: string; email: string; address: string }) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, onClose, items, onRemove, onPlaceOrder 
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: 'Elena Fisher', // Pre-filled for demo
    email: 'elena@example.com',
    address: '123 Luxury Lane, Beverly Hills, CA 90210'
  });

  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onPlaceOrder(formData);
    setStep('success');
  };

  const handleClose = () => {
    onClose();
    // Reset state after transition
    setTimeout(() => setStep('cart'), 500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[70]"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl z-[71] flex flex-col"
          >
            <div className="p-6 border-b border-brand-100 flex items-center justify-between bg-brand-50">
              <h2 className="font-serif text-xl text-brand-900">
                {step === 'cart' ? 'Your Selection' : step === 'checkout' ? 'Secure Checkout' : 'Order Confirmed'}
              </h2>
              <button onClick={handleClose} className="p-2 hover:bg-brand-200 rounded-full transition">
                <X size={20} className="text-brand-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {step === 'cart' && (
                <>
                  {items.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-brand-400">
                      <ShoppingBag size={48} className="mb-4 opacity-50" />
                      <p>Your cart is empty.</p>
                      <button onClick={handleClose} className="mt-4 text-brand-800 font-medium underline">Start Shopping</button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {items.map((item) => (
                        <div key={`${item.productId}-${item.variantId}`} className="flex gap-4">
                          <div className="w-20 h-24 bg-gray-100 rounded-md overflow-hidden flex-shrink-0">
                            <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-serif text-brand-900">{item.productName}</h3>
                                <p className="text-xs text-brand-500">{item.variantName}</p>
                              </div>
                              <button 
                                onClick={() => onRemove(item.variantId)}
                                className="text-brand-300 hover:text-red-500 transition"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                            <div className="mt-4 flex justify-between items-center">
                               <span className="text-xs text-brand-400">Qty: {item.quantity}</span>
                               <span className="font-medium text-brand-900">${item.price * item.quantity}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 'checkout' && (
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Full Name</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={e => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Email</label>
                    <input 
                      required
                      type="email" 
                      value={formData.email}
                      onChange={e => setFormData({...formData, email: e.target.value})}
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-2">Shipping Address</label>
                    <textarea 
                      required
                      rows={3}
                      value={formData.address}
                      onChange={e => setFormData({...formData, address: e.target.value})}
                      className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                    />
                  </div>
                  
                  <div className="bg-brand-50 p-4 rounded-lg mt-6">
                    <h4 className="font-serif text-brand-900 mb-2">Order Summary</h4>
                    <div className="flex justify-between text-sm text-brand-600 mb-1">
                      <span>Subtotal</span>
                      <span>${total}</span>
                    </div>
                     <div className="flex justify-between text-sm text-brand-600 mb-3">
                      <span>Shipping</span>
                      <span>Free</span>
                    </div>
                    <div className="border-t border-brand-200 pt-2 flex justify-between font-bold text-brand-900">
                      <span>Total</span>
                      <span>${total}</span>
                    </div>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-serif text-2xl text-brand-900 mb-2">Order Placed</h3>
                  <p className="text-brand-500 mb-8">
                    Thank you, {formData.name}. Your order has been received and sent to our concierge team.
                  </p>
                  <button 
                    onClick={handleClose}
                    className="bg-brand-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-brand-800 transition"
                  >
                    Continue Shopping
                  </button>
                </div>
              )}
            </div>

            {step !== 'success' && items.length > 0 && (
              <div className="p-6 border-t border-brand-100 bg-white">
                {step === 'cart' ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-end">
                      <span className="text-sm text-brand-500">Total</span>
                      <span className="text-2xl font-serif text-brand-900">${total}</span>
                    </div>
                    <button 
                      onClick={() => setStep('checkout')}
                      className="w-full bg-brand-900 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-brand-800 transition"
                    >
                      Checkout <ArrowRight size={18} />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep('cart')}
                      className="flex-1 px-4 py-3 border border-brand-200 rounded-lg text-brand-600 font-medium hover:bg-brand-50 transition"
                    >
                      Back
                    </button>
                    <button 
                      form="checkout-form"
                      type="submit"
                      className="flex-[2] bg-brand-900 text-white py-3 rounded-lg font-medium hover:bg-brand-800 transition"
                    >
                      Place Order
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
