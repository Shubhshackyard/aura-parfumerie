import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tag, ShoppingBag, Package, Flame, Droplets, Car, Sparkles, Home, Loader2, Percent } from 'lucide-react';
import { InventoryOffer, CartItem } from '../types';
import { inventoryOffersApi } from '../services/api';
import { parseOffer, getOfferDescription, formatPrice as formatPriceUtil } from '../utils/offerUtils';

const INVENTORY_CATEGORIES = ['All', 'Fine Fragrance', 'Home Collection', 'Accessories', 'Car Perfume', 'Personal Care'];
const ALLOWED_INVENTORY_CATEGORY_SET = new Set(['Car Perfume', 'Personal Care']);

interface InventoryOffersProps {
  onAddToCart: (item: CartItem) => void;
}

// Category icons mapping
const getCategoryIcon = (category: string) => {
  const lowerCategory = category.toLowerCase();
  if (lowerCategory.includes('candle')) return Flame;
  if (lowerCategory.includes('incense') || lowerCategory.includes('backflow')) return Sparkles;
  if (lowerCategory.includes('car')) return Car;
  if (lowerCategory.includes('floor') || lowerCategory.includes('cleaner')) return Home;
  if (lowerCategory.includes('air') || lowerCategory.includes('freshner')) return Droplets;
  return Package;
};

// Category images (placeholder)
const getCategoryImage = (category: string): string => {
  const images: Record<string, string> = {
    'Candle': 'https://images.unsplash.com/photo-1602874801007-bd458bb1b8b6?w=400&h=300&fit=crop',
    'Incense Stick': 'https://images.unsplash.com/photo-1595425970377-c9703cf48b6d?w=400&h=300&fit=crop',
    'Backflow': 'https://images.unsplash.com/photo-1572726729207-a78d6feb18d7?w=400&h=300&fit=crop',
    'Car Perfume': 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400&h=300&fit=crop',
    'Floor Cleaner': 'https://images.unsplash.com/photo-1563453392212-326f5e854473?w=400&h=300&fit=crop',
    'Air Freshner': 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&h=300&fit=crop',
    'Ceramic': 'https://images.unsplash.com/photo-1565193566173-7a0ee3dbe261?w=400&h=300&fit=crop',
    'Extrait - 30%': 'https://images.unsplash.com/photo-1588405748880-12d1d2a59f75?w=400&h=300&fit=crop',
    'Personal Care': 'https://images.unsplash.com/photo-1608248597279-f99d160bfcbc?w=400&h=300&fit=crop',
  };
  return images[category] || 'https://images.unsplash.com/photo-1615634260167-c8cdede054de?w=400&h=300&fit=crop';
};

