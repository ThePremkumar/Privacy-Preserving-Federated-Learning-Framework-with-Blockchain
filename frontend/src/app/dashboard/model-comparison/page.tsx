'use client';

import React, { useState, useEffect } from 'react';
import { Trophy, ArrowUp, ArrowDown, Minus, RotateCcw, GitCompare, Loader2, ShieldCheck, AlertCircle } from 'lucide-react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell, Legend } from 'recharts';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }

interface Round {
  id: string;
  round_number: number;
  global_accuracy: string | null;
  global_loss: string | null;
  /** nodes_count from AggregationHistoryItem */
  num_participants: number;
  /** derived from epsilon_total or nodes_count */
  privacy_budget_used: number;
  /** date field from AggregationHistoryItem */
  created_at: string;
  blockchain_tx_hash?: string;
  blockchain_status?: string;
  total_samples?: number;
}

const MOCK_ROUNDS: Round[] = [
  { id: 'r1', round_number: 1, global_accuracy: '0.742', global_loss: '0.521', num_participants: 2, privacy_budget_used: 2.0, created_at: '2026-01-15', blockchain_tx_hash: '0xabc123' },
  { id: 'r2', round_number: 2, global_accuracy: '0.789', global_loss: '0.445', num_participants: 3, privacy_budget_used: 4.0, created_at: '2026-02-10', blockchain_tx_hash: '0xdef456' },
  { id: 'r3', round_number: 3, global_accuracy: '0.823', global_loss: '0.381', num_participants: 3, privacy_budget_used: 6.0, created_at: '2026-03-05', blockchain_tx_hash: '0xghi789' },
  { id: 'r4', round_number: 4, global_accuracy: '0.856', global_loss: '0.312', num_participants: 4, privacy_budget_used: 8.0, created_at: '2026-04-01', blockchain_tx_hash: '0xjkl012' },
  { id: 'r5', round_number: 5, global_accuracy: '0.891', global_loss: '0.267', num_participants: 4, privacy_budget_used: 10.0, created_at: '2026-04-20', blockchain_tx_hash: '0xmno345' },
];

