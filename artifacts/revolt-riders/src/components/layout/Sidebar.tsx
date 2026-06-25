import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutDashboard, ChevronLeft, ChevronRight, Shield, Trophy, Bike, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/" },
  { label: "Leaderboard", icon: Trophy, href: "/leaderboard" },
  { label: "Run History", icon: Bike, href: "/runs" },
  { label: "Admin Panel", icon: Shield, href: "/admin" },
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
      animate={{ width: collapsed ? 72 : 260 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
      className="flex flex-shrink-0 flex-col border-r border-[rgba(39,39,42,0.6)] bg-[#0D0D0D]"
      style={{ minHeight: "100dvh" }}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between border-b border-[rgba(39,39,42,0.6)] px-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] shadow-lg shadow-purple-900/30">
            <span className="text-sm font-bold text-white">R</span>
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.15 }}
                className="min-w-0"
              >
                <p className="truncate text-[0.78rem] font-semibold text-white tracking-tight">REVOLT RIDERS</p>
                <p className="truncate text-[0.62rem] text-[#71717A]">Mandatory Ride</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        {onClose && !collapsed && (
          <button
            onClick={onClose}
            className="md:hidden flex h-8 w-8 items-center justify-center rounded-lg text-[#71717A] hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
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
                <Icon size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.1 }}
                    >
                      {label}
                    </motion.span>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.div
                    layoutId="active-pill"
                    className="absolute inset-0 rounded-[10px] bg-[rgba(139,92,246,0.12)]"
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Collapse — desktop only */}
      <div className="hidden md:block border-t border-[rgba(39,39,42,0.6)] p-3">
        <button
          onClick={onToggle}
          className={cn(
            "btn-ghost flex w-full items-center gap-2 px-3 py-2.5 text-[0.75rem]",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronRight size={16} /> : (
            <>
              <ChevronLeft size={16} />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}
