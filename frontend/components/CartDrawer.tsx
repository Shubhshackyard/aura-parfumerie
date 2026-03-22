import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, ArrowRight, ShoppingBag, CheckCircle, Phone, Mail, User, MapPin, Plus, Minus, Sparkles, Tag } from 'lucide-react';
import { CartItem, Order, User as UserType } from '../types';
import { calculateOfferPrice, getOfferNudge, parseOffer, formatPrice } from '../utils/offerUtils';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  onRemove: (variantId: string) => void;
  onUpdateQuantity: (variantId: string, quantity: number) => void;
  onPlaceOrder: (details: { name: string; email: string; phone: string; address: string }) => void;
  isLoggedIn?: boolean;
  onLoginRequired?: () => void;
  user?: UserType | null;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ 
  isOpen, onClose, items, onRemove, onUpdateQuantity, onPlaceOrder, isLoggedIn = true, onLoginRequired, user 
}) => {
  const [step, setStep] = useState<'cart' | 'checkout' | 'success'>('cart');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Pre-fill form data from user profile when checkout starts
  useEffect(() => {
    if (step === 'checkout' && user) {
      setFormData(prev => ({
        ...prev,
        name: prev.name || user.name || '',
        email: prev.email || user.email || '',
        phone: prev.phone || user.phone || '',
        address: prev.address || '',
      }));
    }
  }, [step, user]);

  // Calculate totals with offer pricing
  const cartCalculation = useMemo(() => {
    let originalTotal = 0;
    let finalTotal = 0;
    const itemCalculations: Array<{
      item: CartItem;
      originalPrice: number;
      finalPrice: number;
      savings: number;
      offerApplied: boolean;
      nudge: { show: boolean; itemsNeeded: number; potentialSavings: number; message: string };
    }> = [];

    items.forEach(item => {
      const originalPrice = item.price * item.quantity;
      originalTotal += originalPrice;

      if (item.offerString) {
        const calc = calculateOfferPrice(item.quantity, item.price, item.offerString);
        const nudge = getOfferNudge(item.quantity, item.price, item.offerString);
        finalTotal += calc.finalTotal;
        itemCalculations.push({
          item,
          originalPrice,
          finalPrice: calc.finalTotal,
          savings: calc.savings,
          offerApplied: calc.offerApplied,
          nudge,
        });
      } else {
        finalTotal += originalPrice;
        itemCalculations.push({
          item,
          originalPrice,
          finalPrice: originalPrice,
          savings: 0,
          offerApplied: false,
          nudge: { show: false, itemsNeeded: 0, potentialSavings: 0, message: '' },
        });
      }
    });

    return {
      originalTotal,
      finalTotal,
      totalSavings: originalTotal - finalTotal,
      itemCalculations,
    };
  }, [items]);

  const total = cartCalculation.finalTotal;

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    }
    
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s+\-()]{8,}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    
    if (!formData.address.trim()) {
      newErrors.address = 'Street address is required';
    }
    
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }
    
    if (!formData.zipCode.trim()) {
      newErrors.zipCode = 'ZIP/Postal code is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    // Combine address fields into single string
    const fullAddress = [
      formData.address,
      formData.city,
      formData.state,
      formData.zipCode,
      formData.country
    ].filter(Boolean).join(', ');

    onPlaceOrder({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      address: fullAddress
    });
    setStep('success');
  };

  const handleClose = () => {
    onClose();
    // Reset state after transition
    setTimeout(() => {
      setStep('cart');
      setErrors({});
    }, 500);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
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
                {step === 'cart' ? 'Your Selection' : step === 'checkout' ? 'Checkout' : 'Order Confirmed'}
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
                    <div className="space-y-4">
                      {cartCalculation.itemCalculations.map(({ item, originalPrice, finalPrice, savings, offerApplied, nudge }) => (
                        <div key={`${item.productId}-${item.variantId}`} className="bg-white border border-brand-100 rounded-xl p-4">
                          <div className="flex gap-4">
                            <div className="w-20 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                              <img src={item.image} alt={item.productName} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start gap-2">
                                <div className="min-w-0">
                                  <h3 className="font-serif text-brand-900 truncate">{item.productName}</h3>
                                  <p className="text-xs text-brand-500 truncate">{item.variantName}</p>
                                  {item.offerString && (
                                    <span className="inline-flex items-center gap-1 text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full mt-1">
                                      <Tag size={10} />
                                      {item.offerString}
                                    </span>
                                  )}
                                </div>
                                <button 
                                  onClick={() => onRemove(item.variantId)}
                                  className="text-brand-300 hover:text-red-500 transition flex-shrink-0"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              
                              {/* Price and MRP */}
                              <div className="mt-2 text-xs text-brand-500">
                                {formatPrice(item.price)} each
                              </div>
                              
                              {/* Quantity Controls */}
                              <div className="mt-3 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => onUpdateQuantity(item.variantId, Math.max(1, item.quantity - 1))}
                                    className="w-8 h-8 flex items-center justify-center border border-brand-200 rounded-lg hover:bg-brand-50 transition"
                                    disabled={item.quantity <= 1}
                                  >
                                    <Minus size={14} className={item.quantity <= 1 ? 'text-brand-300' : ''} />
                                  </button>
                                  <span className="w-8 text-center font-medium text-brand-900">{item.quantity}</span>
                                  <button
                                    onClick={() => onUpdateQuantity(item.variantId, item.quantity + 1)}
                                    className="w-8 h-8 flex items-center justify-center border border-brand-200 rounded-lg hover:bg-brand-50 transition"
                                    disabled={item.maxStock !== undefined && item.quantity >= item.maxStock}
                                  >
                                    <Plus size={14} className={item.maxStock !== undefined && item.quantity >= item.maxStock ? 'text-brand-300' : ''} />
                                  </button>
                                </div>
                                
                                {/* Item Total with Savings */}
                                <div className="text-right">
                                  {offerApplied && savings > 0 ? (
                                    <>
                                      <span className="line-through text-brand-400 text-sm mr-2">{formatPrice(originalPrice)}</span>
                                      <span className="font-semibold text-brand-900">{formatPrice(finalPrice)}</span>
                                    </>
                                  ) : (
                                    <span className="font-semibold text-brand-900">{formatPrice(finalPrice)}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Offer Applied Badge */}
                          {offerApplied && savings > 0 && (
                            <div className="mt-3 bg-green-50 border border-green-100 rounded-lg px-3 py-2 flex items-center gap-2">
                              <Sparkles size={14} className="text-green-600" />
                              <span className="text-xs text-green-700 font-medium">
                                Offer applied! You're saving {formatPrice(savings)}
                              </span>
                            </div>
                          )}
                          
                          {/* Nudge to Get Offer */}
                          {nudge.show && !offerApplied && (
                            <motion.div 
                              initial={{ opacity: 0, y: -10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-3 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2"
                            >
                              <p className="text-xs text-amber-700 font-medium flex items-center gap-1.5">
                                💡 {nudge.message}
                              </p>
                            </motion.div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {step === 'checkout' && (
                <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                  {/* Contact Information */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wide mb-4">Contact Information</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Full Name *
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                          <input 
                            type="text" 
                            placeholder="Enter your full name"
                            value={formData.name}
                            onChange={e => handleInputChange('name', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.name ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Email *
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                          <input 
                            type="email" 
                            placeholder="your@email.com"
                            value={formData.email}
                            onChange={e => handleInputChange('email', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.email ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Phone Number *
                        </label>
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                          <input 
                            type="tel" 
                            placeholder="+91 98765 43210"
                            value={formData.phone}
                            onChange={e => handleInputChange('phone', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.phone ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
                      </div>
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="mb-6">
                    <h3 className="text-sm font-bold text-brand-700 uppercase tracking-wide mb-4">Shipping Address</h3>
                    
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                          Street Address *
                        </label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 text-brand-400 w-4 h-4" />
                          <textarea 
                            rows={2}
                            placeholder="House/Flat No., Street, Landmark"
                            value={formData.address}
                            onChange={e => handleInputChange('address', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg pl-10 pr-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none resize-none ${
                              errors.address ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                        </div>
                        {errors.address && <p className="text-red-500 text-xs mt-1">{errors.address}</p>}
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            City *
                          </label>
                          <input 
                            type="text" 
                            placeholder="City"
                            value={formData.city}
                            onChange={e => handleInputChange('city', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.city ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                          {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            State/Province
                          </label>
                          <input 
                            type="text" 
                            placeholder="State"
                            value={formData.state}
                            onChange={e => handleInputChange('state', e.target.value)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            ZIP/Postal Code *
                          </label>
                          <input 
                            type="text" 
                            placeholder="ZIP Code"
                            value={formData.zipCode}
                            onChange={e => handleInputChange('zipCode', e.target.value)}
                            className={`w-full bg-brand-50 border rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none ${
                              errors.zipCode ? 'border-red-300' : 'border-brand-200'
                            }`}
                          />
                          {errors.zipCode && <p className="text-red-500 text-xs mt-1">{errors.zipCode}</p>}
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-brand-600 uppercase tracking-wider mb-1.5">
                            Country
                          </label>
                          <input 
                            type="text" 
                            placeholder="Country"
                            value={formData.country}
                            onChange={e => handleInputChange('country', e.target.value)}
                            className="w-full bg-brand-50 border border-brand-200 rounded-lg px-4 py-3 text-sm focus:ring-1 focus:ring-brand-400 outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Order Summary */}
                  <div className="bg-brand-50 p-4 rounded-lg">
                    <h4 className="font-serif text-brand-900 mb-3">Order Summary</h4>
                    <div className="space-y-2 text-sm">
                      {cartCalculation.itemCalculations.map(({ item, finalPrice, offerApplied }, idx) => (
                        <div key={idx} className="flex justify-between text-brand-600">
                          <span className="flex items-center gap-1">
                            {item.quantity}x {item.productName}
                            {offerApplied && <Tag size={10} className="text-green-600" />}
                          </span>
                          <span>{formatPrice(finalPrice)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-brand-200 mt-3 pt-3 space-y-1">
                      {cartCalculation.totalSavings > 0 && (
                        <>
                          <div className="flex justify-between text-sm text-brand-600">
                            <span>Subtotal (MRP)</span>
                            <span className="line-through">{formatPrice(cartCalculation.originalTotal)}</span>
                          </div>
                          <div className="flex justify-between text-sm text-green-600">
                            <span>Offer Savings</span>
                            <span>−{formatPrice(cartCalculation.totalSavings)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between text-sm text-brand-600">
                        <span>Subtotal</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                      <div className="flex justify-between text-sm text-brand-600">
                        <span>Shipping</span>
                        <span>Free</span>
                      </div>
                      <div className="flex justify-between font-bold text-brand-900 pt-2 border-t border-brand-200">
                        <span>Total</span>
                        <span>{formatPrice(total)}</span>
                      </div>
                    </div>
                  </div>
                </form>
              )}

              {step === 'success' && (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-6">
                    <CheckCircle size={32} />
                  </div>
                  <h3 className="font-serif text-2xl text-brand-900 mb-2">Order Placed!</h3>
                  <p className="text-brand-500 mb-4">
                    Thank you, {formData.name.split(' ')[0]}!
                  </p>
                  <p className="text-brand-400 text-sm mb-8 max-w-xs">
                    We'll send a confirmation to <span className="font-medium text-brand-600">{formData.email}</span> and notify you at <span className="font-medium text-brand-600">{formData.phone}</span> when your order ships.
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
                    {/* Savings Banner */}
                    {cartCalculation.totalSavings > 0 && (
                      <div className="bg-green-50 border border-green-100 rounded-lg px-4 py-2 flex items-center justify-between">
                        <span className="text-sm text-green-700 font-medium flex items-center gap-2">
                          <Sparkles size={16} />
                          You're saving
                        </span>
                        <span className="text-green-700 font-bold">{formatPrice(cartCalculation.totalSavings)}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between items-end">
                      <div>
                        <span className="text-sm text-brand-500 block">Total</span>
                        {cartCalculation.totalSavings > 0 && (
                          <span className="text-xs text-brand-400 line-through">{formatPrice(cartCalculation.originalTotal)}</span>
                        )}
                      </div>
                      <span className="text-2xl font-serif text-brand-900">{formatPrice(total)}</span>
                    </div>
                    {!isLoggedIn ? (
                      <button 
                        onClick={() => {
                          onClose();
                          onLoginRequired?.();
                        }}
                        className="w-full bg-brand-900 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-brand-800 transition"
                      >
                        Sign in to Checkout <ArrowRight size={18} />
                      </button>
                    ) : (
                      <button 
                        onClick={() => setStep('checkout')}
                        className="w-full bg-brand-900 text-white py-4 rounded-lg font-medium flex items-center justify-center gap-2 hover:bg-brand-800 transition"
                      >
                        Checkout <ArrowRight size={18} />
                      </button>
                    )}
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
