import React, { useState } from 'react';
import { Order } from '../types';
import { Package, Clock, CheckCircle, Truck, Search } from 'lucide-react';

interface OrderManagerProps {
  orders: Order[];
  onUpdateStatus: (orderId: string, status: Order['status']) => void;
}

export const OrderManager: React.FC<OrderManagerProps> = ({ orders, onUpdateStatus }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'Pending': return 'bg-yellow-100 text-yellow-800';
      case 'Processing': return 'bg-blue-100 text-blue-800';
      case 'Shipped': return 'bg-purple-100 text-purple-800';
      case 'Delivered': return 'bg-green-100 text-green-800';
      case 'Cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredOrders = orders.filter(order => 
    order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
    order.customerDetails.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col h-full">
      <div className="p-6 border-b border-brand-100 bg-brand-50/50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
         <div>
            <h2 className="text-xl font-serif font-medium text-brand-900">Orders</h2>
            <p className="text-sm text-brand-500">Monitor fulfillment and customer purchases.</p>
         </div>
         <div className="relative w-full sm:w-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search ID or Customer..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full sm:w-64 pl-9 pr-4 py-2 bg-white border border-brand-200 rounded-lg text-sm focus:ring-1 focus:ring-brand-400 outline-none transition-shadow"
            />
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {orders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-brand-300">
            <Package size={48} className="mb-4 opacity-50" />
            <p>No orders yet. Wait for the magic to happen.</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-brand-300">
            <Search size={48} className="mb-4 opacity-50" />
            <p>No orders found matching "{searchQuery}".</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map(order => (
              <div key={order.id} className="border border-brand-100 rounded-lg p-5 hover:shadow-md transition">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <span className="font-bold text-brand-900">#{order.id.slice(-6).toUpperCase()}</span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-sm text-brand-600">{order.customerDetails.name} • {new Date(order.date).toLocaleDateString()}</p>
                    <p className="text-xs text-brand-400 mt-1">{order.customerDetails.address}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-xl font-serif text-brand-900">${order.total}</span>
                    <select 
                      value={order.status}
                      onChange={(e) => onUpdateStatus(order.id, e.target.value as any)}
                      className="mt-2 text-xs border border-brand-200 rounded p-1 bg-white"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processing">Processing</option>
                      <option value="Shipped">Shipped</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                </div>

                <div className="bg-brand-50 rounded p-3 text-sm">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between py-1 text-brand-700">
                      <span>{item.quantity}x {item.productName} <span className="text-brand-400 text-xs">({item.variantName})</span></span>
                      <span>${item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
