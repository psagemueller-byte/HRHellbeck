"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Sun,
  Moon,
  Sunset,
  Coffee,
  Palmtree,
  Star,
  Trash2,
} from "lucide-react";
import { ShiftType, SHIFT_TYPES } from "@/types";

const GERMAN_HOLIDAYS_2026: Record<string, string> = {
  "2026-01-01": "Neujahr",
  "2026-04-03": "Karfreitag",
  "2026-04-06": "Ostermontag",
  "2026-05-01": "Tag der Arbeit",
  "2026-05-14": "Christi Himmelfahrt",
  "2026-05-25": "Pfingstmontag",
  "2026-10-03": "Tag der Dt. Einheit",
  "2026-12-25": "1. Weihnachtstag",
  "2026-12-26": "2. Weihnachtstag",
};

const shiftLabels: Record<ShiftType, { label: string; short: string; color: string; bg: string; icon: typeof Sun }> = {
  frueh: { label: "Frühschicht", short: "F", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", icon: Sun },
  spaet: { label: "Spätschicht", short: "S", color: "text-orange-700", bg: "bg-orange-100 border-orange-300", icon: Sunset },
  nacht: { label: "Nachtschicht", short: "N", color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-300", icon: Moon },
  frei: { label: "Frei", short: "-", color: "text-gray-500", bg: "bg-gray-100 border-gray-300", icon: Coffee },
  feiertag: { label: "Feiertag", short: "FT", color: "text-red-600", bg: "bg-red-100 border-red-300", icon: Star },
  urlaub: { label: "Urlaub", short: "U", color: "text-green-700", bg: "bg-green-100 border-green-300", icon: Palmtree },
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Monday = 0
}

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function KalenderPage() {
  const { user, allUsers, shiftEntries, vacationRequests, addShift, deleteShift, getShiftsForUser, hasRole } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || "");
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [newShiftType, setNewShiftType] = useState<ShiftType>("frueh");
  const [newShiftStart, setNewShiftStart] = useState("06:00");
  const [newShiftEnd, setNewShiftEnd] = useState("14:00");
  const [newShiftNote, setNewShiftNote] = useState("");

  const viewUserId = selectedUserId || user?.id || "";
  const viewUser = allUsers.find((u) => u.id === viewUserId);

  // Check if current user can manage shifts for the selected user
  const canManageShifts = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin") return true;
    // Manager can manage their team
    const targetUser = allUsers.find((u) => u.id === viewUserId);
    if (targetUser?.managerId === user.id) return true;
    return false;
  }, [user, viewUserId, allUsers]);

  // Get team members the current user can manage
  const manageableUsers = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return allUsers.filter((u) => u.isActive);
    // Managers see themselves + their direct reports
    return allUsers.filter(
      (u) => u.isActive && (u.id === user.id || u.managerId === user.id)
    );
  }, [user, allUsers]);

  const shifts = getShiftsForUser(viewUserId, currentMonth, currentYear);

  // Get approved vacations for the viewed user in this month
  const userVacations = useMemo(() => {
    return vacationRequests.filter((v) => {
      if (v.userId !== viewUserId || v.status !== "genehmigt") return false;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      return start <= monthEnd && end >= monthStart;
    });
  }, [vacationRequests, viewUserId, currentMonth, currentYear]);

  // Build a map: date -> entries
  const dateMap = useMemo(() => {
    const map: Record<string, { shift?: typeof shifts[0]; vacation?: boolean; holiday?: string }> = {};
    shifts.forEach((s) => {
      map[s.date] = { ...map[s.date], shift: s };
    });
    userVacations.forEach((v) => {
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
        map[key] = { ...map[key], vacation: true };
      }
    });
    Object.entries(GERMAN_HOLIDAYS_2026).forEach(([date, name]) => {
      map[date] = { ...map[date], holiday: name };
    });
    return map;
  }, [shifts, userVacations]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  const handleDayClick = (day: number) => {
    if (!canManageShifts) return;
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    setSelectedDate(dateStr);
    setNewShiftType("frueh");
    setNewShiftStart("06:00");
    setNewShiftEnd("14:00");
    setNewShiftNote("");
    setShowAddShift(true);
  };

  const handleAddShift = () => {
    if (!user || !selectedDate) return;
    if (!SHIFT_TYPES.includes(newShiftType)) return;
    addShift({
      userId: viewUserId,
      date: selectedDate,
      type: newShiftType,
      startTime: newShiftType === "frei" ? undefined : newShiftStart,
      endTime: newShiftType === "frei" ? undefined : newShiftEnd,
      note: newShiftNote || undefined,
      createdBy: user.id,
    });
    setShowAddShift(false);
  };

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Calendar className="h-7 w-7 text-[var(--color-primary-600)]" />
            Schichtkalender
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Schichtplan, Urlaub und Feiertage im Überblick
          </p>
        </div>
        {manageableUsers.length > 1 && (
          <select
            value={viewUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          >
            {manageableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.firstName} {u.lastName} — {u.department}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(shiftLabels) as [ShiftType, typeof shiftLabels.frueh][]).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div className={`w-6 h-6 rounded flex items-center justify-center border ${config.bg}`}>
                  <Icon className={`h-3.5 w-3.5 ${config.color}`} />
                </div>
                <span className="text-[var(--color-text-secondary)]">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <button onClick={prevMonth} className="p-2 hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors">
            <ChevronLeft className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] capitalize">
            {monthName}
            {viewUser && viewUser.id !== user?.id && (
              <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">
                — {viewUser.firstName} {viewUser.lastName}
              </span>
            )}
          </h2>
          <button onClick={nextMonth} className="p-2 hover:bg-[var(--color-surface-tertiary)] rounded-lg transition-colors">
            <ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {WEEKDAYS.map((day, i) => (
            <div
              key={day}
              className={`py-3 text-center text-xs font-semibold ${
                i >= 5 ? "text-red-400" : "text-[var(--color-text-muted)]"
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar grid */}
        <div className="grid grid-cols-7">
          {/* Empty cells before first day */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="min-h-[100px] border-b border-r border-[var(--color-border)] bg-[var(--color-surface-secondary)]" />
          ))}

          {/* Days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateStr(currentYear, currentMonth, day);
            const entry = dateMap[dateStr];
            const isToday = dateStr === todayStr;
            const dayOfWeek = (firstDay + i) % 7;
            const isWeekend = dayOfWeek >= 5;

            return (
              <div
                key={day}
                onClick={() => handleDayClick(day)}
                className={`min-h-[100px] border-b border-r border-[var(--color-border)] p-2 transition-colors ${
                  canManageShifts ? "cursor-pointer hover:bg-[var(--color-primary-50)]" : ""
                } ${isWeekend ? "bg-gray-50" : "bg-white"} ${isToday ? "ring-2 ring-inset ring-[var(--color-primary-400)]" : ""}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-sm font-medium ${
                      isToday
                        ? "bg-[var(--color-primary-600)] text-white w-7 h-7 rounded-full flex items-center justify-center"
                        : isWeekend
                        ? "text-red-400"
                        : "text-[var(--color-text-primary)]"
                    }`}
                  >
                    {day}
                  </span>
                  {entry?.shift && canManageShifts && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteShift(entry.shift!.id);
                      }}
                      className="p-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                      title="Schicht löschen"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  )}
                </div>

                {/* Holiday */}
                {entry?.holiday && (
                  <div className="text-[10px] font-medium text-red-500 bg-red-50 rounded px-1 py-0.5 mb-1 truncate">
                    {entry.holiday}
                  </div>
                )}

                {/* Vacation */}
                {entry?.vacation && (
                  <div className="text-[10px] font-medium text-green-600 bg-green-50 rounded px-1 py-0.5 mb-1 flex items-center gap-1">
                    <Palmtree className="h-3 w-3" />
                    Urlaub
                  </div>
                )}

                {/* Shift */}
                {entry?.shift && (
                  <div className={`text-[10px] font-medium rounded px-1 py-0.5 border flex items-center gap-1 ${shiftLabels[entry.shift.type].bg} ${shiftLabels[entry.shift.type].color}`}>
                    {(() => {
                      const Icon = shiftLabels[entry.shift.type].icon;
                      return <Icon className="h-3 w-3" />;
                    })()}
                    {shiftLabels[entry.shift.type].short}
                    {entry.shift.startTime && (
                      <span className="ml-auto">{entry.shift.startTime}</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Shift summary for this month */}
      <div className="mt-6 bg-white rounded-xl border border-[var(--color-border)] p-6">
        <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-4">
          Monatsübersicht
        </h3>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
          {(Object.entries(shiftLabels) as [ShiftType, typeof shiftLabels.frueh][]).map(([type, config]) => {
            const count = shifts.filter((s) => s.type === type).length;
            const Icon = config.icon;
            return (
              <div key={type} className={`rounded-lg border p-3 text-center ${config.bg}`}>
                <Icon className={`h-5 w-5 mx-auto mb-1 ${config.color}`} />
                <p className={`text-lg font-bold ${config.color}`}>{count}</p>
                <p className="text-[10px] text-[var(--color-text-muted)]">{config.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Shift Modal */}
      {showAddShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center">
                  <Plus className="h-5 w-5 text-[var(--color-primary-600)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">Schicht eintragen</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">{selectedDate} — {viewUser?.firstName} {viewUser?.lastName}</p>
                </div>
              </div>
              <button
                onClick={() => setShowAddShift(false)}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Schichttyp</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.entries(shiftLabels) as [ShiftType, typeof shiftLabels.frueh][]).map(([type, config]) => {
                    const Icon = config.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => {
                          if (!SHIFT_TYPES.includes(type)) return;
                          setNewShiftType(type);
                          if (type === "frueh") { setNewShiftStart("06:00"); setNewShiftEnd("14:00"); }
                          else if (type === "spaet") { setNewShiftStart("14:00"); setNewShiftEnd("22:00"); }
                          else if (type === "nacht") { setNewShiftStart("22:00"); setNewShiftEnd("06:00"); }
                        }}
                        className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-colors ${
                          newShiftType === type
                            ? `${config.bg} border-current ${config.color}`
                            : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                        }`}
                      >
                        <Icon className={`h-5 w-5 ${newShiftType === type ? config.color : "text-[var(--color-text-muted)]"}`} />
                        <span className="text-xs font-medium">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {newShiftType !== "frei" && newShiftType !== "feiertag" && newShiftType !== "urlaub" && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Von</label>
                    <input
                      type="time"
                      value={newShiftStart}
                      onChange={(e) => setNewShiftStart(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Bis</label>
                    <input
                      type="time"
                      value={newShiftEnd}
                      onChange={(e) => setNewShiftEnd(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Notiz (optional)</label>
                <input
                  type="text"
                  value={newShiftNote}
                  onChange={(e) => setNewShiftNote(e.target.value)}
                  maxLength={200}
                  placeholder="z.B. Maschineneinweisung"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowAddShift(false)}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAddShift}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Eintragen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
