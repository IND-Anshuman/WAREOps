import React, { useState, useMemo, useEffect } from 'react';
import { 
  Search, Trash2, Plus, CheckCircle2, MapPin, 
  RefreshCw, Camera, AlertCircle, Sparkles, Barcode, Trash,
  ArrowDownLeft, ArrowUpRight, ShieldCheck, Loader2
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Table } from '../../components/ui/Table';
import { productsApi } from '../../api/client';

// Preset mock QR codes to scan for Inbound (new products not in DB yet)
const INBOUND_PRESET_SCANS = [
  { sku: 'SKU-ELEC-005', name: 'Sony PlayStation 5 Slim', category: 'Electronics', location: 'A1-R4-S3-B2', weight: 3.9 },
  { sku: 'SKU-TOY-101', name: 'LEGO Star Wars Millennium Falcon', category: 'Toys', location: 'A3-R2-S1-B2', weight: 4.2 },
  { sku: 'SKU-MED-050', name: 'Premium First Aid Kit', category: 'Medical', location: 'A2-R2-S2-B1', weight: 1.2 },
];

export default function InventoryManagement() {
  const [activeTab, setActiveTab] = useState<'catalog' | 'scanner'>('catalog');
  const [catalogItems, setCatalogItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Catalog manager state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedSkus, setSelectedSkus] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'danger' } | null>(null);

  // Scanner simulator state
  const [scannerMode, setScannerMode] = useState<'inbound' | 'outbound'>('inbound');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any | null>(null);

  // Fetch products from backend DB
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const items = await productsApi.getProducts();
      setCatalogItems(items);
    } catch (e) {
      showToast("Failed to fetch products from backend database", "danger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Show temp toast helper
  const showToast = (text: string, type: 'success' | 'danger' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Central search filter
  const filteredItems = useMemo(() => {
    return catalogItems.filter(item => {
      const matchesQuery = item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                           item.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
      return matchesQuery && matchesCategory;
    });
  }, [catalogItems, searchQuery, selectedCategory]);

  // Bulk select toggles
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedSkus(filteredItems.map(item => item.sku));
    } else {
      setSelectedSkus([]);
    }
  };

  const handleSelectRow = (sku: string, checked: boolean) => {
    if (checked) {
      setSelectedSkus(prev => [...prev, sku]);
    } else {
      setSelectedSkus(prev => prev.filter(s => s !== sku));
    }
  };

  // Delete action (bulk products leaving warehouse)
  const handleRemoveProducts = async () => {
    if (selectedSkus.length === 0) return;
    try {
      await productsApi.deleteProducts(selectedSkus);
      showToast(`Successfully removed ${selectedSkus.length} product(s) from database.`, 'danger');
      setSelectedSkus([]);
      await fetchProducts();
    } catch (err) {
      showToast("Failed to delete products from database", "danger");
    }
  };

  // Scanning presets trigger
  const handleSimulateScan = (preset: any) => {
    setIsScanning(true);
    setScanResult(null);
    
    setTimeout(() => {
      setIsScanning(false);
      setScanResult(preset);
      showToast(`Successfully decoded QR code for ${preset.sku}`);
    }, 1500);
  };

  // Save inbound scanned product to backend DB
  const handleAddScannedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;

    try {
      await productsApi.addProduct({
        sku: scanResult.sku,
        name: scanResult.name,
        category: scanResult.category,
        location: scanResult.location
      });
      showToast(`Added ${scanResult.name} to database.`);
      setScanResult(null);
      await fetchProducts();
    } catch (err: any) {
      const msg = err.response?.data?.detail || "Failed to add product to database";
      showToast(msg, "danger");
    }
  };

  // Process outbound scanned product deletion from DB
  const handleRemoveScannedProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!scanResult) return;

    try {
      await productsApi.deleteProduct(scanResult.sku);
      showToast(`Product ${scanResult.sku} successfully shipped out & removed from DB.`, 'danger');
      setScanResult(null);
      await fetchProducts();
    } catch (err) {
      showToast("Failed to remove product from database", "danger");
    }
  };

  // Dynamic outbound scanning presets based on what is CURRENTLY in the DB
  const outboundPresetScans = useMemo(() => {
    return catalogItems.slice(0, 3).map(item => ({
      sku: item.sku,
      name: item.name,
      category: item.category,
      location: item.location,
      weight: 1.0
    }));
  }, [catalogItems]);

  return (
    <div className="space-y-6 min-h-screen pb-12">
      {/* Toast Alert */}
      {toastMessage && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-2xl transition-all border duration-300 animate-slide-in
          ${toastMessage.type === 'success' 
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
            : 'bg-red-500/10 border-red-500/20 text-red-400'}`}
        >
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm font-semibold">{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-indigo-400 mb-1">Logistics Operations</p>
        <h1 className="text-2xl font-bold text-slate-100">Inventory & Catalog Manager</h1>
        <p className="text-sm text-slate-500 mt-1">Directly manage backend inventory. Inbound stock via QR scans, or remove outbound inventory leaving the warehouse.</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] border border-white/[0.06] p-1 w-fit">
        <button
          onClick={() => setActiveTab('catalog')}
          className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300
            ${activeTab === 'catalog' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          Product Catalog ({catalogItems.length})
        </button>
        <button
          onClick={() => setActiveTab('scanner')}
          className={`px-5 py-2.5 rounded-lg text-xs font-semibold transition-all duration-300 flex items-center gap-1.5
            ${activeTab === 'scanner' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' : 'text-slate-500 hover:text-slate-300'}`}
        >
          <Camera className="h-3.5 w-3.5" /> Inbound/Outbound QR Scanner
        </button>
      </div>

      {/* TAB 1: Catalog view with deletion */}
      {activeTab === 'catalog' && (
        <div className="space-y-4">
          <Card className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-md">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search SKU, name, or location..."
                className="pl-10"
              />
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
            </div>

            <div className="flex gap-2 self-start md:self-auto w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
              {['ALL', 'Electronics', 'Furniture', 'Books', 'Toys', 'Medical'].map(cat => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold select-none border transition-all ${
                    selectedCategory === cat
                      ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                      : 'bg-white/02 border-white/06 text-slate-400 hover:bg-white/05'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </Card>

          {/* Action Bar for selections */}
          {selectedSkus.length > 0 && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/[0.04] p-4 flex items-center justify-between animate-fade-in">
              <span className="text-xs font-semibold text-slate-300">
                {selectedSkus.length} product(s) selected
              </span>
              <Button
                variant="primary"
                onClick={handleRemoveProducts}
                className="bg-red-600 hover:bg-red-500 text-xs py-2 px-4 flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" /> Remove leaving products
              </Button>
            </div>
          )}

          {/* Catalog Table */}
          <Card className="p-0 overflow-hidden relative">
            {loading && (
              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[1px] flex items-center justify-center z-10">
                <Loader2 className="h-8 w-8 text-indigo-500 animate-spin" />
              </div>
            )}
            <Table
              headers={[
                <input 
                  type="checkbox" 
                  checked={selectedSkus.length === filteredItems.length && filteredItems.length > 0}
                  onChange={(e) => handleSelectAll(e.target.checked)}
                  className="rounded border-white/10 bg-slate-900 accent-indigo-500 w-4 h-4"
                />,
                'SKU / Catalog Name',
                'Category',
                'Last Location',
                'Status',
                'Verification Confidence'
              ]}
              rows={filteredItems.map(item => [
                <input 
                  type="checkbox"
                  checked={selectedSkus.includes(item.sku)}
                  onChange={(e) => handleSelectRow(item.sku, e.target.checked)}
                  className="rounded border-white/10 bg-slate-900 accent-indigo-500 w-4 h-4"
                />,
                <div className="flex flex-col">
                  <span className="font-semibold text-slate-200">{item.name}</span>
                  <span className="text-xs font-mono text-slate-500">{item.sku}</span>
                </div>,
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-white/05 border border-white/08 text-slate-400 uppercase font-mono">{item.category}</span>,
                <span className="font-mono text-xs text-indigo-300 font-semibold">{item.location}</span>,
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                  item.status === 'VERIFIED' ? 'bg-emerald-500/10 text-emerald-400' :
                  item.status === 'MISMATCH' ? 'bg-red-500/10 text-red-400' :
                  'bg-orange-500/10 text-orange-400'
                }`}>{item.status}</span>,
                <span className="font-semibold text-slate-350">{item.confidence}%</span>
              ])}
            />
            {filteredItems.length === 0 && !loading && (
              <div className="p-12 text-center text-slate-500 text-sm">
                No catalog items match current filters.
              </div>
            )}
          </Card>
        </div>
      )}

      {/* TAB 2: Inbound/Outbound QR scanner simulation */}
      {activeTab === 'scanner' && (
        <div className="space-y-6">
          {/* Scanner Mode Selector */}
          <div className="flex gap-4 items-center bg-white/[0.02] border border-white/[0.06] p-4 rounded-xl">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Scanner Operation Mode:</span>
            <div className="flex gap-2">
              <button
                onClick={() => { setScannerMode('inbound'); setScanResult(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-300
                  ${scannerMode === 'inbound' 
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-300' 
                    : 'bg-white/02 border-white/06 text-slate-400 hover:bg-white/05'}`}
              >
                <ArrowDownLeft className="h-4 w-4" /> Inbound (Receive Inventory)
              </button>
              <button
                onClick={() => { setScannerMode('outbound'); setScanResult(null); }}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold border transition-all duration-300
                  ${scannerMode === 'outbound' 
                    ? 'bg-red-500/10 border-red-500/40 text-red-300' 
                    : 'bg-white/02 border-white/06 text-slate-400 hover:bg-white/05'}`}
              >
                <ArrowUpRight className="h-4 w-4" /> Outbound (Ship Inventory)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            
            {/* Scanner Viewport */}
            <div className="lg:col-span-3 space-y-4">
              <Card className={`p-0 overflow-hidden relative border-white/[0.08] bg-slate-950 flex flex-col items-center justify-center min-h-[380px] group transition-all duration-500
                ${scannerMode === 'outbound' ? 'ring-1 ring-red-500/20' : 'ring-1 ring-indigo-500/20'}`}>
                
                {/* Scan overlays */}
                <div className="absolute inset-0 z-10 flex flex-col justify-between pointer-events-none p-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-1.5 bg-black/80 px-3 py-1 rounded-full border border-white/10 text-[10px] font-semibold tracking-wider">
                      <span className={`w-2 h-2 rounded-full ${
                        isScanning 
                          ? 'bg-red-500 animate-ping' 
                          : scannerMode === 'outbound' ? 'bg-orange-500' : 'bg-emerald-500'}`} 
                      />
                      {isScanning ? 'DECODING QR DATA' : scannerMode === 'outbound' ? 'OUTBOUND DOCK FEED' : 'INBOUND DOCK FEED'}
                    </div>
                    <Barcode className="h-4 w-4 text-slate-400" />
                  </div>

                  {/* Corners border indicators */}
                  <div className="relative w-64 h-64 mx-auto self-center flex items-center justify-center">
                    {/* Laser sweep animation when active */}
                    {isScanning && (
                      <div className={`absolute left-0 w-full h-0.5 shadow-md z-20 animate-scan-sweep
                        ${scannerMode === 'outbound' ? 'bg-red-500 shadow-red-500' : 'bg-emerald-500 shadow-emerald-500'}`} 
                      />
                    )}
                    {/* Corners */}
                    <div className={`absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 rounded-tl-xl transition-colors duration-500
                      ${scannerMode === 'outbound' ? 'border-red-500' : 'border-indigo-500'}`} />
                    <div className={`absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 rounded-tr-xl transition-colors duration-500
                      ${scannerMode === 'outbound' ? 'border-red-500' : 'border-indigo-500'}`} />
                    <div className={`absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 rounded-bl-xl transition-colors duration-500
                      ${scannerMode === 'outbound' ? 'border-red-500' : 'border-indigo-500'}`} />
                    <div className={`absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 rounded-br-xl transition-colors duration-500
                      ${scannerMode === 'outbound' ? 'border-red-500' : 'border-indigo-500'}`} />
                    
                    {!isScanning && !scanResult && (
                      <Camera className="h-10 w-10 text-white/10 group-hover:text-white/20 transition-all" />
                    )}

                    {/* Scanned Beep confirmation effect */}
                    {scanResult && !isScanning && (
                      <div className={`absolute inset-0 border rounded-xl flex items-center justify-center animate-pulse
                        ${scannerMode === 'outbound' ? 'border-red-500 bg-red-500/5' : 'border-emerald-500 bg-emerald-500/5'}`}>
                        <CheckCircle2 className={`h-10 w-10 ${scannerMode === 'outbound' ? 'text-red-400' : 'text-emerald-400'}`} />
                      </div>
                    )}
                  </div>

                  <div className="text-center text-[10px] text-slate-500 uppercase tracking-widest bg-black/40 py-1.5 rounded-lg border border-white/04">
                    Dock Scanner ID: WH-{scannerMode === 'outbound' ? 'OUTBOUND' : 'INBOUND'}-QR-04
                  </div>
                </div>

                {/* Simulated camera static background */}
                <div className={`absolute inset-0 transition-colors duration-500 ${scannerMode === 'outbound' ? 'bg-[#1a0a0a]' : 'bg-[#080d1a]'} overflow-hidden`}>
                  <div className="absolute inset-0 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[size:100%_4px,3px_100%]" />
                </div>
              </Card>

              {/* Simulated Scan presets */}
              <div className="space-y-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                  Simulate QR Scan Barcodes ({scannerMode === 'inbound' ? 'Inbound catalog seeds' : 'Active DB Stock'})
                </span>
                
                {scannerMode === 'inbound' ? (
                  <div className="grid grid-cols-3 gap-3">
                    {INBOUND_PRESET_SCANS.map(preset => (
                      <button
                        key={preset.sku}
                        onClick={() => handleSimulateScan(preset)}
                        disabled={isScanning}
                        className="flex flex-col items-center justify-center p-3 rounded-xl border border-white/06 bg-white/[0.02] hover:bg-white/[0.05] disabled:opacity-50 transition-all text-center gap-1.5"
                      >
                        <Barcode className="h-5 w-5 text-indigo-400" />
                        <span className="text-xs text-slate-200 font-semibold">{preset.sku}</span>
                        <span className="text-[9px] text-slate-500 font-mono truncate w-full">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="grid grid-cols-3 gap-3">
                    {outboundPresetScans.length > 0 ? (
                      outboundPresetScans.map(preset => (
                        <button
                          key={preset.sku}
                          onClick={() => handleSimulateScan(preset)}
                          disabled={isScanning}
                          className="flex flex-col items-center justify-center p-3 rounded-xl border border-red-500/10 bg-white/[0.02] hover:bg-red-500/[0.04] disabled:opacity-50 transition-all text-center gap-1.5"
                        >
                          <Barcode className="h-5 w-5 text-red-400" />
                          <span className="text-xs text-slate-200 font-semibold">{preset.sku}</span>
                          <span className="text-[9px] text-slate-500 font-mono truncate w-full">{preset.name}</span>
                        </button>
                      ))
                    ) : (
                      <div className="col-span-3 text-center p-4 text-xs text-slate-500 border border-white/05 rounded-xl bg-white/[0.01]">
                        No active stock in DB to ship out. Scan inbound items first!
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Form to commit scanned product */}
            <div className="lg:col-span-2">
              {scanResult ? (
                scannerMode === 'inbound' ? (
                  <Card className="space-y-4 border-emerald-500/20 bg-emerald-500/[0.02] animate-fade-up">
                    <div className="flex items-center gap-2 border-b border-white/06 pb-3">
                      <Sparkles className="h-5 w-5 text-emerald-400" />
                      <h3 className="text-sm font-semibold text-slate-200">Decoded Inbound QR</h3>
                    </div>

                    <form onSubmit={handleAddScannedProduct} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Name</label>
                        <Input value={scanResult.name} readOnly className="bg-white/02 border-white/06 text-slate-350 cursor-not-allowed" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SKU Code</label>
                          <Input value={scanResult.sku} readOnly className="bg-white/02 border-white/06 font-mono text-slate-350 cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                          <Input value={scanResult.category} readOnly className="bg-white/02 border-white/06 text-slate-350 cursor-not-allowed" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Weight (kg)</label>
                          <Input value={scanResult.weight} readOnly className="bg-white/02 border-white/06 text-slate-350 cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Assigned Bin</label>
                          <Input value={scanResult.location} readOnly className="bg-white/02 border-white/06 font-mono text-slate-350 cursor-not-allowed" />
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-white/06">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setScanResult(null)}
                          className="text-xs"
                        >
                          Clear
                        </Button>
                        <Button 
                          type="submit" 
                          variant="primary"
                          className="bg-emerald-600 hover:bg-emerald-500 text-xs px-5 py-2.5"
                        >
                          Add Product to DB
                        </Button>
                      </div>
                    </form>
                  </Card>
                ) : (
                  <Card className="space-y-4 border-red-500/20 bg-red-500/[0.02] animate-fade-up">
                    <div className="flex items-center gap-2 border-b border-white/06 pb-3">
                      <Trash className="h-5 w-5 text-red-400" />
                      <h3 className="text-sm font-semibold text-slate-200">Decoded Outbound QR</h3>
                    </div>

                    <form onSubmit={handleRemoveScannedProduct} className="space-y-4">
                      <div>
                        <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Product Name</label>
                        <Input value={scanResult.name} readOnly className="bg-white/02 border-white/06 text-slate-350 cursor-not-allowed" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">SKU Code</label>
                          <Input value={scanResult.sku} readOnly className="bg-white/02 border-white/06 font-mono text-slate-350 cursor-not-allowed" />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Category</label>
                          <Input value={scanResult.category} readOnly className="bg-white/02 border-white/06 text-slate-350 cursor-not-allowed" />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[10px] font-semibold text-slate-500 uppercase tracking-wider mb-1.5">Current Bin</label>
                          <Input value={scanResult.location} readOnly className="bg-white/02 border-white/06 font-mono text-slate-350 cursor-not-allowed" />
                        </div>
                        <div className="flex items-center justify-center border border-red-500/10 rounded-xl bg-red-500/[0.02] px-2 text-[10px] text-red-400/80 uppercase font-semibold tracking-wider gap-1">
                          <ArrowUpRight className="h-3.5 w-3.5" /> Outbound Dispatch
                        </div>
                      </div>

                      <div className="flex gap-3 justify-end pt-4 border-t border-white/06">
                        <Button 
                          type="button" 
                          variant="ghost" 
                          onClick={() => setScanResult(null)}
                          className="text-xs"
                        >
                          Cancel
                        </Button>
                        <Button 
                          type="submit" 
                          variant="primary"
                          className="bg-red-600 hover:bg-red-500 text-xs px-5 py-2.5"
                        >
                          Verify & Ship Out
                        </Button>
                      </div>
                    </form>
                  </Card>
                )
              ) : (
                <Card className="flex flex-col items-center justify-center text-center p-8 border-dashed border-white/10 bg-white/01 h-full min-h-[300px]">
                  <Barcode className="h-10 w-10 text-slate-600 mb-2.5" />
                  <h4 className="text-xs font-semibold text-slate-300">Awaiting QR scan</h4>
                  <p className="text-[10px] text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                    Simulate scanning a product QR barcode at the dock to load detail data.
                  </p>
                </Card>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
