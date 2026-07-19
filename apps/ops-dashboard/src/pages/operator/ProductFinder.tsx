import React, { useState, useMemo } from 'react';
import { Search, MapPin, CheckCircle, RefreshCw, X } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

// Mock inventory list for operator searching
const MOCK_INVENTORY_ITEMS = [
  { sku: 'SKU-ELEC-001', name: 'Intel Core i9 Processor', category: 'Electronics', location: 'A1-R2-S3-B1', status: 'VERIFIED', lastScanned: '2 hours ago', confidence: 98 },
  { sku: 'SKU-ELEC-002', name: 'Samsung 4K Monitor 27"', category: 'Electronics', location: 'A1-R1-S2-B2', status: 'VERIFIED', lastScanned: '4 hours ago', confidence: 96 },
  { sku: 'SKU-FURN-001', name: 'Ergonomic Office Chair', category: 'Furniture', location: 'A2-R3-S1-B1', status: 'VERIFIED', lastScanned: '1 day ago', confidence: 92 },
  { sku: 'SKU-FURN-002', name: 'Standing Desk 180cm', category: 'Furniture', location: 'A2-R1-S3-B2', status: 'MISMATCH', lastScanned: '10 min ago', confidence: 67 },
  { sku: 'SKU-BOOK-001', name: 'Clean Code - Robert Martin', category: 'Books', location: 'A3-R4-S1-B2', status: 'MISSING', lastScanned: '1 hour ago', confidence: 88 },
];

export default function ProductFinder() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');

  const filteredItems = useMemo(() => {
    return MOCK_INVENTORY_ITEMS.filter(item => {
      const matchesQuery = item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.location.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      
      return matchesQuery && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Product Finder</h1>
        <p className="text-sm text-slate-400">Search products by SKU, name, or location to locate them on the map.</p>
      </div>

      {/* Search and Filters */}
      <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search SKU, name, or location..."
            className="pl-10"
          />
          <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['ALL', 'Electronics', 'Furniture', 'Books'].map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none border transition-all ${
                selectedCategory === category
                  ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                  : 'bg-white/02 border-white/06 text-slate-400 hover:bg-white/05'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </Card>

      {/* Results grid */}
      {filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredItems.map(item => (
            <Card key={item.sku} className="space-y-4 hover:border-white/10">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    {item.category}
                  </span>
                  <h3 className="text-base font-semibold text-slate-100 mt-2">{item.name}</h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{item.sku}</p>
                </div>
                
                <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-medium ${
                  item.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                  item.status === 'MISMATCH' ? 'bg-red-500/10 text-red-400' :
                  'bg-orange-500/10 text-orange-400'
                }`}>
                  {item.status}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/02 border border-white/04 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-400" /> Bin Location:
                  </span>
                  <span className="font-mono font-semibold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded-md">
                    {item.location}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Scan Confidence:</span>
                  <span className={`font-semibold ${item.confidence > 80 ? 'text-emerald-400' : 'text-yellow-400'}`}>
                    {item.confidence}%
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Last Verified:</span>
                  <span className="text-slate-300">{item.lastScanned}</span>
                </div>
              </div>

              <div className="flex items-center gap-3.5 pt-2">
                <Button variant="secondary" className="flex-1 btn-sm">
                  Show on Map
                </Button>
                <Button variant="ghost" className="btn-sm flex items-center gap-1.5 text-slate-400 hover:text-slate-200">
                  <RefreshCw className="w-3.5 h-3.5" /> Request Rescan
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="flex flex-col items-center justify-center p-12 text-center border-dashed border-white/10 bg-white/01">
          <Search className="w-12 h-12 text-slate-500 mb-4" />
          <h4 className="font-semibold text-slate-200 mb-1">No products found</h4>
          <p className="text-xs text-slate-400 max-w-[240px]">
            No inventory items matching your search query were found in this warehouse.
          </p>
        </Card>
      )}
    </div>
  );
}
