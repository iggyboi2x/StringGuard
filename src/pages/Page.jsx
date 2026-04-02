import { useParams } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function Page() {
  const { slug } = useParams();

  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockError, setLockError] = useState("");
  const MAX_ATTEMPTS = 5;

  const [tabs, setTabs] = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [renamingTabId, setRenamingTabId] = useState(null);
  const [renameValue, setRenameValue] = useState("");
  const saveFlashTimer = useRef(null);

  useEffect(() => {
    checkPage();
  }, []);

  async function checkPage() {
    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, password, tabs, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      // Treat any fetch error as a new page so the user can still proceed
      setIsNew(true);
    } else if (!data) {
      // No row found — this is a new page
      setIsNew(true);
    } else {
      setPage(data);
      const loadedTabs =
        data.tabs && data.tabs.length > 0
          ? data.tabs
          : [{ id: generateId(), label: "Tab 1", content: "" }];
      setTabs(loadedTabs);
      setActiveTabId(loadedTabs[0].id);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!password) return;

    if (isNew) {
      const hashed = await bcrypt.hash(password, 10);
      const defaultTabs = [{ id: generateId(), label: "Tab 1", content: "" }];

      const { data, error } = await supabase
        .from("pages")
        .insert([{ slug, password: hashed, tabs: defaultTabs }])
        .select()
        .single();

      if (error) {
        console.error(error);
        return;
      }

      setPage(data);
      setTabs(defaultTabs);
      setActiveTabId(defaultTabs[0].id);
      setUnlocked(true);
    } else {
      if (attempts >= MAX_ATTEMPTS) {
        setLockError("Too many failed attempts. Please refresh the page.");
        return;
      }
      const valid = await bcrypt.compare(password, page.password);
      if (!valid) {
        const remaining = MAX_ATTEMPTS - attempts - 1;
        setAttempts((n) => n + 1);
        setLockError(
          remaining > 0
            ? `Wrong password. ${remaining} attempt${remaining !== 1 ? "s" : ""} remaining.`
            : "Too many failed attempts. Please refresh the page."
        );
        return;
      }
      setUnlocked(true);
    }
  }

  function addTab() {
    const newTab = {
      id: generateId(),
      label: `Tab ${tabs.length + 1}`,
      content: "",
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
  }

  function removeTab(id) {
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) setActiveTabId(remaining[remaining.length - 1].id);
  }

  function startRename(tab, e) {
    e.stopPropagation();
    setRenamingTabId(tab.id);
    setRenameValue(tab.label);
  }

  function commitRename(id) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setTabs((prev) =>
        prev.map((t) => (t.id === id ? { ...t, label: trimmed } : t))
      );
    }
    setRenamingTabId(null);
  }

  function updateContent(value) {
    setTabs((prev) =>
      prev.map((t) => (t.id === activeTabId ? { ...t, content: value } : t)),
    );
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("pages")
      .update({ tabs, updated_at: new Date() })
      .eq("slug", slug);

    if (error) {
      console.error(error);
      alert("Failed to save");
    } else {
      clearTimeout(saveFlashTimer.current);
      setSaved(true);
      saveFlashTimer.current = setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  const handleKey = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "s") {
      e.preventDefault();
      handleSave();
    }
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Loading</span>
      </div>
    );
  }

  const activeTab = tabs.find((t) => t.id === activeTabId);

  return (
    <>
      {!unlocked ? (
        <div className="lock-wrap fade-up">
          <div className="lock-card">
            <div className="lock-icon">{isNew ? "✦" : "▲"}</div>
            <h2 className="lock-title">
              {isNew ? "Create your page" : "This page is locked"}
            </h2>
            <p className="lock-sub">
              {isNew ? (
                <>
                  Set a password for <code>{slug}</code>. You'll need it every
                  time you access this page.
                </>
              ) : (
                <>
                  Enter the password for <code>{slug}</code> to unlock.
                </>
              )}
            </p>
            <div className="input-group">
              <label className="input-label">Password</label>
              <input
                className="sg-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setLockError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                autoFocus
              />
              {lockError && <p className="lock-error">{lockError}</p>}
              <button
                className="sg-btn"
                onClick={handleSubmit}
                disabled={!password}
              >
                {isNew ? "Create Page →" : "Unlock →"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="editor-shell fade-up">
          <div className="tab-bar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                className={`tab-item ${tab.id === activeTabId ? "active" : ""}`}
                onClick={() => setActiveTabId(tab.id)}
                onDoubleClick={(e) => startRename(tab, e)}
              >
                {renamingTabId === tab.id ? (
                  <input
                    className="tab-rename-input"
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => commitRename(tab.id)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") commitRename(tab.id);
                      if (e.key === "Escape") setRenamingTabId(null);
                      e.stopPropagation();
                    }}
                    onClick={(e) => e.stopPropagation()}
                    autoFocus
                  />
                ) : (
                  tab.label
                )}
                <span
                  className="tab-close"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeTab(tab.id);
                  }}
                  title="Close tab"
                >
                  ✕
                </span>
              </button>
            ))}
            <button className="tab-add" onClick={addTab} title="New tab">
              +
            </button>
            <span className="tab-hint">double-click to rename</span>
          </div>

          <div className="editor-area">
            {activeTab && (
              <textarea
                key={activeTabId}
                className="editor-textarea"
                value={activeTab.content}
                onChange={(e) => updateContent(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Start writing…"
                autoFocus
                spellCheck={false}
              />
            )}

            <div className="editor-footer">
              <span className={`save-flash ${saved ? "visible" : ""}`}>
                ✓ Saved
              </span>
              <span className="editor-meta">Ctrl+S to save</span>
              <button
                className="save-btn"
                onClick={handleSave}
                disabled={saving}
              >
                {saving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Page;
