import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, ArrowRight, ArrowLeft } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export default function MFAPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      navigate('/dashboard');
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="w-full max-w-[420px] p-8 rounded-2xl glass-elevated">
        <div className="flex justify-center mb-6">
          <div className="p-3.5 rounded-2xl bg-indigo-500/10 text-indigo-400">
            <Shield className="w-8 h-8" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-center text-slate-100 mb-2">Two-Factor Authentication</h2>
        <p className="text-sm text-center text-slate-400 mb-6">
          Enter the 6-digit verification code from your authenticator app.
        </p>

        <form onSubmit={handleVerify} className="space-y-6">
          <input
            type="text"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000 000"
            className="w-full text-center tracking-[0.75em] text-2xl font-bold py-3.5 rounded-xl bg-white/04 border border-white/08 focus:border-indigo-500/50 outline-none transition-all"
            required
            autoFocus
          />

          <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
            Verify Code <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 flex justify-between items-center text-xs">
          <Link to="/auth/login" className="text-slate-400 hover:text-slate-300 flex items-center gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to login
          </Link>
          <button className="text-indigo-400 hover:text-indigo-300">
            Resend SMS fallback
          </button>
        </div>
      </div>
    </div>
  );
}
