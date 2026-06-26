import { RotateCcw, AlignLeft } from "lucide-react";

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
    <div className="topbar-glass sticky top-0 z-30 flex h-14 md:h-[60px] items-center justify-between px-4 md:px-6 gap-3">
      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {onMenuOpen && (
          <button
            onClick={onMenuOpen}
            className="md:hidden btn-ghost flex h-8 w-8 items-center justify-center p-0 flex-shrink-0"
          >
            <AlignLeft size={16} />
          </button>
        )}
        <div className="min-w-0">
          <h1 className="text-[0.88rem] md:text-[0.92rem] font-semibold text-white tracking-tight truncate leading-none">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[0.62rem] text-[#52525B] truncate hidden sm:block mt-0.5 tracking-wide">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {actions}
        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className="btn-ghost flex h-8 w-8 items-center justify-center p-0 disabled:opacity-30"
          >
            <RotateCcw
              size={13}
              className={loading ? "animate-spin text-[#8B5CF6]" : "text-[#71717A]"}
            />
          </button>
        )}
        {/* Avatar */}
        <div
          className="flex h-7 w-7 items-center justify-center rounded-full text-[0.65rem] font-bold text-white flex-shrink-0"
          style={{
            background: "linear-gradient(135deg, #7C3AED 0%, #A855F7 100%)",
            boxShadow: "0 0 12px rgba(139,92,246,0.35)",
          }}
        >
          A
        </div>
      </div>
    </div>
  );
}
