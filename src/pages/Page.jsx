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

// Tiptap Imports
import { useEditor, EditorContent } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { TextStyle } from "@tiptap/extension-text-style";
import { FontSize } from "tiptap-extension-font-size";
import { Link } from "@tiptap/extension-link";
import { Underline } from "@tiptap/extension-underline";

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
    { tag: t.comment, color: "#555", fontStyle: "italic" },
    { tag: t.lineComment, color: "#555", fontStyle: "italic" },
    { tag: t.blockComment, color: "#555", fontStyle: "italic" },
    { tag: t.docComment, color: "#555", fontStyle: "italic" },
    { tag: t.keyword, color: "#c8f562", fontWeight: "500" },
    { tag: t.controlKeyword, color: "#c8f562" },
    { tag: t.moduleKeyword, color: "#c8f562" },
    { tag: t.definitionKeyword, color: "#c8f562" },
    { tag: t.operatorKeyword, color: "#c8f562" },
    { tag: [t.string, t.special(t.brace)], color: "#f5b662" },
    { tag: t.character, color: "#f5b662" },
    { tag: t.number, color: "#79c0ff" },
    { tag: t.integer, color: "#79c0ff" },
    { tag: t.float, color: "#79c0ff" },
    { tag: t.bool, color: "#c8f562" },
    { tag: t.null, color: "#c8f562" },
    { tag: t.atom, color: "#c8f562" },
    { tag: t.self, color: "#ff7b72" },
    { tag: t.operator, color: "#e8e8e8" },
    { tag: t.variableName, color: "#e8e8e8" },
    { tag: t.definition(t.variableName), color: "#d2a8ff" },
    { tag: t.function(t.variableName), color: "#d2a8ff" },
    { tag: t.function(t.propertyName), color: "#d2a8ff" },
    { tag: [t.typeName, t.namespace], color: "#ffa657" },
    { tag: t.className, color: "#ffa657" },
    { tag: t.annotation, color: "#ffa657" },
    { tag: t.propertyName, color: "#79c0ff" },
    { tag: t.punctuation, color: "#888" },
    { tag: t.separator, color: "#888" },
    { tag: t.bracket, color: "#888" },
    { tag: t.tagName, color: "#7ee787" },
    { tag: t.attributeName, color: "#79c0ff" },
    { tag: t.attributeValue, color: "#f5b662" },
    { tag: t.angleBracket, color: "#888" },
    { tag: t.processingInstruction, color: "#888" },
    { tag: t.heading, color: "#c8f562", fontWeight: "600" },
    { tag: t.strong, fontWeight: "bold" },
    { tag: t.emphasis, fontStyle: "italic" },
    { tag: t.link, color: "#79c0ff", textDecoration: "underline" },
    { tag: t.url, color: "#79c0ff" },
    { tag: t.regexp, color: "#ff7b72" },
    { tag: t.escape, color: "#ff7b72" },
    { tag: t.invalid, color: "#ff5f5f", textDecoration: "underline" },
    { tag: t.meta, color: "#555" },
    { tag: t.color, color: "#79c0ff" },
  ],
  // ── Theme Overrides to fix alignment ──
  "@": {
    "&": {
      height: "100%",
    },
    ".cm-content": {
      paddingTop: "24px !important",
      paddingBottom: "24px !important",
    },
    ".cm-gutters": {
      paddingTop: "24px !important",
      paddingBottom: "24px !important",
      backgroundColor: "#141414",
      borderRight: "1px solid #2a2a2a",
      color: "#3a3a3a",
    },
    ".cm-gutterElement": {
      padding: "0 16px 0 16px !important",
      lineHeight: "1.6 !important",
      height: "1.6em !important",
      marginTop: "0 !important",
      display: "block !important",
    },
    ".cm-line": {
      padding: "0 24px !important",
      lineHeight: "1.6 !important",
      height: "1.6em !important",
    },
    ".cm-placeholder": {
      paddingLeft: "24px !important",
      lineHeight: "1.6 !important",
    }
  }
});

