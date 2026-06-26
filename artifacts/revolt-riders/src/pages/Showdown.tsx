import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Swords, Flame, Route, Activity, Medal, CalendarDays, MapPin, Sparkles, RotateCcw, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, parseRuns, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

interface EnrichedRider extends Rider {
  runs: number;
  avgKm: number;
  topRun: number;
  seniorityYears: number;
  longestStreak: number;
}

function enrich(r: Rider): EnrichedRider {
  const parsed = parseRuns(r.aktivitas);
  const runs = parsed.length;
  const avgKm = runs > 0 ? Math.round(parsed.reduce((s, x) => s + x.km, 0) / runs) : 0;
  const topRun = runs > 0 ? Math.max(...parsed.map((x) => x.km)) : 0;
  const joinYear = r.bergabung ? new Date(r.bergabung).getFullYear() : null;
  const seniorityYears = joinYear ? new Date().getFullYear() - joinYear : 0;
  return { ...r, runs, avgKm, topRun, seniorityYears, longestStreak: runs };
}

const RANK_WEIGHT: Record<string, number> = {
  FOUNDER: 8, PRESIDENT: 7, EXCECUTOR: 6, NEGOSIATOR: 5,
  "LIFE MEMBER": 4, VIRGIN: 3, CAPROS: 2, PROSPEK: 1,
};

function rankWeight(jabatan: string) {
  return RANK_WEIGHT[jabatan?.toUpperCase()] ?? 0;
}

interface StatLine {
  label: string;
  icon: React.ReactNode;
  aVal: number;
  bVal: number;
  fmt: (n: number) => string;
  higherWins: boolean;
}

function buildStats(a: EnrichedRider, b: EnrichedRider): StatLine[] {
  return [
    { label: "Total KM", icon: <Activity size={13} />, aVal: a.total_km, bVal: b.total_km, fmt: (n) => `${numFmt(n)} km`, higherWins: true },
    { label: "Total Runs", icon: <Route size={13} />, aVal: a.runs, bVal: b.runs, fmt: (n) => `${n} runs`, higherWins: true },
    { label: "Avg KM / Run", icon: <Sparkles size={13} />, aVal: a.avgKm, bVal: b.avgKm, fmt: (n) => `${numFmt(n)} km`, higherWins: true },
    { label: "Best Single Run", icon: <Medal size={13} />, aVal: a.topRun, bVal: b.topRun, fmt: (n) => `${numFmt(n)} km`, higherWins: true },
    { label: "Seniority", icon: <CalendarDays size={13} />, aVal: a.seniorityYears, bVal: b.seniorityYears, fmt: (n) => `${n} yr${n !== 1 ? "s" : ""}`, higherWins: true },
    { label: "Rank Weight", icon: <Flame size={13} />, aVal: rankWeight(a.jabatan), bVal: rankWeight(b.jabatan), fmt: () => "", higherWins: true },
  ];
}

