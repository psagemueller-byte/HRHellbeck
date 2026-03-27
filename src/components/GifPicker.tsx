"use client";

import { useState, useRef, useEffect } from "react";
import { Film, Search, X } from "lucide-react";

// Curated GIF collection - replace paths with actual GIF files in /public/gifs/
// For now using placeholder emoji representations. Replace `emoji` with `src: "/gifs/filename.gif"` once files are added.
const GIF_CATEGORIES = [
  {
    name: "Reaktionen",
    gifs: [
      { id: "thumbs-up", label: "Daumen hoch", emoji: "👍", src: "/gifs/thumbs-up.gif" },
      { id: "clap", label: "Applaus", emoji: "👏", src: "/gifs/clap.gif" },
      { id: "facepalm", label: "Facepalm", emoji: "🤦", src: "/gifs/facepalm.gif" },
      { id: "mind-blown", label: "Mind Blown", emoji: "🤯", src: "/gifs/mind-blown.gif" },
      { id: "eye-roll", label: "Augenrollen", emoji: "🙄", src: "/gifs/eye-roll.gif" },
      { id: "shocked", label: "Schock", emoji: "😱", src: "/gifs/shocked.gif" },
      { id: "cool", label: "Cool", emoji: "😎", src: "/gifs/cool.gif" },
      { id: "wink", label: "Zwinkern", emoji: "😉", src: "/gifs/wink.gif" },
    ],
  },
  {
    name: "Feiern",
    gifs: [
      { id: "party", label: "Party", emoji: "🥳", src: "/gifs/party.gif" },
      { id: "confetti", label: "Konfetti", emoji: "🎉", src: "/gifs/confetti.gif" },
      { id: "high-five", label: "High Five", emoji: "🙌", src: "/gifs/high-five.gif" },
      { id: "dance", label: "Tanzen", emoji: "💃", src: "/gifs/dance.gif" },
      { id: "fireworks", label: "Feuerwerk", emoji: "🎆", src: "/gifs/fireworks.gif" },
      { id: "trophy", label: "Pokal", emoji: "🏆", src: "/gifs/trophy.gif" },
      { id: "champagne", label: "Champagner", emoji: "🍾", src: "/gifs/champagne.gif" },
      { id: "rocket", label: "Rakete", emoji: "🚀", src: "/gifs/rocket.gif" },
    ],
  },
  {
    name: "Zustimmung",
    gifs: [
      { id: "nod", label: "Nicken", emoji: "😊", src: "/gifs/nod.gif" },
      { id: "yes", label: "Ja!", emoji: "✅", src: "/gifs/yes.gif" },
      { id: "perfect", label: "Perfekt", emoji: "👌", src: "/gifs/perfect.gif" },
      { id: "ok", label: "OK", emoji: "🆗", src: "/gifs/ok.gif" },
      { id: "salute", label: "Salut", emoji: "🫡", src: "/gifs/salute.gif" },
      { id: "100", label: "100%", emoji: "💯", src: "/gifs/100.gif" },
      { id: "strong", label: "Stark", emoji: "💪", src: "/gifs/strong.gif" },
      { id: "fire", label: "Feuer", emoji: "🔥", src: "/gifs/fire.gif" },
    ],
  },
  {
    name: "Emotionen",
    gifs: [
      { id: "laugh", label: "Lachen", emoji: "😂", src: "/gifs/laugh.gif" },
      { id: "cry-laugh", label: "Tränenlachen", emoji: "🤣", src: "/gifs/cry-laugh.gif" },
      { id: "love", label: "Liebe", emoji: "❤️", src: "/gifs/love.gif" },
      { id: "sad", label: "Traurig", emoji: "😢", src: "/gifs/sad.gif" },
      { id: "thinking", label: "Denken", emoji: "🤔", src: "/gifs/thinking.gif" },
      { id: "shrug", label: "Achselzucken", emoji: "🤷", src: "/gifs/shrug.gif" },
      { id: "hug", label: "Umarmung", emoji: "🤗", src: "/gifs/hug.gif" },
      { id: "pray", label: "Bitte", emoji: "🙏", src: "/gifs/pray.gif" },
    ],
  },
  {
    name: "Arbeit",
    gifs: [
      { id: "coffee", label: "Kaffee", emoji: "☕", src: "/gifs/coffee.gif" },
      { id: "typing", label: "Tippen", emoji: "⌨️", src: "/gifs/typing.gif" },
      { id: "mic-drop", label: "Mic Drop", emoji: "🎤", src: "/gifs/mic-drop.gif" },
      { id: "done", label: "Fertig!", emoji: "✅", src: "/gifs/done.gif" },
      { id: "deadline", label: "Deadline", emoji: "⏰", src: "/gifs/deadline.gif" },
      { id: "meeting", label: "Meeting", emoji: "📅", src: "/gifs/meeting.gif" },
      { id: "idea", label: "Idee!", emoji: "💡", src: "/gifs/idea.gif" },
      { id: "pizza", label: "Pizza", emoji: "🍕", src: "/gifs/pizza.gif" },
    ],
  },
];

