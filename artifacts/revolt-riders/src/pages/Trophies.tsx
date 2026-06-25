import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { Topbar } from "@/components/layout/Topbar";
import { cn } from "@/lib/utils";
import {
  ALL_BADGES, computeBadges,
  TIER_STYLES,
  type Badge, type BadgeTier, type Rider,
} from "@/lib/achievements";
import { ChevronDown, ChevronUp, Award, Sparkles } from "lucide-react";
import { toast } from "sonner";

type BadgeTierFilter = "all" | BadgeTier;

interface BadgeWithEarners extends Badge {
  earners: { nama: string; jabatan: string; total_km: number }[];
}

function numFmt(n: number) {
  return n.toLocaleString("id-ID");
}

function jabatanBadgeClass(j: string) {
  const map: Record<string, string> = {
    FOUNDER: "badge-yellow",
    PRESIDENT: "badge-purple",
    EXCECUTOR: "badge-red",
    NEGOSIATOR: "badge-blue",
    "LIFE MEMBER": "badge-cyan",
    VIRGIN: "badge-green",
    CAPROS: "badge-gray",
    PROSPEK: "badge-gray",
  };
  return map[(j || "").toUpperCase()] ?? "badge-gray";
}

function TierPill({ tier }: { tier: BadgeTier }) {
  const s = TIER_STYLES[tier];
  return (
    <span className={cn("text-[0.58rem] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full border", s.border, `bg-gradient-to-r ${s.bg}`, s.text)}>
      {s.label}
    </span>
  );
}

