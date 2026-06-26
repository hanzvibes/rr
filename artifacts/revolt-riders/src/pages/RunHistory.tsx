import { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Route, Users2, Activity, Search, ChevronDown,
  ChevronRight, ArrowUpDown, MapPin, Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, parseRuns, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

/* ── Types ──────────────────────────────────────────────────────── */
interface RunEvent {
  name: string;
  totalKm: number;
  riderCount: number;
  totalRiders: number;
  participants: { name: string; km: number; jabatan: string }[];
  avgKm: number;
  maxKm: number;
}

type SortMode = "riders" | "km" | "alpha" | "avg";

/* ── Badge ──────────────────────────────────────────────────────── */
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

/* ── Animated counter ───────────────────────────────────────────── */
function Num({ v }: { v: number }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    const start = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - start) / 800, 1);
      setD(Math.round(v * (1 - Math.pow(1 - t, 3))));
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [v]);
  return <>{d.toLocaleString("id-ID")}</>;
}

/* ── Participation bar ──────────────────────────────────────────── */
function ParticipationBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="h-1 w-full overflow-hidden rounded-full bg-[rgba(255,255,255,0.05)]">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
        className="h-full rounded-full bg-gradient-to-r from-[#7C3AED] to-[#A855F7]"
      />
    </div>
  );
}

