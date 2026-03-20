import mongoose, { Document, Schema } from 'mongoose';

export interface IInventoryOffer extends Document {
  _id: mongoose.Types.ObjectId;
  category: string;
  item: string;
  size: string;
  quantity: number;
  mrp: number;
  offer: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const inventoryOfferSchema = new Schema<IInventoryOffer>(
  {
    category: {
      type: String,
      required: true,
      trim: true,
    },
    item: {
      type: String,
      required: true,
      trim: true,
    },
    size: {
      type: String,
      required: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    mrp: {
      type: Number,
      required: true,
      min: 0,
    },
    offer: {
      type: String,
      required: true,
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster category lookups
inventoryOfferSchema.index({ category: 1, isActive: 1 });
inventoryOfferSchema.index({ item: 1 });

export const InventoryOffer = mongoose.model<IInventoryOffer>('InventoryOffer', inventoryOfferSchema);
export default InventoryOffer;
