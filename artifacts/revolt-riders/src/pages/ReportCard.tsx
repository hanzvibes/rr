import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User, MapPin, Calendar, Bike, Flag, ChevronDown,
  Download, Star, TrendingUp, Hash, Shield
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { parseRuns, numFmt, badgeColor } from "@/lib/utils";
import { computeBadges, TIER_STYLES } from "@/lib/achievements";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

interface ReportCardProps {
  onMenuOpen: () => void;
}

function getInitials(name: string) {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function getRankColor(jabatan: string) {
  const j = jabatan?.toUpperCase();
  if (j === "FOUNDER") return { from: "#ef4444", to: "#b91c1c", text: "#fca5a5" };
  if (j === "PRESIDENT") return { from: "#f59e0b", to: "#b45309", text: "#fde68a" };
  if (j === "EXCECUTOR") return { from: "#8b5cf6", to: "#6d28d9", text: "#c4b5fd" };
  if (j === "NEGOSIATOR") return { from: "#3b82f6", to: "#1d4ed8", text: "#93c5fd" };
  if (j === "LIFE MEMBER") return { from: "#06b6d4", to: "#0e7490", text: "#a5f3fc" };
  if (j === "VIRGIN") return { from: "#22c55e", to: "#15803d", text: "#86efac" };
  if (j === "CAPROS") return { from: "#eab308", to: "#a16207", text: "#fef08a" };
  return { from: "#71717a", to: "#3f3f46", text: "#d4d4d8" };
}

export default function ReportCard({ onMenuOpen }: ReportCardProps) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [dropOpen, setDropOpen] = useState(false);
  const [search, setSearch] = useState("");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function load() {
      const { data } = await supabase.from("riders").select("*").order("total_km", { ascending: false });
      if (data) {
        setRiders(data);
        if (data.length > 0) setSelectedId(data[0].id);
      }
      setLoading(false);
    }
    load();
  }, []);

  const rider = riders.find(r => r.id === selectedId) ?? null;
  const runs = rider ? parseRuns(rider.aktivitas) : [];
  const badges = rider ? computeBadges(rider) : [];
  const leaderboardRank = riders.findIndex(r => r.id === selectedId) + 1;
  const topRider = riders[0];
  const kmProgress = topRider ? Math.min((rider?.total_km ?? 0) / topRider.total_km * 100, 100) : 0;

  const sortedRuns = [...runs].sort((a, b) => b.km - a.km).slice(0, 8);
  const totalKm = runs.reduce((s, r) => s + r.km, 0);
  const avgKm = runs.length > 0 ? Math.round(totalKm / runs.length) : 0;
  const bestRun = runs.length > 0 ? Math.max(...runs.map(r => r.km)) : 0;

  const filteredRiders = riders.filter(r =>
    r.nama.toLowerCase().includes(search.toLowerCase()) ||
    r.jabatan.toLowerCase().includes(search.toLowerCase())
  );

  const handlePrint = useCallback(() => {
    window.print();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden bg-[#080808]">
        <Topbar title="Report Card" sub="Personal Rider Profile" onMenuOpen={onMenuOpen} />
        <div className="flex flex-1 items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-purple-500 border-t-transparent animate-spin" />
            <p className="text-[0.75rem] text-[#52525B]">Loading riders…</p>
          </div>
        </div>
      </div>
    );
  }

  const rankColor = rider ? getRankColor(rider.jabatan) : null;

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#080808]">
      <Topbar title="Report Card" sub="Personal Rider Profile" onMenuOpen={onMenuOpen} />

      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {/* Rider Selector */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px] max-w-sm">
            <button
              onClick={() => setDropOpen(p => !p)}
              className="w-full flex items-center justify-between gap-2 rounded-xl px-4 py-2.5 text-sm text-white"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              <div className="flex items-center gap-2 min-w-0">
                <User size={14} className="text-purple-400 flex-shrink-0" />
                <span className="truncate">{rider?.nama ?? "Select Rider"}</span>
              </div>
              <ChevronDown size={14} className={`text-[#52525B] flex-shrink-0 transition-transform ${dropOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
              {dropOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -6, scale: 0.97 }}
                  transition={{ duration: 0.12 }}
                  className="absolute top-full mt-1 left-0 w-full rounded-xl z-50 overflow-hidden"
                  style={{
                    background: "#111111",
                    border: "1px solid rgba(255,255,255,0.1)",
                    boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                  }}
                >
                  <div className="p-2">
                    <input
                      autoFocus
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search rider…"
                      className="w-full bg-transparent text-[0.8rem] text-white placeholder-[#52525B] outline-none px-2 py-1.5 rounded-lg border border-white/5"
                    />
                  </div>
                  <div className="max-h-52 overflow-y-auto px-2 pb-2 space-y-0.5">
                    {filteredRiders.map(r => (
                      <button
                        key={r.id}
                        onClick={() => { setSelectedId(r.id); setDropOpen(false); setSearch(""); }}
                        className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors ${
                          r.id === selectedId ? "bg-purple-500/20 text-white" : "text-[#A1A1AA] hover:bg-white/5 hover:text-white"
                        }`}
                      >
                        <div className="h-5 w-5 rounded flex items-center justify-center text-[0.55rem] font-bold flex-shrink-0"
                          style={{ background: "rgba(139,92,246,0.3)" }}>
                          {getInitials(r.nama)}
                        </div>
                        <span className="text-[0.78rem] truncate">{r.nama}</span>
                        <span className={`ml-auto text-[0.6rem] rounded px-1.5 py-0.5 flex-shrink-0 ${badgeColor(r.jabatan)}`}>{r.jabatan}</span>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl px-4 py-2.5 text-[0.78rem] font-medium text-white transition-all hover:opacity-80 print:hidden"
            style={{ background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)" }}
          >
            <Download size={14} />
            <span>Print / Save PDF</span>
          </button>
        </div>

        {/* Card */}
        {rider && rankColor && (
          <motion.div
            key={rider.id}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            ref={printRef}
            className="rounded-2xl overflow-hidden"
            style={{ border: "1px solid rgba(255,255,255,0.07)" }}
          >
            {/* Card Header */}
            <div
              className="relative p-6 md:p-8 overflow-hidden"
              style={{
                background: `linear-gradient(135deg, ${rankColor.from}22 0%, #0A0A0A 60%)`,
                borderBottom: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              {/* Background glow */}
              <div
                className="absolute top-0 right-0 w-64 h-64 rounded-full blur-3xl opacity-10 pointer-events-none"
                style={{ background: rankColor.from, transform: "translate(30%, -30%)" }}
              />

              <div className="relative flex items-start gap-5 flex-wrap">
                {/* Avatar */}
                <div
                  className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-2xl"
                  style={{
                    background: `linear-gradient(135deg, ${rankColor.from} 0%, ${rankColor.to} 100%)`,
                    boxShadow: `0 0 32px ${rankColor.from}60`,
                  }}
                >
                  {getInitials(rider.nama)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span
                      className="text-[0.65rem] font-bold uppercase tracking-[0.12em] px-2.5 py-1 rounded-full"
                      style={{ background: `${rankColor.from}33`, color: rankColor.text, border: `1px solid ${rankColor.from}50` }}
                    >
                      {rider.jabatan}
                    </span>
                    <span className="text-[0.62rem] text-[#52525B]">#{rider.no}</span>
                  </div>
                  <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-none mb-2">{rider.nama}</h1>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    <div className="flex items-center gap-1.5 text-[0.72rem] text-[#71717A]">
                      <MapPin size={11} className="text-purple-400" />
                      <span>{rider.alamat}</span>
                    </div>
                    {rider.bergabung && (
                      <div className="flex items-center gap-1.5 text-[0.72rem] text-[#71717A]">
                        <Calendar size={11} className="text-purple-400" />
                        <span>Joined {rider.bergabung}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-[0.72rem] text-[#71717A]">
                      <Hash size={11} className="text-purple-400" />
                      <span>Rank #{leaderboardRank} of {riders.length}</span>
                    </div>
                  </div>
                </div>

                {/* Club logo area */}
                <div className="flex-shrink-0 text-right hidden md:block">
                  <p className="text-[0.6rem] uppercase tracking-[0.15em] text-[#3F3F46] mb-1">REVOLT RIDERS MC</p>
                  <p className="text-[0.55rem] text-[#27272A]">Mandatory Ride</p>
                </div>
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/5" style={{ background: "#0C0C0C", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
              {[
                { label: "Total KM", value: numFmt(rider.total_km), icon: Bike, sub: "km ridden" },
                { label: "Total Runs", value: runs.length, icon: Flag, sub: "club rides" },
                { label: "Avg KM/Run", value: numFmt(avgKm), icon: TrendingUp, sub: "per ride" },
                { label: "Best Run", value: numFmt(bestRun), icon: Star, sub: "km single" },
              ].map(({ label, value, icon: Icon, sub }) => (
                <div key={label} className="flex flex-col items-center justify-center py-5 gap-1 text-center">
                  <Icon size={13} className="text-purple-400 mb-0.5" />
                  <p className="text-[1.35rem] font-black text-white leading-none">{value}</p>
                  <p className="text-[0.58rem] text-[#52525B] uppercase tracking-wider">{label}</p>
                  <p className="text-[0.55rem] text-[#3F3F46]">{sub}</p>
                </div>
              ))}
            </div>

            {/* Body */}
            <div className="grid md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x divide-white/5" style={{ background: "#0A0A0A" }}>
              {/* Badges */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Shield size={13} className="text-purple-400" />
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-[#A1A1AA]">Badges Earned</p>
                  <span className="ml-auto text-[0.65rem] text-[#52525B]">{badges.length} / 12</span>
                </div>
                {badges.length === 0 ? (
                  <p className="text-[0.72rem] text-[#3F3F46] py-4 text-center">No badges earned yet. Keep riding!</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {badges.map(badge => {
                      const style = TIER_STYLES[badge.tier];
                      const Icon = badge.icon;
                      return (
                        <div
                          key={badge.id}
                          title={badge.description}
                          className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 border bg-gradient-to-br ${style.bg} ${style.border}`}
                        >
                          <Icon size={11} className={style.text} />
                          <span className={`text-[0.62rem] font-bold ${style.text}`}>{badge.name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* KM Progress vs #1 */}
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="flex justify-between mb-2">
                    <span className="text-[0.65rem] text-[#71717A]">Progress vs #{1} Rider</span>
                    <span className="text-[0.65rem] text-purple-400">{Math.round(kmProgress)}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ background: "linear-gradient(90deg, #7C3AED, #A855F7)" }}
                      initial={{ width: 0 }}
                      animate={{ width: `${kmProgress}%` }}
                      transition={{ duration: 0.9, ease: "easeOut" }}
                    />
                  </div>
                  {topRider && rider.id !== topRider.id && (
                    <p className="text-[0.6rem] text-[#3F3F46] mt-1.5">
                      {numFmt(topRider.total_km - rider.total_km)} km behind {topRider.nama}
                    </p>
                  )}
                  {rider.id === topRider?.id && (
                    <p className="text-[0.6rem] text-purple-400 mt-1.5">👑 #1 Rider in the club!</p>
                  )}
                </div>
              </div>

              {/* Run Chart */}
              <div className="p-5 space-y-3">
                <div className="flex items-center gap-2 mb-3">
                  <Bike size={13} className="text-purple-400" />
                  <p className="text-[0.7rem] font-semibold uppercase tracking-wider text-[#A1A1AA]">Top Runs</p>
                  <span className="ml-auto text-[0.65rem] text-[#52525B]">by km</span>
                </div>
                {sortedRuns.length === 0 ? (
                  <p className="text-[0.72rem] text-[#3F3F46] py-4 text-center">No activity recorded yet.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={sortedRuns} layout="vertical" margin={{ top: 0, right: 8, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis
                        type="category"
                        dataKey="nama"
                        width={100}
                        tick={{ fill: "#71717A", fontSize: 10 }}
                        tickFormatter={v => v.length > 14 ? v.slice(0, 13) + "…" : v}
                      />
                      <Tooltip
                        contentStyle={{ background: "#111", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 11 }}
                        labelStyle={{ color: "#fff" }}
                        formatter={(v: number) => [`${numFmt(v)} km`, "Distance"]}
                      />
                      <Bar dataKey="km" radius={[0, 4, 4, 0]}>
                        {sortedRuns.map((_, i) => (
                          <Cell key={i} fill={i === 0 ? "#A855F7" : `rgba(139,92,246,${0.6 - i * 0.06})`} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Footer */}
            <div
              className="px-6 py-3 flex items-center justify-between"
              style={{ background: "#080808", borderTop: "1px solid rgba(255,255,255,0.04)" }}
            >
              <p className="text-[0.58rem] text-[#27272A] uppercase tracking-widest">Revolt Riders MC — Official Member Card</p>
              <p className="text-[0.58rem] text-[#27272A]">Generated {new Date().toLocaleDateString("id-ID")}</p>
            </div>
          </motion.div>
        )}
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
