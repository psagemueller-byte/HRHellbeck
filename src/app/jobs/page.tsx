"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { sanitizeAndLimit } from "@/lib/sanitize";
import { JobPosting } from "@/types";
import {
  Briefcase,
  MapPin,
  Clock,
  Plus,
  X,
  Pencil,
  Trash2,
  Search,
  Building2,
  GraduationCap,
  BookOpen,
  Mail,
  Eye,
  EyeOff,
  ChevronRight,
} from "lucide-react";

const JOB_TYPES: Record<string, { label: string; icon: typeof Briefcase; color: string }> = {
  vollzeit: { label: "Vollzeit", icon: Briefcase, color: "bg-blue-100 text-blue-700" },
  teilzeit: { label: "Teilzeit", icon: Clock, color: "bg-green-100 text-green-700" },
  praktikum: { label: "Praktikum", icon: GraduationCap, color: "bg-purple-100 text-purple-700" },
  ausbildung: { label: "Ausbildung", icon: BookOpen, color: "bg-amber-100 text-amber-700" },
  werkstudent: { label: "Werkstudent", icon: GraduationCap, color: "bg-teal-100 text-teal-700" },
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("de-DE", { day: "numeric", month: "long", year: "numeric" });
}

export default function JobsPage() {
  const { user, jobPostings, addJobPosting, updateJobPosting, deleteJobPosting, hasRole, departments } = useAuth();
  const isAdmin = hasRole("admin");

  const [showEditor, setShowEditor] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [expandedJob, setExpandedJob] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("alle");
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "", department: "", location: "", type: "vollzeit",
    description: "", requirements: "", benefits: "", contactEmail: "",
  });
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setForm({ title: "", department: "", location: "", type: "vollzeit", description: "", requirements: "", benefits: "", contactEmail: "" });
    setFormError("");
    setEditingJob(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    const title = sanitizeAndLimit(form.title, 200);
    if (!title) { setFormError("Bitte einen Titel eingeben."); return; }
    if (!form.department) { setFormError("Bitte eine Abteilung angeben."); return; }
    if (!form.description.trim()) { setFormError("Bitte eine Beschreibung eingeben."); return; }
    if (!form.requirements.trim()) { setFormError("Bitte Anforderungen eingeben."); return; }

    const data = {
      title,
      department: sanitizeAndLimit(form.department, 100),
      location: sanitizeAndLimit(form.location, 100),
      type: form.type as JobPosting["type"],
      description: sanitizeAndLimit(form.description, 5000),
      requirements: sanitizeAndLimit(form.requirements, 3000),
      benefits: form.benefits ? sanitizeAndLimit(form.benefits, 2000) : undefined,
      contactEmail: sanitizeAndLimit(form.contactEmail, 200),
      isActive: true,
    };

    if (editingJob) {
      updateJobPosting(editingJob.id, data);
    } else {
      addJobPosting(data);
    }
    resetForm();
    setShowEditor(false);
  };

  const startEdit = (job: JobPosting) => {
    setForm({
      title: job.title, department: job.department, location: job.location,
      type: job.type, description: job.description, requirements: job.requirements,
      benefits: job.benefits || "", contactEmail: job.contactEmail,
    });
    setEditingJob(job);
    setShowEditor(true);
  };

  const activeJobs = jobPostings.filter((j) => isAdmin || j.isActive);
  const filteredJobs = activeJobs.filter((j) => {
    if (filterType !== "alle" && j.type !== filterType) return false;
    if (search) {
      const q = search.toLowerCase();
      return j.title.toLowerCase().includes(q) || j.department.toLowerCase().includes(q) || j.location.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <p className="text-[12px] font-bold text-[var(--color-text-secondary)] uppercase tracking-[0.6px] mb-1">
            Karriere
          </p>
          <h1 className="text-xl md:text-2xl font-bold text-[var(--color-text-primary)]">
            Offene Stellen
          </h1>
          <p className="text-sm text-[var(--color-text-secondary)] mt-1">
            {activeJobs.filter((j) => j.isActive).length} aktive Stellenanzeigen
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => { resetForm(); setShowEditor(true); }}
            className="flex items-center gap-2 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white font-medium py-2.5 px-4 rounded-lg transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            Stelle ausschreiben
          </button>
        )}
      </div>

      {/* Search and filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--color-text-muted)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Stelle, Abteilung oder Standort suchen..."
            className="w-full pl-10 pr-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]"
        >
          <option value="alle">Alle Typen</option>
          {Object.entries(JOB_TYPES).map(([key, val]) => (
            <option key={key} value={key}>{val.label}</option>
          ))}
        </select>
      </div>

      {/* Job listings */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl border border-[var(--color-border)] p-12 text-center">
          <Briefcase className="h-12 w-12 text-[var(--color-text-muted)] mx-auto mb-3 opacity-50" />
          <p className="text-sm text-[var(--color-text-muted)]">Keine Stellenanzeigen gefunden.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredJobs.map((job) => {
            const typeConfig = JOB_TYPES[job.type] || JOB_TYPES.vollzeit;
            const TypeIcon = typeConfig.icon;
            const isExpanded = expandedJob === job.id;

            return (
              <div key={job.id} className={`bg-white rounded-xl border overflow-hidden transition-all ${!job.isActive ? "opacity-60 border-dashed" : "border-[var(--color-border)] hover:border-[var(--color-primary-300)]"}`}>
                {/* Header */}
                <button
                  onClick={() => setExpandedJob(isExpanded ? null : job.id)}
                  className="w-full px-5 py-4 flex items-center gap-4 text-left"
                >
                  <div className={`h-10 w-10 rounded-lg ${typeConfig.color} flex items-center justify-center flex-shrink-0`}>
                    <TypeIcon className="h-5 w-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-[var(--color-text-primary)]">{job.title}</h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${typeConfig.color}`}>
                        {typeConfig.label}
                      </span>
                      {!job.isActive && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700">Inaktiv</span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-[var(--color-text-muted)]">
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{job.department}</span>
                      {job.location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{job.location}</span>}
                      <span>Seit {formatDate(job.createdAt)}</span>
                    </div>
                  </div>
                  <ChevronRight className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-[var(--color-border)]">
                    <div className="pt-4 space-y-4">
                      <div>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Beschreibung</h4>
                        <p className="text-sm text-[var(--color-text-body)] whitespace-pre-line">{job.description}</p>
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Anforderungen</h4>
                        <p className="text-sm text-[var(--color-text-body)] whitespace-pre-line">{job.requirements}</p>
                      </div>
                      {job.benefits && (
                        <div>
                          <h4 className="text-sm font-bold text-[var(--color-text-primary)] mb-1">Benefits</h4>
                          <p className="text-sm text-[var(--color-text-body)] whitespace-pre-line">{job.benefits}</p>
                        </div>
                      )}
                      {job.contactEmail && (
                        <div className="flex items-center gap-2 pt-2">
                          <Mail className="h-4 w-4 text-[var(--color-primary-600)]" />
                          <a href={`mailto:${job.contactEmail}?subject=Bewerbung: ${job.title}`} className="text-sm text-[var(--color-primary-600)] hover:underline font-medium">
                            Jetzt bewerben: {job.contactEmail}
                          </a>
                        </div>
                      )}
                      {isAdmin && (
                        <div className="flex items-center gap-2 pt-2 border-t border-[var(--color-border)]">
                          <button onClick={() => startEdit(job)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[var(--color-primary-600)] hover:bg-[var(--color-primary-50)] rounded-lg transition-colors">
                            <Pencil className="h-3.5 w-3.5" /> Bearbeiten
                          </button>
                          <button onClick={() => updateJobPosting(job.id, { isActive: !job.isActive })} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-50 rounded-lg transition-colors">
                            {job.isActive ? <><EyeOff className="h-3.5 w-3.5" /> Deaktivieren</> : <><Eye className="h-3.5 w-3.5" /> Aktivieren</>}
                          </button>
                          <button onClick={() => setConfirmDelete(job.id)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                            <Trash2 className="h-3.5 w-3.5" /> Löschen
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[var(--color-text-primary)] flex items-center gap-2">
                <Briefcase className="h-5 w-5 text-[var(--color-primary-600)]" />
                {editingJob ? "Stelle bearbeiten" : "Neue Stellenanzeige"}
              </h2>
              <button onClick={() => { resetForm(); setShowEditor(false); }} className="h-8 w-8 rounded-lg hover:bg-[var(--color-surface-tertiary)] flex items-center justify-center">
                <X className="h-5 w-5 text-[var(--color-text-secondary)]" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {formError && <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">{formError}</div>}

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Titel *</label>
                <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="z.B. Senior Projektingenieur (m/w/d)" maxLength={200}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Abteilung *</label>
                  <select value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]">
                    <option value="">— Wählen —</option>
                    {departments.map((d) => <option key={d.id} value={d.name}>{d.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Standort</label>
                  <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="z.B. Hamburg" maxLength={100}
                    className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Anstellungsart</label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(JOB_TYPES).map(([key, val]) => (
                    <button key={key} type="button" onClick={() => setForm({ ...form, type: key })}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${form.type === key ? `${val.color} ring-2 ring-offset-1 ring-[var(--color-primary-400)]` : "border-[var(--color-border)] text-[var(--color-text-muted)]"}`}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Beschreibung *</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={4} maxLength={5000} placeholder="Was erwartet den Bewerber?"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Anforderungen *</label>
                <textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} rows={3} maxLength={3000} placeholder="Qualifikationen, Erfahrung, Skills..."
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Benefits (optional)</label>
                <textarea value={form.benefits} onChange={(e) => setForm({ ...form, benefits: e.target.value })} rows={2} maxLength={2000} placeholder="Was bieten wir?"
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)] resize-none" />
              </div>

              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1.5">Kontakt E-Mail</label>
                <input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} placeholder="bewerbung@hellbeck.de" maxLength={200}
                  className="w-full px-3 py-2.5 border border-[var(--color-border)] rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary-500)]" />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { resetForm(); setShowEditor(false); }}
                  className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
                  Abbrechen
                </button>
                <button type="submit"
                  className="flex-1 px-4 py-2.5 bg-[var(--color-primary-600)] hover:bg-[var(--color-primary-700)] text-white rounded-lg text-sm font-medium transition-colors">
                  {editingJob ? "Speichern" : "Veröffentlichen"}
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
            <h3 className="text-base font-bold text-[var(--color-text-primary)] mb-2">Stellenanzeige löschen?</h3>
            <p className="text-sm text-[var(--color-text-muted)] mb-6">Diese Aktion kann nicht rückgängig gemacht werden.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmDelete(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border)] rounded-lg text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors">
                Abbrechen
              </button>
              <button onClick={() => { deleteJobPosting(confirmDelete); setConfirmDelete(null); }}
                className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-sm font-medium transition-colors">
                Löschen
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
