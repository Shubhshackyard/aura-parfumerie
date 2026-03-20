import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import InventoryOffer from '../models/InventoryOffer.js';

// Load environment variables
dotenv.config();

// Get directory path for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function seedInventoryOffers() {
  try {
    const mongoUri = process.env.MONGODB_URI;
    
    if (!mongoUri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }

    console.log('Connecting to MongoDB...');
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB');

    // Read JSON file
    const jsonPath = join(__dirname, '../data/inventory-offers.json');
    const inventoryOffersData = JSON.parse(readFileSync(jsonPath, 'utf-8'));

    // Clear existing inventory offers
    console.log('Clearing existing inventory offers...');
    await InventoryOffer.deleteMany({});

    // Transform and insert data
    console.log('Seeding inventory offers...');
    const offersToInsert = inventoryOffersData.map((item: any) => ({
      category: item.category || item.Category,
      item: item.item || item.Item,
      size: String(item.size || item.Size),
      quantity: parseInt(item.quantity || item.QTY) || 0,
      mrp: parseInt(item.mrp || item.MRP) || 0,
      offer: item.offer || item.Offer,
      isActive: true,
    }));

    const result = await InventoryOffer.insertMany(offersToInsert);
    console.log(`Seeded ${result.length} inventory offers`);

    console.log('\n✅ Inventory offers seeded successfully!');
    console.log('\nCategories imported:');
    
    // Group by category for summary
    const categories = [...new Set(offersToInsert.map((o: any) => o.category))];
    categories.forEach(cat => {
      const count = offersToInsert.filter((o: any) => o.category === cat).length;
      console.log(`  - ${cat}: ${count} items`);
    });

  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  }
}

// Run seed
seedInventoryOffers();
