'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore, VendorRegistration } from '@/store/useStore';
import { vendorService } from '@/lib/firestoreService';
import toast from 'react-hot-toast';
import {
  ArrowLeft, Store, CheckCircle2, XCircle, Clock, Phone, MapPin,
  Mail, FileText, CreditCard, Eye, Copy, Shield,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN — VENDOR MANAGEMENT
// Verify, Approve, Reject shop registrations
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

type TabType = 'pending' | 'approved' | 'rejected';

export default function AdminVendorsPage() {
  const { vendorRegistrations: storeVendors, approveVendor, rejectVendor } = useStore();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [selectedVendor, setSelectedVendor] = useState<VendorRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [firestoreVendors, setFirestoreVendors] = useState<VendorRegistration[]>([]);

  // Load vendors from Firestore on mount (real-time sync)
  useEffect(() => {
    setMounted(true);
    const unsub = vendorService.onAll((vendors) => {
      console.log('🔄 Firestore vendors synced:', vendors.length, vendors.map(v => ({ id: v.id, status: v.status, onboardingStatus: (v as any).onboardingStatus, shopName: v.shopName })));
      // Normalize: if vendor has onboardingStatus='pending_approval' but no status field, map it
      const normalized = vendors.map(v => {
        const vendor = { ...v };
        if (!vendor.status && (v as any).onboardingStatus === 'pending_approval') {
          vendor.status = 'pending';
        }
        if (!vendor.status && (v as any).onboardingStatus === 'otp_verified') {
          vendor.status = 'pending'; // still in setup — show as pending so admin can see all
        }
        // Map ownerName from phone if missing
        if (!vendor.ownerName) vendor.ownerName = vendor.phone || 'Unknown';
        if (!vendor.shopName) vendor.shopName = (v as any).shopName || 'Unnamed Shop';
        return vendor;
      });
      setFirestoreVendors(normalized);
    });
    return () => unsub();
  }, []);

  if (!mounted) return <div className="min-h-screen app-bg" />;

  // Merge: prefer Firestore data, fallback to Zustand store
  const vendorRegistrations = firestoreVendors.length > 0 ? firestoreVendors : storeVendors;

  const filtered = vendorRegistrations.filter(r => r.status === activeTab);
  const counts = {
    pending: vendorRegistrations.filter(r => r.status === 'pending').length,
    approved: vendorRegistrations.filter(r => r.status === 'approved').length,
    rejected: vendorRegistrations.filter(r => r.status === 'rejected').length,
  };

  const handleApprove = async (id: string) => {
    approveVendor(id);
    // Also update Firestore — write BOTH fields for vendor app compatibility
    const vendor = vendorRegistrations.find(v => v.id === id);
    if (vendor) {
      try {
        await vendorService.update(id, {
          status: 'approved',
          onboardingStatus: 'approved',  // ← For noe-vendor app
          shopId: vendor.shopId || ('NOE-' + id.slice(-5).toUpperCase()),
          password: vendor.password || ('NOE-' + id.slice(-5).toUpperCase()),
        });
        console.log('✅ Vendor approved in Firestore (both status + onboardingStatus)');
      } catch (err) {
        console.warn('Firestore update failed:', err);
      }
    }
    toast.success('✅ Shop Approved! Credentials generated.');
    setSelectedVendor(null);
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) { toast.error('Enter rejection reason'); return; }
    rejectVendor(id, rejectReason);
    // Also update Firestore — write BOTH fields for vendor app compatibility
    try {
      await vendorService.update(id, {
        status: 'rejected',
        onboardingStatus: 'rejected',  // ← For noe-vendor app
        rejectionReason: rejectReason,
      });
      console.log('❌ Vendor rejected in Firestore (both status + onboardingStatus)');
    } catch (err) {
      console.warn('Firestore update failed:', err);
    }
    toast.error('Shop registration rejected');
    setShowRejectModal(null);
    setRejectReason('');
    setSelectedVendor(null);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied!');
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  return (
    <main className="min-h-screen app-bg pb-24">
      <header className="sticky top-0 z-50 header-glass">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Link href="/admin" className="btn-icon"><ArrowLeft size={18} /></Link>
          <h1 className="font-bold text-body flex-1">Vendor Management</h1>
          <div className="flex items-center gap-1.5">
            <Shield size={14} className="text-accent" />
            <span className="text-xs font-bold text-accent">Admin</span>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 pt-5">
        {/* Tabs */}
        <div className="flex gap-1.5 mb-5">
          {(['pending', 'approved', 'rejected'] as TabType[]).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all capitalize ${
                activeTab === tab ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'glass-sm text-muted'
              }`}>
              {tab} ({counts[tab]})
            </button>
          ))}
        </div>

        {/* List */}
        {filtered.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Store size={32} className="text-faint mx-auto mb-3" />
            <p className="text-sm font-bold text-muted">No {activeTab} registrations</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(reg => (
              <div key={reg.id} className={`glass-card p-4 cursor-pointer hover:border-orange-400/25 transition-all ${
                reg.status === 'pending' ? 'border-l-4 border-l-amber-500' :
                reg.status === 'approved' ? 'border-l-4 border-l-emerald-500' :
                'border-l-4 border-l-red-500'
              }`} onClick={() => setSelectedVendor(reg)}>
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${
                    reg.status === 'pending' ? 'bg-amber-500/10' :
                    reg.status === 'approved' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                  }`}>
                    <Store size={18} className={
                      reg.status === 'pending' ? 'text-amber-600' :
                      reg.status === 'approved' ? 'text-emerald-600' : 'text-red-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-body">{reg.shopName}</h3>
                    <p className="text-xs text-faint">{reg.ownerName} • {reg.phone} • {reg.city}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-faint">{formatDate(reg.createdAt)}</p>
                    {reg.status === 'approved' && reg.shopId && (
                      <p className="text-[10px] font-bold text-emerald-600 mt-0.5">{reg.shopId}</p>
                    )}
                  </div>
                </div>

                {/* Quick actions for pending */}
                {reg.status === 'pending' && (
                  <div className="flex gap-2 mt-3" onClick={e => e.stopPropagation()}>
                    <button onClick={() => handleApprove(reg.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-emerald-500 text-white flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <CheckCircle2 size={13} /> Approve
                    </button>
                    <button onClick={() => setShowRejectModal(reg.id)}
                      className="flex-1 py-2 rounded-lg text-xs font-bold bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                      <XCircle size={13} /> Reject
                    </button>
                  </div>
                )}

                {/* Show credentials for approved */}
                {reg.status === 'approved' && reg.shopId && (
                  <div className="mt-3 surface rounded-lg p-3 space-y-2" onClick={e => e.stopPropagation()}>
                    <p className="text-[10px] font-bold text-faint uppercase">Login Credentials</p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Phone:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-body">{reg.phone}</span>
                        <button onClick={() => copyToClipboard(reg.phone)} className="text-accent"><Copy size={11} /></button>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted">Password:</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-body">{reg.password}</span>
                        <button onClick={() => copyToClipboard(reg.password || '')} className="text-accent"><Copy size={11} /></button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Rejection reason */}
                {reg.status === 'rejected' && reg.rejectionReason && (
                  <div className="mt-3 bg-red-500/5 border border-red-500/15 rounded-lg p-2.5">
                    <p className="text-[10px] text-red-600 dark:text-red-400">
                      <span className="font-bold">Reason:</span> {reg.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="modal-overlay" onClick={() => setShowRejectModal(null)}>
          <div className="modal-sheet" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-[var(--card-border)]" />
            <h2 className="font-black text-body text-lg mb-3">Reject Registration</h2>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Enter reason for rejection..."
              className="input-glass w-full resize-none mb-4" rows={3} />
            <div className="flex gap-3">
              <button onClick={() => setShowRejectModal(null)} className="btn-secondary flex-1 py-3">Cancel</button>
              <button onClick={() => handleReject(showRejectModal)}
                className="flex-1 py-3 rounded-xl text-xs font-bold bg-red-500 text-white active:scale-95 transition-all">
                Confirm Reject
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Vendor Detail Modal — Shows ALL vendor data for review */}
      {selectedVendor && !showRejectModal && (
        <div className="modal-overlay" onClick={() => setSelectedVendor(null)}>
          <div className="modal-sheet max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="w-10 h-1 rounded-full mx-auto mb-4 bg-[var(--card-border)]" />
            <h2 className="font-black text-body text-lg mb-4">Vendor Details</h2>

            {/* Shop Photo */}
            {(selectedVendor as any).shopPhotoUrl && (
              <div className="mb-4">
                <p className="text-[10px] text-faint mb-1">Shop Photo</p>
                <img src={(selectedVendor as any).shopPhotoUrl} alt="Shop" className="w-full h-32 object-cover rounded-xl border border-subtle" />
              </div>
            )}

            {/* Basic Info */}
            <div className="space-y-2.5 mb-4">
              <p className="text-[10px] font-bold text-faint uppercase tracking-wider">Basic Info</p>
              {[
                { icon: Store, label: 'Shop Name', value: selectedVendor.shopName },
                { icon: Store, label: 'Shop Type', value: (selectedVendor as any).shopType || selectedVendor.category || 'N/A' },
                { icon: Phone, label: 'Phone', value: selectedVendor.phone },
                { icon: Mail, label: 'Email', value: (selectedVendor as any).email || 'N/A' },
                { icon: MapPin, label: 'Address', value: (selectedVendor as any).address || 'N/A' },
                { icon: MapPin, label: 'City', value: (selectedVendor as any).city || 'N/A' },
                { icon: MapPin, label: 'Pincode', value: (selectedVendor as any).pincode || 'N/A' },
              ].map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3 py-1.5 border-b border-subtle last:border-0">
                  <Icon size={13} className="text-faint mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-[9px] text-faint">{label}</p>
                    <p className="text-xs font-bold text-body">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Bank & Payment */}
            <div className="space-y-2.5 mb-4 p-3 surface rounded-xl">
              <p className="text-[10px] font-bold text-faint uppercase tracking-wider">💳 Payment Details</p>
              {[
                { label: 'UPI ID', value: (selectedVendor as any).upiId || 'N/A' },
                { label: 'Account Holder', value: (selectedVendor as any).accountHolderName || 'N/A' },
                { label: 'Bank Name', value: (selectedVendor as any).bankName || 'N/A' },
                { label: 'Account Number', value: (selectedVendor as any).accountNumber || (selectedVendor as any).bankAccount || 'N/A' },
                { label: 'IFSC Code', value: (selectedVendor as any).ifscCode || 'N/A' },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <span className="text-[10px] text-faint">{label}</span>
                  <span className="text-xs font-bold text-body">{value}</span>
                </div>
              ))}
            </div>

            {/* KYC Documents */}
            <div className="space-y-2.5 mb-4 p-3 surface rounded-xl">
              <p className="text-[10px] font-bold text-faint uppercase tracking-wider">📄 KYC Documents</p>
              {[
                { label: 'Aadhaar', url: (selectedVendor as any).aadhaarUrl },
                { label: 'Bank Proof', url: (selectedVendor as any).bankDocUrl },
                { label: 'PAN', url: (selectedVendor as any).panUrl },
                { label: 'FSSAI Number', url: null, text: (selectedVendor as any).fssaiNumber || 'N/A' },
                { label: 'GST Number', url: null, text: (selectedVendor as any).gstNumber || 'N/A' },
              ].map(({ label, url, text }) => (
                <div key={label} className="flex items-center justify-between py-1">
                  <span className="text-[10px] text-faint">{label}</span>
                  {url ? (
                    <a href={url} target="_blank" rel="noopener" className="text-[10px] font-bold text-accent underline">View Document ↗</a>
                  ) : (
                    <span className="text-xs font-bold text-body">{text || 'N/A'}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Status Info */}
            <div className="space-y-2.5 mb-4 p-3 surface rounded-xl">
              <p className="text-[10px] font-bold text-faint uppercase tracking-wider">📋 Status</p>
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] text-faint">Onboarding Status</span>
                <span className="text-xs font-bold text-body">{(selectedVendor as any).onboardingStatus || selectedVendor.status}</span>
              </div>
              <div className="flex items-center justify-between py-1">
                <span className="text-[10px] text-faint">Onboarding Step</span>
                <span className="text-xs font-bold text-body">{(selectedVendor as any).onboardingStep || 'N/A'}</span>
              </div>
            </div>

            {selectedVendor.status === 'pending' && (
              <div className="flex gap-3 mt-5">
                <button onClick={() => handleApprove(selectedVendor.id)} className="btn-primary flex-1 py-3">✅ Approve</button>
                <button onClick={() => { setShowRejectModal(selectedVendor.id); }}
                  className="flex-1 py-3 rounded-xl text-xs font-bold bg-red-500/10 border border-red-500/25 text-red-600 dark:text-red-400">
                  ❌ Reject
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
