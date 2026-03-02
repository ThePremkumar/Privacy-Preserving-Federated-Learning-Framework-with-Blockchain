'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Activity, 
  ShieldCheck, 
  Database, 
  BrainCircuit, 
  Globe, 
  ChevronRight,
  TrendingUp,
  Lock,
  Hospital,
  ArrowRight,
  User,
  Key,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Simulate login logic
    setTimeout(() => {
      if (username === 'superadmin' && password === 'admin123') {
        // Success
        router.push('/dashboard');
      } else if (!username || !password) {
        setError('Please enter both ID and Passcode.');
      } else {
        setError('Invalid credentials. Access denied.');
      }
      setIsLoading(false);
    }, 1200);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="mx-auto flex w-full max-w-[1240px] flex-col-reverse items-center justify-center gap-12 lg:flex-row">
        {/* Left Side: Branding and Info */}
        <div className="hidden flex-col items-start gap-8 lg:flex w-1/2">
          <div className="flex items-center gap-2">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-xl shadow-blue-200">
              <BrainCircuit size={28} />
            </div>
            <span className="text-3xl font-black tracking-tighter text-slate-900">
              Health<span className="text-blue-600">Connect</span>
            </span>
          </div>
          <div className="space-y-6">
            <h2 className="text-5xl font-black leading-tight text-slate-900">
              Clinical Excellence, <br />
              <span className="text-blue-600 underline decoration-blue-200 underline-offset-8">Data Privacy.</span>
            </h2>
            <p className="max-w-md text-xl leading-relaxed text-slate-600">
              Access the most advanced federated learning platform designed specifically for the global healthcare ecosystem.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-x-8 gap-y-6 mt-4">
             {[
               { icon: ShieldCheck, label: 'HIPAA Compliant' },
               { icon: Lock, label: 'E2E Encryption' },
               { icon: Database, label: 'Audit Trail' },
               { icon: Globe, label: 'Decentralized' }
             ].map((item, i) => (
               <div key={i} className="flex items-center gap-3 text-slate-900 font-bold">
                 <div className="rounded-lg bg-blue-50 p-2 text-blue-600">
                   <item.icon size={20} />
                 </div>
                 <span>{item.label}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="w-full max-w-md">
          <Card className="border-none shadow-2xl shadow-slate-200 p-2">
            <CardHeader className="space-y-2 p-6">
              <div className="flex items-center justify-center lg:hidden mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-600 text-white">
                  <BrainCircuit size={24} />
                </div>
              </div>
              <CardTitle className="text-3xl font-black text-center text-slate-900">Portal Access</CardTitle>
              <CardDescription className="text-center text-base">Enter your specialized credentials to proceed.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6 p-6">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-900 uppercase tracking-widest px-1">Specialist ID</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="text" 
                        placeholder="e.g. superadmin" 
                        className="h-14 w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 pl-11 pr-4 font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                      <label className="text-sm font-bold text-slate-900 uppercase tracking-widest">Secure Passcode</label>
                      <Link href="#" className="text-xs font-bold text-blue-600 hover:underline px-1">Forgot Access?</Link>
                    </div>
                    <div className="relative">
                      <Key className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                      <input 
                        type="password" 
                        placeholder="••••••••••••" 
                        className="h-14 w-full rounded-xl border-2 border-slate-100 bg-slate-50/50 pl-11 pr-4 font-semibold text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none transition-all"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <div className="flex items-center gap-2 rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600 animate-in fade-in slide-in-from-top-2">
                    <AlertCircle size={18} />
                    {error}
                  </div>
                )}

                <Button type="submit" size="lg" className="h-14 w-full text-lg shadow-xl shadow-blue-200" isLoading={isLoading}>
                  Verify Identity
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-6 rounded-b-2xl">
              <p className="text-center text-sm font-semibold text-slate-500">
                Unauthorized access is strictly monitored. <br />
                Need institutional registration? <Link href="#" className="font-extrabold text-blue-600 hover:underline">Request Access</Link>
              </p>
            </CardFooter>
          </Card>
          <div className="mt-8 flex items-center justify-center gap-2">
            <Link href="/" className="text-sm font-bold text-slate-500 hover:text-blue-600 flex items-center gap-1 transition-colors">
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
