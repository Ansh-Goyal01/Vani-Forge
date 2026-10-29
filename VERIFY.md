# VERIFY: checks that need API keys

Run in order. `npm run check-env` first. Results of the first live run are at the end of this file.

Budget: 30,000 credits (about 45 minutes of agent conversation). The code refuses live calls and audio chaos below 6,500 credits (demo-day reserve of about 10 minutes) unless you switch on "Override for demo" in the header. Costs below are estimates, not measurements; measure with the Credits badge after each step and write real numbers here.

| # | Check | Command / action | Expected | Est. credits |
|---|-------|------------------|----------|---------|
| 1 | Keys present | `npm run check-env` | `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` show `set` | 0 |
| 2 | Smoke test | `npm run smoke` | every step `PASS`, ends "Smoke passed."; no call placed; the throwaway agent is deleted | about 0 |
| 3 | Gemini model name | `npm run dev`, open `/`, click "Dental clinic receptionist", "Write my promise sheet" | promise sheet appears. On a model-not-found error set `GEMINI_MODEL` (DECISIONS #5) | 0 |
| 4 | Dental brief | same page | Always / Never / Hand-off lists; first message says it is an AI assistant; "Bhatnagar" in the X-Ray lexicon | 0 |
| 5 | Voice picker | scroll to "Pick a voice" | voices load, Play previews, use-case chips come from API labels | 0 |
| 6 | Create agent | "Create my agent" | lands on `/studio/<id>`; agent in the ElevenLabs dashboard with the promises as evaluation criteria and a pronunciation dictionary | 0 |
| 7 | Credits badge | any page | shows the remaining credits and matches the dashboard (`TODO(verify)`) | 0 |
| 8 | Mic to text | "Speak instead", say one sentence, stop | text fills the box (Scribe v2) | tiny |
| 9 | Live test call | Studio > Test > Start | AI-disclosing greeting; both sides in the transcript; latency estimate; countdown ends the call at 90 s | about 1.5 min |
| 10 | Interruption marker | talk over the agent during check 9 | "You interrupted" marker | included |
| 11 | Mic denied | block the mic, press Start | plain-words message, no stack trace | 0 |
| 12 | Refine by chat | Refine: "make the welcome message shorter and warmer", Show me the change, Apply | before/after shown; v2 saved; next Test call uses the new greeting | about 10 s |
| 13 | Undo | Refine > Undo last change | back to v1 and the old greeting | 0 |
| 14 | Form editor | edit first message, Save as a new version | new version; agent updated | 0 |
| 15 | Credit guard | temporarily raise `CREDIT_FLOOR` in `src/lib/credits.ts` above your balance | Start and Audio test disabled with a reason; "Override for demo" re-enables | 0 |
| 16 | Hindi preset | speak Hindi in a test call | agent switches to Hindi (`TODO(verify)` language presets + detection) | about 30 s |
| 17 | Transfer tool | set `OWNER_TRANSFER_NUMBER`, create a new agent | dashboard shows Transfer to number. Do not trigger a real transfer while rehearsing | 0 |
| 18 | Seed | `npm run seed` | agent created, then "kept N of M" lines per promise for 4 callers x 3 | text simulations (measure!) |
| 19 | Text tier in UI | Studio > Chaos > Run text test | per-promise "kept N of M"; transcripts open. `TODO(verify)`: simulation runs return both roles in `agentResponses`; if only agent lines show, callers' lines are missing | measure |
| 20 | Heal | on a failed pair press "Explain and fix" | quoted agent line, plain explanation, readable patch; Approve creates a new version and re-runs that caller; before/after shown | text simulations |
| 21 | Audio tier (one caller) | `npm run audio-chaos -- <agentId> angry_patient_pain` | "caller said / agent heard" pairs; per-promise result from conversation analysis. `TODO(verify)`: raw WebSocket protocol (initiation message, `pcm_16000` input) | about 1 min |
| 22 | Persona TTS cache | run check 21 twice | second run generates no new TTS (files in `data/audio` unchanged) | 0 on rerun |
| 23 | Audio tier in UI | Chaos > Run audio test | four calls one after another, results appear per caller | about 4 min |
| 24 | Acceptance: fail, patch, pass | run Chaos until a caller fails, heal it, re-run | at least one real fail then pass; screenshot it | measure |
| 25 | Share page | Deploy > Open | `/a/<id>` shows the ElevenLabs widget; a call connects. `TODO(verify)`: agent allows public access by default | about 1 min |
| 26 | Observe | after check 9, Studio > Observe | the call is listed with duration, summary and per-promise scores (may take a minute to appear) | 0 |

## TODO(verify) in code

- `eleven.ts` `getCredits`: credits read as `characterLimit - characterCount`.
- `eleven.ts` `transcribe`: Scribe response narrowed to the single-channel `text` shape.
- `eleven.ts` `waitForInvocation`: `agentResponses` assumed to hold both roles.
- `compile.ts`: English-only TTS model list; webhook tools ignored; language presets without translated first messages.
- `audio-chaos.ts`: initiation message and audio chunk framing follow the SDK's own client code, not yet run against the live socket. Voice label keys `gender` and `age` assumed.
- Voice picker: use-case label key matched with `/use.?case/`.
- The simulation-conversation endpoint is deprecated (removed 31 Oct 2026); this project uses agent tests instead.

## Results: first live run, 29 Oct 2026

Account: Creator tier, 161,000 credits at the start. Demo agent: `agent_8001m644z76tfp98qyf34f4nyw9n` (Smile Dental, now version 3). Measured with the credits badge, not estimated.

| # | Check | Result |
|---|-------|--------|
| 1 | Keys present | PASS |
| 2 | Smoke | PASS after two fixes: the first key lacked permissions (new key needed), and English agents need `eleven_flash_v2` (DECISIONS #71) |
| 3, 4 | Gemini model, dental brief | PASS on `gemini-2.5-flash`: promise sheet, AI-disclosing first message, "Bhatnagar" in the lexicon |
| 5 | Voice picker | PASS: 21 voices, use-case chips from API labels |
| 6 | Create agent | PASS: 5 promises as evaluation criteria, pronunciation dictionary, English base + Hindi preset, end call + language detection |
| 7 | Credits badge | PASS: `characterLimit - characterCount` matches the account (161,000 at the start) |
| 8 | Mic to text | NOT RUN (needs a human at the mic) |
| 9, 10, 11 | Live test call, interruption marker, mic denied | NOT RUN (needs a human at the mic) |
| 12 | Refine "shorter and warmer" | PASS: v2 live with "Hi, I'm your AI assistant for Smile Dental. How can I help?" |
| 13, 14 | Undo, form editor | NOT RUN live (unit-tested; same `agents.update` path as 12) |
| 18 | Seed | NOT RUN (the demo agent above was built through the UI instead) |
| 19 | Text tier in UI | PASS: both roles come back in `agentResponses`; the full run (4 callers x 3) took 51 s |
| 20 | Heal | PASS: real quote, plain explanation, valid patch; owner promises untouched (DECISIONS #74) |
| 21, 22 | Audio tier, TTS cache | PASS: WebSocket protocol and `pcm_16000` work; agent heard Hinglish (in Devanagari) and replied in Hindi; reruns reuse `data/audio` |
| 23 | Audio tier in UI (all four callers) | NOT RUN (script used per caller instead) |
| 24 | Fail, patch, pass | PASS (audio, elderly caller): `book_appointments` kept 0 of 1 on v2, heal set `turnEagerness: patient` + ignore "haan ji", kept 1 of 1 on v3. Caveat: k = 1, and pauses were still interrupted (DECISIONS #75) |
| 25 | Share page | PASS: widget script loads and renders for the agent. A call through it was not placed |
| 26 | Observe | PASS: audio-tier call listed with title, summary and all 5 promise scores |

Measured costs: one full text tier (27 simulations) about 7,950 credits; one audio-tier caller (about 30-45 s) about 1,000-1,500 credits; smoke, compile, refine and heal 0 ElevenLabs credits. Total for this session: about 13,640 credits (147,359 left at the end; the badge lags a few minutes behind the runs).

Still open: the fast talker fails `book_appointments` for real (the agent says "the team will call to confirm" instead of booking). Heal proposes a stricter booking step; it has not been applied, so it can be shown live.
