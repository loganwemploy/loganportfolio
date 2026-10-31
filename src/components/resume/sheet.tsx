"use client";

import { createContext, Fragment, use, useLayoutEffect, useMemo, useRef, type CSSProperties, type ReactNode } from "react";
import { packContacts, RIGHT_COLUMN } from "@/lib/resume/layout";
import { CONTACT_SEP, metrics, type Metrics } from "@/lib/resume/metrics";
import {
  blankBullet,
  blankChild,
  canMove,
  childKey,
  insertInto,
  listKind,
  moveBy,
  moveItem,
  removeFrom,
  setText,
  type ItemKind,
} from "@/lib/resume/ops";
import { clean, type Measure } from "@/lib/resume/text";
import type { Entry, ResumeDoc, Section } from "@/lib/resume/types";

/*
 * The resume page. In the editor every line is editable in place and every
 * item can be dragged; on the hub the same component draws a read-only
 * preview. Sizes come from the PDF metrics in pt, so text wraps the same way
 * it does in the downloaded file.
 */

/* ---------- editing API, supplied by the editor ---------- */

export type Recipe = (draft: ResumeDoc) => void | boolean;
/** Applies a change. Changes with the same `mergeKey` in quick succession undo as one step. */
export type Change = (recipe: Recipe, mergeKey?: string) => void;
export type DragItem = { key: string; id: string; kind: ItemKind };
export type DropTarget = { key: string; index: number };

export type EditApi = {
  change: Change;
  /** The item being dragged, if any. */
  drag: DragItem | null;
  /** Set a moment after a drag starts, so the drag image isn't faded. */
  dimmed: string | null;
  drop: DropTarget | null;
  startDrag: (item: DragItem) => void;
  endDrag: () => void;
  setDrop: (drop: DropTarget | null) => void;
};

type SheetCtx = {
  edit: EditApi | null;
  m: Metrics;
  measure: Measure | null;
  breaks: ReadonlyMap<string, number> | null;
};

const SheetContext = createContext<SheetCtx | null>(null);

function useSheet(): SheetCtx {
  const ctx = use(SheetContext);
  if (!ctx) throw new Error("Resume sheet parts must be rendered inside <Sheet>.");
  return ctx;
}

const DRAG_TYPE = "application/x-resume-item";
const ARROWS: Record<string, number> = { ArrowUp: -1, ArrowLeft: -1, ArrowDown: 1, ArrowRight: 1 };

/* ---------- focus helpers ---------- */

/** Focuses an editable field (`<itemId>:<field>`) after the next render, caret at the end. */
export function focusField(field: string) {
  requestAnimationFrame(() => {
    const el = document.querySelector<HTMLElement>(`[data-field="${CSS.escape(field)}"]`);
    if (!el) return;
    el.focus();
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  });
}

function focusHandle(id: string) {
  requestAnimationFrame(() => {
    document.querySelector<HTMLElement>(`[data-handle="${CSS.escape(id)}"]`)?.focus();
  });
}

/** The first field of a section's first item, for focusing after adding it. */
export function firstField(section: Section): string | null {
  switch (section.kind) {
    case "summary":
      return section.paragraphs[0] ? `${section.paragraphs[0].id}:text` : null;
    case "list":
      return section.items[0] ? `${section.items[0].id}:text` : null;
    case "skills":
      return section.rows[0] ? `${section.rows[0].id}:label` : null;
    case "entries":
      return section.entries[0] ? `${section.entries[0].id}:title` : null;
  }
}

/* ---------- the page ---------- */

const pt = (n: number) => `${n}pt`;

function sheetStyle(m: Metrics): CSSProperties {
  return {
    "--m": pt(m.margin),
    "--lh": String(m.lineHeight),
    "--name-lh": String(m.nameLineHeight),
    "--s-name": pt(m.size.name),
    "--s-headline": pt(m.size.headline),
    "--s-contact": pt(m.size.contact),
    "--s-heading": pt(m.size.heading),
    "--s-title": pt(m.size.title),
    "--s-body": pt(m.size.body),
    "--s-meta": pt(m.size.meta),
    "--g-headline": pt(m.gap.headline),
    "--g-contacts": pt(m.gap.contacts),
    "--g-header": pt(m.gap.header),
    "--g-section": pt(m.gap.section),
    "--g-heading": pt(m.gap.heading),
    "--g-entry": pt(m.gap.entry),
    "--g-bullet": pt(m.gap.bullet),
    "--g-para": pt(m.gap.para),
    "--rule-pad": pt(m.rule.pad),
    "--rule-w": pt(m.rule.width),
    "--track": `${m.tracking}em`,
    "--b-indent": pt(m.bulletIndent),
    "--b-x": pt(m.bulletX),
    "--col-gap": pt(m.columnGap),
    "--right-max": `${RIGHT_COLUMN * 100}%`,
    "--c-text": m.color.text,
    "--c-muted": m.color.muted,
    "--c-accent": m.color.accent,
    "--c-rule": m.color.rule,
  } as CSSProperties;
}

