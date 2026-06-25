import { useState } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Layout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex min-h-screen bg-[#0A0A0A]">
      {/* Ambient glow decorations */}
      <div
        className="ambient-glow"
        style={{ width: 600, height: 600, background: "#7C3AED", top: -200, left: -200 }}
      />
      <div
        className="ambient-glow"
        style={{ width: 400, height: 400, background: "#A855F7", bottom: -100, right: -100 }}
      />

      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />

      <div className="relative flex flex-1 flex-col overflow-hidden">
        <Switch>
          <Route path="/" component={Dashboard} />
          <Route path="/admin" component={Admin} />
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
