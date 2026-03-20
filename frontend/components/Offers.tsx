import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ShoppingBag, Sparkles, Flame, Car, Home, Package, Droplets, Loader2, Percent, X } from 'lucide-react';
import { CartItem, InventoryOffer } from '../types';
import { inventoryOffersApi } from '../services/api';
import { parseOffer, formatPrice, getOfferDescription } from '../utils/offerUtils';

const OFFER_CATEGORIES = ['All', 'Fine Fragrance', 'Home Collection', 'Accessories', 'Car Perfume', 'Personal Care'];
const ALLOWED_INVENTORY_CATEGORY_SET = new Set(['Car Perfume', 'Personal Care']);

interface OffersProps {
  products: any[]; // Keep for compatibility but we'll use inventory offers
  onAddToCart: (item: CartItem) => void;
}

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('candle')) return Flame;
  if (lower.includes('incense') || lower.includes('backflow')) return Sparkles;
  if (lower.includes('car')) return Car;
  if (lower.includes('floor') || lower.includes('home')) return Home;
  if (lower.includes('air') || lower.includes('freshner')) return Droplets;
  return Package;
};

// Category images
const getCategoryImage = (category: string): string => {
  const images: Record<string, string> = {
    'Candle': 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=400&h=500&fit=crop',
    'Incense Stick': 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=500&fit=crop',
    'Backflow': 'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=400&h=500&fit=crop',
    'Car Perfume': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=500&fit=crop',
    'Floor Cleaner': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=500&fit=crop',
    'Air Freshner': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=500&fit=crop',
    'Ceramic': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=500&fit=crop',
    'Extrait - 30%': 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=500&fit=crop',
    'Personal Care': 'https://thumbs.dreamstime.com/b/vertical-image-mock-up-amber-colored-glass-bottle-dropper-lid-beige-background-floral-shadow-face-vertical-243041191.jpg',
  };
  return images[category] || 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=500&fit=crop';
};

