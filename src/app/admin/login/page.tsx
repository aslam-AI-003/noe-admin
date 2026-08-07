'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, Loader2, Zap } from 'lucide-react';
import toast from 'react-hot-toast';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ADMIN LOGIN — Premium dark themed login
// Credentials: admin@nammaooru.in / admin123
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const ADMIN_EMAIL = 'admin@nammaooru.in';
const ADMIN_PASSWORD = 'admin123';

export default function AdminLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  useEffect(() => {
    setMounted(true);
    // Check if already logged in
    const adminToken = localStorage.getItem('noe-admin-token');
    if (adminToken === 'authenticated') {
      router.replace('/admin');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill all fields');
      return;
    }

    setLoading(true);
    // Simulate network delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 1200));

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      localStorage.setItem('noe-admin-token', 'authenticated');
      if (rememberMe) {
        localStorage.setItem('noe-admin-email', email);
      }
      toast.success('Welcome, Admin! 🎉');
      router.replace('/admin');
    } else {
      toast.error('Invalid credentials');
      setLoading(false);
    }
  };

  if (!mounted) return <div className="min-h-screen bg-[#0a0a1a]" />;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 30%, #0d1b2a 70%, #0a0a1a 100%)' }}>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-72 h-72 bg-purple-500/8 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-500/6 rounded-full blur-3xl" style={{ animation: 'pulse 4s ease-in-out infinite alternate' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/3 rounded-full blur-3xl" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
          backgroundSize: '60px 60px'
        }} />
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">
        {/* Logo + Branding */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-orange-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-purple-500/20 rotate-3 hover:rotate-0 transition-transform">
            <ShieldCheck size={28} className="text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tight">NammaOoru</h1>
          <p className="text-sm text-gray-400 mt-1 font-medium">Admin Control Panel</p>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl bg-white/[0.03] border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@nammaooru.in"
                  className="w-full pl-11 pr-4 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3.5 bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-purple-500/50 focus:bg-white/[0.06] transition-all"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-white/20 bg-white/5 text-purple-500 focus:ring-purple-500/30" />
                <span className="text-xs text-gray-400">Remember me</span>
              </label>
              <span className="text-xs text-purple-400 font-medium cursor-pointer hover:text-purple-300">
                Forgot password?
              </span>
            </div>

            {/* Login Button */}
            <button type="submit" disabled={loading}
              className="w-full py-4 rounded-xl font-bold text-white text-sm relative overflow-hidden group disabled:opacity-60 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 50%, #f97316 100%)' }}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <Zap size={16} />
                    Login to Admin Panel
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Demo credentials hint */}
          <div className="mt-6 p-3 bg-purple-500/5 border border-purple-500/15 rounded-xl">
            <p className="text-[10px] text-purple-300/60 text-center font-medium">
              Demo: admin@nammaooru.in / admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-[10px] text-gray-600 mt-6">
          © 2024 NammaOoru Express • Admin Panel v2.0
        </p>
      </div>
    </div>
  );
}
