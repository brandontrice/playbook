import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { ThemeProvider } from "./lib/theme";
import { Nav } from "./components/Nav";
import { ScoreTicker } from "./components/Scoreboard/ScoreTicker";
import { Home } from "./pages/Home";
import { ConceptDetail } from "./pages/ConceptDetail";
import { Pricing } from "./pages/Pricing";

// The authoring UI is only ever used by one person, code-splitting it out
// keeps it from shipping in the bundle every regular visitor downloads.
const Admin = lazy(() => import("./pages/admin/Admin").then((m) => ({ default: m.Admin })));

function AppRoutes() {
  const location = useLocation();
  return (
    // Keying on pathname remounts this wrapper on every navigation, which
    // is what re-triggers the CSS fade-in, a simple page transition without
    // pulling in a whole animation library for it.
    <div key={location.pathname} className="pb-page-fade">
      <Routes location={location}>
        <Route path="/" element={<Home />} />
        <Route path="/concepts/:slug" element={<ConceptDetail />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route
          path="/admin"
          element={
            <Suspense fallback={<div className="pb-skeleton m-6 h-40" />}>
              <Admin />
            </Suspense>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-svh">
          <Nav />
          <ScoreTicker />
          <AppRoutes />
        </div>
      </BrowserRouter>
      <Analytics />
    </ThemeProvider>
  );
}

export default App;