export const Offers: React.FC<OffersProps> = ({ onAddToCart }) => {
  const [inventoryOffers, setInventoryOffers] = useState<InventoryOffer[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedInventoryOffer, setSelectedInventoryOffer] = useState<InventoryOffer | null>(null);
  const [inventoryQuantity, setInventoryQuantity] = useState(1);

  // Fetch inventory offers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const offersResult = await inventoryOffersApi.getAll();

        if (offersResult.success && offersResult.inventoryOffers) {
          // Filter only items with offers and in stock
          const withOffers = offersResult.inventoryOffers.filter(
            o => o.offer && o.offer.trim() !== '' && o.quantity > 0
          );
          const filteredOffers = withOffers.filter(o =>
            ALLOWED_INVENTORY_CATEGORY_SET.has(o.category)
          );
          setInventoryOffers(filteredOffers);
        }
      } catch (err) {
        console.error('Failed to fetch offers:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const categories = OFFER_CATEGORIES;

  // Filter by category
  const filteredOffers = activeCategory === 'All'
    ? inventoryOffers
    : inventoryOffers.filter(o => o.category === activeCategory);

  // Group by offer type for better display
  const bundleOffers = filteredOffers.filter(o => {
    const parsed = parseOffer(o.offer);
    return parsed.type === 'bundle';
  });

  const percentOffers = filteredOffers.filter(o => {
    const parsed = parseOffer(o.offer);
    return parsed.type === 'percent';
  });

  const comboOffers = filteredOffers.filter(o => {
    const parsed = parseOffer(o.offer);
    return parsed.type === 'combo';
  });

  // Handle add to cart
  const handleAddToCart = (offer: InventoryOffer) => {
    const item: CartItem = {
      productId: offer._id,
      variantId: `${offer._id}-${offer.size}`,
      quantity: 1,
      productName: offer.item,
      variantName: `${offer.size}${offer.size !== 'Large' ? 'ml/g' : ''} - ${offer.category}`,
      price: offer.mrp,
      image: getCategoryImage(offer.category),
      offerString: offer.offer,
      category: offer.category,
      maxStock: offer.quantity,
    };
    onAddToCart(item);
  };

  // Modal functions
  const openInventoryOffer = (offer: InventoryOffer) => {
    setSelectedInventoryOffer(offer);
    setInventoryQuantity(1);
  };

  const closeInventoryModal = () => {
    setSelectedInventoryOffer(null);
    setInventoryQuantity(1);
  };

  const handleAddInventoryFromModal = () => {
    if (selectedInventoryOffer) {
      const item: CartItem = {
        productId: selectedInventoryOffer._id,
        variantId: `${selectedInventoryOffer._id}-${selectedInventoryOffer.size}`,
        quantity: inventoryQuantity,
        productName: selectedInventoryOffer.item,
        variantName: `${selectedInventoryOffer.size}${selectedInventoryOffer.size !== 'Large' ? 'ml/g' : ''} - ${selectedInventoryOffer.category}`,
        price: selectedInventoryOffer.mrp,
        image: getCategoryImage(selectedInventoryOffer.category),
        offerString: selectedInventoryOffer.offer,
        category: selectedInventoryOffer.category,
        maxStock: selectedInventoryOffer.quantity,
      };
      onAddToCart(item);
      closeInventoryModal();
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-brand-600 animate-spin" />
          <p className="text-brand-600 font-medium">Loading deals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-50 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-12">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-green-600 uppercase tracking-widest text-[10px] sm:text-xs font-bold"
          >
            Limited Time Offers
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-900 mt-3 sm:mt-4 mb-4 sm:mb-6"
          >
            Hot Deals & Bundles
          </motion.h1>
          <p className="text-brand-600 max-w-2xl mx-auto text-sm sm:text-lg font-light px-4">
            Save more when you buy bundles. Automatic discounts applied at checkout.
          </p>
        </div>

        {/* Category Filter */}
        <div className="relative mb-8 -mx-4 sm:mx-0">
          <div className="flex sm:justify-center gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide sm:flex-wrap">
            {categories.map(cat => {
              const Icon = cat === 'All' ? Tag : getCategoryIcon(cat);
              const count = cat === 'All'
                ? inventoryOffers.length
                : inventoryOffers.filter(o => o.category === cat).length;

              if (count === 0 && cat !== 'All') return null;

              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0
                    ${activeCategory === cat
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white text-brand-600 hover:bg-brand-100 border border-brand-100'
                    }`}
                >
                  <Icon size={14} />
                  {cat}
                  <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${activeCategory === cat ? 'bg-white/20' : 'bg-brand-100'
                    }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-brand-50 to-transparent pointer-events-none sm:hidden"></div>
        </div>

        {filteredOffers.length === 0 ? (
          <div className="text-center py-16 text-brand-400">
            <Tag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No deals available in this category</p>
            <p className="text-sm mt-2">Check back later for new offers</p>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-12"
            >
              {/* Bundle Offers */}
              {bundleOffers.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-green-100 rounded-lg">
                      <ShoppingBag size={20} className="text-green-700" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl text-brand-900">Bundle Deals</h2>
                      <p className="text-xs text-brand-500">Buy more, save more!</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {bundleOffers.map(offer => (
                      <OfferCard key={offer._id} offer={offer} onAddToCart={handleAddToCart} onOpenModal={openInventoryOffer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Percentage Discounts */}
              {percentOffers.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-red-100 rounded-lg">
                      <Percent size={20} className="text-red-700" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl text-brand-900">Percentage Discounts</h2>
                      <p className="text-xs text-brand-500">Flat discounts on every purchase</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {percentOffers.map(offer => (
                      <OfferCard key={offer._id} offer={offer} onAddToCart={handleAddToCart} onOpenModal={openInventoryOffer} />
                    ))}
                  </div>
                </div>
              )}

              {/* Combo Offers */}
              {comboOffers.length > 0 && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-purple-100 rounded-lg">
                      <Sparkles size={20} className="text-purple-700" />
                    </div>
                    <div>
                      <h2 className="font-serif text-xl sm:text-2xl text-brand-900">Combo Offers</h2>
                      <p className="text-xs text-brand-500">Special combo pricing</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
                    {comboOffers.map(offer => (
                      <OfferCard key={offer._id} offer={offer} onAddToCart={handleAddToCart} onOpenModal={openInventoryOffer} />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Promotional Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 sm:mt-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-6 sm:p-10 text-white text-center relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 opacity-10 transform rotate-12">
            <Sparkles size={200} />
          </div>
          <h3 className="font-serif text-2xl sm:text-3xl mb-3 relative z-10">Offers Auto-Applied!</h3>
          <p className="text-green-100 text-sm sm:text-base mb-6 max-w-lg mx-auto relative z-10">
            Add items to your cart and watch the savings add up automatically.
            The more you buy, the more you save!
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm relative z-10">
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              ✓ No coupon codes needed
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              ✓ Instant savings
            </div>
            <div className="bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
              ✓ Bundle automatically
            </div>
          </div>
        </motion.div>

        {/* Inventory Offer Modal */}
        <AnimatePresence>
          {selectedInventoryOffer && (() => {
            const offer = selectedInventoryOffer;
            const parsed = parseOffer(offer.offer);
            const hasBundleDeal = parsed.type === 'bundle' && parsed.bundleQty && parsed.bundlePrice;
            const isOutOfStock = offer.quantity === 0;

            // Calculate prices based on quantity
            let totalPrice = offer.mrp * inventoryQuantity;
            let discountedPrice = totalPrice;
            let savings = 0;

            if (hasBundleDeal && parsed.bundleQty && parsed.bundlePrice) {
              const bundles = Math.floor(inventoryQuantity / parsed.bundleQty);
              const remaining = inventoryQuantity % parsed.bundleQty;
              discountedPrice = (bundles * parsed.bundlePrice) + (remaining * offer.mrp);
              savings = totalPrice - discountedPrice;
            } else if (parsed.type === 'percent' && parsed.discountPercent) {
              discountedPrice = totalPrice - Math.round(totalPrice * parsed.discountPercent / 100);
              savings = totalPrice - discountedPrice;
            } else if (parsed.type === 'combo' && parsed.comboPrice) {
              discountedPrice = parsed.comboPrice * inventoryQuantity;
              savings = totalPrice - discountedPrice;
            }

            // Nudge for bundle deals
            let nudgeMessage = '';
            if (hasBundleDeal && parsed.bundleQty && parsed.bundlePrice) {
              const itemsToNextBundle = parsed.bundleQty - (inventoryQuantity % parsed.bundleQty);
              if (itemsToNextBundle < parsed.bundleQty && inventoryQuantity + itemsToNextBundle <= offer.quantity) {
                if (itemsToNextBundle > 0) {
                  nudgeMessage = `💡 Add ${itemsToNextBundle} more to unlock the bundle deal!`;
                }
              }
            }

            return (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
                onClick={closeInventoryModal}
              >
                <motion.div
                  initial={{ scale: 0.95, y: 100 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 100 }}
                  onClick={(e) => e.stopPropagation()}
                  className="bg-white rounded-t-2xl sm:rounded-2xl overflow-hidden w-full sm:max-w-4xl max-h-[90vh] sm:max-h-[85vh] flex flex-col sm:flex-row shadow-2xl relative"
                >
                  {/* Close button */}
                  <button
                    onClick={closeInventoryModal}
                    className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 bg-white/80 sm:bg-white/50 rounded-full hover:bg-white transition shadow-sm"
                  >
                    <X size={20} className="text-brand-900" />
                  </button>

                  {/* Product Image */}
                  <div className="w-full sm:w-1/2 h-48 sm:h-auto bg-gray-100 flex-shrink-0 relative">
                    <img
                      src={getCategoryImage(offer.category)}
                      alt={offer.item}
                      className="w-full h-full object-cover"
                    />
                    {/* Offer Badge on Image */}
                    <div className="absolute top-4 left-4">
                      <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-full text-sm font-bold shadow-lg">
                        {offer.offer}
                      </span>
                    </div>
                  </div>

                  {/* Product Details */}
                  <div className="w-full sm:w-1/2 p-5 sm:p-8 md:p-12 overflow-y-auto flex-1">
                    <div className="mb-4 sm:mb-6">
                      <span className="text-[10px] sm:text-xs font-bold text-brand-400 uppercase tracking-widest">
                        {offer.category}
                      </span>
                      <h2 className="font-serif text-2xl sm:text-4xl text-brand-900 mt-1 sm:mt-2 mb-2">
                        {offer.item}
                      </h2>
                      <p className="text-brand-500 text-sm sm:text-base">
                        Size: {offer.size}{offer.size !== 'Large' ? 'ml/g' : ''}
                      </p>

                      {/* Stock Info */}
                      <div className="mt-3">
                        {offer.quantity <= 5 && offer.quantity > 0 ? (
                          <span className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 px-3 py-1 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                            Only {offer.quantity} left in stock
                          </span>
                        ) : offer.quantity > 5 ? (
                          <span className="inline-flex items-center gap-1.5 bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-medium">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            In Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-medium">
                            Out of Stock
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Offer Details Card */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4 mb-6 border border-green-100">
                      <div className="flex items-center gap-2 mb-2">
                        <Tag size={16} className="text-green-600" />
                        <span className="font-semibold text-green-800">Special Offer</span>
                      </div>
                      <p className="text-green-700 text-sm">
                        {hasBundleDeal ? (
                          <>Buy {parsed.bundleQty} for just {formatPrice(parsed.bundlePrice!)} (Save {formatPrice((offer.mrp * parsed.bundleQty!) - parsed.bundlePrice!)})</>
                        ) : parsed.type === 'percent' ? (
                          <>{parsed.discountPercent}% off on this item</>
                        ) : parsed.type === 'combo' ? (
                          <>Special combo price: {formatPrice(parsed.comboPrice!)}</>
                        ) : (
                          offer.offer
                        )}
                      </p>
                    </div>

                    {/* Quantity Selector */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium text-brand-900 mb-3">Quantity</label>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center border border-brand-200 rounded-lg overflow-hidden">
                          <button
                            onClick={() => setInventoryQuantity(Math.max(1, inventoryQuantity - 1))}
                            disabled={inventoryQuantity <= 1}
                            className="px-4 py-2 bg-brand-50 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-lg"
                          >
                            −
                          </button>
                          <span className="px-6 py-2 font-medium text-brand-900 min-w-[60px] text-center">
                            {inventoryQuantity}
                          </span>
                          <button
                            onClick={() => setInventoryQuantity(Math.min(offer.quantity, inventoryQuantity + 1))}
                            disabled={inventoryQuantity >= offer.quantity}
                            className="px-4 py-2 bg-brand-50 hover:bg-brand-100 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-lg"
                          >
                            +
                          </button>
                        </div>

                        {/* Quick select for bundle */}
                        {hasBundleDeal && parsed.bundleQty && parsed.bundleQty <= offer.quantity && (
                          <button
                            onClick={() => setInventoryQuantity(parsed.bundleQty!)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition ${inventoryQuantity === parsed.bundleQty
                                ? 'bg-green-600 text-white'
                                : 'bg-green-50 text-green-700 hover:bg-green-100 border border-green-200'
                              }`}
                          >
                            Buy {parsed.bundleQty} (Deal)
                          </button>
                        )}
                      </div>

                      {/* Nudge Message */}
                      {nudgeMessage && inventoryQuantity < (parsed.bundleQty || 0) && (
                        <p className="text-sm text-amber-600 mt-2 font-medium">{nudgeMessage}</p>
                      )}
                    </div>

                    {/* Price Summary */}
                    <div className="bg-brand-50 rounded-xl p-4 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-brand-600">Unit Price</span>
                        <span className="text-brand-900">{formatPrice(offer.mrp)}</span>
                      </div>
                      {savings > 0 && (
                        <>
                          <div className="flex justify-between items-center mb-2 text-brand-400">
                            <span>Subtotal ({inventoryQuantity} items)</span>
                            <span className="line-through">{formatPrice(totalPrice)}</span>
                          </div>
                          <div className="flex justify-between items-center text-green-600 mb-2">
                            <span>Offer Savings</span>
                            <span>-{formatPrice(savings)}</span>
                          </div>
                        </>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-brand-200">
                        <span className="font-semibold text-brand-900">Total</span>
                        <span className="font-serif text-xl text-brand-900">{formatPrice(discountedPrice)}</span>
                      </div>
                    </div>

                    {/* Add to Cart Button */}
                    <button
                      onClick={handleAddInventoryFromModal}
                      disabled={isOutOfStock}
                      className="w-full bg-brand-900 text-white py-3.5 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isOutOfStock ? (
                        'Out of Stock'
                      ) : (
                        <>
                          <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                          Add to Cart - {formatPrice(discountedPrice)}
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            );
          })()}
        </AnimatePresence>
      </div>
    </div>
  );
};

