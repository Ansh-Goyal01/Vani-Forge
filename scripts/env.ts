import { existsSync } from "node:fs";

/** Loads .env.local for scripts (Next loads it itself for the app). */
export function loadEnv(): void {
  if (existsSync(".env.local")) process.loadEnvFile(".env.local");
}

export const VARS = [
  { name: "ELEVENLABS_API_KEY", required: true },
  { name: "GEMINI_API_KEY", required: true },
  { name: "GEMINI_MODEL", required: false },
  { name: "OWNER_TRANSFER_NUMBER", required: false },
] as const;