type SheetProps = {
  doc: ResumeDoc;
  /** Omit for a read-only preview. */
  edit?: EditApi | null;
  /** Font measurer, used to break contact lines exactly where the PDF does. */
  measure?: Measure | null;
  /** Block id → page number, for the "page N starts here" markers. */
  breaks?: ReadonlyMap<string, number> | null;
};

export function Sheet({ doc, edit = null, measure = null, breaks = null }: SheetProps) {
  const m = metrics(doc.theme);
  // Previews match the PDF, which leaves hidden sections out.
  const sections = edit ? doc.sections : doc.sections.filter((s) => !s.hidden);

  return (
    <SheetContext value={{ edit, m, measure, breaks }}>
      <article
        className="sheet"
        data-font={doc.theme.font}
        style={sheetStyle(m)}
        aria-label={`${doc.name} resume`}
      >
        <HeaderView doc={doc} />
        <SortableList
          listKey="sections"
          noun="section"
          className="r-sections"
          items={sections}
          hidden={(s) => !!s.hidden}
          render={(s) => <SectionView section={s} />}
          tools={edit ? (s) => <SectionTools edit={edit} section={s} /> : undefined}
          empty={
            edit ? <p className="empty-note">No sections yet. Add one from the panel on the right.</p> : undefined
          }
        />
      </article>
    </SheetContext>
  );
}

/* ---------- editable text ---------- */

type FieldProps = {
  value: string;
  placeholder: string;
  className?: string;
  /** `<itemId>:<field>`, used to focus the field. */
  field: string;
  onChange?: (value: string) => void;
  onEnter?: () => void;
  onBackspaceEmpty?: () => void;
};

function Field(props: FieldProps) {
  if (!props.onChange) return <span className={props.className}>{props.value}</span>;
  return <LiveField {...props} onChange={props.onChange} />;
}

/**
 * Plain-text contentEditable. React never renders its children: the text is
 * written to the DOM only when the value changes from outside (undo, restore),
 * so typing never moves the caret.
 */
function LiveField({
  value,
  placeholder,
  className,
  field,
  onChange,
  onEnter,
  onBackspaceEmpty,
}: FieldProps & { onChange: (value: string) => void }) {
  const ref = useRef<HTMLSpanElement>(null);
  const shown = useRef<string | null>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || value === shown.current) return;
    el.textContent = value;
    shown.current = value;
  }, [value]);

  return (
    <span
      ref={ref}
      className={className ? `field ${className}` : "field"}
      contentEditable="plaintext-only"
      suppressContentEditableWarning
      role="textbox"
      aria-label={placeholder}
      data-placeholder={placeholder}
      data-field={field}
      spellCheck
      onInput={(e) => {
        const el = e.currentTarget;
        // Browsers can leave a stray <br> behind when the last character is deleted.
        if (!el.textContent && el.firstChild) el.replaceChildren();
        const text = (el.textContent ?? "").replace(/[ \r\n\t]/g, " ");
        shown.current = text;
        onChange(text);
      }}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          if (!e.nativeEvent.isComposing) onEnter?.();
        } else if (e.key === "Backspace" && onBackspaceEmpty && !e.currentTarget.textContent) {
          e.preventDefault();
          onBackspaceEmpty();
        } else if (e.key === "Escape") {
          e.currentTarget.blur();
        }
      }}
    />
  );
}

function addText(edit: EditApi, key: string, index: number) {
  const item = blankBullet();
  edit.change((d) => insertInto(d, key, index, item));
  focusField(`${item.id}:text`);
}

