import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [slug, setSlug] = useState("");
  const navigate = useNavigate();

  const handleAccess = () => {
    const clean = slug
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9-_]/g, "-") // only allow safe characters
      .replace(/-+/g, "-") // collapse multiple dashes
      .slice(0, 64); // max 64 characters
    if (!clean) return;
    navigate(`/page/${clean}`);
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleAccess();
  };

  return (
    <div className="home-wrap fade-up">
      <div className="home-card">
        <p className="home-eyebrow">// secure notepad</p>
        <h1 className="home-title">
          Your private
          <br />
          space to write.
        </h1>
        <p className="home-subtitle">
          Enter a page name to create or access a password-protected note.
          Nobody else can read it without your key.
        </p>

        <div className="input-group">
          <label className="input-label">Page name</label>
          <input
            className="sg-input"
            type="text"
            placeholder="e.g. mysecret"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            onKeyDown={handleKey}
            autoFocus
          />
          <button
            className="sg-btn"
            onClick={handleAccess}
            disabled={!slug.trim()}
          >
            Open Page →
          </button>
        </div>
      </div>
    </div>
  );
}

export default Home;
