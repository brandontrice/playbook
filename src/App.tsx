import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { ThemeProvider } from "./lib/theme";
import { Nav } from "./components/Nav";
import { ScoreTicker } from "./components/Scoreboard/ScoreTicker";
import { Home } from "./pages/Home";
import { ConceptDetail } from "./pages/ConceptDetail";
import { Admin } from "./pages/admin/Admin";

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
        <Route path="/admin" element={<Admin />} />
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
    </ThemeProvider>
  );
}

export default App;
