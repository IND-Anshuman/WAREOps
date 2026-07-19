import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, AlertTriangle, CheckCircle, MapPin, Activity, Bell } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { MOCK_ALERTS, MOCK_MISSIONS } from '../../api/mockData';

export default function OperatorDashboard() {
  const navigate = useNavigate();

  // Filter mock alerts for current operator's tasks
  const pendingReviewsCount = 4;
  const assignedAlertsCount = 2;
  const zonesCoveredToday = 3;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-100">Operator Dashboard</h1>
        <p className="text-sm text-slate-400">Welcome back, Operator. Here's your task overview for today.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <StatCard
          label="Pending Reviews"
          value={pendingReviewsCount.toString()}
          trendLabel="Verification Queue"
          icon={<CheckCircle className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Assigned Alerts"
          value={assignedAlertsCount.toString()}
          trendLabel="Open Issues"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
        <StatCard
          label="Zones Covered"
          value={zonesCoveredToday.toString()}
          trendLabel="Assigned: A, B, C"
          icon={<MapPin className="w-5 h-5 text-emerald-400" />}
        />
      </div>

      {/* Quick Actions Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="hover:border-indigo-500/30 flex flex-col justify-between h-40 cursor-pointer" onClick={() => navigate('/operator/products')}>
          <div className="flex items-center space-x-3 text-indigo-400">
            <Search className="w-6 h-6" />
            <h3 className="font-semibold text-slate-100">Product Finder</h3>
          </div>
          <p className="text-xs text-slate-400">Locate any SKU globally or lookup bin coordinates in the warehouse floor layout.</p>
          <span className="text-xs font-semibold text-indigo-400 inline-flex items-center gap-1.5 self-end">
            Launch Finder &rarr;
          </span>
        </Card>

        <Card className="hover:border-indigo-500/30 flex flex-col justify-between h-40 cursor-pointer" onClick={() => navigate('/operator/verifications')}>
          <div className="flex items-center space-x-3 text-emerald-400">
            <CheckCircle className="w-6 h-6" />
            <h3 className="font-semibold text-slate-100">Verification Queue</h3>
          </div>
          <p className="text-xs text-slate-400">Verify low-confidence robot observations or mismatched scan readings on shelves.</p>
          <span className="text-xs font-semibold text-emerald-400 inline-flex items-center gap-1.5 self-end">
            Open Queue ({pendingReviewsCount}) &rarr;
          </span>
        </Card>

        <Card className="hover:border-indigo-500/30 flex flex-col justify-between h-40 cursor-pointer" onClick={() => navigate('/operator/report-issue')}>
          <div className="flex items-center space-x-3 text-red-400">
            <AlertTriangle className="w-6 h-6" />
            <h3 className="font-semibold text-slate-100">Report Issue</h3>
          </div>
          <p className="text-xs text-slate-400">Manually flag physical obstructions, broken racks, or incorrect stock placements.</p>
          <span className="text-xs font-semibold text-red-400 inline-flex items-center gap-1.5 self-end">
            Report Issue &rarr;
          </span>
        </Card>
      </div>

      {/* Main Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Activity Feed */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-100">Recent Floor Activity</h2>
            <span className="text-xs text-slate-400 flex items-center gap-1"><Activity className="w-3.5 h-3.5" /> Live Updates</span>
          </div>

          <Card className="space-y-4 max-h-[350px] overflow-y-auto">
            {MOCK_ALERTS.slice(0, 5).map((alert) => (
              <div key={alert.id} className="flex items-start justify-between pb-3.5 border-b border-white/06 last:border-0 last:pb-0">
                <div className="flex gap-3">
                  <div className="p-2 rounded-xl bg-white/04 text-slate-400 mt-0.5">
                    <Bell className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-slate-200">{alert.title}</h4>
                    <p className="text-xs text-slate-400">
                      Location: <span className="font-mono text-indigo-300">{alert.bin_code || 'N/A'}</span>
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 block">3m ago</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                    alert.severity === 'CRITICAL' ? 'bg-red-500/10 text-red-400' :
                    alert.severity === 'HIGH' ? 'bg-orange-500/10 text-orange-400' :
                    'bg-yellow-500/10 text-yellow-400'
                  }`}>
                    {alert.severity}
                  </span>
                </div>
              </div>
            ))}
          </Card>
        </div>

        {/* Assigned Map Area */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-slate-100">Your Assigned Zones</h2>
          <Card className="flex flex-col items-center justify-center p-6 h-[350px] text-center border-dashed border-white/10 bg-white/01">
            <MapPin className="w-12 h-12 text-indigo-400 mb-4 animate-bounce" />
            <h4 className="font-semibold text-slate-200 mb-1">Zone A, B, C Location Map</h4>
            <p className="text-xs text-slate-400 max-w-[200px] mb-4 leading-relaxed">
              Open the Digital Twin page to see a full live layout of your assigned racks.
            </p>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/digital-twin')}>
              Open Digital Twin
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
}
