# Form Builder

A form builder that runs entirely in the browser. Design a form, fill it in, export a submission as a PDF.

Everything is stored in localStorage. There is no backend, no database, and no network request anywhere in the application.

React 19, TypeScript and Vite. No UI library, no state library, and no PDF library.

## Running it locally

You need Node 20.19+ or 22.12+, which is the floor for Vite 8.

```
npm install
npm run dev
```

The dev server prints a local URL.

## What it does

Templates is the home screen: a grid of every form you have made, oldest first, each showing its field count, how many responses it has, and when it was last modified.

The builder has three panes. A palette of field types on the left, the ordered list of fields in the middle, and the configuration panel for the selected field on the right. Click a palette entry to append it, or drag it to place it precisely. Save refuses while the form has no title or a field has no label, and clicking Save selects the first offender and puts the cursor in its label input. Preview opens the real fill experience in a modal.

Fill mode is the live form. Conditional logic shows and hides fields as you answer, calculations update on every keystroke, and validation runs on submit.

Responses lists every submission for a form, newest first, each with a re-download of its PDF. Opening one shows it read-only.

There are nine field types: single-line text, multi-line text, number, date, single select (radio, dropdown or tiles), multi select, file upload, section header, and calculation. Conditional logic is a cross-cutting capability available on all of them.

## The localStorage schema

Everything lives under one key.

```
form-builder:v1  ->  {
  version: 1,
  templates: [ ...FormTemplate ],
  instances: [ ...FormInstance ]
}
```

A template is `{ id, title, description, fields[], createdAt, updatedAt }`. Each field carries its own configuration plus three properties every field has: `conditions[]`, `defaultVisible` and `defaultRequired`.

A response is `{ id, templateId, templateTitle, fields[], values, visibleFieldIds, submittedAt }`.

### Why one key instead of a key per record

Writes are atomic. Saving a template or submitting a response can never leave the store half-updated, which matters because responses point at templates by id. With a key per record, a write interrupted between two keys leaves a store that contradicts itself, and there is nothing to repair it with.

The version lives in one place. A single `version` field gives you a migration path, where with a key per record every key needs its own stamp.

The dataset is small enough. File uploads store metadata only, so even a long history stays well inside the roughly 5 MB quota.

The trade-off is that every write re-serialises the whole document. At this scale that costs microseconds and buys atomicity. The improvements list says what changes past a few thousand responses.

### What is deliberately not stored

File contents. A file upload field records `{ name, size, type }` and nothing else. The bytes are never read, never serialised and never sent anywhere, so attaching a 2 GB video costs the same few hundred bytes as attaching a text file and can never exhaust the quota. The PDF says this plainly rather than implying you can get the file back.

A new form that was never saved. Opening the builder for a new form edits an in-memory draft, and storage first hears about it when Save is pressed. Abandoning the builder leaves nothing behind.

### Why a response snapshots the template

A response stores the field list and the template title as they were at submit time, not a reference to the live template. Editing a form tomorrow must not rewrite what someone submitted today. This is what makes re-downloading an old PDF reproduce it exactly.

`visibleFieldIds` is recorded alongside, so an export reproduces the visibility that applied when the response was submitted rather than re-evaluating today's rules against yesterday's answers.

## Key decisions

### Field types are plugins, not a switch

Every field type is a folder exporting a `FieldDefinition`: its metadata, a `createDefault`, a builder-side `ConfigEditor`, a filler-side `FillInput`, and a `formatValue` that turns a stored value into text.

A registry finds those folders with `import.meta.glob('./*/definition.ts')`, so nothing in the app enumerates the field types. The palette, the canvas, the config panel, the fill renderer, the preview and the PDF export all discover them.

Adding an eleventh type means touching two files. Add its config interface to the `FieldConfig` union in `src/types.ts`, and create `src/fields/<type>/` with a definition and the two components.

Two honest caveats. `validation.ts` has a switch per type, so rules derived from a field's own settings (min and max, allowed extensions) need a case added there, though the required check happens before the switch and is automatic. And `printModel.ts` has three type-specific spots: section headings, textarea line breaks, and the file attachment note. A new display-only type needs a branch; a normal input field needs none, because it is formatted by its own `formatValue`.

### Conditional logic

This is the most consequential part of the design and the part with the most decisions the spec left open.

Conditions are grouped by effect and each group is OR'd. A matching hide wins, otherwise a matching show, otherwise the field's `defaultVisible`, and the same shape applies to require. So OR within a group, the declared default when nothing matches, and a negative effect always outranking a positive one.

A strict AND across every condition was the alternative and it was rejected twice over. It cannot express "show this when X or Y" without duplicating rules, and it makes hide fail open: under AND a hide rule stops applying the moment any unrelated condition goes false, so a field the author explicitly hid comes back.

A show rule is the one effect that changes who decides, and only once it has something to go on. While the field it watches is empty there is nothing to match, so the declared default still applies. Once that field has an answer, the field is shown only while a rule matches.

