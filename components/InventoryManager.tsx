import React, { useState } from 'react';
import { Product, ProductVariant, ProductType } from '../types';
import { Edit2, Plus, Save, X, Sparkles, Package } from 'lucide-react';
import { generateProductDescription } from '../services/geminiService';

interface InventoryManagerProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
}

export const InventoryManager: React.FC<InventoryManagerProps> = ({ products, setProducts }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState<Partial<Product>>({
    name: '',
    description: '',
    category: 'Fine Fragrance',
    notes: [],
    image: 'https://picsum.photos/400/500?random=100',
    variants: []
  });
  const [tempNotes, setTempNotes] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const handleStockChange = (productId: string, variantId: string, newStock: number) => {
    setProducts(prev => prev.map(p => {
      if (p.id !== productId) return p;
      return {
        ...p,
        variants: p.variants.map(v => v.id === variantId ? { ...v, stock: newStock } : v)
      };
    }));
  };

  const handleGenerateDesc = async () => {
    if (!newProduct.name) return;
    setIsGenerating(true);
    const notesArray = tempNotes.split(',').map(s => s.trim()).filter(Boolean);
    const desc = await generateProductDescription(newProduct.name, notesArray);
    setNewProduct(prev => ({ ...prev, description: desc, notes: notesArray }));
    setIsGenerating(false);
  };

  const saveNewProduct = () => {
    if (!newProduct.name || !newProduct.category) return;
    
    const product: Product = {
      id: Date.now().toString(),
      name: newProduct.name,
      description: newProduct.description || '',
      category: newProduct.category as any,
      notes: newProduct.notes || [],
      image: newProduct.image || '',
      variants: newProduct.variants || [
        { 
          id: `v_${Date.now()}`, 
          name: 'Standard', 
          type: 'EDP', 
          price: 100, 
          stock: 50, 
          sku: `${newProduct.name?.slice(0,3).toUpperCase()}-001` 
        }
      ]
    };

    setProducts(prev => [product, ...prev]);
    setIsAdding(false);
    setNewProduct({ name: '', description: '', category: 'Fine Fragrance', notes: [], image: '', variants: [] });
    setTempNotes('');
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-brand-100 flex justify-between items-center bg-brand-50/50">
        <div>
           <h2 className="text-xl font-serif font-medium text-brand-900">Inventory Management</h2>
           <p className="text-sm text-brand-500">Track stock levels and curate the collection.</p>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 bg-brand-800 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-brand-700 transition"
        >
          <Plus size={16} /> Add Product
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {isAdding && (
          <div className="mb-8 bg-brand-50 p-6 rounded-xl border border-brand-200">
            <div className="flex justify-between items-center mb-4">
               <h3 className="font-serif text-lg text-brand-900">New Product Entry</h3>
               <button onClick={() => setIsAdding(false)}><X size={20} className="text-brand-400"/></button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <div className="space-y-4">
                 <input 
                   placeholder="Product Name" 
                   value={newProduct.name}
                   onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                   className="w-full p-2 border rounded"
                 />
                 <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value as any})}
                    className="w-full p-2 border rounded"
                 >
                    <option value="Fine Fragrance">Fine Fragrance</option>
                    <option value="Home Collection">Home Collection</option>
                    <option value="Accessories">Accessories</option>
                 </select>
                 <input 
                   placeholder="Notes (comma separated)" 
                   value={tempNotes}
                   onChange={e => setTempNotes(e.target.value)}
                   className="w-full p-2 border rounded"
                 />
               </div>
               <div className="space-y-4">
                  <div className="relative">
                    <textarea 
                      placeholder="Description" 
                      value={newProduct.description}
                      onChange={e => setNewProduct({...newProduct, description: e.target.value})}
                      rows={4}
                      className="w-full p-2 border rounded"
                    />
                    <button 
                      onClick={handleGenerateDesc}
                      disabled={isGenerating || !newProduct.name}
                      className="absolute bottom-2 right-2 text-xs bg-brand-200 text-brand-800 px-2 py-1 rounded flex items-center gap-1 hover:bg-brand-300"
                    >
                      <Sparkles size={12}/> {isGenerating ? 'Writing...' : 'AI Generate'}
                    </button>
                  </div>
                  <button 
                    onClick={saveNewProduct}
                    className="w-full bg-brand-900 text-white py-2 rounded hover:bg-brand-800"
                  >
                    Save Product
                  </button>
               </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          {products.map(product => (
            <div key={product.id} className="border border-brand-100 rounded-lg p-4 hover:shadow-sm transition bg-white">
              <div className="flex items-start gap-4">
                <img src={product.image} className="w-16 h-20 object-cover rounded bg-gray-100" />
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-serif text-lg text-brand-900">{product.name}</h3>
                    <span className="text-xs bg-brand-50 text-brand-600 px-2 py-1 rounded border border-brand-100">
                      {product.category}
                    </span>
                  </div>
                  <p className="text-xs text-brand-500 mb-4">{product.notes.join(', ')}</p>
                  
                  <div className="bg-brand-50 rounded-lg p-3">
                    <div className="text-xs font-semibold text-brand-400 uppercase tracking-wider mb-2">Variants Inventory</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {product.variants.map(variant => (
                        <div key={variant.id} className="flex items-center justify-between bg-white p-2 rounded border border-brand-100">
                          <div>
                            <span className="text-sm font-medium text-brand-800 block">{variant.name}</span>
                            <span className="text-[10px] text-brand-400">{variant.sku} • ${variant.price}</span>
                          </div>
                          <div className="flex items-center gap-2">
                             <span className="text-[10px] uppercase text-brand-400">Stock</span>
                             <input 
                               type="number"
                               value={variant.stock}
                               onChange={(e) => handleStockChange(product.id, variant.id, parseInt(e.target.value))}
                               className="w-16 text-center text-sm border border-brand-200 rounded py-1 focus:ring-1 focus:ring-brand-400 outline-none"
                             />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
