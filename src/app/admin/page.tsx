'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { orderService, vendorService, riderService } from '@/lib/firestoreService';
import toast from 'react-hot-toast';
import {
  BarChart3, Package, Store, Bike, Clock, CheckCircle2, XCircle, Wallet,
  Inbox, Zap, RefreshCw, TrendingUp, UserRound, Eye, MapPin, Phone,
  ShieldCheck, AlertTriangle, Filter, Search,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN DASHBOARD — Real-time Firestore data
// Shows ALL orders, vendors, riders from Firebase
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  placed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  accepted: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
  confirmed: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
  preparing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  ready: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
  picked_up: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
  on_the_way: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
};

const STATUS_LABELS: Record<string, string> = {
  new: 'New',
  placed: 'Placed',
  accepted: 'Accepted',
  confirmed: 'Confirmed',
  preparing: 'Preparing',
  ready: 'Ready',
  picked_up: 'Picked Up',
  on_the_way: 'On The Way',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

type Tab = 'overview' | 'orders' | 'shops' | 'riders';
type OrderFilter = 'all' | 'active' | 'delivered' | 'cancelled';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [riders, setRiders] = useState<any[]>([]);
  const [orderFilter, setOrderFilter] = useState<OrderFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);

  useEffect(() => { setMounted(true); }, []);

  // ━━━ Real-time Firestore subscriptions ━━━
  useEffect(() => {
    const unsubOrders = orderService.onAll((firestoreOrders: any[]) => {
      // Sort by createdAt descending
      firestoreOrders.sort((a, b) => {
        const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : new Date(a.createdAt || 0).getTime();
        const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : new Date(b.createdAt || 0).getTime();
        return bTime - aTime;
      });
      setOrders(firestoreOrders);
    });

    const unsubVendors = vendorService.onAll((firestoreVendors: any[]) => {
      setVendors(firestoreVendors);
    });

    const unsubRiders = riderService.onAll((firestoreRiders: any[]) => {
      setRiders(firestoreRiders);
    });

    return () => {
      unsubOrders();
      unsubVendors();
      unsubRiders();
    };
  }, []);

  if (!mounted) return <div className="min-h-screen app-bg" />;

  // ━━━ Stats calculated from real data ━━━
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

  // ━━━ Filter orders ━━━
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'active') return !['delivered', 'cancelled'].includes(o.status);
    if (orderFilter === 'delivered') return o.status === 'delivered';
    if (orderFilter === 'cancelled') return o.status === 'cancelled';
    return true;
  }).filter(o => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      (o.orderId || o.id || '').toLowerCase().includes(q) ||
      (o.customerName || '').toLowerCase().includes(q) ||
      (o.shopName || '').toLowerCase().includes(q)
    );
  });

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

  const navItems = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'orders' as Tab, label: 'Orders', icon: Package, badge: stats.activeOrders },
    { id: 'shops' as Tab, label: 'Shops', icon: Store, badge: stats.pendingVendors },
    { id: 'riders' as Tab, label: 'Riders', icon: Bike },
  ];

  return (
    <div className="min-h-screen app-bg">
      {/* Header */}
      <header className="sticky top-0 z-50 header-glass">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
              <ShieldCheck size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-sm font-black text-body">NammaOoru Admin</h1>
              <p className="text-[10px] text-faint">Real-time Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              LIVE
            </span>
          </div>
        </div>
      </header>

      {/* Tab Nav */}
      <nav className="sticky top-[52px] z-40 header-glass border-b border-subtle">
        <div className="max-w-6xl mx-auto px-4 flex gap-1 overflow-x-auto hide-scrollbar">
          {navItems.map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`flex items-center gap-2 px-4 py-3 text-xs font-bold whitespace-nowrap border-b-2 transition-all ${
                activeTab === item.id
                  ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-muted hover:text-body'
              }`}>
              <item.icon size={14} />
              {item.label}
              {item.badge ? (
                <span className="px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[18px] text-center">
                  {item.badge}
                </span>
              ) : null}
            </button>
          ))}
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 pt-4 pb-20 space-y-4">

        {/* ━━━━━━━━━━━━━ OVERVIEW TAB ━━━━━━━━━━━━━ */}
        {activeTab === 'overview' && (
          <>
            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              <StatCard icon={Package} label="Total Orders" value={stats.totalOrders} color="blue" />
              <StatCard icon={Zap} label="Active Now" value={stats.activeOrders} color="purple" />
              <StatCard icon={CheckCircle2} label="Delivered" value={stats.delivered} color="emerald" />
              <StatCard icon={Wallet} label="Revenue" value={`₹${stats.revenue}`} color="amber" />
              <StatCard icon={Store} label="Vendors" value={stats.approvedVendors} color="orange" />
              <StatCard icon={Bike} label="Riders" value={stats.approvedRiders} color="indigo" />
            </div>

            {/* Today's summary */}
            <div className="glass-card p-4">
              <h3 className="text-sm font-bold text-body mb-3 flex items-center gap-2">
                <TrendingUp size={14} className="text-accent" /> Today&apos;s Summary
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="p-3 surface rounded-xl text-center">
                  <p className="text-2xl font-black text-body">{stats.todayOrders}</p>
                  <p className="text-[10px] text-faint">Orders Today</p>
                </div>
                <div className="p-3 surface rounded-xl text-center">
                  <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    ₹{orders.filter(o => {
                      const t = o.createdAt?.seconds ? o.createdAt.seconds * 1000 : new Date(o.createdAt || 0).getTime();
                      return t > Date.now() - 86400000 && o.status === 'delivered';
                    }).reduce((s, o) => s + (o.totalAmount || o.total || 0), 0)}
                  </p>
                  <p className="text-[10px] text-faint">Today Revenue</p>
                </div>
                <div className="p-3 surface rounded-xl text-center">
                  <p className="text-2xl font-black text-purple-600 dark:text-purple-400">{stats.pendingVendors}</p>
                  <p className="text-[10px] text-faint">Pending Vendors</p>
                </div>
                <div className="p-3 surface rounded-xl text-center">
                  <p className="text-2xl font-black text-indigo-600 dark:text-indigo-400">{stats.totalRiders}</p>
                  <p className="text-[10px] text-faint">Total Riders</p>
                </div>
              </div>
            </div>

            {/* Recent Orders (Live) */}
            <div className="glass-card p-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-bold text-body flex items-center gap-2">
                  <Inbox size={14} className="text-accent" /> Recent Orders (Live)
                </h3>
                <button onClick={() => setActiveTab('orders')} className="text-xs text-accent font-bold">View All →</button>
              </div>
              <div className="space-y-2">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="p-3 surface rounded-xl flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-black text-body">{order.orderId || `#${(order.id || '').slice(0,8)}`}</p>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.new}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-faint mt-0.5">
                        {order.customerName} → {order.shopName} • {order.items?.length || 0} items
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-xs font-bold text-body">₹{order.totalAmount || order.total || 0}</p>
                      <p className="text-[9px] text-faint">{timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                ))}
                {orders.length === 0 && (
                  <div className="text-center py-8">
                    <Inbox size={32} className="text-faint mx-auto mb-2" />
                    <p className="text-xs text-muted">No orders yet. Waiting for customers...</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ━━━━━━━━━━━━━ ORDERS TAB ━━━━━━━━━━━━━ */}
        {activeTab === 'orders' && (
          <>
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex gap-1 flex-1">
                {(['all', 'active', 'delivered', 'cancelled'] as OrderFilter[]).map(f => (
                  <button key={f} onClick={() => setOrderFilter(f)}
                    className={`px-3 py-2 text-xs font-bold rounded-lg capitalize transition-all ${
                      orderFilter === f ? 'bg-purple-500 text-white' : 'surface text-muted hover:text-body'
                    }`}>
                    {f} {f === 'active' && stats.activeOrders > 0 ? `(${stats.activeOrders})` : ''}
                    {f === 'all' ? `(${stats.totalOrders})` : ''}
                  </button>
                ))}
              </div>
              <div className="relative">
                <Search size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search orders..." className="input-glass text-xs pl-8 w-full sm:w-48" />
              </div>
            </div>

            {/* Orders List */}
            <div className="space-y-2">
              {filteredOrders.map(order => (
                <div key={order.id} onClick={() => setSelectedOrder(order)}
                  className="glass-card p-4 hover:border-purple-500/30 cursor-pointer transition-all">
                  <div className="flex items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-black text-body">{order.orderId || `#${(order.id || '').slice(0,8)}`}</p>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${STATUS_COLORS[order.status] || STATUS_COLORS.new}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                        {order.riderName && (
                          <span className="text-[9px] text-indigo-600 dark:text-indigo-400 font-bold">🛵 {order.riderName}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1 text-[10px] text-faint">
                        <span>👤 {order.customerName}</span>
                        <span>🏪 {order.shopName}</span>
                        <span>📦 {order.items?.length || 0} items</span>
                        <span>💳 {(order.paymentMethod || 'cod').toUpperCase()}</span>
                      </div>
                      {order.deliveryAddress && (
                        <p className="text-[9px] text-faint mt-0.5 flex items-center gap-1">
                          <MapPin size={8} /> {order.deliveryAddress}
                        </p>
                      )}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-black text-accent">₹{order.totalAmount || order.total || 0}</p>
                      <p className="text-[9px] text-faint">{timeAgo(order.createdAt)}</p>
                    </div>
                  </div>
                </div>
              ))}
              {filteredOrders.length === 0 && (
                <div className="text-center py-12">
                  <Package size={36} className="text-faint mx-auto mb-2" />
                  <p className="text-sm text-muted">No orders match your filter</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ━━━━━━━━━━━━━ SHOPS TAB ━━━━━━━━━━━━━ */}
        {activeTab === 'shops' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-body">Registered Vendors ({vendors.length})</h2>
              <Link href="/admin/vendors" className="text-xs text-accent font-bold">Manage →</Link>
            </div>
            <div className="space-y-2">
              {vendors.map(vendor => (
                <div key={vendor.id} className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center">
                      <Store size={18} className="text-accent" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-body">{vendor.shopName || vendor.name || 'Unnamed'}</p>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                          vendor.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25' :
                          vendor.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/25' :
                          'bg-red-500/10 text-red-600 border-red-500/25'
                        }`}>
                          {vendor.status || 'pending'}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-faint">
                        <span>{vendor.ownerName}</span>
                        <span>📞 {vendor.phone}</span>
                        <span>📍 {vendor.city || vendor.area || '-'}</span>
                        <span>🏷️ {vendor.category || '-'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {vendor.status === 'pending' && (
                        <>
                          <button onClick={async () => {
                            await vendorService.update(vendor.id, { status: 'approved' });
                            toast.success(`✅ ${vendor.shopName} approved!`);
                          }} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">
                            Approve
                          </button>
                          <button onClick={async () => {
                            await vendorService.update(vendor.id, { status: 'rejected' });
                            toast.error(`❌ ${vendor.shopName} rejected`);
                          }} className="px-3 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg">
                            Reject
                          </button>
                        </>
                      )}
                      {vendor.status === 'approved' && (
                        <span className="text-[10px] text-emerald-600 font-bold">Active ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {vendors.length === 0 && (
                <div className="text-center py-12">
                  <Store size={36} className="text-faint mx-auto mb-2" />
                  <p className="text-sm text-muted">No vendors registered yet</p>
                </div>
              )}
            </div>
          </>
        )}

        {/* ━━━━━━━━━━━━━ RIDERS TAB ━━━━━━━━━━━━━ */}
        {activeTab === 'riders' && (
          <>
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-body">Registered Riders ({riders.length})</h2>
              <Link href="/admin/riders" className="text-xs text-accent font-bold">Manage →</Link>
            </div>
            <div className="space-y-2">
              {riders.map(rider => (
                <div key={rider.id} className="glass-card p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center">
                      <Bike size={18} className="text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-bold text-body">{rider.name || 'Unnamed'}</p>
                        <span className={`px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                          rider.status === 'approved' ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25' :
                          rider.status === 'pending' ? 'bg-amber-500/10 text-amber-600 border-amber-500/25' :
                          'bg-red-500/10 text-red-600 border-red-500/25'
                        }`}>
                          {rider.status || 'pending'}
                        </span>
                        {rider.isOnline && (
                          <span className="text-[9px] text-emerald-500 font-bold flex items-center gap-0.5">
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Online
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 text-[10px] text-faint">
                        <span>📞 {rider.phone}</span>
                        <span>🏍️ {rider.vehicleType || 'Bike'}</span>
                        <span>📍 {rider.area || rider.city || '-'}</span>
                      </div>
                    </div>
                    <div className="flex gap-1.5">
                      {rider.status === 'pending' && (
                        <>
                          <button onClick={async () => {
                            await riderService.update(rider.id, { status: 'approved' });
                            toast.success(`✅ ${rider.name} approved!`);
                          }} className="px-3 py-1.5 bg-emerald-500 text-white text-[10px] font-bold rounded-lg">
                            Approve
                          </button>
                          <button onClick={async () => {
                            await riderService.update(rider.id, { status: 'rejected' });
                            toast.error(`❌ ${rider.name} rejected`);
                          }} className="px-3 py-1.5 bg-red-500/10 text-red-500 text-[10px] font-bold rounded-lg">
                            Reject
                          </button>
                        </>
                      )}
                      {rider.status === 'approved' && (
                        <span className="text-[10px] text-emerald-600 font-bold">Active ✓</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
              {riders.length === 0 && (
                <div className="text-center py-12">
                  <Bike size={36} className="text-faint mx-auto mb-2" />
                  <p className="text-sm text-muted">No riders registered yet</p>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* ━━━━━ ORDER DETAIL MODAL ━━━━━ */}
      {selectedOrder && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="relative glass-card rounded-3xl w-full max-w-md p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-black text-body">{selectedOrder.orderId || `#${selectedOrder.id?.slice(0,8)}`}</h2>
              <button onClick={() => setSelectedOrder(null)} className="text-faint hover:text-body text-lg">✕</button>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
              <span className={`px-3 py-1 text-xs font-bold rounded-full border ${STATUS_COLORS[selectedOrder.status]}`}>
                {STATUS_LABELS[selectedOrder.status] || selectedOrder.status}
              </span>
              <span className="text-[10px] text-faint">{timeAgo(selectedOrder.createdAt)}</span>
            </div>

            {/* Customer + Shop */}
            <div className="space-y-2">
              <div className="p-3 surface rounded-xl">
                <p className="text-[10px] text-faint">Customer</p>
                <p className="text-sm font-bold text-body">{selectedOrder.customerName}</p>
                <p className="text-xs text-muted">{selectedOrder.customerPhone}</p>
              </div>
              <div className="p-3 surface rounded-xl">
                <p className="text-[10px] text-faint">Shop</p>
                <p className="text-sm font-bold text-body">{selectedOrder.shopName}</p>
                <p className="text-xs text-muted">ID: {selectedOrder.shopId || selectedOrder.vendorId}</p>
              </div>
              {selectedOrder.riderName && (
                <div className="p-3 surface rounded-xl">
                  <p className="text-[10px] text-faint">Rider</p>
                  <p className="text-sm font-bold text-body">🛵 {selectedOrder.riderName}</p>
                  <p className="text-xs text-muted">{selectedOrder.riderPhone}</p>
                </div>
              )}
            </div>

            {/* Items */}
            <div className="p-3 surface rounded-xl">
              <p className="text-[10px] text-faint mb-2">Items ({selectedOrder.items?.length || 0})</p>
              {selectedOrder.items?.map((item: any, i: number) => (
                <div key={i} className="flex justify-between text-xs py-0.5">
                  <span className="text-secondary">{item.name} × {item.quantity}</span>
                  <span className="text-body font-bold">₹{item.price * item.quantity}</span>
                </div>
              ))}
              <div className="border-t border-subtle mt-2 pt-2 flex justify-between">
                <span className="text-xs font-bold text-body">Total</span>
                <span className="text-sm font-black text-accent">₹{selectedOrder.totalAmount || selectedOrder.total}</span>
              </div>
            </div>

            {/* Delivery Address */}
            {selectedOrder.deliveryAddress && (
              <div className="p-3 surface rounded-xl">
                <p className="text-[10px] text-faint">Delivery Address</p>
                <p className="text-xs text-body mt-0.5">{selectedOrder.deliveryAddress || selectedOrder.address?.fullAddress}</p>
              </div>
            )}

            {/* Payment + OTP */}
            <div className="flex gap-2">
              <div className="flex-1 p-3 surface rounded-xl">
                <p className="text-[10px] text-faint">Payment</p>
                <p className="text-xs font-bold text-body uppercase">{selectedOrder.paymentMethod || 'COD'}</p>
              </div>
              {selectedOrder.deliveryOtp && (
                <div className="flex-1 p-3 surface rounded-xl">
                  <p className="text-[10px] text-faint">Delivery OTP</p>
                  <p className="text-sm font-black text-accent tracking-widest">{selectedOrder.deliveryOtp}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ Stat Card Component ━━━
function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string | number; color: string }) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    purple: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    orange: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
  };
  return (
    <div className="glass-card p-3 text-center">
      <div className={`w-9 h-9 mx-auto rounded-lg flex items-center justify-center ${colorMap[color]?.split(' ')[0] || 'bg-blue-500/10'}`}>
        <Icon size={16} className={colorMap[color]?.split(' ').slice(1).join(' ') || 'text-blue-600'} />
      </div>
      <p className="text-lg font-black text-body mt-1.5">{value}</p>
      <p className="text-[9px] text-faint">{label}</p>
    </div>
  );
}
