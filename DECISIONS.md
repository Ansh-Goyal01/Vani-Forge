# Decisions

Ambiguities in `CLAUDE.md` and the simplest reasonable call made for each. Newest at the bottom of each milestone.

## M1

1. **Next.js 16, React 19, Tailwind 4, zod 4, vitest 5.** Latest majors from npm at build time. Tailwind tokens live in `@theme` in `globals.css` (no `tailwind.config`).
2. **Fonts via a Google Fonts `<link>`** in the root layout instead of `next/font/google`, so `npm run build` works in an offline sandbox.
3. **Gemini only drafts part of the VoiceIR.** The model returns `VoiceIRDraft` (no voice, tools or version). Code fills `voice` (from the picker), `tools` (end_call always; transfer only if a handoff promise exists and `OWNER_TRANSFER_NUMBER` is set) and `version`. This stops the model inventing voice ids or phone numbers, and keeps the response schema free of open-ended `config` objects.
4. **The transfer phone number is not stored in VoiceIR.** It is read from the env at compile time (`compile(ir, { transferNumber })`) so `compile` stays pure and numbers never land in `/data` or git.
5. **Gemini model fallback.** `GEMINI_MODEL` (default `gemini-2.5-flash`) is tried first. On a 404 only, `src/lib/llm.ts` tries `gemini-3-flash-preview`, then `gemini-2.5-flash-lite`. Cannot be confirmed without a key; see `VERIFY.md`. If a fallback is the one that works, set `GEMINI_MODEL` to it.
6. **429/503 from Gemini** are retried 3 times (2 s, 4 s, 8 s) inside the request, then a plain "busy" message is returned. The UI says a draft can take up to 20 seconds. Compile results are cached by hash of brief + attachments in `data/cache/compile/`.
7. **PDF uploads go to Gemini as inline data** (max 5 MB in the browser). Text/markdown is sent as text. No PDF parsing library.
8. **AI disclosure is enforced in the schema** (regex on the first message, English and Hindi). Patches or form edits that remove it are rejected. Not an exhaustive linguistic check.
9. **Credits = `characterLimit - characterCount`** from `user.subscription.get()`. ElevenLabs bills in credits and this endpoint still exposes them under those names. Marked `TODO(verify)`. The floor is 6,500; below it `/api/signed-url` refuses (server side, not just UI) unless the override in `data/settings.json` is on. With no key, calls are off ("not connected yet").
10. **Agent hard limit:** `conversation.maxDurationSeconds = 300` on every agent as a server-side safety net. The browser also ends test calls at 90 s.
11. **TTS model:** default `eleven_flash_v2_5` (low-latency, multilingual). `pickTtsModel` swaps English-only models (`eleven_turbo_v2`, `eleven_flash_v2`) when Hindi is a language. The allowed list is type-checked against the SDK's `TtsConversationalModel`.
12. **LLM for the ElevenLabs agent is left unset** so the platform default applies. Choosing one blind would be a guess; revisit in `VERIFY.md` after the first real call.
13. **Multi-language agents:** primary language is `languages[0]`; other languages are `languagePresets` with an `agent.language` override, plus the `language_detection` built-in tool. `TODO(verify)` that this is enough for Hindi presets without translated first messages.
14. **Pronunciation dictionaries** are created with `pronunciationDictionaries.createFromRules` (alias rules) once per distinct lexicon (hashed, remembered in `meta.json`) and attached as locators.
15. **Webhook tools** exist in the VoiceIR enum but are ignored by `compile` (they need a workspace tool created first). Roadmap only.
16. **Procedures stretch goal (pain -> transfer as a structured procedure) was not attempted.** The promise is in the system prompt and in the transfer tool's `condition`.
17. **Storage layout:** `data/agents/<id>/v1.json, v2.json, ...` hold plain VoiceIR; `meta.json` holds the history (current version, parent of each version) and the dictionary id.
18. **Smile Dental fixture** (`src/lib/fixtures/smile-dental.ts`) is used only by tests and `npm run smoke`. It is a template of the product's hero use case, not fake results; the UI never shows it as data.
19. **Home page "examples" and "use-case starters"** are text templates the owner edits; they are not data.
20. **Scripts that belong to later milestones** (`seed`, `audio-chaos`) are not present yet, so `package.json` has no dead scripts.

## M2

