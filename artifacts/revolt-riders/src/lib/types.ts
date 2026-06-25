export type Jabatan =
  | "FOUNDER"
  | "PRESIDENT"
  | "EXCECUTOR"
  | "NEGOSIATOR"
  | "LIFE MEMBER"
  | "VIRGIN"
  | "CAPROS"
  | "PROSPEK";

export interface Rider {
  id: string;
  no: number;
  nama: string;
  alamat: string;
  ttl: string;
  bergabung: string;
  jabatan: string;
  aktivitas: string;
  total_km: number;
  created_at?: string;
}

export interface Aktivitas {
  nama: string;
  km: number;
}
