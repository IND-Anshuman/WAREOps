import React, { useState } from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Shield, Key, Copy, CheckCircle2, RefreshCw } from 'lucide-react';

export default function OrgSettings() {
  const [mfaRequired, setMfaRequired] = useState(true);
  const [samlEnabled, setSamlEnabled] = useState(false);
  const [orgName, setOrgName] = useState('Industrial WareOps Logistics');
  const [adminEmail, setAdminEmail] = useState('admin@wareops.dev');
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [apiKey, setApiKey] = useState('wop_live_8f93a1729b4e10c7a4569d2');
  const [copied, setCopied] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleGenerateKey = () => {
    const newKey = `wop_live_${Math.random().toString(36).substring(2, 15)}${Math.random().toString(36).substring(2, 15)}`;
    setApiKey(newKey);
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(apiKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 bg-[#080c14] min-h-screen p-6 rounded-2xl">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-purple-400 mb-1">Configuration</p>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Organization Settings</h1>
        <p className="text-sm text-slate-400 mt-1">Configure single sign-on (SSO), multi-factor authentication policies, and API keys.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card className="space-y-4 bg-white/[0.03] border-white/[0.06] p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-purple-400" />
            <h3 className="text-base font-semibold text-slate-200">SSO & Security Policies</h3>
          </div>
          <div className="space-y-4">
            <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-slate-100 cursor-pointer">
              <input 
                type="checkbox" 
                checked={mfaRequired} 
                onChange={e => setMfaRequired(e.target.checked)}
                className="rounded bg-white/05 border-white/20 text-indigo-500 focus:ring-0"
              />
              Require Multi-Factor Authentication (MFA) for all managers and supervisors
            </label>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 hover:text-slate-100 cursor-pointer">
              <input 
                type="checkbox" 
                checked={samlEnabled} 
                onChange={e => setSamlEnabled(e.target.checked)}
                className="rounded bg-white/05 border-white/20 text-indigo-500 focus:ring-0"
              />
              Enable SAML 2.0 Single Sign-On (Okta / Azure AD Integration)
            </label>
          </div>
        </Card>

        <Card className="space-y-4 bg-white/[0.03] border-white/[0.06] p-6 rounded-2xl">
          <h3 className="text-base font-semibold text-slate-200">Organization Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Organization Name</label>
              <input
                type="text"
                value={orgName}
                onChange={e => setOrgName(e.target.value)}
                className="w-full rounded-xl bg-[#080d1a] border border-white/10 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-400 mb-1.5">Admin Email</label>
              <input
                type="email"
                value={adminEmail}
                onChange={e => setAdminEmail(e.target.value)}
                className="w-full rounded-xl bg-[#080d1a] border border-white/10 px-3 py-2.5 text-sm text-slate-200 outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between">
            <Button type="submit" variant="primary" className="btn-sm bg-indigo-600 hover:bg-indigo-500 text-white">
              Save Security Policies
            </Button>

            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Policies updated successfully!
              </span>
            )}
          </div>
        </Card>
      </form>

      {/* API Key Management */}
      <Card className="space-y-4 bg-white/[0.03] border-white/[0.06] p-6 rounded-2xl">
        <div className="flex items-center gap-2">
          <Key className="w-4 h-4 text-indigo-400" />
          <h3 className="text-base font-semibold text-slate-200">Robot & WMS API Keys</h3>
        </div>
        <p className="text-xs text-slate-500">API keys authenticate robot fleets and external WMS webhook telemetry streams.</p>
        
        <div className="flex items-center gap-2">
          <input
            type="text"
            readOnly
            value={apiKey}
            className="flex-1 rounded-xl bg-[#060a14] border border-white/10 px-3 py-2 text-xs font-mono text-indigo-300 outline-none select-all"
          />
          <button
            onClick={handleCopyKey}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/05 px-3 py-2 text-xs font-semibold text-slate-300 hover:text-white hover:border-white/20 transition-all cursor-pointer"
          >
            {copied ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleGenerateKey}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-semibold text-indigo-300 hover:bg-indigo-500/20 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Regenerate
          </button>
        </div>
      </Card>
    </div>
  );
}