function StatBar({ stat, delay }: { stat: StatLine; delay: number }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  const total = stat.aVal + stat.bVal;
  const aW = total === 0 ? 50 : (stat.aVal / total) * 100;
  const bW = 100 - aW;

  const aWins = stat.higherWins ? stat.aVal > stat.bVal : stat.aVal < stat.bVal;
  const bWins = stat.higherWins ? stat.bVal > stat.aVal : stat.bVal < stat.aVal;
  const tie = stat.aVal === stat.bVal;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2, delay: delay / 1000 }}
      className="glass-card px-4 py-3.5"
    >
      <div className="flex items-center justify-between mb-2.5">
        <span className={cn(
          "text-[0.82rem] font-bold truncate max-w-[100px]",
          aWins ? "text-purple-400" : tie ? "text-[#71717A]" : "text-[#52525B]"
        )}>
          {stat.label === "Rank Weight" ? "" : stat.fmt(stat.aVal)}
          {aWins && <span className="ml-1 text-[0.6rem] text-purple-400">▲ WIN</span>}
        </span>
        <div className="flex items-center gap-1.5 text-[0.62rem] font-semibold text-[#52525B] uppercase tracking-wider">
          {stat.icon}
          {stat.label}
        </div>
        <span className={cn(
          "text-[0.82rem] font-bold truncate max-w-[100px] text-right",
          bWins ? "text-orange-400" : tie ? "text-[#71717A]" : "text-[#52525B]"
        )}>
          {bWins && <span className="mr-1 text-[0.6rem] text-orange-400">WIN ▲</span>}
          {stat.label === "Rank Weight" ? "" : stat.fmt(stat.bVal)}
        </span>
      </div>

      {/* Bar */}
      <div className="flex h-2 overflow-hidden rounded-full">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: animated ? `${aW}%` : "0%" }}
          transition={{ duration: 0.6, delay: delay / 1000 + 0.05, ease: [0.4, 0, 0.2, 1] }}
          className={cn("h-full rounded-l-full", aWins ? "bg-purple-500" : tie ? "bg-[#3F3F46]" : "bg-[#2D2D35]")}
        />
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: animated ? `${bW}%` : "0%" }}
          transition={{ duration: 0.6, delay: delay / 1000 + 0.05, ease: [0.4, 0, 0.2, 1] }}
          className={cn("h-full rounded-r-full", bWins ? "bg-orange-500" : tie ? "bg-[#3F3F46]" : "bg-[#2D2D35]")}
        />
      </div>

      {tie && (
        <p className="text-center text-[0.58rem] mt-1 text-[#52525B] uppercase tracking-widest">Tie</p>
      )}
    </motion.div>
  );
}

