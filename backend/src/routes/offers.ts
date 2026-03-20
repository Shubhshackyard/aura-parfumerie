import { Router, Request, Response } from 'express';
import Offer from '../models/Offer.js';
import InventoryOffer from '../models/InventoryOffer.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import fs from 'fs/promises';
import path from 'path';

const router = Router();

// Set up multer for in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// GET /api/offers - Get all active offers
router.get('/', async (req: Request, res: Response): Promise<void> => {
    try {
        const offers = await Offer.find({ isActive: true }).populate('products');
        res.json({ offers });
    } catch (error) {
        console.error('Get offers error:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});

// POST /api/offers/seed - Seed offers from a JSON file
router.post('/seed', [authenticateToken, requireAdmin, upload.single('file')], async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const offersData = JSON.parse(req.file.buffer.toString('utf-8'));

        await Offer.deleteMany({});
        await Offer.insertMany(offersData);

        res.status(201).json({ message: 'Offers seeded successfully' });
    } catch (error) {
        console.error('Seed offers error:', error);
        res.status(500).json({ error: 'Failed to seed offers' });
    }
});

// POST /api/offers - Create a new offer
router.post('/', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const newOffer = new Offer(req.body);
        await newOffer.save();
        res.status(201).json(newOffer);
    } catch (error) {
        console.error('Create offer error:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
});

// PUT /api/offers/:id - Update an offer
router.put('/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedOffer = await Offer.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedOffer) {
            res.status(404).json({ error: 'Offer not found' });
            return;
        }
        res.json(updatedOffer);
    } catch (error) {
        console.error('Update offer error:', error);
        res.status(500).json({ error: 'Failed to update offer' });
    }
});

// DELETE /api/offers/:id - Delete an offer
router.delete('/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedOffer = await Offer.findByIdAndDelete(id);
        if (!deletedOffer) {
            res.status(404).json({ error: 'Offer not found' });
            return;
        }
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Delete offer error:', error);
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

// ============ INVENTORY OFFERS ENDPOINTS ============

// GET /api/offers/inventory - Get all inventory offers
router.get('/inventory', async (req: Request, res: Response): Promise<void> => {
    try {
        const { category } = req.query;
        
        const query: Record<string, unknown> = { isActive: true };
        if (category && category !== 'All') {
            query.category = category;
        }

        const inventoryOffers = await InventoryOffer.find(query).sort({ category: 1, item: 1 });
        
        // Transform to frontend format
        const formattedOffers = inventoryOffers.map((offer) => ({
            _id: offer._id.toString(),  // MongoDB convention - required by frontend
            id: offer._id.toString(),   // Keep for backward compatibility
            category: offer.category,
            item: offer.item,
            size: offer.size,
            quantity: offer.quantity,
            mrp: offer.mrp,
            offer: offer.offer,
            isActive: offer.isActive,
        }));

        res.json({ inventoryOffers: formattedOffers });
    } catch (error) {
        console.error('Get inventory offers error:', error);
        res.status(500).json({ error: 'Failed to fetch inventory offers' });
    }
});

// GET /api/offers/inventory/categories - Get all categories
router.get('/inventory/categories', async (req: Request, res: Response): Promise<void> => {
    try {
        const categories = await InventoryOffer.distinct('category', { isActive: true });
        res.json({ categories });
    } catch (error) {
        console.error('Get categories error:', error);
        res.status(500).json({ error: 'Failed to fetch categories' });
    }
});

// POST /api/offers/inventory/seed - Seed inventory offers from JSON file
router.post('/inventory/seed', [authenticateToken, requireAdmin, upload.single('file')], async (req: Request, res: Response): Promise<void> => {
    try {
        if (!req.file) {
            res.status(400).json({ error: 'No file uploaded.' });
            return;
        }

        const offersData = JSON.parse(req.file.buffer.toString('utf-8'));
        
        if (!Array.isArray(offersData)) {
            res.status(400).json({ error: 'Invalid format. Expected an array of offers.' });
            return;
        }

        // Clear existing and insert new
        await InventoryOffer.deleteMany({});
        
        const offersToInsert = offersData.map((item: any) => ({
            category: item.Category || item.category,
            item: item.Item || item.item,
            size: String(item.Size || item.size),
            quantity: parseInt(item.QTY || item.quantity) || 0,
            mrp: parseInt(item.MRP || item.mrp) || 0,
            offer: item.Offer || item.offer,
            isActive: true,
        }));

        const result = await InventoryOffer.insertMany(offersToInsert);

        res.status(201).json({ 
            message: 'Inventory offers seeded successfully',
            count: result.length
        });
    } catch (error) {
        console.error('Seed inventory offers error:', error);
        res.status(500).json({ error: 'Failed to seed inventory offers' });
    }
});

// PUT /api/offers/inventory/:id - Update inventory offer
router.put('/inventory/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const updatedOffer = await InventoryOffer.findByIdAndUpdate(id, req.body, { new: true });
        if (!updatedOffer) {
            res.status(404).json({ error: 'Inventory offer not found' });
            return;
        }
        res.json(updatedOffer);
    } catch (error) {
        console.error('Update inventory offer error:', error);
        res.status(500).json({ error: 'Failed to update inventory offer' });
    }
});

// DELETE /api/offers/inventory/:id - Delete inventory offer
router.delete('/inventory/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params;
        const deletedOffer = await InventoryOffer.findByIdAndDelete(id);
        if (!deletedOffer) {
            res.status(404).json({ error: 'Inventory offer not found' });
            return;
        }
        res.json({ message: 'Inventory offer deleted successfully' });
    } catch (error) {
        console.error('Delete inventory offer error:', error);
        res.status(500).json({ error: 'Failed to delete inventory offer' });
    }
});

export default router;
