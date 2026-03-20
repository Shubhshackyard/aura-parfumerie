import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, X, Tag, Flame, Sparkles, Car, Home, Package, Droplets } from 'lucide-react';
import { Product, ProductVariant, CartItem, InventoryOffer } from '../types';
import { inventoryOffersApi } from '../services/api';
import { parseOffer, formatPrice } from '../utils/offerUtils';

const BOUTIQUE_CATEGORIES = ['Fine Fragrance', 'Home Collection', 'Accessories'];
const INVENTORY_CATEGORIES = ['Car Perfume', 'Personal Care'];
const SHOP_CATEGORIES = ['All', ...BOUTIQUE_CATEGORIES, ...INVENTORY_CATEGORIES];
const INVENTORY_CATEGORY_SET = new Set(INVENTORY_CATEGORIES);

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

interface ShopProps {
  products: Product[];
  onAddToCart: (item: CartItem) => void;
  isLoading?: boolean;
}

export const Shop: React.FC<ShopProps> = ({ products, onAddToCart, isLoading = false }) => {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedInventoryOffer, setSelectedInventoryOffer] = useState<InventoryOffer | null>(null);
  const [inventoryQuantity, setInventoryQuantity] = useState(1);
  const [inventoryOffers, setInventoryOffers] = useState<InventoryOffer[]>([]);
  const [isLoadingInventory, setIsLoadingInventory] = useState(true);

  // Fetch inventory offers
  useEffect(() => {
    const fetchInventory = async () => {
      try {
        const offersResult = await inventoryOffersApi.getAll();
        
        if (offersResult.success && offersResult.inventoryOffers) {
          const filteredOffers = offersResult.inventoryOffers.filter(o =>
            INVENTORY_CATEGORY_SET.has(o.category)
          );
          setInventoryOffers(filteredOffers);
        }
      } catch (err) {
        console.error('Failed to fetch inventory:', err);
      } finally {
        setIsLoadingInventory(false);
      }
    };
    fetchInventory();
  }, []);

  // Combine boutique categories with inventory categories
  const allCategories = SHOP_CATEGORIES;
  
  // Filter boutique products
  const filteredBoutiqueProducts = activeCategory === 'All' 
    ? products 
    : BOUTIQUE_CATEGORIES.includes(activeCategory)
    ? products.filter(p => p.category === activeCategory)
    : [];

  // Filter inventory offers
  const filteredInventoryOffers = activeCategory === 'All'
    ? inventoryOffers
    : INVENTORY_CATEGORIES.includes(activeCategory)
    ? inventoryOffers.filter(o => o.category === activeCategory)
    : [];

  // Handle add inventory item to cart
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

  const openProduct = (product: Product) => {
    setSelectedProduct(product);
    setSelectedVariant(product.variants[0] || null);
  };

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

  const handleAddToCart = () => {
    if (selectedProduct && selectedVariant) {
      onAddToCart({
        productId: selectedProduct.id,
        variantId: selectedVariant.id,
        quantity: 1,
        productName: selectedProduct.name,
        variantName: selectedVariant.name,
        price: selectedVariant.price,
        image: selectedProduct.image
      });
      setSelectedProduct(null);
    }
  };

  const combinedLoading = isLoading || isLoadingInventory;
  const hasResults = filteredBoutiqueProducts.length > 0 || filteredInventoryOffers.length > 0;

  return (
    <div className="bg-brand-50 min-h-screen py-8 sm:py-12 px-4 sm:px-6 lg:px-8">
      {/* Filters */}
      <div className="max-w-7xl mx-auto mb-8 sm:mb-12">
        <h1 className="font-serif text-3xl sm:text-4xl text-brand-900 mb-2 text-center">Shop All Products</h1>
        <p className="text-brand-500 text-center mb-6 sm:mb-8">Browse our complete collection of fragrances and home products</p>
        
        {/* Scrollable category filters on mobile */}
        <div className="relative -mx-4 sm:mx-0">
          <div className="flex sm:justify-center gap-2 sm:gap-3 overflow-x-auto px-4 sm:px-0 pb-2 sm:pb-0 scrollbar-hide sm:flex-wrap">
            {allCategories.map(cat => {
              const Icon = cat === 'All' ? Tag : 
                          BOUTIQUE_CATEGORIES.includes(cat) ? ShoppingBag : 
                          getCategoryIcon(cat);
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`flex items-center gap-1.5 px-3 sm:px-5 py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 whitespace-nowrap flex-shrink-0
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
          {/* Scroll fade indicator for mobile */}
          <div className="absolute right-0 top-0 bottom-2 w-8 bg-gradient-to-l from-brand-50 to-transparent pointer-events-none sm:hidden"></div>
        </div>
      </div>

      {/* Grid */}
      {combinedLoading ? (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-brand-600 font-medium">Loading products...</p>
          </div>
        </div>
      ) : !hasResults ? (
        <div className="max-w-7xl mx-auto flex items-center justify-center py-20">
          <div className="text-center text-brand-400">
            <ShoppingBag size={48} className="mx-auto mb-4 opacity-50" />
            <p className="text-lg">No products found</p>
            <p className="text-sm mt-2">Check back later for new arrivals</p>
          </div>
        </div>
      ) : (
      <div className="max-w-7xl mx-auto">
        {/* Boutique Products Section */}
        {filteredBoutiqueProducts.length > 0 && (
          <div className="mb-12">
            {activeCategory === 'All' && (
              <div className="flex items-center gap-3 mb-6">
                <ShoppingBag size={20} className="text-brand-700" />
                <h2 className="font-serif text-xl sm:text-2xl text-brand-900">Fine Fragrances & Home</h2>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
              {filteredBoutiqueProducts.map(product => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ y: -5 }}
                  onClick={() => openProduct(product)}
                  className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300"
                >
                  <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                    <div className="absolute bottom-4 left-0 right-0 text-center opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-2 group-hover:translate-y-0 hidden sm:block">
                      <span className="inline-block bg-white/90 backdrop-blur text-brand-900 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider">
                        View Details
                      </span>
                    </div>
                  </div>
                  <div className="p-3 sm:p-6 text-center">
                    <h3 className="font-serif text-base sm:text-xl text-brand-900 mb-1 line-clamp-1">{product.name}</h3>
                    <p className="text-[10px] sm:text-xs text-brand-400 uppercase tracking-widest mb-2 sm:mb-3 line-clamp-1">
                      {product.category}
                    </p>
                    <p className="text-brand-700 font-medium text-sm sm:text-base">
                      From ₹{Math.min(...product.variants.map(v => v.price))}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}

        {/* Inventory/Catalog Products Section */}
        {filteredInventoryOffers.length > 0 && (
          <div>
            {activeCategory === 'All' && filteredBoutiqueProducts.length > 0 && (
              <div className="flex items-center gap-3 mb-6">
                <Package size={20} className="text-brand-700" />
                <h2 className="font-serif text-xl sm:text-2xl text-brand-900">Catalog Products</h2>
                <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">With Offers</span>
              </div>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-6">
              {filteredInventoryOffers.map(offer => {
                const parsed = parseOffer(offer.offer);
                const hasBundleDeal = parsed.type === 'bundle' && parsed.bundleQty && parsed.bundlePrice;
                const savings = hasBundleDeal 
                  ? (offer.mrp * parsed.bundleQty!) - parsed.bundlePrice!
                  : parsed.type === 'percent' && parsed.discountPercent
                  ? Math.round(offer.mrp * parsed.discountPercent / 100)
                  : 0;
                const isOutOfStock = offer.quantity === 0;

                return (
                  <motion.div
                    key={offer._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -5 }}
                    onClick={() => openInventoryOffer(offer)}
                    className="group cursor-pointer bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-brand-100"
                  >
                    <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
                      <img 
                        src={getCategoryImage(offer.category)} 
                        alt={offer.item} 
                        className="w-full h-full object-cover transition duration-700 group-hover:scale-110"
                      />
                      {/* Offer Badge */}
                      <div className="absolute top-2 left-2">
                        <span className="bg-gradient-to-r from-green-500 to-emerald-600 text-white px-2 py-1 rounded-full text-[10px] sm:text-xs font-bold shadow-lg">
                          {offer.offer}
                        </span>
                      </div>
                      {/* Out of Stock Overlay */}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                            Sold Out
                          </span>
                        </div>
                      )}
                      {/* View Details Overlay */}
                      {!isOutOfStock && (
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="bg-white/90 backdrop-blur text-brand-900 px-4 py-2 rounded-full text-xs font-semibold uppercase tracking-wider transform translate-y-4 group-hover:translate-y-0 transition-all shadow-lg">
                            View Details
                          </span>
                        </div>
                      )}
                    </div>
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
            </div>
          </div>
        )}
      </div>
      )}

      {/* Boutique Product Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center sm:p-4 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedProduct(null)}
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
                onClick={() => setSelectedProduct(null)}
                className="absolute top-3 right-3 sm:top-4 sm:right-4 z-10 p-2 bg-white/80 sm:bg-white/50 rounded-full hover:bg-white transition shadow-sm"
              >
                <X size={20} className="text-brand-900" />
              </button>

              {/* Product Image - Fixed height on mobile */}
              <div className="w-full sm:w-1/2 h-48 sm:h-auto bg-gray-100 flex-shrink-0">
                <img 
                  src={selectedProduct.image} 
                  alt={selectedProduct.name} 
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Product Details - Scrollable */}
              <div className="w-full sm:w-1/2 p-5 sm:p-8 md:p-12 overflow-y-auto flex-1">
                <div className="mb-4 sm:mb-6">
                  <span className="text-[10px] sm:text-xs font-bold text-brand-400 uppercase tracking-widest">
                    {selectedProduct.category}
                  </span>
                  <h2 className="font-serif text-2xl sm:text-4xl text-brand-900 mt-1 sm:mt-2 mb-2 sm:mb-4">
                    {selectedProduct.name}
                  </h2>
                  <p className="text-brand-600 leading-relaxed text-sm sm:text-base line-clamp-3 sm:line-clamp-none">
                    {selectedProduct.description}
                  </p>
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mt-3 sm:mt-4">
                    {selectedProduct.notes.map(note => (
                      <span key={note} className="text-[10px] sm:text-xs px-2 py-1 bg-brand-50 text-brand-600 rounded-md border border-brand-100">
                        {note}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-brand-900 mb-2 sm:mb-3">Select Variant</label>
                    <div className="space-y-2 max-h-32 sm:max-h-none overflow-y-auto">
                      {selectedProduct.variants.map(variant => (
                        <div 
                          key={variant.id}
                          onClick={() => setSelectedVariant(variant)}
                          className={`p-3 sm:p-4 rounded-lg border cursor-pointer flex justify-between items-center transition
                            ${selectedVariant?.id === variant.id 
                              ? 'border-brand-800 bg-brand-50' 
                              : 'border-brand-200 hover:border-brand-400'
                            }`}
                        >
                          <div>
                            <span className="block font-medium text-brand-900 text-sm sm:text-base">{variant.name}</span>
                            <span className="text-[10px] sm:text-xs text-brand-500 uppercase tracking-wider">{variant.type}</span>
                          </div>
                          <div className="text-right">
                             <span className="block font-bold text-brand-900 text-sm sm:text-base">₹{variant.price}</span>
                             {variant.stock < 10 && (
                               <span className="text-[10px] text-red-500 font-medium">
                                 Only {variant.stock} left
                               </span>
                             )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <button
                    onClick={handleAddToCart}
                    disabled={!selectedVariant || selectedVariant.stock === 0}
                    className="w-full bg-brand-900 text-white py-3.5 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-brand-800 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {selectedVariant?.stock === 0 ? 'Out of Stock' : (
                      <>
                        <ShoppingBag size={18} className="sm:w-5 sm:h-5" />
                        Add to Cart - ₹{selectedVariant?.price}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

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
              const potentialSavings = (offer.mrp * itemsToNextBundle) - (parsed.bundlePrice - (Math.floor(inventoryQuantity / parsed.bundleQty) * parsed.bundlePrice));
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