/* ── Trophy card ──────────────────────────────────────────────── */
function TrophyCard({ badge, index }: { badge: BadgeWithEarners; index: number }) {
  const [open, setOpen] = useState(false);
  const s = TIER_STYLES[badge.tier];
  const earned = badge.earners.length;
  const isLegendary = badge.tier === "legendary";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.15, delay: Math.min(index * 0.04, 0.4) }}
      className={cn(
        "glass-card overflow-hidden cursor-pointer select-none",
        isLegendary && "ring-1 ring-amber-400/20"
      )}
      onClick={() => setOpen((o) => !o)}
    >
      {/* Legendary top shimmer */}
      {isLegendary && (
        <div className="h-px bg-gradient-to-r from-transparent via-amber-400/60 to-transparent" />
      )}

      <div className="p-4 md:p-5">
        <div className="flex items-start gap-4">
          {/* Icon */}
          <div className={cn(
            "flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl border text-2xl shadow-lg",
            `bg-gradient-to-br ${s.bg}`, s.border, s.glow
          )}>
            {badge.icon}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <p className={cn("text-[0.78rem] font-bold tracking-wide", s.text)}>{badge.name}</p>
                <TierPill tier={badge.tier} />
              </div>
              <div className="flex-shrink-0 text-right">
                <p className={cn("text-xl font-black tabular-nums", earned === 0 ? "text-[#52525B]" : s.text)}>
                  {earned}
                </p>
                <p className="text-[0.6rem] text-[#71717A]">earners</p>
              </div>
            </div>
            <p className="text-[0.7rem] text-[#71717A] leading-relaxed">{badge.description}</p>
          </div>
        </div>

        {earned > 0 && (
          <div className="mt-3 flex items-center justify-between">
            <div className="flex -space-x-1.5">
              {badge.earners.slice(0, 5).map((r, i) => (
                <div
                  key={i}
                  title={r.nama}
                  className={cn(
                    "flex h-6 w-6 items-center justify-center rounded-full border border-[#0A0A0A] text-[0.52rem] font-bold text-white",
                    `bg-gradient-to-br ${s.bg}`
                  )}
                  style={{ zIndex: 10 - i }}
                >
                  {r.nama.charAt(0)}
                </div>
              ))}
              {earned > 5 && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full border border-[#0A0A0A] bg-[#1A1A1A] text-[0.5rem] text-[#71717A]" style={{ zIndex: 4 }}>
                  +{earned - 5}
                </div>
              )}
            </div>
            <span className="text-[#52525B]">
              {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
          </div>
        )}
      </div>

      {/* Earner list */}
      <AnimatePresence>
        {open && earned > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden border-t border-[rgba(39,39,42,0.6)]"
          >
            <div className="px-4 md:px-5 py-3">
              <p className="mb-2.5 text-[0.62rem] font-medium uppercase tracking-widest text-[#71717A]">
                Earners ({earned})
              </p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {badge.earners
                  .sort((a, b) => b.total_km - a.total_km)
                  .map((r, i) => (
                    <div
                      key={i}
                      className="flex items-center justify-between rounded-xl bg-[rgba(255,255,255,0.02)] border border-[rgba(39,39,42,0.4)] px-3 py-2"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[0.6rem] text-[#52525B] w-4 flex-shrink-0">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="text-[0.78rem] text-[#A1A1AA] truncate font-medium">{r.nama}</span>
                        <span className={cn(jabatanBadgeClass(r.jabatan), "hidden sm:inline")}>{r.jabatan}</span>
                      </div>
                      <span className={cn("text-[0.72rem] font-semibold flex-shrink-0 ml-2", s.text)}>
                        {numFmt(r.total_km)} km
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ── Summary stat ─────────────────────────────────────────────── */
function StatTile({ icon, label, value, sub }: { icon: string; label: string; value: string | number; sub?: string }) {
  return (
    <div className="glass-card p-4 flex items-center gap-3">
      <div className="text-2xl flex-shrink-0">{icon}</div>
      <div className="min-w-0">
        <p className="text-[0.6rem] font-medium uppercase tracking-widest text-[#71717A]">{label}</p>
        <p className="text-[0.95rem] font-bold text-white mt-0.5 truncate">{value}</p>
        {sub && <p className="text-[0.62rem] text-[#52525B] truncate">{sub}</p>}
      </div>
    </div>
  );
}

/* ── Main Trophies page ───────────────────────────────────────── */
export default function Trophies({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<BadgeTierFilter>("all");

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("riders")
        .select("id, nama, jabatan, bergabung, total_km, aktivitas");
      if (error) throw error;
      setRiders(data || []);
    } catch {
      toast.error("Failed to load trophy data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRiders(); }, [fetchRiders]);

  /* Compute badge → earners mapping */
  const badgesWithEarners: BadgeWithEarners[] = ALL_BADGES.map((badge) => ({
    ...badge,
    earners: riders.filter((r) => computeBadges(r).some((b) => b.id === badge.id)).map((r) => ({
      nama: r.nama,
      jabatan: r.jabatan,
      total_km: r.total_km,
    })),
  }));

  /* Summary stats */
  const totalAwarded = badgesWithEarners.reduce((s, b) => s + b.earners.length, 0);
  const ridersWithAny = riders.filter((r) => computeBadges(r).length > 0).length;
  const mostDecorated = riders.reduce<Rider | null>((top, r) => {
    const count = computeBadges(r).length;
    return !top || count > computeBadges(top).length ? r : top;
  }, null);
  const rarestBadge = [...badgesWithEarners]
    .filter((b) => b.earners.length > 0)
    .sort((a, b) => a.earners.length - b.earners.length)[0];

  const FILTERS: { key: BadgeTierFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "legendary", label: "🏆 Legendary" },
    { key: "gold", label: "🥇 Gold" },
    { key: "silver", label: "⚡ Silver" },
    { key: "bronze", label: "🔥 Bronze" },
    { key: "special", label: "💎 Special" },
  ];

  const displayed = filter === "all"
    ? badgesWithEarners
    : badgesWithEarners.filter((b) => b.tier === filter);

  return (
    <div className="flex flex-1 flex-col overflow-auto">
      <Topbar
        title="Trophy Wall"
        subtitle={loading ? "Loading…" : `${totalAwarded} badges awarded across ${riders.length} riders`}
        onRefresh={fetchRiders}
        loading={loading}
        onMenuOpen={onMenuOpen}
      />

      <div className="flex-1 overflow-auto px-3 md:px-6 py-4 md:py-6 w-full max-w-5xl mx-auto">

        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.22 }}
          className="glass-card mb-5 px-5 py-6 md:px-8 md:py-7 overflow-hidden relative"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#7C3AED]/10 via-transparent to-transparent pointer-events-none" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#8B5CF6]/50 to-transparent" />
          <div className="relative flex items-center gap-4">
            <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] shadow-lg shadow-purple-900/40">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <h1 className="text-[1rem] md:text-[1.1rem] font-bold text-white">Achievement Badges</h1>
                <Sparkles size={14} className="text-amber-400" />
              </div>
              <p className="text-[0.72rem] text-[#71717A] max-w-lg leading-relaxed">
                Badges are automatically computed from every rider's mileage, run history, rank, and membership date.
                No manual input required — ride more, earn more.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Summary tiles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, delay: 0.08 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5"
        >
          <StatTile icon="🏅" label="Total Awarded" value={totalAwarded} sub="badge instances" />
          <StatTile icon="🏍️" label="Decorated Riders" value={`${ridersWithAny} / ${riders.length}`} sub="have at least one badge" />
          <StatTile
            icon="🌟"
            label="Most Decorated"
            value={mostDecorated ? mostDecorated.nama.split(" ")[0] : "—"}
            sub={mostDecorated ? `${computeBadges(mostDecorated).length} badges` : ""}
          />
          <StatTile
            icon="💫"
            label="Rarest Badge"
            value={rarestBadge ? rarestBadge.icon + " " + rarestBadge.name : "—"}
            sub={rarestBadge ? `${rarestBadge.earners.length} earner${rarestBadge.earners.length !== 1 ? "s" : ""}` : ""}
          />
        </motion.div>

        {/* Tier filter */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.18, delay: 0.12 }}
          className="flex flex-wrap gap-2 mb-4"
        >
          {FILTERS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={cn(
                "px-3 py-1.5 rounded-xl text-[0.72rem] font-medium border transition-colors duration-100",
                filter === key
                  ? "bg-[rgba(139,92,246,0.15)] border-[rgba(139,92,246,0.35)] text-[#A855F7]"
                  : "btn-ghost text-[#71717A]"
              )}
            >
              {label}
              <span className="ml-1.5 text-[0.6rem] text-[#52525B]">
                {key === "all"
                  ? badgesWithEarners.length
                  : badgesWithEarners.filter((b) => b.tier === key).length}
              </span>
            </button>
          ))}
        </motion.div>

        {/* Badge grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="glass-card p-5 space-y-3">
                <div className="flex gap-4">
                  <div className="skeleton h-14 w-14 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton h-4 w-24 rounded" />
                    <div className="skeleton h-3 w-40 rounded" />
                    <div className="skeleton h-3 w-32 rounded" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {displayed.map((badge, i) => (
              <TrophyCard key={badge.id} badge={badge} index={i} />
            ))}
          </div>
        )}

        {/* Per-rider leaderboard: who has the most badges */}
        {!loading && riders.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.18, delay: 0.2 }}
            className="glass-card overflow-hidden mt-5"
          >
            <div className="border-b border-[rgba(39,39,42,0.6)] px-5 py-3.5 flex items-center gap-2">
              <Sparkles size={15} className="text-amber-400" />
              <h3 className="text-[0.88rem] font-semibold text-white">Hall of Fame</h3>
              <p className="ml-auto text-[0.66rem] text-[#71717A]">Ranked by total badges earned</p>
            </div>
            <div>
              {riders
                .map((r) => ({ rider: r, badges: computeBadges(r) }))
                .filter(({ badges }) => badges.length > 0)
                .sort((a, b) => {
                  if (b.badges.length !== a.badges.length) return b.badges.length - a.badges.length;
                  return (b.rider.total_km || 0) - (a.rider.total_km || 0);
                })
                .map(({ rider, badges }, i) => (
                  <motion.div
                    key={rider.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.12, delay: Math.min(i * 0.03, 0.3) }}
                    className="flex items-center gap-3 px-4 md:px-5 py-3 border-b border-[rgba(39,39,42,0.4)] last:border-0 hover:bg-[rgba(255,255,255,0.02)] transition-colors"
                  >
                    {/* Rank */}
                    <div className={cn(
                      "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border text-[0.72rem] font-bold",
                      i === 0 ? "border-amber-500/30 bg-amber-500/10 text-amber-400"
                      : i === 1 ? "border-slate-500/30 bg-slate-400/10 text-slate-400"
                      : i === 2 ? "border-orange-700/30 bg-orange-800/10 text-orange-500"
                      : "border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.02)] text-[#52525B]"
                    )}>
                      {i + 1}
                    </div>

                    {/* Name + jabatan */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[0.82rem] font-semibold text-white truncate">{rider.nama}</span>
                        <span className={cn(jabatanBadgeClass(rider.jabatan))}>{rider.jabatan}</span>
                      </div>
                      {/* Badge icons */}
                      <div className="flex items-center gap-1 flex-wrap">
                        {badges.map((b) => (
                          <span
                            key={b.id}
                            title={b.name}
                            className={cn(
                              "text-[0.7rem] px-1.5 py-0.5 rounded-lg border",
                              TIER_STYLES[b.tier].border,
                              `bg-gradient-to-r ${TIER_STYLES[b.tier].bg}`
                            )}
                          >
                            {b.icon}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Badge count */}
                    <div className="flex-shrink-0 text-right">
                      <p className="text-[1rem] font-black text-white">{badges.length}</p>
                      <p className="text-[0.58rem] text-[#52525B]">badge{badges.length !== 1 ? "s" : ""}</p>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
