"use client";

import { useState, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { sanitizeAndLimit } from "@/lib/sanitize";
import { uploadFile } from "@/lib/upload";
import { NewsArticle, NewsPollOption } from "@/types";
import {
  Newspaper,
  Users,
  BarChart3,
  PartyPopper,
  Briefcase,
  Plus,
  X,
  ThumbsUp,
  Trash2,
  ImagePlus,
  PenLine,
  ArrowRight,
  Quote,
} from "lucide-react";

const VALID_CATEGORIES = ["unternehmen", "team", "event", "hr"] as const;
type NewsCategory = (typeof VALID_CATEGORIES)[number];

const categoryIcons: Record<string, typeof Newspaper> = {
  unternehmen: Briefcase,
  team: Users,
  event: PartyPopper,
  hr: Newspaper,
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

// Static "Kurz notiert" items for the sidebar widget
const kurzNotiertItems = [
  {
    category: "HR",
    title: "Neue Gleitzeitregelung ab April",
    description: "Die Kernarbeitszeit wird auf 10:00–14:00 Uhr verkürzt.",
  },
  {
    category: "IT",
    title: "Systemwartung am Wochenende",
    description: "Am 29.03. wird das Intranet von 22–06 Uhr gewartet.",
  },
  {
    category: "Event",
    title: "Sommerfest-Planung gestartet",
    description: "Ideen und Vorschläge bitte bis 15. April einreichen.",
  },
];

// Static employee pulse quote
const employeePulse = {
  quote: "Die neue Teamstruktur hat unsere Zusammenarbeit deutlich verbessert – ich fühle mich besser eingebunden.",
  name: "Maria Schneider",
  role: "Produktentwicklung",
  initials: "MS",
};

export default function NewsPage() {
  const { user, news, toggleNewsLike, markNewsRead, addNews, editNews, voteNewsPoll, deleteNews, hasRole } = useAuth();

  const canCreate = hasRole("autor");
  const isAdmin = hasRole("admin");

  const [showEditor, setShowEditor] = useState(false);
  const [editingArticle, setEditingArticle] = useState<NewsArticle | null>(null);
  const [expandedArticle, setExpandedArticle] = useState<string | null>(null);
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

  // Poll state
  const [showPoll, setShowPoll] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState(["", ""]);
  const [pollMultiple, setPollMultiple] = useState(false);

  const resetForm = () => {
    setFormData({ title: "", excerpt: "", content: "", category: "unternehmen" });
    setImagePreview(null);
    setFormError("");
    setShowPoll(false);
    setPollQuestion("");
    setPollOptions(["", ""]);
    setPollMultiple(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
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

    const url = await uploadFile(file, "news");
    if (url) {
      setImagePreview(url);
    } else {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
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

    // Build poll data if enabled
    const pollData = showPoll && pollQuestion.trim() && pollOptions.filter((o) => o.trim()).length >= 2
      ? {
          question: sanitizeAndLimit(pollQuestion, 200),
          options: pollOptions.filter((o) => o.trim()).map((o, i) => ({
            id: `opt-${i}`,
            text: sanitizeAndLimit(o, 100),
            votes: [] as string[],
          })),
          multipleChoice: pollMultiple,
        }
      : undefined;

    if (editingArticle) {
      editNews(editingArticle.id, {
        title,
        excerpt,
        content,
        category: formData.category,
        imageUrl: imagePreview || undefined,
        poll: pollData,
      });
      setEditingArticle(null);
    } else {
      const authorName = user ? `${user.firstName} ${user.lastName}` : "Unbekannt";
      addNews({
        title,
        excerpt,
        content,
        category: formData.category,
        author: authorName,
        imageUrl: imagePreview || undefined,
        poll: pollData,
      });
    }

    resetForm();
    setShowEditor(false);
  };

  const startEdit = (article: NewsArticle) => {
    setFormData({
      title: article.title,
      excerpt: article.excerpt,
      content: article.content,
      category: article.category as NewsCategory,
    });
    setImagePreview(article.imageUrl || null);
    if (article.poll) {
      setShowPoll(true);
      setPollQuestion(article.poll.question);
      setPollOptions(article.poll.options.map((o) => o.text));
      setPollMultiple(article.poll.multipleChoice || false);
    }
    setEditingArticle(article);
    setShowEditor(true);
  };

  const handleDelete = (newsId: string) => {
    deleteNews(newsId);
    setConfirmDelete(null);
  };

  const featuredArticle = news.length > 0 ? news[0] : null;
  const remainingArticles = news.length > 1 ? news.slice(1) : [];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
      {/* ───── Page Header ───── */}
      <div className="mb-8 md:mb-12">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)] mb-2">
              Company Update
            </p>
            <h1 className="text-[30px] sm:text-[36px] font-extrabold text-[var(--color-text-primary)] tracking-[-1.8px] leading-[1.1]">
              Aktuelle News
            </h1>
            <div className="w-24 h-1 rounded-full bg-[var(--color-primary-600)] mt-4" />
          </div>
          {canCreate && (
            <button
              onClick={() => { resetForm(); setShowEditor(true); }}
              className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Beitrag erstellen</span>
              <span className="sm:hidden">Neu</span>
            </button>
          )}
        </div>
      </div>

      {/* ───── Editor Modal ───── */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <PenLine className="h-5 w-5 text-[var(--color-primary-600)]" />
                {editingArticle ? "Beitrag bearbeiten" : "Neuer Beitrag"}
              </h2>
              <button
                onClick={() => { resetForm(); setEditingArticle(null); setShowEditor(false); }}
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

              {/* Poll editor */}
              <div>
                <button
                  type="button"
                  onClick={() => setShowPoll(!showPoll)}
                  className={`flex items-center gap-2 text-sm font-medium transition-colors ${showPoll ? "text-[var(--color-primary-600)]" : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"}`}
                >
                  <BarChart3 className="h-4 w-4" />
                  {showPoll ? "Umfrage entfernen" : "Umfrage hinzufügen"}
                </button>
                {showPoll && (
                  <div className="mt-3 p-4 border border-[var(--color-border)] rounded-lg bg-[var(--color-surface-tertiary)] space-y-3">
                    <input
                      type="text"
                      value={pollQuestion}
                      onChange={(e) => setPollQuestion(e.target.value)}
                      placeholder="Frage der Umfrage..."
                      maxLength={200}
                      className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                    {pollOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-[var(--color-text-muted)] w-5">{i + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...pollOptions];
                            updated[i] = e.target.value;
                            setPollOptions(updated);
                          }}
                          placeholder={`Option ${i + 1}`}
                          maxLength={100}
                          className="flex-1 px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                        />
                        {pollOptions.length > 2 && (
                          <button type="button" onClick={() => setPollOptions(pollOptions.filter((_, j) => j !== i))} className="text-red-500 hover:text-red-700">
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {pollOptions.length < 6 && (
                      <button
                        type="button"
                        onClick={() => setPollOptions([...pollOptions, ""])}
                        className="text-xs text-[var(--color-primary-600)] font-medium hover:underline"
                      >
                        + Option hinzufügen
                      </button>
                    )}
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={pollMultiple} onChange={(e) => setPollMultiple(e.target.checked)} className="rounded" />
                      <span className="text-xs text-[var(--color-text-secondary)]">Mehrfachauswahl erlauben</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => { resetForm(); setEditingArticle(null); setShowEditor(false); }}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors"
                >
                  {editingArticle ? "Speichern" : "Veröffentlichen"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ───── Delete Confirmation Modal ───── */}
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

      {/* ───── Empty State ───── */}
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
        <>
          {/* ───── Featured Article + Sidebar ───── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 mb-10 md:mb-14">
            {/* Featured Card */}
            {featuredArticle && (
              <div className="lg:col-span-2">
                <FeaturedCard
                  article={featuredArticle}
                  user={user}
                  isAdmin={isAdmin}
                  onLike={() => toggleNewsLike(featuredArticle.id)}
                  onDelete={() => setConfirmDelete(featuredArticle.id)}
                  onEdit={() => startEdit(featuredArticle)}
                  onVote={(optionId) => voteNewsPoll(featuredArticle.id, optionId)}
                  expanded={expandedArticle === featuredArticle.id}
                  onToggleExpand={() => {
                    const isExpanding = expandedArticle !== featuredArticle.id;
                    setExpandedArticle(isExpanding ? featuredArticle.id : null);
                    if (isExpanding) markNewsRead(featuredArticle.id);
                  }}
                />
              </div>
            )}

            {/* Sidebar */}
            <div className="flex flex-col gap-6">
              {/* Kurz notiert */}
              <div className="bg-[var(--color-surface-tertiary)] rounded-lg p-5 sm:p-6">
                <h2 className="text-[20px] font-bold text-[var(--color-primary-600)] mb-4">
                  Kurz notiert
                </h2>
                <div className="space-y-4">
                  {kurzNotiertItems.map((item, i) => (
                    <div key={i} className="border-l-4 border-[#c2e4fc] pl-4">
                      <p className="text-[10px] font-bold uppercase tracking-wide text-[var(--color-text-secondary)] mb-0.5">
                        {item.category}
                      </p>
                      <p className="text-[16px] font-bold text-[var(--color-text-primary)] leading-snug">
                        {item.title}
                      </p>
                      <p className="text-[12px] text-[var(--color-text-body)] mt-0.5 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Employee Pulse */}
              <div className="bg-white border border-[var(--color-border)] rounded-lg p-5 sm:p-6">
                <p className="text-[12px] font-bold uppercase tracking-[0.6px] text-[var(--color-text-secondary)] mb-3">
                  Employee Pulse
                </p>
                <Quote className="h-5 w-5 text-[var(--color-primary-600)] mb-2 opacity-40" />
                <p className="text-[18px] text-[var(--color-text-primary)] leading-relaxed mb-4">
                  {employeePulse.quote}
                </p>
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#c2e4fc] flex items-center justify-center shrink-0">
                    <span className="text-xs font-bold text-[var(--color-primary-600)]">
                      {employeePulse.initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] leading-tight">
                      {employeePulse.name}
                    </p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {employeePulse.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───── Weitere Meldungen ───── */}
          {remainingArticles.length > 0 && (
            <section>
              <h2 className="text-[24px] font-bold text-[var(--color-text-primary)] mb-6">
                Weitere Meldungen
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {remainingArticles.map((article) => (
                  <SecondaryCard
                    key={article.id}
                    article={article}
                    user={user}
                    isAdmin={isAdmin}
                    onLike={() => toggleNewsLike(article.id)}
                    onDelete={() => setConfirmDelete(article.id)}
                    onEdit={() => startEdit(article)}
                    onVote={(optionId) => voteNewsPoll(article.id, optionId)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════
   Featured Card (first article, hero style)
   ══════════════════════════════════════════════ */
function FeaturedCard({
  article,
  user,
  isAdmin,
  onLike,
  onDelete,
  onEdit,
  onVote,
  expanded,
  onToggleExpand,
}: {
  article: NewsArticle;
  user: { id: string } | null;
  isAdmin: boolean;
  onLike: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onVote: (optionId: string) => void;
  expanded: boolean;
  onToggleExpand: () => void;
}) {
  const isLiked = user ? article.likes.includes(user.id) : false;

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden h-full flex flex-col">
      {/* Hero image */}
      {article.imageUrl ? (
        <div className="w-full h-48 sm:h-56 md:h-64 bg-[var(--color-surface-tertiary)]">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-48 sm:h-56 md:h-64 bg-gradient-to-br from-[var(--color-primary-600)] to-[var(--color-primary-400)] flex items-center justify-center">
          <Newspaper className="h-16 w-16 text-white/30" />
        </div>
      )}

      {/* Content */}
      <div className="p-6 sm:p-7 md:p-8 flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-3">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[var(--color-primary-600)] text-white">
            {categoryLabels[article.category]}
          </span>
          <span className="text-[12px] font-medium text-[var(--color-text-muted)]">
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <h2 className="text-[24px] sm:text-[28px] md:text-[30px] font-bold text-[var(--color-text-primary)] tracking-[-0.75px] leading-tight mb-3">
          {article.title}
        </h2>

        <p className="text-[16px] sm:text-[18px] text-[var(--color-text-body)] leading-relaxed mb-2">
          {article.excerpt}
        </p>

        {/* Content with blur-to-read effect */}
        <div className="relative mb-6">
          <div className={`text-sm text-[var(--color-text-muted)] leading-relaxed transition-all duration-300 ${expanded ? "" : "max-h-24 overflow-hidden"}`}>
            {article.content}
          </div>
          {!expanded && (
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white via-white/90 to-transparent pointer-events-none" />
          )}
        </div>

        {/* Poll */}
        {article.poll && (
          <PollWidget poll={article.poll} userId={user?.id} onVote={onVote} />
        )}

        <div className="mt-auto flex items-center justify-between gap-4">
          <button
            onClick={onToggleExpand}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-400)] text-white text-sm font-medium rounded-md px-6 py-3 hover:opacity-90 transition-opacity"
          >
            {expanded ? "Weniger anzeigen" : "Artikel lesen"}
            <ArrowRight className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`} />
          </button>

          <div className="flex items-center gap-2">
            {isAdmin && (
              <button
                onClick={onEdit}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-blue-50 hover:text-blue-600 transition-all"
                title="Beitrag bearbeiten"
              >
                <PenLine className="h-3.5 w-3.5" />
              </button>
            )}
            <button
              onClick={onLike}
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
                onClick={onDelete}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-xs font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 transition-all"
                title="Beitrag löschen"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        <p className="text-xs text-[var(--color-text-muted)] mt-4">
          Von {article.author}
        </p>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════
   Secondary Card (remaining articles)
   ══════════════════════════════════════════════ */
function SecondaryCard({
  article,
  user,
  isAdmin,
  onLike,
  onDelete,
  onEdit,
  onVote,
}: {
  article: NewsArticle;
  user: { id: string } | null;
  isAdmin: boolean;
  onLike: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onVote: (optionId: string) => void;
}) {
  const isLiked = user ? article.likes.includes(user.id) : false;

  return (
    <article className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      {/* Image */}
      {article.imageUrl ? (
        <div className="w-full h-40 bg-[var(--color-surface-tertiary)]">
          <img
            src={article.imageUrl}
            alt={article.title}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-full h-40 bg-gradient-to-br from-[var(--color-primary-600)]/80 to-[var(--color-primary-400)]/80 flex items-center justify-center">
          <Newspaper className="h-10 w-10 text-white/25" />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide bg-[var(--color-primary-600)] text-white">
            {categoryLabels[article.category]}
          </span>
          <span className="text-[11px] text-[var(--color-text-muted)]">
            {formatDate(article.publishedAt)}
          </span>
        </div>

        <h3 className="text-[16px] font-bold text-[var(--color-text-primary)] leading-snug mb-1.5 line-clamp-2">
          {article.title}
        </h3>
        <p className="text-sm text-[var(--color-text-body)] leading-relaxed line-clamp-2 mb-3">
          {article.excerpt}
        </p>

        {article.poll && (
          <PollWidget poll={article.poll} userId={user?.id} onVote={onVote} />
        )}

        <div className="mt-auto flex items-center justify-between pt-3 border-t border-[var(--color-border)]">
          <p className="text-xs text-[var(--color-text-muted)]">
            Von {article.author}
          </p>
          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <button
                onClick={onEdit}
                className="flex items-center px-2 py-1 rounded-full text-xs bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-blue-50 hover:text-blue-600 transition-all"
                title="Bearbeiten"
              >
                <PenLine className="h-3 w-3" />
              </button>
            )}
            <button
              onClick={onLike}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                isLiked
                  ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                  : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-gray-200 hover:text-[var(--color-text-secondary)]"
              }`}
            >
              <ThumbsUp className={`h-3 w-3 ${isLiked ? "fill-blue-700" : ""}`} />
              {article.likes.length > 0 && <span>{article.likes.length}</span>}
            </button>
            {isAdmin && (
              <button
                onClick={onDelete}
                className="flex items-center px-2 py-1 rounded-full text-xs bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-red-50 hover:text-red-600 transition-all"
                title="Beitrag löschen"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

/* ══════════════════════════════════════════════
   Poll Widget (inline in articles)
   ══════════════════════════════════════════════ */
function PollWidget({
  poll,
  userId,
  onVote,
}: {
  poll: NonNullable<NewsArticle["poll"]>;
  userId: string | undefined;
  onVote: (optionId: string) => void;
}) {
  const totalVotes = poll.options.reduce((sum, opt) => sum + opt.votes.length, 0);
  const hasVoted = userId ? poll.options.some((opt) => opt.votes.includes(userId)) : false;

  return (
    <div className="mt-4 p-4 bg-[var(--color-surface-tertiary)] rounded-lg border border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-3">
        <BarChart3 className="h-4 w-4 text-[var(--color-primary-600)]" />
        <h4 className="text-sm font-bold text-[var(--color-text-primary)]">{poll.question}</h4>
      </div>
      <div className="space-y-2">
        {poll.options.map((opt) => {
          const isSelected = userId ? opt.votes.includes(userId) : false;
          const pct = totalVotes > 0 ? Math.round((opt.votes.length / totalVotes) * 100) : 0;
          return (
            <button
              key={opt.id}
              onClick={() => userId && onVote(opt.id)}
              className={`w-full text-left relative overflow-hidden rounded-lg border transition-all ${
                isSelected
                  ? "border-[var(--color-primary-400)] bg-white"
                  : "border-[var(--color-border)] bg-white hover:border-[var(--color-primary-300)]"
              }`}
            >
              {hasVoted && (
                <div
                  className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                    isSelected ? "bg-[var(--color-primary-100)]" : "bg-[var(--color-surface-tertiary)]"
                  }`}
                  style={{ width: `${pct}%` }}
                />
              )}
              <div className="relative flex items-center justify-between px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                    isSelected ? "border-[var(--color-primary-600)] bg-[var(--color-primary-600)]" : "border-[var(--color-border)]"
                  }`}>
                    {isSelected && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </div>
                  <span className={`text-sm ${isSelected ? "font-medium text-[var(--color-primary-700)]" : "text-[var(--color-text-primary)]"}`}>
                    {opt.text}
                  </span>
                </div>
                {hasVoted && (
                  <span className={`text-xs font-medium flex-shrink-0 ${isSelected ? "text-[var(--color-primary-600)]" : "text-[var(--color-text-muted)]"}`}>
                    {pct}%
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-[var(--color-text-muted)] mt-2">
        {totalVotes} {totalVotes === 1 ? "Stimme" : "Stimmen"}
        {poll.multipleChoice && " · Mehrfachauswahl"}
      </p>
    </div>
  );
}
