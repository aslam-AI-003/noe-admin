'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// NOX ADMIN LOGIN — Brand themed (Green + Dark)
// Brand: #0E9F6E (green), #111111 (dark), #C9A227 (gold)
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

  if (!mounted) return <div className="min-h-screen bg-[#111111]" />;

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4 bg-[#111111]">
      
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Gradient glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#0E9F6E]/8 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-[#0E9F6E]/5 rounded-full blur-[100px]" />
        
        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(14,159,110,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(14,159,110,0.3) 1px, transparent 1px)',
          backgroundSize: '50px 50px'
        }} />

        {/* Road-like curved line */}
        <svg className="absolute bottom-0 left-0 w-full h-40 opacity-[0.04]" viewBox="0 0 800 150">
          <path d="M0,100 C200,50 300,130 500,80 C650,45 750,100 800,70" stroke="#0E9F6E" strokeWidth="3" fill="none" />
          <path d="M0,120 C200,70 300,150 500,100 C650,65 750,120 800,90" stroke="#0E9F6E" strokeWidth="2" fill="none" />
        </svg>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-sm">
        {/* Logo + Brand */}
        <div className="text-center mb-8">
          {/* NOX Logo - App Icon style */}
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl flex items-center justify-center relative overflow-hidden shadow-2xl shadow-[#0E9F6E]/20"
            style={{ background: 'linear-gradient(145deg, #111111 0%, #1a1a1a 100%)', border: '2px solid rgba(14,159,110,0.3)' }}>
            <div className="text-center">
              <MapPin size={24} className="text-[#0E9F6E] mx-auto mb-0.5" />
              <span className="text-white text-[10px] font-black tracking-wider">NOX</span>
            </div>
          </div>
          
          {/* Brand name */}
          <h1 className="text-3xl font-black text-white tracking-tight" style={{ fontFamily: 'Poppins, sans-serif' }}>
            N<span className="text-[#0E9F6E]">O</span>X
          </h1>
          <p className="text-xs text-gray-500 mt-1 font-medium uppercase tracking-[0.2em]">Namma Ooru Express</p>
          <div className="flex items-center justify-center gap-2 mt-2">
            <span className="w-8 h-[1px] bg-[#C9A227]/50" />
            <span className="text-[10px] text-[#C9A227] font-bold tracking-[0.15em]">ADMIN PANEL</span>
            <span className="w-8 h-[1px] bg-[#C9A227]/50" />
          </div>
        </div>

        {/* Card */}
        <div className="backdrop-blur-xl rounded-2xl p-7 shadow-2xl"
          style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(14,159,110,0.15)' }}>
          
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Email</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@nammaooru.in"
                  className="w-full pl-10 pr-4 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#0E9F6E]/50 focus:ring-1 focus:ring-[#0E9F6E]/20 transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-11 py-3 bg-white/[0.03] border border-white/[0.06] rounded-xl text-sm text-white placeholder:text-gray-700 focus:outline-none focus:border-[#0E9F6E]/50 focus:ring-1 focus:ring-[#0E9F6E]/20 transition-all"
                  autoComplete="current-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-600 hover:text-gray-400 transition-colors">
                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Remember Me */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)}
                  className="w-3.5 h-3.5 rounded border-gray-700 bg-transparent text-[#0E9F6E] focus:ring-[#0E9F6E]/30" />
                <span className="text-[11px] text-gray-500">Remember me</span>
              </label>
            </div>

            {/* Login Button */}
            <button type="submit" disabled={loading}
              className="w-full py-3.5 rounded-xl font-bold text-white text-sm relative overflow-hidden group disabled:opacity-60 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0E9F6E 0%, #0a7b55 100%)' }}>
              <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity" />
              <span className="relative flex items-center justify-center gap-2">
                {loading ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    <MapPin size={15} />
                    Login to Admin
                  </>
                )}
              </span>
            </button>
          </form>

          {/* Demo credentials */}
          <div className="mt-5 p-2.5 rounded-lg" style={{ background: 'rgba(14,159,110,0.05)', border: '1px solid rgba(14,159,110,0.1)' }}>
            <p className="text-[10px] text-[#0E9F6E]/60 text-center font-medium">
              Demo: admin@nammaooru.in / admin123
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[10px] text-gray-700">உங்க ஊரு... உங்க சேவை</p>
          <p className="text-[9px] text-gray-800">© 2024 NOX — Namma Ooru Express Delivery</p>
        </div>
      </div>
    </div>
  );
}