21. **Undo moves a pointer**, it does not rewrite history: `meta.history.current` goes back to the version's parent and the ElevenLabs agent is updated to that version. Making a new change after an undo creates the next free number (v1, v2, undo to v1, change -> v3). Older files are never deleted.
22. **Refine is two steps:** `/api/agents/[id]/refine` only proposes ops and a readable diff (nothing saved); `/api/agents/[id]/apply` applies the ops, writes a new version and calls `agents.update`.
23. **Gemini returns patch values as `valueJson` strings** (not free-form `value`), which keeps the response schema simple. `/version` and `/tools` cannot be patched.
24. **The form editor sends a full IR** (`PUT /api/agents/[id]`) and creates a new version just like chat.
25. **Test calls use a signed URL over WebSocket** (`connectionType: "websocket"`) minted by `/api/signed-url`. Latency shown is the SDK's own `onPing` estimate, labelled as an estimate.
26. **Chaos, Deploy and Observe tabs are visible but say "arrives in milestone 3/4"** and do nothing else. No fake data.

## M3

27. **Text tier uses agent *simulation tests* + `runTests` + invocations**, not the deprecated simulate-conversation endpoint (removed 31 Oct 2026, the day after the finale). One test per persona x promise, created once and reused (ids in `data/chaos/<agent>/tests.json`), each run k = 3 times.
28. **Per-promise results need one test per (persona, promise)**, because a test returns a single pass/fail. Personas only test the promise *kinds* they target (e.g. the prankster tests "never" promises), which keeps the Smile Dental pass at 7 tests x 3 runs.
29. **Success conditions** are written from the promise kind and text by `successCondition` in `chaos.ts`; a hand-off promise counts as kept if the situation never arose.
30. **Audio tier scores come from ElevenLabs conversation analysis**, using the evaluation criteria compiled from the promises (matched by criterion id). No second LLM judge. Calls with no score are marked "no score" and not counted either way.
31. **Audio tier runs one persona per request** (the UI loops), k = 1, only on the button, blocked by the credit guard. Lines are TTS'd before dialling and cached by hash of voice + model + format + text.
32. **Persona voices are stock voices chosen by label** (`gender`, `age`), sorted by name for a stable pick. No Voice Design.
33. **Heal is propose, approve, apply, re-run.** `/api/heal` never saves. Approving calls the normal apply route (new VoiceIR version, note prefixed "Heal:") and then re-runs only that persona on the text tier. The quote must appear in the transcript; otherwise the agent's last line is used.
34. **VoiceIR gained an optional `speech` block** (`interruptionIgnoreTerms`, `asrKeywords`) that `compile` maps to `turn.interruptionIgnoreTerms` and `asr.keywords`. Pronunciation fixes use the existing `lexicon`. Every agent now also sets `asr.userInputAudioFormat = pcm_16000`.
35. **Chaos requests block until finished** (up to 300 s) instead of using a job queue. Simple, fine for one user; the UI shows a progress message.

## M4

36. **Widget** loads `https://unpkg.com/@elevenlabs/convai-widget-embed` from the public page and the copy-paste snippet. `/a/[agentId]` is unguarded (public visitors spend credits); this is stated on the Deploy tab.
37. **Phone is documentation only.** The Deploy tab lists Twilio/Exotel steps with a disabled "Phone: not connected" button.
38. **Observe totals** come from the latest 30 conversations; "judged successful" counts only calls the platform scored.

## M5

39. **`npm run seed`** uses the Smile Dental fixture with the first listed voice (not Gemini), so it works even when Gemini is rate-limited. It runs the text tier only; audio is left to the owner because it costs real call time.
40. **M3 and M4 were committed together** because the Studio tabs, `eleven.ts` and the docs span both.
41. **Empty, loading and error states:** every list and tab has an explicit empty message, API errors become plain sentences (`src/lib/api.ts`), and `error.tsx`, `not-found.tsx` and `loading.tsx` cover the app shell.

## Redesign (editorial mauve)

42. **Behaviour untouched.** Only components, CSS and static assets changed. Every API route, the write flow, promise sheet, voice picker, studio tabs, credit guard and the public page work as before; the 50 unit tests still pass.
43. **Secondary text is plum at 85%, not 70%.** The brief says plum-70, but that measures 3.98:1 on mauve and fails WCAG AA. `#4D2142` gives 5.4:1. Small "problem" text on blush uses terracotta mixed 50/50 with plum (`#803437`, 5.5:1), because pure terracotta on blush is only about 3.4:1; the terracotta shows up as a dot or bar next to it. Success is plum with a check; failure is terracotta shape plus dark text, so meaning never rests on colour alone.
44. **Fonts are bundled** (`src/fonts/*.ttf`, loaded with `next/font/local`): Bodoni Moda, Jost and JetBrains Mono, all OFL from `google/fonts`. The Google Fonts `<link>` is gone. This supersedes decision 2.
45. **Tokens were renamed**, not aliased: `mauve`, `plum`, `terracotta`, `blush`, `shell`, `mute`, `problem`. The old `alu`, `ink`, `signal`, `graphite`, `paper` names no longer exist.
46. **The vertical word rotates on a wrapper**, not on the animated element, because the rise-in animation's `transform` would otherwise override the rotation.
47. **Hero object is decided on the server** with `fs.existsSync("public/hero/hero-object.png")`. The file was **not** present, so the inline-SVG microphone is shown. `public/hero/README.md` describes the asset.
48. **The "Testing" example on the landing page is illustrative** (Parso saadhe chaar baje, "Paris", "haan ji") and labelled "An example of what testing catches. Not a real call." This is the one place static example content appears; it is a labelled illustration, not a result.
49. **The brief mentioned a rotating example behind the empty text box with "Use this example".** That control did not exist in the current write flow, which has example cards and use-case starters instead. Those were kept and restyled; no new behaviour was added.
50. **The header is global and uses one nav everywhere**, with anchors (`/#how`, `/#proof`, `/#agents`). "Open studio" goes to `#agents` as specified. The old Hz ruler was removed.
51. **No new packages.** CSS, inline SVG, `next/image` and existing dependencies only.

