import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Gauge, ChevronLeft, ChevronRight, KeyRound, Medal, Route, X, Swords, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: Gauge, href: "/" },
  { label: "Leaderboard", icon: Medal, href: "/leaderboard" },
  { label: "Run History", icon: Route, href: "/runs" },
  { label: "Showdown", icon: Swords, href: "/showdown" },
  { label: "Admin Panel", icon: KeyRound, href: "/admin" },
];

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  onClose?: () => void;
}

export function Sidebar({ collapsed, onToggle, onClose }: SidebarProps) {
  const [location] = useLocation();

  return (
    <motion.aside
      animate={{ width: collapsed ? 68 : 256 }}
      transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-shrink-0 flex-col bg-[#0A0A0A]"
      style={{
        minHeight: "100dvh",
        borderRight: "1px solid rgba(255,255,255,0.055)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center justify-between px-4 flex-shrink-0"
        style={{ borderBottom: "1px solid rgba(255,255,255,0.055)" }}
      >
        <div className="flex items-center gap-3 min-w-0">
          <div
            className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-[0.75rem] font-black text-white"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
              boxShadow: "0 0 16px rgba(139,92,246,0.4), inset 0 1px 0 rgba(255,255,255,0.15)",
            }}
          >
            R
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                transition={{ duration: 0.14 }}
                className="min-w-0"
              >
                <p className="truncate text-[0.78rem] font-bold text-white tracking-tight leading-none">REVOLT RIDERS</p>
                <p className="truncate text-[0.6rem] text-[#3F3F46] mt-0.5 tracking-wider uppercase">Mandatory Ride</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#52525B] hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
        {/* Label */}
        <AnimatePresence>
          {!collapsed && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="px-3 pb-1.5 pt-1 text-[0.6rem] font-semibold uppercase tracking-[0.1em] text-[#3F3F46]"
            >
              Navigation
            </motion.p>
          )}
        </AnimatePresence>

        {NAV_ITEMS.map(({ label, icon: Icon, href }) => {
          const isActive = location === href;
          return (
            <Link key={href} href={href} onClick={onClose}>
              <div
                className={cn(
                  "sidebar-item",
                  isActive && "active",
                  collapsed && "justify-center px-0"
                )}
                title={collapsed ? label : undefined}
              >
                <Icon size={16} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                      className="text-[0.8rem]"
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-[10px]"
                    transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Bottom section */}
      <div style={{ borderTop: "1px solid rgba(255,255,255,0.055)" }} className="p-2.5 space-y-1">
        {/* Club status pill */}
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2.5"
              style={{ background: "rgba(139,92,246,0.07)", border: "1px solid rgba(139,92,246,0.12)" }}
            >
              <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg"
                style={{ background: "rgba(139,92,246,0.2)" }}>
                <Flame size={11} className="text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.65rem] font-semibold text-purple-300 truncate">Active Season</p>
                <p className="text-[0.58rem] text-[#52525B] truncate">2025 — Mandatory Ride</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapse button — desktop only */}
        <button
          onClick={onToggle}
          className={cn(
            "hidden md:flex btn-ghost w-full items-center gap-2 px-3 py-2 text-[0.72rem]",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : (
            <>
              <ChevronLeft size={14} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
