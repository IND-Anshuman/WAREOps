import React, { useState, useEffect } from 'react';
import { FileText, Download, BarChart3, TrendingUp, CheckCircle2, AlertTriangle, ShieldCheck, RefreshCw } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { Button } from '../../components/ui/Button';
import { exportToCsv } from '../../utils/exportCsv';
import { analyticsApi } from '../../api/client';
import { reconciliationApi } from '../../api/reconciliation';
import type { AccuracyDataPoint } from '../../types';

export default function SupervisorReports() {
  const [accuracyTrend, setAccuracyTrend] = useState<AccuracyDataPoint[]>([]);
  const [kpis, setKpis] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true);
        const days = timeRange === '7d' ? 7 : timeRange === '90d' ? 90 : 30;
        const [trend, kpiData] = await Promise.all([
          analyticsApi.getAccuracyTrend('a1b2c3d4-e5f6-7890-abcd-ef1234567890', days),
          analyticsApi.getWarehouseKPIs('a1b2c3d4-e5f6-7890-abcd-ef1234567890'),
        ]);
        setAccuracyTrend(trend);
        setKpis(kpiData);
      } catch (err) {
        console.error('Failed to load report analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchReportData();
  }, [timeRange]);

  const handleExportCSV = () => {
    const headers = ['Date', 'Inventory Accuracy %', 'Alerts Count'];
    const rows = accuracyTrend.map((t) => [t.date, t.accuracy, t.alerts]);
    exportToCsv(`supervisor_accuracy_report_${timeRange}`, headers, rows);
  };

  if (loading) return <div className="p-12 text-center text-slate-400">Compiling supervisor compliance & accuracy report...</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Supervisor Operational Reports</h1>
          <p className="text-sm text-slate-400">Inventory reconciliation metrics, SLA performance, and zone discrepancy analytics.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1 p-1 rounded-xl bg-white/03 border border-white/06 text-xs font-semibold">
            {(['7d', '30d', '90d'] as const).map((r) => (
              <button
                key={r}
                onClick={() => setTimeRange(r)}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  timeRange === r ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
          <Button onClick={handleExportCSV} variant="primary" className="flex items-center gap-1.5 text-xs py-2 px-3">
            <Download className="w-4 h-4" /> Export Report CSV
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <StatCard
          label="Overall Inventory Accuracy"
          value={`${kpis?.inventory_accuracy || 99.2}%`}
          trendLabel="Target: >99.0%"
          icon={<ShieldCheck className="w-5 h-5 text-emerald-400" />}
        />
        <StatCard
          label="Mission Success Rate"
          value={`${kpis?.mission_success_rate || 94.1}%`}
          trendLabel="ROS 2 AMR fleet"
          icon={<CheckCircle2 className="w-5 h-5 text-indigo-400" />}
        />
        <StatCard
          label="Robot Uptime"
          value={`${kpis?.robot_uptime || 91.3}%`}
          trendLabel="Zone A/B Coverage"
          icon={<TrendingUp className="w-5 h-5 text-blue-400" />}
        />
        <StatCard
          label="Open Discrepancies"
          value={(kpis?.open_alerts || 7).toString()}
          trendLabel="Triage desk queue"
          icon={<AlertTriangle className="w-5 h-5 text-amber-400" />}
        />
      </div>

      {/* Accuracy Trend Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center border-b border-white/06 pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-indigo-400" />
              <h2 className="text-base font-bold text-slate-100">Inventory Accuracy Trend ({timeRange.toUpperCase()})</h2>
            </div>
            <span className="text-xs font-mono text-slate-400">{accuracyTrend.length} Data Points</span>
          </div>

          <div className="space-y-3 pt-2">
            {accuracyTrend.slice(-10).map((pt, idx) => (
              <div key={idx} className="flex items-center gap-4 text-xs font-mono">
                <span className="w-16 text-slate-400">{pt.date}</span>
                <div className="flex-1 bg-white/04 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all ${
                      pt.accuracy >= 99 ? 'bg-emerald-500' : pt.accuracy >= 98 ? 'bg-indigo-500' : 'bg-amber-500'
                    }`}
                    style={{ width: `${pt.accuracy}%` }}
                  />
                </div>
                <span className="w-12 text-right font-bold text-slate-200">{pt.accuracy}%</span>
                <span className="w-16 text-right text-slate-500">{pt.alerts} alerts</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Zone Discrepancy Breakdown */}
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-slate-100 border-b border-white/06 pb-3">Zone Discrepancy Audit</h2>
          <div className="space-y-3">
            {[
              { zone: 'Zone A (Electronics)', count: 3, accuracy: '98.8%', status: 'Normal' },
              { zone: 'Zone B (Furniture)', count: 2, accuracy: '99.4%', status: 'Optimal' },
              { zone: 'Zone C (Books)', count: 1, accuracy: '99.7%', status: 'Optimal' },
            ].map((z, idx) => (
              <div key={idx} className="p-3 rounded-xl bg-white/02 border border-white/04 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-slate-200">{z.zone}</span>
                  <span className="text-emerald-400 font-mono font-bold">{z.accuracy}</span>
                </div>
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>{z.count} active alerts</span>
                  <span className="px-2 py-0.5 rounded bg-white/04 text-slate-300 font-medium">{z.status}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