/* ── Run card ───────────────────────────────────────────────────── */
function RunCard({
  run, index, maxRiders, isTimeline,
}: {
  run: RunEvent; index: number; maxRiders: number; isTimeline: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = Math.round((run.riderCount / run.totalRiders) * 100);

  return (
    <div className="relative flex gap-4">
      {/* Timeline connector (desktop only) */}
      {isTimeline && (
        <div className="hidden md:flex flex-col items-center flex-shrink-0 mt-1">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.04, duration: 0.2 }}
            className={cn(
              "h-3 w-3 rounded-full border-2 flex-shrink-0 z-10",
              index === 0
                ? "border-amber-400 bg-amber-400/30"
                : "border-[#8B5CF6] bg-[#8B5CF6]/20"
            )}
          />
          <div className="w-px flex-1 bg-gradient-to-b from-[rgba(139,92,246,0.3)] to-transparent mt-1" style={{ minHeight: 40 }} />
        </div>
      )}

      {/* Card */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.15, delay: Math.min(index * 0.025, 0.3) }}
        className="glass-card flex-1 mb-3 overflow-hidden"
      >
        {/* Header */}
        <button
          onClick={() => setExpanded((e) => !e)}
          className="w-full p-4 md:p-5 text-left"
        >
          <div className="flex items-start gap-3">
            <div className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl",
              index === 0
                ? "bg-gradient-to-br from-amber-500/20 to-yellow-600/10 border border-amber-500/30 text-amber-400"
                : "bg-gradient-to-br from-[#7C3AED]/20 to-[#A855F7]/10 border border-[#8B5CF6]/20 text-[#8B5CF6]"
            )}>
              {index === 0 ? <Sparkles size={18} /> : <Route size={16} />}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-[0.88rem] md:text-[0.92rem] font-semibold text-white leading-snug pr-2 truncate">
                  {run.name}
                </h3>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {index === 0 && (
                    <span className="badge-yellow hidden sm:inline">Most popular</span>
                  )}
                  {expanded ? <ChevronDown size={14} className="text-[#71717A]" /> : <ChevronRight size={14} className="text-[#71717A]" />}
                </div>
              </div>

              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[0.7rem] text-[#71717A]">
                <span className="flex items-center gap-1">
                  <Users2 size={11} />
                  <strong className="text-[#A1A1AA]">{run.riderCount}</strong> riders
                  <span className="text-[#52525B]">({pct}%)</span>
                </span>
                <span className="flex items-center gap-1">
                  <Activity size={11} />
                  <strong className="text-[#A1A1AA]">{numFmt(run.totalKm)}</strong> km total
                </span>
                <span className="flex items-center gap-1">
                  <MapPin size={11} />
                  avg <strong className="text-[#A1A1AA]">{numFmt(run.avgKm)}</strong> km
                </span>
              </div>

              <div className="mt-2.5">
                <ParticipationBar value={run.riderCount} max={maxRiders} />
              </div>
            </div>
          </div>
        </button>

        {/* Expanded participant list */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden border-t border-[rgba(39,39,42,0.6)]"
            >
              <div className="px-4 md:px-5 py-3">
                <p className="mb-2.5 text-[0.66rem] font-medium uppercase tracking-widest text-[#71717A]">
                  Participants ({run.riderCount})
                </p>
                <div className="space-y-1.5">
                  {run.participants
                    .sort((a, b) => b.km - a.km)
                    .map((p, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between rounded-xl px-3 py-2 bg-[rgba(255,255,255,0.02)] border border-[rgba(39,39,42,0.4)]"
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className="text-[0.62rem] font-medium text-[#52525B] w-4 flex-shrink-0">
                            {String(i + 1).padStart(2, "0")}
                          </span>
                          <span className="text-[0.78rem] text-[#A1A1AA] truncate">{p.name}</span>
                          <span className={cn(rankBadgeClass(p.jabatan), "hidden sm:inline")}>{p.jabatan}</span>
                        </div>
                        <span className="text-[0.78rem] font-semibold text-[#8B5CF6] flex-shrink-0 ml-2">
                          {numFmt(p.km)} km
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

/* ── Skeleton ───────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-card p-4 md:p-5 mb-3">
      <div className="flex items-start gap-3">
        <div className="skeleton h-10 w-10 rounded-xl flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="skeleton h-4 w-48 rounded" />
          <div className="skeleton h-3 w-64 rounded" />
          <div className="skeleton h-1 w-full rounded-full" />
        </div>
      </div>
    </div>
  );
}

/* ── Main ───────────────────────────────────────────────────────── */
export default function RunHistory({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortMode>("riders");
  const [viewMode, setViewMode] = useState<"timeline" | "grid">("timeline");

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("riders").select("*");
      if (error) throw error;
      setRiders(data || []);
    } catch {
      toast.error("Failed to load run history");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  /* Build run events by aggregating across all riders */
  const runEvents = useMemo((): RunEvent[] => {
    const map = new Map<string, RunEvent>();

    for (const rider of riders) {
      const runs = parseRuns(rider.aktivitas);
      for (const run of runs) {
        const key = run.nama.trim().toLowerCase();
        const existing = map.get(key);
        if (existing) {
          existing.totalKm += run.km;
          existing.riderCount += 1;
          existing.maxKm = Math.max(existing.maxKm, run.km);
          existing.participants.push({ name: rider.nama, km: run.km, jabatan: rider.jabatan });
        } else {
          map.set(key, {
            name: run.nama.trim(),
            totalKm: run.km,
            riderCount: 1,
            totalRiders: riders.length,
            participants: [{ name: rider.nama, km: run.km, jabatan: rider.jabatan }],
            avgKm: run.km,
            maxKm: run.km,
          });
        }
      }
    }

    // Compute averages after aggregation
    for (const ev of map.values()) {
      ev.avgKm = Math.round(ev.totalKm / ev.riderCount);
      ev.totalRiders = riders.length;
    }

    return [...map.values()];
  }, [riders]);

  const sorted = useMemo(() => {
    let result = [...runEvents];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.name.toLowerCase().includes(q));
    }
    switch (sort) {
      case "riders": result.sort((a, b) => b.riderCount - a.riderCount); break;
      case "km": result.sort((a, b) => b.totalKm - a.totalKm); break;
      case "avg": result.sort((a, b) => b.avgKm - a.avgKm); break;
      case "alpha": result.sort((a, b) => a.name.localeCompare(b.name)); break;
    }
    return result;
  }, [runEvents, search, sort]);

  const stats = useMemo(() => {
    if (!runEvents.length) return null;
    const totalKm = runEvents.reduce((s, r) => s + r.totalKm, 0);
    const mostRiders = [...runEvents].sort((a, b) => b.riderCount - a.riderCount)[0];
    const longestRun = [...runEvents].sort((a, b) => b.avgKm - a.avgKm)[0];
    return { totalKm, uniqueRuns: runEvents.length, mostRiders, longestRun };
  }, [runEvents]);

  const maxRiders = sorted.length > 0 ? Math.max(...sorted.map((r) => r.riderCount)) : 1;

  const SORT_OPTIONS: { key: SortMode; label: string }[] = [
    { key: "riders", label: "Most Riders" },
    { key: "km", label: "Total KM" },
    { key: "avg", label: "Avg KM" },
    { key: "alpha", label: "A–Z" },
  ];

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Run History"
        subtitle={!loading ? `${stats?.uniqueRuns ?? 0} club runs · ${numFmt(stats?.totalKm ?? 0)} km total` : "Loading…"}
        onRefresh={fetchRiders}
        loading={loading}
        onMenuOpen={onMenuOpen}
      />

      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 max-w-4xl mx-auto w-full">

        {/* Stats summary */}
        {!loading && stats && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
          >
            {[
              { label: "Unique Runs", value: stats.uniqueRuns, suffix: "", icon: "🛣️" },
              { label: "Total KM Logged", value: stats.totalKm, suffix: " km", icon: "📍" },
              { label: "Most Riders", value: stats.mostRiders?.riderCount ?? 0, suffix: "", sub: stats.mostRiders?.name, icon: "👥" },
              { label: "Longest Avg", value: stats.longestRun?.avgKm ?? 0, suffix: " km", sub: stats.longestRun?.name, icon: "🏁" },
            ].map(({ label, value, suffix, sub, icon }) => (
              <div key={label} className="glass-card px-4 py-3.5">
                <div className="text-lg mb-1">{icon}</div>
                <p className="text-[0.62rem] font-medium uppercase tracking-wider text-[#71717A]">{label}</p>
                <p className="text-[1.05rem] font-bold text-white mt-0.5">
                  <Num v={value} />{suffix}
                </p>
                {sub && <p className="text-[0.62rem] text-[#52525B] mt-0.5 truncate">{sub}</p>}
              </div>
            ))}
          </motion.div>
        )}

        {/* Toolbar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, delay: 0.08 }}
          className="glass-card px-4 py-3 mb-4 flex flex-col sm:flex-row gap-3"
        >
          <div className="relative flex-1">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
            <input
              type="search"
              placeholder="Search run names…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-dark w-full pl-9 pr-3 py-2.5 text-[0.8rem]"
            />
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            <ArrowUpDown size={13} className="text-[#71717A] flex-shrink-0" />
            <div className="flex rounded-xl border border-[rgba(39,39,42,0.8)] overflow-hidden">
              {SORT_OPTIONS.map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={cn(
                    "px-3 py-2 text-[0.7rem] font-medium transition-colors border-r border-[rgba(39,39,42,0.6)] last:border-0 whitespace-nowrap",
                    sort === key
                      ? "bg-[#8B5CF6]/20 text-[#8B5CF6]"
                      : "text-[#71717A] hover:text-white hover:bg-[rgba(255,255,255,0.03)]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Timeline / Grid toggle */}
            <div className="flex rounded-xl border border-[rgba(39,39,42,0.8)] overflow-hidden">
              <button onClick={() => setViewMode("timeline")}
                className={cn("px-3 py-2 text-[0.7rem] transition-colors border-r border-[rgba(39,39,42,0.6)]",
                  viewMode === "timeline" ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "text-[#71717A] hover:text-white")}>
                Timeline
              </button>
              <button onClick={() => setViewMode("grid")}
                className={cn("px-3 py-2 text-[0.7rem] transition-colors",
                  viewMode === "grid" ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "text-[#71717A] hover:text-white")}>
                Grid
              </button>
            </div>
          </div>
        </motion.div>

        {/* Results count */}
        {!loading && (
          <p className="text-[0.7rem] text-[#52525B] mb-3 px-1">
            {sorted.length} run{sorted.length !== 1 ? "s" : ""}
            {search ? ` matching "${search}"` : ""}
          </p>
        )}

        {/* Run list */}
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
        ) : sorted.length === 0 ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="glass-card py-14 text-center">
            <div className="text-4xl mb-3">🏍️</div>
            <p className="text-[0.85rem] text-[#71717A]">No runs found{search ? ` for "${search}"` : ""}</p>
          </motion.div>
        ) : viewMode === "timeline" ? (
          <div className="md:pl-2">
            {sorted.map((run, i) => (
              <RunCard key={run.name} run={run} index={i} maxRiders={maxRiders} isTimeline />
            ))}
          </div>
        ) : (
          /* Grid view */
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {sorted.map((run, i) => (
              <RunCard key={run.name} run={run} index={i} maxRiders={maxRiders} isTimeline={false} />
            ))}
          </div>
        )}

        <p className="mt-5 text-center text-[0.6rem] text-[#3F3F46] tracking-widest uppercase pb-2">
          Revolt Riders MC — Mandatory Ride
        </p>
      </div>
    </div>
  );
}
