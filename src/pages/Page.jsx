import { useParams } from "react-router-dom";
import { useEffect, useState, useRef, useCallback, useMemo } from "react";
import { supabase } from "../lib/supabaseClient";
import bcrypt from "bcryptjs";
import CodeMirror from "@uiw/react-codemirror";
import { createTheme } from "@uiw/codemirror-themes";
import { tags as t } from "@lezer/highlight";
import { javascript } from "@codemirror/lang-javascript";
import { python } from "@codemirror/lang-python";
import { html } from "@codemirror/lang-html";
import { css } from "@codemirror/lang-css";
import { json } from "@codemirror/lang-json";
import { markdown } from "@codemirror/lang-markdown";
import { sql } from "@codemirror/lang-sql";
import { rust } from "@codemirror/lang-rust";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { php } from "@codemirror/lang-php";

// ── StringGuard CodeMirror Theme ────────────────────────────────────────────
const sgTheme = createTheme({
  theme: "dark",
  settings: {
    background: "#141414",
    backgroundImage: "",
    foreground: "#e8e8e8",
    caret: "#c8f562",
    selection: "rgba(200, 245, 98, 0.15)",
    selectionMatch: "rgba(200, 245, 98, 0.08)",
    lineHighlight: "rgba(255,255,255,0.025)",
    gutterBackground: "#141414",
    gutterForeground: "#3a3a3a",
    gutterBorder: "transparent",
    gutterActiveForeground: "#777",
    fontFamily: '"IBM Plex Mono", monospace',
  },
  styles: [
    { tag: t.comment,           color: "#555", fontStyle: "italic" },
    { tag: t.lineComment,       color: "#555", fontStyle: "italic" },
    { tag: t.blockComment,      color: "#555", fontStyle: "italic" },
    { tag: t.docComment,        color: "#555", fontStyle: "italic" },
    { tag: t.keyword,           color: "#c8f562", fontWeight: "500" },
    { tag: t.controlKeyword,    color: "#c8f562" },
    { tag: t.moduleKeyword,     color: "#c8f562" },
    { tag: t.definitionKeyword, color: "#c8f562" },
    { tag: t.operatorKeyword,   color: "#c8f562" },
    { tag: [t.string, t.special(t.brace)], color: "#f5b662" },
    { tag: t.character,         color: "#f5b662" },
    { tag: t.number,            color: "#79c0ff" },
    { tag: t.integer,           color: "#79c0ff" },
    { tag: t.float,             color: "#79c0ff" },
    { tag: t.bool,              color: "#c8f562" },
    { tag: t.null,              color: "#c8f562" },
    { tag: t.atom,              color: "#c8f562" },
    { tag: t.self,              color: "#ff7b72" },
    { tag: t.operator,          color: "#e8e8e8" },
    { tag: t.variableName,      color: "#e8e8e8" },
    { tag: t.definition(t.variableName), color: "#d2a8ff" },
    { tag: t.function(t.variableName),   color: "#d2a8ff" },
    { tag: t.function(t.propertyName),   color: "#d2a8ff" },
    { tag: [t.typeName, t.namespace],    color: "#ffa657" },
    { tag: t.className,         color: "#ffa657" },
    { tag: t.annotation,        color: "#ffa657" },
    { tag: t.propertyName,      color: "#79c0ff" },
    { tag: t.punctuation,       color: "#888" },
    { tag: t.separator,         color: "#888" },
    { tag: t.bracket,           color: "#888" },
    { tag: t.tagName,           color: "#7ee787" },
    { tag: t.attributeName,     color: "#79c0ff" },
    { tag: t.attributeValue,    color: "#f5b662" },
    { tag: t.angleBracket,      color: "#888" },
    { tag: t.processingInstruction, color: "#888" },
    { tag: t.heading,           color: "#c8f562", fontWeight: "600" },
    { tag: t.strong,            fontWeight: "bold" },
    { tag: t.emphasis,          fontStyle: "italic" },
    { tag: t.link,              color: "#79c0ff", textDecoration: "underline" },
    { tag: t.url,               color: "#79c0ff" },
    { tag: t.regexp,            color: "#ff7b72" },
    { tag: t.escape,            color: "#ff7b72" },
    { tag: t.invalid,           color: "#ff5f5f", textDecoration: "underline" },
    { tag: t.meta,              color: "#555" },
    { tag: t.color,             color: "#79c0ff" },
  ],
});

