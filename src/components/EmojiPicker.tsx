"use client";

import { useState, useRef, useEffect } from "react";
import { Smile } from "lucide-react";

const EMOJI_CATEGORIES = [
  {
    name: "Häufig",
    emojis: ["😊", "👍", "❤️", "😂", "🎉", "👏", "🙏", "💪", "✅", "🔥", "⭐", "💯", "🤝", "👋", "😍", "🥳"],
  },
  {
    name: "Smileys",
    emojis: ["😀", "😃", "😄", "😁", "😆", "😅", "🤣", "😊", "😇", "🙂", "😉", "😌", "😍", "🥰", "😘", "😗", "😜", "🤔", "🤗", "😎", "🥺", "😢", "😤", "😱", "🤯", "😴", "🤮", "🤧"],
  },
  {
    name: "Gesten",
    emojis: ["👍", "👎", "👏", "🙌", "🤝", "👋", "✌️", "🤞", "🤙", "💪", "🙏", "✍️", "👈", "👉", "👆", "👇"],
  },
  {
    name: "Symbole",
    emojis: ["❤️", "🧡", "💛", "💚", "💙", "💜", "💔", "✅", "❌", "⚠️", "🔥", "⭐", "💯", "🎉", "🎊", "🏆", "📌", "📎", "✏️", "📅", "🕐", "📊"],
  },
  {
    name: "Büro",
    emojis: ["💼", "📧", "📞", "💻", "🖥️", "📱", "🏢", "📋", "📝", "📁", "🗂️", "📈", "📉", "🔒", "🔑", "⏰", "☕", "🍕"],
  },
];

export default function EmojiPicker({ onSelect }: { onSelect: (emoji: string) => void }) {
  const [open, setOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState(0);
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

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-[var(--color-surface-tertiary)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
        title="Emoji einfügen"
      >
        <Smile className="h-5 w-5" />
      </button>

      {open && (
        <div className="absolute bottom-12 left-0 w-72 bg-white rounded-xl border border-[var(--color-border)] shadow-xl z-50 overflow-hidden">
          {/* Category tabs */}
          <div className="flex border-b border-[var(--color-border)] px-1 overflow-x-auto">
            {EMOJI_CATEGORIES.map((cat, i) => (
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

          {/* Emoji grid */}
          <div className="p-2 max-h-48 overflow-y-auto">
            <div className="grid grid-cols-8 gap-0.5">
              {EMOJI_CATEGORIES[activeCategory].emojis.map((emoji) => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => {
                    onSelect(emoji);
                    setOpen(false);
                  }}
                  className="h-8 w-8 flex items-center justify-center rounded hover:bg-[var(--color-surface-tertiary)] text-lg transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
