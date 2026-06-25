import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Gauge, TrendingUp, Crown, Bike, Star,
  Search, Download, ChevronUp, ChevronDown, X,
  ChevronRight, ArrowUpRight, Filter, LayoutGrid, List,
} from "lucide-react";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, parseRuns, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

const JABATAN_LIST = [
  "FOUNDER", "PRESIDENT", "EXCECUTOR", "NEGOSIATOR",
  "LIFE MEMBER", "VIRGIN", "CAPROS", "PROSPEK",
];

type SortKey = "no" | "nama" | "alamat" | "ttl" | "bergabung" | "jabatan" | "total_km" | "runs";
type SortDir = "asc" | "desc";

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

/* ── Animated counter ─────────────────────────────────────────── */
function AnimatedNumber({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef(value);
  useEffect(() => {
    const end = value;
    const duration = 900;
    const startTime = performance.now();
    function tick(now: number) {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(end * eased));
      if (progress < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
    ref.current = value;
  }, [value]);
  return <span>{display.toLocaleString("id-ID")}{suffix}</span>;
}

/* ── Sparkline ──────────────────────────────────────────────────── */
function Sparkline({ data }: { data: number[] }) {
  const pts = data.map((v, i) => ({ v, i }));
  return (
    <ResponsiveContainer width="100%" height={32}>
      <AreaChart data={pts} margin={{ top: 2, right: 0, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.4} />
            <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0} />
          </linearGradient>
        </defs>
        <Area type="monotone" dataKey="v" stroke="#8B5CF6" strokeWidth={1.5}
          fill="url(#sparkGrad)" dot={false} isAnimationActive={false} />
      </AreaChart>
    </ResponsiveContainer>
  );
}

/* ── Stat card ──────────────────────────────────────────────────── */
interface StatCardProps {
  label: string; value: number; suffix?: string; sub?: string;
  icon: React.ElementType; accent?: boolean; sparkline?: number[]; delay?: number;
}
function StatCard({ label, value, suffix = "", sub, icon: Icon, accent, sparkline, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18, delay }}
      className="glass-card p-4 md:p-5 flex flex-col gap-3"
    >
      <div className="flex items-start justify-between">
        <div className={cn(
          "flex h-9 w-9 items-center justify-center rounded-xl",
          accent
            ? "bg-gradient-to-br from-[#7C3AED]/30 to-[#A855F7]/20 border border-purple-500/20 text-[#A855F7]"
            : "bg-[rgba(255,255,255,0.06)] border border-[rgba(39,39,42,0.8)] text-[#71717A]"
        )}>
          <Icon size={16} />
        </div>
      </div>
      <div>
        <p className="text-[0.66rem] font-medium text-[#71717A] tracking-wide uppercase">{label}</p>
        <p className={cn("text-xl md:text-2xl font-bold mt-0.5 leading-none", accent ? "text-[#A855F7]" : "text-white")}>
          <AnimatedNumber value={value} suffix={suffix} />
        </p>
        {sub && <p className="mt-1 text-[0.65rem] text-[#71717A] truncate">{sub}</p>}
      </div>
      {sparkline && <Sparkline data={sparkline} />}
    </motion.div>
  );
}

/* ── Chart tooltip ──────────────────────────────────────────────── */
function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-[rgba(39,39,42,0.8)] bg-[#1E1E1E] px-3 py-2 shadow-xl">
      {label && <p className="mb-0.5 text-[0.65rem] text-[#71717A]">{label}</p>}
      <p className="text-sm font-semibold text-white">{numFmt(payload[0].value)} km</p>
    </div>
  );
}

