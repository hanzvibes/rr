import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award, Flame, Sparkles, TrendingUp, TrendingDown,
  Minus, Route, ChevronRight, RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, parseRuns, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

const STORAGE_KEY = "rr_leaderboard_prev";

type RankedRider = Rider & {
  rank: number;
  runs: number;
  avgKm: number;
  prevRank: number | null;
  delta: number | null;
};

/* ── Animated counter ─────────────────────────────────────────── */
function AnimatedNumber({ value, duration = 900 }: { value: number; duration?: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    const end = value;
    const start = performance.now();
    function tick(now: number) {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(end * eased));
      if (t < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [value, duration]);
  return <>{display.toLocaleString("id-ID")}</>;
}

/* ── Rank badge ───────────────────────────────────────────────── */
function rankBadgeClass(jabatan: string): string {
  const j = jabatan?.toUpperCase();
  if (j === "FOUNDER") return "badge-red";
  if (j === "PRESIDENT") return "badge-yellow";
  if (j === "EXCECUTOR") return "badge-purple";
  if (j === "NEGOSIATOR") return "badge-blue";
  if (j === "LIFE MEMBER") return "badge-cyan";
  if (j === "VIRGIN") return "badge-green";
  if (j === "CAPROS") return "badge-yellow";
  return "badge-gray";
}

/* ── Rank change pill ─────────────────────────────────────────── */
function DeltaBadge({ delta }: { delta: number | null }) {
  if (delta === null) return (
    <span className="flex items-center gap-0.5 text-[0.62rem] font-semibold text-[#52525B] bg-[rgba(255,255,255,0.04)] px-1.5 py-0.5 rounded-md">
      NEW
    </span>
  );
  if (delta === 0) return (
    <span className="flex items-center gap-0.5 text-[0.62rem] font-medium text-[#52525B]">
      <Minus size={10} />
    </span>
  );
  return (
    <span className={cn(
      "flex items-center gap-0.5 text-[0.62rem] font-bold px-1.5 py-0.5 rounded-md",
      delta > 0 ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"
    )}>
      {delta > 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
      {Math.abs(delta)}
    </span>
  );
}

/* ── Position icon ────────────────────────────────────────────── */
function PositionIcon({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-400/30 to-yellow-500/20 border border-amber-500/30">
      <Flame size={20} className="text-amber-400" />
    </div>
  );
  if (rank === 2) return (
    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-400/20 to-slate-500/10 border border-slate-500/30">
      <Award size={18} className="text-slate-400" />
    </div>
  );
  if (rank === 3) return (
    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-700/20 to-orange-800/10 border border-amber-700/30">
      <Sparkles size={18} className="text-amber-600" />
    </div>
  );
  return (
    <div className="flex h-10 w-10 md:h-12 md:w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.03)]">
      <span className="text-sm font-bold text-[#52525B]">{rank}</span>
    </div>
  );
}

/* ── Progress bar ─────────────────────────────────────────────── */
function KmBar({ value, max, rank }: { value: number; max: number; rank: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  const gradient =
    rank === 1 ? "linear-gradient(90deg, #D97706, #F59E0B, #FDE68A)"
    : rank === 2 ? "linear-gradient(90deg, #64748B, #94A3B8)"
    : rank === 3 ? "linear-gradient(90deg, #92400E, #B45309)"
    : "linear-gradient(90deg, #6D28D9, #8B5CF6, #A855F7)";
  return (
    <div className="h-1 w-full overflow-hidden rounded-full" style={{ background: "rgba(255,255,255,0.05)" }}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, delay: 0.06, ease: [0.4, 0, 0.2, 1] }}
        className="h-full rounded-full"
        style={{ background: gradient, boxShadow: rank <= 3 ? `0 0 6px ${rank === 1 ? "rgba(245,158,11,0.4)" : rank === 2 ? "rgba(148,163,184,0.3)" : "rgba(180,83,9,0.3)"}` : "none" }}
      />
    </div>
  );
}

/* ── Podium block ─────────────────────────────────────────────── */
function PodiumBlock({ rider, position }: { rider: RankedRider; position: 1 | 2 | 3 }) {
  const heights = { 1: "h-28 md:h-36", 2: "h-20 md:h-28", 3: "h-14 md:h-20" };
  const colors = {
    1: { border: "border-amber-500/40", bg: "from-amber-500/15 to-transparent", text: "text-amber-400", glow: "shadow-amber-900/30" },
    2: { border: "border-slate-500/40", bg: "from-slate-400/10 to-transparent", text: "text-slate-400", glow: "shadow-slate-900/20" },
    3: { border: "border-amber-700/40", bg: "from-amber-700/10 to-transparent", text: "text-amber-600", glow: "shadow-amber-900/20" },
  };
  const c = colors[position];
  const labels = { 1: "🥇", 2: "🥈", 3: "🥉" };

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar + name above podium */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2, delay: position * 0.06 }}
        className="flex flex-col items-center gap-1.5 text-center"
      >
        <div className={cn(
          "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-2xl border text-sm font-bold text-white shadow-xl",
          c.border, `bg-gradient-to-br ${c.bg}`, c.glow
        )}>
          {rider.nama.charAt(0)}
        </div>
        <p className="max-w-[80px] md:max-w-[100px] text-[0.72rem] md:text-[0.78rem] font-semibold text-white leading-tight text-center truncate">
          {rider.nama.split(" ")[0]}
        </p>
        <p className={cn("text-[0.68rem] md:text-[0.72rem] font-bold", c.text)}>
          {numFmt(rider.total_km)} km
        </p>
      </motion.div>

      {/* Podium pillar */}
      <motion.div
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.25, delay: 0.1 + position * 0.05, ease: [0.4, 0, 0.2, 1] }}
        style={{ originY: 1 }}
        className={cn(
          "relative flex w-20 md:w-28 items-start justify-center rounded-t-2xl border pt-2",
          heights[position], c.border,
          `bg-gradient-to-b ${c.bg}`
        )}
      >
        <span className="text-xl">{labels[position]}</span>
      </motion.div>
    </div>
  );
}

