import { Router, Request, Response } from 'express';
import mongoose from 'mongoose';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import InventoryOffer from '../models/InventoryOffer.js';
import User from '../models/User.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/orders/admin/all - Get all orders (Admin only)
router.get('/admin/all', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, search } = req.query;

    // Build query
    const query: Record<string, unknown> = {};
    
    if (status && status !== 'All') {
      query.status = status;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { 'customerDetails.name': { $regex: search, $options: 'i' } },
        { 'customerDetails.email': { $regex: search, $options: 'i' } },
      ];
    }

    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .lean();

    // Get user details for each order
    const userIds = [...new Set(orders.map(o => o.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } }).lean();
    const userMap = new Map(users.map(u => [u._id.toString(), u]));

    // Transform to frontend format with user details
    const formattedOrders = orders.map((order) => {
      const user = userMap.get(order.userId.toString());
      return {
        id: order._id.toString(),
        userId: order.userId.toString(),
        userEmail: user?.email || order.customerDetails.email,
        userName: user?.name || order.customerDetails.name,
        customerDetails: order.customerDetails,
        items: order.items.map((item) => ({
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
          productName: item.productName,
          variantName: item.variantName,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: order.total,
        status: order.status,
        date: order.createdAt,
      };
    });

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Get all orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT /api/orders/:id/status - Update order status (Admin only)
router.put('/:id/status', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'];
    if (!status || !validStatuses.includes(status)) {
      res.status(400).json({ error: 'Invalid status' });
      return;
    }

    const order = await Order.findById(id);

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    order.status = status;
    await order.save();

    res.json({
      order: {
        id: order._id.toString(),
        status: order.status,
      },
    });
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});

// GET /api/orders - Get user's orders
router.get('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;

    const orders = await Order.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    // Transform to frontend format
    const formattedOrders = orders.map((order) => ({
      id: order._id.toString(),
      customerDetails: order.customerDetails,
      items: order.items.map((item) => ({
        productId: item.productId.toString(),
        variantId: item.variantId.toString(),
        productName: item.productName,
        variantName: item.variantName,
        price: item.price,
        quantity: item.quantity,
        image: item.image,
      })),
      total: order.total,
      status: order.status,
      date: order.createdAt,
    }));

    res.json({ orders: formattedOrders });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// POST /api/orders - Create new order
router.post('/', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { items, customerDetails } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      res.status(400).json({ error: 'Order must have at least one item' });
      return;
    }

    if (!customerDetails || !customerDetails.name || !customerDetails.email || !customerDetails.phone || !customerDetails.address) {
      res.status(400).json({ error: 'Customer details (name, email, phone, address) are required' });
      return;
    }

    // Validate items and calculate total
    let total = 0;
    const orderItems = [];
    const stockUpdates: any[] = [];

    for (const item of items) {
      console.log('Processing order item:', {
        productId: item.productId,
        variantId: item.variantId,
        productName: item.productName,
        variantName: item.variantName,
        quantity: item.quantity
      });

      // First try to find in regular products
      let product = await Product.findById(item.productId).catch(() => null);
      
      // Fallback: If ID is stale (after DB reseed), try matching by product name
      if (!product && item.productName) {
        product = await Product.findOne({ name: item.productName }).catch(() => null);
      }

      let variant: any = null;
      
      if (product && product.variants) {
        variant = product.variants.find(
          (v: any) => 
            v._id?.toString() === item.variantId || 
            v.id === item.variantId || 
            v.sku === item.variantId ||
            (item.variantName && v.name === item.variantName) ||
            `${product._id.toString()}-${product.variants.indexOf(v)}` === item.variantId
        );

        // Fallback: If variant wasn't found (e.g. old ID in cart after DB reseed) but the product only has 1 variant
        if (!variant && product.variants.length === 1) {
          variant = product.variants[0];
        }
      }

      if (product && variant) {
        // Regular product with variants
        // Check stock
        if (variant.stock < item.quantity) {
          res.status(400).json({ 
            error: `Insufficient stock for ${product.name} - ${variant.name}` 
          });
          return;
        }

        const itemTotal = variant.price * item.quantity;
        total += itemTotal;

        const validVariantId = variant._id 
          ? variant._id 
          : mongoose.isValidObjectId(item.variantId) 
            ? new mongoose.Types.ObjectId(item.variantId) 
            : new mongoose.Types.ObjectId();

        orderItems.push({
          productId: product._id,
          variantId: validVariantId,
          productName: product.name,
          variantName: variant.name,
          price: variant.price,
          quantity: item.quantity,
          image: product.image,
        });

        // Queue stock update
        stockUpdates.push({
          type: 'product',
          productId: product._id,
          variantId: variant._id,
          variantName: variant.name,
          variantSku: variant.sku,
          quantity: item.quantity
        });
      } else {
        // Try to find in inventory offers
        console.log('Product/Variant not found, trying InventoryOffer with ID:', item.productId);
        let inventoryOffer = await InventoryOffer.findById(item.productId).catch((err) => {
          console.log('InventoryOffer.findById error:', err.message);
          return null;
        });
        
        // Fallback: If ID is stale, try matching by inventory offer item name
        if (!inventoryOffer && item.productName) {
          inventoryOffer = await InventoryOffer.findOne({ item: item.productName }).catch(() => null);
        }

        console.log('InventoryOffer result:', inventoryOffer ? 'Found' : 'Not found');
        
        if (!inventoryOffer) {
          if (product) {
            res.status(400).json({ error: `Variant ${item.variantId} not found for product ${product.name}` });
          } else {
            res.status(400).json({ error: `Product not found: ${item.productName || item.productId}` });
          }
          return;
        }

        // Check stock for inventory offer
        if (inventoryOffer.quantity < item.quantity) {
          res.status(400).json({ 
            error: `Insufficient stock for ${inventoryOffer.item}` 
          });
          return;
        }

        // Use the price from the cart item (which includes offer calculation)
        // Or fall back to MRP
        const itemPrice = item.price || inventoryOffer.mrp;
        const itemTotal = itemPrice * item.quantity;
        total += itemTotal;

        orderItems.push({
          productId: inventoryOffer._id,
          variantId: inventoryOffer._id, // Use valid offer ID instead of parsing the stale string
          productName: item.productName || inventoryOffer.item,
          variantName: item.variantName || `${inventoryOffer.size} - ${inventoryOffer.category}`,
          price: itemPrice,
          quantity: item.quantity,
          image: item.image || '',
        });

        // Queue inventory stock update
        stockUpdates.push({
          type: 'inventoryOffer',
          offerId: inventoryOffer._id,
          quantity: item.quantity
        });
      }
    }

    // Apply all stock updates using updateOne to avoid full document validation issues
    // and to ensure we only update stock if all items pass validation
    for (const update of stockUpdates) {
      if (update.type === 'product') {
        const variantQuery = update.variantId 
          ? { 'variants._id': update.variantId }
          : update.variantSku 
            ? { 'variants.sku': update.variantSku }
            : { 'variants.name': update.variantName };

        await Product.updateOne(
          { _id: update.productId, ...variantQuery },
          { $inc: { 'variants.$.stock': -update.quantity } }
        );
      } else if (update.type === 'inventoryOffer') {
        await InventoryOffer.updateOne(
          { _id: update.offerId },
          { $inc: { quantity: -update.quantity } }
        );
      }
    }

    // Create order
    const order = new Order({
      userId: new mongoose.Types.ObjectId(userId),
      customerDetails,
      items: orderItems,
      total,
      status: 'Pending',
    });

    await order.save();

    res.status(201).json({
      order: {
        id: order._id.toString(),
        customerDetails: order.customerDetails,
        items: order.items.map((item) => ({
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
          productName: item.productName,
          variantName: item.variantName,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: order.total,
        status: order.status,
        date: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Create order error:', error);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET /api/orders/:id - Get single order
router.get('/:id', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { id } = req.params;

    const order = await Order.findOne({ _id: id, userId });

    if (!order) {
      res.status(404).json({ error: 'Order not found' });
      return;
    }

    res.json({
      order: {
        id: order._id.toString(),
        customerDetails: order.customerDetails,
        items: order.items.map((item) => ({
          productId: item.productId.toString(),
          variantId: item.variantId.toString(),
          productName: item.productName,
          variantName: item.variantName,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        total: order.total,
        status: order.status,
        date: order.createdAt,
      },
    });
  } catch (error) {
    console.error('Get order error:', error);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

export default router;
