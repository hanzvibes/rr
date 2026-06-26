export type BadgeTier = "legendary" | "gold" | "silver" | "bronze" | "special";
export type BadgeRarity = "legendary" | "rare" | "uncommon" | "common";

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  tier: BadgeTier;
  rarity: BadgeRarity;
}

export interface Rider {
  id: string;
  nama: string;
  jabatan: string;
  bergabung: string;
  total_km: number;
  aktivitas: string;
  [key: string]: unknown;
}

function parseRuns(aktivitas: string): { name: string; km: number }[] {
  if (!aktivitas) return [];
  return aktivitas
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => {
      const idx = s.lastIndexOf(":");
      if (idx < 0) return null;
      const name = s.slice(0, idx).trim();
      const km = parseInt(s.slice(idx + 1).trim(), 10);
      return isNaN(km) || !name ? null : { name, km };
    })
    .filter((x): x is { name: string; km: number } => x !== null);
}

function getJoinYear(bergabung: string): number | null {
  if (!bergabung) return null;
  const match = bergabung.match(/\d{4}/);
  return match ? parseInt(match[0], 10) : null;
}

export const ALL_BADGES: Badge[] = [
  {
    id: "legend",
    name: "LEGEND",
    description: "Total distance exceeds 2,000 km",
    icon: "🏆",
    tier: "legendary",
    rarity: "legendary",
  },
  {
    id: "road_warrior",
    name: "ROAD WARRIOR",
    description: "Total distance exceeds 1,500 km",
    icon: "🚀",
    tier: "gold",
    rarity: "rare",
  },
  {
    id: "velocity",
    name: "VELOCITY",
    description: "Total distance exceeds 1,000 km",
    icon: "⚡",
    tier: "silver",
    rarity: "uncommon",
  },
  {
    id: "iron",
    name: "IRON RIDER",
    description: "Total distance exceeds 500 km",
    icon: "🔥",
    tier: "bronze",
    rarity: "common",
  },
  {
    id: "explorer",
    name: "EXPLORER",
    description: "Participated in 20+ unique club runs",
    icon: "🌍",
    tier: "gold",
    rarity: "rare",
  },
  {
    id: "adventurer",
    name: "ADVENTURER",
    description: "Participated in 10+ unique club runs",
    icon: "🗺️",
    tier: "silver",
    rarity: "uncommon",
  },
  {
    id: "scout",
    name: "SCOUT",
    description: "Participated in 5+ unique club runs",
    icon: "🎯",
    tier: "bronze",
    rarity: "common",
  },
  {
    id: "royalty",
    name: "ROYALTY",
    description: "Club Founder — a pillar of the brotherhood",
    icon: "👑",
    tier: "special",
    rarity: "rare",
  },
  {
    id: "commander",
    name: "COMMANDER",
    description: "Holds an executive position in the club",
    icon: "⚔️",
    tier: "special",
    rarity: "uncommon",
  },
  {
    id: "life_member",
    name: "LIFE MEMBER",
    description: "Bonded to the club for life",
    icon: "💎",
    tier: "special",
    rarity: "rare",
  },
  {
    id: "veteran",
    name: "VETERAN",
    description: "Joined the club before 2022",
    icon: "🎖️",
    tier: "gold",
    rarity: "uncommon",
  },
  {
    id: "centurion",
    name: "CENTURION",
    description: "Averages 100+ km per run",
    icon: "🏍️",
    tier: "silver",
    rarity: "uncommon",
  },
];

const TIER_ORDER: Record<BadgeTier, number> = {
  legendary: 0,
  gold: 1,
  silver: 2,
  bronze: 3,
  special: 4,
};

export function computeBadges(rider: Rider): Badge[] {
  const runs = parseRuns(rider.aktivitas);
  const runCount = runs.length;
  const km = rider.total_km || 0;
  const avgKm = runCount > 0 ? km / runCount : 0;
  const joinYear = getJoinYear(rider.bergabung);
  const jabatan = (rider.jabatan || "").toUpperCase().trim();

  const earned: Badge[] = [];

  for (const badge of ALL_BADGES) {
    let earns = false;
    switch (badge.id) {
      case "legend":      earns = km >= 2000; break;
      case "road_warrior":earns = km >= 1500; break;
      case "velocity":    earns = km >= 1000; break;
      case "iron":        earns = km >= 500; break;
      case "explorer":    earns = runCount >= 20; break;
      case "adventurer":  earns = runCount >= 10; break;
      case "scout":       earns = runCount >= 5; break;
      case "royalty":     earns = jabatan === "FOUNDER"; break;
      case "commander":   earns = ["PRESIDENT", "EXCECUTOR", "NEGOSIATOR"].includes(jabatan); break;
      case "life_member": earns = jabatan === "LIFE MEMBER"; break;
      case "veteran":     earns = joinYear !== null && joinYear <= 2021; break;
      case "centurion":   earns = runCount >= 3 && avgKm >= 100; break;
    }
    if (earns) earned.push(badge);
  }

  return earned.sort((a, b) => TIER_ORDER[a.tier] - TIER_ORDER[b.tier]);
}

export const TIER_STYLES: Record<BadgeTier, { border: string; bg: string; text: string; glow: string; label: string }> = {
  legendary: {
    border: "border-amber-400/50",
    bg: "from-amber-500/20 via-yellow-500/10 to-transparent",
    text: "text-amber-300",
    glow: "shadow-amber-900/40",
    label: "Legendary",
  },
  gold: {
    border: "border-yellow-500/40",
    bg: "from-yellow-600/15 to-transparent",
    text: "text-yellow-400",
    glow: "shadow-yellow-900/30",
    label: "Gold",
  },
  silver: {
    border: "border-slate-400/40",
    bg: "from-slate-400/12 to-transparent",
    text: "text-slate-300",
    glow: "shadow-slate-900/20",
    label: "Silver",
  },
  bronze: {
    border: "border-orange-700/40",
    bg: "from-orange-800/12 to-transparent",
    text: "text-orange-400",
    glow: "",
    label: "Bronze",
  },
  special: {
    border: "border-purple-500/45",
    bg: "from-purple-500/18 to-transparent",
    text: "text-purple-300",
    glow: "shadow-purple-900/40",
    label: "Special",
  },
};
