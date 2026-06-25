import { Switch, Route, Router as WouterRouter } from "wouter";
import { Toaster } from "sonner";
import Dashboard from "@/pages/Dashboard";
import Admin from "@/pages/Admin";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/admin" component={Admin} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
      <Router />
      <Toaster
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(30 8% 8%)",
            border: "1px solid hsl(35 10% 18%)",
            color: "hsl(35 20% 85%)",
            fontFamily: "Poppins, sans-serif",
            fontSize: "0.75rem",
            fontWeight: 400,
          },
        }}
      />
    </WouterRouter>
  );
}

export default App;