/** Typing, Enter (new line after) and Backspace-when-empty (remove) for one-line text items. */
function textProps(
  edit: EditApi | null,
  key: string,
  items: readonly { id: string }[],
  index: number,
): Pick<FieldProps, "onChange" | "onEnter" | "onBackspaceEmpty"> {
  if (!edit) return {};
  const id = items[index].id;
  return {
    onChange: (value) => edit.change((d) => setText(d, key, id, "text", value), `${id}:text`),
    onEnter: () => addText(edit, key, index + 1),
    onBackspaceEmpty: () => {
      const neighbor = items[index - 1] ?? items[index + 1];
      edit.change((d) => removeFrom(d, key, id) >= 0);
      if (neighbor) focusField(`${neighbor.id}:text`);
    },
  };
}

/* ---------- drag and drop ---------- */

type ListProps<T extends { id: string }> = {
  /** Which list this is, in ops.ts terms ("sections", "bullets:<entryId>"…). */
  listKey: string;
  items: readonly T[];
  /** What one item is called, for screen readers. */
  noun: string;
  className?: string;
  axis?: "x" | "y";
  render: (item: T, index: number) => ReactNode;
  /** Rendered just before an item, outside it (separators, line breaks). */
  before?: (item: T, index: number) => ReactNode;
  tools?: (item: T, index: number) => ReactNode;
  hidden?: (item: T) => boolean;
  /** Shown in the editor when the list is empty; also where items can be dropped. */
  empty?: ReactNode;
};

function SortableList<T extends { id: string }>({
  listKey,
  items,
  noun,
  className,
  axis = "y",
  render,
  before,
  tools,
  hidden,
  empty,
}: ListProps<T>) {
  const { edit } = useSheet();
  const ref = useRef<HTMLDivElement>(null);

  if (!edit) {
    return (
      <div className={className} data-list={listKey}>
        {items.map((item, i) => (
          <Fragment key={item.id}>
            {before?.(item, i)}
            <div className="item">{render(item, i)}</div>
          </Fragment>
        ))}
      </div>
    );
  }

  const kind = listKind(listKey) ?? "bullet";
  const accepted = () => (edit.drag && canMove(edit.drag.kind, kind) ? edit.drag : null);
  const at = edit.drop?.key === listKey ? edit.drop.index : -1;

  /** Insertion point under the pointer, in the list as it is now. */
  const indexAt = (x: number, y: number) => {
    const nodes = Array.from(ref.current?.children ?? []).filter(
      (c): c is HTMLElement => c instanceof HTMLElement && c.dataset.item !== undefined,
    );
    for (let i = 0; i < nodes.length; i++) {
      const rects = nodes[i].getClientRects();
      const r = rects[rects.length - 1] ?? nodes[i].getBoundingClientRect();
      if (axis === "y") {
        if (y < r.top + r.height / 2) return i;
      } else {
        if (y < r.top) return i;
        if (y <= r.bottom && x < r.left + r.width / 2) return i;
      }
    }
    return nodes.length;
  };

  return (
    <div
      ref={ref}
      className={className}
      data-list={listKey}
      onDragOver={(e) => {
        // Lists that can't take the dragged item let the event reach their parent list.
        if (!accepted()) return;
        e.preventDefault();
        e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        const index = indexAt(e.clientX, e.clientY);
        if (index !== at) edit.setDrop({ key: listKey, index });
      }}
      onDragLeave={(e) => {
        if (at >= 0 && !ref.current?.contains(e.relatedTarget as Node | null)) edit.setDrop(null);
      }}
      onDrop={(e) => {
        const drag = accepted();
        if (!drag) return;
        e.preventDefault();
        e.stopPropagation();
        const index = indexAt(e.clientX, e.clientY);
        edit.endDrag();
        edit.change((d) => moveItem(d, drag.key, drag.id, listKey, index));
      }}
    >
      {items.map((item, i) => (
        <Fragment key={item.id}>
          {before?.(item, i)}
          <div
            data-item={item.id}
            className={edit.dimmed === item.id ? "item is-dragging" : "item"}
            data-hidden={hidden?.(item) ? "" : undefined}
            data-drop={
              at === i ? "before" : at === items.length && i === items.length - 1 ? "after" : undefined
            }
          >
            <Handle edit={edit} listKey={listKey} id={item.id} kind={kind} noun={noun} />
            {tools && <span className="gutter">{tools(item, i)}</span>}
            {render(item, i)}
          </div>
        </Fragment>
      ))}
      {!items.length && empty && (
        <div className="empty-slot" data-drop={at === 0 ? "before" : undefined}>
          {empty}
        </div>
      )}
    </div>
  );
}

