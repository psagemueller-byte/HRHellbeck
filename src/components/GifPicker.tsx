"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Film, Search, X, Loader2 } from "lucide-react";

// Giphy API - free tier (get your key at developers.giphy.com)
const GIPHY_API_KEY = process.env.NEXT_PUBLIC_GIPHY_API_KEY || "";
const GIPHY_SEARCH_URL = "https://api.giphy.com/v1/gifs/search";
const GIPHY_TRENDING_URL = "https://api.giphy.com/v1/gifs/trending";

interface GiphyGif {
  id: string;
  title: string;
  images: {
    fixed_height_small: { url: string; width: string; height: string };
    fixed_height: { url: string };
    original: { url: string };
  };
}

// Quick-search tags for common workplace reactions
const QUICK_TAGS = [
  { label: "👍 Daumen hoch", query: "thumbs up" },
  { label: "🎉 Feiern", query: "celebration" },
  { label: "😂 Lustig", query: "funny" },
  { label: "👏 Applaus", query: "applause" },
  { label: "☕ Kaffee", query: "coffee" },
  { label: "🤔 Denken", query: "thinking" },
  { label: "💪 Stark", query: "strong" },
  { label: "🙌 Yay", query: "excited" },
];

export default function GifPicker({ onSelect }: { onSelect: (gifId: string, gifUrl: string, emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const fetchGifs = useCallback(async (query: string) => {
    if (!GIPHY_API_KEY) return;
    setLoading(true);
    try {
      const url = query
        ? `${GIPHY_SEARCH_URL}?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=24&rating=g&lang=de`
        : `${GIPHY_TRENDING_URL}?api_key=${GIPHY_API_KEY}&limit=24&rating=g`;
      const res = await fetch(url);
      const data = await res.json();
      setGifs(data.data || []);
      setSearched(true);
    } catch {
      setGifs([]);
    }
    setLoading(false);
  }, []);

  // Load trending on open
  useEffect(() => {
    if (open && gifs.length === 0 && GIPHY_API_KEY) {
      fetchGifs("");
    }
  }, [open, gifs.length, fetchGifs]);

  // Debounced search
  useEffect(() => {
    if (!open) return;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!search.trim()) {
      debounceRef.current = setTimeout(() => fetchGifs(""), 300);
      return;
    }
    debounceRef.current = setTimeout(() => fetchGifs(search.trim()), 400);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search, open, fetchGifs]);

  const handleOpen = () => {
    setOpen(!open);
    setSearch("");
    if (!open) {
      setGifs([]);
      setSearched(false);
    }
  };

  // Fallback if no API key
  if (!GIPHY_API_KEY) {
    return null; // Don't show GIF picker without API key
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="p-2 rounded-full hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        title="GIF einfügen"
      >
        <Film className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 w-80 sm:w-96 bg-white rounded-xl border border-[var(--color-border)] shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="GIF suchen auf Giphy..."
                className="w-full pl-8 pr-8 py-2 text-sm border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                autoFocus
              />
              {search && (
                <button type="button" onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2">
                  <X className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                </button>
              )}
            </div>
          </div>

          {/* Quick tags */}
          {!search && (
            <div className="px-2 pt-2 flex flex-wrap gap-1">
              {QUICK_TAGS.map((tag) => (
                <button
                  key={tag.query}
                  type="button"
                  onClick={() => setSearch(tag.query)}
                  className="px-2 py-1 text-[11px] font-medium bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] rounded-full hover:bg-[var(--color-primary-100)] hover:text-[var(--color-primary-600)] transition-colors"
                >
                  {tag.label}
                </button>
              ))}
            </div>
          )}

          {/* GIF grid */}
          <div className="p-2 max-h-72 overflow-y-auto">
            {loading ? (
              <div className="py-10 flex flex-col items-center gap-2 text-[var(--color-text-muted)]">
                <Loader2 className="h-6 w-6 animate-spin" />
                <span className="text-xs">Lade GIFs...</span>
              </div>
            ) : gifs.length === 0 && searched ? (
              <div className="py-10 text-center text-xs text-[var(--color-text-muted)]">
                Keine GIFs gefunden. Versuche einen anderen Suchbegriff.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {gifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => {
                      onSelect(gif.id, gif.images.fixed_height.url, "🎬");
                      setOpen(false);
                    }}
                    className="rounded-lg overflow-hidden hover:ring-2 hover:ring-[var(--color-primary-400)] transition-all"
                    title={gif.title}
                  >
                    <img
                      src={gif.images.fixed_height_small.url}
                      alt={gif.title}
                      className="w-full h-24 object-cover"
                      loading="lazy"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Giphy attribution (required by Giphy TOS) */}
          <div className="px-3 py-1.5 border-t border-[var(--color-border)] bg-[var(--color-surface-tertiary)]">
            <img
              src="https://giphy.com/static/img/poweredby_giphy.png"
              alt="Powered by GIPHY"
              className="h-3 opacity-60"
            />
          </div>
        </div>
      )}
    </div>
  );
}
