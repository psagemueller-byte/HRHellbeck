"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { sanitizeAndLimit } from "@/lib/sanitize";
import { NewsArticle } from "@/types";
import {
  Newspaper,
  Users,
  PartyPopper,
  Briefcase,
  Plus,
  X,
  ThumbsUp,
  Trash2,
  ImagePlus,
  PenLine,
} from "lucide-react";

const VALID_CATEGORIES = ["unternehmen", "team", "event", "hr"] as const;
type NewsCategory = (typeof VALID_CATEGORIES)[number];

const categoryIcons: Record<string, typeof Newspaper> = {
  unternehmen: Briefcase,
  team: Users,
  event: PartyPopper,
  hr: Newspaper,
};

const categoryColors: Record<string, string> = {
  unternehmen: "bg-blue-100 text-blue-700",
  team: "bg-green-100 text-green-700",
  event: "bg-purple-100 text-purple-700",
  hr: "bg-amber-100 text-amber-700",
};

const categoryLabels: Record<string, string> = {
  unternehmen: "Unternehmen",
  team: "Team",
  event: "Event",
  hr: "HR",
};

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function NewsPage() {
  const { user, news, toggleNewsLike, addNews, deleteNews, hasRole } = useAuth();

  const canCreate = hasRole("autor");
  const isAdmin = hasRole("admin");

  const [showEditor, setShowEditor] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formError, setFormError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    excerpt: "",
    content: "",
    category: "unternehmen" as NewsCategory,
  });

  const resetForm = () => {
    setFormData({ title: "", excerpt: "", content: "", category: "unternehmen" });
    setImagePreview(null);
    setFormError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      setFormError("Nur JPEG, PNG, GIF und WebP Bilder sind erlaubt.");
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      setFormError("Das Bild darf maximal 5 MB groß sein.");
      return;
    }

    setFormError("");
    const reader = new FileReader();
    reader.onload = (event) => {
      setImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    const title = sanitizeAndLimit(formData.title, 200);
    const excerpt = sanitizeAndLimit(formData.excerpt, 500);
    const content = sanitizeAndLimit(formData.content, 5000);

    if (!title) {
      setFormError("Bitte einen Titel eingeben.");
      return;
    }
    if (!excerpt) {
      setFormError("Bitte eine Kurzbeschreibung eingeben.");
      return;
    }
    if (!content) {
      setFormError("Bitte den Beitragstext eingeben.");
      return;
    }
    if (!VALID_CATEGORIES.includes(formData.category)) {
      setFormError("Ungültige Kategorie.");
      return;
    }

    const authorName = user ? `${user.firstName} ${user.lastName}` : "Unbekannt";

    addNews({
      title,
      excerpt,
      content,
      category: formData.category,
      author: authorName,
      imageUrl: imagePreview || undefined,
    });

    resetForm();
    setShowEditor(false);
  };

  const handleDelete = (newsId: string) => {
    deleteNews(newsId);
    setConfirmDelete(null);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Newspaper className="h-7 w-7 text-[var(--color-primary-600)]" />
            Unternehmensnews
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Neuigkeiten und Ankündigungen aus dem Unternehmen
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => { resetForm(); setShowEditor(true); }}
            className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors"
          >
            <Plus className="h-4 w-4" />
            Beitrag erstellen
          </button>
        )}
      </div>

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <PenLine className="h-5 w-5 text-[var(--color-primary-600)]" />
                Neuer Beitrag
              </h2>
              <button
                onClick={() => { resetForm(); setShowEditor(false); }}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
                  {formError}
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Titel *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="z.B. Neue Büroräume eröffnet"
                  maxLength={200}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1 text-right">{formData.title.length}/200</p>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Kategorie
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (VALID_CATEGORIES.includes(val as NewsCategory)) {
                      setFormData({ ...formData, category: val as NewsCategory });
                    }
                  }}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                >
                  <option value="unternehmen">Unternehmen</option>
                  <option value="team">Team</option>
                  <option value="event">Event</option>
                  <option value="hr">HR</option>
                </select>
              </div>

              {/* Excerpt */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Kurzbeschreibung *
                </label>
                <textarea
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Eine kurze Zusammenfassung des Beitrags..."
                  rows={2}
                  maxLength={500}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1 text-right">{formData.excerpt.length}/500</p>
              </div>

              {/* Content */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Beitragstext *
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  placeholder="Der vollständige Beitrag..."
                  rows={6}
                  maxLength={5000}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none"
                />
                <p className="text-[10px] text-[var(--color-text-muted)] mt-1 text-right">{formData.content.length}/5000</p>
              </div>

              {/* Image upload */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">
                  Bild (optional)
                </label>
                <div className="border-2 border-dashed border-[var(--color-border)] rounded-xl p-4 text-center hover:border-[var(--color-primary-300)] transition-colors">
                  {imagePreview ? (
                    <div className="relative">
                      <img
                        src={imagePreview}
                        alt="Vorschau"
                        className="max-h-48 mx-auto rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="absolute top-2 right-2 h-7 w-7 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex flex-col items-center gap-2 mx-auto py-4"
                    >
                      <div className="h-12 w-12 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                        <ImagePlus className="h-6 w-6 text-[var(--color-text-muted)]" />
                      </div>
                      <span className="text-sm text-[var(--color-text-secondary)]">
                        Klicken zum Hochladen
                      </span>
                      <span className="text-xs text-[var(--color-text-muted)]">
                        JPEG, PNG, GIF oder WebP (max. 5 MB)
                      </span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/gif,image/webp"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setShowEditor(false); }}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  Veröffentlichen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {confirmDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">
              Beitrag löschen?
            </h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">
              Dieser Beitrag wird unwiderruflich gelöscht.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
              >
                Abbrechen
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* News list */}
      {news.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
          <Newspaper className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[var(--color-text-muted)]">
            Noch keine Beiträge vorhanden.
          </p>
          {canCreate && (
            <button
              onClick={() => setShowEditor(true)}
              className="text-sm text-[var(--color-primary-600)] hover:underline mt-2"
            >
              Ersten Beitrag erstellen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {news.map((article) => {
            const Icon = categoryIcons[article.category] || Newspaper;
            const isLiked = user ? article.likes.includes(user.id) : false;
            return (
              <article
                key={article.id}
                className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden hover:border-[var(--color-primary-200)] transition-colors"
              >
                {/* Image */}
                {article.imageUrl && (
                  <div className="w-full h-56 bg-[var(--color-surface-tertiary)]">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}

                <div className="p-5">
                  <div className="flex items-start gap-4">
                    <div className="h-10 w-10 rounded-lg bg-[var(--color-surface-tertiary)] flex items-center justify-center flex-shrink-0">
                      <Icon className="h-5 w-5 text-[var(--color-text-secondary)]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${categoryColors[article.category]}`}
                        >
                          {categoryLabels[article.category]}
                        </span>
                        <span className="text-xs text-[var(--color-text-muted)]">
                          {formatDate(article.publishedAt)}
                        </span>
                      </div>
                      <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                        {article.title}
                      </h3>
                      <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed mb-1">
                        {article.excerpt}
                      </p>
                      <p className="text-sm text-[var(--color-text-muted)] leading-relaxed">
                        {article.content}
                      </p>
                      <div className="flex items-center justify-between mt-3">
                        <p className="text-xs text-[var(--color-text-muted)]">
                          Von {article.author}
                        </p>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleNewsLike(article.id)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                              isLiked
                                ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                                : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-gray-200 hover:text-[var(--color-text-secondary)]"
                            }`}
                          >
                            <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-blue-700" : ""}`} />
                            {article.likes.length > 0 && <span>{article.likes.length}</span>}
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setConfirmDelete(article.id)}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 transition-all"
                              title="Beitrag löschen"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
