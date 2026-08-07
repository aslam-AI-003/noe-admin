'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useStore, DemoOrder } from '@/store/useStore';
import toast from 'react-hot-toast';
import {
  BarChart3, Package, Store, Bike, Clock, CheckCircle2, XCircle, Wallet,
  Inbox, Zap, RefreshCw, Plus, ClipboardList, UserRound,
} from 'lucide-react';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN DASHBOARD — Shows real orders, can manage everything
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const STATUS_COLORS: Record<string, string> = {
  placed: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25',
  confirmed: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/25',
  preparing: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
  ready: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25',
  picked_up: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/25',
  on_the_way: 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/25',
  delivered: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
  cancelled: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/25',
};

type Tab = 'overview' | 'orders' | 'shops' | 'riders';

export default function AdminDashboard() {
  const { demoOrders, updateDemoOrderStatus } = useStore();
  const [activeTab, setActiveTab] = useState<Tab>('overview');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  if (!mounted) return <div className="min-h-screen app-bg" />;

  const stats = {
    totalOrders: demoOrders.length,
    activeOrders: demoOrders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length,
    delivered: demoOrders.filter(o => o.status === 'delivered').length,
    cancelled: demoOrders.filter(o => o.status === 'cancelled').length,
    revenue: demoOrders.filter(o => o.status === 'delivered').reduce((s, o) => s + o.total, 0),
  };

  const timeAgo = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    return `${Math.floor(mins / 60)}h ago`;
  };

  const navItems = [
    { id: 'overview' as Tab, label: 'Overview', icon: BarChart3 },
    { id: 'orders' as Tab, label: 'Orders', icon: Package, badge: stats.activeOrders },
    { id: 'shops' as Tab, label: 'Shops', icon: Store },
    { id: 'riders' as Tab, label: 'Riders', icon: Bike },
  ];

  const quickLinks = [
    { label: 'Vendor Management', href: '/admin/vendors', icon: Store },
    { label: 'Rider Management', href: '/admin/riders', icon: Bike },
    { label: 'Customer App', href: '/', icon: Store },
    { label: 'Shop Dashboard', href: '/dashboard/shop', icon: Store },
    { label: 'Rider Dashboard', href: '/dashboard/rider', icon: Bike },
    { label: 'Orders Page', href: '/orders', icon: ClipboardList },
  ];

  return (
    <div className="min-h-screen app-bg flex">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-56 border-r border-subtle flex-col fixed h-screen bg-section">
        <div className="p-5 border-b border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center">
              <Bike size={16} className="text-white" />
            </div>
            <div>
              <h1 className="text-xs font-black text-body">NammaOoru</h1>
              <p className="text-[10px] text-accent font-bold">Admin Panel</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === item.id
                  ? 'bg-orange-500/10 text-accent border border-orange-500/20'
                  : 'text-faint hover:bg-[var(--card-hover)] hover:text-secondary'
              }`}>
              <item.icon size={14} />
              {item.label}
              {item.badge != null && item.badge > 0 && (
                <span className="ml-auto w-5 h-5 bg-orange-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {item.badge}
                </span>
              )}
            </button>
          ))}

          <div className="pt-4 mt-4 border-t border-subtle">
            <p className="text-[10px] text-faint font-bold px-3 mb-2">QUICK LINKS</p>
            {quickLinks.map(link => (
              <Link key={link.href} href={link.href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-faint hover:text-secondary hover:bg-[var(--card-hover)] transition-all">
                <link.icon size={13} />
                {link.label}
              </Link>
            ))}
          </div>
        </nav>

        <div className="p-4 border-t border-subtle">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
              <UserRound size={15} className="text-accent" />
            </div>
            <div>
              <p className="text-xs font-bold text-body">Admin</p>
              <p className="text-[10px] text-faint">admin@noe.in</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-56 min-h-screen pb-20">
        {/* Mobile header */}
        <header className="sticky top-0 z-50 header-glass lg:hidden">
          <div className="px-4 py-3 flex items-center justify-between">
            <h1 className="text-sm font-black text-body flex items-center gap-1.5"><Bike size={15} className="text-accent" /> Admin Panel</h1>
            <div className="flex gap-2">
              {navItems.map(item => (
                <button key={item.id} onClick={() => setActiveTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold ${
                    activeTab === item.id ? 'bg-orange-500 text-white' : 'text-faint'
                  }`}>
                  <item.icon size={13} />
                </button>
              ))}
            </div>
          </div>
        </header>

        <div className="max-w-6xl mx-auto p-4 lg:p-6 space-y-6">

          {/* ═══ OVERVIEW TAB ═══ */}
          {activeTab === 'overview' && (
            <>
              <div>
                <h2 className="text-xl font-black text-body">Dashboard</h2>
                <p className="text-sm text-faint">Real-time demo data from your test orders</p>
              </div>

              {/* Stats grid */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                {[
                  { label: 'Total Orders', value: stats.totalOrders, icon: Package, color: 'text-body' },
                  { label: 'Active', value: stats.activeOrders, icon: Clock, color: 'text-accent' },
                  { label: 'Delivered', value: stats.delivered, icon: CheckCircle2, color: 'text-emerald-600 dark:text-emerald-400' },
                  { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-red-600 dark:text-red-400' },
                  { label: 'Revenue', value: `₹${stats.revenue}`, icon: Wallet, color: 'text-emerald-600 dark:text-emerald-400' },
                ].map((s, i) => (
                  <div key={i} className="glass-card p-4 text-center">
                    <s.icon size={20} className={`mx-auto mb-1 ${s.color}`} />
                    <div className={`text-xl font-black ${s.color}`}>{s.value}</div>
                    <div className="text-[10px] text-faint mt-0.5">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Recent Orders + Quick Actions */}
              <div className="grid lg:grid-cols-3 gap-4">
                {/* Recent Orders */}
                <div className="lg:col-span-2 glass-card p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-body flex items-center gap-1.5"><Package size={14} className="text-accent" /> Recent Orders</h3>
                    <button onClick={() => setActiveTab('orders')} className="text-xs text-accent font-bold">
                      View All →
                    </button>
                  </div>

                  {demoOrders.length === 0 ? (
                    <div className="text-center py-8">
                      <Inbox size={32} className="text-faint mx-auto mb-2" />
                      <p className="text-xs text-faint">No orders yet. Place a test order!</p>
                      <Link href="/shops" className="text-xs text-accent font-bold mt-2 inline-block">
                        Go to Customer App →
                      </Link>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {demoOrders.slice(0, 8).map(order => (
                        <div key={order.id} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--card-hover)] transition-colors">
                          <div className="w-8 h-8 rounded-lg overflow-hidden relative flex-shrink-0">
                            <Image src={order.shopIcon || '/images/categories/groceries.jpg'} alt={order.shopName} fill sizes="32px" className="object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-body">#{order.id}</p>
                            <p className="text-[10px] text-faint truncate">{order.customerName} → {order.shopName}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs font-bold text-body">₹{order.total}</p>
                            <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold border ${STATUS_COLORS[order.status] || ''}`}>
                              {order.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-faint">{timeAgo(order.createdAt)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Actions */}
                <div className="glass-card p-4">
                  <h3 className="text-sm font-black text-body mb-4 flex items-center gap-1.5"><Zap size={14} className="text-accent" /> Quick Actions</h3>
                  <div className="space-y-2">
                    {[
                      { href: '/shops', icon: Store, title: 'Place Test Order', sub: 'As customer' },
                      { href: '/dashboard/shop', icon: Store, title: 'Shop Dashboard', sub: 'Accept/Prepare orders' },
                      { href: '/dashboard/rider', icon: Bike, title: 'Rider Dashboard', sub: 'Deliver orders' },
                      { href: '/orders', icon: ClipboardList, title: 'Customer Orders', sub: 'Track status' },
                    ].map(link => (
                      <Link key={link.href} href={link.href} className="flex items-center gap-3 p-3 rounded-xl surface surface-hover transition-colors">
                        <link.icon size={17} className="text-secondary" />
                        <div>
                          <p className="text-xs font-bold text-body">{link.title}</p>
                          <p className="text-[10px] text-faint">{link.sub}</p>
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Flow guide */}
              <div className="glass-sm p-4">
                <h3 className="text-xs font-black text-body mb-3 flex items-center gap-1.5"><RefreshCw size={13} className="text-accent" /> Demo Order Flow</h3>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { step: '1', label: 'Customer Orders', page: '/shops' },
                    { step: '2', label: 'Vendor Accepts', page: '/dashboard/shop' },
                    { step: '3', label: 'Vendor Prepares', page: '/dashboard/shop' },
                    { step: '4', label: 'Marked Ready', page: '/dashboard/shop' },
                    { step: '5', label: 'Rider Picks Up', page: '/dashboard/rider' },
                    { step: '6', label: 'Delivered', page: '/dashboard/rider' },
                  ].map((s, i) => (
                    <React.Fragment key={i}>
                      <Link href={s.page} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg surface hover:bg-orange-500/10 transition-colors group">
                        <span className="w-5 h-5 bg-orange-500/15 rounded-full flex items-center justify-center text-[9px] font-black text-accent">{s.step}</span>
                        <span className="text-[10px] text-muted group-hover:text-accent font-semibold">{s.label}</span>
                      </Link>
                      {i < 5 && <span className="text-faint">→</span>}
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ═══ ORDERS TAB ═══ */}
          {activeTab === 'orders' && (
            <>
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-black text-body">All Orders</h2>
                  <p className="text-sm text-faint">{demoOrders.length} total orders</p>
                </div>
                <Link href="/shops" className="btn-primary text-xs px-4 py-2 flex items-center gap-1"><Plus size={13} /> New Test Order</Link>
              </div>

              {demoOrders.length === 0 ? (
                <div className="glass-card p-12 text-center">
                  <Inbox size={40} className="text-faint mx-auto mb-3" />
                  <p className="text-sm font-bold text-muted">No orders yet</p>
                  <p className="text-xs text-faint mt-1">Place a test order from the customer app</p>
                  <Link href="/shops" className="btn-primary text-xs px-4 py-2 mt-4 inline-flex">
                    Browse Shops →
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  {demoOrders.map(order => (
                    <div key={order.id} className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden relative flex-shrink-0">
                          <Image src={order.shopIcon || '/images/categories/groceries.jpg'} alt={order.shopName} fill sizes="40px" className="object-cover" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="text-sm font-black text-body">#{order.id}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${STATUS_COLORS[order.status] || ''}`}>
                              {order.status.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-xs text-muted">{order.customerName} ({order.customerPhone}) → {order.shopName}</p>
                          <p className="text-[10px] text-faint mt-0.5">
                            {order.items.map(i => `${i.name}×${i.quantity}`).join(', ')} • {order.paymentMethod.toUpperCase()}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-black text-accent">₹{order.total}</p>
                          <p className="text-[10px] text-faint">{timeAgo(order.createdAt)}</p>
                        </div>
                      </div>
                      {order.riderName && (
                        <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 flex items-center gap-1"><Bike size={11} /> Rider: {order.riderName}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* ═══ SHOPS TAB ═══ */}
          {activeTab === 'shops' && (
            <>
              <div>
                <h2 className="text-xl font-black text-body">Shop Management</h2>
                <p className="text-sm text-faint">Manage vendor dashboards</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link href="/dashboard/shop" className="glass-card p-5 hover:border-orange-400/25 transition-all group">
                  <Store size={28} className="text-accent mb-2" />
                  <p className="text-sm font-bold text-body group-hover:text-accent">Open Shop Dashboard</p>
                  <p className="text-xs text-faint mt-1">Accept orders, prepare items, mark ready</p>
                </Link>
                <Link href="/shop/register" className="glass-card p-5 hover:border-orange-400/25 transition-all group">
                  <Plus size={28} className="text-accent mb-2" />
                  <p className="text-sm font-bold text-body group-hover:text-accent">Register New Shop</p>
                  <p className="text-xs text-faint mt-1">Add a new vendor to the platform</p>
                </Link>
              </div>
            </>
          )}

          {/* ═══ RIDERS TAB ═══ */}
          {activeTab === 'riders' && (
            <>
              <div>
                <h2 className="text-xl font-black text-body">Rider Management</h2>
                <p className="text-sm text-faint">Manage delivery partners</p>
              </div>
              <div className="grid sm:grid-cols-2 gap-3">
                <Link href="/dashboard/rider" className="glass-card p-5 hover:border-orange-400/25 transition-all group">
                  <Bike size={28} className="text-accent mb-2" />
                  <p className="text-sm font-bold text-body group-hover:text-accent">Open Rider Dashboard</p>
                  <p className="text-xs text-faint mt-1">Pick up and deliver orders</p>
                </Link>
                <Link href="/rider/register" className="glass-card p-5 hover:border-orange-400/25 transition-all group">
                  <Plus size={28} className="text-accent mb-2" />
                  <p className="text-sm font-bold text-body group-hover:text-accent">Register New Rider</p>
                  <p className="text-xs text-faint mt-1">Add a new delivery partner</p>
                </Link>
              </div>
            </>
          )}

        </div>
      </main>
    </div>
  );
}
