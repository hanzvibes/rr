import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Aktivitas } from "./types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function numFmt(n: number): string {
  return n.toLocaleString("id-ID");
}

export function parseRuns(raw: string): Aktivitas[] {
  if (!raw || !raw.trim()) return [];
  return raw
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((part) => {
      const lastColon = part.lastIndexOf(":");
      if (lastColon === -1) return null;
      const nama = part.slice(0, lastColon).trim();
      const km = parseInt(part.slice(lastColon + 1).trim(), 10);
      if (!nama || isNaN(km)) return null;
      return { nama, km };
    })
    .filter(Boolean) as Aktivitas[];
}

export function calcTotalKm(raw: string): number {
  return parseRuns(raw).reduce((sum, r) => sum + r.km, 0);
}

export function badgeColor(jabatan: string): string {
  const j = jabatan?.toUpperCase();
  switch (j) {
    case "FOUNDER":
      return "bg-red-900/60 text-red-300 border border-red-700/50";
    case "PRESIDENT":
      return "bg-amber-900/60 text-amber-300 border border-amber-600/50";
    case "EXCECUTOR":
      return "bg-purple-900/60 text-purple-300 border border-purple-700/50";
    case "NEGOSIATOR":
      return "bg-blue-900/60 text-blue-300 border border-blue-700/50";
    case "LIFE MEMBER":
      return "bg-cyan-900/60 text-cyan-300 border border-cyan-700/50";
    case "VIRGIN":
      return "bg-green-900/60 text-green-300 border border-green-700/50";
    case "CAPROS":
      return "bg-yellow-900/60 text-yellow-300 border border-yellow-700/50";
    case "PROSPEK":
      return "bg-zinc-800/80 text-zinc-400 border border-zinc-600/50";
    default:
      return "bg-zinc-800/80 text-zinc-400 border border-zinc-600/50";
  }
}
