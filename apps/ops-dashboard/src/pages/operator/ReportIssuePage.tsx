import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, ClipboardList, Send, Camera } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ReportIssuePage() {
  const navigate = useNavigate();

  const [issueType, setIssueType] = useState('MISSING_PRODUCT');
  const [binCode, setBinCode] = useState('');
  const [sku, setSku] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      alert('Issue reported successfully to the warehouse supervisor.');
      navigate('/operator/dashboard');
    }, 800);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Report Floor Issue</h1>
        <p className="text-sm text-slate-400">File a manual report for physical anomalies or placement discrepancies.</p>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Issue Type */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Issue Category</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                { id: 'MISSING_PRODUCT', label: 'Missing Product', desc: 'Item not in expected bin' },
                { id: 'DAMAGED_LABEL', label: 'Damaged QR Code', desc: 'Bin QR label unreadable' },
                { id: 'AISLE_OBSTRUCTION', label: 'Aisle Blocked', desc: 'Physical barrier on floor' }
              ].map(type => (
                <div
                  key={type.id}
                  onClick={() => setIssueType(type.id)}
                  className={`p-4 rounded-xl border text-left cursor-pointer transition-all ${
                    issueType === type.id
                      ? 'bg-indigo-500/10 border-indigo-500/50 text-slate-200'
                      : 'bg-white/01 border-white/06 text-slate-400 hover:bg-white/03'
                  }`}
                >
                  <h4 className="font-semibold text-sm text-slate-200">{type.label}</h4>
                  <p className="text-[10px] text-slate-400 mt-1">{type.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Location details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Bin Location Code"
              placeholder="e.g. A1-R2-S3-B2"
              value={binCode}
              onChange={(e) => setBinCode(e.target.value)}
              required
            />
            <Input
              label="SKU (optional)"
              placeholder="e.g. SKU-ELEC-002"
              value={sku}
              onChange={(e) => setSku(e.target.value)}
            />
          </div>

          {/* Urgency */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Urgency Level</label>
            <div className="flex gap-3">
              {['LOW', 'MEDIUM', 'HIGH'].map(level => (
                <button
                  type="button"
                  key={level}
                  onClick={() => setUrgency(level)}
                  className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all ${
                    urgency === level
                      ? level === 'HIGH'
                        ? 'bg-red-500/10 border-red-500/40 text-red-300'
                        : level === 'MEDIUM'
                        ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                        : 'bg-blue-500/10 border-blue-500/40 text-blue-300'
                      : 'bg-white/01 border-white/06 text-slate-400 hover:bg-white/03'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-400">Detailed Description</label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide exact details of what you observed..."
              className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-white/04 border border-white/08 focus:border-indigo-500/50 transition-all caret-indigo"
              required
            />
          </div>

          {/* Photo upload mock */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Photo Evidence</label>
            <div className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl bg-white/01 cursor-pointer hover:bg-white/02 transition-all">
              <Camera className="w-6 h-6 text-slate-500 mb-1.5" />
              <span className="text-xs font-semibold text-slate-300">Take Photo or Upload Image</span>
              <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG up to 10MB</span>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 justify-end pt-3 border-t border-white/06">
            <Button
              type="button"
              variant="ghost"
              onClick={() => navigate('/operator/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              className="flex items-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Submit Report
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
