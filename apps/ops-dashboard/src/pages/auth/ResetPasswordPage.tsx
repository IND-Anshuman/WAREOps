import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ResetPasswordPage() {
  const navigate = useNavigate();
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
      <div className="w-full max-w-[420px] p-8 rounded-2xl glass-elevated">
        {submitted ? (
          <div className="text-center py-4">
            <div className="flex justify-center mb-5">
              <CheckCircle2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Password Reset Successful</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Your password has been reset successfully. You can now log in with your new password.
            </p>
            <Link to="/auth/login" className="btn btn-primary w-full">
              Sign In
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Create New Password</h2>
            <p className="text-sm text-slate-400 mb-6">
              Enter your new password below. Must be at least 12 characters.
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="New Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
              />

              <Input
                label="Confirm New Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
              />

              <Button type="submit" variant="primary" className="w-full mt-4" loading={isLoading}>
                Reset Password
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