// ── Language registry ────────────────────────────────────────────────────────
const LANGUAGES = [
  { id: "plaintext", label: "Plain Text", ext: null },
  { id: "javascript", label: "JavaScript", ext: () => javascript({ jsx: true }) },
  { id: "typescript", label: "TypeScript", ext: () => javascript({ jsx: true, typescript: true }) },
  { id: "jsx", label: "JSX", ext: () => javascript({ jsx: true }) },
  { id: "tsx", label: "TSX", ext: () => javascript({ jsx: true, typescript: true }) },
  { id: "python", label: "Python", ext: () => python() },
  { id: "html", label: "HTML", ext: () => html() },
  { id: "css", label: "CSS", ext: () => css() },
  { id: "json", label: "JSON", ext: () => json() },
  { id: "markdown", label: "Markdown", ext: () => markdown() },
  { id: "sql", label: "SQL", ext: () => sql() },
  { id: "rust", label: "Rust", ext: () => rust() },
  { id: "java", label: "Java", ext: () => java() },
  { id: "cpp", label: "C / C++", ext: () => cpp() },
  { id: "php", label: "PHP", ext: () => php() },
];

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

// ── Encryption helpers (AES-GCM, key derived via PBKDF2) ────────────────────
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(salt), iterations: 200_000, hash: "SHA-256" },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

async function encryptTabs(tabs, password, slug) {
  const key = await deriveKey(password, slug);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(JSON.stringify(tabs));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  return [
    {
      enc: true,
      iv: btoa(String.fromCharCode(...iv)),
      ct: btoa(String.fromCharCode(...new Uint8Array(ct))),
    },
  ];
}

async function decryptTabs(storedTabs, password, slug) {
  if (!storedTabs || storedTabs.length === 0) return [];
  // Legacy rows that haven't been encrypted yet — return as-is
  if (!storedTabs[0]?.enc) return storedTabs;
  const key = await deriveKey(password, slug);
  const iv = Uint8Array.from(atob(storedTabs[0].iv), (c) => c.charCodeAt(0));
  const ct = Uint8Array.from(atob(storedTabs[0].ct), (c) => c.charCodeAt(0));
  const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
  return JSON.parse(new TextDecoder().decode(plain));
}

// ── Tiptap Editor & Toolbar ──────────────────────────────────────────────────
function DocToolbar({ editor }) {
  const [inputSize, setInputSize] = useState("20");
  const [rev, setRev] = useState(0);

  useEffect(() => {
    if (!editor) return;
    const update = () => {
      setRev((r) => r + 1); // Force robust React re-renders on styling clicks
      const markSize = editor.getAttributes("textStyle").fontSize?.replace("px", "");
      setInputSize(markSize || "20");
    };
    editor.on("selectionUpdate", update);
    editor.on("transaction", update);
    return () => {
      editor.off("selectionUpdate", update);
      editor.off("transaction", update);
    };
  }, [editor]);

  if (!editor) return null;

  const handleSizeChange = (newSize) => {
    const valid = Math.max(20, newSize);
    setInputSize(valid.toString());
    editor.chain().focus().setFontSize(`${valid}px`).run();
  };

  return (
    <div className="doc-toolbar">
      <div className="toolbar-group">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSizeChange(Number(inputSize) - 5)}
          className="toolbar-btn"
          title="Decrease font size"
        >
          −
        </button>
        <input
          type="text"
          readOnly
          className="lang-select"
          style={{ width: "40px", padding: "0", backgroundImage: "none", border: "none", height: "100%", borderRadius: "0", textAlign: "center", borderRight: "1px solid var(--border)", cursor: "default", userSelect: "none" }}
          value={inputSize}
          title="Font size"
        />
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleSizeChange(Number(inputSize) + 5)}
          className="toolbar-btn"
          title="Increase font size"
        >
          +
        </button>
      </div>

      <div className="toolbar-group">
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`toolbar-btn ${editor.isActive("bold") ? "active" : ""}`}
          title="Bold"
          style={{ fontWeight: "bold" }}
        >
          B
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`toolbar-btn ${editor.isActive("italic") ? "active" : ""}`}
          title="Italic"
          style={{ fontStyle: "italic" }}
        >
          I
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`toolbar-btn ${editor.isActive("underline") ? "active" : ""}`}
          title="Underline"
          style={{ textDecoration: "underline" }}
        >
          U
        </button>
        <button
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={`toolbar-btn ${editor.isActive("strike") ? "active" : ""}`}
          title="Strikethrough"
          style={{ textDecoration: "line-through" }}
        >
          S
        </button>
      </div>
    </div>
  );
}

