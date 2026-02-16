"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { GERMAN_HOLIDAYS, calculateWorkingDays } from "@/lib/holidays";
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
  Briefcase,
  AlertTriangle,
  Thermometer,
} from "lucide-react";
import { ShiftType, SHIFT_TYPES } from "@/types";

const shiftLabels: Record<ShiftType, { label: string; short: string; color: string; bg: string; icon: typeof Sun }> = {
  frueh: { label: "Frühschicht", short: "F", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", icon: Sun },
  spaet: { label: "Spätschicht", short: "S", color: "text-orange-700", bg: "bg-orange-100 border-orange-300", icon: Sunset },
  nacht: { label: "Nachtschicht", short: "N", color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-300", icon: Moon },
  frei: { label: "Frei", short: "-", color: "text-gray-500", bg: "bg-gray-100 border-gray-300", icon: Coffee },
  feiertag: { label: "Feiertag", short: "FT", color: "text-red-600", bg: "bg-red-100 border-red-300", icon: Star },
  urlaub: { label: "Urlaub", short: "U", color: "text-green-700", bg: "bg-green-100 border-green-300", icon: Palmtree },
  sonderurlaub: { label: "Sonderurlaub", short: "SU", color: "text-teal-700", bg: "bg-teal-100 border-teal-300", icon: Briefcase },
  krank: { label: "Krank", short: "K", color: "text-pink-700", bg: "bg-pink-100 border-pink-300", icon: Thermometer },
};

const WEEKDAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const VACATION_SHIFT_TYPES: ShiftType[] = ["urlaub", "sonderurlaub"];
const TIME_SHIFT_TYPES: ShiftType[] = ["frueh", "spaet", "nacht"];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1;
}
function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export default function KalenderPage() {
  const {
    user, allUsers, shiftEntries, vacationRequests, addShift, deleteShift,
    getShiftsForUser, addVacationRequest, hasRole, getVacationBalance,
  } = useAuth();
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedUserId, setSelectedUserId] = useState<string>(user?.id || "");
  const [showAddShift, setShowAddShift] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [newShiftType, setNewShiftType] = useState<ShiftType>("frueh");
  const [newShiftStart, setNewShiftStart] = useState("06:00");
  const [newShiftEnd, setNewShiftEnd] = useState("14:00");
  const [newShiftNote, setNewShiftNote] = useState("");
  const [vacStartDate, setVacStartDate] = useState("");
  const [vacEndDate, setVacEndDate] = useState("");
  const [vacReason, setVacReason] = useState("");
  const [formError, setFormError] = useState("");
  const [vacationConflict, setVacationConflict] = useState<{
    dateStr: string;
    vacationType: string;
    userName: string;
  } | null>(null);

  const viewUserId = selectedUserId || user?.id || "";
  const viewUser = allUsers.find((u) => u.id === viewUserId);

  const canManageShifts = useMemo(() => {
    if (!user) return false;
    if (user.role === "admin") return true;
    const targetUser = allUsers.find((u) => u.id === viewUserId);
    return targetUser?.managerId === user.id;
  }, [user, viewUserId, allUsers]);

  const manageableUsers = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return allUsers.filter((u) => u.isActive);
    return allUsers.filter((u) => u.isActive && (u.id === user.id || u.managerId === user.id));
  }, [user, allUsers]);

  const shifts = getShiftsForUser(viewUserId, currentMonth, currentYear);

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

  const pendingVacations = useMemo(() => {
    return vacationRequests.filter((v) => {
      if (v.userId !== viewUserId || v.status !== "ausstehend") return false;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      return start <= monthEnd && end >= monthStart;
    });
  }, [vacationRequests, viewUserId, currentMonth, currentYear]);

  const dateMap = useMemo(() => {
    const map: Record<string, { shift?: typeof shifts[0]; vacation?: boolean; vacationType?: string; pendingVac?: boolean; holiday?: string }> = {};
    shifts.forEach((s) => { map[s.date] = { ...map[s.date], shift: s }; });
    userVacations.forEach((v) => {
      const start = new Date(v.startDate); const end = new Date(v.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
        map[key] = { ...map[key], vacation: true, vacationType: v.type };
      }
    });
    pendingVacations.forEach((v) => {
      const start = new Date(v.startDate); const end = new Date(v.endDate);
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const key = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
        if (!map[key]?.vacation) map[key] = { ...map[key], pendingVac: true, vacationType: v.type };
      }
    });
    Object.entries(GERMAN_HOLIDAYS).forEach(([date, name]) => { map[date] = { ...map[date], holiday: name }; });
    return map;
  }, [shifts, userVacations, pendingVacations]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfWeek(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("de-DE", { month: "long", year: "numeric" });
  const prevMonth = () => { if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); } else setCurrentMonth(currentMonth - 1); };
  const nextMonth = () => { if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); } else setCurrentMonth(currentMonth + 1); };

  const isVacationType = VACATION_SHIFT_TYPES.includes(newShiftType);

  const handleDayClick = (day: number) => {
    if (!canManageShifts) return;
    const dateStr = formatDateStr(currentYear, currentMonth, day);
    setSelectedDate(dateStr);
    setNewShiftType("frueh");
    setNewShiftStart("06:00"); setNewShiftEnd("14:00");
    setNewShiftNote(""); setVacStartDate(dateStr); setVacEndDate(dateStr);
    setVacReason(""); setFormError("");
    setShowAddShift(true);
  };

  const workingDaysPreview = useMemo(() => {
    if (!isVacationType || !vacStartDate || !vacEndDate) return 0;
    if (new Date(vacStartDate) > new Date(vacEndDate)) return 0;
    return calculateWorkingDays(vacStartDate, vacEndDate);
  }, [isVacationType, vacStartDate, vacEndDate]);

  const balance = getVacationBalance(viewUserId);

  // Check if a date falls within approved vacation for the viewed user
  const getVacationConflictForDate = (dateStr: string) => {
    const checkDate = new Date(dateStr);
    for (const v of vacationRequests) {
      if (v.userId !== viewUserId) continue;
      if (v.status !== "genehmigt") continue;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      if (checkDate >= start && checkDate <= end) {
        return v.type === "sonderurlaub" ? "Sonderurlaub" : "Urlaub";
      }
    }
    return null;
  };

  const doAddShift = () => {
    if (!user || !viewUserId) return;
    addShift({
      userId: viewUserId, date: selectedDate, type: newShiftType,
      startTime: TIME_SHIFT_TYPES.includes(newShiftType) ? newShiftStart : undefined,
      endTime: TIME_SHIFT_TYPES.includes(newShiftType) ? newShiftEnd : undefined,
      note: newShiftNote || undefined, createdBy: user.id,
    });
    setShowAddShift(false);
    setVacationConflict(null);
  };

  const handleAddEntry = () => {
    if (!user || !viewUserId) return;
    if (!SHIFT_TYPES.includes(newShiftType)) return;
    setFormError("");

    if (isVacationType) {
      if (!vacStartDate || !vacEndDate) { setFormError("Bitte Von- und Bis-Datum angeben."); return; }
      if (new Date(vacStartDate) > new Date(vacEndDate)) { setFormError("Startdatum muss vor Enddatum liegen."); return; }
      const days = calculateWorkingDays(vacStartDate, vacEndDate);
      if (days <= 0) { setFormError("Keine Arbeitstage im gewählten Zeitraum."); return; }
      if (newShiftType === "urlaub" && days > balance.remaining) {
        setFormError(`Nicht genug Resturlaub. Verfügbar: ${balance.remaining}, benötigt: ${days}.`);
        return;
      }
      addVacationRequest({
        userId: viewUserId, startDate: vacStartDate, endDate: vacEndDate, days,
        type: newShiftType === "sonderurlaub" ? "sonderurlaub" : "urlaub",
        reason: vacReason || undefined,
      });
      setShowAddShift(false);
    } else {
      // Check for vacation conflict before adding shift
      const conflictType = getVacationConflictForDate(selectedDate);
      if (conflictType) {
        setVacationConflict({
          dateStr: selectedDate,
          vacationType: conflictType,
          userName: `${viewUser?.firstName} ${viewUser?.lastName}`,
        });
        return;
      }
      doAddShift();
    }
  };

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Calendar className="h-7 w-7 text-[var(--color-primary-600)]" />
            Schichtkalender
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">Schichtplan, Urlaub und Feiertage im Überblick</p>
        </div>
        {manageableUsers.length > 1 && (
          <select value={viewUserId} onChange={(e) => setSelectedUserId(e.target.value)}
            className="px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
            {manageableUsers.map((u) => (
              <option key={u.id} value={u.id}>{u.firstName} {u.lastName} — {u.department}</option>
            ))}
          </select>
        )}
      </div>

      {/* Vacation balance */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-[var(--color-text-primary)]">Urlaubskonto {viewUser?.firstName} {viewUser?.lastName}</span>
          <span className="text-sm text-[var(--color-text-muted)]">{balance.used} genommen + {balance.planned} geplant = {balance.used + balance.planned} / {balance.total}</span>
        </div>
        <div className="h-2.5 bg-[var(--color-surface-tertiary)] rounded-full overflow-hidden">
          <div className="h-full flex">
            <div className="bg-[var(--color-primary-600)]" style={{ width: `${(balance.used / Math.max(balance.total, 1)) * 100}%` }} />
            <div className="bg-[var(--color-primary-300)]" style={{ width: `${(balance.planned / Math.max(balance.total, 1)) * 100}%` }} />
          </div>
        </div>
        <div className="flex gap-4 mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-600)]" />Genommen ({balance.used})</span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-primary-300)]" />Geplant ({balance.planned})</span>
          <span className="flex items-center gap-1 text-[10px] text-[var(--color-text-muted)]"><span className="h-1.5 w-1.5 rounded-full bg-[var(--color-surface-tertiary)]" />Verfügbar ({balance.remaining})</span>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(shiftLabels) as [ShiftType, typeof shiftLabels.frueh][]).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-2 text-xs">
                <div className={`w-6 h-6 rounded flex items-center justify-center border ${config.bg}`}><Icon className={`h-3.5 w-3.5 ${config.color}`} /></div>
                <span className="text-[var(--color-text-secondary)]">{config.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Calendar grid */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <button onClick={prevMonth} className="p-2 hover:bg-[var(--color-surface-tertiary)] rounded-lg"><ChevronLeft className="h-5 w-5 text-[var(--color-text-secondary)]" /></button>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] capitalize">{monthName}{viewUser && viewUser.id !== user?.id && <span className="text-sm font-normal text-[var(--color-text-muted)] ml-2">— {viewUser.firstName} {viewUser.lastName}</span>}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-[var(--color-surface-tertiary)] rounded-lg"><ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)]" /></button>
        </div>
        <div className="grid grid-cols-7 border-b border-[var(--color-border)]">
          {WEEKDAYS.map((day, i) => (<div key={day} className={`py-3 text-center text-xs font-semibold ${i >= 5 ? "text-red-400" : "text-[var(--color-text-muted)]"}`}>{day}</div>))}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: firstDay }).map((_, i) => (<div key={`e-${i}`} className="min-h-[100px] border-b border-r border-[var(--color-border)] bg-[var(--color-surface-secondary)]" />))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const dateStr = formatDateStr(currentYear, currentMonth, day);
            const entry = dateMap[dateStr];
            const isToday = dateStr === todayStr;
            const dayOfWeek = (firstDay + i) % 7;
            const isWeekend = dayOfWeek >= 5;
            return (
              <div key={day} onClick={() => handleDayClick(day)}
                className={`min-h-[100px] border-b border-r border-[var(--color-border)] p-2 transition-colors group ${canManageShifts ? "cursor-pointer hover:bg-[var(--color-primary-50)]" : ""} ${isWeekend ? "bg-gray-50" : "bg-white"} ${isToday ? "ring-2 ring-inset ring-[var(--color-primary-400)]" : ""}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-medium ${isToday ? "bg-[var(--color-primary-600)] text-white w-7 h-7 rounded-full flex items-center justify-center" : isWeekend ? "text-red-400" : "text-[var(--color-text-primary)]"}`}>{day}</span>
                  {entry?.shift && canManageShifts && (
                    <button onClick={(e) => { e.stopPropagation(); deleteShift(entry.shift!.id); }}
                      className="p-0.5 rounded hover:bg-red-100 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 className="h-3 w-3" /></button>
                  )}
                </div>
                {entry?.holiday && <div className="text-[10px] font-medium text-red-500 bg-red-50 rounded px-1 py-0.5 mb-1 truncate">{entry.holiday}</div>}
                {entry?.vacation && (
                  <div className={`text-[10px] font-medium rounded px-1 py-0.5 mb-1 flex items-center gap-1 ${entry.vacationType === "sonderurlaub" ? "text-teal-600 bg-teal-50" : "text-green-600 bg-green-50"}`}>
                    {entry.vacationType === "sonderurlaub" ? <Briefcase className="h-3 w-3" /> : <Palmtree className="h-3 w-3" />}
                    {entry.vacationType === "sonderurlaub" ? "Sonderurl." : "Urlaub"}
                  </div>
                )}
                {entry?.pendingVac && !entry?.vacation && (
                  <div className="text-[10px] font-medium text-amber-600 bg-amber-50 rounded px-1 py-0.5 mb-1 flex items-center gap-1 opacity-70">
                    <Palmtree className="h-3 w-3" />Beantragt
                  </div>
                )}
                {entry?.shift && (
                  <div className={`text-[10px] font-medium rounded px-1 py-0.5 border flex items-center gap-1 ${shiftLabels[entry.shift.type].bg} ${shiftLabels[entry.shift.type].color}`}>
                    {(() => { const Icon = shiftLabels[entry.shift.type].icon; return <Icon className="h-3 w-3" />; })()}
                    {shiftLabels[entry.shift.type].short}
                    {entry.shift.startTime && <span className="ml-auto">{entry.shift.startTime}</span>}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      {showAddShift && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center"><Plus className="h-5 w-5 text-[var(--color-primary-600)]" /></div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">{isVacationType ? "Urlaub eintragen" : "Schicht eintragen"}</h2>
                  <p className="text-xs text-[var(--color-text-muted)]">{viewUser?.firstName} {viewUser?.lastName}</p>
                </div>
              </div>
              <button onClick={() => setShowAddShift(false)} className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"><X className="h-5 w-5 text-[var(--color-text-secondary)]" /></button>
            </div>
            {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{formError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Typ</label>
                <div className="grid grid-cols-3 gap-2">
                  {(["frueh", "spaet", "nacht", "frei", "krank", "urlaub", "sonderurlaub"] as ShiftType[]).map((type) => {
                    const config = shiftLabels[type]; const Icon = config.icon;
                    return (
                      <button key={type} onClick={() => {
                        if (!SHIFT_TYPES.includes(type)) return;
                        setNewShiftType(type); setFormError("");
                        if (type === "frueh") { setNewShiftStart("06:00"); setNewShiftEnd("14:00"); }
                        else if (type === "spaet") { setNewShiftStart("14:00"); setNewShiftEnd("22:00"); }
                        else if (type === "nacht") { setNewShiftStart("22:00"); setNewShiftEnd("06:00"); }
                      }}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-colors ${newShiftType === type ? `${config.bg} border-current ${config.color}` : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"}`}>
                        <Icon className={`h-4 w-4 ${newShiftType === type ? config.color : "text-[var(--color-text-muted)]"}`} />
                        <span className="text-[10px] font-medium leading-tight text-center">{config.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              {isVacationType && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Von</label>
                      <input type="date" value={vacStartDate} onChange={(e) => setVacStartDate(e.target.value)} className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Bis</label>
                      <input type="date" value={vacEndDate} onChange={(e) => setVacEndDate(e.target.value)} className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                    </div>
                  </div>
                  {workingDaysPreview > 0 && (
                    <div className="bg-[var(--color-surface-tertiary)] rounded-lg px-4 py-3 text-sm">
                      <span className="text-[var(--color-text-secondary)]">Arbeitstage: </span>
                      <span className="font-semibold text-[var(--color-text-primary)]">{workingDaysPreview}</span>
                      <span className="text-[var(--color-text-muted)] text-xs ml-2">(Sa/So + Feiertage abgezogen)</span>
                      {newShiftType === "urlaub" && <span className="text-xs text-[var(--color-text-muted)] block mt-1">Resturlaub: {balance.remaining} Tage</span>}
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Anmerkung (optional)</label>
                    <input type="text" value={vacReason} onChange={(e) => setVacReason(e.target.value)} maxLength={500} placeholder="z.B. Sommerurlaub, Umzug..."
                      className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                  </div>
                </>
              )}
              {TIME_SHIFT_TYPES.includes(newShiftType) && (
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Von</label><input type="time" value={newShiftStart} onChange={(e) => setNewShiftStart(e.target.value)} className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" /></div>
                  <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Bis</label><input type="time" value={newShiftEnd} onChange={(e) => setNewShiftEnd(e.target.value)} className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" /></div>
                </div>
              )}
              {!isVacationType && (
                <div><label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Notiz (optional)</label><input type="text" value={newShiftNote} onChange={(e) => setNewShiftNote(e.target.value)} maxLength={200} placeholder="z.B. Maschineneinweisung" className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" /></div>
              )}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setShowAddShift(false)} className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">Abbrechen</button>
                <button onClick={handleAddEntry} className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <Plus className="h-4 w-4" />{isVacationType ? "Urlaub eintragen" : "Eintragen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Vacation conflict alarm modal */}
      {vacationConflict && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-0 overflow-hidden shadow-2xl animate-[shake_0.3s_ease-in-out]">
            {/* Red warning header */}
            <div className="bg-red-600 px-6 py-5 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Urlaubskonflikt!</h2>
                <p className="text-red-100 text-sm mt-0.5">Achtung: Schichtzuweisung nicht möglich</p>
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-5">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-800 font-semibold text-sm">
                  {vacationConflict.userName} hat am{" "}
                  <span className="underline">
                    {new Date(vacationConflict.dateStr).toLocaleDateString("de-DE", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </span>{" "}
                  genehmigten <span className="underline">{vacationConflict.vacationType}</span>.
                </p>
                <p className="text-red-600 text-xs mt-2">
                  Dieser Mitarbeiter ist an diesem Tag nicht verfügbar. Eine Schichtzuweisung widerspricht dem genehmigten Urlaubsantrag.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setVacationConflict(null)}
                  className="flex-1 px-4 py-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Verstanden, abbrechen
                </button>
                <button
                  onClick={doAddShift}
                  className="px-4 py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                >
                  Trotzdem eintragen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
