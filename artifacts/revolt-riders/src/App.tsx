import { useState, useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  /* Close drawer on route change */
  useEffect(() => { setMobileOpen(false); }, []);

  /* Lock body scroll when mobile drawer is open */
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Ambient glow */}
      <div className="ambient-glow" style={{ width: 600, height: 600, background: "#7C3AED", top: -200, left: -200 }} />
      <div className="ambient-glow" style={{ width: 400, height: 400, background: "#A855F7", bottom: -100, right: -100 }} />

      {/* Mobile overlay backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless mobileOpen, always visible on md+ */}
      <div className={`fixed inset-y-0 left-0 z-50 md:relative md:z-auto md:flex transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}>
        <Sidebar
          collapsed={collapsed}
          onToggle={() => setCollapsed((c) => !c)}
          onClose={() => setMobileOpen(false)}
        />
      </div>

      {/* Main content */}
      <div className="relative flex flex-1 flex-col overflow-hidden min-w-0">
        <Switch>
          <Route path="/" component={() => <Dashboard onMenuOpen={() => setMobileOpen(true)} />} />
          <Route path="/admin" component={() => <Admin onMenuOpen={() => setMobileOpen(true)} />} />
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