function Delta({ a, b, higher_is_better = true }: { a: number; b: number; higher_is_better?: boolean }) {
  const diff = a - b;
  const better = higher_is_better ? diff > 0 : diff < 0;
  if (Math.abs(diff) < 0.001) return <span className="flex items-center gap-0.5 text-slate-400"><Minus size={12} /> Equal</span>;
  return (
    <span className={cn('flex items-center gap-0.5 font-black text-xs', better ? 'text-teal-600' : 'text-red-600')}>
      {better ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
      {Math.abs(diff * 100).toFixed(1)}pp
    </span>
  );
}

export default function ModelComparisonPage() {
  const { user } = useAuth();
  const [rounds, setRounds] = useState<Round[]>(MOCK_ROUNDS);
  const [leftId, setLeftId] = useState<string>('');
  const [rightId, setRightId] = useState<string>('');
  const [rolling, setRolling] = useState<string | null>(null);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(true);

  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => {
    api.get('/training/aggregation-history')
      .then(res => {
        if (Array.isArray(res.data) && res.data.length > 0) {
          // Map AggregationHistoryItem fields → local Round shape
          const mapped: Round[] = res.data.map((r: any) => ({
            id: r.id,
            round_number: r.round_number,
            global_accuracy: r.global_accuracy,
            global_loss: r.global_loss,
            num_participants: r.nodes_count ?? r.num_participants ?? 0,
            privacy_budget_used: parseFloat(r.epsilon_total ?? r.privacy_budget_used ?? '1.0'),
            created_at: r.date ?? r.created_at ?? '',
            blockchain_tx_hash: r.blockchain_tx_hash,
            blockchain_status: r.blockchain_status,
            total_samples: r.total_samples,
          }));
          setRounds(mapped);
          setLeftId(mapped[Math.min(1, mapped.length - 1)]?.id || '');
          setRightId(mapped[0]?.id || '');
        } else {
          // Fallback: keep mock data, set selectors
          setLeftId(MOCK_ROUNDS[MOCK_ROUNDS.length - 2]?.id || '');
          setRightId(MOCK_ROUNDS[MOCK_ROUNDS.length - 1]?.id || '');
        }
      })
      .catch(() => {
        setLeftId(MOCK_ROUNDS[MOCK_ROUNDS.length - 2]?.id || '');
        setRightId(MOCK_ROUNDS[MOCK_ROUNDS.length - 1]?.id || '');
      })
      .finally(() => setLoading(false));
  }, []);

  const left  = rounds.find(r => r.id === leftId);
  const right = rounds.find(r => r.id === rightId);

  const winner = left && right
    ? parseFloat(left.global_accuracy || '0') > parseFloat(right.global_accuracy || '0') ? 'left'
      : parseFloat(right.global_accuracy || '0') > parseFloat(left.global_accuracy || '0') ? 'right'
      : 'tie'
    : null;

  async function handleRollback(round: Round) {
    if (!confirm(`Roll back global model to Round #${round.round_number} (${round.global_accuracy ? (parseFloat(round.global_accuracy) * 100).toFixed(1) + '% acc' : 'N/A'})? This creates a new aggregation round restoring those weights.`))
      return;
    setRolling(round.id);
    try {
      const res = await api.post(`/training/aggregation-rounds/${round.id}/rollback`);
      const d = res.data;
      setToast({
        msg: `Rolled back to Round #${d.rolled_back_to_round} — new Round #${d.new_round_number} (v${d.new_model_version}) created.`,
        type: 'success',
      });
      // Refresh rounds list
      const hist = await api.get('/training/aggregation-history');
      if (Array.isArray(hist.data) && hist.data.length > 0) {
        const mapped: Round[] = hist.data.map((r: any) => ({
          id: r.id,
          round_number: r.round_number,
          global_accuracy: r.global_accuracy,
          global_loss: r.global_loss,
          num_participants: r.nodes_count ?? r.num_participants ?? 0,
          privacy_budget_used: parseFloat(r.epsilon_total ?? r.privacy_budget_used ?? '1.0'),
          created_at: r.date ?? r.created_at ?? '',
          blockchain_tx_hash: r.blockchain_tx_hash,
          blockchain_status: r.blockchain_status,
          total_samples: r.total_samples,
        }));
        setRounds(mapped);
      }
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.message || 'Rollback failed.';
      setToast({ msg: `Error: ${detail}`, type: 'error' });
    } finally {
      setRolling(null);
      setTimeout(() => setToast(null), 5000);
    }
  }

  const radarData = left && right ? [
    { metric: 'Accuracy', left: parseFloat(left.global_accuracy || '0') * 100, right: parseFloat(right.global_accuracy || '0') * 100 },
    { metric: 'Low Loss',  left: (1 - parseFloat(left.global_loss || '1')) * 100, right: (1 - parseFloat(right.global_loss || '1')) * 100 },
    { metric: 'Participants', left: (left.num_participants / 10) * 100, right: (right.num_participants / 10) * 100 },
    { metric: 'Privacy Eff.', left: (1 - left.privacy_budget_used / 10) * 100, right: (1 - right.privacy_budget_used / 10) * 100 },
  ] : [];

  const barData = left && right ? [
    { name: 'Accuracy (%)', left: +(parseFloat(left.global_accuracy || '0') * 100).toFixed(1), right: +(parseFloat(right.global_accuracy || '0') * 100).toFixed(1) },
    { name: 'Loss',         left: +parseFloat(left.global_loss || '0').toFixed(3),              right: +parseFloat(right.global_loss || '0').toFixed(3) },
    { name: 'Participants', left: left.num_participants,  right: right.num_participants },
    { name: 'Budget (ε)',   left: left.privacy_budget_used, right: right.privacy_budget_used },
  ] : [];

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-blue-700" size={36} />
    </div>
  );

  return (
    <div className="space-y-8 animate-fade-in">
      {toast && (
        <div
          className={cn(
            'toast flex items-center gap-2',
            toast.type === 'error' ? 'border-red-200 bg-red-50' : 'border-teal-200 bg-teal-50'
          )}
          style={{ position: 'fixed', top: 20, right: 20, zIndex: 9999, maxWidth: 420 }}
        >
          {toast.type === 'error'
            ? <AlertCircle size={18} className="text-red-500 shrink-0" />
            : <ShieldCheck size={18} className="text-teal-600 shrink-0" />}
          <p className="text-xs font-bold text-slate-700">{toast.msg}</p>
        </div>
      )}

      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-900">Model <span className="gradient-text">Comparison</span></h1>
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest mt-1">Side-by-side analysis of aggregation rounds</p>
      </div>

      {/* Round selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {(['left', 'right'] as const).map((side) => {
          const id = side === 'left' ? leftId : rightId;
          const setId = side === 'left' ? setLeftId : setRightId;
          const round = rounds.find(r => r.id === id);
          const isWinner = winner === side;
          return (
            <div key={side} className={cn('glass-card rounded-2xl p-5 border-2 transition-all', isWinner ? 'border-teal-400 shadow-lg shadow-teal-100' : 'border-transparent')}>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{side === 'left' ? 'Round A' : 'Round B'}</span>
                {isWinner && <span className="flex items-center gap-1 px-2.5 py-1 bg-teal-50 text-teal-700 text-[9px] font-black uppercase tracking-widest rounded-full border border-teal-200"><Trophy size={10} /> Winner</span>}
              </div>
              <select
                value={id}
                onChange={e => setId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 focus:ring-2 focus:ring-blue-200 focus:outline-none"
              >
                <option value="">— Select round —</option>
                {rounds.map(r => (
                  <option key={r.id} value={r.id}>Round #{r.round_number} — {r.global_accuracy ? `${(parseFloat(r.global_accuracy) * 100).toFixed(1)}% acc` : 'N/A'}</option>
                ))}
              </select>
              {round && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="glass-card rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-blue-700">{round.global_accuracy ? `${(parseFloat(round.global_accuracy)*100).toFixed(1)}%` : '—'}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Accuracy</p>
                  </div>
                  <div className="glass-card rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-slate-700">{round.global_loss ? parseFloat(round.global_loss).toFixed(3) : '—'}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Loss</p>
                  </div>
                  <div className="glass-card rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-teal-600">{round.num_participants}</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Participants</p>
                  </div>
                  <div className="glass-card rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-amber-600">{round.privacy_budget_used}ε</p>
                    <p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Budget Used</p>
                  </div>
                  {round.blockchain_tx_hash && (
                    <div className="col-span-2 glass-card rounded-xl p-3 flex items-center gap-2">
                      <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                      <p className="text-[9px] font-bold text-slate-500 truncate font-mono">{round.blockchain_tx_hash}</p>
                    </div>
                  )}
                  {isSuperAdmin && (
                    <div className="col-span-2">
                      <button
                        onClick={() => handleRollback(round)}
                        disabled={rolling === round.id}
                        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-100 text-slate-700 text-xs font-black hover:bg-amber-50 hover:text-amber-700 transition-all border border-slate-200 disabled:opacity-60"
                      >
                        {rolling === round.id ? <Loader2 size={13} className="animate-spin" /> : <RotateCcw size={13} />}
                        Roll Back to Round #{round.round_number}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Delta row */}
      {left && right && (
        <div className="glass-card rounded-2xl p-5">
          <h3 className="text-sm font-black text-slate-900 mb-4 flex items-center gap-2">
            <GitCompare size={16} className="text-blue-700" /> Delta Analysis — Round #{left.round_number} vs Round #{right.round_number}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Accuracy Δ</p>
              <Delta a={parseFloat(right.global_accuracy || '0')} b={parseFloat(left.global_accuracy || '0')} higher_is_better />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Loss Δ</p>
              <Delta a={parseFloat(right.global_loss || '0')} b={parseFloat(left.global_loss || '0')} higher_is_better={false} />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Participants Δ</p>
              <Delta a={right.num_participants} b={left.num_participants} higher_is_better />
            </div>
            <div className="text-center">
              <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 mb-2">Budget Δ</p>
              <Delta a={right.privacy_budget_used} b={left.privacy_budget_used} higher_is_better={false} />
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {left && right && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-black text-slate-900 mb-5">Multi-Dimensional Comparison (Radar)</h3>
            <ResponsiveContainer width="100%" height={280}>
              <RadarChart data={radarData} margin={{ top: 10, right: 30, bottom: 10, left: 30 }}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} />
                <Radar name={`Round #${left.round_number}`} dataKey="left" stroke="#0F4C81" fill="#0F4C81" fillOpacity={0.2} strokeWidth={2} />
                <Radar name={`Round #${right.round_number}`} dataKey="right" stroke="#0D9488" fill="#0D9488" fillOpacity={0.2} strokeWidth={2} />
                <Legend formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="text-sm font-black text-slate-900 mb-5">Side-by-Side Metrics</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={barData} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontWeight: 700, fontSize: 10 }} />
                <Tooltip />
                <Legend formatter={(v) => <span style={{ fontSize: 10, fontWeight: 700 }}>{v}</span>} />
                <Bar dataKey="left"  name={`Round #${left.round_number}`}  fill="#0F4C81" radius={[4,4,0,0]} />
                <Bar dataKey="right" name={`Round #${right.round_number}`} fill="#0D9488" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {!left || !right ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <GitCompare size={48} className="mx-auto text-slate-200 mb-3" />
          <p className="text-sm font-black text-slate-500">Select two rounds above to compare</p>
          <p className="text-[10px] font-bold text-slate-400 mt-1">Radar chart, delta analysis and side-by-side metrics will appear here</p>
        </div>
      ) : null}

      {/* All rounds table */}
      <div className="glass-card rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100">
          <h3 className="text-sm font-black text-slate-900">All Aggregation Rounds</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full medical-table">
            <thead><tr>
              <th className="text-left">Round</th>
              <th className="text-center">Accuracy</th>
              <th className="text-center">Loss</th>
              <th className="text-center">Participants</th>
              <th className="text-center">Budget (ε)</th>
              <th className="text-left">Date</th>
              {isSuperAdmin && <th className="text-center">Rollback</th>}
            </tr></thead>
            <tbody>
              {rounds.map(r => {
                const isBest = r.id === rounds.reduce((best, cur) =>
                  parseFloat(cur.global_accuracy || '0') > parseFloat(best.global_accuracy || '0') ? cur : best
                ).id;
                return (
                  <tr key={r.id} className={isBest ? 'bg-teal-50/50' : ''}>
                    <td className="font-black text-slate-900">
                      <span className="flex items-center gap-2">
                        #{r.round_number}
                        {isBest && <Trophy size={12} className="text-teal-600" />}
                      </span>
                    </td>
                    <td className="text-center font-black text-blue-700">{r.global_accuracy ? `${(parseFloat(r.global_accuracy)*100).toFixed(1)}%` : '—'}</td>
                    <td className="text-center font-black text-slate-700">{r.global_loss ? parseFloat(r.global_loss).toFixed(3) : '—'}</td>
                    <td className="text-center font-bold text-slate-600">{r.num_participants}</td>
                    <td className="text-center font-bold text-amber-600">{r.privacy_budget_used}ε</td>
                    <td className="text-slate-500 text-xs">{new Date(r.created_at).toLocaleDateString()}</td>
                    {isSuperAdmin && (
                      <td className="text-center">
                        <button
                          onClick={() => handleRollback(r)}
                          disabled={rolling === r.id}
                          className="flex items-center gap-1 mx-auto px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-[10px] font-black hover:bg-amber-50 hover:text-amber-700 transition-all disabled:opacity-50"
                        >
                          {rolling === r.id ? <Loader2 size={10} className="animate-spin" /> : <RotateCcw size={10} />} Rollback
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
