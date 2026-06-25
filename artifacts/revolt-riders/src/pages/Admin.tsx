import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, LogOut, Plus, RefreshCw, Save, Trash2, X, Search, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { numFmt, calcTotalKm, cn } from "@/lib/utils";
import type { Rider } from "@/lib/types";
import { Topbar } from "@/components/layout/Topbar";

const JABATAN_LIST = ["FOUNDER", "PRESIDENT", "EXCECUTOR", "NEGOSIATOR", "LIFE MEMBER", "VIRGIN", "CAPROS", "PROSPEK"];
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "revolt2026";
const SESSION_KEY = "rr_admin_auth";

function rankBadgeClass(jabatan: string): string {
  const j = jabatan?.toUpperCase();
  if (j === "FOUNDER") return "badge-red";
  if (j === "PRESIDENT") return "badge-yellow";
  if (j === "EXCECUTOR") return "badge-purple";
  if (j === "NEGOSIATOR") return "badge-blue";
  if (j === "LIFE MEMBER") return "badge-cyan";
  if (j === "VIRGIN") return "badge-green";
  if (j === "CAPROS") return "badge-yellow";
  return "badge-gray";
}

type FormData = {
  no: string; nama: string; alamat: string; ttl: string;
  bergabung: string; jabatan: string; aktivitas: string;
};

const EMPTY_FORM: FormData = {
  no: "", nama: "", alamat: "", ttl: "", bergabung: "", jabatan: "PROSPEK", aktivitas: "",
};

/* ── Login Screen ────────────────────────────────────────────── */
function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [pw, setPw] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => { ref.current?.focus(); }, []);

  function submit() {
    if (pw === ADMIN_PASSWORD) {
      sessionStorage.setItem(SESSION_KEY, "1");
      onLogin();
    } else {
      setError("Incorrect password. Try again.");
      setPw("");
      setTimeout(() => setError(""), 3000);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12 bg-[#0A0A0A]">
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full bg-[#7C3AED] opacity-[0.06] blur-[120px]" />
      </div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }} className="relative w-full max-w-sm">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#A855F7] shadow-2xl shadow-purple-900/40">
            <span className="text-xl font-bold text-white">R</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight">Admin Access</h1>
          <p className="mt-1.5 text-[0.78rem] text-[#71717A]">Revolt Riders — Protected Panel</p>
        </div>
        <div className="glass-card p-6 sm:p-8">
          <label className="text-[0.72rem] font-medium uppercase tracking-wider text-[#71717A] mb-2 block">Password</label>
          <div className="relative mb-4">
            <input ref={ref} type={show ? "text" : "password"} value={pw}
              onChange={(e) => { setPw(e.target.value); setError(""); }}
              onKeyDown={(e) => { if (e.key === "Enter") submit(); }}
              placeholder="Enter admin password"
              className="input-dark w-full px-4 py-3 pr-12 text-[0.85rem]" />
            <button type="button" onClick={() => setShow(!show)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#71717A] hover:text-[#A1A1AA] transition-colors">
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="mb-4 text-[0.75rem] text-red-400">{error}</motion.p>
            )}
          </AnimatePresence>
          <button onClick={submit} className="btn-purple w-full py-3 text-[0.85rem] font-medium">Sign In</button>
        </div>
      </motion.div>
    </div>
  );
}

/* ── Form field ──────────────────────────────────────────────── */
function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <label className="text-[0.7rem] font-medium uppercase tracking-wider text-[#71717A]">{label}</label>
        {hint && <span className="text-[0.62rem] text-[#52525B]">{hint}</span>}
      </div>
      {children}
    </div>
  );
}