function Handle({
  edit,
  listKey,
  id,
  kind,
  noun,
}: {
  edit: EditApi;
  listKey: string;
  id: string;
  kind: ItemKind;
  noun: string;
}) {
  return (
    <button
      type="button"
      className="handle"
      draggable
      data-handle={id}
      title="Drag to move (or focus and use the arrow keys)"
      aria-label={`Move ${noun}. Drag, or press the arrow keys.`}
      onDragStart={(e) => {
        const row = e.currentTarget.closest<HTMLElement>("[data-item]");
        e.dataTransfer.effectAllowed = "move";
        // A private type, so text fields don't accept the drop as pasted text.
        e.dataTransfer.setData(DRAG_TYPE, id);
        if (row) {
          const r = row.getBoundingClientRect();
          e.dataTransfer.setDragImage(row, e.clientX - r.left, e.clientY - r.top);
        }
        edit.startDrag({ key: listKey, id, kind });
      }}
      onDragEnd={edit.endDrag}
      onKeyDown={(e) => {
        const delta = ARROWS[e.key];
        if (!delta) return;
        e.preventDefault();
        edit.change((d) => moveBy(d, listKey, id, delta));
        focusHandle(id);
      }}
    >
      <GripIcon />
    </button>
  );
}

/* ---------- small controls ---------- */

function Tool({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" className="tool" title={label} aria-label={label} onClick={onClick}>
      {children}
    </button>
  );
}

function AddButton({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="add-btn" onClick={onClick}>
      <PlusIcon /> {label}
    </button>
  );
}

function PageMark({ id }: { id: string }) {
  const page = useSheet().breaks?.get(id);
  return page ? <span className="page-mark" data-page={page} aria-hidden="true" /> : null;
}

const CHILD_NOUN: Record<Section["kind"], string> = {
  summary: "paragraph",
  entries: "entry",
  skills: "skill row",
  list: "item",
};

function addChild(edit: EditApi, section: Section) {
  const child = blankChild(section);
  edit.change((d) => insertInto(d, childKey(section), Number.MAX_SAFE_INTEGER, child));
  const field = section.kind === "entries" ? "title" : section.kind === "skills" ? "label" : "text";
  focusField(`${child.id}:${field}`);
}

function SectionTools({ edit, section }: { edit: EditApi; section: Section }) {
  return (
    <>
      <Tool label={`Add ${CHILD_NOUN[section.kind]}`} onClick={() => addChild(edit, section)}>
        <PlusIcon />
      </Tool>
      <Tool
        label={section.hidden ? "Show in the PDF" : "Hide from the PDF"}
        onClick={() =>
          edit.change((d) => {
            const s = d.sections.find((x) => x.id === section.id);
            if (!s) return false;
            if (s.hidden) delete s.hidden;
            else s.hidden = true;
          })
        }
      >
        {section.hidden ? <EyeOffIcon /> : <EyeIcon />}
      </Tool>
      <Tool label="Delete section" onClick={() => edit.change((d) => removeFrom(d, "sections", section.id) >= 0)}>
        <XIcon />
      </Tool>
    </>
  );
}

function RemoveTool({ noun, onClick }: { noun: string; onClick: () => void }) {
  return (
    <Tool label={`Delete ${noun}`} onClick={onClick}>
      <XIcon />
    </Tool>
  );
}

/* ---------- header ---------- */

