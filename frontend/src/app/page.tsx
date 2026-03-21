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
  ArrowRight,
  Server,
  Cpu,
  Layers,
  Zap,
  RefreshCw,
  UserCheck,
  FileSearch,
  Key
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

        <section id="features" className="relative overflow-hidden py-24 sm:py-32 bg-slate-50">
          <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-bold uppercase tracking-widest text-blue-600">Platform Capabilities</h2>
              <p className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">Everything you need for Enterprise Medical AI</p>
              <p className="mt-4 text-slate-600">Our framework combines cutting-edge machine learning with blockchain integrity to redefine medical research.</p>
            </div>
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-12 lg:max-w-none lg:grid-cols-3">
                {[
                  {
                    name: 'Federated Learning Server',
                    description: 'Secure aggregation of weight updates using FedAvg with advanced differential privacy guarantees to protect patient anonymity.',
                    icon: Server,
                  },
                  {
                    name: 'Blockchain Audit Trail',
                    description: 'Every training round and model update is immutably recorded on a private blockchain for complete clinical auditability.',
                    icon: Layers,
                  },
                  {
                    name: 'Real-time Diagnostics',
                    description: 'Deploy enterprise-grade LSTM/CNN models for real-time disease prediction and anomaly detection directly in hospitals.',
                    icon: Zap,
                  },
                  {
                    name: 'Granular RBAC System',
                    description: 'Multi-layer role-based access control ensuring Super Admins, Hospital Admins, and Doctors have precise permissions.',
                    icon: UserCheck,
                  },
                  {
                    name: 'Privacy-First Architecture',
                    description: 'Raw clinical data never leaves the hospital firewall. Only encrypted, low-entropy model gradients are shared over the network.',
                    icon: ShieldCheck,
                  },
                  {
                    name: 'Collaborative Insights',
                    description: 'Benefit from global medical knowledge while maintaining localized data sovereignty through our decentralized analytics dashboard.',
                    icon: Database,
                  },
                ].map((feature) => (
                  <Card key={feature.name} className="group relative flex flex-col border-none shadow-none bg-white p-8 rounded-3xl transition-all hover:translate-y-[-4px] hover:shadow-xl hover:shadow-blue-900/5">
                    <CardHeader className="p-0">
                      <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-200 group-hover:scale-110 transition-transform">
                        <feature.icon size={26} />
                      </div>
                      <CardTitle className="text-xl font-bold text-slate-900">{feature.name}</CardTitle>
                      <CardDescription className="mt-4 text-base leading-relaxed text-slate-600">
                        {feature.description}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                ))}
              </dl>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section id="how-it-works" className="py-24 sm:py-32 bg-white overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
              <div className="lg:col-span-5">
                <h2 className="text-base font-bold uppercase tracking-widest text-blue-600">The Workflow</h2>
                <h1 className="mt-4 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl">How decentralized AI is built.</h1>
                <p className="mt-6 text-lg text-slate-600">Our multi-stage process ensures data stays local while insights go global. A perfect balance of security and intelligence.</p>
                
                <div className="mt-10 space-y-8">
                  {[
                    { title: 'Local Model Initialization', desc: 'Each hospital node initializes a local model using their unique clinical datasets.', icon: Cpu },
                    { title: 'Privacy-Preserving Training', desc: 'Models are trained securely behind the hospital\'s firewall using local patient data.', icon: Lock },
                    { title: 'Weight Aggregation', desc: 'Encrypted weights are sent to the central server and aggregated into a Global Model.', icon: RefreshCw },
                  ].map((step, idx) => (
                    <div key={idx} className="flex gap-4">
                      <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-blue-600 font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900">{step.title}</h4>
                        <p className="text-sm text-slate-500 mt-1">{step.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-16 lg:mt-0 lg:col-span-7 relative">
                <div className="relative rounded-3xl overflow-hidden bg-slate-100 p-8 border border-slate-200 shadow-2xl">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-blue-600">
                        <Hospital size={18} />
                        <span className="text-xs font-bold uppercase tracking-tighter">Hospital Node A</span>
                      </div>
                      <div className="h-2 w-full bg-blue-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-600 w-3/4 animate-pulse"></div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono italic">Training local LSTM model...</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-3">
                      <div className="flex items-center gap-2 text-emerald-600">
                        <Hospital size={18} />
                        <span className="text-xs font-bold uppercase tracking-tighter">Hospital Node B</span>
                      </div>
                      <div className="h-2 w-full bg-emerald-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-600 w-1/2 animate-pulse"></div>
                      </div>
                      <p className="text-[10px] text-slate-400 font-mono italic">Synchronizing weights...</p>
                    </div>
                    <div className="col-span-2 bg-slate-900 p-6 rounded-2xl shadow-xl space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-blue-400">
                          <Server size={18} />
                          <span className="text-xs font-bold uppercase">Central Federated Aggregator</span>
                        </div>
                        <div className="flex gap-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-red-400 animate-ping"></div>
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                          <span>AGGREGATION STATUS</span>
                          <span>ROUND #124</span>
                        </div>
                        <div className="h-3 w-full bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 w-[85%] animate-shimmer"></div>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 mt-4">
                        <div className="p-2 rounded bg-slate-800 border border-slate-700">
                          <p className="text-[8px] text-slate-500 uppercase">Avg Loss</p>
                          <p className="text-sm font-bold text-white">0.2314</p>
                        </div>
                        <div className="p-2 rounded bg-slate-800 border border-slate-700">
                          <p className="text-[8px] text-slate-500 uppercase">Privacy Noise</p>
                          <p className="text-sm font-bold text-white">ε = 1.0</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Security Section */}
        <section id="security" className="py-24 sm:py-32 bg-slate-900 text-white relative overflow-hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[120px] rounded-full" />
          </div>
          <div className="mx-auto max-w-7xl px-6 lg:px-8 relative z-10">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-base font-bold uppercase tracking-widest text-blue-400">Military-Grade Security</h2>
              <p className="mt-2 text-3xl font-black tracking-tight text-white sm:text-4xl">Trust is built into the protocol</p>
              <p className="mt-6 text-slate-400 text-lg">We employ multi-layered security measures to ensure patient confidentiality and platform integrity at every scale.</p>
            </div>
            
            <div className="mt-16 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {[
                { title: 'Differential Privacy', desc: 'Mathematical noise added to model weights ensuring Zero Re-identification of patients.', icon: FileSearch },
                { title: 'RSA Encryption', desc: 'End-to-end 2048-bit encryption for all data in transit between hospital nodes.', icon: Key },
                { title: 'Audit Verification', desc: 'Immutable blockchain storage for every model state, preventing malicious tampering.', icon: ShieldCheck },
                { title: 'On-Prem Control', desc: 'Raw health records never leave your firewall. Total sovereignty over your data.', icon: Hospital },
              ].map((item, i) => (
                <div key={i} className="p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors">
                  <div className="h-12 w-12 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 mb-6 font-bold">
                    <item.icon size={24} />
                  </div>
                  <h4 className="text-lg font-bold mb-3">{item.title}</h4>
                  <p className="text-sm text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-20 p-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 rounded-[2.5rem]">
              <div className="bg-slate-900 rounded-[2.4rem] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8">
                <div className="text-center md:text-left">
                  <h3 className="text-2xl font-black">Compliant by Design</h3>
                  <p className="mt-2 text-slate-400">Our platform is built to align with HIPAA, GDPR, and other global healthcare regulations.</p>
                </div>
                <div className="flex flex-wrap justify-center gap-6 opacity-60">
                  <span className="px-4 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">HIPAA</span>
                  <span className="px-4 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">GDPR</span>
                  <span className="px-4 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">HL7 FHIR</span>
                  <span className="px-4 py-2 border border-white/20 rounded-full text-xs font-bold uppercase tracking-widest">SOC 2 Type II</span>
                </div>
              </div>
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
