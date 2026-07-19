import React, { useState } from 'react';
import { Bell, Info, ShieldAlert, CheckCircle2, CircleDot, Eye } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

const INITIAL_NOTIFICATIONS = [
  { id: 'notif-1', category: 'INVENTORY_ALERT', title: 'Critical mismatch at Bin A1-R2', message: 'Reconciliation engine detected SKU-WRONG-999 instead of SKU-ELEC-002.', read: false, time: '2 mins ago' },
  { id: 'notif-2', category: 'ROBOT', title: 'Robot-002 battery is low (9%)', message: 'Robot is navigating back to charging dock station in Zone B.', read: false, time: '15 mins ago' },
  { id: 'notif-3', category: 'MISSION', title: 'Mission-0042 Completed', message: 'Audit mission for Zone A finished with 99.2% accuracy score.', read: true, time: '1 hour ago' },
  { id: 'notif-4', category: 'SECURITY', title: 'New login from unknown IP', message: 'User manager@wareops.dev logged in from IP 192.168.1.140.', read: true, time: '3 hours ago' },
];

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const toggleRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: !n.read } : n));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100">Notification Center</h1>
          <p className="text-sm text-slate-400">Stay updated on warehouse scans, robot statuses, and system security events.</p>
        </div>
        <Button onClick={markAllRead} variant="secondary" className="btn-sm">
          Mark All as Read
        </Button>
      </div>

      {/* Notifications Queue */}
      <Card className="p-0 overflow-hidden divide-y divide-white/06">
        {notifications.length > 0 ? (
          notifications.map(n => (
            <div 
              key={n.id} 
              className={`p-5 flex items-start justify-between gap-4 transition-all ${
                n.read ? 'bg-transparent' : 'bg-indigo-500/02'
              }`}
            >
              <div className="flex gap-4">
                {/* Category Icon */}
                <div className={`p-2.5 rounded-xl mt-0.5 ${
                  n.category === 'INVENTORY_ALERT' ? 'bg-red-500/10 text-red-400' :
                  n.category === 'ROBOT' ? 'bg-amber-500/10 text-amber-400' :
                  n.category === 'MISSION' ? 'bg-emerald-500/10 text-emerald-400' :
                  'bg-blue-500/10 text-blue-400'
                }`}>
                  {n.category === 'INVENTORY_ALERT' && <ShieldAlert className="w-5 h-5" />}
                  {n.category === 'ROBOT' && <CircleDot className="w-5 h-5 animate-pulse" />}
                  {n.category === 'MISSION' && <CheckCircle2 className="w-5 h-5" />}
                  {n.category === 'SECURITY' && <Info className="w-5 h-5" />}
                </div>

                <div>
                  <h4 className={`text-sm font-semibold ${n.read ? 'text-slate-300' : 'text-slate-100 font-bold'}`}>
                    {n.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">{n.message}</p>
                  <span className="text-[10px] text-slate-500 block mt-2">{n.time}</span>
                </div>
              </div>

              <button 
                onClick={() => toggleRead(n.id)}
                className="btn-icon text-slate-500 hover:text-slate-300 flex-shrink-0"
              >
                <Eye className="w-4 h-4" />
              </button>
            </div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <Bell className="w-12 h-12 text-slate-600 mb-3" />
            <h4 className="font-semibold text-slate-300 mb-1">No notifications</h4>
            <p className="text-xs text-slate-500">You are fully caught up with the platform notifications.</p>
          </div>
        )}
      </Card>
    </div>
  );
}
