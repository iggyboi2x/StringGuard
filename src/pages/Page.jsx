import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";

function Page() {
  const { slug } = useParams();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    checkPage();
  }, []);

  async function checkPage() {
    const { data, error } = await supabase
      .from("pages")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error && error.code === "PGRST116") {
      // Page does not exist
      setIsNew(true);
      setLoading(false);
    } else if (data) {
      // Page exists
      setPage(data);
      setContent(data.content || "");
      setLoading(false);
    } else {
      console.error(error);
      setLoading(false);
    }
  }

  async function handleSubmit() {
    if (!password) {
      alert("Enter password");
      return;
    }

    if (isNew) {
      // CREATE NEW PAGE
      const hashed = await bcrypt.hash(password, 10);

      const { data, error } = await supabase
        .from("pages")
        .insert([
          {
            slug: slug,
            password: hashed,
            content: "",
          },
        ])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setPage(data);
      setContent("");
      setUnlocked(true);
    } else {
      // VERIFY PASSWORD
      const valid = await bcrypt.compare(password, page.password);

      if (!valid) {
        alert("Wrong password");
        return;
      }

      setUnlocked(true);
    }
  }

  async function handleSave() {
    setSaving(true);

    const { error } = await supabase
      .from("pages")
      .update({
        content: content,
        updated_at: new Date(),
      })
      .eq("slug", slug);

    if (error) {
      console.error(error);
      alert("Failed to save");
    } else {
      alert("Saved!");
    }

    setSaving(false);
  }

  if (loading) return <p>Loading...</p>;

  return (
    <div>
      <h2>Page: {slug}</h2>

      {!unlocked ? (
        <div>
          <h3>{isNew ? "Create Password" : "Enter Password"}</h3>

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button onClick={handleSubmit}>{isNew ? "Create" : "Unlock"}</button>
        </div>
      ) : (
        <div>
          <h3>Unlocked!</h3>

          <textarea
            rows="10"
            cols="50"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Write something secret..."
          />

          <br />

          <button onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      )}
    </div>
  );
}

export default Page;
