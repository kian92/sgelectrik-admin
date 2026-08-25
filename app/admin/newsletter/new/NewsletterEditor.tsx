"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import { useRef, useState } from "react";
import TextAlign from "@tiptap/extension-text-align";
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  ImageIcon,
  LinkIcon,
  List,
  ListOrdered,
  Redo2,
  Undo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
};

const FONT_SIZES = ["12px", "14px", "16px", "20px", "24px", "32px"];
const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#9333ea" },
];

const ToolbarBtn = ({
  active,
  onClick,
  children,
  title,
}: {
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  title: string;
}) => (
  <button
    type="button"
    title={title}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
    className={`px-3 py-1.5 rounded text-sm ${
      active ? "bg-emerald-600 text-white" : "hover:bg-white"
    }`}
  >
    {children}
  </button>
);

export default function NewsletterEditor({ value, onChange }: Props) {
  const [, setTick] = useState(0);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "text-blue-600 underline",
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        },
      }),
      Underline,
      TextStyleKit,
      Image.configure({
        HTMLAttributes: {
          style:
            "max-width:min(100%,420px);max-height:240px;width:auto;height:auto;object-fit:contain;border-radius:8px;display:block;margin:0.75rem 0;",
        },
      }),
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: value,
    editorProps: {
      attributes: {
        class: "prose max-w-none focus:outline-none",
      },
    },
    onUpdate({ editor }) {
      onChange(editor.getHTML());
    },
    onSelectionUpdate: () => setTick((n) => n + 1),
    onTransaction: () => setTick((n) => n + 1),
    immediatelyRender: false,
  });

  if (!editor) return null;

  const currentHeading = editor.isActive("heading", { level: 1 })
    ? "1"
    : editor.isActive("heading", { level: 2 })
      ? "2"
      : editor.isActive("heading", { level: 3 })
        ? "3"
        : "paragraph";

  const setHeading = (val: string) => {
    if (val === "paragraph") {
      editor.chain().focus().setParagraph().run();
    } else {
      editor
        .chain()
        .focus()
        .setHeading({ level: Number(val) as 1 | 2 | 3 })
        .run();
    }
  };

  const insertLink = () => {
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertImage = () => {
    const url = window.prompt("Enter image URL");
    if (!url) return;
    editor.chain().focus().setImage({ src: url }).run();
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <style>{`
      .newsletter-editor-content .ProseMirror {
        min-height: 350px;
        padding: 20px;
        outline: none;
      }
      .newsletter-content h1 {
        font-size: 1.75rem !important;
        font-weight: 700 !important;
        line-height: 1.25;
        margin: 0.75rem 0;
      }
      .newsletter-content h2 {
        font-size: 1.4rem !important;
        font-weight: 650 !important;
        line-height: 1.3;
        margin: 0.75rem 0;
      }
      .newsletter-content h3 {
        font-size: 1.15rem !important;
        font-weight: 650 !important;
        line-height: 1.35;
        margin: 0.75rem 0;
      }
      .newsletter-content p {
        margin: 0.5rem 0;
      }
      .newsletter-content ul {
        list-style-type: disc !important;
        list-style-position: outside !important;
        padding-left: 1.5rem !important;
        margin: 0.5rem 0 0.85rem !important;
      }
      .newsletter-content ol {
        list-style-type: decimal !important;
        list-style-position: outside !important;
        padding-left: 1.5rem !important;
        margin: 0.5rem 0 0.85rem !important;
      }
      .newsletter-content li {
        display: list-item !important;
        margin: 0.25rem 0;
      }
      .newsletter-content li p {
        margin: 0;
      }
      .newsletter-content blockquote {
        border-left: 3px solid #cbd5e1 !important;
        margin: 0.75rem 0 !important;
        padding-left: 0.9rem !important;
        color: #475569;
      }
      .newsletter-content a {
        color: #2563eb;
        text-decoration: underline;
      }
      .newsletter-content strong {
        font-weight: 700 !important;
      }
      .newsletter-content em {
        font-style: italic !important;
      }
      .newsletter-content s {
        text-decoration: line-through !important;
      }
      .newsletter-content img {
        max-width: min(100%, 420px) !important;
        max-height: 240px !important;
        border-radius: 8px;
        display: block;
        margin: 0.75rem 0;
      }
    `}</style>
      <div className="flex flex-wrap items-center gap-1 border-b bg-slate-50 p-2">
        <ToolbarBtn
          title="Paragraph"
          active={currentHeading === "paragraph"}
          onClick={() => setHeading("paragraph")}
        >
          P
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 1"
          active={currentHeading === "1"}
          onClick={() => setHeading("1")}
        >
          H1
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 2"
          active={currentHeading === "2"}
          onClick={() => setHeading("2")}
        >
          H2
        </ToolbarBtn>
        <ToolbarBtn
          title="Heading 3"
          active={currentHeading === "3"}
          onClick={() => setHeading("3")}
        >
          H3
        </ToolbarBtn>

        <select
          className="h-8 rounded border px-2 text-xs"
          defaultValue=""
          onChange={(e) => {
            if (e.target.value)
              editor.chain().focus().setFontSize(e.target.value).run();
            e.target.value = "";
          }}
          title="Font size"
        >
          <option value="" disabled>
            Size
          </option>
          {FONT_SIZES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <select
          className="h-8 rounded border px-2 text-xs"
          defaultValue=""
          onChange={(e) => {
            const val = e.target.value;
            if (!val) editor.chain().focus().unsetColor().run();
            else editor.chain().focus().setColor(val).run();
            e.target.value = "";
          }}
          title="Text color"
        >
          <option value="" disabled>
            Color
          </option>
          {TEXT_COLORS.map((c) => (
            <option key={c.label} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolbarBtn
          title="Bold"
          active={editor.isActive("bold")}
          onClick={() => editor.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarBtn>
        <ToolbarBtn
          title="Italic"
          active={editor.isActive("italic")}
          onClick={() => editor.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarBtn>
        <ToolbarBtn
          title="Underline"
          active={editor.isActive("underline")}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <span className="underline">U</span>
        </ToolbarBtn>
        <ToolbarBtn
          title="Strikethrough"
          active={editor.isActive("strike")}
          onClick={() => editor.chain().focus().toggleStrike().run()}
        >
          <span className="line-through">S</span>
        </ToolbarBtn>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolbarBtn
          title="Bullet list"
          active={editor.isActive("bulletList")}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
        >
          <List className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Numbered list"
          active={editor.isActive("orderedList")}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align left"
          active={editor.isActive({ textAlign: "left" })}
          onClick={() => editor.chain().focus().setTextAlign("left").run()}
        >
          <AlignLeft className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align center"
          active={editor.isActive({ textAlign: "center" })}
          onClick={() => editor.chain().focus().setTextAlign("center").run()}
        >
          <AlignCenter className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Align right"
          active={editor.isActive({ textAlign: "right" })}
          onClick={() => editor.chain().focus().setTextAlign("right").run()}
        >
          <AlignRight className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Quote"
          active={editor.isActive("blockquote")}
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
        >
          " "
        </ToolbarBtn>
        <ToolbarBtn title="Insert link" onClick={insertLink}>
          <LinkIcon className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn title="Insert image" onClick={insertImage}>
          <ImageIcon className="h-4 w-4" />
        </ToolbarBtn>

        <div className="w-px h-6 bg-slate-200 mx-1" />

        <ToolbarBtn
          title="Undo"
          onClick={() => editor.chain().focus().undo().run()}
        >
          <Undo2 className="h-4 w-4" />
        </ToolbarBtn>
        <ToolbarBtn
          title="Redo"
          onClick={() => editor.chain().focus().redo().run()}
        >
          <Redo2 className="h-4 w-4" />
        </ToolbarBtn>
      </div>

      <EditorContent editor={editor} className="min-h-[350px] p-5" />

      <input
        ref={imageInputRef}
        type="file"
        accept="image/*"
        className="hidden"
      />
    </div>
  );
}
