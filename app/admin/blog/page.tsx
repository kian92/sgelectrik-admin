"use client";
import { useEffect, useState, type FormEvent } from "react";
import { format } from "date-fns";
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
} from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
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

export default function BlogAdmin() {
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
  const [imageMode, setImageMode] = useState<"gradient" | "url">("gradient");
  const [previewImg, setPreviewImg] = useState("");

  const load = async () => {
    const res = await fetch("/api/blog-posts");
    setPosts(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  function openNew() {
    setEditing(null);
    setForm(EMPTY_FORM);
    setImageMode("gradient");
    setPreviewImg("");
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
    setForm({
      title: post.title,
      slug: post.slug,
      excerpt: post.excerpt,
      content: post.content,
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

  const filtered =
    filterStatus === "all"
      ? posts
      : posts.filter((p) => p.status === filterStatus);

  return (
    <div className="max-w-screen-xl mx-auto">
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
                    <div className="space-y-3">
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

              {/* WYSIWYG Content */}
              <div>
                <Label className="text-xs font-medium text-slate-600 mb-1.5 block">
                  Content *
                </Label>
                <RichTextEditor
                  value={form.content}
                  onChange={(html) => setForm((f) => ({ ...f, content: html }))}
                  placeholder="Write your article here. Use the toolbar above for formatting — headings, bold, lists, links, and images."
                  minHeight={360}
                />
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

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5">
        {(["all", "published", "draft"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilterStatus(f)}
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
            <p>No posts yet. Click "New Post" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => {
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
                    {post.cover_image ? (
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div
                        className={`w-full h-full bg-gradient-to-r ${post.cover_gradient}`}
                      />
                    )}
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
      )}
    </div>
  );
}