function HeaderView({ doc }: { doc: ResumeDoc }) {
  const { edit, m, measure } = useSheet();
  const { contacts } = doc.header;
  const size = m.size.contact;
  const width = m.width;

  // Break contact lines where the PDF does, so a wrap never splits "Tampa Bay Area, FL".
  const lineStarts = useMemo(() => {
    const starts = new Set<string>();
    if (!measure) return starts;
    const filled = contacts.map((c) => ({ id: c.id, text: clean(c.text) })).filter((c) => c.text);
    const lines = packContacts(
      measure,
      filled.map((c) => c.text),
      size,
      width,
    );
    for (const line of lines.slice(1)) starts.add(filled[line.items[0]].id);
    return starts;
  }, [contacts, measure, size, width]);

  const setHeader = (field: "name" | "headline") =>
    edit
      ? (value: string) =>
          edit.change((d) => {
            if (d.header[field] === value) return false;
            d.header[field] = value;
          }, `header:${field}`)
      : undefined;

  const first = contacts[0];

  return (
    <header className="r-header" data-align={m.align}>
      <Field
        value={doc.header.name}
        placeholder="Your name"
        className="r-name"
        field="header:name"
        onChange={setHeader("name")}
        onEnter={edit ? () => focusField("header:headline") : undefined}
      />
      <Field
        value={doc.header.headline}
        placeholder="Headline: the role you're going for"
        className="r-headline"
        field="header:headline"
        onChange={setHeader("headline")}
        onEnter={edit && first ? () => focusField(`${first.id}:text`) : undefined}
      />
      <div className="r-contacts-wrap item">
        <SortableList
          listKey="contacts"
          noun="contact"
          axis="x"
          className="r-contacts"
          items={contacts}
          before={(c, i) =>
            i === 0 ? null : lineStarts.has(c.id) ? <br /> : <span className="r-sep">{CONTACT_SEP}</span>
          }
          render={(c, i) => (
            <Field
              value={c.text}
              placeholder="Phone, email, city or link"
              className="r-contact"
              field={`${c.id}:text`}
              {...textProps(edit, "contacts", contacts, i)}
            />
          )}
          tools={
            edit
              ? (c) => (
                  <RemoveTool noun="contact" onClick={() => edit.change((d) => removeFrom(d, "contacts", c.id) >= 0)} />
                )
              : undefined
          }
          empty={edit ? <AddButton label="Add contact" onClick={() => addText(edit, "contacts", 0)} /> : undefined}
        />
        {edit && (
          <span className="gutter">
            <Tool label="Add contact" onClick={() => addText(edit, "contacts", contacts.length)}>
              <PlusIcon />
            </Tool>
          </span>
        )}
      </div>
    </header>
  );
}

/* ---------- sections ---------- */

function SectionView({ section }: { section: Section }) {
  const { edit } = useSheet();
  const next = firstField(section);

  return (
    <>
      <div className="r-heading">
        <PageMark id={section.id} />
        <Field
          value={section.title}
          placeholder="Section title"
          className="r-heading-text"
          field={`${section.id}:title`}
          onChange={
            edit
              ? (v) => edit.change((d) => setText(d, "sections", section.id, "title", v), `${section.id}:title`)
              : undefined
          }
          onEnter={edit ? () => (next ? focusField(next) : addChild(edit, section)) : undefined}
        />
        {edit && section.hidden && <span className="r-badge">Hidden from PDF</span>}
      </div>
      <SectionBody section={section} />
    </>
  );
}

function SectionBody({ section }: { section: Section }) {
  const { edit } = useSheet();
  const key = childKey(section);
  const noun = CHILD_NOUN[section.kind];
  const empty = edit ? <AddButton label={`Add ${noun}`} onClick={() => addChild(edit, section)} /> : undefined;
  const remove = edit
    ? (item: { id: string }) => (
        <RemoveTool noun={noun} onClick={() => edit.change((d) => removeFrom(d, key, item.id) >= 0)} />
      )
    : undefined;

  switch (section.kind) {
    case "summary":
      return (
        <SortableList
          listKey={key}
          noun={noun}
          className="r-children"
          items={section.paragraphs}
          tools={remove}
          empty={empty}
          render={(p, i) => (
            <>
              <PageMark id={p.id} />
              <Field
                value={p.text}
                placeholder="Write a short paragraph"
                className="r-para"
                field={`${p.id}:text`}
                {...textProps(edit, key, section.paragraphs, i)}
              />
            </>
          )}
        />
      );

    case "list":
      return (
        <SortableList
          listKey={key}
          noun={noun}
          className="r-children"
          items={section.items}
          tools={remove}
          empty={empty}
          render={(item, i) => (
            <>
              <PageMark id={item.id} />
              <div className="r-bullet">
                <Field
                  value={item.text}
                  placeholder="List item"
                  field={`${item.id}:text`}
                  {...textProps(edit, key, section.items, i)}
                />
              </div>
            </>
          )}
        />
      );

    case "skills":
      return (
        <SortableList
          listKey={key}
          noun={noun}
          className="r-children"
          items={section.rows}
          tools={remove}
          empty={empty}
          render={(row, i) => {
            const set = (field: "label" | "value") =>
              edit
                ? (v: string) => edit.change((d) => setText(d, key, row.id, field, v), `${row.id}:${field}`)
                : undefined;
            return (
              <>
                <PageMark id={row.id} />
                <div className="r-skill">
                  <Field
                    value={row.label}
                    placeholder="Label"
                    className="r-skill-label"
                    field={`${row.id}:label`}
                    onChange={set("label")}
                    onEnter={edit ? () => focusField(`${row.id}:value`) : undefined}
                  />
                  {(edit || clean(row.label)) && <span className="r-skill-label">:</span>}{" "}
                  <Field
                    value={row.value}
                    placeholder="Skills, separated by commas"
                    field={`${row.id}:value`}
                    onChange={set("value")}
                    onEnter={
                      edit
                        ? () => {
                            const fresh = blankChild(section);
                            edit.change((d) => insertInto(d, key, i + 1, fresh));
                            focusField(`${fresh.id}:label`);
                          }
                        : undefined
                    }
                  />
                </div>
              </>
            );
          }}
        />
      );

    case "entries":
      return (
        <SortableList
          listKey={key}
          noun={noun}
          className="r-children"
          items={section.entries}
          empty={empty}
          tools={
            edit
              ? (entry) => (
                  <>
                    <Tool label="Add bullet" onClick={() => addText(edit, `bullets:${entry.id}`, entry.bullets.length)}>
                      <PlusIcon />
                    </Tool>
                    <RemoveTool
                      noun="entry"
                      onClick={() => edit.change((d) => removeFrom(d, key, entry.id) >= 0)}
                    />
                  </>
                )
              : undefined
          }
          render={(entry) => <EntryView listKey={key} entry={entry} />}
        />
      );
  }
}

