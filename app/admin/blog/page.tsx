"use client";
import { useEffect, useState, type FormEvent, Suspense } from "react";
import { format } from "date-fns";
import { useRouter, useSearchParams } from "next/navigation";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { TextStyleKit } from "@tiptap/extension-text-style";
import TiptapImage from "@tiptap/extension-image";
import {
  BookOpen,
  Plus,
  Edit2,
  Trash2,
  X,
  Eye,
  EyeOff,
  Clock,
  ImageIcon,
  Link2,
  Bold as BoldIcon,
  Italic as ItalicIcon,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Undo2,
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ImageUpload } from "@/components/FileUpload";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pagination } from "@/components/Pagination";
import SearchBar from "@/components/SearchBar";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  // Legacy posts store an array of JSON blocks (or a JSON-stringified array).
  // New posts store an HTML string from the WYSIWYG editor.
  content: unknown;
  category: string;
  author: string;
  author_role: string;
  tags: string;
  cover_image?: string | null;
  cover_gradient: string;
  read_minutes: number;
  status: "draft" | "published";
  published_at?: string;
  created_at: string;
  updated_at: string;
}

const GRADIENTS = [
  "from-emerald-600 to-teal-700",
  "from-blue-600 to-indigo-700",
  "from-violet-600 to-purple-700",
  "from-amber-500 to-orange-600",
  "from-rose-600 to-pink-700",
  "from-slate-700 to-slate-900",
];

const CATEGORIES = [
  "Guide",
  "Buying Guide",
  "Comparison",
  "Review",
  "Finance",
  "Charging",
  "News",
];

const FONT_SIZES = ["12px", "14px", "16px", "20px", "24px", "32px"];
const TEXT_COLORS = [
  { label: "Default", value: "" },
  { label: "Red", value: "#dc2626" },
  { label: "Orange", value: "#ea580c" },
  { label: "Green", value: "#16a34a" },
  { label: "Blue", value: "#2563eb" },
  { label: "Purple", value: "#9333ea" },
];

const PAGE_SIZE = 8;

const EMPTY_FORM: {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  author_role: string;
  tags: string;
  cover_image: string;
  cover_gradient: string;
  read_minutes: number;
  status: "draft" | "published";
} = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  category: "Guide",
  author: "SGElectrik Team",
  author_role: "Editor",
  tags: "",
  cover_image: "",
  cover_gradient: GRADIENTS[0],
  read_minutes: 5,
  status: "draft",
};

function slugify(t: string) {
  return t
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function legacyBlocksToHtml(blocks: any[]): string {
  if (!Array.isArray(blocks) || blocks.length === 0) return "";
  return blocks
    .map((b) => {
      const text = b?.text ?? "";
      switch (b?.type) {
        case "heading":
          return `<h2>${text}</h2>`;
        case "subheading": // in case any legacy posts used this
          return `<h3>${text}</h3>`;
        case "tip":
          return `<blockquote>${text}</blockquote>`;
        case "list":
        case "bulletList": {
          const items: string[] = Array.isArray(b.items) ? b.items : [];
          return `<ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul>`;
        }
        case "table": {
          const rows: any[] = Array.isArray(b.rows) ? b.rows : [];
          const trs = rows
            .map((r) => {
              if (r && typeof r === "object" && !Array.isArray(r)) {
                return `<tr><td>${r.label ?? ""}</td><td>${r.value ?? ""}</td></tr>`;
              }
              if (Array.isArray(r)) {
                return `<tr>${r.map((c) => `<td>${c}</td>`).join("")}</tr>`;
              }
              return "";
            })
            .join("");
          return `<table><tbody>${trs}</tbody></table>`;
        }
        case "paragraph":
        default:
          return `<p>${text}</p>`;
      }
    })
    .join("\n");
}

// Normalizes whatever is stored in post.content into an HTML string the
// Tiptap editor can load. Handles: HTML string, JSON-stringified block array
// (legacy, possibly double-stringified), and a raw block array.
function contentToHtml(content: unknown): string {
  if (typeof content === "string") {
    const trimmed = content.trim();
    if (trimmed.startsWith("<")) {
      // Already HTML
      return content;
    }
    try {
      let parsed = JSON.parse(trimmed);
      if (typeof parsed === "string") parsed = JSON.parse(parsed);
      if (Array.isArray(parsed)) return legacyBlocksToHtml(parsed);
    } catch {
      // Not JSON either — treat as plain text
      return trimmed ? `<p>${trimmed}</p>` : "";
    }
    return "";
  }
  if (Array.isArray(content)) {
    return legacyBlocksToHtml(content);
  }
  return "";
}

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
    className={`h-7 min-w-7 px-2 flex items-center justify-center rounded-md text-xs font-medium border transition-colors ${
      active
        ? "bg-slate-900 text-white border-slate-900"
        : "bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900"
    }`}
  >
    {children}
  </button>
);

function BlogAdminInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<
    "all" | "published" | "draft"
  >("all");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(
    Math.max(1, Number(searchParams.get("page") || 1)),
  );
  const [imageMode, setImageMode] = useState<"gradient" | "url">("gradient");
  const [previewImg, setPreviewImg] = useState("");
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [showEditorImagePicker, setShowEditorImagePicker] = useState(false);
  const [wasLegacyContent, setWasLegacyContent] = useState(false);
  const [, setEditorTick] = useState(0);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        link: {
          openOnClick: false,
          HTMLAttributes: {
            class: "blog-editor-link",
            rel: "noopener noreferrer nofollow",
            target: "_blank",
          },
        },
      }),
      TextStyleKit,
      TiptapImage.configure({
        allowBase64: false,
        HTMLAttributes: {
          style:
            "max-width:min(100%,420px);max-height:240px;width:auto;height:auto;object-fit:contain;border-radius:8px;display:block;margin:0.75rem 0;",
        },
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "blog-editor-prosemirror",
      },
    },
    onUpdate: ({ editor }) => {
      setForm((f) => ({ ...f, content: editor.getHTML() }));
    },
    onSelectionUpdate: () => setEditorTick((n) => n + 1),
    onTransaction: () => setEditorTick((n) => n + 1),
  });

  const load = async () => {
    const res = await fetch("/api/blog-posts");
    setPosts(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const goToPage = (p: number) => {
    setPage(p);
    router.push(`?page=${p}`, { scroll: false });
  };

  const changeFilter = (f: "all" | "published" | "draft") => {
    setFilterStatus(f);
    goToPage(1);
  };

  const handleSearchChange = (q: string) => {
    setSearch(q);
    goToPage(1);
  };

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageMode("gradient");
    setPreviewImg("");
    setWasLegacyContent(false);
    editor?.commands.setContent("");
    setShowForm(true);
    setTimeout(
      () =>
        document
          .getElementById("blog-form-top")
          ?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  function openEdit(post: BlogPost) {
    setEditing(post);

    const isLegacy =
      Array.isArray(post.content) ||
      (typeof post.content === "string" &&
        !post.content.trim().startsWith("<") &&
        post.content.trim() !== "");
    setWasLegacyContent(isLegacy);

    const html = contentToHtml(post.content);

    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: html,
      category: post.category,
      author: post.author,
      author_role: post.author_role,
      tags: (() => {
        try {
          return JSON.parse(post.tags).join(", ");
        } catch {
          return post.tags;
        }
      })(),
      cover_image: post.cover_image ?? "",
      cover_gradient: post.cover_gradient,
      read_minutes: post.read_minutes,
      status: post.status as "draft" | "published",
    });
    editor?.commands.setContent(html);
    setImageMode(post.cover_image ? "url" : "gradient");
    setPreviewImg(post.cover_image ?? "");
    setShowForm(true);
    setTimeout(
      () =>
        document
          .getElementById("blog-form-top")
          ?.scrollIntoView({ behavior: "smooth" }),
      50,
    );
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = {
      ...form,
      content: editor?.getHTML() || form.content,
      cover_image:
        imageMode === "url" && form.cover_image ? form.cover_image : null,
      tags: JSON.stringify(
        form.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean),
      ),
      read_minutes: Number(form.read_minutes),
    };
    try {
      if (editing) {
        await fetch(`/api/blog-posts/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/blog-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await load();
      setShowForm(false);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: number) {
    if (!confirm("Delete this post?")) return;
    setDeleting(id);
    await fetch(`/api/blog-posts/${id}`, { method: "DELETE" });
    await load();
    setDeleting(null);
    if (editing?.id === id) setShowForm(false);
  }

  async function toggleStatus(post: BlogPost) {
    await fetch(`/api/blog-posts/${post.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        status: post.status === "published" ? "draft" : "published",
      }),
    });
    await load();
  }

  const setFontSize = (size: string) => {
    if (!size || !editor) return;
    editor.chain().focus().setFontSize(size).run();
  };

  const setHeading = (value: string) => {
    if (!editor) return;
    if (value === "paragraph") {
      editor.chain().focus().setParagraph().run();
      return;
    }
    const level = Number(value) as 1 | 2 | 3;
    editor.chain().focus().setHeading({ level }).run();
  };

  const runEditorCommand = (fn: () => boolean | void) => {
    if (!editor) return;
    editor.chain().focus();
    fn();
  };

  const insertLink = () => {
    if (!editor) return;
    const previous = editor.getAttributes("link").href as string | undefined;
    const url = window.prompt("Enter link URL", previous || "https://");
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const currentHeading = editor?.isActive("heading", { level: 1 })
    ? "1"
    : editor?.isActive("heading", { level: 2 })
      ? "2"
      : editor?.isActive("heading", { level: 3 })
        ? "3"
        : "paragraph";

  // Combined status + free-text search filter. Search matches title, excerpt,
  // category, author and tags.
  const filtered = posts.filter((p) => {
    if (filterStatus !== "all" && p.status !== filterStatus) return false;

    const q = search.trim().toLowerCase();
    if (!q) return true;

    const tagsStr = (() => {
      try {
        return (JSON.parse(p.tags) as string[]).join(" ");
      } catch {
        return p.tags;
      }
    })();

    const haystack = [p.title, p.excerpt, p.category, p.author, tagsStr]
      .join(" ")
      .toLowerCase();

    return haystack.includes(q);
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  return (
    <div className="max-w-screen-xl mx-auto">
      <style>{`
        .blog-editor-select {
          height: 28px;
          padding: 0 8px;
          font-size: 12px;
          border-radius: 6px;
          border: 1px solid rgb(226 232 240);
          background: white;
          color: rgb(51 65 85);
        }
        .blog-editor-content .ProseMirror {
          min-height: 220px;
          padding: 16px;
          outline: none;
          font-size: 14px;
          color: rgb(30 41 59);
        }
        .blog-editor-content .ProseMirror img,
        .blog-editor-content img {
          max-width: min(100%, 420px) !important;
          max-height: 240px !important;
          width: auto !important;
          height: auto !important;
          object-fit: contain !important;
          border-radius: 8px;
          display: block;
          margin: 0.75rem 0;
        }
        .blog-editor-content .ProseMirror ul {
          list-style-type: disc !important;
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 0.85rem !important;
        }
        .blog-editor-content .ProseMirror ol {
          list-style-type: decimal !important;
          list-style-position: outside !important;
          padding-left: 1.5rem !important;
          margin: 0.5rem 0 0.85rem !important;
        }
        .blog-editor-content .ProseMirror li {
          display: list-item !important;
          margin: 0.25rem 0;
        }
        .blog-editor-content .ProseMirror li p {
          margin: 0;
        }
        .blog-editor-content .ProseMirror blockquote {
          border-left: 3px solid rgb(203 213 225) !important;
          margin: 0.75rem 0 !important;
          padding-left: 0.9rem !important;
          color: rgb(71 85 105);
        }
        .blog-editor-content .ProseMirror h1 {
          font-size: 1.75rem !important;
          font-weight: 700;
          line-height: 1.25;
          margin: 0.75rem 0;
        }
        .blog-editor-content .ProseMirror h2 {
          font-size: 1.4rem !important;
          font-weight: 650;
          line-height: 1.3;
          margin: 0.75rem 0;
        }
        .blog-editor-content .ProseMirror h3 {
          font-size: 1.15rem !important;
          font-weight: 650;
          line-height: 1.35;
          margin: 0.75rem 0;
        }
        .blog-editor-content .ProseMirror a.blog-editor-link {
          color: rgb(37 99 235);
          text-decoration: underline;
        }
      `}</style>

      <div className="flex items-center justify-between gap-4 mb-6 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Blog</h1>
          <p className="text-slate-500 text-sm mt-1">
            {posts.length} posts ·{" "}
            {posts.filter((p) => p.status === "published").length} published
          </p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="h-4 w-4" /> New Post
        </Button>
      </div>

      {/* Editor form */}
      {showForm && (
        <Card className="border-0 shadow-md mb-8" id="blog-form-top">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold">
                {editing ? "Edit Post" : "New Post"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              {/* Title + Slug */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Title *
                  </Label>
                  <Input
                    value={form.title}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        title: e.target.value,
                        slug: editing ? f.slug : slugify(e.target.value),
                      }))
                    }
                    placeholder="Post title"
                    required
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Slug *
                  </Label>
                  <Input
                    value={form.slug}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, slug: e.target.value }))
                    }
                    placeholder="url-friendly-slug"
                    required
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1 block">
                  Excerpt *
                </Label>
                <textarea
                  value={form.excerpt}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, excerpt: e.target.value }))
                  }
                  placeholder="Short description shown on the blog list page"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-400 resize-none"
                  rows={2}
                  required
                />
              </div>

              {/* Cover image section */}
              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <div className="flex bg-slate-50 border-b border-slate-200">
                  <button
                    type="button"
                    onClick={() => setImageMode("gradient")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                      imageMode === "gradient"
                        ? "bg-white text-slate-900 border-b-2 border-emerald-500"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <div className="h-3.5 w-5 rounded bg-gradient-to-r from-emerald-500 to-teal-600" />
                    Gradient cover
                  </button>
                  <button
                    type="button"
                    onClick={() => setImageMode("url")}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${
                      imageMode === "url"
                        ? "bg-white text-slate-900 border-b-2 border-emerald-500"
                        : "text-slate-500 hover:text-slate-700"
                    }`}
                  >
                    <ImageIcon className="h-3.5 w-3.5" />
                    Image URL
                  </button>
                </div>

                <div className="p-4">
                  {imageMode === "gradient" ? (
                    <div className="space-y-3">
                      <p className="text-xs text-slate-500">
                        Choose a gradient colour for the cover banner
                      </p>
                      <div className="flex gap-2 flex-wrap">
                        {GRADIENTS.map((g) => (
                          <button
                            key={g}
                            type="button"
                            onClick={() =>
                              setForm((f) => ({ ...f, cover_gradient: g }))
                            }
                            className={`h-9 w-16 rounded-lg bg-gradient-to-r ${g} transition-all ${
                              form.cover_gradient === g
                                ? "ring-2 ring-offset-2 ring-slate-500 scale-105"
                                : "opacity-70 hover:opacity-100"
                            }`}
                          />
                        ))}
                      </div>
                      <div
                        className={`h-20 w-full rounded-xl bg-gradient-to-r ${form.cover_gradient} transition-all`}
                      />
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <ImageUpload
                        contentType="blog"
                        onUploadComplete={(url) => {
                          setForm((f) => ({ ...f, cover_image: url }));
                          setPreviewImg(url);
                          setUploadError(null);
                        }}
                        onUploadError={(error) => {
                          setUploadError(error);
                        }}
                        label="Upload Cover Image"
                        description="Drag and drop or click to upload. PNG, JPG, WebP, or GIF up to 500MB"
                      />

                      <div className="relative text-center">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                          <span className="bg-white px-2 text-slate-500">
                            Or paste URL
                          </span>
                        </div>
                      </div>

                      <div>
                        <Label className="text-xs font-medium text-slate-600 mb-1 block">
                          Image URL
                        </Label>
                        <div className="relative">
                          <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                          <Input
                            value={form.cover_image}
                            onChange={(e) => {
                              setForm((f) => ({
                                ...f,
                                cover_image: e.target.value,
                              }));
                              setPreviewImg(e.target.value);
                            }}
                            placeholder="https://example.com/cover.jpg"
                            className="pl-10"
                          />
                        </div>
                        <p className="text-xs text-slate-400 mt-1">
                          Paste a direct link to an image (JPG, PNG, WebP).
                          Recommended size: 1200×630px.
                        </p>
                      </div>

                      {uploadError && (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <p className="text-sm text-red-700">{uploadError}</p>
                        </div>
                      )}

                      {previewImg && (
                        <div className="relative rounded-xl overflow-hidden bg-slate-100 h-32">
                          <img
                            src={previewImg}
                            alt="Cover preview"
                            className="w-full h-full object-cover"
                            onError={() => setPreviewImg("")}
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setPreviewImg("");
                              setForm((f) => ({ ...f, cover_image: "" }));
                            }}
                            className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1 hover:bg-black/80"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      )}
                      {!previewImg && (
                        <div className="h-20 rounded-xl border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-400 text-xs gap-2">
                          <ImageIcon className="h-5 w-5 opacity-40" />
                          Image preview will appear here
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* WYSIWYG Content editor */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-2 block">
                  Content *
                </Label>

                {wasLegacyContent && (
                  <div className="mb-2 p-2.5 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-800">
                    This post was created with the old block editor. It's been
                    converted for editing here — nothing is changed in the
                    database until you click Save/Update below.
                  </div>
                )}

                <div className="rounded-xl border border-slate-200 overflow-hidden">
                  <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-slate-200 bg-slate-50">
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
                      className="blog-editor-select"
                      defaultValue=""
                      onChange={(e) => {
                        setFontSize(e.target.value);
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
                      className="blog-editor-select"
                      defaultValue=""
                      onChange={(e) => {
                        const value = e.target.value;
                        if (!value) {
                          editor?.chain().focus().unsetColor().run();
                        } else {
                          editor?.chain().focus().setColor(value).run();
                        }
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

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn
                      title="Bold"
                      active={editor?.isActive("bold")}
                      onClick={() =>
                        runEditorCommand(() =>
                          editor!.chain().focus().toggleBold().run(),
                        )
                      }
                    >
                      <BoldIcon className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      title="Italic"
                      active={editor?.isActive("italic")}
                      onClick={() =>
                        runEditorCommand(() =>
                          editor!.chain().focus().toggleItalic().run(),
                        )
                      }
                    >
                      <ItalicIcon className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      title="Underline"
                      active={editor?.isActive("underline")}
                      onClick={() =>
                        runEditorCommand(() =>
                          (editor!.chain().focus() as any)
                            .toggleUnderline()
                            .run(),
                        )
                      }
                    >
                      <UnderlineIcon className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      title="Strikethrough"
                      active={editor?.isActive("strike")}
                      onClick={() =>
                        runEditorCommand(() =>
                          editor!.chain().focus().toggleStrike().run(),
                        )
                      }
                    >
                      <Strikethrough className="h-3.5 w-3.5" />
                    </ToolbarBtn>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn
                      title="Bullet list"
                      active={editor?.isActive("bulletList")}
                      onClick={() =>
                        runEditorCommand(() =>
                          editor!.chain().focus().toggleBulletList().run(),
                        )
                      }
                    >
                      <List className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      title="Numbered list"
                      active={editor?.isActive("orderedList")}
                      onClick={() =>
                        runEditorCommand(() =>
                          editor!.chain().focus().toggleOrderedList().run(),
                        )
                      }
                    >
                      <ListOrdered className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      title="Quote"
                      active={editor?.isActive("blockquote")}
                      onClick={() =>
                        runEditorCommand(() =>
                          editor!.chain().focus().toggleBlockquote().run(),
                        )
                      }
                    >
                      <Quote className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn title="Insert link" onClick={insertLink}>
                      <Link2 className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                    <ToolbarBtn
                      title="Insert image"
                      onClick={() => setShowEditorImagePicker((v) => !v)}
                    >
                      <ImageIcon className="h-3.5 w-3.5" />
                    </ToolbarBtn>

                    <div className="w-px h-5 bg-slate-200 mx-1" />

                    <ToolbarBtn
                      title="Undo"
                      onClick={() => editor?.chain().focus().undo().run()}
                    >
                      <Undo2 className="h-3.5 w-3.5" />
                    </ToolbarBtn>
                  </div>

                  {showEditorImagePicker && (
                    <div className="p-3 border-b border-slate-200 bg-slate-50">
                      <ImageUpload
                        contentType="blog"
                        onUploadComplete={(url) => {
                          editor?.chain().focus().setImage({ src: url }).run();
                          setShowEditorImagePicker(false);
                        }}
                        onUploadError={(error) => setUploadError(error)}
                        label="Insert Image"
                        description="Upload an image to insert into the post body"
                      />
                      <button
                        type="button"
                        onClick={() => setShowEditorImagePicker(false)}
                        className="text-xs text-slate-400 hover:text-slate-600 mt-2"
                      >
                        Cancel
                      </button>
                    </div>
                  )}

                  <EditorContent
                    editor={editor}
                    className="blog-editor-content"
                  />
                </div>
              </div>

              {/* Meta fields */}
              <div className="grid sm:grid-cols-3 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Category
                  </Label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, category: e.target.value }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Author
                  </Label>
                  <Input
                    value={form.author}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, author: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Read time (min)
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={60}
                    value={form.read_minutes}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        read_minutes: Number(e.target.value),
                      }))
                    }
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Tags (comma-separated)
                  </Label>
                  <Input
                    value={form.tags}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, tags: e.target.value }))
                    }
                    placeholder="EV, Singapore, Guide"
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium text-slate-600 mb-1 block">
                    Status
                  </Label>
                  <select
                    value={form.status}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        status: e.target.value as "draft" | "published",
                      }))
                    }
                    className="w-full px-3 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 bg-white"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : editing ? "Update Post" : "Create Post"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Filter tabs + search */}
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex gap-2">
          {(["all", "published", "draft"] as const).map((f) => (
            <button
              key={f}
              onClick={() => changeFilter(f)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filterStatus === f
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-300"
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <SearchBar
          value={search}
          onChange={handleSearchChange}
          placeholder="Search posts by title, excerpt, category, tag..."
          className="w-full sm:w-72"
        />
      </div>

      {/* Posts list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-16 text-center text-slate-400">
            <BookOpen className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>
              {search.trim()
                ? "No posts match your search."
                : 'No posts yet. Click "New Post" to get started.'}
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="space-y-3">
            {paginated.map((post) => {
              const tags: string[] = (() => {
                try {
                  return JSON.parse(post.tags);
                } catch {
                  return [];
                }
              })();
              return (
                <Card
                  key={post.id}
                  className={`border-0 shadow-sm hover:shadow-md transition-shadow ${
                    editing?.id === post.id && showForm
                      ? "ring-2 ring-emerald-400"
                      : ""
                  }`}
                >
                  <CardContent className="p-4 flex items-start gap-4">
                    {/* Cover thumbnail */}
                    <div className="flex-shrink-0 h-14 w-24 rounded-xl overflow-hidden">
                      <div className="flex-shrink-0 h-14 w-24 rounded-xl overflow-hidden bg-slate-100">
                        {post.cover_image ? (
                          <img
                            src={post.cover_image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = "none";

                              const fallback = e.currentTarget
                                .nextElementSibling as HTMLElement;

                              if (fallback) {
                                fallback.style.display = "block";
                              }
                            }}
                          />
                        ) : null}

                        <div
                          className={`w-full h-full bg-gradient-to-r ${post.cover_gradient} ${
                            post.cover_image ? "hidden" : "block"
                          }`}
                        />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-0.5">
                        <h3 className="font-semibold text-slate-900 text-sm leading-tight">
                          {post.title}
                        </h3>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium border ${
                            post.status === "published"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : "bg-slate-100 text-slate-600 border-slate-200"
                          }`}
                        >
                          {post.status === "published" ? "Published" : "Draft"}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-1 mb-1.5">
                        {post.excerpt}
                      </p>
                      <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap">
                        <span className="font-medium text-slate-600">
                          {post.category}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {post.read_minutes} min
                        </span>
                        {post.published_at && (
                          <span>
                            {format(new Date(post.published_at), "d MMM yyyy")}
                          </span>
                        )}
                        {tags.slice(0, 3).map((t: string) => (
                          <span
                            key={t}
                            className="bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 flex-shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleStatus(post)}
                        title={
                          post.status === "published" ? "Unpublish" : "Publish"
                        }
                        className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                      >
                        {post.status === "published" ? (
                          <EyeOff className="h-3.5 w-3.5" />
                        ) : (
                          <Eye className="h-3.5 w-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => openEdit(post)}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                        title="Edit"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(post.id)}
                        disabled={deleting === post.id}
                        className="h-7 w-7 flex items-center justify-center rounded-md text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Pagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={goToPage}
          />
        </>
      )}
    </div>
  );
}

export default function BlogAdmin() {
  return (
    <Suspense fallback={null}>
      <BlogAdminInner />
    </Suspense>
  );
}
