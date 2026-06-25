import { useState, useEffect, useCallback, useRef } from "react";
import { Eye, EyeOff, LogOut, Plus, RefreshCw, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, badgeColor, calcTotalKm, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";

const JABATAN_LIST = ["FOUNDER", "PRESIDENT", "EXCECUTOR", "NEGOSIATOR", "LIFE MEMBER", "VIRGIN", "CAPROS", "PROSPEK"];
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "revolt2026";
const SESSION_KEY = "rr_admin_auth";

function RankBadge({ jabatan }: { jabatan: string }) {
  return (
    <span
      className={cn(
        "inline-block px-1.5 py-0.5 text-[0.5rem] tracking-widest uppercase clip-slant-sm",
        badgeColor(jabatan)
      )}
    >
      {jabatan}
    </span>
  );
}

type FormData = {
  no: string;
  nama: string;
  alamat: string;
  ttl: string;
  bergabung: string;
  jabatan: string;
  aktivitas: string;
};

const EMPTY_FORM: FormData = {
  no: "", nama: "", alamat: "", ttl: "", bergabung: "", jabatan: "PROSPEK", aktivitas: "",
};

function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  function handleSubmit() {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onLogin();
    } else {
      setError("Password salah. Coba lagi.");
      setPw("");
      setTimeout(() => setError(""), 3000);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[hsl(30_8%_4%)] px-4">
      <div className="w-full max-w-sm animate-fade-in">
        <div className="mb-6 flex items-center gap-3">
          <div className="clip-slant flex h-10 w-10 items-center justify-center bg-[#c9973b] text-[hsl(30_8%_4%)]">
            R
          </div>
          <div>
            <h1 className="text-sm tracking-widest uppercase text-[hsl(35_20%_85%)]">Admin Panel</h1>
            <p className="text-[0.55rem] tracking-wider text-[hsl(35_15%_40%)]">REVOLT RIDERS</p>
          </div>
        </div>

        <div className="rounded border border-[hsl(35_10%_15%)] bg-[hsl(30_6%_6%)] p-6">
          <p className="label-upper mb-4">Masukkan Password Admin</p>

          <div className="relative mb-3">
            <input
              ref={inputRef}
              type={show ? "text" : "password"}
              value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              placeholder="Password..."
              className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_4%)] px-3 py-2 pr-10 text-[0.7rem] text-[hsl(35_20%_82%)] placeholder-[hsl(35_15%_38%)] outline-none focus:border-[#c9973b]/50 transition-colors"
            />
            <button
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[hsl(35_15%_40%)] hover:text-[hsl(35_20%_70%)] transition-colors"
              onClick={() => setShow(!show)}
            >
              {show ? <EyeOff size={14} /> : <Eye size={14} />}
            </button>
          </div>

          {error && (
            <p className="mb-3 text-[0.65rem] text-red-400">{error}</p>
          )}

          <button
            onClick={handleSubmit}
            className="clip-slant w-full bg-[#c9973b] py-2 text-[0.65rem] uppercase tracking-widest text-[hsl(30_8%_4%)] transition-all hover:bg-[#d4a44a]"
          >
            Masuk
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("riders").select("*").order("no", { ascending: true });
      if (error) throw error;
      setRiders(data || []);
    } catch {
      toast.error("Gagal memuat data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { if (authed) fetchRiders(); }, [authed, fetchRiders]);

  useEffect(() => {
    if (!authed) return;
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Escape") { setSelectedId(null); setForm(EMPTY_FORM); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [authed, form, selectedId]);

  function selectRider(rider: Rider) {
    setSelectedId(rider.id);
    setForm({
      no: String(rider.no ?? ""),
      nama: rider.nama ?? "",
      alamat: rider.alamat ?? "",
      ttl: rider.ttl ?? "",
      bergabung: rider.bergabung ?? "",
      jabatan: rider.jabatan ?? "PROSPEK",
      aktivitas: rider.aktivitas ?? "",
    });
  }

  function selectNew() {
    setSelectedId("new");
    setForm(EMPTY_FORM);
  }

  function cancelEdit() {
    setSelectedId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const payload = {
        no: parseInt(form.no) || 0,
        nama: form.nama.trim(),
        alamat: form.alamat.trim(),
        ttl: form.ttl.trim(),
        bergabung: form.bergabung.trim(),
        jabatan: form.jabatan,
        aktivitas: form.aktivitas.trim(),
        total_km: calcTotalKm(form.aktivitas),
      };

      if (selectedId === "new") {
        const { error } = await supabase.from("riders").insert([payload]);
        if (error) throw error;
        toast.success("Rider ditambahkan!");
      } else {
        const { error } = await supabase.from("riders").update(payload).eq("id", selectedId);
        if (error) throw error;
        toast.success("Rider diupdate!");
      }
      await fetchRiders();
      cancelEdit();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal menyimpan");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!selectedId || selectedId === "new") return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("riders").delete().eq("id", selectedId);
      if (error) throw error;
      toast.success("Rider dihapus!");
      await fetchRiders();
      cancelEdit();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : "Gagal menghapus");
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  }

  const filteredRiders = riders.filter((r) =>
    !search || r.nama?.toLowerCase().includes(search.toLowerCase())
  );

  const totalKm = calcTotalKm(form.aktivitas);

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  return (
    <div className="flex min-h-screen flex-col">
      {/* Topbar */}
      <div className="flex items-center justify-between border-b border-[hsl(35_10%_12%)] bg-[hsl(30_8%_5%)] px-4 py-2.5">
        <div className="flex items-center gap-3">
          <div className="clip-slant flex h-8 w-8 items-center justify-center bg-[#c9973b] text-[hsl(30_8%_4%)] text-xs">R</div>
          <div>
            <span className="text-[0.65rem] uppercase tracking-widest text-[hsl(35_20%_80%)]">⚙ Admin Panel</span>
            <span className="ml-2 text-[0.55rem] text-[hsl(35_15%_42%)]">{riders.length} riders</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={selectNew}
            className="clip-slant flex items-center gap-1.5 bg-[#c9973b] px-3 py-1.5 text-[0.6rem] uppercase tracking-wider text-[hsl(30_8%_4%)] hover:bg-[#d4a44a] transition-colors"
          >
            <Plus size={12} />
            Rider
          </button>
          <button
            onClick={() => { fetchRiders(); toast.info("Refreshing..."); }}
            disabled={loading}
            className="clip-slant flex items-center gap-1.5 border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_8%)] px-3 py-1.5 text-[0.6rem] uppercase tracking-wider text-[hsl(35_15%_60%)] hover:border-[#c9973b]/40 hover:text-[#c9973b] transition-colors disabled:opacity-40"
          >
            <RefreshCw size={12} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
            className="clip-slant flex items-center gap-1.5 border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_8%)] px-3 py-1.5 text-[0.6rem] uppercase tracking-wider text-[hsl(35_15%_60%)] hover:border-red-700/50 hover:text-red-400 transition-colors"
          >
            <LogOut size={12} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel: Rider List */}
        <div className="flex w-64 flex-shrink-0 flex-col border-r border-[hsl(35_10%_12%)] bg-[hsl(30_6%_5%)]">
          <div className="border-b border-[hsl(35_10%_12%)] px-3 py-2">
            <input
              type="search"
              placeholder="Cari nama..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded border border-[hsl(35_10%_16%)] bg-[hsl(30_6%_4%)] px-2.5 py-1.5 text-[0.65rem] text-[hsl(35_20%_78%)] placeholder-[hsl(35_15%_38%)] outline-none focus:border-[#c9973b]/50 transition-colors"
            />
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-20 items-center justify-center">
                <RefreshCw size={14} className="animate-spin text-[#c9973b]" />
              </div>
            ) : filteredRiders.length === 0 ? (
              <p className="py-6 text-center text-[0.6rem] text-[hsl(35_15%_40%)]">No riders</p>
            ) : (
              filteredRiders.map((rider) => (
                <button
                  key={rider.id}
                  onClick={() => selectRider(rider)}
                  className={cn(
                    "w-full border-b border-[hsl(35_10%_10%)] px-3 py-2.5 text-left transition-all hover:bg-[hsl(30_6%_8%)]",
                    selectedId === rider.id ? "bg-[hsl(30_8%_9%)] border-l-2 border-l-[#c9973b]" : ""
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-[0.55rem] text-[hsl(35_15%_42%)]">#{rider.no}</span>
                        <span className="truncate text-[0.65rem] text-[hsl(35_20%_80%)]">{rider.nama}</span>
                      </div>
                      <RankBadge jabatan={rider.jabatan} />
                    </div>
                    <span className="flex-shrink-0 text-[0.6rem] text-[#c9973b]">{numFmt(rider.total_km || 0)}</span>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Editor */}
        <div className="flex-1 overflow-y-auto bg-[hsl(30_8%_4%)] p-5">
          {!selectedId ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <div className="clip-slant mx-auto mb-4 flex h-14 w-14 items-center justify-center bg-[hsl(30_6%_8%)] text-[hsl(35_15%_35%)]">
                  <Plus size={24} />
                </div>
                <p className="text-[0.7rem] text-[hsl(35_15%_40%)]">Pilih rider atau tambah baru</p>
              </div>
            </div>
          ) : (
            <div className="mx-auto max-w-xl animate-fade-in">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-[0.75rem] uppercase tracking-widest text-[hsl(35_20%_80%)]">
                  {selectedId === "new" ? "Tambah Rider Baru" : "Edit Rider"}
                </h2>
                <button onClick={cancelEdit} className="text-[hsl(35_15%_40%)] hover:text-[hsl(35_20%_70%)] transition-colors">
                  <X size={16} />
                </button>
              </div>

              <div className="space-y-3">
                {/* Row: No + Nama */}
                <div className="grid grid-cols-4 gap-3">
                  <div>
                    <label className="label-upper block mb-1">No</label>
                    <input
                      type="number"
                      value={form.no}
                      onChange={(e) => setForm({ ...form, no: e.target.value })}
                      className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] outline-none focus:border-[#c9973b]/50 transition-colors"
                    />
                  </div>
                  <div className="col-span-3">
                    <label className="label-upper block mb-1">Nama</label>
                    <input
                      type="text"
                      value={form.nama}
                      onChange={(e) => setForm({ ...form, nama: e.target.value })}
                      className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] outline-none focus:border-[#c9973b]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Alamat */}
                <div>
                  <label className="label-upper block mb-1">Chapter / Alamat</label>
                  <input
                    type="text"
                    value={form.alamat}
                    onChange={(e) => setForm({ ...form, alamat: e.target.value })}
                    className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] outline-none focus:border-[#c9973b]/50 transition-colors"
                  />
                </div>

                {/* TTL + Bergabung */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label-upper block mb-1">TTL</label>
                    <input
                      type="text"
                      value={form.ttl}
                      onChange={(e) => setForm({ ...form, ttl: e.target.value })}
                      placeholder="Kota, DD-MM-YYYY"
                      className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] placeholder-[hsl(35_15%_35%)] outline-none focus:border-[#c9973b]/50 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="label-upper block mb-1">Bergabung</label>
                    <input
                      type="text"
                      value={form.bergabung}
                      onChange={(e) => setForm({ ...form, bergabung: e.target.value })}
                      placeholder="YYYY-MM-DD"
                      className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] placeholder-[hsl(35_15%_35%)] outline-none focus:border-[#c9973b]/50 transition-colors"
                    />
                  </div>
                </div>

                {/* Jabatan */}
                <div>
                  <label className="label-upper block mb-1">Jabatan</label>
                  <select
                    value={form.jabatan}
                    onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
                    className="w-full rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] outline-none focus:border-[#c9973b]/50 cursor-pointer transition-colors"
                  >
                    {JABATAN_LIST.map((j) => <option key={j} value={j}>{j}</option>)}
                  </select>
                </div>

                {/* Aktivitas */}
                <div>
                  <label className="label-upper block mb-1">Aktivitas</label>
                  <p className="mb-1.5 text-[0.55rem] text-[hsl(35_15%_38%)]">Format: NamaRun:km; NamaRun:km;</p>
                  <textarea
                    value={form.aktivitas}
                    onChange={(e) => setForm({ ...form, aktivitas: e.target.value })}
                    rows={4}
                    placeholder="Sunday Ride:150; Night Ride:80;"
                    className="w-full resize-y rounded border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_5%)] px-2.5 py-2 text-[0.7rem] text-[hsl(35_20%_82%)] placeholder-[hsl(35_15%_35%)] outline-none focus:border-[#c9973b]/50 transition-colors font-[inherit]"
                  />
                </div>

                {/* Total KM (auto) */}
                <div>
                  <label className="label-upper block mb-1">Total KM (auto)</label>
                  <div className="flex items-center gap-2 rounded border border-amber-900/30 bg-amber-950/20 px-3 py-2">
                    <span className="text-xl text-[#c9973b]">{numFmt(totalKm)}</span>
                    <span className="text-[0.6rem] text-amber-700">km</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-2 pt-2">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="clip-slant flex flex-1 items-center justify-center gap-1.5 bg-[#c9973b] py-2.5 text-[0.65rem] uppercase tracking-wider text-[hsl(30_8%_4%)] hover:bg-[#d4a44a] disabled:opacity-60 transition-colors"
                  >
                    <Save size={13} />
                    {saving ? "Menyimpan..." : "Simpan (Ctrl+S)"}
                  </button>
                  {selectedId !== "new" && (
                    <button
                      onClick={() => setShowConfirm(true)}
                      disabled={deleting}
                      className="clip-slant flex items-center gap-1.5 border border-red-800/50 bg-red-950/30 px-3 py-2.5 text-[0.65rem] uppercase tracking-wider text-red-400 hover:bg-red-950/50 disabled:opacity-60 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                  <button
                    onClick={cancelEdit}
                    className="clip-slant flex items-center gap-1.5 border border-[hsl(35_10%_18%)] bg-[hsl(30_6%_8%)] px-3 py-2.5 text-[0.65rem] uppercase tracking-wider text-[hsl(35_15%_55%)] hover:text-[hsl(35_20%_75%)] transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm Dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="mx-4 w-full max-w-sm rounded border border-red-800/40 bg-[hsl(30_8%_7%)] p-6 animate-fade-in"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="mb-2 text-[0.75rem] uppercase tracking-wider text-red-400">Hapus Rider</h3>
            <p className="mb-5 text-[0.68rem] text-[hsl(35_15%_55%)]">
              Apakah kamu yakin ingin menghapus rider ini? Tindakan ini tidak bisa dibatalkan.
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="clip-slant flex-1 bg-red-700 py-2 text-[0.65rem] uppercase tracking-wider text-white hover:bg-red-600 disabled:opacity-60 transition-colors"
              >
                {deleting ? "Menghapus..." : "Ya, Hapus"}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                className="clip-slant flex-1 border border-[hsl(35_10%_18%)] py-2 text-[0.65rem] uppercase tracking-wider text-[hsl(35_15%_55%)] hover:text-[hsl(35_20%_75%)] transition-colors"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