function RiderPicker({
  riders,
  selected,
  onSelect,
  side,
}: {
  riders: Rider[];
  selected: Rider | null;
  onSelect: (r: Rider) => void;
  side: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  const filtered = riders.filter((r) =>
    r.nama.toLowerCase().includes(query.toLowerCase()) ||
    r.alamat?.toLowerCase().includes(query.toLowerCase())
  );

  const accentClass = side === "left"
    ? "border-purple-500/40 bg-purple-500/10 text-purple-300"
    : "border-orange-500/40 bg-orange-500/10 text-orange-300";

  return (
    <div className="relative flex-1 min-w-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "w-full glass-card px-4 py-4 flex items-center gap-3 transition-all border hover:border-[rgba(139,92,246,0.3)]",
          selected ? "" : "border-dashed"
        )}
      >
        {selected ? (
          <>
            <div className={cn(
              "flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold border",
              accentClass
            )}>
              {selected.nama.charAt(0)}
            </div>
            <div className="flex-1 text-left min-w-0">
              <p className="text-[0.85rem] font-semibold text-white truncate">{selected.nama}</p>
              <p className="text-[0.65rem] text-[#71717A]">{selected.jabatan}</p>
            </div>
          </>
        ) : (
          <div className="flex-1 text-left">
            <p className="text-[0.78rem] text-[#52525B]">Select a rider…</p>
          </div>
        )}
        <ChevronDown size={14} className={cn("flex-shrink-0 text-[#52525B] transition-transform", open && "rotate-180")} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scaleY: 0.9 }}
            animate={{ opacity: 1, y: 0, scaleY: 1 }}
            exit={{ opacity: 0, y: -6, scaleY: 0.9 }}
            transition={{ duration: 0.15 }}
            style={{ transformOrigin: "top" }}
            className="absolute top-full mt-1.5 left-0 right-0 z-50 glass-card overflow-hidden shadow-2xl shadow-black/60"
          >
            <div className="p-2 border-b border-[rgba(39,39,42,0.6)]">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search riders…"
                className="w-full bg-transparent px-2 py-1.5 text-[0.78rem] text-white placeholder-[#52525B] outline-none"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.length === 0 ? (
                <p className="py-6 text-center text-[0.72rem] text-[#52525B]">No riders found</p>
              ) : filtered.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { onSelect(r); setOpen(false); setQuery(""); }}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-[rgba(255,255,255,0.04)] transition-colors border-b border-[rgba(39,39,42,0.3)] last:border-0"
                >
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-[rgba(139,92,246,0.15)] text-[0.7rem] font-bold text-purple-300">
                    {r.nama.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.78rem] font-medium text-white truncate">{r.nama}</p>
                    <p className="text-[0.62rem] text-[#71717A]">{r.jabatan} · {r.alamat || "—"}</p>
                  </div>
                  <span className="ml-auto text-[0.7rem] font-bold text-[#8B5CF6] flex-shrink-0">{numFmt(r.total_km)} km</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HeroCard({
  rider,
  enriched,
  side,
  wins,
  score,
  totalCategories,
}: {
  rider: Rider;
  enriched: EnrichedRider;
  side: "left" | "right";
  wins: number;
  score: number;
  totalCategories: number;
}) {
  const isChamp = wins > totalCategories / 2;
  const accent = side === "left"
    ? { ring: "ring-purple-500/50", bg: "from-purple-500/20 to-purple-900/5", text: "text-purple-400", badge: "bg-purple-500/15 text-purple-300 border-purple-500/30" }
    : { ring: "ring-orange-500/50", bg: "from-orange-500/20 to-orange-900/5", text: "text-orange-400", badge: "bg-orange-500/15 text-orange-300 border-orange-500/30" };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={cn(
        "glass-card p-4 md:p-6 flex flex-col items-center text-center relative overflow-hidden",
        isChamp && `ring-2 ${accent.ring}`
      )}
    >
      {isChamp && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.6, type: "spring", stiffness: 200 }}
          className="absolute -top-1 -right-1"
        >
          <div className="bg-gradient-to-br from-amber-400 to-yellow-500 text-black text-[0.6rem] font-black px-2 py-0.5 rounded-bl-xl rounded-tr-xl tracking-widest uppercase">
            CHAMPION
          </div>
        </motion.div>
      )}

      {/* Avatar */}
      <div className={cn(
        "flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-2xl bg-gradient-to-br mb-3 text-2xl font-black text-white border",
        accent.bg, `border-${side === "left" ? "purple" : "orange"}-500/30`
      )}>
        {rider.nama.charAt(0)}
      </div>

      <h3 className="text-[0.95rem] md:text-[1rem] font-bold text-white mb-0.5">{rider.nama}</h3>
      <span className={cn("text-[0.65rem] font-semibold px-2 py-0.5 rounded-full border mb-3", accent.badge)}>
        {rider.jabatan}
      </span>

      {rider.alamat && (
        <p className="flex items-center gap-1 text-[0.65rem] text-[#71717A] mb-3">
          <MapPin size={9} />{rider.alamat}
        </p>
      )}

      <div className="w-full space-y-1.5 text-[0.72rem]">
        <div className="flex justify-between">
          <span className="text-[#71717A]">Total KM</span>
          <span className={cn("font-bold", accent.text)}>{numFmt(enriched.total_km)} km</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#71717A]">Runs</span>
          <span className="font-semibold text-white">{enriched.runs}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-[#71717A]">Avg / Run</span>
          <span className="font-semibold text-white">{numFmt(enriched.avgKm)} km</span>
        </div>
      </div>

      <div className="mt-4 w-full rounded-xl bg-[rgba(255,255,255,0.04)] px-3 py-2.5">
        <p className="text-[0.58rem] uppercase tracking-widest text-[#52525B] mb-1">Battle Score</p>
        <p className={cn("text-[1.6rem] font-black tabular-nums", accent.text)}>
          {wins}
          <span className="text-[0.7rem] font-medium text-[#52525B]">/{totalCategories}</span>
        </p>
      </div>
    </motion.div>
  );
}

