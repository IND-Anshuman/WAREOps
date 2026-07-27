import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Mail, Lock, ShieldAlert, ArrowRight, ArrowLeft, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { authApi } from '../../api/client';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await authApi.login({ email, password });
      
      if (response.mfa_required) {
        navigate('/auth/mfa');
        return;
      }

      login(response.user, response.access_token, response.refresh_token);

      // Navigate based on role
      const role = response.user.role;
      if (role === 'ENTERPRISE_ADMIN') {
        navigate('/admin/overview');
      } else if (role === 'WAREHOUSE_MANAGER') {
        navigate('/manager/dashboard');
      } else if (role === 'WAREHOUSE_SUPERVISOR') {
        navigate('/supervisor/dashboard');
      } else {
        navigate('/operator/dashboard');
      }
    } catch (err: any) {
      console.error('Login failed:', err);
      const detail = err.response?.data?.detail || err.message || 'Authentication failed. Please verify credentials.';
      setError(detail);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[80px] -z-10" />

      {/* Logo Header */}
      <div className="flex flex-col items-center space-y-2 mb-8">
        <Link to="/onboarding" className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-indigo-300 transition-colors mb-1">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Overview
        </Link>
        <div className="flex items-center space-x-3">
          <Layers className="h-8 w-8 text-indigo-500 animate-pulse" />
          <span className="text-2xl font-bold tracking-wider text-slate-100">WAREOPS</span>
        </div>
      </div>

      {/* Login Box */}
      <div className="w-full max-w-[440px] p-8 rounded-2xl glass-elevated">
        <h2 className="text-xl font-semibold text-slate-100 mb-2">Welcome Back</h2>
        <p className="text-sm text-slate-400 mb-6">Sign in to control your warehouse intelligence suite.</p>

        {error && (
          <div className="mb-5 p-3.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="e.g. manager@wareops.dev"
            required
            disabled={isLoading}
          />

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-400">Password</label>
              <Link to="/auth/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                required
                disabled={isLoading}
                className="w-full pl-4 pr-10 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-[#0e1424] border border-white/10 focus:border-indigo-500/50 transition-all caret-indigo"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors p-1"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-400" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full mt-6"
            loading={isLoading}
          >
            Sign In <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/06 text-center">
          <button 
            type="button" 
            onClick={() => {
              setEmail('manager@wareops.dev');
              setPassword('password');
            }}
            className="text-xs text-slate-400 hover:text-slate-300"
          >
            Or, authenticate with Single Sign-On (SSO)
          </button>
        </div>
      </div>

      <div className="mt-8 text-center text-xs text-slate-500">
        Demo Roles: <code className="text-indigo-400">admin@wareops.dev</code>, <code className="text-indigo-400">manager@wareops.dev</code>, <code className="text-indigo-400">supervisor@wareops.dev</code>, <code className="text-indigo-400">operator@wareops.dev</code>
      </div>
    </div>
  );
}
