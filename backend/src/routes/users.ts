import { Router, Request, Response } from 'express';
import User from '../models/User.js';
import Order from '../models/Order.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = Router();

// Helper to format address as string
const formatAddress = (address: { street?: string; city?: string; state?: string; zip?: string; country?: string } | undefined): string | undefined => {
  if (!address) return undefined;
  return [address.street, address.city, address.state, address.zip, address.country]
    .filter(Boolean).join(', ') || undefined;
};

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const { name, phone, avatar, address, preferences } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Update fields if provided
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (avatar !== undefined) user.avatar = avatar;
    
    // Handle address - accept either string or object
    if (address !== undefined) {
      if (typeof address === 'string') {
        // Parse string address (simple split by comma)
        const parts = address.split(',').map(s => s.trim());
        user.address = {
          street: parts[0] || '',
          city: parts[1] || '',
          state: parts[2] || '',
          zip: parts[3] || '',
          country: parts[4] || '',
        };
      } else {
        user.address = {
          street: address.street || '',
          city: address.city || '',
          state: address.state || '',
          zip: address.zip || '',
          country: address.country || '',
        };
      }
    }
    
    // Handle preferences - accept either array or object
    if (preferences !== undefined) {
      if (Array.isArray(preferences)) {
        user.preferences = {
          notes: preferences,
          categories: [],
        };
      } else {
        user.preferences = {
          notes: preferences.notes || [],
          categories: preferences.categories || [],
        };
      }
    }

    await user.save();

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: formatAddress(user.address),
        preferences: user.preferences?.notes || [],
      },
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
  try {
    const user = req.user;

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
        phone: user.phone,
        avatar: user.avatar,
        address: formatAddress(user.address),
        preferences: user.preferences?.notes || [],
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// GET /api/users/admin/customers - Get all customers with their orders (Admin only)
router.get('/admin/customers', authenticateToken, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    // Get all users who are not admins
    const users = await User.find({ role: { $ne: 'admin' } }).lean();
    
    // Get all orders grouped by user
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    
    // Map orders to users
    const ordersByUser = new Map<string, typeof orders>();
    orders.forEach(order => {
      const userId = order.userId.toString();
      if (!ordersByUser.has(userId)) {
        ordersByUser.set(userId, []);
      }
      ordersByUser.get(userId)!.push(order);
    });
    
    // Format customers
    const customers = users.map(user => {
      const userOrders = ordersByUser.get(user._id.toString()) || [];
      const totalSpent = userOrders.reduce((sum, o) => sum + o.total, 0);
      const lastOrder = userOrders[0];
      
      // Determine status based on order history
      let status: 'Lead' | 'Active' | 'VIP' | 'At Risk' = 'Lead';
      if (userOrders.length > 0) {
        if (totalSpent > 5000) {
          status = 'VIP';
        } else if (userOrders.length >= 2) {
          status = 'Active';
        } else {
          status = 'Active';
        }
        
        // Check if last interaction was > 30 days ago
        const daysSinceLastOrder = lastOrder 
          ? (Date.now() - new Date(lastOrder.createdAt).getTime()) / (1000 * 60 * 60 * 24)
          : Infinity;
        if (daysSinceLastOrder > 30 && status !== 'Lead') {
          status = 'At Risk';
        }
      }
      
      return {
        id: user._id.toString(),
        name: user.name || user.email?.split('@')[0] || 'Unknown',
        email: user.email || '',
        phone: user.phone || '',
        avatar: user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name || 'U')}&background=random`,
        status,
        sentiment: 'Neutral' as const,
        preferredNotes: user.preferences?.notes || [],
        lastInteraction: lastOrder?.createdAt || user.createdAt,
        messages: [], // Empty for now - can add messaging later
        orders: userOrders.map(o => ({
          id: o._id.toString(),
          customerDetails: o.customerDetails,
          items: o.items.map(i => ({
            productId: i.productId.toString(),
            variantId: i.variantId.toString(),
            productName: i.productName,
            variantName: i.variantName,
            price: i.price,
            quantity: i.quantity,
            image: i.image,
          })),
          total: o.total,
          status: o.status,
          date: o.createdAt,
        })),
        totalOrders: userOrders.length,
        totalSpent,
      };
    });
    
    // Sort by last interaction (most recent first)
    customers.sort((a, b) => 
      new Date(b.lastInteraction).getTime() - new Date(a.lastInteraction).getTime()
    );
    
    res.json({ customers });
  } catch (error) {
    console.error('Get customers error:', error);
    res.status(500).json({ error: 'Failed to fetch customers' });
  }
});

export default router;