function EntryView({ listKey, entry }: { listKey: string; entry: Entry }) {
  const { edit } = useSheet();
  const key = `bullets:${entry.id}`;
  const firstBullet = entry.bullets[0];

  const field = (name: "title" | "org" | "dates" | "location", placeholder: string, next: string | null, className?: string) => (
    <Field
      value={entry[name]}
      placeholder={placeholder}
      className={className}
      field={`${entry.id}:${name}`}
      onChange={
        edit
          ? (v) => edit.change((d) => setText(d, listKey, entry.id, name, v), `${entry.id}:${name}`)
          : undefined
      }
      onEnter={
        edit
          ? () => {
              if (next) focusField(next);
              else if (firstBullet) focusField(`${firstBullet.id}:text`);
              else addText(edit, key, 0);
            }
          : undefined
      }
    />
  );

  // The PDF skips a row when both of its sides are empty; the editor keeps them to type into.
  const top = edit || clean(entry.title) || clean(entry.dates);
  const meta = edit || clean(entry.org) || clean(entry.location);

  return (
    <>
      <div className="r-head">
        <PageMark id={entry.id} />
        {top && (
          <div className="r-row">
            <div className="r-left">{field("title", "Job title or project", `${entry.id}:dates`, "r-title")}</div>
            <div className="r-right">{field("dates", "Dates", `${entry.id}:org`)}</div>
          </div>
        )}
        {meta && (
          <div className="r-row">
            <div className="r-left">{field("org", "Company, or what it is", `${entry.id}:location`, "r-org")}</div>
            <div className="r-right">{field("location", "Location or link", null)}</div>
          </div>
        )}
      </div>
      <SortableList
        listKey={key}
        noun="bullet"
        className="r-bullets"
        items={entry.bullets}
        tools={
          edit
            ? (b) => <RemoveTool noun="bullet" onClick={() => edit.change((d) => removeFrom(d, key, b.id) >= 0)} />
            : undefined
        }
        empty={edit ? <AddButton label="Add bullet" onClick={() => addText(edit, key, 0)} /> : undefined}
        render={(b, i) => (
          <>
            <PageMark id={b.id} />
            <div className="r-bullet">
              <Field
                value={b.text}
                placeholder="What you did, and what changed because of it"
                field={`${b.id}:text`}
                {...textProps(edit, key, entry.bullets, i)}
              />
            </div>
          </>
        )}
      />
    </>
  );
}

/* ---------- icons ---------- */

const line = {
  viewBox: "0 0 16 16",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

function PlusIcon() {
  return (
    <svg {...line}>
      <path d="M8 3v10M3 8h10" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg {...line}>
      <path d="m4 4 8 8M12 4l-8 8" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg {...line}>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <circle cx="8" cy="8" r="2" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg {...line}>
      <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" />
      <path d="m2.5 2.5 11 11" />
    </svg>
  );
}

function GripIcon() {
  return (
    <svg viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
      {[4, 8, 12].map((y) => (
        <Fragment key={y}>
          <circle cx="6" cy={y} r="1.25" />
          <circle cx="10" cy={y} r="1.25" />
        </Fragment>
      ))}
    </svg>
  );
}
