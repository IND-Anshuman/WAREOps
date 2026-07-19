import React, { useState } from 'react';
import { User, Lock, Bell, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/authStore';

export default function ProfilePage() {
  const user = useAuthStore(state => state.user);

  const [displayName, setDisplayName] = useState(user?.display_name || 'Floor Operator');
  const [email, setEmail] = useState(user?.email || 'operator@wareops.dev');
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [mfaEnabled, setMfaEnabled] = useState(user?.mfa_enabled || false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    alert('Profile updated successfully.');
  };

  const handleChangePassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }
    alert('Password changed successfully.');
    setOldPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Account Settings</h1>
        <p className="text-sm text-slate-400">Manage your profile details, change security credentials, and configure notifications.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: User info summary & MFA */}
        <div className="space-y-6 md:col-span-1">
          <Card className="text-center flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-indigo-500/10 text-indigo-300 flex items-center justify-center font-bold text-2xl mb-4">
              {displayName.split(' ').map(n => n[0]).join('')}
            </div>
            <h3 className="font-semibold text-slate-200 text-lg">{displayName}</h3>
            <span className="text-xs uppercase font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-md mt-1.5">
              {user?.role || 'OPERATOR'}
            </span>
          </Card>

          <Card className="space-y-4">
            <h4 className="font-semibold text-sm text-slate-200 flex items-center gap-1.5">
              <Lock className="w-4 h-4 text-indigo-400" /> Security Policies
            </h4>
            
            <div className="space-y-3 text-xs leading-relaxed text-slate-400">
              <div className="flex justify-between items-center pb-2 border-b border-white/06">
                <span>SSO Integration:</span>
                <span className="text-slate-500">Disabled</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Session Timeout:</span>
                <span className="text-slate-300">8 hours idle</span>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                  mfaEnabled
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                }`}
              >
                {mfaEnabled ? <CheckCircle2 className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                {mfaEnabled ? 'Two-Factor Authenticated' : 'Enable 2FA Protection'}
              </button>
            </div>
          </Card>
        </div>

        {/* Right column: Edit Profile & Password Form */}
        <div className="md:col-span-2 space-y-6">
          {/* Edit Profile */}
          <Card>
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-indigo-400" /> Personal Profile
            </h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Display Name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled
                />
              </div>
              <Button type="submit" variant="primary" className="btn-sm">
                Save Profile
              </Button>
            </form>
          </Card>

          {/* Change Password */}
          <Card>
            <h3 className="text-base font-semibold text-slate-200 mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4 text-indigo-400" /> Change Password
            </h3>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                label="Current Password"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••••••"
                required
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="New Password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
                <Input
                  label="Confirm New Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                />
              </div>
              
              <Button type="submit" variant="primary" className="btn-sm">
                Update Password
              </Button>
            </form>
          </Card>
        </div>
      </div>
    </div>
  );
}
