import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Star, Droplet, Wind, Tag, Sparkles, Flame, Package, Car, Home, ShoppingBag, X } from 'lucide-react';
import { Product, CartItem, ViewMode, InventoryOffer } from '../types';
import { inventoryOffersApi } from '../services/api';
import { parseOffer, formatPrice } from '../utils/offerUtils';

const LANDING_CATEGORIES = ['All', 'Fine Fragrance', 'Home Collection', 'Accessories', 'Car Perfume', 'Personal Care'];
const INVENTORY_CATEGORY_SET = new Set(['Car Perfume', 'Personal Care']);

interface LandingPageProps {
  products: Product[];
  onAddToCart: (item: CartItem) => void;
  onNavigate: (view: ViewMode) => void;
  onOpenChat: () => void;
}

// Category icon mapping
const getCategoryIcon = (category: string) => {
  const lower = category.toLowerCase();
  if (lower.includes('candle')) return Flame;
  if (lower.includes('incense') || lower.includes('backflow')) return Sparkles;
  if (lower.includes('car')) return Car;
  if (lower.includes('floor') || lower.includes('home')) return Home;
  return Package;
};

// Category images
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

export const LandingPage: React.FC<LandingPageProps> = ({ products, onAddToCart, onNavigate, onOpenChat }) => {
  const [inventoryOffers, setInventoryOffers] = useState<InventoryOffer[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [isLoadingOffers, setIsLoadingOffers] = useState(true);
  const [selectedInventoryOffer, setSelectedInventoryOffer] = useState<InventoryOffer | null>(null);
  const [inventoryQuantity, setInventoryQuantity] = useState(1);

  // Fetch inventory offers
  useEffect(() => {
    const fetchData = async () => {
      try {
        const offersResult = await inventoryOffersApi.getAll();
        
        if (offersResult.success && offersResult.inventoryOffers) {
          const filteredOffers = offersResult.inventoryOffers.filter(o =>
            INVENTORY_CATEGORY_SET.has(o.category)
          );
          setInventoryOffers(filteredOffers);
        }
      } catch (err) {
        console.error('Failed to fetch inventory offers:', err);
      } finally {
        setIsLoadingOffers(false);
      }
    };
    fetchData();
  }, []);

  const categories = LANDING_CATEGORIES;

  // Filter offers by category
  const filteredOffers = activeCategory === 'All'
    ? inventoryOffers
    : inventoryOffers.filter(offer => offer.category === activeCategory);

  // Get unique offers for marquee (select items with best deals)
  const marqueeOffers = inventoryOffers
    .filter(offer => offer.offer && offer.quantity > 0)
    .slice(0, 10);

  // Handle add to cart for inventory items
  const handleAddInventoryToCart = (offer: InventoryOffer) => {
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

  return (
    <div className="bg-brand-50">
      {/* Hero Section */}
      <section className="relative h-[85vh] overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-black/20 z-10"></div>
        <img 
          src="https://images.unsplash.com/photo-1615634260167-c8cdede054de?q=80&w=2574&auto=format&fit=crop" 
          alt="Abstract perfume smoke" 
          className="absolute inset-0 w-full h-full object-cover"
        />
        
        <div className="relative z-20 text-center text-white px-4 max-w-4xl mx-auto">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="block font-serif italic text-xl md:text-2xl mb-4 tracking-wider"
          >
            Essence of Identity
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="font-serif text-5xl md:text-7xl lg:text-8xl mb-8 leading-tight"
          >
            Find Your <br/> Signature Aura
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-brand-100 text-lg md:text-xl font-light mb-10 max-w-2xl mx-auto"
          >
            A bespoke fragrance journey powered by art and intelligence. 
            Connect with our Concierge to discover scents curated for your soul.
          </motion.p>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <button 
              onClick={() => onNavigate('shop')}
              className="px-8 py-4 bg-white text-brand-900 rounded-full font-medium tracking-wide hover:bg-brand-100 transition duration-300"
            >
              Discover Collection
            </button>
            <button 
              onClick={onOpenChat}
              className="px-8 py-4 border border-white text-white rounded-full font-medium tracking-wide hover:bg-white/10 transition duration-300 backdrop-blur-sm"
            >
              Take Scent Quiz
            </button>
          </motion.div>
        </div>
      </section>

      {/* Offers Marquee Banner */}
      {marqueeOffers.length > 0 && (
        <section className="bg-gradient-to-r from-brand-900 via-brand-800 to-brand-900 py-3 overflow-hidden">
          <div className="relative">
            <motion.div
              className="flex whitespace-nowrap"
              animate={{ x: ['0%', '-50%'] }}
              transition={{
                x: {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 30,
                  ease: 'linear',
                },
              }}
            >
              {/* Duplicate content for seamless loop */}
              {[...marqueeOffers, ...marqueeOffers].map((offer, idx) => (
                <div key={idx} className="inline-flex items-center mx-8">
                  <Sparkles size={16} className="text-yellow-400 mr-2" />
                  <span className="text-white font-medium">
                    {offer.item}
                  </span>
                  <span className="mx-2 text-brand-300">—</span>
                  <span className="text-yellow-400 font-bold">{offer.offer}</span>
                  <span className="mx-2 text-brand-400">•</span>
                  <span className="text-brand-200">MRP {formatPrice(offer.mrp)}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </section>
      )}

      {/* Features / Value Prop */}
      <section className="py-24 px-4 bg-white">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 mb-6">
              <Droplet size={28} />
            </div>
            <h3 className="font-serif text-2xl text-brand-900 mb-3">Rare Ingredients</h3>
            <p className="text-brand-600 leading-relaxed">Sourced from the most secluded gardens of the world, ensuring purity and potency in every drop.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 mb-6">
              <Wind size={28} />
            </div>
            <h3 className="font-serif text-2xl text-brand-900 mb-3">Personalized Sillage</h3>
            <p className="text-brand-600 leading-relaxed">Our AI Concierge analyzes your preferences to suggest fragrances that resonate with your personal chemistry.</p>
          </div>
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center text-brand-800 mb-6">
              <Star size={28} />
            </div>
            <h3 className="font-serif text-2xl text-brand-900 mb-3">Loyalty Reimagined</h3>
            <p className="text-brand-600 leading-relaxed">Join our inner circle. Seamlessly manage your collection and reorders via WhatsApp or Telegram.</p>
          </div>
        </div>
      </section>

      {/* Product Showcase */}
      <section className="py-24 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <span className="text-brand-500 uppercase tracking-widest text-sm font-semibold">The Collection</span>
              <h2 className="font-serif text-4xl text-brand-900 mt-2">Curated for the Season</h2>
            </div>
            <button 
              onClick={() => onNavigate('shop')}
              className="hidden md:flex items-center gap-2 text-brand-800 hover:text-brand-600 transition font-medium"
            >
              View All <ArrowRight size={18} />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {products.slice(0, 4).map((product) => (
              <motion.div 
                key={product.id}
                whileHover={{ y: -10 }}
                className="group cursor-pointer"
              >
                <div className="relative aspect-[4/5] overflow-hidden rounded-lg mb-4 bg-gray-200">
                  <img 
                    src={product.image} 
                    alt={product.name} 
                    className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition duration-300 flex items-center justify-center">
                    <button 
                      onClick={() => {
                        const variant = product.variants[0];
                        if (variant) {
                          onAddToCart({
                            productId: product.id,
                            variantId: variant.id,
                            quantity: 1,
                            productName: product.name,
                            variantName: variant.name,
                            price: variant.price,
                            image: product.image
                          });
                        }
                      }}
                      className="bg-white text-brand-900 px-6 py-3 rounded-full font-medium transform translate-y-4 group-hover:translate-y-0 transition duration-300 shadow-lg"
                    >
                      Quick Add
                    </button>
                  </div>
                </div>
                <h3 className="font-serif text-xl text-brand-900">{product.name}</h3>
                <p className="text-brand-500 text-sm mt-1">{product.notes.join(' • ')}</p>
                <p className="text-brand-800 font-medium mt-2">
                  From ₹{Math.min(...product.variants.map(v => v.price))}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="mt-12 text-center md:hidden">
            <button 
              onClick={() => onNavigate('shop')}
              className="inline-flex items-center gap-2 text-brand-800 hover:text-brand-600 transition font-medium"
            >
              View All <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </section>

      {/* Hot Deals Banner */}
      <section className="py-6 bg-gradient-to-r from-green-600 to-emerald-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="p-2 bg-white/20 rounded-full">
              <Tag size={24} />
            </div>
            <div>
              <h3 className="font-bold text-lg">Amazing Deals Await!</h3>
              <p className="text-green-100 text-sm">Bundle offers, combo deals & more</p>
            </div>
          </div>
          <button 
            onClick={() => onNavigate('inventory')}
            className="bg-white text-green-700 px-6 py-3 rounded-full font-bold hover:bg-green-50 transition flex items-center gap-2"
          >
            Shop Catalog <ArrowRight size={18} />
          </button>
        </div>
      </section>

      {/* Catalog Products Section */}
      <section className="py-16 sm:py-24 px-4 bg-brand-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <span className="text-brand-500 uppercase tracking-widest text-sm font-semibold">Best Sellers & Offers</span>
            <h2 className="font-serif text-3xl sm:text-4xl text-brand-900 mt-2">Shop by Category</h2>
            <p className="text-brand-600 mt-3 max-w-2xl mx-auto">
              Explore our complete catalog with exclusive bundle deals and discounts
            </p>
          </div>

          {/* Category Tabs */}
          <div className="relative mb-8 -mx-4 sm:mx-0">
            <div className="flex sm:justify-center gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 scrollbar-hide">
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
                    <Icon size={14} />
                    {cat}
                  </button>
                );
              })}
            </div>
            <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-brand-50 to-transparent pointer-events-none sm:hidden"></div>
          </div>

          {/* Products Grid */}
          {isLoadingOffers ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="w-10 h-10 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-3"></div>
                <p className="text-brand-500 text-sm">Loading offers...</p>
              </div>
            </div>
          ) : filteredOffers.length === 0 ? (
            <div className="text-center py-16 text-brand-400">
              <Package size={48} className="mx-auto mb-4 opacity-50" />
              <p>No items found in this category</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              <motion.div
                key={activeCategory}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6"
              >
                {filteredOffers.slice(0, 10).map((offer) => {
                  const parsed = parseOffer(offer.offer);
                  const hasBundleDeal = parsed.type === 'bundle' && parsed.bundleQty && parsed.bundlePrice;
                  const savings = hasBundleDeal 
                    ? (offer.mrp * parsed.bundleQty!) - parsed.bundlePrice!
                    : parsed.type === 'percent' && parsed.discountPercent
                    ? Math.round(offer.mrp * parsed.discountPercent / 100)
                    : 0;

                  return (
                    <motion.div
                      key={offer._id}
                      whileHover={{ y: -5 }}
                      onClick={() => openInventoryOffer(offer)}
                      className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-brand-100 group cursor-pointer"
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
                          <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                            {offer.offer}
                          </span>
                        </div>
                        {/* Out of Stock */}
                        {offer.quantity === 0 && (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                              Sold Out
                            </span>
                          </div>
                        )}
                        {/* View Details Overlay */}
                        {offer.quantity > 0 && (
                          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-white/90 backdrop-blur text-brand-900 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg">
                              View Details
                            </span>
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="p-3 sm:p-4">
                        <h3 className="font-medium text-brand-900 text-sm sm:text-base line-clamp-1">{offer.item}</h3>
                        <p className="text-[10px] sm:text-xs text-brand-500 mt-0.5">
                          {offer.size}{offer.size !== 'Large' ? 'ml/g' : ''} • {offer.category}
                        </p>
                        
                        <div className="mt-2 flex items-baseline gap-2">
                          <span className="font-serif text-brand-900">{formatPrice(offer.mrp)}</span>
                          {savings > 0 && (
                            <span className="text-[10px] text-green-600 font-medium">
                              Save ₹{savings}
                            </span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            </AnimatePresence>
          )}

          {/* View All Button */}
          {filteredOffers.length > 10 && (
            <div className="mt-10 text-center">
              <button
                onClick={() => onNavigate('inventory')}
                className="inline-flex items-center gap-2 bg-brand-900 text-white px-8 py-3 rounded-full font-medium hover:bg-brand-800 transition"
              >
                View All {activeCategory !== 'All' ? activeCategory : 'Products'} <ArrowRight size={18} />
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Omni-channel CTA */}
      <section className="py-24 bg-brand-900 text-brand-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-white/5 to-transparent"></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="font-serif text-4xl md:text-5xl mb-6">Never miss a note.</h2>
              <p className="text-brand-200 text-lg mb-8 leading-relaxed">
                Experience the future of luxury retail. Chat with our specialists in real-time, 
                receive restock alerts via WhatsApp, and manage your scent profile—all in one place.
              </p>
              <div className="flex flex-wrap gap-4">
                <button className="flex items-center gap-3 px-6 py-3 bg-[#25D366] text-white rounded-lg hover:bg-[#20bd5a] transition">
                  <span className="font-bold">WhatsApp</span> Connect
                </button>
                <button className="flex items-center gap-3 px-6 py-3 bg-[#0088cc] text-white rounded-lg hover:bg-[#0077b5] transition">
                  <span className="font-bold">Telegram</span> Join
                </button>
              </div>
            </div>
            <div className="relative">
              {/* Abstract phone mockup or similar visual could go here */}
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-2xl border border-white/10">
                 <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 rounded-full bg-brand-200"></div>
                    <div className="bg-white text-brand-900 p-4 rounded-2xl rounded-tl-none text-sm shadow-lg max-w-xs">
                       <p>Hello! I noticed you enjoyed 'Midnight Saffron'. We have a limited reserve of a similar oud arriving next week. Shall I reserve one for you?</p>
                    </div>
                 </div>
                 <div className="flex items-end justify-end gap-4">
                    <div className="bg-[#DCF8C6] text-brand-900 p-4 rounded-2xl rounded-tr-none text-sm shadow-lg max-w-xs">
                       <p>Yes, please! Add it to my profile. Same shipping address.</p>
                    </div>
                    <div className="w-10 h-10 rounded-full bg-brand-800 border-2 border-white"></div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      </section>

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
                          className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                            inventoryQuantity === parsed.bundleQty
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
  );
};
