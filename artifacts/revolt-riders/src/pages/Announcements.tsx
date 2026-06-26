import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Megaphone, Pin, Calendar, AlertTriangle, Info,
  PartyPopper, ChevronDown, ChevronUp, Clock,
} from "lucide-react";
import { Topbar } from "@/components/layout/Topbar";
import { useAnnouncements, type Announcement } from "@/lib/announcements";
import { cn } from "@/lib/utils";

interface AnnouncementsProps {
  onMenuOpen: () => void;
}

const TYPE_CONFIG = {
  info: {
    label: "Info",
    icon: Info,
    border: "border-blue-500/30",
    bg: "from-blue-500/8 to-transparent",
    badge: "bg-blue-900/40 text-blue-300 border-blue-700/40",
    dot: "bg-blue-400",
    glow: "rgba(59,130,246,0.15)",
  },
  event: {
    label: "Event",
    icon: PartyPopper,
    border: "border-purple-500/30",
    bg: "from-purple-500/8 to-transparent",
    badge: "bg-purple-900/40 text-purple-300 border-purple-700/40",
    dot: "bg-purple-400",
    glow: "rgba(168,85,247,0.15)",
  },
  urgent: {
    label: "Urgent",
    icon: AlertTriangle,
    border: "border-red-500/30",
    bg: "from-red-500/8 to-transparent",
    badge: "bg-red-900/40 text-red-300 border-red-700/40",
    dot: "bg-red-400",
    glow: "rgba(239,68,68,0.15)",
  },
};

function timeAgo(dateStr: string) {
  const now = Date.now();
  const d = new Date(dateStr).getTime();
  const diff = Math.floor((now - d) / 1000);
  if (diff < 60) return "Just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

function AnnouncementCard({ ann }: { ann: Announcement }) {
  const [expanded, setExpanded] = useState(false);
  const cfg = TYPE_CONFIG[ann.type];
  const Icon = cfg.icon;
  const isLong = ann.body.length > 160;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      layout
      className={cn(
        "relative rounded-2xl border overflow-hidden transition-shadow",
        cfg.border,
        ann.pinned ? "ring-1 ring-white/8" : ""
      )}
      style={{
        background: "#0C0C0C",
        boxShadow: ann.pinned ? `0 0 24px ${cfg.glow}` : "none",
      }}
    >
      {/* Gradient accent */}
      <div className={`absolute inset-0 bg-gradient-to-br ${cfg.bg} pointer-events-none`} />

      <div className="relative p-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border ${cfg.border}`}
            style={{ background: `${cfg.glow}` }}>
            <Icon size={15} className={cfg.badge.split(" ")[1]} />
          </div>

          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 flex-wrap mb-1.5">
              {ann.pinned && (
                <span className="flex items-center gap-1 text-[0.58rem] font-semibold text-amber-400 uppercase tracking-wider">
                  <Pin size={9} />
                  Pinned
                </span>
              )}
              <span className={cn("text-[0.6rem] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border", cfg.badge)}>
                {cfg.label}
              </span>
              <div className="flex items-center gap-1 ml-auto text-[#3F3F46]">
                <Clock size={9} />
                <span className="text-[0.6rem]">{timeAgo(ann.date)}</span>
              </div>
            </div>

            {/* Title */}
            <h3 className="text-[0.95rem] font-bold text-white leading-snug mb-2">{ann.title}</h3>

            {/* Body */}
            <AnimatePresence initial={false}>
              <p className={cn("text-[0.78rem] text-[#A1A1AA] leading-relaxed", !expanded && isLong && "line-clamp-3")}>
                {ann.body}
              </p>
            </AnimatePresence>

            {isLong && (
              <button
                onClick={() => setExpanded(p => !p)}
                className="flex items-center gap-1 mt-2 text-[0.68rem] text-purple-400 hover:text-purple-300 transition-colors"
              >
                {expanded ? <><ChevronUp size={11} /> Show less</> : <><ChevronDown size={11} /> Read more</>}
              </button>
            )}

            {/* Date badge */}
            <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-white/5">
              <Calendar size={10} className="text-[#52525B]" />
              <span className="text-[0.62rem] text-[#52525B]">
                {new Date(ann.date).toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
              <div className={cn("ml-auto h-1.5 w-1.5 rounded-full", cfg.dot)} />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default function Announcements({ onMenuOpen }: AnnouncementsProps) {
  const { announcements } = useAnnouncements();
  const [filter, setFilter] = useState<"all" | "info" | "event" | "urgent">("all");

  const pinned = announcements.filter(a => a.pinned);
  const filtered = announcements.filter(a =>
    (filter === "all" || a.type === filter) && !a.pinned
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden bg-[#080808]">
      <Topbar
        title="Announcements"
        sub={`${announcements.length} total · ${pinned.length} pinned`}
        onMenuOpen={onMenuOpen}
      />

      <div className="flex-1 overflow-y-auto p-4 md:p-6">
        {announcements.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-24 gap-4"
          >
            <div className="h-16 w-16 rounded-2xl flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)" }}>
              <Megaphone size={28} className="text-purple-500" />
            </div>
            <p className="text-white font-semibold text-lg">No announcements yet</p>
            <p className="text-[0.78rem] text-[#52525B] text-center max-w-xs">
              Admins can post ride schedules, events, and club news from the Admin Panel.
            </p>
          </motion.div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6">
            {/* Filter pills */}
            <div className="flex items-center gap-2 flex-wrap">
              {(["all", "info", "event", "urgent"] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setFilter(t)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-[0.7rem] font-medium capitalize transition-all",
                    filter === t
                      ? "bg-purple-600 text-white"
                      : "text-[#71717A] hover:text-white"
                  )}
                  style={filter === t ? {} : { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}
                >
                  {t === "all" ? `All (${announcements.length})` : `${t.charAt(0).toUpperCase() + t.slice(1)} (${announcements.filter(a => a.type === t).length})`}
                </button>
              ))}
            </div>

            {/* Pinned */}
            {pinned.length > 0 && (filter === "all") && (
              <div className="space-y-3">
                <p className="flex items-center gap-1.5 text-[0.65rem] font-semibold uppercase tracking-widest text-amber-400">
                  <Pin size={10} /> Pinned
                </p>
                {pinned.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
              </div>
            )}

            {/* Regular */}
            {filtered.length > 0 && (
              <div className="space-y-3">
                {(filter === "all" && pinned.length > 0) && (
                  <p className="text-[0.65rem] font-semibold uppercase tracking-widest text-[#52525B]">All Posts</p>
                )}
                {filtered.map(ann => <AnnouncementCard key={ann.id} ann={ann} />)}
              </div>
            )}

            {filtered.length === 0 && pinned.length === 0 && filter !== "all" && (
              <div className="text-center py-12 text-[0.78rem] text-[#52525B]">
                No {filter} announcements.
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
