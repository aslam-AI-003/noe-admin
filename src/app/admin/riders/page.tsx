'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore, RiderRegistration } from '@/store/useStore';
import { riderService } from '@/lib/firestoreService';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Bike, CheckCircle2, XCircle, Clock, Phone,
  MapPin, Shield, Car, PersonStanding, Copy, Users,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN — Rider Management (Approve/Reject)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const VEHICLE_ICONS: Record<string, React.ElementType> = {
  Bike: Bike,
  Cycle: Bike,
  Auto: Car,
  Walking: PersonStanding,
};

export default function AdminRidersPage() {
  const { riderRegistrations, approveRider, rejectRider } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected'>('pending');

  useEffect(() => {
    setMounted(true);
    const unsub = riderService.onAll((firestoreRiders) => {
      if (firestoreRiders.length > 0) {
        console.log('🔄 Firestore riders synced:', firestoreRiders.length);
      }
    });
    return () => unsub();
  }, []);

  if (!mounted) return <div className="min-h-screen app-bg animate-pulse" />;

  const pending = riderRegistrations.filter(r => r.status === 'pending');
  const approved = riderRegistrations.filter(r => r.status === 'approved');
  const rejected = riderRegistrations.filter(r => r.status === 'rejected');

  const currentList = activeTab === 'pending' ? pending : activeTab === 'approved' ? approved : rejected;

  const handleApprove = async (id: string) => {
    approveRider(id);
    const rider = useStore.getState().riderRegistrations.find(r => r.id === id);
    // Also update Firestore
    try {
      await riderService.update(id, {
        status: 'approved',
        riderId: rider?.riderId || ('NOE-R-' + id.slice(-4).toUpperCase()),
        password: rider?.password || ('NOE-R-' + id.slice(-4).toUpperCase()),
      });
      console.log('✅ Rider approved in Firestore');
    } catch (err) {
      console.warn('Firestore update failed:', err);
    }
    toast.success(`Rider approved! ID: ${rider?.riderId}`);
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (reason) {
      rejectRider(id, reason);
      try {
        await riderService.update(id, { status: 'rejected' });
      } catch (err) {
        console.warn('Firestore update failed:', err);
      }
      toast.error('Rider rejected');
    }
  };

  const copyCredentials = (rider: RiderRegistration) => {
    const text = `Rider ID: ${rider.riderId}\nPhone: ${rider.phone}\nPassword: ${rider.password}`;
    navigator.clipboard.writeText(text);
    toast.success('Credentials copied! 📋');
  };

  return (
    <div className="min-h-screen app-bg pb-20">
      <header className="sticky top-0 z-50 header-glass">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="btn-icon">
            <ArrowLeft size={16} />
          </Link>
          <div className="flex-1">
            <h1 className="text-sm font-black text-body flex items-center gap-1.5">
              <Bike size={14} className="text-purple-600 dark:text-purple-400" /> Rider Management
            </h1>
            <p className="text-[10px] text-faint">{riderRegistrations.length} total riders</p>
          </div>
          <Link href="/rider/register" className="text-xs text-purple-600 dark:text-purple-400 font-bold">
            + New Rider
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 pt-4 space-y-4">

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-black text-amber-600">{pending.length}</p>
            <p className="text-[10px] text-faint">Pending</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-black text-emerald-600">{approved.length}</p>
            <p className="text-[10px] text-faint">Active</p>
          </div>
          <div className="glass-card p-3 text-center">
            <p className="text-2xl font-black text-red-500">{rejected.length}</p>
            <p className="text-[10px] text-faint">Rejected</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 surface rounded-xl">
          {(['pending', 'approved', 'rejected'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-lg text-xs font-bold capitalize transition-all ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'text-muted hover:text-secondary'
              }`}
            >
              {tab} ({tab === 'pending' ? pending.length : tab === 'approved' ? approved.length : rejected.length})
            </button>
          ))}
        </div>

        {/* List */}
        {currentList.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <Users size={36} className="text-faint mx-auto mb-3" />
            <p className="text-sm text-muted">No {activeTab} rider applications</p>
          </div>
        ) : (
          <div className="space-y-3">
            {currentList.map(rider => {
              const VehicleIcon = VEHICLE_ICONS[rider.vehicleType] || Bike;
              return (
                <div key={rider.id} className="glass-card p-4 space-y-3">
                  {/* Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-purple-500/10 rounded-xl flex items-center justify-center">
                      <VehicleIcon size={20} className="text-purple-600 dark:text-purple-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-body">{rider.name}</h3>
                      <p className="text-[11px] text-faint flex items-center gap-1">
                        <Phone size={9} /> {rider.phone} • <MapPin size={9} /> {rider.city}
                      </p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                      rider.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border border-amber-500/25' :
                      rider.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25' :
                      'bg-red-500/10 text-red-500 border border-red-500/25'
                    }`}>
                      {rider.status}
                    </span>
                  </div>

                  {/* Details */}
                  <div className="flex flex-wrap gap-2 text-[10px]">
                    <span className="px-2 py-0.5 surface rounded-full text-muted">🏍️ {rider.vehicleType}</span>
                    <span className="px-2 py-0.5 surface rounded-full text-muted">🪪 {rider.aadhaarNumber.slice(0, 4)}****</span>
                    {rider.licenseNumber && <span className="px-2 py-0.5 surface rounded-full text-muted">📜 DL: {rider.licenseNumber}</span>}
                    {rider.email && <span className="px-2 py-0.5 surface rounded-full text-muted">✉️ {rider.email}</span>}
                  </div>

                  {/* Approved: Show credentials */}
                  {rider.status === 'approved' && rider.riderId && (
                    <div className="p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl flex items-center justify-between">
                      <div>
                        <p className="text-[10px] text-faint">Rider ID / Password</p>
                        <p className="text-sm font-black text-purple-600 dark:text-purple-400">{rider.riderId}</p>
                        <p className="text-[10px] text-faint mt-0.5">
                          {rider.isOnline ? '🟢 Online' : '🔴 Offline'} • {rider.totalDeliveries || 0} deliveries
                        </p>
                      </div>
                      <button onClick={() => copyCredentials(rider)} className="btn-icon">
                        <Copy size={14} />
                      </button>
                    </div>
                  )}

                  {/* Rejected: Show reason */}
                  {rider.status === 'rejected' && rider.rejectionReason && (
                    <div className="p-2 bg-red-500/5 border border-red-500/15 rounded-lg">
                      <p className="text-[10px] text-red-500">Reason: {rider.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions */}
                  {rider.status === 'pending' && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleApprove(rider.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl hover:bg-emerald-600 transition-all"
                      >
                        <CheckCircle2 size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(rider.id)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-bold rounded-xl hover:bg-red-500/20 transition-all"
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