## Restyle to the v2 deck

52. **The deck is the source of truth.** `VaniForge_v2_ShortCircuit_BuildArena.pdf` uses the original "Swiss Acoustic Industrial" look, so the mauve redesign (decisions 42 to 51) is superseded and its assets (Bodoni Moda, Jost, cloud and medallion art, vertical word, grain) were removed. Behaviour was not touched; the 50 unit tests still pass.
53. **Exact values were sampled from the rendered PDF** (200 dpi): paper `#E7E5E0` (with banding between `#E3E2DD` and `#EAE9E4`), ink `#111111`, orange `#FF4F13`, graphite `#181818`, card `#F4F3EF`, secondary text about `#54534F`. The PDF embeds no font files (text is outlined), so fonts were identified by eye: Inter Tight (extra bold, tight) for headlines, Inter for body, JetBrains Mono for labels. These match the original CLAUDE.md spec. If the deck used a different font, swap the three files in `src/fonts/`.
54. **Orange on paper fails AA at small sizes** (about 2.6:1). The deck uses it that way for numerals and tags; here pure orange is kept for large numerals, shapes and graphite panels, and small orange text uses `#C73A0B` (4.6:1). The big numerals are decorative; the headline beside them carries the meaning.
55. **The hero is the deck's title slide**, with a generated Chladni-plate figure standing in for the deck's image. It is made by `scripts/make-plate.py` (density from `cos(5πx)cos(3πy) − cos(3πx)cos(5πy)`), not copied from the deck.
56. **The deck's slide counter ("01 / 07 · 63 HZ BAND") became a route marker**: the orange triangle on the ruler sits at 63 Hz on home, 500 Hz in the studio and 1 kHz on the public page.
57. **The "Testing" section keeps its labelled illustration** (synthetic spectrogram, "Parso saadhe chaar baje", "Paris", "haan ji"), marked "illustrative, not a real call". The deck's invented figures (call 0417, rupee costs, pass^k counts) were not copied into the app.
58. **The Test console waveform is real-level driven**: bars scale with the output audio level from `getOutputByteFrequencyData`; at rest they sit at a low line. This restores the original spec and replaces the rings.
59. **Ruler ticks use fixed-precision percentages** (`toFixed(3)`) so server and client render identical style strings; unrounded floats caused a hydration warning.

## Judge-ready polish

60. **The landing page now tells the story before asking for input:** hero → how it works → under the hood → testing → ElevenLabs inside → build → your agents. "Build your agent" still jumps straight to the brief and focuses it.
61. **The hero plate is live**: `src/lib/plate.ts` (pure, unit-tested) moves sand by a random kick scaled by `|f(x, y)|`, so it collects on the nodal lines. 16,000 grains on desktop, 9,000 on phones; it stops when settled and pauses off-screen. The static PNG stays underneath for first paint and no-JS.
62. **The pipeline diagram only names things the code does.** Structured procedures, voice design and voice cloning (in the deck) are not shown because they are not built.
63. **"14 ElevenLabs capabilities"** is the length of the list in `ElevenInside.tsx`, which mirrors the README table; it is counted, not claimed.
64. **Reveals are hidden only when JS has run** (`html.js`, set by an inline script; `suppressHydrationWarning` on `<html>`), and are fully visible with reduced motion.
65. **No fake progress**: long operations (writing the promise sheet, chaos runs, refine) show indeterminate bars; the test call shows a real 90-second countdown bar.
66. **The header is sticky from 768 px up only**, so it does not eat a phone screen.
67. **The studio's big numeral is the live VoiceIR version** (`v1`, `v2`...), so it means something.
