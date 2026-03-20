// Offer Types
export interface ParsedOffer {
  type: 'bundle' | 'percent' | 'combo' | 'unknown';
  bundlePrice?: number;
  bundleQty?: number;
  discountPercent?: number;
  comboPrice?: number;
  originalString: string;
}

export interface OfferCalculation {
  originalTotal: number;      // Total without any offer
  finalTotal: number;         // Total after applying offers
  savings: number;            // Amount saved
  bundlesApplied: number;     // Number of bundles applied
  remainingItems: number;     // Items not in a bundle
  pricePerItem: number;       // Effective price per item
  offerApplied: boolean;      // Whether any offer was applied
}

export interface OfferNudge {
  show: boolean;
  itemsNeeded: number;
  potentialSavings: number;
  message: string;
}

/**
 * Parse offer string into structured data
 * Supports formats:
 * - "180 for 2" → bundle offer
 * - "50%" → percentage discount
 * - "399 Combo" → combo price
 */
export function parseOffer(offerString: string): ParsedOffer {
  const normalized = offerString.trim();
  
  // Pattern: "180 for 2" or "₹180 for 2"
  const bundleMatch = normalized.match(/^₹?(\d+)\s*for\s*(\d+)$/i);
  if (bundleMatch) {
    return {
      type: 'bundle',
      bundlePrice: parseInt(bundleMatch[1]),
      bundleQty: parseInt(bundleMatch[2]),
      originalString: offerString,
    };
  }
  
  // Pattern: "50%" or "50% off"
  const percentMatch = normalized.match(/^(\d+)%(\s*off)?$/i);
  if (percentMatch) {
    return {
      type: 'percent',
      discountPercent: parseInt(percentMatch[1]),
      originalString: offerString,
    };
  }
  
  // Pattern: "399 Combo" or "₹399 Combo"
  const comboMatch = normalized.match(/^₹?(\d+)\s*combo$/i);
  if (comboMatch) {
    return {
      type: 'combo',
      comboPrice: parseInt(comboMatch[1]),
      originalString: offerString,
    };
  }
  
  return {
    type: 'unknown',
    originalString: offerString,
  };
}

/**
 * Calculate the price with offer applied using maximum bundles logic
 */
export function calculateOfferPrice(
  quantity: number,
  mrp: number,
  offerString: string
): OfferCalculation {
  const parsed = parseOffer(offerString);
  const originalTotal = quantity * mrp;
  
  // Default result (no offer applied)
  const defaultResult: OfferCalculation = {
    originalTotal,
    finalTotal: originalTotal,
    savings: 0,
    bundlesApplied: 0,
    remainingItems: quantity,
    pricePerItem: mrp,
    offerApplied: false,
  };
  
  if (quantity === 0) {
    return { ...defaultResult, pricePerItem: 0 };
  }
  
  switch (parsed.type) {
    case 'bundle': {
      const bundleQty = parsed.bundleQty!;
      const bundlePrice = parsed.bundlePrice!;
      
      // Calculate maximum bundles that can be applied
      const bundlesApplied = Math.floor(quantity / bundleQty);
      const remainingItems = quantity % bundleQty;
      
      // Calculate total
      const bundleCost = bundlesApplied * bundlePrice;
      const remainingCost = remainingItems * mrp;
      const finalTotal = bundleCost + remainingCost;
      
      return {
        originalTotal,
        finalTotal,
        savings: originalTotal - finalTotal,
        bundlesApplied,
        remainingItems,
        pricePerItem: finalTotal / quantity,
        offerApplied: bundlesApplied > 0,
      };
    }
    
    case 'percent': {
      const discountPercent = parsed.discountPercent!;
      const discountMultiplier = 1 - (discountPercent / 100);
      const finalTotal = Math.round(originalTotal * discountMultiplier);
      
      return {
        originalTotal,
        finalTotal,
        savings: originalTotal - finalTotal,
        bundlesApplied: 0,
        remainingItems: 0,
        pricePerItem: finalTotal / quantity,
        offerApplied: true,
      };
    }
    
    case 'combo': {
      // Combo is typically for 1 item at special price
      const comboPrice = parsed.comboPrice!;
      const finalTotal = quantity * comboPrice;
      
      return {
        originalTotal,
        finalTotal,
        savings: originalTotal - finalTotal,
        bundlesApplied: quantity,
        remainingItems: 0,
        pricePerItem: comboPrice,
        offerApplied: true,
      };
    }
    
    default:
      return defaultResult;
  }
}

/**
 * Get nudge message for user to add more items to get offer
 */
export function getOfferNudge(
  quantity: number,
  mrp: number,
  offerString: string
): OfferNudge {
  const parsed = parseOffer(offerString);
  
  const noNudge: OfferNudge = {
    show: false,
    itemsNeeded: 0,
    potentialSavings: 0,
    message: '',
  };
  
  if (parsed.type !== 'bundle' || !parsed.bundleQty || !parsed.bundlePrice) {
    return noNudge;
  }
  
  const bundleQty = parsed.bundleQty;
  const bundlePrice = parsed.bundlePrice;
  const remainingForNextBundle = bundleQty - (quantity % bundleQty);
  
  // Don't show nudge if already on a bundle boundary or if no items
  if (remainingForNextBundle === bundleQty || quantity === 0) {
    return noNudge;
  }
  
  // Calculate potential savings
  const currentTotal = calculateOfferPrice(quantity, mrp, offerString).finalTotal;
  const nextBundleTotal = calculateOfferPrice(quantity + remainingForNextBundle, mrp, offerString).finalTotal;
  const additionalItemsCost = remainingForNextBundle * mrp;
  const actualAdditionalCost = nextBundleTotal - currentTotal;
  const potentialSavings = additionalItemsCost - actualAdditionalCost;
  
  if (potentialSavings <= 0) {
    return noNudge;
  }
  
  return {
    show: true,
    itemsNeeded: remainingForNextBundle,
    potentialSavings,
    message: `Add ${remainingForNextBundle} more to save ₹${potentialSavings}!`,
  };
}

/**
 * Format price in INR
 */
export function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Get offer description for display
 */
export function getOfferDescription(offerString: string, mrp: number): string {
  const parsed = parseOffer(offerString);
  
  switch (parsed.type) {
    case 'bundle': {
      const pricePerItem = Math.round(parsed.bundlePrice! / parsed.bundleQty!);
      const savings = (mrp * parsed.bundleQty!) - parsed.bundlePrice!;
      return `₹${pricePerItem}/each when you buy ${parsed.bundleQty} (Save ₹${savings})`;
    }
    case 'percent':
      return `${parsed.discountPercent}% off on all quantities`;
    case 'combo':
      return `Special combo price: ₹${parsed.comboPrice}`;
    default:
      return offerString;
  }
}