// ── Language registry ────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: "plaintext",  label: "Plain Text",  ext: null },
  { id: "javascript", label: "JavaScript",  ext: () => javascript({ jsx: true }) },
  { id: "typescript", label: "TypeScript",  ext: () => javascript({ jsx: true, typescript: true }) },
  { id: "jsx",        label: "JSX",         ext: () => javascript({ jsx: true }) },
  { id: "tsx",        label: "TSX",         ext: () => javascript({ jsx: true, typescript: true }) },
  { id: "python",     label: "Python",      ext: () => python() },
  { id: "html",       label: "HTML",        ext: () => html() },
  { id: "css",        label: "CSS",         ext: () => css() },
  { id: "json",       label: "JSON",        ext: () => json() },
  { id: "markdown",   label: "Markdown",    ext: () => markdown() },
  { id: "sql",        label: "SQL",         ext: () => sql() },
  { id: "rust",       label: "Rust",        ext: () => rust() },
  { id: "java",       label: "Java",        ext: () => java() },
  { id: "cpp",        label: "C / C++",     ext: () => cpp() },
  { id: "php",        label: "PHP",         ext: () => php() },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function Page() {
  const { slug } = useParams();

  const [page, setPage]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [password, setPassword] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [isNew, setIsNew]     = useState(false);
  const [saving, setSaving]   = useState(false);
  const [saved, setSaved]     = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockError, setLockError] = useState("");
  const MAX_ATTEMPTS = 5;

  const [tabs, setTabs]             = useState([]);
  const [activeTabId, setActiveTabId] = useState(null);
  const [renamingTabId, setRenamingTabId] = useState(null);
  const [renameValue, setRenameValue]     = useState("");
  const saveFlashTimer = useRef(null);

  useEffect(() => { checkPage(); }, []);

  async function checkPage() {
    const { data, error } = await supabase
      .from("pages")
      .select("id, slug, password, tabs, updated_at")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      console.error("Supabase error:", error);
      setIsNew(true);
    } else if (!data) {
      setIsNew(true);
    } else {
      setPage(data);
      const loadedTabs =
        data.tabs && data.tabs.length > 0
          ? data.tabs.map((tab) => ({ language: "plaintext", ...tab }))
          : [{ id: generateId(), label: "Tab 1", content: "", language: "plaintext" }];
      setTabs(loadedTabs);
      setActiveTabId(loadedTabs[0].id);
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!password) return;
    if (isNew) {
      const hashed = await bcrypt.hash(password, 10);
      const defaultTabs = [{ id: generateId(), label: "Tab 1", content: "", language: "plaintext" }];
      const { data, error } = await supabase
        .from("pages")
        .insert([{ slug, password: hashed, tabs: defaultTabs }])
        .select()
        .single();
      if (error) { console.error(error); return; }
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
    const newTab = { id: generateId(), label: `Tab ${tabs.length + 1}`, content: "", language: "plaintext" };
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
    if (trimmed) setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label: trimmed } : t)));
    setRenamingTabId(null);
  }

  function updateContent(value) {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, content: value } : t)));
  }

  function updateLanguage(langId) {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, language: langId } : t)));
  }

  const handleSave = useCallback(async () => {
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
  }, [tabs, slug]);

  // Global Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSave]);

  // Memoised CodeMirror extensions for active tab's language
  const activeTab = tabs.find((t) => t.id === activeTabId);
  const cmExtensions = useMemo(() => {
    const lang = LANGUAGES.find((l) => l.id === (activeTab?.language || "plaintext"));
    return lang?.ext ? [lang.ext()] : [];
  }, [activeTab?.language]);

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="spinner" />
        <span>Loading</span>
      </div>
    );
  }

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
                <>Set a password for <code>{slug}</code>. You'll need it every time you access this page.</>
              ) : (
                <>Enter the password for <code>{slug}</code> to unlock.</>
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
              <button className="sg-btn" onClick={handleSubmit} disabled={!password}>
                {isNew ? "Create Page →" : "Unlock →"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="editor-shell fade-up">
          {/* ── Tab bar ── */}
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
                  onClick={(e) => { e.stopPropagation(); removeTab(tab.id); }}
                  title="Close tab"
                >✕</span>
              </button>
            ))}
            <button className="tab-add" onClick={addTab} title="New tab">+</button>
            <span className="tab-hint">double-click to rename</span>
          </div>

          {/* ── Editor ── */}
          <div className="editor-area">
            {activeTab && (
              <div className="cm-wrapper">
                <CodeMirror
                  value={activeTab.content}
                  height="100%"
                  theme={sgTheme}
                  extensions={cmExtensions}
                  onChange={updateContent}
                  placeholder="Start writing…"
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    dropCursor: true,
                    allowMultipleSelections: true,
                    indentOnInput: true,
                    bracketMatching: true,
                    closeBrackets: true,
                    autocompletion: true,
                    highlightActiveLine: true,
                    highlightSelectionMatches: true,
                    tabSize: 2,
                  }}
                />
              </div>
            )}

            {/* ── Footer ── */}
            <div className="editor-footer">
              <span className={`save-flash ${saved ? "visible" : ""}`}>✓ Saved</span>
              <div className="footer-right">
                <span className="editor-meta">Ctrl+S to save</span>
                <select
                  className="lang-select"
                  value={activeTab?.language || "plaintext"}
                  onChange={(e) => updateLanguage(e.target.value)}
                  title="Syntax highlighting language"
                >
                  {LANGUAGES.map((lang) => (
                    <option key={lang.id} value={lang.id}>{lang.label}</option>
                  ))}
                </select>
                <button className="save-btn" onClick={handleSave} disabled={saving}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Page;