// Offer Card Component
const OfferCard: React.FC<{
  offer: InventoryOffer;
  onAddToCart: (offer: InventoryOffer) => void;
  onOpenModal: (offer: InventoryOffer) => void;
}> = ({ offer, onAddToCart, onOpenModal }) => {
  const parsed = parseOffer(offer.offer);
  const isLowStock = offer.quantity <= 5;

  // Calculate savings
  const getSavingsInfo = () => {
    if (parsed.type === 'bundle' && parsed.bundleQty && parsed.bundlePrice) {
      const originalForBundle = offer.mrp * parsed.bundleQty;
      const savings = originalForBundle - parsed.bundlePrice;
      const pricePerItem = Math.round(parsed.bundlePrice / parsed.bundleQty);
      return { savings, pricePerItem, bundleQty: parsed.bundleQty };
    }
    if (parsed.type === 'percent' && parsed.discountPercent) {
      const savings = Math.round(offer.mrp * (parsed.discountPercent / 100));
      return { savings, pricePerItem: offer.mrp - savings, bundleQty: 1 };
    }
    return null;
  };

  const savingsInfo = getSavingsInfo();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -5 }}
      onClick={() => onOpenModal(offer)}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100 group flex flex-col cursor-pointer"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        <img
          src={getCategoryImage(offer.category)}
          alt={offer.item}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        {/* Offer Badge */}
        <div className="absolute top-2 left-2">
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2.5 py-1 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
            <Tag size={12} />
            {offer.offer}
          </span>
        </div>
        {/* Low Stock Warning */}
        {isLowStock && (
          <div className="absolute top-2 right-2">
            <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
              Only {offer.quantity} left
            </span>
          </div>
        )}
        {/* View Details Overlay */}
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="bg-white/90 backdrop-blur text-brand-900 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg">
            View Details
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <h3 className="font-medium text-brand-900 text-sm sm:text-base line-clamp-1">{offer.item}</h3>
        <p className="text-[10px] sm:text-xs text-brand-500 mt-0.5">
          {offer.size}{offer.size !== 'Large' ? 'ml/g' : ''} • {offer.category}
        </p>

        {/* Pricing */}
        <div className="mt-2 flex items-baseline gap-2">
          <span className="font-serif text-brand-900">{formatPrice(offer.mrp)}</span>
          <span className="text-[10px] text-brand-400">each</span>
        </div>

        {/* Savings Info */}
        {savingsInfo && (
          <div className="mt-2 bg-green-50 rounded-lg p-2">
            <p className="text-[10px] sm:text-xs text-green-700 font-medium">
              {parsed.type === 'bundle' ? (
                <>₹{savingsInfo.pricePerItem}/each for {savingsInfo.bundleQty}</>
              ) : parsed.type === 'percent' ? (
                <>{parsed.discountPercent}% off</>
              ) : (
                getOfferDescription(offer.offer, offer.mrp)
              )}
            </p>
            <p className="text-[10px] text-green-600">
              Save ₹{savingsInfo.savings}{parsed.type === 'bundle' ? ` on ${savingsInfo.bundleQty}` : ''}
            </p>
          </div>
        )}

        {/* Add Button (mobile) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onAddToCart(offer);
          }}
          className="mt-3 w-full bg-brand-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-brand-800 transition flex items-center justify-center gap-2 sm:hidden"
        >
          <ShoppingBag size={16} />
          Add
        </button>
      </div>
    </motion.div>
  );
};
