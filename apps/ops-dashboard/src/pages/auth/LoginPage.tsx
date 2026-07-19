import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Layers, Mail, Lock, ShieldAlert, ArrowRight } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

export default function LoginPage() {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.setUser);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock verification
    const emailLower = email.toLowerCase();
    
    // Check credentials matching our specs
    let role: 'WAREHOUSE_OPERATOR' | 'WAREHOUSE_SUPERVISOR' | 'WAREHOUSE_MANAGER' | 'ENTERPRISE_ADMIN' | null = null;
    let name = '';

    if (emailLower === 'admin@wareops.dev') {
      role = 'ENTERPRISE_ADMIN';
      name = 'Admin User';
    } else if (emailLower === 'manager@wareops.dev') {
      role = 'WAREHOUSE_MANAGER';
      name = 'Manager User';
    } else if (emailLower === 'supervisor@wareops.dev') {
      role = 'WAREHOUSE_SUPERVISOR';
      name = 'Supervisor User';
    } else if (emailLower === 'operator@wareops.dev') {
      role = 'WAREHOUSE_OPERATOR';
      name = 'Operator User';
    } else {
      setError('Invalid email or password. Try: admin@wareops.dev, manager@wareops.dev, supervisor@wareops.dev, or operator@wareops.dev');
      setIsLoading(false);
      return;
    }

    // Set mock user in Zustand store
    const mockUser = {
      id: `user-${role.toLowerCase()}`,
      email: emailLower,
      display_name: name,
      role,
      org_id: 'org-001',
      warehouse_ids: ['wh-001'],
      permissions: [
        'users:read', 'users:write', 'alerts:read', 'alerts:write',
        'missions:read', 'missions:write', 'inventory:read', 'inventory:write',
        'compliance:read', 'settings:read', 'settings:write'
      ],
      status: 'ACTIVE' as const,
      mfa_enabled: false,
    };

    login(mockUser, 'mock-jwt-token');
    
    // Navigate based on role
    if (role === 'ENTERPRISE_ADMIN') {
      navigate('/admin/overview');
    } else if (role === 'WAREHOUSE_MANAGER') {
      navigate('/manager/dashboard');
    } else if (role === 'WAREHOUSE_SUPERVISOR') {
      navigate('/supervisor/dashboard');
    } else {
      navigate('/operator/dashboard');
    }
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Background orbs */}
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full bg-indigo-500/10 blur-[100px] -z-10" />
      <div className="absolute bottom-1/4 right-1/4 w-[350px] h-[350px] rounded-full bg-blue-500/10 blur-[80px] -z-10" />

      {/* Logo Header */}
      <div className="flex items-center space-x-3 mb-8">
        <Layers className="h-8 w-8 text-indigo-500 animate-pulse" />
        <span className="text-2xl font-bold tracking-wider text-slate-100">WAREOPS</span>
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
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              disabled={isLoading}
              className="w-full px-4 py-2.5 rounded-xl text-sm text-slate-100 outline-none bg-white/04 border border-white/08 focus:border-indigo-500/50 transition-all caret-indigo"
            />
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
