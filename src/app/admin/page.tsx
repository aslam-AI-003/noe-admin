'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { orderService, vendorService, riderService } from '@/lib/firestoreService';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import toast from 'react-hot-toast';
import {
  BarChart3, Package, Store, Bike, Clock, CheckCircle2, XCircle, Wallet,
  Inbox, Zap, TrendingUp, UserRound, MapPin, LogOut, Bell, Moon, Sun,
  Search, Filter, ChevronRight, Activity, ShoppingBag, Users, Eye,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOX ADMIN DASHBOARD — Premium dark themed
// Brand: #0E9F6E (green), #111111 (dark), #C9A227 (gold)
// Real-time Firestore data
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  placed: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
  accepted: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  confirmed: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  preparing: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  ready: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
  picked_up: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/30',
  on_the_way: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30',
  delivered: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  cancelled: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New', placed: 'Placed', accepted: 'Accepted', confirmed: 'Confirmed',
  preparing: 'Preparing', ready: 'Ready', picked_up: 'Picked Up',
  on_the_way: 'On The Way', delivered: 'Delivered', cancelled: 'Cancelled',
};

type Tab = 'dashboard' | 'orders' | 'vendors' | 'riders' | 'customers';

export default function AdminDashboard() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [mounted, setMounted] = useState(false);
  const [isAuth, setIsAuth] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedRider, setSelectedRider] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [peakHourHero, setPeakHourHero] = useState(false);
  const [rainWarrior, setRainWarrior] = useState(false);

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('noe-admin-token');
    if (token !== 'authenticated') {
      router.replace('/admin/login');
    } else {
      setIsAuth(true);
    }
  }, [router]);

  // Real-time Firestore subscriptions
  useEffect(() => {
    if (!isAuth) return;
    const unsubOrders = orderService.onAll((data: any[]) => {
      data.sort((a, b) => {
        const aT = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bT = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bT - aT;
      });
      setOrders(data);
    });
    const unsubVendors = vendorService.onAll((data: any[]) => setVendors(data));
    const unsubRiders = riderService.onAll((data: any[]) => setRiders(data));

    // Listen to incentive settings
    let unsubIncentives = () => {};
    if (db) {
      unsubIncentives = onSnapshot(doc(db, 'settings', 'incentives'), (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setPeakHourHero(data?.peakHourHero === true);
          setRainWarrior(data?.rainWarrior === true);
        }
      });
    }

    return () => { unsubOrders(); unsubVendors(); unsubRiders(); unsubIncentives(); };
  }, [isAuth]);

  // Toggle incentive settings in Firestore
  const togglePeakHour = async () => {
    if (!db) return;
    const newVal = !peakHourHero;
    await setDoc(doc(db, 'settings', 'incentives'), { peakHourHero: newVal, rainWarrior }, { merge: true });
    setPeakHourHero(newVal);
    toast.success(newVal ? '🔥 Peak Hour Hero ACTIVATED! Riders get ₹10/order extra' : '⏸️ Peak Hour Hero deactivated');
  };

  const toggleRainWarrior = async () => {
    if (!db) return;
    const newVal = !rainWarrior;
    await setDoc(doc(db, 'settings', 'incentives'), { rainWarrior: newVal, peakHourHero }, { merge: true });
    setRainWarrior(newVal);
    toast.success(newVal ? '🌧️ Rain Warrior ACTIVATED! Riders get ₹10/ride extra' : '⏸️ Rain Warrior deactivated');
  };

  const handleLogout = () => {
    localStorage.removeItem('noe-admin-token');
    router.replace('/admin/login');
  };

  if (!mounted || !isAuth) return <div className="min-h-screen bg-[#0a0a0a]" />;

  // ━━━ Stats ━━━
  const stats = {
    totalOrders: orders.length,
    activeOrders: orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.totalAmount || o.total || 0), 0),
    todayOrders: orders.filter(o => {
      const t = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt || 0).getTime();
      return t > Date.now() - 86400000;
    }).length,
    totalVendors: vendors.length,
    approvedVendors: vendors.filter(v => v.status === 'approved').length,
    pendingVendors: vendors.filter(v => v.status === 'pending').length,
    totalRiders: riders.length,
    approvedRiders: riders.filter(r => r.status === 'approved').length,
  };

  const timeAgo = (ts: any) => {
    if (!ts) return '-';
    const time = ts?.seconds ? ts.seconds * 1000 : new Date(ts).getTime();
    const diff = Date.now() - time;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (mins < 1440) return `${Math.floor(mins / 60)}h ago`;
    return `${Math.floor(mins / 1440)}d ago`;
  };

  const filteredOrders = searchQuery
    ? orders.filter(o => (o.orderId || o.id || '').toLowerCase().includes(searchQuery.toLowerCase()) || (o.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()))
    : orders;

  const sidebarItems = [
    { id: 'dashboard' as Tab, label: 'Dashboard', icon: BarChart3 },
    { id: 'orders' as Tab, label: 'Orders', icon: Package, badge: stats.activeOrders },
    { id: 'vendors' as Tab, label: 'Vendors', icon: Store, badge: stats.pendingVendors },
    { id: 'riders' as Tab, label: 'Riders', icon: Bike },
    { id: 'customers' as Tab, label: 'Customers', icon: Users },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex text-white">
      
      {/* ━━━ SIDEBAR ━━━ */}
      <aside className="hidden lg:flex w-60 border-r border-white/[0.06] flex-col fixed h-screen bg-[#0f0f0f]">
        {/* Logo */}
        <div className="p-5 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #0E9F6E, #0a7b55)' }}>
              <MapPin size={18} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-white tracking-tight">NOX</h1>
              <p className="text-[9px] text-[#0E9F6E] font-bold uppercase tracking-wider">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 space-y-1">
          {sidebarItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                activeTab === item.id
                  ? 'bg-[#0E9F6E]/10 text-[#0E9F6E] border border-[#0E9F6E]/20'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/[0.03]'
              }`}>
              <item.icon size={15} />
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto w-5 h-5 bg-[#0E9F6E] text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,159,110,0.1)' }}>
              <UserRound size={15} className="text-[#0E9F6E]" />
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-white">Admin</p>
              <p className="text-[10px] text-gray-600">admin@nammaooru.in</p>
            </div>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-400 transition-colors">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </aside>

      {/* ━━━ MAIN CONTENT ━━━ */}
      <main className="flex-1 lg:ml-60 min-h-screen">
        {/* Top bar */}
        <header className="sticky top-0 z-40 backdrop-blur-xl bg-[#0a0a0a]/80 border-b border-white/[0.04]">
          <div className="px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu */}
              <div className="lg:hidden flex items-center gap-2">
                <MapPin size={16} className="text-[#0E9F6E]" />
                <span className="text-sm font-black text-white">NOX</span>
              </div>
              <h2 className="hidden lg:block text-sm font-bold text-gray-300 capitalize">{activeTab}</h2>
            </div>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold" style={{ background: 'rgba(14,159,110,0.1)', color: '#0E9F6E' }}>
                <span className="w-1.5 h-1.5 bg-[#0E9F6E] rounded-full animate-pulse" />
                LIVE
              </span>
              <button onClick={handleLogout} className="lg:hidden text-gray-500 hover:text-red-400">
                <LogOut size={16} />
              </button>
            </div>
          </div>
          {/* Mobile nav */}
          <div className="lg:hidden flex gap-1 px-4 pb-2 overflow-x-auto hide-scrollbar">
            {sidebarItems.map(item => (
              <button key={item.id} onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold whitespace-nowrap ${
                  activeTab === item.id ? 'bg-[#0E9F6E]/15 text-[#0E9F6E]' : 'text-gray-600'
                }`}>
                <item.icon size={12} />
                {item.label}
              </button>
            ))}
          </div>
        </header>

        <div className="p-4 lg:p-6 space-y-5 max-w-[1400px] mx-auto">

          {/* ═══════════ DASHBOARD TAB ═══════════ */}
          {activeTab === 'dashboard' && (
            <>
              {/* Greeting */}
              <div>
                <h1 className="text-xl font-black text-white">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, Admin 👋</h1>
                <p className="text-xs text-gray-500 mt-0.5">Here&apos;s what&apos;s happening with NOX today</p>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <StatCard icon={Package} label="Total Orders" value={stats.totalOrders} color="#3b82f6" />
                <StatCard icon={Zap} label="Active Now" value={stats.activeOrders} color="#0E9F6E" />
                <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered} color="#10b981" />
                <StatCard icon={Wallet} label="Revenue" value={`₹${stats.revenue}`} color="#C9A227" />
                <StatCard icon={Store} label="Vendors" value={stats.approvedVendors} color="#f97316" />
                <StatCard icon={Bike} label="Riders" value={stats.approvedRiders} color="#8b5cf6" />
              </div>

              {/* Today Summary + Recent Orders */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Recent Orders */}
                <div className="lg:col-span-2 rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Activity size={14} className="text-[#0E9F6E]" /> Live Orders
                    </h3>
                    <button onClick={() => setActiveTab('orders')} className="text-[10px] text-[#0E9F6E] font-bold">View All →</button>
                  </div>
                  <div className="space-y-2">
                    {orders.slice(0, 6).map(order => (
                      <div key={order.id} onClick={() => setSelectedOrder(order)}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all hover:bg-white/[0.03]" style={{ border: '1px solid rgba(255,255,255,0.03)' }}>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-white">{order.orderId || `#${(order.id || '').slice(0,8)}`}</span>
                            <span className={`px-2 py-0.5 text-[8px] font-bold rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.new}`}>
                              {STATUS_LABELS[order.status] || order.status}
                            </span>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-0.5">{order.customerName} → {order.shopName}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-bold text-[#0E9F6E]">₹{order.totalAmount || order.total || 0}</p>
                          <p className="text-[9px] text-gray-600">{timeAgo(order.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                    {orders.length === 0 && (
                      <div className="text-center py-10">
                        <Inbox size={28} className="text-gray-700 mx-auto mb-2" />
                        <p className="text-xs text-gray-600">No orders yet</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="space-y-3">
                  <div className="rounded-2xl p-5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xs font-bold text-gray-400 mb-3 flex items-center gap-2">
                      <TrendingUp size={12} className="text-[#C9A227]" /> Today&apos;s Summary
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-500">Orders Today</span>
                        <span className="text-sm font-black text-white">{stats.todayOrders}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-500">Today Revenue</span>
                        <span className="text-sm font-black text-[#0E9F6E]">
                          ₹{orders.filter(o => {
                            const t = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt || 0).getTime();
                            return t > Date.now() - 86400000 && o.status === 'delivered';
                          }).reduce((s: number, o: any) => s + (o.totalAmount || o.total || 0), 0)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-500">Pending Vendors</span>
                        <span className="text-sm font-black text-amber-400">{stats.pendingVendors}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[11px] text-gray-500">Total Riders</span>
                        <span className="text-sm font-black text-purple-400">{stats.totalRiders}</span>
                      </div>
                    </div>
                  </div>

                  {/* ━━━ RIDER INCENTIVE CONTROLS ━━━ */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <h3 className="text-xs font-bold text-white mb-3 flex items-center gap-2">
                      <Zap size={12} className="text-amber-400" /> Rider Incentives
                    </h3>

                    {/* Peak Hour Hero Toggle */}
                    <div className="flex items-center justify-between py-2.5 border-b border-white/[0.04]">
                      <div>
                        <p className="text-[11px] font-bold text-white">🔥 Peak Hour Hero</p>
                        <p className="text-[9px] text-gray-600">₹10 extra/order during rush</p>
                      </div>
                      <button onClick={togglePeakHour}
                        className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-all ${peakHourHero ? 'bg-amber-500 justify-end' : 'bg-gray-700 justify-start'}`}>
                        <div className="w-5 h-5 bg-white rounded-full shadow" />
                      </button>
                    </div>

                    {/* Rain Warrior Toggle */}
                    <div className="flex items-center justify-between py-2.5">
                      <div>
                        <p className="text-[11px] font-bold text-white">🌧️ Rain Warrior</p>
                        <p className="text-[9px] text-gray-600">₹10 extra/ride during rain</p>
                      </div>
                      <button onClick={toggleRainWarrior}
                        className={`w-11 h-6 rounded-full flex items-center p-0.5 transition-all ${rainWarrior ? 'bg-cyan-500 justify-end' : 'bg-gray-700 justify-start'}`}>
                        <div className="w-5 h-5 bg-white rounded-full shadow" />
                      </button>
                    </div>

                    {(peakHourHero || rainWarrior) && (
                      <p className="text-[9px] text-emerald-400 mt-2 font-bold">✓ Active incentives visible to all riders</p>
                    )}
                  </div>

                  {/* Platform Info */}
                  <div className="rounded-2xl p-4" style={{ background: 'rgba(14,159,110,0.05)', border: '1px solid rgba(14,159,110,0.1)' }}>
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin size={12} className="text-[#0E9F6E]" />
                      <span className="text-[10px] text-[#0E9F6E] font-bold">NOX Platform</span>
                    </div>
                    <p className="text-[10px] text-gray-500">Namma Ooru Express</p>
                    <p className="text-[9px] text-gray-700 mt-1">உங்க ஊரு... உங்க சேவை</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ═══════════ ORDERS TAB ═══════════ */}
          {activeTab === 'orders' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-black text-white">All Orders</h1>
                  <p className="text-xs text-gray-500">{orders.length} total • {stats.activeOrders} active</p>
                </div>
                <div className="relative">
                  <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search..."
                    className="pl-8 pr-3 py-2 text-xs rounded-lg bg-white/[0.03] border border-white/[0.06] text-white placeholder:text-gray-700 focus:outline-none focus:border-[#0E9F6E]/30 w-48" />
                </div>
              </div>
              <div className="space-y-2">
                {filteredOrders.map(order => (
                  <div key={order.id} onClick={() => setSelectedOrder(order)}
                    className="rounded-xl p-4 cursor-pointer transition-all hover:bg-white/[0.02]" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-white">{order.orderId || `#${(order.id || '').slice(0,8)}`}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.new}`}>
                            {STATUS_LABELS[order.status] || order.status}
                          </span>
                          {order.riderName && <span className="text-[9px] text-purple-400 font-semibold">🛵 {order.riderName}</span>}
                        </div>
                        <p className="text-[11px] text-gray-500 mt-1">👤 {order.customerName} → 🏪 {order.shopName} • {order.items?.length || 0} items</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-bold text-[#0E9F6E]">₹{order.totalAmount || order.total || 0}</p>
                        <p className="text-[9px] text-gray-600">{timeAgo(order.createdAt)}</p>
                      </div>
                    </div>
                  </div>
                ))}
                {filteredOrders.length === 0 && (
                  <div className="text-center py-16">
                    <Package size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No orders found</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* ═══════════ VENDORS TAB ═══════════ */}
          {activeTab === 'vendors' && (
            <>
              <div>
                <h1 className="text-lg font-black text-white">Vendors</h1>
                <p className="text-xs text-gray-500">{vendors.length} total • {stats.pendingVendors} pending approval</p>
              </div>

              {/* Pending */}
              {vendors.filter(v => v.status === 'pending').length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">⚠️ Pending Approval</h3>
                  <div className="space-y-2">
                    {vendors.filter(v => v.status === 'pending').map(vendor => (
                      <div key={vendor.id} className="rounded-xl p-4" style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.1)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(14,159,110,0.1)' }}>
                            <Store size={16} className="text-[#0E9F6E]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{vendor.shopName || vendor.name}</p>
                            <p className="text-[10px] text-gray-500">{vendor.ownerName} • {vendor.phone} • {vendor.category || '-'} • {vendor.city || vendor.area || '-'}</p>
                          </div>
                          <div className="flex gap-2">
                            <button onClick={async () => { await vendorService.update(vendor.id, { status: 'approved' }); toast.success('✅ Approved!'); }}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-white" style={{ background: '#0E9F6E' }}>Approve</button>
                            <button onClick={async () => { await vendorService.update(vendor.id, { status: 'rejected' }); toast.error('❌ Rejected'); }}
                              className="px-3 py-1.5 rounded-lg text-[10px] font-bold text-red-400 bg-red-500/10">Reject</button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved */}
              <div>
                <h3 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">✅ Approved Vendors</h3>
                <div className="space-y-2">
                  {vendors.filter(v => v.status === 'approved').map(vendor => (
                    <div key={vendor.id} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'rgba(14,159,110,0.1)' }}>
                          <Store size={16} className="text-[#0E9F6E]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{vendor.shopName || vendor.name}</p>
                          <p className="text-[10px] text-gray-500">{vendor.ownerName} • 📞 {vendor.phone} • {vendor.category || '-'} • 📍 {vendor.city || vendor.area || '-'}</p>
                        </div>
                        <span className="text-[9px] text-emerald-400 font-bold">Active ✓</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {vendors.length === 0 && (
                <div className="text-center py-16">
                  <Store size={32} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No vendors registered yet</p>
                </div>
              )}
            </>
          )}

          {/* ═══════════ RIDERS TAB ═══════════ */}
          {activeTab === 'riders' && (
            <>
              <div>
                <h1 className="text-lg font-black text-white">Riders</h1>
                <p className="text-xs text-gray-500">{riders.length} total • {stats.approvedRiders} approved</p>
              </div>

              {/* Pending */}
              {riders.filter(r => r.status === 'pending').length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-amber-400 mb-2 uppercase tracking-wider">⚠️ Pending Approval</h3>
                  <div className="space-y-3">
                    {riders.filter(r => r.status === 'pending').map(rider => (
                      <div key={rider.id} className="rounded-xl p-4 space-y-3" style={{ background: 'rgba(245,158,11,0.03)', border: '1px solid rgba(245,158,11,0.1)' }}>
                        {/* Header */}
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
                            <Bike size={16} className="text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{rider.name}</p>
                            <p className="text-[10px] text-gray-500">📞 {rider.phone} • 📍 {rider.area || rider.city || '-'}</p>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/25">pending</span>
                        </div>

                        {/* Full Details Grid */}
                        <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                            <div>
                              <p className="text-gray-600">Vehicle Type</p>
                              <p className="text-white font-bold">🏍️ {rider.vehicleType || 'Bike'}</p>
                            </div>
                            <div>
                              <p className="text-gray-600">Aadhaar</p>
                              <p className="text-white font-bold">🪪 {rider.aadhaarNumber || '-'}</p>
                            </div>
                            {rider.licenseNumber && (
                              <div>
                                <p className="text-gray-600">Driving License</p>
                                <p className="text-white font-bold">📜 {rider.licenseNumber}</p>
                              </div>
                            )}
                            {rider.vehicleNumber && (
                              <div>
                                <p className="text-gray-600">Vehicle Number</p>
                                <p className="text-white font-bold">🚗 {rider.vehicleNumber}</p>
                              </div>
                            )}
                            {rider.vehicleModel && (
                              <div>
                                <p className="text-gray-600">Vehicle Model</p>
                                <p className="text-white font-bold">🏎️ {rider.vehicleModel}</p>
                              </div>
                            )}
                            {rider.email && (
                              <div>
                                <p className="text-gray-600">Email</p>
                                <p className="text-white font-bold">✉️ {rider.email}</p>
                              </div>
                            )}
                          </div>
                          <p className="text-[9px] text-gray-600">Registered: {rider.createdAt ? new Date(rider.createdAt.seconds ? rider.createdAt.seconds * 1000 : rider.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}</p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                          <button onClick={async () => {
                            const vNum = rider.vehicleNumber || '';
                            const last4 = vNum ? vNum.replace(/[^A-Z0-9]/gi, '').slice(-4).toUpperCase() : rider.phone.slice(-4);
                            const riderId = 'NOX-R-' + last4;
                            await riderService.update(rider.id, { status: 'approved', riderId, password: riderId, approvedAt: new Date().toISOString() });
                            toast.success('✅ Approved! Rider ID: ' + riderId);
                          }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-white text-center" style={{ background: '#0E9F6E' }}>✅ Approve</button>
                          <button onClick={async () => {
                            const reason = prompt('Rejection reason:');
                            if (reason) { await riderService.update(rider.id, { status: 'rejected', rejectionReason: reason }); toast.error('❌ Rejected'); }
                          }}
                            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-red-400 bg-red-500/10 border border-red-500/20 text-center">❌ Reject</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Approved */}
              {riders.filter(r => r.status === 'approved').length > 0 && (
                <div>
                  <h3 className="text-xs font-bold text-emerald-400 mb-2 uppercase tracking-wider">✅ Active Riders</h3>
                  <div className="space-y-2">
                    {riders.filter(r => r.status === 'approved').map(rider => (
                      <div key={rider.id} className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-500/10">
                            <Bike size={16} className="text-purple-400" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-bold text-white">{rider.name}</p>
                            <p className="text-[10px] text-gray-500">📞 {rider.phone} • 🏍️ {rider.vehicleType || 'Bike'} • 📍 {rider.area || rider.city || '-'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {rider.isOnline ? (
                              <span className="flex items-center gap-1 text-[9px] font-bold text-emerald-400"><span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />Online</span>
                            ) : (
                              <span className="text-[9px] text-gray-600 font-bold">Offline</span>
                            )}
                          </div>
                        </div>
                        {rider.riderId && (
                          <div className="p-2 rounded-lg" style={{ background: 'rgba(14,159,110,0.05)', border: '1px solid rgba(14,159,110,0.15)' }}>
                            <p className="text-[9px] text-gray-500">Rider ID / Password</p>
                            <p className="text-xs font-black text-emerald-400">{rider.riderId}</p>
                          </div>
                        )}
                        <button onClick={() => setSelectedRider(rider)} className="w-full py-2 text-[10px] font-bold text-purple-400 bg-purple-500/5 rounded-lg border border-purple-500/15 hover:bg-purple-500/10 transition-all">
                          👁️ View Documents & Details
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {riders.length === 0 && (
                <div className="text-center py-16">
                  <Bike size={32} className="text-gray-700 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No riders registered yet</p>
                </div>
              )}
            </>
          )}

          {/* ═══════════ CUSTOMERS TAB ═══════════ */}
          {activeTab === 'customers' && (
            <>
              <div>
                <h1 className="text-lg font-black text-white">Customers</h1>
                <p className="text-xs text-gray-500">Unique customers from orders</p>
              </div>
              <div className="space-y-2">
                {Array.from(new Set(orders.map(o => o.customerPhone || o.customerName))).map((customer, i) => {
                  const customerOrders = orders.filter(o => (o.customerPhone || o.customerName) === customer);
                  const name = customerOrders[0]?.customerName || 'Unknown';
                  const phone = customerOrders[0]?.customerPhone || '-';
                  const totalSpent = customerOrders.reduce((s, o) => s + (o.totalAmount || o.total || 0), 0);
                  return (
                    <div key={i} className="rounded-xl p-4" style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'rgba(14,159,110,0.1)' }}>
                          <UserRound size={16} className="text-[#0E9F6E]" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-white">{name}</p>
                          <p className="text-[10px] text-gray-500">📞 {phone} • {customerOrders.length} orders</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-[#0E9F6E]">₹{totalSpent}</p>
                          <p className="text-[9px] text-gray-600">Total spent</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {orders.length === 0 && (
                  <div className="text-center py-16">
                    <Users size={32} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-sm text-gray-500">No customers yet</p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </main>

      {/* ━━━ ORDER DETAIL MODAL ━━━ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative rounded-2xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{ background: '#141414', border: '1px solid rgba(14,159,110,0.15)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white">{selectedOrder.orderId || `#${selectedOrder.id?.slice(0,8)}`}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-gray-500 hover:text-white text-lg">✕</button>
            </div>

            <span className={`inline-block px-3 py-1 text-xs font-bold rounded-full border ${STATUS_COLORS[selectedOrder.status]}`}>
              {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
            </span>

            <div className="space-y-3">
              <InfoRow label="Customer" value={`${selectedOrder.customerName} • ${selectedOrder.customerPhone || '-'}`} />
              <InfoRow label="Shop" value={selectedOrder.shopName} />
              {selectedOrder.riderName && <InfoRow label="Rider" value={`🛵 ${selectedOrder.riderName} • ${selectedOrder.riderPhone || ''}`} />}
              <InfoRow label="Payment" value={(selectedOrder.paymentMethod || 'COD').toUpperCase()} />
              {selectedOrder.deliveryAddress && <InfoRow label="Address" value={selectedOrder.deliveryAddress} />}
              {selectedOrder.deliveryOtp && <InfoRow label="OTP" value={selectedOrder.deliveryOtp} highlight />}
            </div>

            {/* Items */}
            <div className="rounded-xl p-3" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
              <p className="text-[10px] text-gray-500 mb-2">Items ({selectedOrder.items?.length || 0})</p>
              {selectedOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-gray-400">{item.name} × {item.quantity}</span>
                  <span className="text-white font-semibold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-white/[0.06] mt-2 pt-2 flex justify-between">
                <span className="text-xs font-bold text-white">Total</span>
                <span className="text-sm font-black text-[#0E9F6E]">₹{selectedOrder.totalAmount || selectedOrder.total}</span>
              </div>
            </div>

            <p className="text-[9px] text-gray-700 text-center">{timeAgo(selectedOrder.createdAt)}</p>
          </div>
        </div>
      )}

      {/* ━━━ RIDER DETAIL MODAL ━━━ */}
      {selectedRider && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setSelectedRider(null)} />
          <div className="relative rounded-2xl w-full max-w-lg p-6 space-y-4 max-h-[85vh] overflow-y-auto"
            style={{ background: '#141414', border: '1px solid rgba(139,92,246,0.2)' }}>
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-white flex items-center gap-2">
                <Bike size={18} className="text-purple-400" /> {selectedRider.name}
              </h2>
              <button onClick={() => setSelectedRider(null)} className="text-gray-500 hover:text-white text-lg">✕</button>
            </div>

            {/* Status & ID */}
            <div className="flex items-center gap-2 flex-wrap">
              {selectedRider.isOnline ? (
                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" /> Online
                </span>
              ) : (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-gray-500/10 text-gray-400 border border-gray-500/20">Offline</span>
              )}
              {selectedRider.riderId && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">{selectedRider.riderId}</span>
              )}
            </div>

            {/* Basic Info */}
            <div className="space-y-2">
              <InfoRow label="Phone" value={selectedRider.phone} />
              <InfoRow label="Vehicle" value={`${selectedRider.vehicleType || 'Bike'} • ${selectedRider.vehicleNumber || '-'} • ${selectedRider.vehicleModel || '-'}`} />
              <InfoRow label="Aadhaar" value={selectedRider.aadhaarNumber || '-'} />
              {selectedRider.licenseNumber && <InfoRow label="License" value={selectedRider.licenseNumber} />}
              <InfoRow label="City" value={selectedRider.area || selectedRider.city || '-'} />
            </div>

            {/* Uploaded Documents */}
            <div>
              <p className="text-xs font-bold text-white mb-2">📄 Uploaded Documents</p>
              {selectedRider.documents ? (
                <div className="grid grid-cols-2 gap-2">
                  {selectedRider.documents.photo && (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img src={selectedRider.documents.photo} alt="Photo" className="w-full h-24 object-cover" />
                      <p className="text-[9px] text-gray-500 p-1 text-center">Profile Photo</p>
                    </div>
                  )}
                  {selectedRider.documents.aadhaarFront && (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img src={selectedRider.documents.aadhaarFront} alt="Aadhaar Front" className="w-full h-24 object-cover" />
                      <p className="text-[9px] text-gray-500 p-1 text-center">Aadhaar Front</p>
                    </div>
                  )}
                  {selectedRider.documents.aadhaarBack && (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img src={selectedRider.documents.aadhaarBack} alt="Aadhaar Back" className="w-full h-24 object-cover" />
                      <p className="text-[9px] text-gray-500 p-1 text-center">Aadhaar Back</p>
                    </div>
                  )}
                  {selectedRider.documents.license && (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img src={selectedRider.documents.license} alt="License" className="w-full h-24 object-cover" />
                      <p className="text-[9px] text-gray-500 p-1 text-center">Driving License</p>
                    </div>
                  )}
                  {selectedRider.documents.rcBook && (
                    <div className="rounded-lg overflow-hidden border border-white/10">
                      <img src={selectedRider.documents.rcBook} alt="RC Book" className="w-full h-24 object-cover" />
                      <p className="text-[9px] text-gray-500 p-1 text-center">RC Book</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-[10px] text-gray-600 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>No documents uploaded yet</p>
              )}
            </div>

            {/* Bank Details */}
            <div>
              <p className="text-xs font-bold text-white mb-2">🏦 Bank Details</p>
              {selectedRider.bankDetails ? (
                <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <InfoRow label="Account Holder" value={selectedRider.bankDetails.accountHolder || '-'} />
                  <InfoRow label="Account Number" value={selectedRider.bankDetails.accountNumber || '-'} />
                  <InfoRow label="IFSC" value={selectedRider.bankDetails.ifscCode || '-'} />
                  <InfoRow label="Bank" value={selectedRider.bankDetails.bankName || '-'} />
                  {selectedRider.bankDetails.upiId && <InfoRow label="UPI" value={selectedRider.bankDetails.upiId} />}
                </div>
              ) : (
                <p className="text-[10px] text-gray-600 p-3 rounded-lg" style={{ background: 'rgba(255,255,255,0.02)' }}>Bank details not added yet</p>
              )}
            </div>

            <button onClick={() => setSelectedRider(null)}
              className="w-full py-3 rounded-xl text-xs font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ Stat Card ━━━
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  return (
    <div className="rounded-xl p-3.5 text-center" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="w-9 h-9 mx-auto rounded-lg flex items-center justify-center mb-1.5" style={{ background: `${color}15` }}>
        <Icon size={15} style={{ color }} />
      </div>
      <p className="text-lg font-black text-white">{value}</p>
      <p className="text-[9px] text-gray-600">{label}</p>
    </div>
  );
}

// ━━━ Info Row ━━━
function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center py-1.5 border-b border-white/[0.03]">
      <span className="text-[10px] text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? 'text-[#C9A227] tracking-widest font-black text-sm' : 'text-gray-300'}`}>{value}</span>
    </div>
  );
}
