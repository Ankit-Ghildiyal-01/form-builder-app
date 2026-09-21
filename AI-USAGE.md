# AI usage log

Below are the seven prompts that shaped the architecture, each with a short note on what it was for and what it settled. After them come three sections with more detail: what I checked before trusting the output, what I rejected and why, and the places where the AI looked right and was not.

## The prompts that drove the build

### 1. Design before code

> Here is the spec. Before any code, propose the component structure for the field types and the algorithm for conditional logic. Flag everything ambiguous and give me the trade-off for each. Do not pick silently.

I wanted the trade-offs out in the open while they were still cheap to argue with, not a recommendation. It settled three things I have not had to revisit since: the discriminated union on `type`, one folder per field type behind a `FieldDefinition` contract, and discovery through `import.meta.glob` so nothing enumerates the types. I checked the contract actually held by building one module against it end to end before anything else, and that is what made the other eight safe to run in parallel.

### 2. Deciding how the PDF gets made

> The spec bans third-party PDF libraries, so treat that as fixed rather than something to negotiate. Given that constraint, lay out the library-free ways to produce a PDF: print-to-PDF through a print stylesheet, rasterising the DOM to a canvas and embedding the image, or writing the PDF's byte stream by hand. Tell me what each costs in output quality and code, and what a library would have given me that I am now doing without.

The constraint takes the obvious answer off the table, so I wanted a straight comparison of what was left and a clear account of what the ban costs. Print-to-PDF won on output quality: selectable text, real page breaks, embedded fonts, file size proportional to content. I kept the separate `printModel.ts` it proposed, and that is what later let the screen view and the printed view render from one source, so the two cannot disagree.

### 3. Building the eight field types in parallel

> Implement the remaining eight field types. Here is the contract in `src/fields/types.ts` and a complete exemplar in `src/fields/text/`. Do not modify shared files. If you think a shared file is wrong, report it, do not change it.

Once the contract and one real module existed, the eight types really were independent of each other, so running them in parallel was about speed rather than coordination. Giving every agent the same working example instead of a description is what made their shared mistake obvious, instead of looking like eight unrelated ones. All eight hit the same compile error and I threw out all eight of their fixes, which is written up below.

### 4. The rule that looked like it worked

> A "show this field" rule is not working. The field is visible by default and the rule says show it when an option equals Option 1. Select only Option 2 and the field is still visible.

I do not take a bug report at face value, so I asked for the mechanism rather than a patch. What came back got the cause right and the fix wrong, twice. Both rejected fixes are written up below, along with what shipped.

### 5. Verifying the engines against the spec

> Verify the engines against every hard requirement in the spec: chained conditions, cycles, self-reference, empty targets, hidden never required, hidden values never stored, every operator for every target type, and calculations excluding hidden sources.

The engines are pure functions over plain data, which was decided in the first prompt, and that is what made them cheap to test. A 116-assertion harness ran against the real modules rather than copies, and grew to 169 later. The first run reported about 20 failures and every one was my harness, not the app. The one real bug it caught is written up below.

### 6. Simplifying, and refusing to save a nameless form

> First, the builder must refuse to save when a field label is missing; today it shows the error and saves anyway. Second, the codebase feels too complex. Simplify it without compromising strict types, without changing the UI or behaviour, and without over-simplifying.

The second half is not something you can act on directly, so I read the code before touching it. The complexity turned out to be duplication rather than structure: a `hooks/` folder wrapping the store, a `resolve.ts` beside a `calculation.ts` that existed only to call it, and a `FieldHost.tsx` with two three-line exports and one caller each. The codebase was over-abstracted, which meant every real fix was a merge or a deletion.

### 7. Moving routing onto a library

> Replace the hand-written route matcher with react-router-dom. Keep every current URL working, including the fallbacks: a bare template id and an unknown trailing segment both open the builder, and anything unrecognised lands on the list.

A deliberate reversal. I wrote the matcher myself to avoid a dependency, then found myself maintaining fallback behaviour a library already gets right. Routing changes are the kind that look fine and quietly break deep links, so I set the bar at nothing a user could notice changing, and proved it with assertions before accepting the migration.