/* ── Editor panel ────────────────────────────────────────────── */
function EditorPanel({
  selectedId, form, setForm, saving, deleting,
  onSave, onDelete, onCancel, onConfirmDelete,
}: {
  selectedId: string | "new" | null;
  form: FormData;
  setForm: (f: FormData) => void;
  saving: boolean; deleting: boolean;
  onSave: () => void; onDelete: () => void;
  onCancel: () => void; onConfirmDelete: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const totalKm = calcTotalKm(form.aktivitas);

  if (!selectedId) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.03)] text-[#52525B]">
            <Plus size={28} />
          </div>
          <p className="text-[0.85rem] font-medium text-[#52525B]">Select a rider to edit</p>
          <p className="mt-1 text-[0.72rem] text-[#3F3F46]">or tap + New Rider</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 md:p-6">
      <motion.div key={selectedId} initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.2 }} className="mx-auto max-w-xl">

        <div className="mb-5 flex items-center gap-3">
          {/* Back button — visible always on mobile for UX clarity */}
          <button onClick={onCancel}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-[rgba(39,39,42,0.6)] bg-[rgba(255,255,255,0.03)] text-[#71717A] hover:text-white transition-colors md:hidden">
            <ArrowLeft size={16} />
          </button>
          <div className="flex-1">
            <h2 className="text-[0.92rem] font-semibold text-white">
              {selectedId === "new" ? "New Rider" : "Edit Rider"}
            </h2>
            <p className="mt-0.5 text-[0.7rem] text-[#71717A]">
              {selectedId === "new" ? "Add a new club member" : "Update member information"}
            </p>
          </div>
          <button onClick={onCancel} className="hidden md:flex h-9 w-9 items-center justify-center rounded-xl btn-ghost p-0">
            <X size={16} />
          </button>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-3">
            <Field label="No">
              <input type="number" value={form.no} onChange={(e) => setForm({ ...form, no: e.target.value })}
                className="input-dark w-full px-3 py-2.5 text-[0.82rem]" />
            </Field>
            <div className="col-span-3">
              <Field label="Full Name">
                <input type="text" value={form.nama} onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  placeholder="Rider name..." className="input-dark w-full px-3 py-2.5 text-[0.82rem]" />
              </Field>
            </div>
          </div>

          <Field label="Chapter / Alamat">
            <input type="text" value={form.alamat} onChange={(e) => setForm({ ...form, alamat: e.target.value })}
              placeholder="City or chapter..." className="input-dark w-full px-3 py-2.5 text-[0.82rem]" />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Field label="TTL">
              <input type="text" value={form.ttl} onChange={(e) => setForm({ ...form, ttl: e.target.value })}
                placeholder="City, DD-MM-YYYY" className="input-dark w-full px-3 py-2.5 text-[0.82rem]" />
            </Field>
            <Field label="Bergabung">
              <input type="text" value={form.bergabung} onChange={(e) => setForm({ ...form, bergabung: e.target.value })}
                placeholder="YYYY-MM-DD" className="input-dark w-full px-3 py-2.5 text-[0.82rem]" />
            </Field>
          </div>

          <Field label="Jabatan / Rank">
            <select value={form.jabatan} onChange={(e) => setForm({ ...form, jabatan: e.target.value })}
              className="input-dark w-full px-3 py-2.5 text-[0.82rem] cursor-pointer">
              {JABATAN_LIST.map((j) => <option key={j}>{j}</option>)}
            </select>
          </Field>

          <Field label="Aktivitas / Run Log" hint="NamaRun:km; NamaRun:km;">
            <textarea value={form.aktivitas} onChange={(e) => setForm({ ...form, aktivitas: e.target.value })}
              rows={4} placeholder="Sunday Ride:150; Night Ride:80; Touring Bali:320;"
              className="input-dark w-full resize-y px-3 py-2.5 text-[0.82rem] font-[inherit]" />
          </Field>

          <div className="rounded-xl border border-[rgba(139,92,246,0.2)] bg-gradient-to-br from-[rgba(139,92,246,0.08)] to-transparent p-4">
            <p className="mb-1 text-[0.68rem] font-medium uppercase tracking-wider text-[#8B5CF6]">Auto-calculated Total KM</p>
            <p className="text-3xl font-bold text-white">{numFmt(totalKm)} <span className="text-lg font-medium text-[#8B5CF6]">km</span></p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-3 pt-1 pb-6">
            <button onClick={onSave} disabled={saving}
              className="btn-purple flex flex-1 items-center justify-center gap-2 py-3 text-[0.82rem] font-medium disabled:opacity-50">
              <Save size={15} />
              {saving ? "Saving..." : "Save"}
            </button>
            {selectedId !== "new" && (
              <button onClick={() => setShowConfirm(true)} disabled={deleting}
                className="flex h-11 w-11 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all disabled:opacity-50">
                <Trash2 size={15} />
              </button>
            )}
            <button onClick={onCancel} className="btn-ghost hidden md:flex items-center gap-2 px-4 py-3 text-[0.82rem] text-[#71717A]">
              Cancel
            </button>
          </div>
        </div>
      </motion.div>

      {/* Delete confirm */}
      <AnimatePresence>
        {showConfirm && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirm(false)}>
            <motion.div
              initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }} transition={{ type: "spring", damping: 28, stiffness: 380 }}
              className="mx-4 w-full sm:max-w-sm rounded-2xl border border-red-500/20 bg-[#111111] p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/10 text-red-400">
                <Trash2 size={20} />
              </div>
              <h3 className="mb-2 text-base font-semibold text-white">Delete Rider</h3>
              <p className="mb-5 text-[0.78rem] text-[#71717A]">This will permanently remove the rider. This action cannot be undone.</p>
              <div className="flex gap-3">
                <button onClick={() => { onDelete(); setShowConfirm(false); }} disabled={deleting}
                  className="flex-1 rounded-xl bg-red-600 py-2.5 text-[0.82rem] font-medium text-white hover:bg-red-500 disabled:opacity-60 transition-colors">
                  {deleting ? "Deleting..." : "Yes, Delete"}
                </button>
                <button onClick={() => setShowConfirm(false)} className="btn-ghost flex-1 py-2.5 text-[0.82rem]">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ── Main Admin ──────────────────────────────────────────────── */
