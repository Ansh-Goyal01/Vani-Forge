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