function DocEditorArea({ content, onChange, fontSize }) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      FontSize,
      Link.configure({ openOnClick: false }),
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      // Intercept complete deletion events to purge sticking formatting queues
      if (editor.state.doc.textContent.length === 0) {
        if (editor.state.storedMarks || Object.keys(editor.getAttributes("textStyle")).length > 0) {
          editor.commands.unsetAllMarks();
        }
      }
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "tiptap-content",
      },
    },
  }, [fontSize]);

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, false);
    }
  }, [content, editor]);

  if (!editor) return null;

  return (
    <div className="doc-editor-container" style={{ "--editor-font-size": fontSize }}>
      <DocToolbar editor={editor} />
      <div className="tiptap-editor-wrap" onClick={() => editor.chain().focus().run()}>
        <EditorContent editor={editor} className="tiptap-content-wrapper" />
      </div>
    </div>
  );
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
  const [isDirty, setIsDirty] = useState(false);
  const [fontSize, setFontSize] = useState(14);
  const [showTypePicker, setShowTypePicker] = useState(false); // New Tab Picker state
  const saveFlashTimer = useRef(null);
  const passwordRef = useRef(""); // Kept in memory only — never stored

  useEffect(() => { checkPage(); }, []);

  // ── Confirmation on refresh ──
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

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
      setPage(data); // raw encrypted tabs stay in page.tabs; decryption happens on unlock
    }
    setLoading(false);
  }

  async function handleSubmit() {
    if (!password) return;
    if (isNew) {
      const hashed = await bcrypt.hash(password, 10);
      const defaultTabs = [];
      const { data, error } = await supabase
        .from("pages")
        .insert([{ slug, password: hashed, tabs: defaultTabs }])
        .select()
        .single();
      if (error) { console.error(error); return; }
      passwordRef.current = password;
      setPage(data);
      setTabs(defaultTabs);
      setUnlocked(true);
      setIsDirty(false);
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
      // Decrypt tabs with the verified password
      try {
        const decrypted = await decryptTabs(page.tabs, password, slug);
        const loadedTabs = decrypted.map((tab) => ({
          language: "plaintext",
          type: "code",
          ...tab,
        }));
        passwordRef.current = password;
        setTabs(loadedTabs);
        if (loadedTabs.length > 0) setActiveTabId(loadedTabs[0].id);
      } catch (err) {
        console.error("Decryption failed:", err);
        setLockError("Failed to decrypt page content. The password may be incorrect.");
        return;
      }
      setUnlocked(true);
    }
  }

  function addTab(type = "code") {
    let maxNum = 0;
    tabs.forEach(t => {
      const match = t.label.match(/^Tab (\d+)$/);
      if (match) maxNum = Math.max(maxNum, parseInt(match[1], 10));
    });
    const label = `Tab ${maxNum + 1}`;
    const newTab = {
      id: generateId(),
      label,
      content: "",
      language: "plaintext",
      type
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newTab.id);
    setIsDirty(true);
    setShowTypePicker(false);
  }

  function removeTab(id) {
    if (!window.confirm("Are you sure you want to close this tab?")) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id && remaining.length > 0) {
      setActiveTabId(remaining[remaining.length - 1].id);
    } else if (remaining.length === 0) {
      setActiveTabId(null);
    }
    setIsDirty(true);
  }

  function startRename(tab, e) {
    e.stopPropagation();
    setRenamingTabId(tab.id);
    setRenameValue(tab.label);
  }

  function commitRename(id) {
    const trimmed = renameValue.trim();
    if (trimmed) {
      setTabs((prev) => prev.map((t) => (t.id === id ? { ...t, label: trimmed } : t)));
      setIsDirty(true);
    }
    setRenamingTabId(null);
  }

  function updateContent(value) {
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId ? { ...t, content: value } : t
      )
    );
    setIsDirty(true);
  }

  function updateLanguage(langId) {
    setTabs((prev) => prev.map((t) => (t.id === activeTabId ? { ...t, language: langId } : t)));
    setIsDirty(true);
  }

  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      const encryptedTabs = await encryptTabs(tabs, passwordRef.current, slug);
      const { error } = await supabase
        .from("pages")
        .update({ tabs: encryptedTabs, updated_at: new Date() })
        .eq("slug", slug);
      if (error) {
        console.error(error);
        alert("Failed to save");
      } else {
        clearTimeout(saveFlashTimer.current);
        setSaved(true);
        setIsDirty(false);
        saveFlashTimer.current = setTimeout(() => setSaved(false), 2000);
      }
    } catch (err) {
      console.error("Encryption failed:", err);
      alert("Failed to encrypt content before saving.");
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
              {isNew ? (
                <button className="sg-btn" onClick={() => handleSubmit()} disabled={!password}>
                  Create Page →
                </button>
              ) : (
                <button className="sg-btn" onClick={() => handleSubmit()} disabled={!password}>
                  Unlock →
                </button>
              )}
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
            <div className="tab-add-wrap">
              <button
                className={`tab-add ${showTypePicker ? "active" : ""}`}
                onClick={() => setShowTypePicker(!showTypePicker)}
                title="New tab"
              >
                +
              </button>

            </div>
            <span className="tab-hint">double-click to rename</span>
          </div>

          {/* ── Type Picker Modal ── */}
          {showTypePicker && (
            <>
              <div className="type-picker-overlay" onClick={() => setShowTypePicker(false)} />
              <div className="type-picker-popup fade-in-center">
                <button className="type-picker-btn" onClick={() => addTab("doc")}>
                  <div className="type-icon">📄</div>
                  <div className="type-info">
                    <span className="type-title">Rich Document</span>
                    <span className="type-desc">Format text with sizes & styles</span>
                  </div>
                </button>
                <button className="type-picker-btn" onClick={() => addTab("code")}>
                  <div className="type-icon code-icon">⌨️</div>
                  <div className="type-info">
                    <span className="type-title">Code Snippet</span>
                    <span className="type-desc">Plaintext editor & syntax highlighting</span>
                  </div>
                </button>
              </div>
            </>
          )}



          {/* ── Editor Area ── */}
          <div className="editor-area">
            {activeTab ? (
              <div
                className="cm-wrapper"
                style={{ "--editor-font-size": `${fontSize}px` }}
              >
                {activeTab.type === "doc" ? (
                  <DocEditorArea
                    key={`doc-${activeTab.id}`}
                    content={activeTab.content}
                    onChange={updateContent}
                    fontSize={fontSize}
                  />
                ) : (
                  <CodeMirror
                    key={`code-${activeTab.id}`}
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
                )}
              </div>
            ) : (
              <div className="empty-state-wrap">
                <div className="empty-state-content fade-up">
                  <div className="empty-state-icon">✨</div>
                  <h2 className="empty-state-title">Choose your starting editor</h2>
                  <p className="empty-state-sub">Start building your page from scratch.</p>
                  <div className="empty-state-actions">
                    <button className="type-picker-btn" onClick={() => addTab("doc")} style={{ background: "var(--surface2)", border: "1px solid var(--border)", width: "100%" }}>
                      <div className="type-icon">📄</div>
                      <div className="type-info">
                        <span className="type-title">Rich Document</span>
                        <span className="type-desc">Format text with sizes & styles</span>
                      </div>
                    </button>
                    <button className="type-picker-btn" onClick={() => addTab("code")} style={{ background: "var(--surface2)", border: "1px solid var(--border)", width: "100%" }}>
                      <div className="type-icon code-icon">⌨️</div>
                      <div className="type-info">
                        <span className="type-title">Code Snippet</span>
                        <span className="type-desc">Plaintext editor & syntax highlighting</span>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ── Footer ── */}
            <div className="editor-footer">
              <span className={`save-flash ${saved ? "visible" : ""}`}>✓ Saved</span>
              <div className="footer-right">
                {activeTab?.type !== "doc" && (
                  <select
                    className="lang-select"
                    value={activeTab?.language || "plaintext"}
                    onChange={(e) => updateLanguage(e.target.value)}
                  >
                    {LANGUAGES.map((l) => (
                      <option key={l.id} value={l.id}>{l.label}</option>
                    ))}
                  </select>
                )}
                <div className="footer-slider-wrap" style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--surface2)", padding: "0 10px", borderRadius: "4px", border: "1px solid var(--border)", height: "30px" }}>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Change Content Size</span>
                  <input
                    type="range"
                    min="10"
                    max="48"
                    value={fontSize}
                    onChange={(e) => setFontSize(Number(e.target.value))}
                    style={{ width: "80px", cursor: "pointer", accentColor: "var(--accent)" }}
                    title="Editor Base Font Size"
                  />
                  <span style={{ fontSize: "11px", color: "var(--text-dim)", fontFamily: "var(--font-mono)", width: "30px", textAlign: "right" }}>{fontSize}px</span>
                </div>
                <span className="editor-meta">Ctrl+S to save</span>
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
