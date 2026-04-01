import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Page from "./pages/Page";

function App() {
  return (
    <BrowserRouter>
      <h1>StringGuard</h1>

      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/page/:slug" element={<Page />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