/* ── Rider card (mobile view) ───────────────────────────────────── */
function RiderCard({ rider, onClick }: { rider: Rider; onClick: () => void }) {
  const runs = parseRuns(rider.aktivitas);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15 }}
      className="glass-card p-4 cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED]/20 to-[#A855F7]/10 text-[0.72rem] font-bold text-[#8B5CF6]">
            #{rider.no}
          </div>
          <div className="min-w-0">
            <p className="text-[0.85rem] font-semibold text-white truncate">{rider.nama}</p>
            <p className="text-[0.7rem] text-[#71717A] truncate">{rider.alamat || "—"}</p>
          </div>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-[0.95rem] font-bold text-[#8B5CF6]">{numFmt(rider.total_km || 0)}</p>
          <p className="text-[0.6rem] text-[#52525B]">km</p>
        </div>
      </div>
      <div className="flex items-center justify-between">
        <span className={rankBadgeClass(rider.jabatan)}>{rider.jabatan}</span>
        <div className="flex items-center gap-3 text-[0.65rem] text-[#71717A]">
          <span>{runs.length} runs</span>
          {rider.bergabung && <span>Patched {rider.bergabung}</span>}
        </div>
      </div>
    </motion.div>
  );
}

/* ── Runs expand cell ──────────────────────────────────────────── */
function RunsCell({ aktivitas }: { aktivitas: string }) {
  const [open, setOpen] = useState(false);
  const runs = parseRuns(aktivitas);
  if (!runs.length) return <span className="text-[#71717A]">—</span>;
  return (
    <div>
      <button
        className="flex items-center gap-1 text-[0.75rem] text-[#A1A1AA] hover:text-[#8B5CF6] transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen((o) => !o); }}
      >
        {runs.length}
        {open ? <ChevronUp size={11} /> : <ChevronRight size={11} />}
      </button>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="mt-1 space-y-0.5">
              {runs.map((r, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg px-2 py-1 bg-[rgba(139,92,246,0.06)]">
                  <span className="text-[0.62rem] text-[#71717A] truncate max-w-[100px]">{r.nama}</span>
                  <span className="text-[0.62rem] font-medium text-[#8B5CF6] ml-1.5">{numFmt(r.km)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Filter drawer (mobile) ─────────────────────────────────────── */
function FilterDrawer({
  open, onClose, filterJabatan, setFilterJabatan,
  filterTahun, setFilterTahun, tahunList,
}: {
  open: boolean; onClose: () => void;
  filterJabatan: string; setFilterJabatan: (v: string) => void;
  filterTahun: string; setFilterTahun: (v: string) => void;
  tahunList: string[];
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            transition={{ type: "tween", duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl border-t border-[rgba(39,39,42,0.8)] bg-[#111111] p-5 space-y-5"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-[0.88rem] font-semibold text-white">Filters</h3>
              <button onClick={onClose} className="btn-ghost h-8 w-8 flex items-center justify-center p-0">
                <X size={16} />
              </button>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium uppercase tracking-wider text-[#71717A] mb-2 block">Rank</label>
              <div className="flex flex-wrap gap-2">
                {["", ...JABATAN_LIST].map((j) => (
                  <button key={j}
                    onClick={() => setFilterJabatan(j)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[0.72rem] font-medium border transition-all",
                      filterJabatan === j
                        ? "bg-[#8B5CF6] border-[#8B5CF6] text-white"
                        : "border-[rgba(39,39,42,0.8)] text-[#71717A] hover:border-[#8B5CF6]/40"
                    )}
                  >{j || "All Ranks"}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[0.7rem] font-medium uppercase tracking-wider text-[#71717A] mb-2 block">Year Joined</label>
              <div className="flex flex-wrap gap-2">
                {["", ...tahunList].map((y) => (
                  <button key={y}
                    onClick={() => setFilterTahun(y)}
                    className={cn(
                      "px-3 py-1.5 rounded-full text-[0.72rem] font-medium border transition-all",
                      filterTahun === y
                        ? "bg-[#8B5CF6] border-[#8B5CF6] text-white"
                        : "border-[rgba(39,39,42,0.8)] text-[#71717A] hover:border-[#8B5CF6]/40"
                    )}
                  >{y || "All Years"}</button>
                ))}
              </div>
            </div>
            {(filterJabatan || filterTahun) && (
              <button onClick={() => { setFilterJabatan(""); setFilterTahun(""); onClose(); }}
                className="w-full btn-ghost py-2.5 text-[0.8rem] text-red-400">
                Clear All Filters
              </button>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ── Rider modal ────────────────────────────────────────────────── */
function RiderModal({ rider, onClose }: { rider: Rider; onClose: () => void }) {
  const runs = parseRuns(rider.aktivitas);
  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={onClose}>
        <motion.div
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ type: "tween", duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
          className="relative w-full sm:max-w-md overflow-hidden rounded-t-2xl sm:rounded-2xl border border-[rgba(39,39,42,0.8)] bg-[#111111] shadow-2xl shadow-black/60 max-h-[92dvh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Drag handle on mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="h-1 w-10 rounded-full bg-[#27272A]" />
          </div>

          {/* Header */}
          <div className="relative bg-gradient-to-br from-[#7C3AED]/20 via-[#111111] to-[#111111] px-5 py-4 border-b border-[rgba(39,39,42,0.6)]">
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/50 to-transparent" />
            <button onClick={onClose} className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:bg-[rgba(255,255,255,0.06)] hover:text-white transition-all">
              <X size={16} />
            </button>
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-sm font-bold text-white shadow-lg shadow-purple-900/30">
                #{rider.no}
              </div>
              <div>
                <h2 className="text-base font-semibold text-white pr-8">{rider.nama}</h2>
                <span className={rankBadgeClass(rider.jabatan)}>{rider.jabatan}</span>
              </div>
            </div>
          </div>

          <div className="px-5 py-4 space-y-4">
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { label: "Chapter", value: rider.alamat },
                { label: "TTL", value: rider.ttl },
                { label: "Patched", value: rider.bergabung },
                { label: "Rank", value: rider.jabatan },
              ].map(({ label, value }) => (
                <div key={label} className="rounded-xl border border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.02)] p-3">
                  <p className="text-[0.62rem] font-medium uppercase tracking-widest text-[#71717A]">{label}</p>
                  <p className="mt-1 text-[0.78rem] text-[#A1A1AA] break-words">{value || "—"}</p>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-[rgba(139,92,246,0.2)] bg-gradient-to-br from-[rgba(139,92,246,0.1)] to-transparent p-4 text-center">
              <p className="text-[0.62rem] font-medium uppercase tracking-widest text-[#8B5CF6]">Total Distance</p>
              <p className="mt-1 text-4xl font-bold text-white">
                {numFmt(rider.total_km)} <span className="text-xl text-[#8B5CF6]">km</span>
              </p>
            </div>

            {runs.length > 0 && (
              <div>
                <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-widest text-[#71717A]">Run Log ({runs.length})</p>
                <div className="rounded-xl border border-[rgba(39,39,42,0.6)] divide-y divide-[rgba(39,39,42,0.4)]">
                  {runs.map((r, i) => (
                    <div key={i} className="flex items-center justify-between px-4 py-2.5 hover:bg-[rgba(139,92,246,0.05)] transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-[0.62rem] font-medium text-[#71717A] flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                        <span className="text-[0.75rem] text-[#A1A1AA] truncate">{r.nama}</span>
                      </div>
                      <span className="text-[0.75rem] font-semibold text-[#8B5CF6] flex-shrink-0 ml-2">{numFmt(r.km)} km</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ── Skeleton ──────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="glass-card p-4 md:p-5 space-y-3">
      <div className="skeleton h-9 w-9 rounded-xl" />
      <div className="skeleton h-3 w-16 rounded" />
      <div className="skeleton h-6 w-24 rounded" />
      <div className="skeleton h-8 w-full rounded" />
    </div>
  );
}

/* ── Dashboard ─────────────────────────────────────────────────── */
export default function Dashboard({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);
  const [viewMode, setViewMode] = useState<"table" | "cards">("table");
  const [filterOpen, setFilterOpen] = useState(false);

  const fetchRiders = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const { data, error: err } = await supabase.from("riders").select("*").order("no", { ascending: true });
      if (err) throw err;
      setRiders(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load");
      toast.error("Failed to load riders");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "e") { e.preventDefault(); handleExport(); }
      if (e.key === "Escape") setSelectedRider(null);
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [riders]);

  const stats = useMemo(() => {
    if (!riders.length) return null;
    const totalKm = riders.reduce((s, r) => s + (r.total_km || 0), 0);
    const avgKm = Math.round(totalKm / riders.length);
    const topRider = [...riders].sort((a, b) => b.total_km - a.total_km)[0];
    const runs = riders.reduce((s, r) => s + parseRuns(r.aktivitas).length, 0);
    const founders = riders.filter((r) => r.jabatan?.toUpperCase() === "FOUNDER").length;
    return { totalKm, avgKm, topRider, runs, founders };
  }, [riders]);

  const sparklineKm = useMemo(() =>
    [...riders].sort((a, b) => a.total_km - b.total_km).slice(-10).map((r) => r.total_km || 0),
  [riders]);

  const areaData = useMemo(() =>
    [...riders].sort((a, b) => b.total_km - a.total_km).slice(0, 15).map((r) => ({
      name: r.nama?.split(" ")[0] ?? "—",
      km: r.total_km || 0,
    })), [riders]);

  const barData = useMemo(() =>
    JABATAN_LIST
      .map((j) => ({ name: j === "LIFE MEMBER" ? "L.MBR" : j, count: riders.filter((r) => r.jabatan?.toUpperCase() === j).length }))
      .filter((d) => d.count > 0),
  [riders]);

  const tahunList = useMemo(() => {
    const years = [...new Set(riders.map((r) => r.bergabung?.split("-")[0]).filter(Boolean))].sort().reverse();
    return years;
  }, [riders]);

  const filtered = useMemo(() => {
    let result = [...riders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((r) => r.nama?.toLowerCase().includes(q) || r.alamat?.toLowerCase().includes(q) || r.aktivitas?.toLowerCase().includes(q));
    }
    if (filterJabatan) result = result.filter((r) => r.jabatan?.toUpperCase() === filterJabatan);
    if (filterTahun) result = result.filter((r) => r.bergabung?.startsWith(filterTahun));
    result.sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (sortKey === "runs") { av = parseRuns(a.aktivitas).length; bv = parseRuns(b.aktivitas).length; }
      else { av = (a as Record<string, unknown>)[sortKey] as string | number ?? ""; bv = (b as Record<string, unknown>)[sortKey] as string | number ?? ""; }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return result;
  }, [riders, search, filterJabatan, filterTahun, sortKey, sortDir]);

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else { setSortKey(key); setSortDir("asc"); }
  }

  function handleExport() {
    const bom = "\uFEFF";
    const headers = ["No", "Nama", "Chapter", "TTL", "Bergabung", "Jabatan", "Total KM", "Runs"];
    const rows = filtered.map((r) => [r.no, r.nama, r.alamat, r.ttl, r.bergabung, r.jabatan, r.total_km, parseRuns(r.aktivitas).length]);
    const csv = bom + [headers, ...rows].map((row) => row.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "revolt-riders.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  function ThCol({ label, col }: { label: string; col: SortKey }) {
    const isActive = sortKey === col;
    return (
      <th className={cn("th-sort px-3 py-3 text-left text-[0.65rem] font-medium uppercase tracking-wider whitespace-nowrap", isActive ? "active" : "text-[#71717A]")}
        onClick={() => handleSort(col)}>
        <span className="flex items-center gap-1">
          {label}
          {isActive ? (sortDir === "asc" ? <ChevronUp size={10} /> : <ChevronDown size={10} />) : <ChevronUp size={10} className="opacity-20" />}
        </span>
      </th>
    );
  }

  const activeFilterCount = [filterJabatan, filterTahun].filter(Boolean).length;

  const topbarActions = (
    <>
      <button onClick={handleExport} disabled={loading || !riders.length}
        className="btn-purple flex items-center gap-2 px-3 py-2 text-[0.72rem] font-medium disabled:opacity-40">
        <Download size={13} />
        <span className="hidden sm:inline">Export</span>
      </button>
    </>
  );

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Dashboard"
        subtitle={!loading ? `${riders.length} riders · Revolt Riders MC` : "Loading..."}
        onRefresh={fetchRiders}
        loading={loading}
        actions={topbarActions}
        onMenuOpen={onMenuOpen}
      />

      <div className="flex-1 overflow-auto px-3 md:px-6 py-4 md:py-6 w-full max-w-[1440px] mx-auto">
        {/* Error */}
        {!loading && error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="mb-5 rounded-2xl border border-red-500/20 bg-red-500/10 p-5 text-center">
            <p className="mb-3 text-sm text-red-400">{error}</p>
            <button onClick={fetchRiders} className="btn-ghost px-4 py-2 text-[0.75rem] text-red-400">Retry</button>
          </motion.div>
        )}

        {/* Stat Cards — 2 cols mobile, 3 tablet, 6 desktop */}
        <div className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {loading ? (
            Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
          ) : stats ? (
            <>
              <StatCard label="Total Riders" value={riders.length} icon={Users} sparkline={[18,20,22,23,24,25,26,27]} delay={0} />
              <StatCard label="Total KM" value={stats.totalKm} suffix=" km" icon={Gauge} accent sparkline={sparklineKm} delay={0.05} />
              <StatCard label="Avg KM" value={stats.avgKm} suffix=" km" icon={TrendingUp} sub="per rider" delay={0.1} />
              <StatCard label="Road Captain" value={stats.topRider?.total_km ?? 0} suffix=" km" icon={Crown} accent sub={stats.topRider?.nama?.split(" ")[0]} delay={0.15} />
              <StatCard label="Total Runs" value={stats.runs} icon={Bike} delay={0.2} />
              <StatCard label="Founders" value={stats.founders} icon={Star} sub="founding members" delay={0.25} />
            </>
          ) : null}
        </div>

        {/* Charts — stack on mobile */}
        <div className="mb-5 grid grid-cols-1 gap-4 lg:grid-cols-3">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.12 }} className="glass-card p-4 md:p-6 lg:col-span-2">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="text-[0.82rem] md:text-[0.88rem] font-semibold text-white">Top 15 Riders by Distance</h3>
                <p className="mt-0.5 text-[0.66rem] text-[#71717A]">Total kilometers ridden</p>
              </div>
              <span className="badge-purple hidden sm:inline">KM Ranking</span>
            </div>
            {loading ? <div className="skeleton h-44 w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <AreaChart data={areaData} margin={{ top: 4, right: 4, left: -24, bottom: 44 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8B5CF6" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#8B5CF6" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(39,39,42,0.6)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717A", fontFamily: "Inter" }}
                    angle={-40} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#71717A", fontFamily: "Inter" }} tickLine={false} axisLine={false} />
                  <Tooltip content={<ChartTooltip />} cursor={{ stroke: "rgba(139,92,246,0.2)", strokeWidth: 1 }} />
                  <Area type="monotone" dataKey="km" stroke="#8B5CF6" strokeWidth={2} fill="url(#areaGrad)"
                    dot={{ r: 2.5, fill: "#8B5CF6", strokeWidth: 0 }} activeDot={{ r: 4.5, fill: "#A855F7", strokeWidth: 0 }}
                    isAnimationActive={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </motion.div>

          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            transition={{ duration: 0.2, delay: 0.16 }} className="glass-card p-4 md:p-6">
            <div className="mb-3">
              <h3 className="text-[0.82rem] md:text-[0.88rem] font-semibold text-white">Rank Distribution</h3>
              <p className="mt-0.5 text-[0.66rem] text-[#71717A]">Members by jabatan</p>
            </div>
            {loading ? <div className="skeleton h-44 w-full rounded-xl" /> : (
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={barData} margin={{ top: 4, right: 0, left: -28, bottom: 44 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(39,39,42,0.6)" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 8, fill: "#71717A", fontFamily: "Inter" }}
                    angle={-35} textAnchor="end" interval={0} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#71717A", fontFamily: "Inter" }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip content={({ active, payload }: { active?: boolean; payload?: { value: number }[] }) =>
                    active && payload?.length ? (
                      <div className="rounded-xl border border-[rgba(39,39,42,0.8)] bg-[#1E1E1E] px-3 py-2">
                        <p className="text-sm font-semibold text-white">{payload[0].value} riders</p>
                      </div>
                    ) : null} cursor={{ fill: "rgba(139,92,246,0.06)" }} />
                  <Bar dataKey="count" radius={[5, 5, 0, 0]} isAnimationActive={false}>
                    {barData.map((_, i) => <Cell key={i} fill={i % 2 === 0 ? "#8B5CF6" : "#A855F7"} opacity={0.85 - i * 0.05} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </motion.div>
        </div>

        {/* Member List */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          transition={{ duration: 0.2, delay: 0.2 }} className="glass-card overflow-hidden">
          {/* Toolbar */}
          <div className="border-b border-[rgba(39,39,42,0.6)] px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 min-w-0">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
                <input type="search" placeholder="Search riders..."
                  value={search} onChange={(e) => setSearch(e.target.value)}
                  className="input-dark w-full pl-9 pr-3 py-2.5 text-[0.8rem]" />
              </div>
              {/* Mobile: filter button */}
              <button onClick={() => setFilterOpen(true)}
                className={cn("btn-ghost flex items-center gap-1.5 px-3 py-2.5 text-[0.75rem] relative flex-shrink-0",
                  activeFilterCount > 0 && "border-[#8B5CF6]/40 text-[#8B5CF6]")}>
                <Filter size={14} />
                <span className="hidden sm:inline">Filter</span>
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#8B5CF6] text-[0.55rem] text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>
              {/* Desktop: inline filters */}
              <div className="hidden md:flex items-center gap-2">
                <select value={filterJabatan} onChange={(e) => setFilterJabatan(e.target.value)}
                  className="input-dark px-3 py-2.5 text-[0.78rem] cursor-pointer">
                  <option value="">All Ranks</option>
                  {JABATAN_LIST.map((j) => <option key={j}>{j}</option>)}
                </select>
                <select value={filterTahun} onChange={(e) => setFilterTahun(e.target.value)}
                  className="input-dark px-3 py-2.5 text-[0.78rem] cursor-pointer">
                  <option value="">All Years</option>
                  {tahunList.map((y) => <option key={y}>{y}</option>)}
                </select>
              </div>
              {/* View toggle */}
              <div className="flex items-center rounded-xl border border-[rgba(39,39,42,0.8)] overflow-hidden flex-shrink-0">
                <button onClick={() => setViewMode("cards")}
                  className={cn("flex h-9 w-9 items-center justify-center transition-colors",
                    viewMode === "cards" ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "text-[#71717A] hover:text-white")}>
                  <LayoutGrid size={14} />
                </button>
                <button onClick={() => setViewMode("table")}
                  className={cn("flex h-9 w-9 items-center justify-center transition-colors",
                    viewMode === "table" ? "bg-[#8B5CF6]/20 text-[#8B5CF6]" : "text-[#71717A] hover:text-white")}>
                  <List size={14} />
                </button>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div className="flex gap-1 flex-wrap">
                {filterJabatan && (
                  <button onClick={() => setFilterJabatan("")}
                    className="flex items-center gap-1 badge-purple cursor-pointer hover:opacity-80">
                    {filterJabatan} <X size={10} />
                  </button>
                )}
                {filterTahun && (
                  <button onClick={() => setFilterTahun("")}
                    className="flex items-center gap-1 badge-purple cursor-pointer hover:opacity-80">
                    {filterTahun} <X size={10} />
                  </button>
                )}
              </div>
              <span className="text-[0.7rem] text-[#71717A] flex-shrink-0">
                {filtered.length}<span className="text-[#3F3F46]">/{riders.length}</span>
              </span>
            </div>
          </div>

          {/* Card view (default on mobile) */}
          {viewMode === "cards" && (
            <div className="p-3 space-y-2">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => <div key={i} className="skeleton h-24 rounded-2xl" />)
              ) : filtered.length === 0 ? (
                <p className="py-12 text-center text-[0.8rem] text-[#71717A]">No riders found</p>
              ) : (
                filtered.map((rider) => (
                  <RiderCard key={rider.id} rider={rider} onClick={() => setSelectedRider(rider)} />
                ))
              )}
            </div>
          )}

          {/* Table view */}
          {viewMode === "table" && (
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-4 space-y-2">
                  {Array.from({ length: 6 }).map((_, i) => <div key={i} className="skeleton h-10 rounded-xl" />)}
                </div>
              ) : (
                <table className="w-full min-w-[680px]">
                  <thead>
                    <tr className="border-b border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.02)]">
                      <ThCol label="#" col="no" />
                      <ThCol label="Rider" col="nama" />
                      <ThCol label="Chapter" col="alamat" />
                      <ThCol label="Rank" col="jabatan" />
                      <ThCol label="KM" col="total_km" />
                      <ThCol label="Runs" col="runs" />
                      <ThCol label="Patched" col="bergabung" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={7} className="py-14 text-center text-[0.8rem] text-[#71717A]">No riders found</td></tr>
                    ) : (
                      filtered.map((rider, i) => (
                        <motion.tr key={rider.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          transition={{ delay: Math.min(i * 0.008, 0.15) }}
                          className="trow" onClick={() => setSelectedRider(rider)}>
                          <td className="px-3 py-3 text-[0.72rem] font-medium text-[#52525B]">{rider.no}</td>
                          <td className="px-3 py-3 text-[0.8rem] font-medium text-white">{rider.nama}</td>
                          <td className="px-3 py-3 text-[0.75rem] text-[#A1A1AA] max-w-[140px] truncate">{rider.alamat || "—"}</td>
                          <td className="px-3 py-3"><span className={rankBadgeClass(rider.jabatan)}>{rider.jabatan}</span></td>
                          <td className="px-3 py-3 text-[0.82rem] font-semibold text-[#8B5CF6]">{numFmt(rider.total_km || 0)}</td>
                          <td className="px-3 py-3"><RunsCell aktivitas={rider.aktivitas} /></td>
                          <td className="px-3 py-3 text-[0.72rem] text-[#71717A]">{rider.bergabung || "—"}</td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              )}
            </div>
          )}
        </motion.div>

        <p className="mt-5 text-center text-[0.6rem] text-[#3F3F46] tracking-widest uppercase pb-2">
          Revolt Riders MC — Mandatory Ride
        </p>
      </div>

      {/* Mobile filter drawer */}
      <FilterDrawer
        open={filterOpen} onClose={() => setFilterOpen(false)}
        filterJabatan={filterJabatan} setFilterJabatan={setFilterJabatan}
        filterTahun={filterTahun} setFilterTahun={setFilterTahun}
        tahunList={tahunList}
      />

      {selectedRider && <RiderModal rider={selectedRider} onClose={() => setSelectedRider(null)} />}
    </div>
  );
}
