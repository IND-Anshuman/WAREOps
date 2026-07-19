import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
            <h3 className="text-lg font-semibold text-slate-100 mb-2">Check Your Email</h3>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              If an account exists for <strong className="text-slate-200">{email}</strong>, we have sent password reset instructions.
            </p>
            <Link to="/auth/login" className="btn btn-secondary w-full">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <h2 className="text-xl font-semibold text-slate-100 mb-2">Reset Password</h2>
            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input
                label="Email Address"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="manager@wareops.dev"
                required
                disabled={isLoading}
              />

              <Button type="submit" variant="primary" className="w-full" loading={isLoading}>
                Send Reset Link
              </Button>
            </form>

            <div className="mt-6 text-center">
              <Link to="/auth/login" className="text-xs text-slate-400 hover:text-slate-300 inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to login
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
