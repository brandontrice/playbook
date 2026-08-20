import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "./lib/theme";
import { Nav } from "./components/Nav";
import { Home } from "./pages/Home";
import { ConceptDetail } from "./pages/ConceptDetail";
import { Admin } from "./pages/admin/Admin";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <div className="min-h-svh">
          <Nav />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/concepts/:slug" element={<ConceptDetail />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
