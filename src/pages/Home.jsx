import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Home() {
  const [slug, setSlug] = useState("");
  const navigate = useNavigate();

  const handleAccess = () => {
    if (!slug.trim()) return alert("Enter a page name");
    navigate(`/page/${slug.trim().toLowerCase()}`);
  };

  return (
    <div>
      <h2>Enter Page Name</h2>

      <input
        type="text"
        placeholder="e.g. mysecret"
        value={slug}
        onChange={(e) => setSlug(e.target.value)}
      />

      <button onClick={handleAccess}>Access</button>
    </div>
  );
}

export default Home;