export default function Showdown({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [allRiders, setAllRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [riderA, setRiderA] = useState<Rider | null>(null);
  const [riderB, setRiderB] = useState<Rider | null>(null);
  const [battleKey, setBattleKey] = useState(0);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("riders")
        .select("*")
        .order("total_km", { ascending: false });
      if (error) throw error;
      setAllRiders(data || []);
    } catch {
      toast.error("Failed to load riders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  const enrichedA = riderA ? enrich(riderA) : null;
  const enrichedB = riderB ? enrich(riderB) : null;

  const stats = enrichedA && enrichedB ? buildStats(enrichedA, enrichedB) : [];

  const aWins = stats.filter((s) => s.aVal > s.bVal).length;
  const bWins = stats.filter((s) => s.bVal > s.aVal).length;
  const ties = stats.filter((s) => s.aVal === s.bVal).length;
  const displayableStats = stats.filter((s) => s.label !== "Rank Weight");

  const handleBattle = () => {
    if (!riderA || !riderB) { toast.error("Pick two riders first!"); return; }
    if (riderA.id === riderB.id) { toast.error("Pick two different riders!"); return; }
    setBattleKey((k) => k + 1);
  };

  const availableForB = allRiders.filter((r) => r.id !== riderA?.id);
  const availableForA = allRiders.filter((r) => r.id !== riderB?.id);

  const ready = riderA && riderB && riderA.id !== riderB.id;

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Rider Showdown"
        subtitle="Head-to-head battle — pick two riders"
        onMenuOpen={onMenuOpen}
        actions={
          <button
            onClick={fetchRiders}
            disabled={loading}
            className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium disabled:opacity-40"
          >
            <RotateCcw size={13} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        }
      />

      <div className="flex-1 px-3 md:px-6 py-4 md:py-6 max-w-3xl mx-auto w-full space-y-5">

        {/* Picker row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="glass-card p-4 md:p-5"
        >
          <div className="flex items-center gap-2 mb-4">
            <Swords size={16} className="text-[#8B5CF6]" />
            <h2 className="text-[0.88rem] font-semibold text-white">Choose Your Fighters</h2>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <RiderPicker riders={availableForA} selected={riderA} onSelect={setRiderA} side="left" />

            <div className="flex-shrink-0 flex flex-col items-center gap-1">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] shadow-lg shadow-purple-900/40">
                <span className="text-[0.7rem] font-black text-white">VS</span>
              </div>
            </div>

            <RiderPicker riders={availableForB} selected={riderB} onSelect={setRiderB} side="right" />
          </div>

          <button
            onClick={handleBattle}
            disabled={!ready}
            className={cn(
              "mt-4 w-full py-3 rounded-xl text-[0.8rem] font-bold tracking-wide transition-all duration-200",
              ready
                ? "bg-gradient-to-r from-purple-600 to-violet-600 text-white hover:from-purple-500 hover:to-violet-500 shadow-lg shadow-purple-900/40 hover:shadow-purple-900/60 hover:-translate-y-0.5"
                : "bg-[rgba(255,255,255,0.04)] text-[#52525B] cursor-not-allowed"
            )}
          >
            {ready ? "⚔️  START BATTLE" : "Select two riders to begin"}
          </button>
        </motion.div>

        {/* Battle results */}
        <AnimatePresence mode="wait">
          {battleKey > 0 && enrichedA && enrichedB && (
            <motion.div
              key={battleKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="space-y-4"
            >
              {/* Score header */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2, delay: 0.05 }}
                className="glass-card px-4 py-3 flex items-center justify-between"
              >
                <span className={cn("text-[1.3rem] font-black tabular-nums", aWins > bWins ? "text-purple-400" : "text-[#52525B]")}>{aWins}</span>
                <div className="flex flex-col items-center gap-0.5">
                  <p className="text-[0.58rem] uppercase tracking-widest text-[#52525B]">Battle Result</p>
                  {aWins > bWins && <p className="text-[0.65rem] font-bold text-amber-400">🏆 {enrichedA.nama.split(" ")[0]} wins!</p>}
                  {bWins > aWins && <p className="text-[0.65rem] font-bold text-amber-400">🏆 {enrichedB.nama.split(" ")[0]} wins!</p>}
                  {aWins === bWins && <p className="text-[0.65rem] font-bold text-[#71717A]">⚡ It's a draw!</p>}
                  {ties > 0 && <p className="text-[0.55rem] text-[#3F3F46]">{ties} tied categor{ties > 1 ? "ies" : "y"}</p>}
                </div>
                <span className={cn("text-[1.3rem] font-black tabular-nums", bWins > aWins ? "text-orange-400" : "text-[#52525B]")}>{bWins}</span>
              </motion.div>

              {/* Hero cards */}
              <div className="grid grid-cols-2 gap-3">
                <HeroCard
                  rider={enrichedA}
                  enriched={enrichedA}
                  side="left"
                  wins={aWins}
                  score={aWins}
                  totalCategories={stats.length}
                />
                <HeroCard
                  rider={enrichedB}
                  enriched={enrichedB}
                  side="right"
                  wins={bWins}
                  score={bWins}
                  totalCategories={stats.length}
                />
              </div>

              {/* Category bars */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[0.62rem] uppercase tracking-widest text-purple-400 font-semibold">{enrichedA.nama.split(" ")[0]}</span>
                  <span className="text-[0.62rem] uppercase tracking-widest text-[#52525B] font-semibold">Categories</span>
                  <span className="text-[0.62rem] uppercase tracking-widest text-orange-400 font-semibold">{enrichedB.nama.split(" ")[0]}</span>
                </div>
                {displayableStats.map((stat, i) => (
                  <StatBar key={stat.label} stat={stat} delay={i * 80} />
                ))}
              </div>

              {/* Mutual runs */}
              <MutualRuns a={enrichedA} b={enrichedB} />

            </motion.div>
          )}
        </AnimatePresence>

        {battleKey === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="glass-card px-6 py-16 flex flex-col items-center gap-3 text-center"
          >
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED]/20 to-[#A855F7]/10 border border-purple-500/20 mb-2">
              <Swords size={28} className="text-purple-400" />
            </div>
            <h3 className="text-[0.9rem] font-semibold text-white">No battle yet</h3>
            <p className="text-[0.75rem] text-[#71717A] max-w-xs">
              Pick two riders above and hit <span className="text-purple-400 font-semibold">Start Battle</span> to see a head-to-head breakdown across every stat.
            </p>
          </motion.div>
        )}

        <p className="text-center text-[0.6rem] text-[#3F3F46] tracking-widest uppercase pb-2">
          Revolt Riders MC — Mandatory Ride
        </p>
      </div>
    </div>
  );
}

function MutualRuns({ a, b }: { a: EnrichedRider; b: EnrichedRider }) {
  const aRuns = parseRuns(a.aktivitas);
  const bRuns = parseRuns(b.aktivitas);
  const aNames = new Set(aRuns.map((r) => r.nama.toLowerCase()));
  const shared = bRuns.filter((r) => aNames.has(r.nama.toLowerCase()));

  if (shared.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5 }}
      className="glass-card overflow-hidden"
    >
      <div className="border-b border-[rgba(39,39,42,0.6)] px-4 py-3">
        <h4 className="text-[0.82rem] font-semibold text-white">Ridden Together</h4>
        <p className="text-[0.64rem] text-[#71717A] mt-0.5">{shared.length} shared run{shared.length > 1 ? "s" : ""}</p>
      </div>
      <div className="divide-y divide-[rgba(39,39,42,0.4)]">
        {shared.slice(0, 6).map((run, i) => {
          const aKm = aRuns.find((r) => r.nama.toLowerCase() === run.nama.toLowerCase())?.km ?? 0;
          const bKm = run.km;
          return (
            <motion.div
              key={run.nama}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 + i * 0.04 }}
              className="flex items-center gap-3 px-4 py-2.5"
            >
              <Route size={11} className="text-[#52525B] flex-shrink-0" />
              <span className="flex-1 text-[0.75rem] text-white truncate">{run.nama}</span>
              <span className="text-[0.68rem] text-purple-400 font-semibold">{numFmt(aKm)} km</span>
              <span className="text-[0.58rem] text-[#3F3F46]">vs</span>
              <span className="text-[0.68rem] text-orange-400 font-semibold">{numFmt(bKm)} km</span>
            </motion.div>
          );
        })}
        {shared.length > 6 && (
          <p className="px-4 py-2 text-[0.62rem] text-[#52525B]">+{shared.length - 6} more shared runs</p>
        )}
      </div>
    </motion.div>
  );
}
