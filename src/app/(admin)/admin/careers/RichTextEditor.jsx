"use client";

// Compact rich-text editor for job content. Output is sanitized again on the
// server (allow-list: headings, lists, emphasis, links).

import { useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Italic, Underline as UIcon, Heading2, Heading3, List, ListOrdered, Link2, Unlink, Undo2, Redo2, Quote } from "lucide-react";

function Btn({ on, onClick, title, children, disabled }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      aria-pressed={on}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      style={{
        width: 32,
        height: 32,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 8,
        border: "1px solid transparent",
        background: on ? "var(--adm-brand-soft)" : "transparent",
        color: on ? "var(--adm-brand)" : "var(--adm-ink)",
        opacity: disabled ? 0.4 : 1,
        cursor: disabled ? "default" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export default function RichTextEditor({ value, onChange, placeholder = "", minHeight = 160, invalid }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
        codeBlock: false,
        code: false,
        link: { openOnClick: false, autolink: true, HTMLAttributes: { rel: "noopener noreferrer nofollow", target: null } },
      }),
    ],
    content: value || "",
    editorProps: {
      attributes: {
        class: "job-editor-content",
        "data-placeholder": placeholder,
        style: `min-height:${minHeight}px;padding:12px 14px;outline:none;font-size:14.5px;line-height:1.65`,
      },
    },
    onUpdate: ({ editor: ed }) => onChange(ed.isEmpty ? "" : ed.getHTML()),
  });

  // Load new content when the parent swaps the value (e.g. job fetched).
  useEffect(() => {
    if (editor && value !== undefined && value !== (editor.isEmpty ? "" : editor.getHTML())) {
      editor.commands.setContent(value || "", { emitUpdate: false });
    }
  }, [value, editor]);

  const setLink = () => {
    const prev = editor.getAttributes("link").href || "https://";
    const url = window.prompt("Link URL (https://…)", prev);
    if (url === null) return;
    if (!url.trim()) return editor.chain().focus().unsetLink().run();
    if (!/^(https?:\/\/|mailto:|tel:)/i.test(url.trim())) return window.alert("Use a full https:// link, mailto: or tel:.");
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div
      style={{
        border: `1px solid ${invalid ? "#e2314b" : "var(--adm-border-strong)"}`,
        borderRadius: 12,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <div style={{ display: "flex", flexWrap: "wrap", gap: 2, padding: 6, borderBottom: "1px solid var(--adm-border)", background: "#faf9fd" }}>
        {editor && (
          <>
            <Btn title="Bold" on={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}><Bold size={15} /></Btn>
            <Btn title="Italic" on={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}><Italic size={15} /></Btn>
            <Btn title="Underline" on={editor.isActive("underline")} onClick={() => editor.chain().focus().toggleUnderline().run()}><UIcon size={15} /></Btn>
            <Btn title="Heading" on={editor.isActive("heading", { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 size={15} /></Btn>
            <Btn title="Sub-heading" on={editor.isActive("heading", { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}><Heading3 size={15} /></Btn>
            <Btn title="Bullet list" on={editor.isActive("bulletList")} onClick={() => editor.chain().focus().toggleBulletList().run()}><List size={15} /></Btn>
            <Btn title="Numbered list" on={editor.isActive("orderedList")} onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered size={15} /></Btn>
            <Btn title="Quote" on={editor.isActive("blockquote")} onClick={() => editor.chain().focus().toggleBlockquote().run()}><Quote size={15} /></Btn>
            <Btn title="Add link" on={editor.isActive("link")} onClick={setLink}><Link2 size={15} /></Btn>
            <Btn title="Remove link" disabled={!editor.isActive("link")} onClick={() => editor.chain().focus().unsetLink().run()}><Unlink size={15} /></Btn>
            <span style={{ flex: 1 }} />
            <Btn title="Undo" disabled={!editor.can().undo()} onClick={() => editor.chain().focus().undo().run()}><Undo2 size={15} /></Btn>
            <Btn title="Redo" disabled={!editor.can().redo()} onClick={() => editor.chain().focus().redo().run()}><Redo2 size={15} /></Btn>
          </>
        )}
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .job-editor-content ul{list-style:disc;padding-left:1.3rem}
        .job-editor-content ol{list-style:decimal;padding-left:1.3rem}
        .job-editor-content h2{font-size:1.15rem;font-weight:700;margin:.6rem 0 .3rem}
        .job-editor-content h3{font-size:1.02rem;font-weight:700;margin:.5rem 0 .25rem}
        .job-editor-content p{margin:.3rem 0}
        .job-editor-content a{color:#6323cc;text-decoration:underline}
        .job-editor-content blockquote{border-left:3px solid #ddd;padding-left:.8rem;color:#666}
        .job-editor-content p.is-editor-empty:first-child::before{content:attr(data-placeholder);color:#aaa;float:left;height:0;pointer-events:none}
      `}</style>
    </div>
  );
}
