import { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users, Gauge, TrendingUp, Crown, Star, ChevronUp, ChevronDown,
  Search, RefreshCw, Download, X, ChevronRight, Bike,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell,
} from "recharts";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, parseRuns, badgeColor, cn } from "@/lib/utils";
import type { Rider, Aktivitas } from "@/lib/types";

const JABATAN_LIST = ["FOUNDER", "PRESIDENT", "EXCECUTOR", "NEGOSIATOR", "LIFE MEMBER", "VIRGIN", "CAPROS", "PROSPEK"];

type SortKey = "no" | "nama" | "alamat" | "ttl" | "bergabung" | "jabatan" | "total_km" | "runs";
type SortDir = "asc" | "desc";

function RankBadge({ jabatan }: { jabatan: string }) {
  return (
    <span
      className={cn(
        "inline-block px-2 py-0.5 text-[0.55rem] tracking-widest uppercase clip-slant-sm",
        badgeColor(jabatan)
      )}
    >
      {jabatan}
    </span>
  );
}

function StatCard({
  label,
  value,
  sub,
  icon: Icon,
  amber,
  delay,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  amber?: boolean;
  delay?: number;
}) {
  return (
    <div
      className={cn(
        "card-accent-top card-hover relative overflow-hidden rounded border border-[hsl(35_10%_15%)] bg-[hsl(30_6%_6%)] p-4 transition-all duration-200",
        `animate-fade-in animate-fade-in-delay-${delay ?? 1}`
      )}
    >
      <div className="flex items-start justify-between">
        <div className="min-w-0 flex-1">
          <p className="label-upper mb-1">{label}</p>
          <p
            className={cn(
              "truncate font-light",
              amber ? "text-[#c9973b]" : "text-[hsl(35_20%_85%)]",
              typeof value === "string" && value.length > 10 ? "text-lg" : "text-2xl"
            )}
            style={{ fontSize: typeof value === "string" && value.length > 12 ? "1rem" : undefined }}
          >
            {value}
          </p>
          {sub && <p className="mt-0.5 text-[0.6rem] text-[hsl(35_15%_45%)]">{sub}</p>}
        </div>
        <div
          className={cn(
            "ml-3 flex-shrink-0 rounded p-2",
            amber ? "bg-amber-900/30 text-[#c9973b]" : "bg-[hsl(30_8%_10%)] text-[hsl(35_15%_50%)]"
          )}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function RiderModal({ rider, onClose }: { rider: Rider; onClose: () => void }) {
  const runs = parseRuns(rider.aktivitas);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative mx-4 w-full max-w-lg rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_8%_7%)] p-6 shadow-2xl animate-fade-in"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute right-4 top-4 text-[hsl(35_15%_45%)] hover:text-[hsl(35_20%_75%)] transition-colors"
          onClick={onClose}
        >
          <X size={18} />
        </button>

        <div className="mb-5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded bg-[#c9973b]/20 text-[#c9973b] text-sm font-light">
            #{rider.no}
          </div>
          <div>
            <h2 className="text-base text-[hsl(35_20%_88%)]">{rider.nama}</h2>
            <RankBadge jabatan={rider.jabatan} />
          </div>
        </div>

        <div className="mb-5 grid grid-cols-2 gap-3">
          {[
            { label: "Chapter", value: rider.alamat },
            { label: "TTL", value: rider.ttl },
            { label: "Patched", value: rider.bergabung },
            { label: "Rank", value: rider.jabatan },
          ].map(({ label, value }) => (
            <div key={label} className="rounded border border-[hsl(35_10%_14%)] bg-[hsl(30_6%_5%)] p-3">
              <p className="label-upper mb-1">{label}</p>
              <p className="text-[0.7rem] text-[hsl(35_20%_80%)]">{value || "—"}</p>
            </div>
          ))}
        </div>

        <div className="mb-5 rounded border border-amber-800/30 bg-amber-950/20 px-4 py-3 text-center">
          <p className="label-upper mb-1">Total Distance</p>
          <p className="text-3xl text-[#c9973b]">{numFmt(rider.total_km)} <span className="text-sm text-amber-700">km</span></p>
        </div>

        {runs.length > 0 && (
          <div>
            <p className="label-upper mb-2">Run Log ({runs.length} runs)</p>
            <div className="max-h-40 overflow-y-auto rounded border border-[hsl(35_10%_14%)]">
              <table className="w-full">
                <tbody>
                  {runs.map((r, i) => (
                    <tr key={i} className={cn("border-b border-[hsl(35_10%_12%)] last:border-0", i % 2 === 0 ? "bg-[hsl(30_6%_5%)]" : "bg-[hsl(30_6%_6%)]")}>
                      <td className="px-3 py-2 text-[0.6rem] text-[hsl(35_15%_45%)]">{i + 1}</td>
                      <td className="px-3 py-2 text-[0.65rem] text-[hsl(35_20%_78%)]">{r.nama}</td>
                      <td className="px-3 py-2 text-right text-[0.65rem] text-[#c9973b]">{numFmt(r.km)} km</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function RunsCell({ aktivitas }: { aktivitas: string }) {
  const [open, setOpen] = useState(false);
  const runs = parseRuns(aktivitas);
  if (runs.length === 0) return <span className="text-[hsl(35_15%_40%)] text-[0.6rem]">—</span>;
  return (
    <div>
      <button
        className="flex items-center gap-1 text-[0.65rem] text-[hsl(35_20%_70%)] hover:text-[#c9973b] transition-colors"
        onClick={(e) => { e.stopPropagation(); setOpen(!open); }}
      >
        {runs.length} runs
        {open ? <ChevronUp size={12} /> : <ChevronRight size={12} />}
      </button>
      {open && (
        <div className="mt-1 rounded border border-[hsl(35_10%_14%)] bg-[hsl(30_6%_4%)] p-1">
          {runs.map((r, i) => (
            <div key={i} className="flex items-center justify-between py-0.5 px-1">
              <span className="text-[0.55rem] text-[hsl(35_15%_50%)] truncate max-w-[100px]">{r.nama}</span>
              <span className="text-[0.55rem] text-[#c9973b] ml-2">{numFmt(r.km)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function SortIcon({ col, sortKey, sortDir }: { col: SortKey; sortKey: SortKey; sortDir: SortDir }) {
  if (col !== sortKey) return <ChevronUp size={10} className="opacity-20" />;
  return sortDir === "asc" ? <ChevronUp size={10} className="text-[#c9973b]" /> : <ChevronDown size={10} className="text-[#c9973b]" />;
}

const AMBER_GRADIENT = [
  "#c9973b", "#d4a44a", "#bf8c30", "#e0b560", "#c08030",
  "#d9a040", "#b87a28", "#e8b860", "#c99030", "#d4a248",
  "#bf8a2e", "#dca840", "#c28530", "#d6a044", "#bb8028",
];

export default function Dashboard() {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterJabatan, setFilterJabatan] = useState("");
  const [filterTahun, setFilterTahun] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("no");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedRider, setSelectedRider] = useState<Rider | null>(null);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from("riders")
        .select("*")
        .order("no", { ascending: true });
      if (err) throw err;
      setRiders(data || []);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Gagal memuat data";
      setError(msg);
      toast.error("Gagal memuat data riders");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "e") { e.preventDefault(); handleExport(); }
      if (e.key === "Escape") setSelectedRider(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
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

  const chartData = useMemo(() => {
    return [...riders]
      .sort((a, b) => b.total_km - a.total_km)
      .slice(0, 15)
      .map((r) => ({ name: r.nama?.split(" ")[0] ?? "—", km: r.total_km || 0 }));
  }, [riders]);

  const radarData = useMemo(() => {
    return JABATAN_LIST.map((j) => ({
      jabatan: j === "LIFE MEMBER" ? "LIFE MBR" : j,
      count: riders.filter((r) => r.jabatan?.toUpperCase() === j).length,
    }));
  }, [riders]);

  const tahunList = useMemo(() => {
    const years = [...new Set(riders.map((r) => r.bergabung?.split("-")[0]).filter(Boolean))].sort().reverse();
    return years;
  }, [riders]);

  const filtered = useMemo(() => {
    let result = [...riders];
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.nama?.toLowerCase().includes(q) ||
          r.alamat?.toLowerCase().includes(q) ||
          r.aktivitas?.toLowerCase().includes(q)
      );
    }
    if (filterJabatan) result = result.filter((r) => r.jabatan?.toUpperCase() === filterJabatan);
    if (filterTahun) result = result.filter((r) => r.bergabung?.startsWith(filterTahun));
    result.sort((a, b) => {
      let av: string | number = "", bv: string | number = "";
      if (sortKey === "runs") { av = parseRuns(a.aktivitas).length; bv = parseRuns(b.aktivitas).length; }
      else { av = a[sortKey] ?? ""; bv = b[sortKey] ?? ""; }
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
    const rows = filtered.map((r) => [
      r.no, r.nama, r.alamat, r.ttl, r.bergabung, r.jabatan, r.total_km, parseRuns(r.aktivitas).length,
    ]);
    const csv = bom + [headers, ...rows].map((row) => row.map((v) => `"${v ?? ""}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "revolt-riders.csv"; a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported!");
  }

  function ThCol({ label, col }: { label: string; col: SortKey }) {
    return (
      <th
        className="cursor-pointer select-none whitespace-nowrap px-3 py-2.5 text-left transition-colors hover:text-[#c9973b]"
        onClick={() => handleSort(col)}
      >
        <span className="flex items-center gap-1 label-upper">
          {label}
          <SortIcon col={col} sortKey={sortKey} sortDir={sortDir} />
        </span>
      </th>
    );
  }

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number }[] }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_8%_8%)] px-3 py-2 text-[0.65rem]">
        <p className="text-[#c9973b]">{numFmt(payload[0].value)} km</p>
      </div>
    );
  };

  const RadarTooltip = ({ active, payload }: { active?: boolean; payload?: { value: number; payload: { jabatan: string } }[] }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_8%_8%)] px-3 py-2 text-[0.65rem]">
        <p className="text-[hsl(35_20%_80%)]">{payload[0].payload.jabatan}</p>
        <p className="text-[#c9973b]">{payload[0].value} riders</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-[hsl(35_10%_12%)] bg-[hsl(30_8%_4%)/90] backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="clip-slant flex h-9 w-9 items-center justify-center bg-[#c9973b] text-[hsl(30_8%_4%)] text-base">
              R
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm tracking-widest uppercase text-[hsl(35_20%_88%)]">Revolt Riders</h1>
                {!loading && (
                  <span className="clip-slant-sm bg-[#c9973b]/15 border border-[#c9973b]/30 px-2 py-0.5 text-[0.5rem] tracking-widest uppercase text-[#c9973b]">
                    {riders.length} riders
                  </span>
                )}
              </div>
              <p className="text-[0.55rem] tracking-wider text-[hsl(35_15%_40%)]">MANDATORY RIDE</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={loading || !riders.length}
              className="clip-slant flex items-center gap-1.5 border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_8%)] px-3 py-1.5 text-[0.6rem] uppercase tracking-wider text-[hsl(35_15%_60%)] transition-all hover:border-[#c9973b]/40 hover:text-[#c9973b] disabled:opacity-40"
            >
              <Download size={13} />
              <span className="hidden sm:inline">Export</span>
            </button>
            <button
              onClick={() => { fetchRiders(); toast.info("Refreshing..."); }}
              disabled={loading}
              className="clip-slant flex items-center gap-1.5 border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_8%)] px-3 py-1.5 text-[0.6rem] uppercase tracking-wider text-[hsl(35_15%_60%)] transition-all hover:border-[#c9973b]/40 hover:text-[#c9973b] disabled:opacity-40"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* Loading */}
        {loading && (
          <div className="flex h-40 items-center justify-center gap-3 text-[hsl(35_15%_45%)]">
            <RefreshCw size={18} className="animate-spin text-[#c9973b]" />
            <span className="text-[0.7rem] tracking-wider uppercase">Loading data...</span>
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="rounded border border-red-800/40 bg-red-950/30 p-4 text-center">
            <p className="text-[0.7rem] text-red-400 mb-3">{error}</p>
            <button
              onClick={fetchRiders}
              className="clip-slant border border-red-700/50 bg-red-900/20 px-4 py-1.5 text-[0.6rem] uppercase tracking-wider text-red-400 hover:bg-red-900/40 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Stats Cards */}
            {stats && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
                <StatCard label="Total Riders" value={riders.length} icon={Users} delay={1} />
                <StatCard label="Total KM" value={numFmt(stats.totalKm)} sub="km combined" icon={Gauge} amber delay={2} />
                <StatCard label="Avg KM" value={numFmt(stats.avgKm)} sub="per rider" icon={TrendingUp} delay={3} />
                <StatCard
                  label="Road Captain"
                  value={stats.topRider?.nama?.split(" ")[0] ?? "—"}
                  sub={`${numFmt(stats.topRider?.total_km ?? 0)} km`}
                  icon={Crown}
                  delay={4}
                />
                <StatCard label="Runs" value={stats.runs} sub="total runs" icon={Bike} delay={5} />
                <StatCard label="Founders" value={stats.founders} sub="founding members" icon={Star} delay={6} />
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Bar Chart */}
              <div className="card-accent-top animate-fade-in rounded border border-[hsl(35_10%_15%)] bg-[hsl(30_6%_6%)] p-4">
                <p className="label-upper mb-4">Top 15 Riders by Total KM</p>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={chartData} margin={{ top: 4, right: 8, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(35 10% 12%)" vertical={false} />
                      <XAxis
                        dataKey="name"
                        tick={{ fontSize: 9, fill: "hsl(35 15% 45%)", fontFamily: "Poppins" }}
                        angle={-45}
                        textAnchor="end"
                        interval={0}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis tick={{ fontSize: 9, fill: "hsl(35 15% 45%)", fontFamily: "Poppins" }} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(201,151,59,0.05)" }} />
                      <Bar dataKey="km" radius={[2, 2, 0, 0]}>
                        {chartData.map((_, i) => (
                          <Cell key={i} fill={AMBER_GRADIENT[i % AMBER_GRADIENT.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-52 items-center justify-center text-[0.65rem] text-[hsl(35_15%_40%)]">No data</div>
                )}
              </div>

              {/* Radar Chart */}
              <div className="card-accent-top animate-fade-in rounded border border-[hsl(35_10%_15%)] bg-[hsl(30_6%_6%)] p-4">
                <p className="label-upper mb-4">Distribusi Jabatan</p>
                {radarData.some((d) => d.count > 0) ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="hsl(35 10% 14%)" />
                      <PolarAngleAxis
                        dataKey="jabatan"
                        tick={{ fontSize: 8, fill: "hsl(35 15% 45%)", fontFamily: "Poppins" }}
                      />
                      <PolarRadiusAxis tick={false} axisLine={false} />
                      <Radar
                        dataKey="count"
                        stroke="#c9973b"
                        fill="#c9973b"
                        fillOpacity={0.25}
                        strokeWidth={1.5}
                      />
                      <Tooltip content={<RadarTooltip />} />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex h-52 items-center justify-center text-[0.65rem] text-[hsl(35_15%_40%)]">No data</div>
                )}
              </div>
            </div>

            {/* Table */}
            <div className="animate-fade-in rounded border border-[hsl(35_10%_15%)] bg-[hsl(30_6%_6%)] overflow-hidden">
              {/* Toolbar */}
              <div className="flex flex-wrap items-center gap-2 border-b border-[hsl(35_10%_12%)] px-4 py-3">
                <div className="relative flex-1 min-w-40">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[hsl(35_15%_40%)]" />
                  <input
                    type="search"
                    placeholder="Cari rider..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_4%)] pl-8 pr-3 py-1.5 text-[0.65rem] text-[hsl(35_20%_80%)] placeholder-[hsl(35_15%_38%)] outline-none focus:border-[#c9973b]/50 transition-colors"
                  />
                </div>
                <select
                  value={filterJabatan}
                  onChange={(e) => setFilterJabatan(e.target.value)}
                  className="rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_4%)] px-2 py-1.5 text-[0.65rem] text-[hsl(35_20%_75%)] outline-none focus:border-[#c9973b]/50 cursor-pointer"
                >
                  <option value="">All Ranks</option>
                  {JABATAN_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
                </select>
                <select
                  value={filterTahun}
                  onChange={(e) => setFilterTahun(e.target.value)}
                  className="rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_4%)] px-2 py-1.5 text-[0.65rem] text-[hsl(35_20%_75%)] outline-none focus:border-[#c9973b]/50 cursor-pointer"
                >
                  <option value="">All Years</option>
                  {tahunList.map((y) => <option key={y} value={y}>{y}</option>)}
                </select>
                <span className="text-[0.6rem] text-[hsl(35_15%_42%)] ml-auto">
                  {filtered.length} of {riders.length} riders
                </span>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px]">
                  <thead>
                    <tr className="border-b border-[hsl(35_10%_12%)] bg-[hsl(30_6%_5%)]">
                      <ThCol label="#" col="no" />
                      <ThCol label="Rider" col="nama" />
                      <ThCol label="Chapter" col="alamat" />
                      <ThCol label="TTL" col="ttl" />
                      <ThCol label="Patched" col="bergabung" />
                      <ThCol label="Rank" col="jabatan" />
                      <ThCol label="Total KM" col="total_km" />
                      <ThCol label="Runs" col="runs" />
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-10 text-center text-[0.65rem] text-[hsl(35_15%_40%)]">
                          No riders found
                        </td>
                      </tr>
                    ) : (
                      filtered.map((rider, i) => (
                        <tr
                          key={rider.id}
                          className={cn(
                            "tr-hover cursor-pointer border-b border-[hsl(35_10%_10%)] transition-all duration-150",
                            i % 2 === 0 ? "bg-[hsl(30_6%_6%)]" : "bg-[hsl(30_6%_7%)]"
                          )}
                          onClick={() => setSelectedRider(rider)}
                          style={{ animationDelay: `${i * 0.02}s` }}
                        >
                          <td className="px-3 py-2.5 text-[0.6rem] text-[hsl(35_15%_45%)]">{rider.no}</td>
                          <td className="px-3 py-2.5 text-[0.68rem] text-[hsl(35_20%_82%)]">{rider.nama}</td>
                          <td className="px-3 py-2.5 text-[0.65rem] text-[hsl(35_15%_60%)]">{rider.alamat || "—"}</td>
                          <td className="px-3 py-2.5 text-[0.65rem] text-[hsl(35_15%_55%)]">{rider.ttl || "—"}</td>
                          <td className="px-3 py-2.5 text-[0.65rem] text-[hsl(35_15%_55%)]">{rider.bergabung || "—"}</td>
                          <td className="px-3 py-2.5">
                            <RankBadge jabatan={rider.jabatan} />
                          </td>
                          <td className="px-3 py-2.5 text-[0.68rem] text-[#c9973b]">{numFmt(rider.total_km || 0)}</td>
                          <td className="px-3 py-2.5">
                            <RunsCell aktivitas={rider.aktivitas} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pb-4 text-center">
              <p className="text-[0.55rem] tracking-widest uppercase text-[hsl(35_15%_30%)]">
                © REVOLT RIDERS — MANDATORY RIDE
              </p>
            </div>
          </>
        )}
      </main>

      {/* Modal */}
      {selectedRider && (
        <RiderModal rider={selectedRider} onClose={() => setSelectedRider(null)} />
      )}
    </div>
  );
}
