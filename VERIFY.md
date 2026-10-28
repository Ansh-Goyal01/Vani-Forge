# VERIFY: checks that need API keys

Run `npm run check-env` first. Credit costs are estimates; the account has 30,000 credits and 6,500 are a protected demo-day reserve.

| # | Check | Command / action | Expected | Credits |
|---|-------|------------------|----------|---------|
| 1 | Keys present | `npm run check-env` | `ELEVENLABS_API_KEY` and `GEMINI_API_KEY` show `set` | 0 |
| 2 | Smoke: voices, agent create/delete, signed URL, balance | `npm run smoke` | all steps `PASS`, ends with "Smoke passed." No call is placed | ~0 (no audio) |
| 3 | Gemini model name works | `npm run dev`, open `/`, click an example, "Write my promise sheet" | promise sheet appears. If it errors with a model-not-found message, set `GEMINI_MODEL` (see DECISIONS #5) | 0 |
| 4 | Brief to promise sheet (dental) | use the first example | Always / Never / Hand-off lists; first message says "AI assistant"; a lexicon entry for "Bhatnagar" in X-Ray | 0 |
| 5 | Voice picker | same page, scroll to "Pick a voice" | voices load; Play previews; use-case chips come from API labels (`TODO(verify)`: label key is assumed to match `use case`) | 0 |
| 6 | Create agent | "Create my agent" | lands on `/studio/<id>`; the agent exists in the ElevenLabs dashboard with the promises as evaluation criteria and a pronunciation dictionary on the voice | 0 |
| 7 | Credits badge | any page | shows remaining credits, not "not connected yet". `TODO(verify)`: value equals dashboard credits | 0 |
| 8 | Mic transcription (Scribe v2) | click "Speak instead", say a sentence, stop | text appears in the box | ~tiny |
| 9 | Live test call | Studio > Test > Start | greeting plays and says it is an AI; transcript fills both sides; latency estimate appears; countdown ends the call at 90 s | ~1.5 min of agent time |
| 10 | Interruption marker | during check 9, talk over the agent | "interrupted" marker in the transcript | included |
| 11 | Mic denied message | block the mic in the browser, press Start | plain-words error, no stack trace | 0 |
| 12 | Refine by chat | Studio > Refine: "make the welcome message shorter and warmer", Preview, Apply | readable before/after; v2 saved; next Test call greets with the new message | ~10 s of a call |
| 13 | Undo | Refine > Undo | back to v1; next call greets with the old message | 0 |
| 14 | Form editor | edit the first message, Save | new version; ElevenLabs agent updated | 0 |
| 15 | Credit guard | `data/settings.json` untouched; temporarily lower the floor in `src/lib/credits.ts` above your balance | Start is disabled with an explanation; "Override for demo" re-enables | 0 |
| 16 | Hindi language preset | call the agent and speak Hindi | agent switches to Hindi (`TODO(verify)` presets + `language_detection`) | ~30 s |
| 17 | Transfer tool | set `OWNER_TRANSFER_NUMBER`, create a new agent | dashboard shows the Transfer to number tool. Do not trigger a real transfer during rehearsal | 0 |

## TODO(verify) in code

- `src/lib/eleven.ts` `getCredits`: credits exposed as `characterLimit - characterCount`.
- `src/lib/eleven.ts` `transcribe`: response union narrowed to the single-channel `text` shape.
- `src/lib/compile.ts`: English-only TTS model list; webhook tools ignored; language presets.
