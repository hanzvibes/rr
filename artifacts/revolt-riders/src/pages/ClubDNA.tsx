import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dna, Users, Zap, Trophy, TrendingUp, Globe2,
  Moon, MapPin, Star, Crown, Shield, Flame,
  BarChart3, Activity, Target,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { parseRuns, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

/* ── Constants ─────────────────────────────────────────────────── */
const EARTH_KM = 40_075;
const MOON_KM = 384_400;
const JKT_SABANG = 1_800;
const JKT_MERAUKE = 4_700;

const JABATAN_ORDER = [
  "FOUNDER", "PRESIDENT", "EXCECUTOR", "NEGOSIATOR",
  "LIFE MEMBER", "VIRGIN", "CAPROS", "PROSPEK",
];

const JABATAN_COLORS: Record<string, string> = {
  FOUNDER: "#EF4444",
  PRESIDENT: "#F59E0B",
  EXCECUTOR: "#A855F7",
  NEGOSIATOR: "#3B82F6",
  "LIFE MEMBER": "#06B6D4",
  VIRGIN: "#22C55E",
  CAPROS: "#F59E0B",
  PROSPEK: "#6B7280",
};

const JABATAN_ICONS: Record<string, React.ElementType> = {
  FOUNDER: Flame,
  PRESIDENT: Crown,
  EXCECUTOR: Shield,
  NEGOSIATOR: Target,
  "LIFE MEMBER": Star,
  VIRGIN: Zap,
  CAPROS: TrendingUp,
  PROSPEK: Activity,
};

/* ── Animated number ───────────────────────────────────────────── */
function AnimCount({ value, duration = 1400 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 4);
      setDisplay(Math.round(value * eased));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display.toLocaleString("id-ID")}</>;
}

/* ── Stat card ─────────────────────────────────────────────────── */
function StatCard({
  icon: Icon, label, value, sub, color, delay = 0,
}: {
  icon: React.ElementType; label: string; value: React.ReactNode;
  sub?: string; color: string; delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <p className="text-[0.65rem] font-semibold uppercase tracking-wider text-[#52525B]">{label}</p>
        <div className="h-8 w-8 rounded-xl flex items-center justify-center" style={{ background: color + "22" }}>
          <Icon size={15} style={{ color }} />
        </div>
      </div>
      <div>
        <p className="text-[1.9rem] font-black text-white leading-none">{value}</p>
        {sub && <p className="text-[0.65rem] text-[#52525B] mt-1">{sub}</p>}
      </div>
    </motion.div>
  );
}

/* ── Distance comparison row ───────────────────────────────────── */
function DistanceRow({
  icon: Icon, label, value, color, delay,
}: {
  icon: React.ElementType; label: string; value: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.35 }}
      className="flex items-center gap-3 py-2"
    >
      <div className="h-8 w-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: color + "18" }}>
        <Icon size={14} style={{ color }} />
      </div>
      <p className="text-[0.78rem] text-[#A1A1AA] flex-1">{label}</p>
      <p className="text-[0.82rem] font-bold" style={{ color }}>{value}</p>
    </motion.div>
  );
}

