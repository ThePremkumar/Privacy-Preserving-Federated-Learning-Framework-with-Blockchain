import React from 'react';
import Link from 'next/link';
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
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
              <BrainCircuit size={24} />
            </div>
            <span className="text-xl font-extrabold tracking-tight text-slate-900">
              Health<span className="text-blue-600">Connect</span>
            </span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <Link href="#features" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Features</Link>
            <Link href="#how-it-works" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">How it Works</Link>
            <Link href="#security" className="text-sm font-semibold text-slate-500 hover:text-blue-600 transition-colors">Security</Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login">
              <Button variant="ghost" className="hidden sm:inline-flex">Sign In</Button>
            </Link>
            <Link href="/login">
              <Button variant="primary">Access Platform</Button>
            </Link>
          </div>
        </div>
      </nav>

      <main className="flex-1 pt-16">
        {/* Hero Section */}
        <section className="relative overflow-hidden px-6 py-24 sm:py-32 lg:px-8">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(45%_45%_at_50%_50%,#eff6ff_0,white_100%)] opacity-70" />
          <div className="mx-auto max-w-2xl text-center">
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50/50 px-4 py-1.5 text-xs font-bold text-blue-700">
              <Globe size={14} className="animate-spin-slow" />
              <span>The Next Generation of Privacy-Preserving Healthcare AI</span>
            </div>
            <h1 className="text-4xl font-black tracking-tight text-slate-900 sm:text-6xl leading-[1.1]">
              Unlock Medical Insights with <span className="text-blue-600">Federated Learning</span>
            </h1>
            <p className="mt-8 text-lg leading-8 text-slate-600">
              Train advanced machine learning models across multiple hospitals without ever sharing raw patient data. Secure, compliant, and decentralized.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
              <Link href="/login">
                <Button size="lg" className="h-14 px-8 shadow-xl shadow-blue-200">
                  Get Started Now <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="h-14 px-8">
                  Learn How it Works
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Stats Section */}
          <div className="mx-auto mt-20 max-w-7xl px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-px bg-slate-100/50 sm:grid-cols-2 lg:grid-cols-4 rounded-2xl overflow-hidden border border-slate-100">
              {[
                { label: 'Participating Hospitals', value: '100+', icon: Hospital },
                { label: 'Patient Privacy', value: '100%', icon: ShieldCheck },
                { label: 'Model Accuracy', value: '94.8%', icon: BrainCircuit },
                { label: 'Global Rounds', value: '12.4k', icon: TrendingUp },
              ].map((stat, i) => (
                <div key={i} className="bg-white p-8 sm:p-10 flex flex-col items-center justify-center">
                  <div className="mb-4 rounded-full bg-blue-50 p-3 text-blue-600">
                    <stat.icon size={24} />
                  </div>
                  <dt className="text-sm font-medium leading-6 text-slate-500 uppercase tracking-widest">{stat.label}</dt>
                  <dd className="mt-2 text-3xl font-black tracking-tight text-slate-900">{stat.value}</dd>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="py-24 sm:py-32 bg-slate-50">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-bold uppercase tracking-widest text-blue-600">Platform Capabilities</h2>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Everything you need for Enterprise Medical AI</p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: 'Federated Learning Server',
                    description: 'Secure aggregation of model weights using FedAvg with differential privacy guarantees.',
                    icon: BrainCircuit,
                  },
                  {
                    name: 'Blockchain Audit Trail',
                    description: 'Every training round and model update is immutably recorded for complete auditability.',
                    icon: ShieldCheck,
                  },
                  {
                    name: 'Clinical Diagnostics',
                    description: 'Real-time disease prediction and anomaly detection powered by enterprise-grade LSTM models.',
                    icon: Activity,
                  },
                  {
                    name: 'Granular RBAC',
                    description: 'Enterprise-grade role-based access control for super admins, hospital admins, and doctors.',
                    icon: Lock,
                  },
                  {
                    name: 'Data Privacy',
                    description: 'Raw data never leaves the hospital firewall. Only encrypted gradients are shared.',
                    icon: ShieldCheck,
                  },
                  {
                    name: 'Distributed Analytics',
                    description: 'Comprehensive dashboards for multi-hospital performance metrics and training history.',
                    icon: Database,
                  },
                ].map((feature) => (
                  <Card key={feature.name} className="flex flex-col border-none shadow-none bg-transparent p-0">
                    <CardHeader className="p-0">
                      <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-200">
                        <feature.icon size={24} />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">{feature.name}</CardTitle>
                      <CardDescription className="mt-4 text-base leading-7 text-slate-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </dl>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-100 bg-white py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white">
                <BrainCircuit size={18} />
              </div>
              <span className="text-lg font-black tracking-tight text-slate-900">HealthConnect</span>
            </div>
            <p className="text-sm font-medium text-slate-500">
              © 2024 Federated Learning Healthcare Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-blue-600">Privacy Policy</Link>
              <Link href="#" className="text-sm font-semibold text-slate-500 hover:text-blue-600">Compliance</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
