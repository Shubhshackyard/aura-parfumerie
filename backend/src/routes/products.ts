import { Router, Request, Response } from 'express';
import Product from '../models/Product.js';
import { optionalAuth, authenticateToken, requireAdmin } from '../middleware/auth.js';
import multer from 'multer';
import mongoose from 'mongoose';

// Set up multer for in-memory uploads
const storage = multer.memoryStorage();
const upload = multer({ storage });

const router = Router();

// GET /api/products - Get all products
router.get('/', optionalAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { category, search } = req.query;

    // Build query
    const query: Record<string, unknown> = { isActive: true };

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && typeof search === 'string') {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const products = await Product.find(query).sort({ createdAt: -1 });

    // Transform to frontend format
    const formattedProducts = products.map((product) => ({
      id: product._id.toString(),
      name: product.name,
      description: product.description,
      category: product.category,
      notes: product.notes,
      image: product.image,
      variants: (product.variants || [])
        .filter(Boolean)
        .map((variant, index) => ({
          id:
            (variant as { _id?: mongoose.Types.ObjectId })._id?.toString() ||
            variant.sku ||
            `${product._id.toString()}-${index}`,
          name: variant.name,
          type: variant.type,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
        })),
    }));

    res.json({ products: formattedProducts });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id - Get single product
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }

    res.json({
      product: {
        id: product._id.toString(),
        name: product.name,
        description: product.description,
        category: product.category,
        notes: product.notes,
        image: product.image,
        variants: (product.variants || [])
          .filter(Boolean)
          .map((variant, index) => ({
            id:
              (variant as { _id?: mongoose.Types.ObjectId })._id?.toString() ||
              variant.sku ||
              `${product._id.toString()}-${index}`,
            name: variant.name,
            type: variant.type,
            price: variant.price,
            stock: variant.stock,
            sku: variant.sku,
          })),
      },
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// POST /api/products - Create a new product
router.post('/', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
  try {
    const newProduct = new Product(req.body);
    await newProduct.save();
    
    res.status(201).json({
      product: {
        id: newProduct._id.toString(),
        name: newProduct.name,
        description: newProduct.description,
        category: newProduct.category,
        notes: newProduct.notes,
        image: newProduct.image,
        variants: (newProduct.variants || []).map((variant, index) => ({
          id: (variant as { _id?: mongoose.Types.ObjectId })._id?.toString() || variant.sku || `${newProduct._id.toString()}-${index}`,
          name: variant.name,
          type: variant.type,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
        })),
      }
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id - Update an existing product
router.put('/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const updatedProduct = await Product.findByIdAndUpdate(id, req.body, { new: true });
    
    if (!updatedProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    res.json({
      product: {
        id: updatedProduct._id.toString(),
        name: updatedProduct.name,
        description: updatedProduct.description,
        category: updatedProduct.category,
        notes: updatedProduct.notes,
        image: updatedProduct.image,
        variants: (updatedProduct.variants || []).map((variant, index) => ({
          id: (variant as { _id?: mongoose.Types.ObjectId })._id?.toString() || variant.sku || `${updatedProduct._id.toString()}-${index}`,
          name: variant.name,
          type: variant.type,
          price: variant.price,
          stock: variant.stock,
          sku: variant.sku,
        })),
      }
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id - Delete a product
router.delete('/:id', [authenticateToken, requireAdmin], async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const deletedProduct = await Product.findByIdAndDelete(id);
    
    if (!deletedProduct) {
      res.status(404).json({ error: 'Product not found' });
      return;
    }
    
    res.json({ message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/bulk - Bulk import products (JSON)
router.post('/bulk', [authenticateToken, requireAdmin, upload.single('file')], async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded.' });
      return;
    }

    const parsed = JSON.parse(req.file.buffer.toString('utf-8'));
    const productsArray = Array.isArray(parsed) ? parsed : parsed.products;

    if (!Array.isArray(productsArray) || productsArray.length === 0) {
      res.status(400).json({ error: 'Invalid format. Expected an array of products or { products: [...] }' });
      return;
    }

    const report = { created: 0, updated: 0, errors: [] as string[] };

    for (const entry of productsArray) {
      try {
        const { id, name, category, image, variants } = entry;

        if (!variants || !Array.isArray(variants) || variants.length === 0) {
          report.errors.push(`Product ${name || id || 'unknown'} has no variants`);
          continue;
        }

        if (id) {
          // Update by product id
          const product = await Product.findById(id);
          if (!product) {
            // Create new product
            const newProduct = new Product({
              name: name || 'Unnamed Product',
              description: entry.description || '',
              category: category || 'Fragrances',
              notes: entry.notes || [],
              image: image || '',
              variants: variants.map((v: any) => ({
                name: v.name || '',
                type: v.type || 'EDP',
                price: v.price ?? 0,
                stock: v.stock ?? 0,
                sku: v.sku || ''
              }))
            });
            await newProduct.save();
            report.created++;
          } else {
            product.name = name ?? product.name;
            if (category) product.category = category;
            if (image) product.image = image;

            if (!product.variants) product.variants = [];

            for (const v of variants) {
              if (!v.sku) {
                report.errors.push(`Variant in product ${product.name} missing sku`);
                continue;
              }
              const existingVariant = product.variants.find((pv: any) => pv.sku === v.sku);
              if (existingVariant) {
                if (v.name) existingVariant.name = v.name;
                if (v.price !== undefined) existingVariant.price = v.price;
                if (v.stock !== undefined) existingVariant.stock = v.stock;
              } else {
                product.variants.push({
                  name: v.name || '',
                  type: v.type || 'EDP',
                  price: v.price ?? 0,
                  stock: v.stock ?? 0,
                  sku: v.sku || ''
                } as any);
              }
            }

            await product.save();
            report.updated++;
          }
        } else {
          // No product id provided — try to match by variant SKU
          let matched = false;
          for (const v of variants) {
            if (v.sku) {
              const product = await Product.findOne({ 'variants.sku': v.sku });
              if (product) {
                product.name = name ?? product.name;
                if (category) product.category = category;
                if (image) product.image = image;

                if (!product.variants) product.variants = [];
                
                const existingVariant = product.variants.find((pv: any) => pv.sku === v.sku);
                if (existingVariant) {
                  if (v.name) existingVariant.name = v.name;
                  if (v.price !== undefined) existingVariant.price = v.price;
                  if (v.stock !== undefined) existingVariant.stock = v.stock;
                }

                await product.save();
                report.updated++;
                matched = true;
                break;
              }
            }
          }

          if (!matched) {
            const newProduct = new Product({
              name: name || 'Unnamed Product',
              description: entry.description || '',
              category: category || 'Fragrances',
              notes: entry.notes || [],
              image: image || '',
              variants: variants.map((v: any) => ({
                name: v.name || '',
                type: v.type || 'EDP',
                price: v.price ?? 0,
                stock: v.stock ?? 0,
                sku: v.sku || ''
              }))
            });
            await newProduct.save();
            report.created++;
          }
        }
      } catch (err) {
        console.error('Error importing product entry:', err);
        report.errors.push(String(err));
      }
    }

    res.status(200).json({ message: 'Import completed', report: { created: report.created, updated: report.updated, errors: report.errors } });
  } catch (error) {
    console.error('Bulk import error:', error);
    res.status(500).json({ error: 'Failed to import products' });
  }
});

export default router;