/* ── Main ──────────────────────────────────────────────────────── */
export default function ClubDNA({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("riders").select("*");
    setRiders(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  /* ── Computed stats ── */
  const totalKm = riders.reduce((s, r) => s + (r.total_km || 0), 0);
  const activeRiders = riders.filter(r => (r.total_km || 0) > 0);
  const avgKm = riders.length ? Math.round(totalKm / riders.length) : 0;
  const topRiders = [...riders].sort((a, b) => (b.total_km || 0) - (a.total_km || 0)).slice(0, 5);
  const topRider = topRiders[0];

  const jabatanCounts: Record<string, number> = {};
  for (const r of riders) {
    const j = r.jabatan?.toUpperCase() || "PROSPEK";
    jabatanCounts[j] = (jabatanCounts[j] || 0) + 1;
  }
  const maxJabatanCount = Math.max(...Object.values(jabatanCounts), 1);

  const totalRuns = riders.reduce((s, r) => {
    const runs = parseRuns(r.aktivitas);
    return s + runs.length;
  }, 0);

  const strengthScore = riders.length ? Math.round((activeRiders.length / riders.length) * 100) : 0;

  const earthLaps = (totalKm / EARTH_KM).toFixed(1);
  const moonPct = ((totalKm / MOON_KM) * 100).toFixed(1);
  const sabangTrips = Math.floor(totalKm / JKT_SABANG);
  const meraukeTrips = Math.floor(totalKm / JKT_MERAUKE);

  /* ── Loading ── */
  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Topbar title="Club DNA" subtitle="Collective identity" onMenuOpen={onMenuOpen} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-[0.75rem] text-[#52525B]">Analysing club data…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Club DNA"
        subtitle={`${riders.length} riders · ${totalKm.toLocaleString("id-ID")} km combined`}
        onMenuOpen={onMenuOpen}
      />

      <div className="flex-1 overflow-y-auto px-4 md:px-6 py-5 space-y-6">

        {/* ── Hero banner ── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="relative rounded-3xl overflow-hidden p-6 md:p-8"
          style={{
            background: "linear-gradient(135deg, #1a0a2e 0%, #0f0820 40%, #110d1f 100%)",
            border: "1px solid rgba(139,92,246,0.2)",
          }}
        >
          {/* Glow orb */}
          <div className="pointer-events-none absolute -top-16 -left-16 h-64 w-64 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(139,92,246,0.25) 0%, transparent 70%)" }} />
          <div className="pointer-events-none absolute -bottom-10 right-0 h-48 w-48 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(168,85,247,0.12) 0%, transparent 70%)" }} />

          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            {/* Left */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-7 w-7 rounded-xl flex items-center justify-center bg-purple-500/20">
                  <Dna size={14} className="text-purple-400" />
                </div>
                <span className="text-[0.65rem] font-semibold uppercase tracking-wider text-purple-400">Collective Power</span>
              </div>
              <p className="text-[0.85rem] text-[#71717A] mb-1">Total distance ridden by all members</p>
              <div className="flex items-end gap-3">
                <h1 className="text-[3rem] md:text-[4rem] font-black text-white leading-none tracking-tight">
                  <AnimCount value={totalKm} duration={1600} />
                </h1>
                <span className="text-[1.2rem] font-bold text-purple-400 mb-2">km</span>
              </div>
              <p className="text-[0.72rem] text-[#52525B] mt-1">
                across <span className="text-white font-semibold">{riders.length} riders</span> and <span className="text-white font-semibold"><AnimCount value={totalRuns} /></span> logged runs
              </p>
            </div>

            {/* Right — distance comparisons */}
            <div className="md:w-72 rounded-2xl p-4 space-y-0.5" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
              <p className="text-[0.6rem] font-semibold uppercase tracking-wider text-[#3F3F46] mb-2">Distance equivalents</p>
              <DistanceRow icon={Globe2} label="Laps around Earth" value={`${earthLaps}×`} color="#22C55E" delay={0.3} />
              <DistanceRow icon={Moon} label="Distance to the Moon" value={`${moonPct}%`} color="#A855F7" delay={0.4} />
              <DistanceRow icon={MapPin} label="Jakarta → Sabang trips" value={`${sabangTrips}×`} color="#F59E0B" delay={0.5} />
              <DistanceRow icon={MapPin} label="Jakarta → Merauke trips" value={`${meraukeTrips}×`} color="#3B82F6" delay={0.6} />
            </div>
          </div>
        </motion.div>

        {/* ── Stat grid ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <StatCard icon={Users} label="Total Members" value={<AnimCount value={riders.length} />} sub="registered riders" color="#A855F7" delay={0.1} />
          <StatCard icon={Zap} label="Active Riders" value={<AnimCount value={activeRiders.length} />} sub={`${strengthScore}% of roster`} color="#22C55E" delay={0.15} />
          <StatCard icon={BarChart3} label="Average KM" value={<AnimCount value={avgKm} />} sub="per rider, all-time" color="#3B82F6" delay={0.2} />
          <StatCard icon={Trophy} label="Total Runs" value={<AnimCount value={totalRuns} />} sub="logged activities" color="#F59E0B" delay={0.25} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

          {/* ── Jabatan breakdown ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.4 }}
            className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <Shield size={14} className="text-purple-400" />
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#71717A]">Rank Distribution</p>
            </div>
            <div className="space-y-3">
              {JABATAN_ORDER.filter(j => jabatanCounts[j] > 0).map((jabatan, i) => {
                const count = jabatanCounts[jabatan] || 0;
                const pct = (count / maxJabatanCount) * 100;
                const color = JABATAN_COLORS[jabatan] || "#6B7280";
                const JIcon = JABATAN_ICONS[jabatan] || Activity;
                return (
                  <motion.div
                    key={jabatan}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + i * 0.06 }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <JIcon size={11} style={{ color }} />
                        <span className="text-[0.72rem] font-medium text-[#A1A1AA]">{jabatan}</span>
                      </div>
                      <span className="text-[0.68rem] font-bold" style={{ color }}>{count} rider{count !== 1 ? "s" : ""}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.5 + i * 0.06, duration: 0.6, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: `linear-gradient(90deg, ${color}99, ${color})` }}
                      />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* ── Club strength ── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35, duration: 0.4 }}
            className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5 flex flex-col"
          >
            <div className="flex items-center gap-2 mb-4">
              <Flame size={14} className="text-orange-400" />
              <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#71717A]">Club Strength</p>
            </div>

            {/* Gauge */}
            <div className="flex flex-col items-center flex-1 justify-center py-4">
              <div className="relative h-36 w-36">
                <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="10" />
                  <motion.circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke="url(#strengthGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 52}`}
                    initial={{ strokeDashoffset: 2 * Math.PI * 52 }}
                    animate={{ strokeDashoffset: 2 * Math.PI * 52 * (1 - strengthScore / 100) }}
                    transition={{ delay: 0.6, duration: 1.2, ease: "easeOut" }}
                  />
                  <defs>
                    <linearGradient id="strengthGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#A855F7" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-[2rem] font-black text-white leading-none">
                    <AnimCount value={strengthScore} />%
                  </span>
                  <span className="text-[0.6rem] text-[#52525B] mt-0.5">active</span>
                </div>
              </div>

              <div className="mt-4 text-center">
                <p className="text-[0.82rem] font-semibold text-white">
                  {strengthScore >= 80 ? "🔥 Blazing Hot" : strengthScore >= 60 ? "⚡ Charged Up" : strengthScore >= 40 ? "🌀 Steady Rolling" : "💤 Needs a Kickstart"}
                </p>
                <p className="text-[0.68rem] text-[#52525B] mt-0.5">
                  {activeRiders.length} of {riders.length} riders have logged KM
                </p>
              </div>
            </div>

            {/* Mini breakdown */}
            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.15)" }}>
                <p className="text-[1.1rem] font-black text-green-400">{activeRiders.length}</p>
                <p className="text-[0.6rem] text-[#52525B]">Active</p>
              </div>
              <div className="rounded-xl p-3 text-center" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.1)" }}>
                <p className="text-[1.1rem] font-black text-red-400">{riders.length - activeRiders.length}</p>
                <p className="text-[0.6rem] text-[#52525B]">Inactive</p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ── Top 5 podium ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45, duration: 0.4 }}
          className="rounded-2xl border border-white/8 bg-[#0D0D0D] p-5"
        >
          <div className="flex items-center gap-2 mb-5">
            <Trophy size={14} className="text-yellow-400" />
            <p className="text-[0.72rem] font-semibold uppercase tracking-wider text-[#71717A]">All-Time Top Riders</p>
          </div>

          <div className="space-y-2.5">
            {topRiders.map((rider, i) => {
              const maxKm = topRiders[0]?.total_km || 1;
              const pct = ((rider.total_km || 0) / maxKm) * 100;
              const RANK_COLORS = ["#F59E0B", "#9CA3AF", "#C2703D", "#A855F7", "#3B82F6"];
              const RANK_LABELS = ["🥇", "🥈", "🥉", "4th", "5th"];
              const color = RANK_COLORS[i];

              return (
                <motion.div
                  key={rider.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.5 + i * 0.07 }}
                  className="flex items-center gap-3"
                >
                  <span className="text-[0.9rem] w-7 text-center flex-shrink-0">{RANK_LABELS[i]}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[0.78rem] font-semibold text-white truncate">{rider.nama}</span>
                      <span className="text-[0.72rem] font-bold ml-2 flex-shrink-0" style={{ color }}>
                        {(rider.total_km || 0).toLocaleString("id-ID")} km
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ delay: 0.65 + i * 0.07, duration: 0.7, ease: "easeOut" }}
                        className="h-full rounded-full"
                        style={{ background: i === 0 ? "linear-gradient(90deg, #B45309, #F59E0B)" : `${color}88` }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Bottom CTA / fun fact ── */}
        {topRider && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.4 }}
            className="rounded-2xl p-5 text-center"
            style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(139,92,246,0.08) 100%)", border: "1px solid rgba(245,158,11,0.15)" }}
          >
            <Crown size={20} className="text-yellow-400 mx-auto mb-2" />
            <p className="text-[0.72rem] text-[#71717A] uppercase tracking-wider mb-1">Club Champion</p>
            <p className="text-[1.1rem] font-black text-white">{topRider.nama}</p>
            <p className="text-[0.75rem] text-yellow-400 font-semibold">
              {(topRider.total_km || 0).toLocaleString("id-ID")} km ridden · {topRider.jabatan}
            </p>
            <p className="text-[0.65rem] text-[#52525B] mt-2">
              Leads the pack — {topRiders[1] ? `${((topRider.total_km || 0) - (topRiders[1].total_km || 0)).toLocaleString("id-ID")} km ahead of #2` : "undisputed."}
            </p>
          </motion.div>
        )}

        <div className="h-4" />
      </div>
    </div>
  );
}