## What I verified before using the AI output

I did not take an agent's word for anything. Every claim got checked against something that could prove it wrong before I used the output.

The routing migration is a good example. It compiled and every URL looked right in the route table, but that is not proof the deep links still resolve. So before accepting it I tested it myself, with assertions over the route table and hash mode: a deep link to the fill page resolves on load, and generated links keep the `#/` form.

## What I rejected, and why

The biggest one was strict AND for conditional logic. Under AND a hide rule stops applying the moment any unrelated condition goes false, so a field the author explicitly hid comes back, and "show when X or Y" requires duplicating rules. I went with OR within an effect group instead, negative wins, declared default otherwise, and wrote the rule down.

All eight agents fixed the `defineField` inference problem inside their own folder, in eight different ways, each with a comment explaining why. Every one of those fixes worked, and every one got reverted. The right fix was one line at the call site. Letting eight separate workarounds stand is exactly the drift the shared contract was meant to prevent.

Two conditional-logic fixes I threw out completely. Putting the rule in the config editor is the wrong layer, because it fixes new rules and quietly misses the ones already saved. Hiding the field until a rule matches hangs together and compiles, but it turns on every conditional field on a form nobody has filled in yet, which is worse than the bug I was fixing.

I also had the store rewritten off `useSyncExternalStore` and then backed it out. The replacement worked and passed 36 assertions, but it bought nothing the current mechanism does not already do, and the snapshot identity every consumer depends on would have needed the same notes written again. Backing it out was cheaper than owning a second design.

## Where the AI was plausible but incorrect

These are the three that mattered. All three compile, all three read correctly, and all three were reported as finished.

### The generic that inferred itself into a corner

`defineField<T>` inferred `T` from `createDefault`'s object literal. Because `conditions: []` infers as `never[]` and a `display` string never widens to its union, `T` collapsed down to that narrow literal, and the `ConfigEditor`, which correctly accepts the real wider config, no longer matched. The error pointed at the component, which was the one part that was right.

Three agents worked out the cause and then fixed it three different ways, each inside its own file. Since every folder was clean on its own, the mistake survived each individual check and only turned up in the project-wide build. The fix was one explicit type argument at the call site, and using it became a rule in the contract.

### The rule that only turned things on

A show rule only ever turned visibility on, and nothing turned it off. When no rule matched, the field fell back to its declared default and stayed visible, so the rule did nothing the author would notice while still looking like it worked in the editor. This was the second bug to get past 116 passing assertions.

The deeper problem was coverage, not effort. Every assertion asked whether a matched rule fires. Not one asked what an unmatched show rule does to an untouched form, which is exactly where the person reporting the bug was standing. A test suite can be thorough about the mechanism and blind to the state the mechanism is in.

### The operand that understood half its inputs

A single select stores one option id as a bare string, while a multi select stores an array of them. The operand that normalised a selection into a list of ids only handled the array, so on a single select the string fell through to an empty list. The damage ran both ways at once: "equals" could never match the option the author picked, and "does not equal" matched always, turning a rule written to hide something into one that showed it.

Both halves compile, the helper is idiomatic, and clicking around finds nothing unless you happen to write a rule against a single select and then watch a field you can see. What caught it was an assertion written in the author's terms, "equals matches the option the author chose", rather than the code's. Compilers and linters show you that the code is internally consistent, not that it models the data correctly. A type can be honoured exactly and still be the wrong shape for half its inputs.

### A date off by one day

`new Date('2024-03-15')` parses as UTC midnight, so west of Greenwich the rendered day is the 14th. The code was idiomatic and gave the wrong date to everyone in the Americas. It would have shipped if the harness had not checked for an exact date string rather than just that a date came back.

## What I did not delegate

The AND versus OR call behind the whole conditional engine, and every product decision in the README's list of cases the spec left open, were mine to make and then have written down. They were not defaults I inherited from generated code.

The review pass was reading. Every bug above was found by reading for what the code assumes about the world outside it, not by asking a model whether the code was correct. On this project, asking a model to review its own output produced exactly one kind of result: a confident summary of what the code does, which is the part I already knew.