const formatPrice = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export const InventoryOffers: React.FC<InventoryOffersProps> = ({ onAddToCart }) => {
  const [inventoryOffers, setInventoryOffers] = useState<InventoryOffer[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch categories and offers on mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all offers
        const offersResult = await inventoryOffersApi.getAll();
        if (offersResult.success && offersResult.inventoryOffers) {
          const filteredOffers = offersResult.inventoryOffers.filter(o =>
            ALLOWED_INVENTORY_CATEGORY_SET.has(o.category)
          );
          setInventoryOffers(filteredOffers);
        } else {
          setError(offersResult.error || 'Failed to load offers');
        }
      } catch (err) {
        console.error('Failed to fetch inventory offers:', err);
        setError('Failed to load offers');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const categories = INVENTORY_CATEGORIES;

  // Filter offers by category
  const filteredOffers = activeCategory === 'All'
    ? inventoryOffers
    : inventoryOffers.filter(offer => offer.category === activeCategory);

  // Group offers by category for display
  const groupedOffers = filteredOffers.reduce((acc, offer) => {
    if (!acc[offer.category]) {
      acc[offer.category] = [];
    }
    acc[offer.category].push(offer);
    return acc;
  }, {} as Record<string, InventoryOffer[]>);

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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 size={48} className="mx-auto mb-4 text-brand-600 animate-spin" />
          <p className="text-brand-600 font-medium">Loading offers...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-brand-50 flex items-center justify-center px-4">
        <div className="text-center text-brand-400">
          <Tag size={48} className="mx-auto mb-4 opacity-50" />
          <p className="text-lg">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-4 text-brand-600 underline"
          >
            Try again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-brand-50 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <motion.span 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            className="text-brand-500 uppercase tracking-widest text-[10px] sm:text-xs font-bold"
          >
            Current Stock & Offers
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.1 }} 
            className="font-serif text-3xl sm:text-4xl md:text-5xl text-brand-900 mt-3 sm:mt-4 mb-4 sm:mb-6"
          >
            Shop by Category
          </motion.h1>
          <p className="text-brand-600 max-w-2xl mx-auto text-sm sm:text-lg font-light">
            Browse our complete inventory with exclusive bundle deals and discounts.
          </p>
        </div>

        {/* Category Filter */}
        <div className="relative mb-8 sm:mb-12 -mx-4 sm:mx-0">
          <div className="flex sm:justify-center gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0 scrollbar-hide sm:flex-wrap">
            {categories.map(cat => {
              const Icon = cat === 'All' ? Tag : getCategoryIcon(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0
                    ${activeCategory === cat 
                      ? 'bg-brand-800 text-white shadow-lg' 
                      : 'bg-white text-brand-600 hover:bg-brand-100 border border-brand-100'
                    }`}
                >
                  <Icon size={14} className="sm:w-4 sm:h-4" />
                  {cat}
                </button>
              );
            })}
          </div>
          {/* Scroll fade indicator */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-brand-50 to-transparent pointer-events-none sm:hidden"></div>
        </div>

        {/* Results count */}
        <div className="mb-6 text-sm text-brand-500">
          Showing {filteredOffers.length} item{filteredOffers.length !== 1 ? 's' : ''}
          {activeCategory !== 'All' && ` in ${activeCategory}`}
        </div>

        {/* Offers Grid - Grouped by Category when showing All */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeCategory === 'All' ? (
              // Grouped view
              <div className="space-y-10 sm:space-y-12">
                {Object.entries(groupedOffers).map(([category, offers]) => {
                  const Icon = getCategoryIcon(category);
                  return (
                    <div key={category}>
                      <div className="flex items-center gap-3 mb-4 sm:mb-6">
                        <div className="p-2 bg-brand-100 rounded-lg">
                          <Icon size={20} className="text-brand-700" />
                        </div>
                        <h2 className="font-serif text-xl sm:text-2xl text-brand-900">{category}</h2>
                        <span className="text-xs text-brand-400 bg-brand-100 px-2 py-1 rounded-full">
                          {offers.length} items
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                        {offers.map(offer => (
                          <OfferCard 
                            key={offer._id} 
                            offer={offer} 
                            onAddToCart={() => handleAddToCart(offer)} 
                          />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Flat grid view for single category
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
                {filteredOffers.map(offer => (
                  <OfferCard 
                    key={offer._id} 
                    offer={offer} 
                    onAddToCart={() => handleAddToCart(offer)} 
                  />
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {filteredOffers.length === 0 && (
          <div className="text-center py-16 text-brand-400">
            <Package size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No items found in this category</p>
          </div>
        )}
      </div>
    </div>
  );
};

// Individual Offer Card Component
const OfferCard: React.FC<{ offer: InventoryOffer; onAddToCart: () => void }> = ({ offer, onAddToCart }) => {
  const isLowStock = offer.quantity <= 5;
  const isOutOfStock = offer.quantity === 0;
  const parsedOffer = parseOffer(offer.offer);
  const offerDescription = getOfferDescription(offer.offer, offer.mrp);

  // Calculate savings for display
  const getSavingsInfo = () => {
    if (parsedOffer.type === 'bundle' && parsedOffer.bundleQty && parsedOffer.bundlePrice) {
      const originalForBundle = offer.mrp * parsedOffer.bundleQty;
      const savings = originalForBundle - parsedOffer.bundlePrice;
      const pricePerItem = Math.round(parsedOffer.bundlePrice / parsedOffer.bundleQty);
      return { savings, pricePerItem, bundleQty: parsedOffer.bundleQty };
    }
    if (parsedOffer.type === 'percent' && parsedOffer.discountPercent) {
      const savings = Math.round(offer.mrp * (parsedOffer.discountPercent / 100));
      return { savings, pricePerItem: offer.mrp - savings, bundleQty: 1 };
    }
    return null;
  };

  const savingsInfo = getSavingsInfo();

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-brand-100 flex flex-col"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gray-100">
        <img 
          src={getCategoryImage(offer.category)} 
          alt={offer.item}
          className="w-full h-full object-cover"
        />
        {/* Offer Badge */}
        <div className="absolute top-2 left-2 sm:top-3 sm:left-3">
          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg flex items-center gap-1">
            <Percent size={10} className="hidden sm:inline" />
            {offer.offer}
          </span>
        </div>
        {/* Stock indicator */}
        {isLowStock && !isOutOfStock && (
          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
            <span className="bg-orange-500 text-white px-2 py-0.5 rounded-full text-[10px] font-medium">
              Only {offer.quantity} left
            </span>
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
              Out of Stock
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 flex-1 flex flex-col">
        <div className="mb-2 flex-1">
          <h3 className="font-medium text-brand-900 text-sm sm:text-base line-clamp-1">{offer.item}</h3>
          <p className="text-[10px] sm:text-xs text-brand-500 mt-0.5">
            {offer.size}{offer.size !== 'Large' ? 'ml/g' : ''} • {offer.category}
          </p>
        </div>

        {/* Pricing Section - Enhanced */}
        <div className="pt-2 sm:pt-3 border-t border-brand-50">
          {/* MRP */}
          <div className="flex items-baseline gap-2 mb-1">
            <span className="text-base sm:text-lg font-serif text-brand-900">{formatPrice(offer.mrp)}</span>
            <span className="text-[10px] text-brand-400">each</span>
          </div>
          
          {/* Offer Price Info */}
          {savingsInfo && (
            <div className="bg-green-50 rounded-lg p-2 mb-2">
              <p className="text-[10px] sm:text-xs text-green-700 font-medium">
                {parsedOffer.type === 'bundle' ? (
                  <>₹{savingsInfo.pricePerItem}/each when you buy {savingsInfo.bundleQty}</>
                ) : parsedOffer.type === 'percent' ? (
                  <>{parsedOffer.discountPercent}% off</>
                ) : (
                  offerDescription
                )}
              </p>
              <p className="text-[10px] text-green-600 mt-0.5">
                Save ₹{savingsInfo.savings}{parsedOffer.type === 'bundle' ? ` on ${savingsInfo.bundleQty}` : ''}
              </p>
            </div>
          )}

          {/* Add to Cart */}
          <button
            onClick={onAddToCart}
            disabled={isOutOfStock}
            className="w-full bg-brand-900 text-white py-2 sm:py-2.5 rounded-lg hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm font-medium"
            aria-label={`Add ${offer.item} to cart`}
          >
            <ShoppingBag size={16} />
            <span>Add to Cart</span>
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default InventoryOffers;