export default function Admin({ onMenuOpen }: { onMenuOpen?: () => void }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem(SESSION_KEY) === "1");
  const [riders, setRiders] = useState<Rider[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string | "new" | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchRiders = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.from("riders").select("*").order("no", { ascending: true });
      if (error) throw error;
      setRiders(data || []);
    } catch { toast.error("Failed to load riders"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (authed) fetchRiders(); }, [authed, fetchRiders]);

  useEffect(() => {
    if (!authed) return;
    const fn = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") { e.preventDefault(); handleSave(); }
      if (e.key === "Escape") cancelEdit();
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [authed, form, selectedId]);

  function selectRider(rider: Rider) {
    setSelectedId(rider.id);
    setForm({ no: String(rider.no ?? ""), nama: rider.nama ?? "", alamat: rider.alamat ?? "",
      ttl: rider.ttl ?? "", bergabung: rider.bergabung ?? "", jabatan: rider.jabatan ?? "PROSPEK",
      aktivitas: rider.aktivitas ?? "" });
  }

  function cancelEdit() { setSelectedId(null); setForm(EMPTY_FORM); }

  async function handleSave() {
    if (!selectedId) return;
    setSaving(true);
    try {
      const payload = {
        no: parseInt(form.no) || 0, nama: form.nama.trim(), alamat: form.alamat.trim(),
        ttl: form.ttl.trim(), bergabung: form.bergabung.trim(), jabatan: form.jabatan,
        aktivitas: form.aktivitas.trim(), total_km: calcTotalKm(form.aktivitas),
      };
      if (selectedId === "new") {
        const { error } = await supabase.from("riders").insert([payload]);
        if (error) throw error;
        toast.success("Rider added!");
      } else {
        const { error } = await supabase.from("riders").update(payload).eq("id", selectedId);
        if (error) throw error;
        toast.success("Rider updated!");
      }
      await fetchRiders();
      cancelEdit();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed to save"); }
    finally { setSaving(false); }
  }

  async function handleDelete() {
    if (!selectedId || selectedId === "new") return;
    setDeleting(true);
    try {
      const { error } = await supabase.from("riders").delete().eq("id", selectedId);
      if (error) throw error;
      toast.success("Rider deleted.");
      await fetchRiders();
      cancelEdit();
    } catch (e: unknown) { toast.error(e instanceof Error ? e.message : "Failed to delete"); }
    finally { setDeleting(false); }
  }

  const filteredRiders = riders.filter((r) => !search || r.nama?.toLowerCase().includes(search.toLowerCase()));

  if (!authed) return <LoginScreen onLogin={() => setAuthed(true)} />;

  /* On mobile: show list OR editor, not both */
  const showEditorMobile = selectedId !== null;

  const topbarActions = (
    <button onClick={() => { setSelectedId("new"); setForm(EMPTY_FORM); }}
      className="btn-purple flex items-center gap-1.5 px-3 py-2 text-[0.72rem] font-medium">
      <Plus size={13} /> <span className="hidden sm:inline">New Rider</span>
    </button>
  );

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <Topbar
        title="Admin Panel"
        subtitle={`${riders.length} riders total`}
        onRefresh={fetchRiders}
        loading={loading}
        onMenuOpen={onMenuOpen}
        actions={
          <div className="flex items-center gap-2">
            {topbarActions}
            <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setAuthed(false); }}
              className="btn-ghost flex items-center gap-1.5 px-3 py-2 text-[0.72rem] text-[#71717A] hover:text-red-400 transition-colors">
              <LogOut size={13} /> <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left — Rider List (hidden on mobile when editor is open) */}
        <div className={cn(
          "flex flex-col border-r border-[rgba(39,39,42,0.6)] bg-[#0D0D0D]",
          "w-full md:w-72 md:flex-shrink-0",
          showEditorMobile ? "hidden md:flex" : "flex"
        )}>
          <div className="border-b border-[rgba(39,39,42,0.6)] p-3">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#71717A]" />
              <input type="search" placeholder="Search name..." value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input-dark w-full pl-9 pr-3 py-2.5 text-[0.78rem]" />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="flex h-24 items-center justify-center">
                <RefreshCw size={16} className="animate-spin text-[#8B5CF6]" />
              </div>
            ) : filteredRiders.length === 0 ? (
              <p className="py-8 text-center text-[0.75rem] text-[#52525B]">No riders found</p>
            ) : (
              filteredRiders.map((rider) => (
                <button key={rider.id} onClick={() => selectRider(rider)}
                  className={cn(
                    "w-full border-b border-[rgba(39,39,42,0.4)] px-4 py-3 text-left transition-all active:scale-[0.99]",
                    "hover:bg-[rgba(255,255,255,0.03)]",
                    selectedId === rider.id && "bg-[rgba(139,92,246,0.08)] border-l-2 border-l-[#8B5CF6]"
                  )}>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[0.62rem] font-medium text-[#52525B]">#{rider.no}</span>
                        <span className="truncate text-[0.8rem] font-medium text-[#A1A1AA]">{rider.nama}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={rankBadgeClass(rider.jabatan)}>{rider.jabatan}</span>
                        {rider.alamat && <span className="text-[0.62rem] text-[#52525B] truncate">{rider.alamat}</span>}
                      </div>
                    </div>
                    <div className="flex-shrink-0 text-right">
                      <span className="text-[0.78rem] font-semibold text-[#8B5CF6]">{numFmt(rider.total_km || 0)}</span>
                      <p className="text-[0.6rem] text-[#52525B]">km</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — Editor (full width on mobile when open) */}
        <div className={cn(
          "flex-1 bg-[#0A0A0A] overflow-hidden",
          showEditorMobile ? "flex flex-col" : "hidden md:flex md:flex-col"
        )}>
          <AnimatePresence mode="wait">
            <EditorPanel
              key={selectedId ?? "empty"}
              selectedId={selectedId}
              form={form}
              setForm={setForm}
              saving={saving}
              deleting={deleting}
              onSave={handleSave}
              onDelete={handleDelete}
              onCancel={cancelEdit}
              onConfirmDelete={handleDelete}
            />
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
