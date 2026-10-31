"use client";

import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { TopBar } from "@/components/backoffice/top-bar";
import { errorText, formatWhen, plural } from "@/components/resume/format";
import { diffResumes } from "@/lib/jobs/diff";
import {
  STATUSES,
  WORK_TYPES,
  addApplication,
  applicationsCsv,
  deleteApplication,
  duplicateApplication,
  exportApplications,
  importApplications,
  updateApplication,
  useApplications,
  useJobsSaveError,
  type Application,
  type Status,
} from "@/lib/jobs/store";
import { seedDoc } from "@/lib/resume/seeds";
import { useStudio } from "@/lib/resume/store";
import type { ResumeDoc } from "@/lib/resume/types";

const PILL =
  "inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[12px] font-medium transition-colors disabled:opacity-50";
const DARK = `${PILL} bg-ink text-butter hover:bg-black`;
const OUTLINE = `${PILL} border border-ink/20 text-ink hover:border-ink hover:bg-white`;
const INPUT =
  "w-full rounded-lg border border-ink/15 bg-white px-3 py-2 text-[14px] text-ink outline-none focus:border-ink";
const LABEL = "block text-[11px] font-medium uppercase tracking-[0.12em] text-ink/55";

const STATUS_COLOR: Record<Status, string> = {
  Saved: "bg-ink/10 text-ink",
  Applied: "bg-[#dbe7f5] text-[#1e3a5f]",
  Screening: "bg-[#e6def0] text-[#4b2c5e]",
  Interviewing: "bg-[#fbe7c6] text-[#7a4a06]",
  Offer: "bg-[#d5efdc] text-[#1f6b3a]",
  Accepted: "bg-[#1f6b3a] text-white",
  Rejected: "bg-[#f6d8cf] text-[#a3330c]",
  Withdrawn: "bg-ink/10 text-ink/60",
  "No response": "bg-ink/5 text-ink/50",
};

const ACTIVE: Status[] = ["Applied", "Screening", "Interviewing", "Offer"];
const today = () => new Date().toLocaleDateString("en-CA");

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}

