import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import Leaderboard from "@/pages/Leaderboard";
import RunHistory from "@/pages/RunHistory";
import Showdown from "@/pages/Showdown";
import Trophies from "@/pages/Trophies";
import ReportCard from "@/pages/ReportCard";
import Announcements from "@/pages/Announcements";
import ClubDNA from "@/pages/ClubDNA";
import NotFound from "@/pages/not-found";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#080808]">
      <div className="ambient-glow" style={{ width: 700, height: 700, background: "radial-gradient(circle, #7C3AED 0%, transparent 70%)", top: -280, left: -280 }} />
      <div className="ambient-glow" style={{ width: 500, height: 500, background: "radial-gradient(circle, #6D28D9 0%, transparent 70%)", bottom: -200, right: -200, opacity: 0.03 }} />

      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:flex transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        <Switch>
          <Route path="/" component={() => <Dashboard onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/leaderboard" component={() => <Leaderboard onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/runs" component={() => <RunHistory onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/showdown" component={() => <Showdown onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/admin" component={() => <Admin onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/trophies" component={() => <Trophies onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/report-card" component={() => <ReportCard onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/announcements" component={() => <Announcements onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/dna" component={() => <ClubDNA onMenuOpen={() => setMobileOpen(true)} />} />
          <Route component={NotFound} />
        </Switch>
      </div>
    </div>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Layout />
      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1E1E1E",
            border: "1px solid rgba(39,39,42,0.8)",
            color: "#fff",
            fontFamily: "Inter, sans-serif",
            fontSize: "0.78rem",
            borderRadius: "12px",
          },
        }}
      />
    </WouterRouter>
  );
}

export default App;
