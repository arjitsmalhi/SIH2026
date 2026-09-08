# EduSync — UI Polish & Feature Update Spec (v3) — Read Before Touching Any Code

## 0. Purpose of This Document

The Bluetooth P2P sync between two real phones is now working. This round of work is **UI polish, cosmetic cleanup, and a handful of new features** — nothing here should require touching how devices discover, pair, or transfer data over Bluetooth.

Arjit does not code. He cannot verify from a diff whether you quietly touched something you shouldn't have — so the burden of not breaking Bluetooth is entirely on you. If any task below seems like it might require editing transport/sync logic to accomplish, **stop and ask instead of guessing.**

---

## 1. HARD RULE — Bluetooth Code Is Completely Off-Limits

Do **NOT** open with intent to edit, refactor, "clean up," rename, or reformat any of the following files, under any circumstance, for any task in this document:

- `js/transport.js`
- `js/syncEngine.js`
- `android/app/src/main/java/com/ruraleducation/platform/BluetoothP2PPlugin.java`
- Any Bluetooth/location `<uses-permission>` entries in `android/app/src/main/AndroidManifest.xml`
- The `@capacitor-community/bluetooth-le` entry in `package.json`, and the plugin registration in `capacitor.config.json` / `capacitor.plugins.json`

Notes:
- `www/js/transport.js` and `www/js/syncEngine.js` are **build output**, auto-copied from the root `js/` folder by `scripts/build-web.js`. Never hand-edit anything under `www/` directly — edit the root source and rebuild.
- Some UI-layer code in `js/app.js` *calls into* transport/syncEngine (e.g. `window.eduTransport.stopDiscovery()`, `window.eduSyncEngine.calculateDifferential(...)`). It is fine to touch the UI code around these calls (e.g. fixing what happens after a click). It is **not** fine to change what these calls do internally, their signatures, or their return handling logic inside `transport.js`/`syncEngine.js` themselves.
- Before building the final APK (Section 11), run `git diff` (or equivalent) on the five items above and confirm it is **empty**. If it isn't, stop, revert those specific changes, and only then build.

---

## 2. Fix Broken Back Buttons

On several screens, back/close navigation doesn't reliably return the user to the previous screen — the Smart Sync Center (`#screen-sync-center`) is the clearest example, but check every screen. Specifically test:

- `#screen-sync-center` → its back button calls `goBackFromSyncCenter()` in `js/app.js`. Confirm this function actually fires (check event wiring isn't broken by a stray duplicate ID or a missing `window.eduApp` reference) and correctly returns the teacher/student to the right screen in every state (connected, not connected, mid-transfer).
- `#screen-nearby-radar`, `#screen-teacher-resources`, `#screen-quiz-taker`, `#screen-quiz-complete`, `#screen-student-progress`, `#screen-teacher-analytics`, `#screen-student-quizzes` — click every back/cancel button on every screen in both Teacher and Student flows and confirm it lands somewhere sensible, not a blank/frozen screen.

This is a UI event-wiring bug, not a transport bug — fix it in `js/app.js` / `www/index.html` only.

---

## 3. Header Redesign — Replace Logo with a Hamburger Menu

Current top header (`<header class="app-header">` in `index.html`) shows a logo + "EduSync" name on the left, and a language-toggle button + status pill on the right.

Change to:

- **Remove** the logo image (`<img class="brand-logo">`) from the top header bar specifically (the larger hero-screen icon on the role-selection screen can stay — this only applies to the persistent top bar).
- In its place, add a **hamburger icon (☰)** that opens a menu (slide-out panel or dropdown — whichever is simpler to implement cleanly).
- **Move the language toggle** (currently the `#btn-lang-toggle` "🌐 हिंदी" button sitting in the header) **into this hamburger menu** instead of leaving it in the top bar.
- Add a few other relevant options into this same menu, for example:
  - Language: English / हिंदी (moved from header, same `window.i18n.toggleLanguage()` logic)
  - Theme: Light / Dark (new — see Section 9)
  - Current role indicator + a "Switch Role" action (reuses existing `setRole()` logic)
  - About / App version
- Keep the app name text visible in the header (just drop the logo image next to it).

---

## 4. Remove Unpolished / Hackathon-y Elements

- Remove the **"📱 BLUETOOTH P2P — Real Hardware Active"** badge text (`#transport-badge` in `js/app.js`, around the function that sets `badge.textContent`). This is a **display-only** change — you're removing/hiding a text label rendered by the UI layer. Do not touch the underlying logic in `transport.js` that determines *whether* the connection is real vs. demo; only stop showing this particular badge text to the user (or replace it with something subtler if a connection-status indicator is still wanted — a small dot/pill is enough, no need to announce "Real Hardware").
- Remove the **"Smart India Hackathon • Offline P2P Mesh Architecture"** footer line from the role-selection screen (`#screen-role-select` in `index.html`).
- Do a general sweep of `index.html` and `app.js` for any other leftover hackathon/dev-facing text, placeholder copy, or visible debug labels that don't belong in front of an end user, and clean those up too. (Keep any "DEMO MODE" label that genuinely reflects a simulated fallback state per the earlier fix spec — that one is functional, not cosmetic, so it stays if that logic still exists.)

---

## 5. Class Dropdown — Add Classes 11 and 12

Both class-selector dropdowns (`.class-selector-pill.class-select` — one on the Teacher Dashboard, one on the Student Dashboard, in `index.html`) currently only list Class 6 through Class 10. Add `Class 11` and `Class 12` as additional options.

---

## 6. Fix the "Add Content" Form for Teachers

In the "Add New Lesson / Resource" modal (`#modal-add-resource` in `index.html`):

- **Subject field** (`#res-input-subject`) is currently a locked dropdown (Science/Mathematics/English/Social Science only). Change it so the teacher can type any subject name freely — a plain text input is fine (a `<datalist>` offering the existing four as suggestions is a nice touch but not required).
- **PDF upload is missing.** When "Resource Type" is set to "PDF Document," there is currently no way to actually attach a file — nothing appears for the teacher to browse/select a PDF from their device. Add a real `<input type="file" accept="application/pdf">` that shows up when PDF type is selected, and make sure the selected file's content actually gets read and saved into the resource record in `db.js` the same way other resource content is stored (so it can genuinely be opened later, not just labeled "PDF" with nothing behind it).

---

## 7. Quiz Creation for Teachers + Timed Quizzes for Students

Right now quizzes only exist as hardcoded seed data in `db.js` (`seedQuizzes`) — there's no way for a teacher to actually create one. Add:

- A **"Create Quiz"** flow for teachers: quiz title, subject, class, a list of questions (question text, multiple-choice options, correct answer), and a **time limit** (in minutes).
- Save new quizzes into the same `quizzes` IndexedDB store the seeded ones already use (`eduDB.addQuiz(...)`), so they show up in the normal quiz list without any special-casing.
- On the student side (`#screen-quiz-taker`), respect the time limit: show a visible countdown and auto-submit the quiz when time runs out.

---

## 8. Student Study Notes / Doubts

Add a section within the student's learning area where a student can jot down a note or doubt against a piece of study material — plain text, saved locally (same IndexedDB pattern used elsewhere in `db.js`), and viewable/editable later. This doesn't need to sync anywhere for now — just a private scratchpad per student, per device.

---

## 9. Full Aesthetic Overhaul — Professional, Not "AI-Generated"

The current look (bright cyan/blue gradients, heavy neon glow, lots of emoji in buttons and headers) reads as an AI-generated hackathon demo, not a real product. Fix that:

- **New palette:** black/white base with a neutral, muted green as the accent — replace the current `--primary` cyan-blue (`#00d2ff` / gradient) and the purple/coral accents in `css/styles.css`. Keep the green family but tone it down to something more sage/forest-like rather than saturated neon green.
- **Buttons:** move away from big glowing gradient blocks. Flatter, smaller, more restrained button styling — the kind you'd see in a real SaaS product, not a dashboard mockup.
- **Emoji:** trim heavily. Remove decorative emoji from button labels, section headers, and banners. Keep at most a small, functional icon here and there where it genuinely aids scanning (e.g. a status dot) — not one on every label.
- **Theme toggle:** add a Light/Dark mode switch, accessible from the hamburger menu (Section 3). Implement it by swapping a set of CSS variables (e.g. via a `data-theme` attribute on `<body>` or `:root`) between a dark palette and a light palette, both within the new black/white/green direction — don't just invert colors blindly, make sure text contrast and card/border visibility hold up in both modes.

---

## 10. Definition of Done

- [ ] Every screen's back/cancel button was clicked and confirmed to navigate correctly, in both Teacher and Student roles.
- [ ] Top header shows a hamburger menu instead of the logo; language toggle lives inside that menu; theme toggle (light/dark) also lives inside that menu and actually switches the whole app's appearance.
- [ ] "BLUETOOTH P2P — Real Hardware Active" badge text and the "Smart India Hackathon • Offline P2P Mesh Architecture" footer are gone, along with any other similar leftover placeholder/dev text found during the sweep.
- [ ] Class dropdowns (Teacher + Student) include Class 11 and Class 12.
- [ ] Teacher can type any subject name when adding content (not locked to a fixed list).
- [ ] Teacher can actually attach and upload a PDF file when adding a PDF-type resource, and it can be opened later.
- [ ] Teacher can create a new quiz (with a time limit) through the UI, and it appears in the normal quiz list for students in that class/subject.
- [ ] Student sees a countdown while taking a timed quiz and it auto-submits at zero.
- [ ] Student has a working notes/doubts area tied to their study material.
- [ ] App now uses a black/white/neutral-green palette with restrained buttons and minimal emoji, in both light and dark mode.
- [ ] `git diff` on `js/transport.js`, `js/syncEngine.js`, `BluetoothP2PPlugin.java`, the Bluetooth/location permission lines in `AndroidManifest.xml`, and the bluetooth-le dependency/plugin registration lines shows **zero changes**.
- [ ] Bluetooth sync between two real phones was re-tested after all the above and still works exactly as before (discovery, pairing, resource transfer, quiz-result sync back to teacher).

If any box can't be checked honestly, say so plainly and explain what's blocking it — don't mark it done to avoid an awkward conversation.

---

## 11. Build the New APK (name it v3)

Once everything above is verified working in the browser/emulator first:

1. Confirm the `git diff` check from Section 10 is clean before building anything.
2. Bump the version in `android/app/build.gradle` — e.g. `versionCode 3`, `versionName "3.0"` (or similar, your call on exact numbering).
3. Run the normal build pipeline: `npm run sync` (which runs `build-web.js` then `npx cap sync android`), then build the actual APK through the generated Android project (Android Studio or Gradle command line) — not a third-party "website to APK" converter.
4. Name the output APK something like `EduSync-v3-debug.apk` (or `EduSync-v3-release.apk` if signed) so it's clearly distinguishable from the earlier build.
5. Re-confirm `capacitor.config.json` and `capacitor.plugins.json` inside the built APK still correctly reference the real Bluetooth LE plugin — this build step should never be able to silently strip it.
6. Re-test Bluetooth sync between two real phones on this new APK before calling it done. A polished UI on top of broken Bluetooth is a regression, not a win.
