import {
  BrowserRouter,
  Routes,
  Route,
  useLocation,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Page from "./pages/Page";

function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const slug = location.pathname.startsWith("/page/")
    ? location.pathname.replace("/page/", "")
    : null;

  return (
    <header className="app-header">
      <span className="app-logo" onClick={() => navigate("/")} title="Go home">
        String<span>Guard</span>
      </span>
      {slug && (
        <span className="app-slug">
          / <strong>{slug}</strong>
        </span>
      )}
    </header>
  );
}

function App() {
  return (
    <div className="app-shell">
      <BrowserRouter>
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/page/:slug" element={<Page />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
