"use client";

import { useAuth } from "@/lib/auth-context";
import {
  Palmtree,
  CalendarCheck,
  CalendarClock,
  CalendarDays,
  Newspaper,
  Users,
  PartyPopper,
  Briefcase,
  ChevronRight,
  ThumbsUp,
  Thermometer,
} from "lucide-react";
import Link from "next/link";

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

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function DashboardPage() {
  const { user, news, toggleNewsLike, getVacationBalance, getSickDaysCount } = useAuth();
  const balance = user ? getVacationBalance(user.id) : { total: 0, used: 0, planned: 0, remaining: 0 };
  const currentYear = new Date().getFullYear();
  const sickDays = user ? getSickDaysCount(user.id, currentYear) : null;

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Guten Morgen";
    if (hour < 18) return "Guten Tag";
    return "Guten Abend";
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6 md:mb-8">
        <p className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.6px] mb-1 md:hidden">
          Dashboard
        </p>
        <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
          {greeting()}, {user?.firstName}!
        </h1>
        <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-1">
          Hier ist dein Überblick für heute.
        </p>
      </div>

      {/* Vacation & sick day stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <CalendarDays className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Gesamturlaub
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {balance.total} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
              <CalendarCheck className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Genommen
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {balance.used} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <CalendarClock className="h-5 w-5 text-amber-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Geplant
            </span>
          </div>
          <p className="text-2xl font-bold text-[var(--color-text-primary)]">
            {balance.planned} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
              <Palmtree className="h-5 w-5 text-emerald-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Resturlaub
            </span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">
            {balance.remaining} Tage
          </p>
        </div>

        <div className="bg-white rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-lg bg-pink-100 flex items-center justify-center">
              <Thermometer className="h-5 w-5 text-pink-600" />
            </div>
            <span className="text-sm font-medium text-[var(--color-text-secondary)]">
              Kranktage {currentYear}
            </span>
          </div>
          <p className="text-2xl font-bold text-pink-600">
            {sickDays !== null ? `${sickDays} Tage` : "—"}
          </p>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-8">
        <Link
          href="/vacation"
          className="bg-gradient-to-r from-[var(--color-primary-600)] to-[var(--color-primary-700)] rounded-xl p-5 text-white hover:from-[var(--color-primary-700)] hover:to-[var(--color-primary-800)] transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-200">
                Schnellaktion
              </p>
              <p className="text-lg font-bold mt-1">Urlaub beantragen</p>
            </div>
            <ChevronRight className="h-5 w-5 text-primary-200 group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link
          href="/profile"
          className="bg-white rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary-300)] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Mein Profil
              </p>
              <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                Daten bearbeiten
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
        <Link
          href="/chat"
          className="bg-white rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary-300)] transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--color-text-secondary)]">
                Nachrichten
              </p>
              <p className="text-lg font-bold text-[var(--color-text-primary)] mt-1">
                Chat öffnen
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-[var(--color-text-muted)] group-hover:translate-x-1 transition-transform" />
          </div>
        </Link>
      </div>

      {/* News section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
            Unternehmensnews
          </h2>
          <Link
            href="/news"
            className="text-sm text-[var(--color-primary-600)] hover:text-[var(--color-primary-700)] font-medium flex items-center gap-1"
          >
            Alle News
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="space-y-4">
          {news.slice(0, 3).map((article) => {
            const Icon = categoryIcons[article.category] || Newspaper;
            const isLiked = user ? article.likes.includes(user.id) : false;
            return (
              <article
                key={article.id}
                className="bg-white rounded-xl border border-[var(--color-border)] p-5 hover:border-[var(--color-primary-200)] transition-colors"
              >
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
                    <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">
                      {article.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-[var(--color-text-muted)]">
                        Von {article.author}
                      </p>
                      <button
                        onClick={() => toggleNewsLike(article.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                          isLiked
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:bg-gray-200 hover:text-[var(--color-text-secondary)]"
                        }`}
                      >
                        <ThumbsUp className={`h-3.5 w-3.5 ${isLiked ? "fill-blue-700" : ""}`} />
                        {article.likes.length > 0 && (
                          <span>{article.likes.length}</span>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </div>
  );
}
