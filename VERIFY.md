# VERIFY: checks that need API keys

Nothing below has been run: the build sandbox had no keys. Run in order. `npm run check-env` first.

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
