import { Bell, RefreshCw, Menu } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
  onMenuOpen?: () => void;
}

export function Topbar({ title, subtitle, onRefresh, loading, actions, onMenuOpen }: TopbarProps) {
  return (
    <div className="topbar-glass sticky top-0 z-30 flex h-14 md:h-16 items-center justify-between px-4 md:px-6 gap-3">
      {/* Left: hamburger (mobile) + title */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden btn-ghost flex h-9 w-9 items-center justify-center p-0 flex-shrink-0"
          >
            <Menu size={18} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-[0.88rem] md:text-[0.95rem] font-semibold text-white tracking-tight truncate">{title}</h1>
          {subtitle && <p className="text-[0.65rem] md:text-[0.7rem] text-[#71717A] truncate hidden sm:block">{subtitle}</p>}
        </div>
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Actions slot — hidden on very small screens if needed */}
        <div className="flex items-center gap-2">
          {actions}
        </div>
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-ghost flex h-9 w-9 items-center justify-center p-0 disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-[#8B5CF6]" : ""} />
          </button>
        )}
        <button className="btn-ghost hidden sm:flex h-9 w-9 items-center justify-center p-0">
          <Bell size={15} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-xs font-semibold text-white flex-shrink-0">
          A
        </div>
      </div>
    </div>
  );
}