// Check if actual GIF file exists by trying to load it
function useGifExists(src: string): boolean {
  const [exists, setExists] = useState(false);
  useEffect(() => {
    const img = new Image();
    img.onload = () => setExists(true);
    img.onerror = () => setExists(false);
    img.src = src;
  }, [src]);
  return exists;
}

function GifThumbnail({ gif, onSelect }: { gif: typeof GIF_CATEGORIES[0]["gifs"][0]; onSelect: () => void }) {
  const exists = useGifExists(gif.src);

  return (
    <button
      type="button"
      onClick={onSelect}
      className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-[var(--color-surface-tertiary)] transition-colors group"
      title={gif.label}
    >
      {exists ? (
        <img
          src={gif.src}
          alt={gif.label}
          className="w-full h-16 object-cover rounded-md"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-16 bg-[var(--color-surface-tertiary)] rounded-md flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
          {gif.emoji}
        </div>
      )}
      <span className="text-[10px] text-[var(--color-text-muted)] truncate w-full text-center">
        {gif.label}
      </span>
    </button>
  );
}

export default function GifPicker({ onSelect }: { onSelect: (gifId: string, gifSrc: string, gifEmoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const filteredGifs = search.trim()
    ? GIF_CATEGORIES.flatMap((cat) => cat.gifs).filter((g) =>
        g.label.toLowerCase().includes(search.toLowerCase()) ||
        g.id.toLowerCase().includes(search.toLowerCase())
      )
    : GIF_CATEGORIES[activeCategory].gifs;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="p-2 rounded-full hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        title="GIF einfügen"
      >
        <Film className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 w-80 bg-white rounded-xl border border-[var(--color-border)] shadow-xl z-50 overflow-hidden">
          {/* Search */}
          <div className="p-2 border-b border-[var(--color-border)]">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--color-text-muted)]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="GIF suchen..."
                className="w-full pl-8 pr-8 py-1.5 text-xs border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-1 focus:ring-[var(--color-primary-500)]"
                autoFocus
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                >
                  <X className="h-3.5 w-3.5 text-[var(--color-text-muted)]" />
                </button>
              )}
            </div>
          </div>

          {/* Category tabs (hidden during search) */}
          {!search && (
            <div className="flex border-b border-[var(--color-border)] px-1 overflow-x-auto">
              {GIF_CATEGORIES.map((cat, i) => (
                <button
                  key={cat.name}
                  type="button"
                  onClick={() => setActiveCategory(i)}
                  className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                    activeCategory === i
                      ? "text-[var(--color-primary-600)] border-b-2 border-[var(--color-primary-600)]"
                      : "text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* GIF grid */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {filteredGifs.length === 0 ? (
              <div className="py-6 text-center text-xs text-[var(--color-text-muted)]">
                Keine GIFs gefunden
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-1">
                {filteredGifs.map((gif) => (
                  <GifThumbnail
                    key={gif.id}
                    gif={gif}
                    onSelect={() => {
                      onSelect(gif.id, gif.src, gif.emoji);
                      setOpen(false);
                      setSearch("");
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
