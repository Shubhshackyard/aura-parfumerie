import React, { useState } from 'react';
import { 
  Users, MessageSquare, PieChart, Search, 
  MoreVertical, Mail, Phone, ExternalLink, 
  AlertCircle, CheckCircle, Clock, 
  LayoutDashboard, Megaphone, Package, ShoppingCart
} from 'lucide-react';
import { Customer, Message, Product, Order } from '../types';
import { analyzeCustomerInteraction } from '../services/geminiService';
import { CampaignManager } from './CampaignManager';
import { InventoryManager } from './InventoryManager';
import { OrderManager } from './OrderManager';
import { motion } from 'framer-motion';

interface CrmDashboardProps {
  customers: Customer[];
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  orders: Order[];
  setOrders: React.Dispatch<React.SetStateAction<Order[]>>;
}

type Tab = 'dashboard' | 'campaigns' | 'inventory' | 'orders';

export const CrmDashboard: React.FC<CrmDashboardProps> = ({ 
  customers, setCustomers, products, setProducts, orders, setOrders 
}) => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filter, setFilter] = useState<'All' | 'VIP' | 'Active' | 'Lead' | 'At Risk'>('All');

  const selectedCustomer = selectedCustomerId ? customers.find(c => c.id === selectedCustomerId) || null : null;
  const filteredCustomers = customers.filter(c => filter === 'All' || c.status === filter);

  const handleAnalyze = async (customer: Customer) => {
    setIsAnalyzing(true);
    const analysis = await analyzeCustomerInteraction(customer.messages);
    
    // Update customer with AI insights
    const updatedCustomer: Customer = {
      ...customer,
      sentiment: analysis.sentiment,
      status: analysis.statusSuggestion,
      preferredNotes: [...new Set([...customer.preferredNotes, ...analysis.extractedPreferences])],
    };

    setCustomers(prev => prev.map(c => c.id === customer.id ? updatedCustomer : c));
    // selectedCustomer will automatically reflect this update since it's derived from customers prop
    setIsAnalyzing(false);
  };

  const handleUpdateOrderStatus = (orderId: string, status: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const SentimentBadge = ({ sentiment }: { sentiment: string }) => {
    const colors = {
      Positive: 'bg-green-100 text-green-800 border-green-200',
      Neutral: 'bg-gray-100 text-gray-800 border-gray-200',
      Negative: 'bg-red-100 text-red-800 border-red-200'
    };
    const key = sentiment as keyof typeof colors;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${colors[key] || colors.Neutral}`}>
        {sentiment}
      </span>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const colors = {
      VIP: 'bg-purple-100 text-purple-800',
      Active: 'bg-blue-100 text-blue-800',
      Lead: 'bg-yellow-100 text-yellow-800',
      'At Risk': 'bg-red-100 text-red-800'
    };
    const key = status as keyof typeof colors;
    return (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${colors[key] || 'bg-gray-100'}`}>
        {status}
      </span>
    );
  };

  return (
    <div className="bg-brand-50 min-h-[calc(100vh-80px)] p-6">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Navigation / Stats Sidebar */}
        <div className="lg:col-span-3 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-xs font-bold text-brand-400 uppercase tracking-widest mb-4">Menu</h2>
            <nav className="space-y-2">
              <button 
                onClick={() => setActiveTab('dashboard')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'dashboard' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <LayoutDashboard size={18} />
                Customers & Insights
              </button>
              <button 
                onClick={() => setActiveTab('campaigns')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'campaigns' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <Megaphone size={18} />
                Campaigns
              </button>
              <button 
                onClick={() => setActiveTab('inventory')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'inventory' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <Package size={18} />
                Inventory
              </button>
              <button 
                onClick={() => setActiveTab('orders')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition
                  ${activeTab === 'orders' ? 'bg-brand-100 text-brand-900' : 'text-brand-600 hover:bg-brand-50'}`}
              >
                <ShoppingCart size={18} />
                Orders
                {orders.filter(o => o.status === 'Pending').length > 0 && (
                  <span className="ml-auto bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full">
                    {orders.filter(o => o.status === 'Pending').length}
                  </span>
                )}
              </button>
            </nav>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-brand-100">
            <h2 className="text-lg font-serif font-medium text-brand-900 mb-4">Overview</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-200 rounded-full text-brand-800"><Users size={16}/></div>
                  <span className="text-sm font-medium text-brand-700">Total Customers</span>
                </div>
                <span className="text-lg font-bold text-brand-900">{customers.length}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-brand-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-200 rounded-full text-green-800"><CheckCircle size={16}/></div>
                  <span className="text-sm font-medium text-brand-700">Orders Today</span>
                </div>
                <span className="text-lg font-bold text-brand-900">
                  {orders.filter(o => new Date(o.date).toDateString() === new Date().toDateString()).length}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Area - Dynamic */}
        <div className="lg:col-span-9 h-[650px]">
          {activeTab === 'dashboard' ? (
            <div className="grid grid-cols-1 lg:grid-cols-9 gap-6 h-full">
              {/* List */}
              <div className="lg:col-span-5 bg-white rounded-xl shadow-sm border border-brand-100 overflow-hidden flex flex-col h-full">
                <div className="p-4 border-b border-brand-100 flex items-center justify-between">
                  <h2 className="text-lg font-serif font-medium text-brand-900">Customers</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-400 w-4 h-4" />
                    <input 
                      type="text" 
                      placeholder="Search..." 
                      className="pl-9 pr-4 py-1.5 bg-brand-50 border-none rounded-full text-sm focus:ring-1 focus:ring-brand-300 w-32"
                    />
                  </div>
                </div>
                
                <div className="flex gap-2 p-2 border-b border-brand-50 overflow-x-auto">
                  {['All', 'VIP', 'Active', 'Lead', 'At Risk'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFilter(f as any)}
                      className={`px-3 py-1 rounded-md text-xs font-medium transition ${filter === f ? 'bg-brand-100 text-brand-900' : 'text-brand-500 hover:text-brand-700'}`}
                    >
                      {f}
                    </button>
                  ))}
                </div>

                <div className="overflow-y-auto flex-1">
                  {filteredCustomers.map(customer => (
                    <div 
                      key={customer.id}
                      onClick={() => setSelectedCustomerId(customer.id)}
                      className={`p-4 flex items-center gap-4 hover:bg-brand-50 cursor-pointer border-b border-brand-50 transition
                        ${selectedCustomerId === customer.id ? 'bg-brand-50 border-l-4 border-l-brand-800' : 'border-l-4 border-l-transparent'}
                      `}
                    >
                      <img src={customer.avatar} alt={customer.name} className="w-10 h-10 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                          <h3 className="text-sm font-semibold text-brand-900 truncate">{customer.name}</h3>
                          <span className="text-[10px] text-brand-400 whitespace-nowrap">
                            {new Date(customer.lastInteraction).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <StatusBadge status={customer.status} />
                          <SentimentBadge sentiment={customer.sentiment} />
                        </div>
                        <p className="text-xs text-brand-500 truncate mt-1">
                          {customer.messages[customer.messages.length - 1]?.content || 'No messages yet'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Detail */}
              <div className="lg:col-span-4 bg-white rounded-xl shadow-sm border border-brand-100 flex flex-col h-full">
                {selectedCustomer ? (
                  <>
                    <div className="p-6 border-b border-brand-100 bg-brand-50/50">
                      <div className="flex items-center gap-4 mb-4">
                        <img src={selectedCustomer.avatar} alt={selectedCustomer.name} className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm" />
                        <div>
                          <h2 className="text-xl font-serif font-medium text-brand-900">{selectedCustomer.name}</h2>
                          <div className="flex gap-2 text-brand-500 mt-1">
                            <a href={`mailto:${selectedCustomer.email}`} className="p-1 hover:bg-brand-100 rounded"><Mail size={14}/></a>
                            <a href={`tel:${selectedCustomer.phone}`} className="p-1 hover:bg-brand-100 rounded"><Phone size={14}/></a>
                            <button className="p-1 hover:bg-brand-100 rounded"><MessageSquare size={14}/></button>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                         <div className="text-xs">
                           <span className="block text-brand-400 uppercase tracking-wider">Status</span>
                           <StatusBadge status={selectedCustomer.status} />
                         </div>
                         <div className="text-xs text-right">
                           <span className="block text-brand-400 uppercase tracking-wider">Sentiment</span>
                           <SentimentBadge sentiment={selectedCustomer.sentiment} />
                         </div>
                      </div>
                    </div>

                    <div className="p-6 overflow-y-auto flex-1 space-y-6">
                      
                      {/* AI Insights Section */}
                      <div className="bg-gradient-to-br from-brand-50 to-white p-4 rounded-lg border border-brand-100">
                        <div className="flex justify-between items-center mb-2">
                          <h3 className="text-sm font-semibold text-brand-800 flex items-center gap-2">
                            <SparklesIcon /> Gemini Insights
                          </h3>
                          <button 
                            onClick={() => handleAnalyze(selectedCustomer)}
                            disabled={isAnalyzing}
                            className="text-[10px] bg-brand-800 text-white px-2 py-1 rounded hover:bg-brand-700 disabled:opacity-50"
                          >
                            {isAnalyzing ? 'Analyzing...' : 'Refresh Analysis'}
                          </button>
                        </div>
                        <p className="text-xs text-brand-600 leading-relaxed mb-3">
                          Customer shows strong interest in <span className="font-semibold">{selectedCustomer.preferredNotes.join(', ') || 'undetermined notes'}</span>. 
                          Engagement is consistent across channels.
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {selectedCustomer.preferredNotes.map(note => (
                            <span key={note} className="text-[10px] px-2 py-1 bg-white border border-brand-200 rounded-full text-brand-600">
                              {note}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Past Orders */}
                      {selectedCustomer.orders && selectedCustomer.orders.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-brand-900 mb-3">Purchase History</h3>
                          <div className="space-y-2">
                            {selectedCustomer.orders.map(o => (
                              <div key={o.id} className="text-xs border border-brand-100 rounded-lg p-3 bg-brand-50 hover:bg-brand-100 transition-colors">
                                <div className="flex justify-between items-center mb-1">
                                  <span className="font-medium text-brand-900 font-mono">#{o.id}</span>
                                  <span className="font-bold text-brand-800">${o.total.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between text-brand-500">
                                  <span>{new Date(o.date).toLocaleDateString()}</span>
                                  <span>{o.items.length} item{o.items.length !== 1 ? 's' : ''}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Interaction History (Mini) */}
                      <div>
                         <h3 className="text-sm font-semibold text-brand-900 mb-3">Recent Interactions</h3>
                         <div className="space-y-3">
                           {selectedCustomer.messages.slice(-3).map((msg) => (
                             <div key={msg.id} className="text-xs">
                               <div className="flex justify-between text-brand-400 mb-1">
                                 <span className="capitalize font-medium">{msg.sender} via {msg.channel}</span>
                                 <span>{new Date(msg.timestamp).toLocaleDateString()}</span>
                               </div>
                               <div className="p-2 bg-brand-50 rounded text-brand-700 border border-brand-100">
                                 {msg.content}
                               </div>
                             </div>
                           ))}
                         </div>
                      </div>

                      {/* Lifecycle Actions */}
                      <div>
                        <h3 className="text-sm font-semibold text-brand-900 mb-3">Lifecycle Actions</h3>
                        <div className="grid grid-cols-2 gap-2">
                          <button className="flex items-center justify-center gap-2 py-2 border border-brand-200 rounded text-xs font-medium hover:bg-brand-50 transition">
                            Send Catalog
                          </button>
                           <button className="flex items-center justify-center gap-2 py-2 border border-brand-200 rounded text-xs font-medium hover:bg-brand-50 transition">
                            Offer 10% Off
                          </button>
                        </div>
                      </div>

                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-brand-300 p-8 text-center">
                    <Users size={48} className="mb-4 opacity-50" />
                    <p>Select a customer to view their lifecycle profile and AI insights.</p>
                  </div>
                )}
              </div>
            </div>
          ) : activeTab === 'campaigns' ? (
            <CampaignManager customers={customers} />
          ) : activeTab === 'inventory' ? (
            <InventoryManager products={products} setProducts={setProducts} />
          ) : (
             <OrderManager orders={orders} onUpdateStatus={handleUpdateOrderStatus} />
          )}
        </div>
      </div>
    </div>
  );
};

const SparklesIcon = () => (
  <svg className="w-4 h-4 text-brand-600" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L14.4 7.2L20 9.6L14.4 12L12 17.2L9.6 12L4 9.6L9.6 7.2L12 2Z" fill="currentColor"/>
  </svg>
);