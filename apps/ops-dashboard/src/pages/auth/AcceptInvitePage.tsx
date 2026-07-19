import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { User, Lock, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function AcceptInvitePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setSubmitted(true);
    }, 800);
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      <div className="w-full max-w-[440px] p-8 rounded-2xl glass-elevated">
        {submitted ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-5">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Account Activated!</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Your account has been set up successfully. You can now log in to the dashboard.
            </p>
            <Button onClick={() => navigate('/auth/login')} variant="primary" className="w-full">
              Go to Login
            </Button>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Activate Your Account</h2>
            <p className="text-sm text-slate-400 mb-6">
              Complete your profile setup to join the platform.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Your Full Name"
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="e.g. John Doe"
                required
                disabled={isLoading}
              />

              <Input
                label="Choose Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
              />

              <Input
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
              />

              <Button type="submit" variant="primary" className="w-full mt-4" loading={isLoading}>
                Complete Setup
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