Two invariants live here. A hidden field is never required, enforced in one place at the end of `resolveFieldStates` so no consumer can forget it, which is why a hidden field can never block submission or reach the stored response or the PDF. And an empty target matches nothing, so the defaults apply, which is what stops an untouched form lighting up every "does not equal" rule and vanishing its conditional fields before the user has typed anything.

Chained conditions are allowed, so a conditional field can watch another conditional field. Resolution is a depth-first walk with memoisation, resolving each target before judging a rule so a hidden target contributes nothing even if it holds a stale value. A dependency cycle cannot be resolved meaningfully, so a guard detects one and falls back to the field's declared defaults rather than looping.

### Component structure

The config panel owns what every field type has: the label, required, default visibility, and conditional logic. It hands the rest to the field's own `ConfigEditor`. A module therefore only describes what makes it different, and cannot ship a label input that behaves differently from every other one.

`FillForm` is the only field renderer. It resolves visibility for the whole form in one pass, since a condition can point at another conditional field and the resolution has to see the entire graph, then renders each field through its module. Fill mode and the builder's preview both mount this one component, so a preview cannot drift from the real thing: conditional visibility, calculated values, required markers and error messages all come from the same code path. The preview's only difference is that it stores nothing.

The builder edits a draft in component state and writes to storage only on Save. Reading through the store on every keystroke would fight the user for control of the input. A `beforeunload` guard catches closing the tab with unsaved work and arms only once there is something to lose. It does not catch in-app navigation, which is on the improvements list.

### Calculations

A calculation is always derived and read-only, recomputed on every render from the current values, which is what makes it track its sources live with no subscription or effect. Only number fields can be sources and another calculation never can, so there is no chain to resolve, a single pass suffices, and calculations stay out of the fixpoint treatment conditional logic needs.

Hidden and empty sources are excluded. A source hidden by conditional logic has no value to contribute, and counting it as zero would silently corrupt a sum while counting it as unset for an average would divide by a number the user cannot see.

With no participants the result is null, shown as a dash rather than zero, since a sum of nothing reading zero would imply somebody typed zeroes.

### PDF export

The document is rendered into `#print-root`, a node outside the React root that `index.html` provides. The print stylesheet hides it on screen, and under `@media print` it flips: the document appears and the rest of the app disappears. `window.print()` then hands the page to the browser, whose own Save as PDF produces the file. Nothing opens a popup, so pop-up blockers cannot get in the way, and the browser's print engine does the layout and font embedding instead of a library reimplementing both.

`src/lib/printModel.ts` decides what appears, separately from the markup that renders it: only fields visible at submit time, in form order, section headers preserved as headings, values formatted by each field's own `formatValue` so an option shows its human label rather than its internal id, multi-line answers keeping their line breaks, and a note explaining that attachments are listed by name and size only.

The screen version of a saved response renders from the same model, so what you read on screen and what comes out of the printer cannot disagree.

### State

`lib/store.ts` is a small observable over localStorage, and `useSyncExternalStore` puts React on it. Writes are rare, atomic, and every consumer should see them, so this is the one piece of shared state that is not component state. It also means no state library.

### Routing

Hash routing, so refreshing a deep link works on any static host. Nothing on a static host rewrites a path back to `index.html`, but everything after the `#` never reaches the server anyway. Every URL the app can produce lives in `src/routes.ts` as one object of functions, so a path is never spelled out as a string at a call site and `<Link to={paths.builder(id)}>` stays compiler-checked.

### Styling

Plain CSS files, imported by the component that owns them, over design tokens in `index.css`. The tokens give you one place to change colour, radius, shadow and type scale, and they carry a dark mode block.


## Type safety

The field model is a discriminated union on `type`, and that one choice carries the whole design. Any `switch (field.type)` narrows to the exact config shape, so reading `field.rows` on a text field is a compile error instead of a runtime surprise. The project builds with `strict`, `noUnusedLocals`, `noUnusedParameters`, `verbatimModuleSyntax` and `erasableSyntaxOnly` on, and there is no `any`, no `@ts-ignore` and no `@ts-expect-error` anywhere in `src`.

## What I would improve with more time

Unit tests for `lib/`. Every engine is already a pure function over plain data, which is why the harness above was quick to write. Making that permanent, with a runner and property-based tests for the condition resolver, is the biggest gap by far.

Undo and redo in the builder. The draft is already a single immutable object, so this is a history stack and two buttons away, and deleting a field that other rules point at is exactly the kind of action that wants an undo.

Draft autosave to sessionStorage with an offer to restore on return. The `beforeunload` guard warns, but the work is still lost, and it does not fire for in-app navigation at all.

Accessibility polish: focus trapping in the modal, announcing fields that appear or disappear as conditional logic fires (today that change is visual only), and a per-dialog close label, since the modal hard-codes one and every confirmation currently announces the wrong thing to a screen reader.

The list features a real user would ask for next: search, duplication and folder structure.