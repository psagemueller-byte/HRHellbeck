"use client";

import { useState, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { GERMAN_HOLIDAYS } from "@/lib/holidays";
import {
  Users,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Sunset,
  Coffee,
  Palmtree,
  Star,
  Briefcase,
  AlertTriangle,
  CalendarRange,
  X,
  Check,
  Thermometer,
  Trash2,
} from "lucide-react";
import { ShiftType, SHIFT_TYPES } from "@/types";

const shiftConfig: Record<ShiftType, { label: string; short: string; color: string; bg: string; cellBg: string; icon: typeof Sun }> = {
  frueh: { label: "Frühschicht", short: "F", color: "text-amber-700", bg: "bg-amber-100 border-amber-300", cellBg: "bg-amber-200", icon: Sun },
  spaet: { label: "Spätschicht", short: "S", color: "text-orange-700", bg: "bg-orange-100 border-orange-300", cellBg: "bg-orange-200", icon: Sunset },
  nacht: { label: "Nachtschicht", short: "N", color: "text-indigo-700", bg: "bg-indigo-100 border-indigo-300", cellBg: "bg-indigo-200", icon: Moon },
  frei: { label: "Frei", short: "-", color: "text-gray-500", bg: "bg-gray-100 border-gray-300", cellBg: "bg-gray-200", icon: Coffee },
  feiertag: { label: "Feiertag", short: "FT", color: "text-red-600", bg: "bg-red-100 border-red-300", cellBg: "bg-red-200", icon: Star },
  urlaub: { label: "Urlaub", short: "U", color: "text-green-700", bg: "bg-green-100 border-green-300", cellBg: "bg-green-300", icon: Palmtree },
  sonderurlaub: { label: "Sonderurlaub", short: "SU", color: "text-teal-700", bg: "bg-teal-100 border-teal-300", cellBg: "bg-teal-300", icon: Briefcase },
  krank: { label: "Krank", short: "K", color: "text-pink-700", bg: "bg-pink-100 border-pink-300", cellBg: "bg-pink-200", icon: Thermometer },
};

const ASSIGNABLE_SHIFTS: ShiftType[] = ["frueh", "spaet", "nacht", "frei", "krank"];

function formatDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekday(year: number, month: number, day: number) {
  const d = new Date(year, month, day).getDay();
  return d === 0 ? 6 : d - 1; // 0=Mo..6=So
}

const WEEKDAY_SHORT = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];
const TIME_SHIFTS: ShiftType[] = ["frueh", "spaet", "nacht"];