/* ── Skeleton ─────────────────────────────────────────────────── */
function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 px-5 py-4 border-b border-[rgba(39,39,42,0.4)]">
      <div className="skeleton h-12 w-12 rounded-2xl flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="skeleton h-4 w-32 rounded" />
        <div className="skeleton h-3 w-48 rounded" />
        <div className="skeleton h-1.5 w-full rounded-full" />
      </div>
      <div className="skeleton h-6 w-16 rounded" />
    </div>
  );
}

/* ── Main Leaderboard ─────────────────────────────────────────── */
export default function Leaderboard({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [riders, setRiders] = useState<RankedRider[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [showAll, setShowAll] = useState(false);
  const isFirstLoad = useRef(true);

  const buildRanked = useCallback((raw: Rider[]): RankedRider[] => {
    const sorted = [...raw].sort((a, b) => (b.total_km || 0) - (a.total_km || 0));

    // Load previous rankings from localStorage
    const prevMap: Record<string, number> = (() => {
      try {
        return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}");
      } catch { return {}; }
    })();

    const ranked = sorted.map((r, i) => {
      const rank = i + 1;
      const runs = parseRuns(r.aktivitas);
      const avgKm = runs.length > 0 ? Math.round(runs.reduce((s, x) => s + x.km, 0) / runs.length) : 0;
      const prevRank = prevMap[r.id] ?? null;
      const delta = prevRank !== null ? prevRank - rank : null;
      return { ...r, rank, runs: runs.length, avgKm, prevRank, delta };
    });

    // Persist current rankings
    const currentMap: Record<string, number> = {};
    ranked.forEach((r) => { currentMap[r.id] = r.rank; });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentMap));

    return ranked;
  }, []);

  const fetchRiders = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .order("total_km", { ascending: false });
      if (error) throw error;
      setRiders(buildRanked(data || []));
      setLastUpdated(new Date());
      if (!isFirstLoad.current) toast.success("Leaderboard refreshed!");
      isFirstLoad.current = false;
    } catch {
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [buildRanked]);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  const top3 = riders.slice(0, 3) as (RankedRider & { rank: 1 | 2 | 3 })[];
  const rest = showAll ? riders.slice(3) : riders.slice(3, 10);
  const maxKm = riders[0]?.total_km ?? 1;

  const topbarActions = (
    <button
      onClick={() => fetchRiders(false)}
      disabled={loading}
      className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium disabled:opacity-40"
    >
      <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
      <span className="hidden sm:inline">Refresh</span>
    </button>
  );

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Leaderboard"
        subtitle={lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}` : "Loading…"}
        onMenuOpen={onMenuOpen}
        actions={topbarActions}
      />

      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 max-w-4xl mx-auto w-full">

        {/* Podium */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="glass-card mb-5 px-4 py-6 md:px-8 md:py-8"
        >
          <div className="mb-6 flex items-center gap-2">
            <Award size={18} className="text-amber-400" />
            <h2 className="text-[0.9rem] font-semibold text-white">Top Riders</h2>
            <span className="badge-gray ml-auto">{riders.length} riders total</span>
          </div>

          {loading ? (
            <div className="flex items-end justify-center gap-4 h-52">
              {[2, 1, 3].map((p) => (
                <div key={p} className={cn("skeleton rounded-t-2xl w-20", p === 1 ? "h-36" : p === 2 ? "h-28" : "h-20")} />
              ))}
            </div>
          ) : top3.length >= 3 ? (
            /* Podium layout: 2nd | 1st | 3rd */
            <div className="flex items-end justify-center gap-3 md:gap-5">
              {([top3[1], top3[0], top3[2]] as RankedRider[]).map((rider) => (
                <PodiumBlock
                  key={rider.id}
                  rider={rider}
                  position={rider.rank as 1 | 2 | 3}
                />
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-[0.8rem] text-[#71717A]">Not enough data</p>
          )}
        </motion.div>

        {/* Full rankings list */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          <div className="border-b border-[rgba(39,39,42,0.6)] px-5 py-3.5 flex items-center justify-between">
            <div>
              <h3 className="text-[0.88rem] font-semibold text-white">Full Rankings</h3>
              <p className="text-[0.66rem] text-[#71717A] mt-0.5">By total kilometers ridden</p>
            </div>
            <div className="flex items-center gap-3 text-[0.62rem] text-[#52525B]">
              <span className="flex items-center gap-1"><TrendingUp size={10} className="text-green-400" /> Moved up</span>
              <span className="flex items-center gap-1"><TrendingDown size={10} className="text-red-400" /> Moved down</span>
            </div>
          </div>

          {loading ? (
            Array.from({ length: 7 }).map((_, i) => <SkeletonRow key={i} />)
          ) : riders.length === 0 ? (
            <p className="py-12 text-center text-[0.8rem] text-[#71717A]">No data available</p>
          ) : (
            <>
              {/* Top 3 in list */}
              {riders.slice(0, 3).map((rider, i) => (
                <RiderRow key={rider.id} rider={rider} index={i} maxKm={maxKm} isTop3 />
              ))}

              {/* Divider */}
              {riders.length > 3 && (
                <div className="flex items-center gap-3 px-5 py-2 bg-[rgba(255,255,255,0.015)] border-y border-[rgba(39,39,42,0.4)]">
                  <div className="h-px flex-1 bg-[rgba(39,39,42,0.8)]" />
                  <span className="text-[0.62rem] font-medium uppercase tracking-widest text-[#3F3F46]">Chasing the podium</span>
                  <div className="h-px flex-1 bg-[rgba(39,39,42,0.8)]" />
                </div>
              )}

              {/* Rest */}
              {rest.map((rider, i) => (
                <RiderRow key={rider.id} rider={rider} index={i + 3} maxKm={maxKm} />
              ))}

              {/* Show all toggle */}
              {riders.length > 10 && (
                <div className="border-t border-[rgba(39,39,42,0.4)] px-5 py-3">
                  <button
                    onClick={() => setShowAll((s) => !s)}
                    className="btn-ghost flex w-full items-center justify-center gap-1.5 py-2 text-[0.76rem] text-[#71717A] hover:text-white transition-colors"
                  >
                    {showAll ? "Show top 10 only" : `Show all ${riders.length - 3} remaining riders`}
                    <ChevronRight size={13} className={cn("transition-transform", showAll && "rotate-90")} />
                  </button>
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Legend / tips */}
        {!loading && riders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3"
          >
            {[
              { label: "Total Riders", value: riders.length, icon: "👥" },
              { label: "Total KM Logged", value: `${numFmt(riders.reduce((s, r) => s + (r.total_km || 0), 0))} km`, icon: "🛣️" },
              { label: "Top KM", value: `${numFmt(riders[0]?.total_km || 0)} km`, icon: "🏆" },
            ].map(({ label, value, icon }) => (
              <div key={label} className="glass-card px-4 py-3 text-center">
                <div className="text-xl mb-1">{icon}</div>
                <p className="text-[0.72rem] text-[#71717A]">{label}</p>
                <p className="text-[0.92rem] font-bold text-white mt-0.5">{typeof value === "number" ? value.toLocaleString("id-ID") : value}</p>
              </div>
            ))}
          </motion.div>
        )}

        <p className="mt-5 text-center text-[0.6rem] text-[#3F3F46] tracking-widest uppercase pb-2">
          Revolt Riders MC — Mandatory Ride
        </p>
      </div>
    </div>
  );
}

/* ── Rider row ──────────────────────────────────────────────────── */
function RiderRow({ rider, index, maxKm, isTop3 = false }: {
  rider: RankedRider; index: number; maxKm: number; isTop3?: boolean;
}) {
  const rankColors = {
    1: "text-amber-400 border-amber-500/30 bg-amber-500/10",
    2: "text-slate-400 border-slate-500/30 bg-slate-400/10",
    3: "text-amber-600 border-amber-700/30 bg-amber-700/10",
  };
  const topColor = rankColors[rider.rank as 1 | 2 | 3];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.025, 0.25) }}
      className={cn(
        "flex items-center gap-3 md:gap-4 px-4 md:px-5 py-3.5 border-b border-[rgba(39,39,42,0.4)] last:border-0 transition-colors hover:bg-[rgba(255,255,255,0.02)]",
        isTop3 && rider.rank === 1 && "bg-[rgba(245,158,11,0.04)]",
        isTop3 && rider.rank === 2 && "bg-[rgba(148,163,184,0.03)]",
        isTop3 && rider.rank === 3 && "bg-[rgba(180,83,9,0.03)]",
      )}
    >
      {/* Rank number */}
      <div className={cn(
        "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border text-sm font-bold",
        isTop3 ? topColor : "text-[#52525B] border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.02)]"
      )}>
        {isTop3 ? (
          rider.rank === 1 ? <Flame size={16} /> : rider.rank === 2 ? <Award size={15} /> : <Sparkles size={15} />
        ) : rider.rank}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[0.85rem] font-semibold text-white truncate">{rider.nama}</span>
          <span className={rankBadgeClass(rider.jabatan)}>{rider.jabatan}</span>
        </div>
        <div className="flex items-center gap-3 text-[0.66rem] text-[#71717A] mb-1.5">
          {rider.alamat && <span className="truncate max-w-[100px]">{rider.alamat}</span>}
          <span className="flex items-center gap-0.5"><Route size={9} /> {rider.runs} runs</span>
          {rider.avgKm > 0 && <span>avg {numFmt(rider.avgKm)} km/run</span>}
        </div>
        <KmBar value={rider.total_km} max={maxKm} rank={rider.rank} />
      </div>

      {/* KM + delta */}
      <div className="flex-shrink-0 text-right flex flex-col items-end gap-1">
        <span className={cn("text-[0.95rem] font-bold", isTop3 ? (rider.rank === 1 ? "text-amber-400" : rider.rank === 2 ? "text-slate-400" : "text-amber-600") : "text-[#8B5CF6]")}>
          <AnimatedNumber value={rider.total_km || 0} />
        </span>
        <div className="flex items-center gap-1">
          <span className="text-[0.58rem] text-[#52525B]">km</span>
          <DeltaBadge delta={rider.delta} />
        </div>
      </div>
    </motion.div>
  );
}
