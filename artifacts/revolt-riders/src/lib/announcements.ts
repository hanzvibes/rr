import { useState, useEffect, useCallback } from "react";

export type AnnouncementType = "info" | "event" | "urgent";

export interface Announcement {
  id: string;
  title: string;
  body: string;
  type: AnnouncementType;
  pinned: boolean;
  date: string;
}

const STORAGE_KEY = "rr_announcements";

function loadAnnouncements(): Announcement[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as Announcement[];
  } catch {
    return [];
  }
}

function saveAnnouncements(list: Announcement[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  window.dispatchEvent(new CustomEvent("rr_announcements_changed"));
}

export function useAnnouncements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(loadAnnouncements);

  useEffect(() => {
    function onUpdate() {
      setAnnouncements(loadAnnouncements());
    }
    window.addEventListener("rr_announcements_changed", onUpdate);
    return () => window.removeEventListener("rr_announcements_changed", onUpdate);
  }, []);

  const addAnnouncement = useCallback((ann: Omit<Announcement, "id" | "date">) => {
    const current = loadAnnouncements();
    const next: Announcement = {
      ...ann,
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
    };
    const updated = [next, ...current];
    saveAnnouncements(updated);
    setAnnouncements(updated);
  }, []);

  const deleteAnnouncement = useCallback((id: string) => {
    const current = loadAnnouncements();
    const updated = current.filter(a => a.id !== id);
    saveAnnouncements(updated);
    setAnnouncements(updated);
  }, []);

  const togglePin = useCallback((id: string) => {
    const current = loadAnnouncements();
    const updated = current.map(a => a.id === id ? { ...a, pinned: !a.pinned } : a);
    saveAnnouncements(updated);
    setAnnouncements(updated);
  }, []);

  const sortedAnnouncements = [...announcements].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });

  return { announcements: sortedAnnouncements, addAnnouncement, deleteAnnouncement, togglePin };
}
