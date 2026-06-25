import { Search, Bell, RefreshCw } from "lucide-react";

interface TopbarProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  loading?: boolean;
  actions?: React.ReactNode;
}

export function Topbar({ title, subtitle, onRefresh, loading, actions }: TopbarProps) {
  return (
    <div className="topbar-glass sticky top-0 z-30 flex h-16 items-center justify-between px-6">
      <div>
        <h1 className="text-[0.95rem] font-semibold text-white tracking-tight">{title}</h1>
        {subtitle && <p className="text-[0.7rem] text-[#71717A]">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-ghost flex h-9 w-9 items-center justify-center p-0 disabled:opacity-40"
          >
            <RefreshCw size={15} className={loading ? "animate-spin text-[#8B5CF6]" : ""} />
          </button>
        )}
        <button className="btn-ghost flex h-9 w-9 items-center justify-center p-0">
          <Bell size={15} />
        </button>
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#7C3AED] to-[#A855F7] text-xs font-semibold text-white">
          A
        </div>
      </div>
    </div>
  );
}