export function Applications() {
  const apps = useApplications();
  const saveError = useJobsSaveError();
  const [openId, setOpenId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"" | Status | "active">("");
  const [sort, setSort] = useState<"applied" | "updated" | "company" | "followup">("applied");
  const [msg, setMsg] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const list = useMemo(() => {
    if (!apps) return [];
    const q = query.trim().toLowerCase();
    const out = apps.filter((a) => {
      if (status === "active" && !ACTIVE.includes(a.status)) return false;
      if (status && status !== "active" && a.status !== status) return false;
      if (!q) return true;
      return [a.company, a.title, a.location, a.notes, a.description, a.source, a.contactName]
        .join(" ")
        .toLowerCase()
        .includes(q);
    });
    const by = {
      applied: (a: Application, b: Application) => b.appliedOn.localeCompare(a.appliedOn),
      updated: (a: Application, b: Application) => b.updatedAt.localeCompare(a.updatedAt),
      company: (a: Application, b: Application) => a.company.localeCompare(b.company),
      followup: (a: Application, b: Application) =>
        (a.followUpOn || "9999").localeCompare(b.followUpOn || "9999"),
    }[sort];
    return out.sort(by);
  }, [apps, query, status, sort]);

  const stats = useMemo(() => {
    const all = apps ?? [];
    const sent = all.filter((a) => a.status !== "Saved");
    const replied = sent.filter((a) => !["Applied", "No response"].includes(a.status));
    const weekAgo = new Date(Date.now() - 7 * 864e5).toLocaleDateString("en-CA");
    return {
      total: sent.length,
      week: sent.filter((a) => a.appliedOn >= weekAgo).length,
      active: all.filter((a) => ACTIVE.includes(a.status)).length,
      interviews: all.filter((a) => ["Interviewing", "Offer", "Accepted"].includes(a.status)).length,
      rate: sent.length ? Math.round((replied.length / sent.length) * 100) : 0,
      due: all.filter((a) => a.followUpOn && a.followUpOn <= today() && ACTIVE.includes(a.status)).length,
    };
  }, [apps]);

  const create = () => setOpenId(addApplication());

  const restore = async (input: HTMLInputElement) => {
    const file = input.files?.[0];
    input.value = "";
    if (!file) return;
    try {
      setMsg(`Imported ${plural(importApplications(await file.text()), "application")}.`);
    } catch (err) {
      setMsg(errorText(err));
    }
  };

  const open = apps?.find((a) => a.id === openId) ?? null;

  return (
    <div className="min-h-screen bg-butter text-ink">
      <TopBar>
        <Link href="/backoffice" className="rounded-full px-3 py-1.5 text-[12px] text-butter/70 hover:bg-white/10 hover:text-butter">
          Resumes
        </Link>
        <span className="rounded-full bg-white/10 px-3 py-1.5 text-[12px] text-butter">Applications</span>
      </TopBar>
      <main id="main" className="mx-auto max-w-[1500px] px-5 py-10 md:px-8 md:py-14">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="text-[11px] font-medium uppercase tracking-[0.16em] text-ink/55">Back office</p>
            <h1 className="mt-2 text-[clamp(2.2rem,5vw,4rem)] font-semibold leading-none tracking-tight">
              Applications
            </h1>
            <p className="mt-4 max-w-[62ch] text-[15px] leading-relaxed text-ink/70">
              Every job you applied to: when, where, the posting, the exact resume you sent, and what you
              changed in it compared with the standard version.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button className={DARK} onClick={create}>+ New application</button>
            <button className={OUTLINE} onClick={() => download(`applications-${today()}.csv`, applicationsCsv(list), "text/csv")}>
              Export CSV
            </button>
            <button className={OUTLINE} onClick={() => download(`applications-backup-${today()}.json`, exportApplications(), "application/json")}>
              Backup
            </button>
            <button className={OUTLINE} onClick={() => fileRef.current?.click()}>Restore backup</button>
            <input ref={fileRef} type="file" accept="application/json,.json" hidden onChange={(e) => restore(e.currentTarget)} />
          </div>
        </div>

        {(saveError || msg) && (
          <p className={`mt-6 text-[14px] ${saveError ? "text-[#a3330c]" : "text-ink/70"}`}>{saveError ?? msg}</p>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-6">
          {[
            ["Applied", stats.total],
            ["This week", stats.week],
            ["Active", stats.active],
            ["Interviews", stats.interviews],
            ["Response rate", `${stats.rate}%`],
            ["Follow-ups due", stats.due],
          ].map(([k, v]) => (
            <div key={k} className="rounded-2xl border border-ink/10 bg-white/60 p-4">
              <p className={LABEL}>{k}</p>
              <p className="mt-1 text-[26px] font-semibold">{v}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 flex flex-wrap gap-2">
          <input className={`${INPUT} max-w-xs`} placeholder="Search company, title, notes…" value={query} onChange={(e) => setQuery(e.target.value)} />
          <select className={`${INPUT} w-auto`} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="">All statuses</option>
            <option value="active">Active only</option>
            {STATUSES.map((s) => <option key={s}>{s}</option>)}
          </select>
          <select className={`${INPUT} w-auto`} value={sort} onChange={(e) => setSort(e.target.value as typeof sort)}>
            <option value="applied">Newest applied</option>
            <option value="updated">Recently edited</option>
            <option value="company">Company A–Z</option>
            <option value="followup">Next follow-up</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white/70">
          <table className="w-full min-w-[900px] text-left text-[14px]">
            <thead className="border-b border-ink/10">
              <tr className={LABEL}>
                {["Applied", "Company", "Job title", "Location", "Status", "Resume", "Follow up", ""].map((h) => (
                  <th key={h} className="px-4 py-3 font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {apps === null ? (
                <tr><td colSpan={8} className="px-4 py-8 text-ink/50">Loading…</td></tr>
              ) : list.length === 0 ? (
                <tr><td colSpan={8} className="px-4 py-8 text-ink/50">
                  {apps.length ? "Nothing matches those filters." : "No applications yet. Click New application to add your first."}
                </td></tr>
              ) : (
                list.map((a) => {
                  const due = a.followUpOn && a.followUpOn <= today() && ACTIVE.includes(a.status);
                  return (
                    <tr key={a.id} onClick={() => setOpenId(a.id)} className="cursor-pointer border-b border-ink/5 hover:bg-butter/60">
                      <td className="whitespace-nowrap px-4 py-3">{a.appliedOn || "—"}</td>
                      <td className="px-4 py-3 font-medium">{a.company || <span className="text-ink/40">Untitled</span>}</td>
                      <td className="px-4 py-3">
                        {a.title}
                        {a.link && (
                          <a href={a.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="ml-2 text-[12px] underline text-ink/50">
                            posting ↗
                          </a>
                        )}
                      </td>
                      <td className="px-4 py-3">{[a.location, a.workType].filter(Boolean).join(" · ")}</td>
                      <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-1 text-[12px] ${STATUS_COLOR[a.status]}`}>{a.status}</span></td>
                      <td className="px-4 py-3 text-[13px]">{a.resume ? a.resume.snapshot.name : <span className="text-ink/40">None</span>}</td>
                      <td className={`whitespace-nowrap px-4 py-3 ${due ? "font-semibold text-[#a3330c]" : ""}`}>{a.followUpOn}</td>
                      <td className="px-4 py-3 text-right text-ink/40">›</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </main>

      {open && <Drawer app={open} onClose={() => setOpenId(null)} onOpen={setOpenId} />}
    </div>
  );
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <label className={`block ${wide ? "md:col-span-2" : ""}`}>
      <span className={LABEL}>{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Drawer({ app, onClose, onOpen }: { app: Application; onClose: () => void; onOpen: (id: string) => void }) {
  const studio = useStudio();
  const set = (patch: Partial<Application>) => updateApplication(app.id, patch);
  const text = (key: keyof Application) => ({
    className: INPUT,
    value: app[key] as string,
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => set({ [key]: e.target.value }),
  });

  const attach = (value: string) => {
    if (!value) return set({ resume: null });
    const [docId, versionId] = value.split("|");
    const doc = studio?.resumes.find((d) => d.id === docId);
    if (!doc) return;
    const version = versionId ? studio?.versions[docId]?.find((v) => v.id === versionId) : null;
    const snapshot = structuredClone(version ? version.snapshot : doc);
    set({
      resume: {
        docId,
        versionId: versionId ?? "",
        label: version ? `${version.label} · ${formatWhen(version.createdAt)}` : "Current version",
        attachedAt: new Date().toISOString(),
        snapshot,
      },
      compareWith: app.compareWith || (doc.seed ? `seed:${doc.seed}` : ""),
    });
  };

  const base: ResumeDoc | null = useMemo(() => {
    const c = app.compareWith;
    if (!c) return null;
    if (c.startsWith("seed:")) return seedDoc(c.slice(5));
    return studio?.resumes.find((d) => d.id === c) ?? null;
  }, [app.compareWith, studio]);

  const diff = app.resume && base ? diffResumes(base, app.resume.snapshot) : null;
  const seeds = [...new Set((studio?.resumes ?? []).map((d) => d.seed).filter(Boolean))] as string[];

  return (
    <div className="fixed inset-0 z-40 flex justify-end bg-black/30" onClick={onClose}>
      <aside onClick={(e) => e.stopPropagation()} className="h-full w-full max-w-[860px] overflow-y-auto bg-butter p-6 shadow-2xl md:p-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className={LABEL}>Application</p>
            <h2 className="mt-1 text-[28px] font-semibold leading-tight">
              {app.title || "Job title"} <span className="text-ink/50">at</span> {app.company || "Company"}
            </h2>
            <p className="mt-1 text-[12px] text-ink/50">Added {formatWhen(app.createdAt)} · edited {formatWhen(app.updatedAt)} · saves as you type</p>
          </div>
          <button className={OUTLINE} onClick={onClose}>Close</button>
        </div>

        <section className="mt-6 grid gap-4 md:grid-cols-2">
          <Field label="Company"><input {...text("company")} /></Field>
          <Field label="Job title"><input {...text("title")} /></Field>
          <Field label="Link to posting" wide>
            <div className="flex gap-2">
              <input {...text("link")} placeholder="https://" />
              {app.link && <a className={OUTLINE} href={app.link} target="_blank" rel="noreferrer">Open ↗</a>}
            </div>
          </Field>
          <Field label="Location"><input {...text("location")} /></Field>
          <Field label="Work type">
            <select className={INPUT} value={app.workType} onChange={(e) => set({ workType: e.target.value as Application["workType"] })}>
              {WORK_TYPES.map((w) => <option key={w} value={w}>{w || "—"}</option>)}
            </select>
          </Field>
          <Field label="Date applied"><input type="date" {...text("appliedOn")} /></Field>
          <Field label="Status">
            <select className={INPUT} value={app.status} onChange={(e) => set({ status: e.target.value as Status })}>
              {STATUSES.map((s) => <option key={s}>{s}</option>)}
            </select>
          </Field>
          <Field label="Salary / pay range"><input {...text("salary")} placeholder="$70k–85k" /></Field>
          <Field label="Found on"><input {...text("source")} placeholder="LinkedIn, Indeed, referral…" /></Field>
          <Field label="Contact / recruiter"><input {...text("contactName")} /></Field>
          <Field label="Contact email"><input {...text("contactEmail")} /></Field>
          <Field label="Follow up on"><input type="date" {...text("followUpOn")} /></Field>
          <Field label="How much you want it">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} type="button" onClick={() => set({ interest: app.interest === n ? 0 : n })}
                  className={`text-[22px] ${n <= app.interest ? "text-ink" : "text-ink/20"}`} aria-label={`${n} of 5`}>★</button>
              ))}
            </div>
          </Field>
          <Field label="Job description" wide>
            <textarea {...text("description")} rows={8} placeholder="Paste the full posting. Listings get taken down." />
          </Field>
          <Field label="Notes" wide>
            <textarea {...text("notes")} rows={4} placeholder="Interview prep, who you talked to, questions to ask…" />
          </Field>
        </section>

        <section className="mt-8 rounded-2xl border border-ink/10 bg-white/60 p-5">
          <h3 className="text-[18px] font-semibold">Resume sent</h3>
          <p className="mt-1 text-[13px] text-ink/60">
            A copy is saved here as it was when attached, so later edits to the resume won&apos;t change this record.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Field label="Resume">
              <select className={INPUT} value={app.resume ? `${app.resume.docId}|${app.resume.versionId}` : ""} onChange={(e) => attach(e.target.value)}>
                <option value="">None</option>
                {app.resume && !studio?.resumes.some((d) => d.id === app.resume!.docId) && (
                  <option value={`${app.resume.docId}|${app.resume.versionId}`}>{app.resume.snapshot.name} (deleted)</option>
                )}
                {studio?.resumes.map((d) => (
                  <optgroup key={d.id} label={d.name}>
                    <option value={`${d.id}|`}>{d.name} — current</option>
                    {(studio.versions[d.id] ?? []).map((v) => (
                      <option key={v.id} value={`${d.id}|${v.id}`}>{d.name} — {v.label} · {formatWhen(v.createdAt)}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </Field>
            <Field label="Compare with (the standard)">
              <select className={INPUT} value={app.compareWith} onChange={(e) => set({ compareWith: e.target.value })}>
                <option value="">Nothing</option>
                {seeds.map((s) => <option key={s} value={`seed:${s}`}>Built-in standard: {seedDoc(s)?.name ?? s}</option>)}
                {studio?.resumes.map((d) => <option key={d.id} value={d.id}>Current: {d.name}</option>)}
              </select>
            </Field>
          </div>
          {app.resume && (
            <p className="mt-3 text-[13px] text-ink/60">
              Sent: <b>{app.resume.snapshot.name}</b> · {app.resume.label} · attached {formatWhen(app.resume.attachedAt)}
              {studio?.resumes.some((d) => d.id === app.resume!.docId) && (
                <> · <Link className="underline" href={`/backoffice/resumes/${encodeURIComponent(app.resume.docId)}`}>open resume</Link></>
              )}
            </p>
          )}

          {diff && (
            <div className="mt-5">
              <h4 className="text-[14px] font-semibold">Changes made for this job</h4>
              {diff.length === 0 ? (
                <p className="mt-2 text-[13px] text-ink/60">No changes. This is the same as the standard.</p>
              ) : (
                <div className="mt-2 space-y-3">
                  {diff.map((g) => (
                    <div key={g.where} className="rounded-xl border border-ink/10 bg-white p-3">
                      <p className={LABEL}>{g.where}</p>
                      <ul className="mt-2 space-y-1 text-[13px]">
                        {g.added.map((t, i) => <li key={`a${i}`} className="rounded bg-[#d5efdc] px-2 py-1 text-[#1f4d2c]">+ {t}</li>)}
                        {g.removed.map((t, i) => <li key={`r${i}`} className="rounded bg-[#f6d8cf] px-2 py-1 text-[#7a2609] line-through">− {t}</li>)}
                      </ul>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section className="mt-8">
          <h3 className="text-[18px] font-semibold">Status history</h3>
          <ol className="mt-2 space-y-1 text-[13px] text-ink/70">
            {[...app.history].reverse().map((h, i) => (
              <li key={i}><span className={`mr-2 rounded-full px-2 py-0.5 text-[12px] ${STATUS_COLOR[h.status]}`}>{h.status}</span>{formatWhen(h.at)}</li>
            ))}
          </ol>
        </section>

        <div className="mt-10 flex flex-wrap gap-2 border-t border-ink/10 pt-6">
          <button className={OUTLINE} onClick={() => { const id = duplicateApplication(app.id); if (id) onOpen(id); }}>Duplicate</button>
          <button className={`${PILL} border border-[#a3330c]/30 text-[#a3330c] hover:bg-[#f6d8cf]`}
            onClick={() => { if (confirm("Delete this application? This can't be undone.")) { deleteApplication(app.id); onClose(); } }}>
            Delete
          </button>
        </div>
      </aside>
    </div>
  );
}
