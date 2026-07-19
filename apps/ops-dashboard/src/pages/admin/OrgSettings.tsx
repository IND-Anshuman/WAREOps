import React from 'react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';

export default function OrgSettings() {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Organization Settings</h1>
        <p className="text-sm text-slate-400">Configure single sign-on (SSO), multi-factor authentication policies, and API keys.</p>
      </div>

      <Card className="space-y-4">
        <h3 className="text-base font-semibold text-slate-200">SSO & MFA Policies</h3>
        <div className="space-y-4">
          <label className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
            <input 
              type="checkbox" 
              defaultChecked 
              className="rounded bg-white/04 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0"
            />
            Require MFA for all managers and supervisors
          </label>

          <label className="flex items-center gap-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer">
            <input 
              type="checkbox" 
              className="rounded bg-white/04 border-white/10 text-indigo-500 focus:ring-0 focus:ring-offset-0"
            />
            Enable SAML 2.0 Single Sign-On
          </label>
        </div>
      </Card>

      <Card className="space-y-4">
        <h3 className="text-base font-semibold text-slate-200">Organization Info</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Organization Name" defaultValue="Industrial WareOps Logistics" />
          <Input label="Admin Email" defaultValue="admin@wareops.dev" />
        </div>
        <Button variant="primary" className="btn-sm">
          Save Policies
        </Button>
      </Card>
    </div>
  );
}
