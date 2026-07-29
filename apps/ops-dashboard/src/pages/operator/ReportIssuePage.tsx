import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, MapPin, ClipboardList, Send, Camera, X, CheckCircle } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { alertsApi } from '../../api/client';

export default function ReportIssuePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [issueType, setIssueType] = useState('MISSING_PRODUCT');
  const [binCode, setBinCode] = useState('');
  const [sku, setSku] = useState('');
  const [urgency, setUrgency] = useState('MEDIUM');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemovePhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPhotoUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const alertTypeMap: Record<string, any> = {
        MISSING_PRODUCT: 'MISSING',
        DAMAGED_LABEL: 'MANUAL',
        AISLE_OBSTRUCTION: 'MANUAL',
      };

      const titleMap: Record<string, string> = {
        MISSING_PRODUCT: `Operator Reported Missing Product at ${binCode}`,
        DAMAGED_LABEL: `Operator Reported Damaged QR Code at ${binCode}`,
        AISLE_OBSTRUCTION: `Operator Reported Physical Obstruction at ${binCode}`,
      };

      await alertsApi.createAlert({
        type: alertTypeMap[issueType] || 'MANUAL',
        severity: urgency as any,
        bin_code: binCode,
        expected_sku: sku || undefined,
        title: titleMap[issueType] || `Reported Issue at ${binCode}`,
        description: description,
        image_url: photoUrl || undefined,
      });

      setSuccessMessage('Issue reported successfully to the warehouse supervisor & persisted to database!');
      setTimeout(() => {
        navigate('/operator/dashboard');
      }, 1200);
    } catch (err) {
      console.error('Failed to submit issue report:', err);
      alert('Failed to submit report. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Report Floor Issue</h1>
        <p className="text-sm text-slate-400">File a manual report for physical anomalies or placement discrepancies.</p>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-400" />
          <span>{successMessage}</span>
        </div>
      )}

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
              className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-[#060b17] border border-white/14 focus:border-indigo-500 transition-all font-sans placeholder-slate-500 caret-indigo"
              required
            />
          </div>

          {/* Photo upload input */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">Photo Evidence</label>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handleImageSelect}
            />

            {photoUrl ? (
              <div className="relative rounded-xl border border-indigo-500/30 overflow-hidden bg-slate-900 group">
                <img src={photoUrl} alt="Reported issue evidence" className="w-full h-48 object-cover" />
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/80 text-slate-300 hover:text-white transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 rounded bg-slate-950/80 text-[10px] text-emerald-400 font-mono">
                  Photo Attached & Verified
                </div>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center p-6 border border-dashed border-white/10 rounded-xl bg-white/01 cursor-pointer hover:bg-white/02 hover:border-indigo-500/40 transition-all"
              >
                <Camera className="w-6 h-6 text-indigo-400 mb-1.5" />
                <span className="text-xs font-semibold text-slate-300">Click to Upload Photo Evidence</span>
                <span className="text-[10px] text-slate-500 mt-0.5">Supports PNG, JPG up to 10MB (Stores to DB)</span>
              </div>
            )}
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

