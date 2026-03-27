"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { sanitizeAndLimit } from "@/lib/sanitize";
import EmojiPicker from "@/components/EmojiPicker";
import GifPicker from "@/components/GifPicker";
import {
  MessageSquare,
  Send,
  Search,
  UserPlus,
  ArrowLeft,
  Check,
  CheckCheck,
} from "lucide-react";
import { User } from "@/types";

function formatTime(timestamp: string) {
  return new Date(timestamp).toLocaleTimeString("de-DE", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDay(timestamp: string) {
  const date = new Date(timestamp);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return "Heute";
  if (date.toDateString() === yesterday.toDateString()) return "Gestern";
  return date.toLocaleDateString("de-DE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const GIF_PREFIX = "[GIF]";
function isGifMessage(content: string): boolean {
  return content.startsWith(GIF_PREFIX);
}
function getGifInfo(content: string): { src: string; emoji: string } {
  const raw = content.slice(GIF_PREFIX.length);
  // Format: "/gifs/id.gif|emoji" or just "/gifs/id.gif"
  const parts = raw.split("|");
  return { src: parts[0], emoji: parts[1] || "🎬" };
}

export default function ChatPage() {
  const {
    user,
    allUsers,
    getConversations,
    getMessages,
    sendMessage,
    markMessagesRead,
  } = useAuth();

  const [selectedPartnerId, setSelectedPartnerId] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showNewChat, setShowNewChat] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const conversations = getConversations();
  const messages = selectedPartnerId ? getMessages(selectedPartnerId) : [];
  const selectedPartner = allUsers.find((u) => u.id === selectedPartnerId);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Mark messages as read when opening a conversation
  useEffect(() => {
    if (selectedPartnerId) {
      markMessagesRead(selectedPartnerId);
    }
  }, [selectedPartnerId, markMessagesRead]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPartnerId || !messageInput.trim()) return;
    const sanitized = sanitizeAndLimit(messageInput.trim(), 2000);
    if (!sanitized) return;
    sendMessage(selectedPartnerId, sanitized);
    setMessageInput("");
  };

  const handleSendGif = (gifId: string, gifSrc: string, gifEmoji: string) => {
    if (!selectedPartnerId) return;
    sendMessage(selectedPartnerId, `${GIF_PREFIX}${gifSrc}|${gifEmoji}`);
  };

  const handleStartNewChat = (partner: User) => {
    setSelectedPartnerId(partner.id);
    setShowNewChat(false);
    setSearchQuery("");
  };

  const filteredSearch = sanitizeAndLimit(searchQuery, 100).toLowerCase();
  const availableUsers = allUsers.filter(
    (u) =>
      u.id !== user?.id &&
      u.isActive &&
      (!filteredSearch ||
        u.firstName.toLowerCase().includes(filteredSearch) ||
        u.lastName.toLowerCase().includes(filteredSearch) ||
        u.department.toLowerCase().includes(filteredSearch))
  );

  // Group messages by day
  const messagesByDay: { day: string; messages: typeof messages }[] = [];
  let currentDay = "";
  for (const msg of messages) {
    const day = formatDay(msg.timestamp);
    if (day !== currentDay) {
      currentDay = day;
      messagesByDay.push({ day, messages: [] });
    }
    messagesByDay[messagesByDay.length - 1].messages.push(msg);
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <p className="text-[10px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.6px] mb-1 md:hidden">
          Kommunikation
        </p>
        <h1 className="text-2xl md:text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
          <MessageSquare className="h-7 w-7 text-[var(--color-primary-600)] hidden md:block" />
          Nachrichten
          {totalUnread > 0 && (
            <span className="bg-[var(--color-primary-600)] text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {totalUnread}
            </span>
          )}
        </h1>
        <p className="text-[var(--color-text-secondary)] mt-1 hidden md:block">
          Kommuniziere direkt mit deinen Kolleg:innen
        </p>
      </div>

      <div className="bg-white rounded-xl border border-[var(--color-border)] flex h-[calc(100vh-12rem)] md:h-[600px] overflow-hidden">
        {/* Sidebar - Conversations */}
        <div className={`w-80 border-r border-[var(--color-border)] flex flex-col flex-shrink-0 ${selectedPartnerId ? "hidden md:flex" : "flex"} ${!selectedPartnerId ? "flex-1 md:flex-initial" : ""}`}>
          {/* Conversation header */}
          <div className="p-4 border-b border-[var(--color-border)]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">Chats</h2>
              <button
                onClick={() => setShowNewChat(!showNewChat)}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-primary-600)] transition-colors"
                title="Neuen Chat starten"
              >
                <UserPlus className="h-4 w-4" />
              </button>
            </div>
            {showNewChat && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Kolleg:in suchen..."
                  maxLength={100}
                  autoFocus
                  className="w-full pl-9 pr-3 py-2 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>
            )}
          </div>

          {/* New chat search results */}
          {showNewChat ? (
            <div className="flex-1 overflow-y-auto">
              {availableUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-[var(--color-text-muted)]">
                  Keine Nutzer gefunden.
                </div>
              ) : (
                availableUsers.map((u) => (
                  <button
                    key={u.id}
                    onClick={() => handleStartNewChat(u)}
                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-[var(--color-surface-tertiary)] transition-colors text-left"
                  >
                    <div className="h-9 w-9 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-xs font-bold text-[var(--color-primary-700)] flex-shrink-0">
                      {u.firstName[0]}{u.lastName[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                        {u.firstName} {u.lastName}
                      </p>
                      <p className="text-xs text-[var(--color-text-muted)] truncate">
                        {u.department} &middot; {u.position}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto">
              {conversations.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="h-10 w-10 text-[var(--color-text-muted)] mx-auto mb-3 opacity-50" />
                  <p className="text-sm text-[var(--color-text-muted)]">
                    Noch keine Chats.
                  </p>
                  <button
                    onClick={() => setShowNewChat(true)}
                    className="text-sm text-[var(--color-primary-600)] hover:underline mt-2"
                  >
                    Neuen Chat starten
                  </button>
                </div>
              ) : (
                conversations.map((conv) => (
                  <button
                    key={conv.partnerId}
                    onClick={() => setSelectedPartnerId(conv.partnerId)}
                    className={`w-full px-4 py-3 flex items-center gap-3 transition-colors text-left ${
                      selectedPartnerId === conv.partnerId
                        ? "bg-[var(--color-primary-50)]"
                        : "hover:bg-[var(--color-surface-tertiary)]"
                    }`}
                  >
                    <div className="relative flex-shrink-0">
                      <div className="h-10 w-10 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-xs font-bold text-[var(--color-primary-700)]">
                        {conv.partner.firstName[0]}{conv.partner.lastName[0]}
                      </div>
                      {conv.unreadCount > 0 && (
                        <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-[var(--color-primary-600)] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={`text-sm truncate ${conv.unreadCount > 0 ? "font-bold text-[var(--color-text-primary)]" : "font-medium text-[var(--color-text-primary)]"}`}>
                          {conv.partner.firstName} {conv.partner.lastName}
                        </p>
                        <span className="text-[10px] text-[var(--color-text-muted)] flex-shrink-0 ml-2">
                          {formatTime(conv.lastMessage.timestamp)}
                        </span>
                      </div>
                      <p className={`text-xs truncate mt-0.5 ${conv.unreadCount > 0 ? "text-[var(--color-text-primary)] font-medium" : "text-[var(--color-text-muted)]"}`}>
                        {conv.lastMessage.senderId === user?.id ? "Du: " : ""}
                        {isGifMessage(conv.lastMessage.content) ? "🎬 GIF" : conv.lastMessage.content}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className={`flex-1 flex flex-col ${!selectedPartnerId ? "hidden md:flex" : "flex"}`}>
          {selectedPartnerId && selectedPartner ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3 border-b border-[var(--color-border)] flex items-center gap-3">
                <button
                  onClick={() => setSelectedPartnerId(null)}
                  className="md:hidden h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
                >
                  <ArrowLeft className="h-4 w-4 text-[var(--color-text-secondary)]" />
                </button>
                <div className="h-9 w-9 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center text-xs font-bold text-[var(--color-primary-700)]">
                  {selectedPartner.firstName[0]}{selectedPartner.lastName[0]}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text-primary)]">
                    {selectedPartner.firstName} {selectedPartner.lastName}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {selectedPartner.department} &middot; {selectedPartner.position}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {messagesByDay.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="h-14 w-14 rounded-full bg-[var(--color-primary-50)] flex items-center justify-center mb-3">
                      <MessageSquare className="h-7 w-7 text-[var(--color-primary-400)]" />
                    </div>
                    <p className="text-sm text-[var(--color-text-muted)]">
                      Starte eine Unterhaltung mit {selectedPartner.firstName}.
                    </p>
                  </div>
                ) : (
                  messagesByDay.map((group, gi) => (
                    <div key={gi}>
                      {/* Day separator */}
                      <div className="flex items-center gap-3 my-4">
                        <div className="flex-1 h-px bg-[var(--color-border)]" />
                        <span className="text-[10px] font-medium text-[var(--color-text-muted)] uppercase tracking-wide">
                          {group.day}
                        </span>
                        <div className="flex-1 h-px bg-[var(--color-border)]" />
                      </div>

                      {group.messages.map((msg) => {
                        const isMine = msg.senderId === user?.id;
                        return (
                          <div
                            key={msg.id}
                            className={`flex mb-2 ${isMine ? "justify-end" : "justify-start"}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-2xl ${
                                isGifMessage(msg.content)
                                  ? "p-1"
                                  : "px-3.5 py-2"
                              } ${
                                isMine
                                  ? "bg-[var(--color-primary-600)] text-white rounded-br-md"
                                  : "bg-[var(--color-surface-tertiary)] text-[var(--color-text-primary)] rounded-bl-md"
                              }`}
                            >
                              {isGifMessage(msg.content) ? (
                                (() => {
                                  const info = getGifInfo(msg.content);
                                  return (
                                    <div className="w-48 h-32 rounded-xl overflow-hidden bg-[var(--color-surface-dim)] flex items-center justify-center">
                                      <img
                                        src={info.src}
                                        alt="GIF"
                                        className="w-full h-full object-cover"
                                        loading="lazy"
                                        onError={(e) => {
                                          // Fallback to emoji if GIF file not found
                                          const target = e.currentTarget;
                                          target.style.display = "none";
                                          const parent = target.parentElement;
                                          if (parent) {
                                            parent.innerHTML = `<span class="text-5xl">${info.emoji}</span>`;
                                          }
                                        }}
                                      />
                                    </div>
                                  );
                                })()
                              ) : (
                                <p className="text-sm leading-relaxed break-words">{msg.content}</p>
                              )}
                              <div className={`flex items-center justify-end gap-1 mt-0.5 ${isMine ? "text-primary-200" : "text-[var(--color-text-muted)]"}`}>
                                <span className="text-[10px]">
                                  {formatTime(msg.timestamp)}
                                </span>
                                {isMine && (
                                  msg.read ? (
                                    <CheckCheck className="h-3 w-3" />
                                  ) : (
                                    <Check className="h-3 w-3" />
                                  )
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Message input */}
              <form
                onSubmit={handleSend}
                className="px-4 py-3 border-t border-[var(--color-border)] flex items-center gap-2"
              >
                <EmojiPicker onSelect={(emoji) => setMessageInput((prev) => prev + emoji)} />
                <GifPicker onSelect={handleSendGif} />
                <input
                  type="text"
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  placeholder="Nachricht schreiben..."
                  maxLength={2000}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
                <button
                  type="submit"
                  disabled={!messageInput.trim()}
                  className="h-10 w-10 rounded-full bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white flex items-center justify-center transition-colors disabled:opacity-40 disabled:hover:bg-[var(--color-primary-600)]"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center px-8">
              <div className="h-16 w-16 rounded-full bg-[var(--color-surface-tertiary)] flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-[var(--color-text-muted)]" />
              </div>
              <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                Willkommen im Chat
              </h3>
              <p className="text-sm text-[var(--color-text-muted)] max-w-sm">
                Wähle eine Unterhaltung aus der Liste oder starte einen neuen Chat mit einem Kollegen.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