export default function PersonalplanungPage() {
  const {
    user,
    allUsers,
    shiftEntries,
    vacationRequests,
    addShift,
    deleteShift,
    getVacationBalance,
  } = useAuth();

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  // Modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [modalMode, setModalMode] = useState<"single" | "range">("range");
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [assignType, setAssignType] = useState<ShiftType>("frueh");
  const [assignStart, setAssignStart] = useState("");
  const [assignEnd, setAssignEnd] = useState("");
  const [assignStartTime, setAssignStartTime] = useState("06:00");
  const [assignEndTime, setAssignEndTime] = useState("14:00");
  const [includeWeekends, setIncludeWeekends] = useState(false);
  const [formError, setFormError] = useState("");
  const [vacationConflicts, setVacationConflicts] = useState<string[]>([]);
  const [conflictEmployeeName, setConflictEmployeeName] = useState("");

  // Employees this user can manage
  const teamMembers = useMemo(() => {
    if (!user) return [];
    if (user.role === "admin") return allUsers.filter((u) => u.isActive && u.id !== user.id);
    return allUsers.filter((u) => u.isActive && u.managerId === user.id);
  }, [user, allUsers]);

  const isManager = teamMembers.length > 0;

  // Build shift/vacation map for all team members for the month
  const scheduleMap = useMemo(() => {
    const map: Record<string, Record<string, { type: "shift" | "vacation" | "pending" | "holiday"; shiftType?: ShiftType; vacationType?: string; shiftId?: string }>> = {};

    teamMembers.forEach((member) => {
      map[member.id] = {};
    });

    // Shifts
    shiftEntries.forEach((s) => {
      if (!map[s.userId]) return;
      const d = new Date(s.date);
      if (d.getMonth() !== currentMonth || d.getFullYear() !== currentYear) return;
      map[s.userId][s.date] = { type: "shift", shiftType: s.type, shiftId: s.id };
    });

    // Vacations
    vacationRequests.forEach((v) => {
      if (!map[v.userId]) return;
      if (v.status !== "genehmigt" && v.status !== "ausstehend") return;
      const start = new Date(v.startDate);
      const end = new Date(v.endDate);
      const monthStart = new Date(currentYear, currentMonth, 1);
      const monthEnd = new Date(currentYear, currentMonth + 1, 0);
      if (start > monthEnd || end < monthStart) return;

      for (let d = new Date(Math.max(start.getTime(), monthStart.getTime())); d <= end && d <= monthEnd; d.setDate(d.getDate() + 1)) {
        const key = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
        if (v.status === "genehmigt") {
          map[v.userId][key] = { type: "vacation", vacationType: v.type };
        } else if (!map[v.userId][key] || map[v.userId][key].type !== "vacation") {
          map[v.userId][key] = { type: "pending", vacationType: v.type };
        }
      }
    });

    return map;
  }, [teamMembers, shiftEntries, vacationRequests, currentMonth, currentYear]);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const monthName = new Date(currentYear, currentMonth).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  const prevMonth = () => {
    if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
    else setCurrentMonth(currentMonth - 1);
  };
  const nextMonth = () => {
    if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
    else setCurrentMonth(currentMonth + 1);
  };

  // Open modal for Von-Bis range (click on employee name)
  const openRangeModal = (employeeId: string) => {
    const today = new Date();
    const startDate = today.getMonth() === currentMonth && today.getFullYear() === currentYear
      ? formatDateStr(currentYear, currentMonth, today.getDate())
      : formatDateStr(currentYear, currentMonth, 1);

    setSelectedEmployee(employeeId);
    setModalMode("range");
    setAssignType("frueh");
    setAssignStart(startDate);
    setAssignEnd(startDate);
    setAssignStartTime("06:00");
    setAssignEndTime("14:00");
    setIncludeWeekends(false);
    setFormError("");
    setVacationConflicts([]);
    setShowAssignModal(true);
  };

  // Open modal for a single cell (click on specific day cell)
  const openCellModal = (employeeId: string, dateStr: string) => {
    setSelectedEmployee(employeeId);
    setModalMode("single");
    setAssignStart(dateStr);
    setAssignEnd(dateStr);
    setIncludeWeekends(true); // single day = always include
    setFormError("");
    setVacationConflicts([]);

    // Pre-select existing shift type and times if present
    const existing = scheduleMap[employeeId]?.[dateStr];
    if (existing?.type === "shift" && existing.shiftType && ASSIGNABLE_SHIFTS.includes(existing.shiftType)) {
      setAssignType(existing.shiftType);
      // Load existing times from the actual shift entry
      const shiftEntry = shiftEntries.find((s) => s.id === existing.shiftId);
      if (shiftEntry?.startTime) setAssignStartTime(shiftEntry.startTime);
      else if (existing.shiftType === "frueh") setAssignStartTime("06:00");
      else if (existing.shiftType === "spaet") setAssignStartTime("14:00");
      else if (existing.shiftType === "nacht") setAssignStartTime("22:00");
      if (shiftEntry?.endTime) setAssignEndTime(shiftEntry.endTime);
      else if (existing.shiftType === "frueh") setAssignEndTime("14:00");
      else if (existing.shiftType === "spaet") setAssignEndTime("22:00");
      else if (existing.shiftType === "nacht") setAssignEndTime("06:00");
    } else {
      setAssignType("frueh");
      setAssignStartTime("06:00");
      setAssignEndTime("14:00");
    }

    setShowAssignModal(true);
  };

  // Find approved vacation dates for an employee in a range
  const getVacationDatesInRange = (userId: string, startDate: string, endDate: string, skipWeekends: boolean): string[] => {
    const conflicts: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dateStr = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());
      const dow = d.getDay();
      if (skipWeekends && (dow === 0 || dow === 6)) continue;

      for (const v of vacationRequests) {
        if (v.userId !== userId || v.status !== "genehmigt") continue;
        const vStart = new Date(v.startDate);
        const vEnd = new Date(v.endDate);
        if (d >= vStart && d <= vEnd) {
          conflicts.push(dateStr);
          break;
        }
      }
    }
    return conflicts;
  };

  const doAssignShifts = (skipConflicts: boolean) => {
    if (!user || !selectedEmployee) return;
    const start = new Date(assignStart);
    const end = new Date(assignEnd);
    const skipWeekends = !includeWeekends && TIME_SHIFTS.includes(assignType);

    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (skipWeekends && (dow === 0 || dow === 6)) continue;

      const dateStr = formatDateStr(d.getFullYear(), d.getMonth(), d.getDate());

      // Skip vacation days if user chose to skip conflicts
      if (skipConflicts && vacationConflicts.includes(dateStr)) continue;

      // Delete existing shift for this day if any
      const existingShift = shiftEntries.find((s) => s.userId === selectedEmployee && s.date === dateStr);
      if (existingShift) deleteShift(existingShift.id);

      addShift({
        userId: selectedEmployee,
        date: dateStr,
        type: assignType,
        startTime: TIME_SHIFTS.includes(assignType) ? assignStartTime : undefined,
        endTime: TIME_SHIFTS.includes(assignType) ? assignEndTime : undefined,
        createdBy: user.id,
      });
    }

    setShowAssignModal(false);
    setVacationConflicts([]);
  };

  const handleAssign = () => {
    setFormError("");
    if (!selectedEmployee) return;
    if (!SHIFT_TYPES.includes(assignType)) return;

    if (!assignStart || !assignEnd) {
      setFormError("Bitte Datum angeben.");
      return;
    }
    if (new Date(assignStart) > new Date(assignEnd)) {
      setFormError("Startdatum muss vor dem Enddatum liegen.");
      return;
    }

    const skipWeekends = !includeWeekends && TIME_SHIFTS.includes(assignType);
    const conflicts = getVacationDatesInRange(selectedEmployee, assignStart, assignEnd, skipWeekends);
    if (conflicts.length > 0) {
      const emp = allUsers.find((u) => u.id === selectedEmployee);
      setVacationConflicts(conflicts);
      setConflictEmployeeName(`${emp?.firstName} ${emp?.lastName}`);
      return;
    }

    doAssignShifts(false);
  };

  const today = new Date();
  const todayStr = formatDateStr(today.getFullYear(), today.getMonth(), today.getDate());

  const handleShiftTypeChange = (type: ShiftType) => {
    if (!SHIFT_TYPES.includes(type)) return;
    setAssignType(type);
    if (type === "frueh") { setAssignStartTime("06:00"); setAssignEndTime("14:00"); }
    else if (type === "spaet") { setAssignStartTime("14:00"); setAssignEndTime("22:00"); }
    else if (type === "nacht") { setAssignStartTime("22:00"); setAssignEndTime("06:00"); }
  };

  // Preview days count
  const previewDays = useMemo(() => {
    if (!assignStart || !assignEnd || new Date(assignStart) > new Date(assignEnd)) return 0;
    let count = 0;
    const s = new Date(assignStart);
    const e = new Date(assignEnd);
    const skipWeekends = !includeWeekends && TIME_SHIFTS.includes(assignType);
    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
      const dow = d.getDay();
      if (skipWeekends && (dow === 0 || dow === 6)) continue;
      count++;
    }
    return count;
  }, [assignStart, assignEnd, includeWeekends, assignType]);

  const selectedEmployeeData = allUsers.find((u) => u.id === selectedEmployee);

  if (!user) return null;

  if (!isManager) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
          <Users className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-4 opacity-40" />
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">Kein Zugriff</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Die Personalplanung ist nur für Abteilungsleiter und Administratoren verfügbar.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-full mx-auto px-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <CalendarRange className="h-7 w-7 text-[var(--color-primary-600)]" />
            Personalplanung
          </h1>
          <p className="text-[var(--color-text-secondary)] mt-1">
            Schichtplanung für dein Team — {teamMembers.length} Mitarbeiter
          </p>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {(Object.entries(shiftConfig) as [ShiftType, typeof shiftConfig.frueh][]).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <div key={type} className="flex items-center gap-1.5 text-xs">
                <div className={`w-5 h-5 rounded flex items-center justify-center border ${config.bg}`}>
                  <Icon className={`h-3 w-3 ${config.color}`} />
                </div>
                <span className="text-[var(--color-text-secondary)]">{config.label}</span>
              </div>
            );
          })}
          <div className="flex items-center gap-1.5 text-xs">
            <div className="w-5 h-5 rounded bg-amber-100 border border-amber-300 flex items-center justify-center">
              <span className="text-amber-600 text-[8px] font-bold">?</span>
            </div>
            <span className="text-[var(--color-text-secondary)]">Urlaub beantragt</span>
          </div>
        </div>
      </div>

      {/* Planning matrix */}
      <div className="bg-white rounded-xl border border-[var(--color-border)] overflow-hidden">
        {/* Month navigation */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <button onClick={prevMonth} className="p-2 hover:bg-[var(--color-surface-tertiary)] rounded-lg">
            <ChevronLeft className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] capitalize">{monthName}</h2>
          <button onClick={nextMonth} className="p-2 hover:bg-[var(--color-surface-tertiary)] rounded-lg">
            <ChevronRight className="h-5 w-5 text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Scrollable table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-max">
            <thead>
              <tr>
                <th className="sticky left-0 z-10 bg-[var(--color-surface-secondary)] border-b border-r-2 border-[var(--color-border)] px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-muted)] min-w-[200px]">
                  Mitarbeiter
                </th>
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const wd = getWeekday(currentYear, currentMonth, day);
                  const isWeekend = wd >= 5;
                  const dateStr = formatDateStr(currentYear, currentMonth, day);
                  const isHoliday = !!GERMAN_HOLIDAYS[dateStr];
                  const isToday = dateStr === todayStr;
                  return (
                    <th
                      key={day}
                      className={`border-b border-r border-[var(--color-border)] px-0 py-1 text-center min-w-[38px] ${
                        isWeekend ? "bg-gray-100" : isHoliday ? "bg-red-50" : "bg-[var(--color-surface-secondary)]"
                      } ${isToday ? "ring-2 ring-inset ring-[var(--color-primary-400)]" : ""}`}
                    >
                      <div className={`text-[10px] font-medium ${isWeekend ? "text-red-400" : isHoliday ? "text-red-500" : "text-[var(--color-text-muted)]"}`}>
                        {WEEKDAY_SHORT[wd]}
                      </div>
                      <div className={`text-xs font-semibold ${isToday ? "text-[var(--color-primary-600)]" : isWeekend ? "text-red-400" : "text-[var(--color-text-primary)]"}`}>
                        {day}
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {teamMembers.map((member) => {
                const balance = getVacationBalance(member.id);
                return (
                  <tr key={member.id} className="group">
                    {/* Employee name - opens range modal */}
                    <td className="sticky left-0 z-10 bg-white group-hover:bg-[var(--color-primary-50)] border-b border-r-2 border-[var(--color-border)] px-4 py-2 transition-colors">
                      <button
                        onClick={() => openRangeModal(member.id)}
                        className="w-full text-left"
                        title="Schichten per Von-Bis zuweisen"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-[var(--color-primary-100)] flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-bold text-[var(--color-primary-700)]">
                              {member.firstName[0]}{member.lastName[0]}
                            </span>
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                              {member.firstName} {member.lastName}
                            </p>
                            <p className="text-[10px] text-[var(--color-text-muted)] truncate">
                              {member.department} · U: {balance.remaining}/{balance.total}
                            </p>
                          </div>
                        </div>
                      </button>
                    </td>

                    {/* Day cells - each clickable */}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateStr = formatDateStr(currentYear, currentMonth, day);
                      const wd = getWeekday(currentYear, currentMonth, day);
                      const isWeekend = wd >= 5;
                      const holiday = GERMAN_HOLIDAYS[dateStr];
                      const entry = scheduleMap[member.id]?.[dateStr];

                      let cellContent = null;
                      let cellBgClass = isWeekend ? "bg-gray-50" : "bg-white";

                      if (holiday && !entry) {
                        cellBgClass = "bg-red-50";
                        cellContent = (
                          <span className="text-red-500 text-[10px] font-bold" title={holiday}>FT</span>
                        );
                      }

                      if (entry) {
                        if (entry.type === "shift" && entry.shiftType) {
                          const cfg = shiftConfig[entry.shiftType];
                          cellBgClass = cfg.cellBg;
                          cellContent = (
                            <span className={`${cfg.color} text-[10px] font-bold`} title={cfg.label}>
                              {cfg.short}
                            </span>
                          );
                        } else if (entry.type === "vacation") {
                          const isSpecial = entry.vacationType === "sonderurlaub";
                          cellBgClass = isSpecial ? "bg-teal-200" : "bg-green-200";
                          cellContent = (
                            <span className={`${isSpecial ? "text-teal-700" : "text-green-700"} text-[10px] font-bold`} title={isSpecial ? "Sonderurlaub" : "Urlaub"}>
                              {isSpecial ? "SU" : "U"}
                            </span>
                          );
                        } else if (entry.type === "pending") {
                          cellBgClass = "bg-amber-50";
                          cellContent = (
                            <span className="text-amber-500 text-[10px] font-bold" title="Urlaub beantragt">?</span>
                          );
                        }
                      }

                      return (
                        <td
                          key={day}
                          onClick={() => openCellModal(member.id, dateStr)}
                          className={`border-b border-r border-[var(--color-border)] text-center h-10 cursor-pointer hover:ring-2 hover:ring-inset hover:ring-[var(--color-primary-400)] transition-all ${cellBgClass}`}
                          title={`${member.firstName} — ${new Date(dateStr).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}`}
                        >
                          {cellContent}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assign shift modal */}
      {showAssignModal && selectedEmployee && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-[var(--color-primary-50)] flex items-center justify-center">
                  <CalendarRange className="h-5 w-5 text-[var(--color-primary-600)]" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {modalMode === "single" ? "Schicht eintragen" : "Schichten zuweisen"}
                  </h2>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {selectedEmployeeData?.firstName} {selectedEmployeeData?.lastName}
                    {modalMode === "single" && (
                      <span className="ml-1">
                        — {new Date(assignStart).toLocaleDateString("de-DE", { weekday: "long", day: "numeric", month: "long" })}
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => { setShowAssignModal(false); setVacationConflicts([]); }}
                className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center"
              >
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            {formError && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg mb-4">{formError}</div>
            )}

            {/* Existing entry info for single mode */}
            {modalMode === "single" && (() => {
              const existing = scheduleMap[selectedEmployee]?.[assignStart];
              if (!existing) return null;
              if (existing.type === "shift" && existing.shiftType) {
                const cfg = shiftConfig[existing.shiftType];
                return (
                  <div className={`flex items-center justify-between mb-4 px-4 py-3 rounded-lg border ${cfg.bg}`}>
                    <div className="flex items-center gap-2">
                      {(() => { const Icon = cfg.icon; return <Icon className={`h-4 w-4 ${cfg.color}`} />; })()}
                      <span className={`text-sm font-medium ${cfg.color}`}>Aktuell: {cfg.label}</span>
                    </div>
                    <button
                      onClick={() => {
                        if (existing.shiftId) deleteShift(existing.shiftId);
                        // Stay in modal so user can reassign or just close
                      }}
                      className="flex items-center gap-1 px-2 py-1 text-xs text-red-600 hover:bg-red-100 rounded transition-colors"
                    >
                      <Trash2 className="h-3 w-3" />
                      Entfernen
                    </button>
                  </div>
                );
              }
              if (existing.type === "vacation") {
                return (
                  <div className="flex items-center gap-2 mb-4 px-4 py-3 rounded-lg bg-green-50 border border-green-200">
                    <Palmtree className="h-4 w-4 text-green-600" />
                    <span className="text-sm font-medium text-green-700">Genehmigter Urlaub an diesem Tag</span>
                  </div>
                );
              }
              return null;
            })()}

            <div className="space-y-4">
              {/* Shift type selection */}
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Schichttyp</label>
                <div className="grid grid-cols-5 gap-2">
                  {ASSIGNABLE_SHIFTS.map((type) => {
                    const cfg = shiftConfig[type];
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={type}
                        onClick={() => handleShiftTypeChange(type)}
                        className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 transition-colors ${
                          assignType === type
                            ? `${cfg.bg} border-current ${cfg.color}`
                            : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"
                        }`}
                      >
                        <Icon className={`h-4 w-4 ${assignType === type ? cfg.color : "text-[var(--color-text-muted)]"}`} />
                        <span className="text-[10px] font-medium leading-tight text-center">{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Date range (only in range mode) */}
              {modalMode === "range" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Von</label>
                      <input
                        type="date"
                        value={assignStart}
                        onChange={(e) => setAssignStart(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Bis</label>
                      <input
                        type="date"
                        value={assignEnd}
                        onChange={(e) => setAssignEnd(e.target.value)}
                        className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                      />
                    </div>
                  </div>

                  {/* Include weekends checkbox */}
                  <label className="flex items-center gap-3 cursor-pointer bg-[var(--color-surface-tertiary)] rounded-lg px-4 py-3">
                    <input
                      type="checkbox"
                      checked={includeWeekends}
                      onChange={(e) => setIncludeWeekends(e.target.checked)}
                      className="h-4 w-4 rounded border-[var(--color-border)] text-[var(--color-primary-600)] focus:ring-[var(--color-primary-500)]"
                    />
                    <div>
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">Wochenenden einbeziehen</span>
                      <p className="text-xs text-[var(--color-text-muted)]">Auch Samstage und Sonntage mit Schicht belegen</p>
                    </div>
                  </label>
                </>
              )}

              {/* Preview */}
              {previewDays > 0 && (
                <div className="bg-[var(--color-surface-tertiary)] rounded-lg px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                  <span className="font-semibold text-[var(--color-text-primary)]">{previewDays} Tag{previewDays !== 1 ? "e" : ""}</span>
                  {" "}mit <span className="font-semibold text-[var(--color-text-primary)]">{shiftConfig[assignType].label}</span>
                  {modalMode === "range" && !includeWeekends && TIME_SHIFTS.includes(assignType) && (
                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(Sa/So übersprungen)</span>
                  )}
                  {modalMode === "range" && includeWeekends && (
                    <span className="text-xs text-[var(--color-text-muted)] ml-1">(inkl. Wochenenden)</span>
                  )}
                </div>
              )}

              {/* Time for work shifts */}
              {TIME_SHIFTS.includes(assignType) && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Uhrzeit von</label>
                    <input
                      type="time"
                      value={assignStartTime}
                      onChange={(e) => setAssignStartTime(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Uhrzeit bis</label>
                    <input
                      type="time"
                      value={assignEndTime}
                      onChange={(e) => setAssignEndTime(e.target.value)}
                      className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
                    />
                  </div>
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowAssignModal(false); setVacationConflicts([]); }}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
                >
                  Abbrechen
                </button>
                <button
                  onClick={handleAssign}
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {modalMode === "single" ? "Eintragen" : "Zuweisen"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vacation conflict alarm */}
      {vacationConflicts.length > 0 && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl w-full max-w-md p-0 overflow-hidden shadow-2xl">
            <div className="bg-red-600 px-6 py-5 flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="h-8 w-8 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Urlaubskonflikt!</h2>
                <p className="text-red-100 text-sm mt-0.5">
                  {vacationConflicts.length} Tag{vacationConflicts.length !== 1 ? "e" : ""} betroffen
                </p>
              </div>
            </div>

            <div className="px-6 py-5">
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 mb-4">
                <p className="text-red-800 font-semibold text-sm mb-2">
                  {conflictEmployeeName} hat an folgenden Tagen genehmigten Urlaub:
                </p>
                <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto">
                  {vacationConflicts.map((dateStr) => (
                    <span
                      key={dateStr}
                      className="inline-flex items-center px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded"
                    >
                      {new Date(dateStr).toLocaleDateString("de-DE", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  ))}
                </div>
                <p className="text-red-600 text-xs mt-3">
                  Diese Tage können nicht mit einer Schicht belegt werden, da der Mitarbeiter genehmigten Urlaub hat.
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setVacationConflicts([])}
                  className="flex-1 px-4 py-3 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-bold transition-colors"
                >
                  Verstanden, abbrechen
                </button>
                <button
                  onClick={() => doAssignShifts(true)}
                  className="px-4 py-3 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-medium transition-colors"
                >
                  Urlaubstage überspringen
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
