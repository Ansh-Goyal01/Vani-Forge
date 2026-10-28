import { promises as fs } from "node:fs";
import path from "node:path";
import type { ChaosRun } from "./chaos";
import { VoiceIR } from "./voiceir";
import { emptyHistory, type History } from "./versions";

/** JSON-file storage under /data. No database. */

export const DATA_DIR = process.env.VANIFORGE_DATA_DIR ?? path.join(process.cwd(), "data");

const SAFE_ID = /^[A-Za-z0-9_-]{1,128}$/;
export function safeId(id: string): string {
  if (!SAFE_ID.test(id)) throw new Error("Invalid id");
  return id;
}

async function readJson<T>(file: string): Promise<T | null> {
  try {
    return JSON.parse(await fs.readFile(file, "utf8")) as T;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

async function writeJson(file: string, value: unknown): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(value, null, 2));
}

// ---- settings ----
export type Settings = { creditOverride: boolean };
const settingsFile = () => path.join(DATA_DIR, "settings.json");

export async function getSettings(): Promise<Settings> {
  return { creditOverride: false, ...((await readJson<Partial<Settings>>(settingsFile())) ?? {}) };
}
export async function saveSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await writeJson(settingsFile(), next);
  return next;
}

// ---- compile cache (keyed by prompt hash) ----
const cacheFile = (hash: string) => path.join(DATA_DIR, "cache", "compile", `${safeId(hash)}.json`);
export const getCached = <T>(hash: string) => readJson<T>(cacheFile(hash));
export const putCached = (hash: string, value: unknown) => writeJson(cacheFile(hash), value);

// ---- agents ----
export type AgentMeta = {
  agentId: string;
  history: History;
  /** Pronunciation dictionary already created for the current lexicon. */
  dictionary?: { hash: string; id: string; versionId?: string };
};

const agentDir = (id: string) => path.join(DATA_DIR, "agents", safeId(id));
const metaFile = (id: string) => path.join(agentDir(id), "meta.json");
const versionFile = (id: string, v: number) => path.join(agentDir(id), `v${v}.json`);

export async function getMeta(agentId: string): Promise<AgentMeta | null> {
  return readJson<AgentMeta>(metaFile(agentId));
}
export const saveMeta = (meta: AgentMeta) => writeJson(metaFile(meta.agentId), meta);

export async function createAgentRecord(agentId: string, ir: VoiceIR): Promise<AgentMeta> {
  const meta: AgentMeta = { agentId, history: emptyHistory(ir.version, "Created") };
  await writeJson(versionFile(agentId, ir.version), ir);
  await saveMeta(meta);
  return meta;
}

export async function saveVersion(agentId: string, ir: VoiceIR): Promise<void> {
  await writeJson(versionFile(agentId, ir.version), ir);
}

export async function loadVersion(agentId: string, version: number): Promise<VoiceIR | null> {
  const raw = await readJson<unknown>(versionFile(agentId, version));
  return raw ? VoiceIR.parse(raw) : null;
}

export async function listAgentIds(): Promise<string[]> {
  try {
    const entries = await fs.readdir(path.join(DATA_DIR, "agents"), { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

export async function deleteAgentRecord(agentId: string): Promise<void> {
  await fs.rm(agentDir(agentId), { recursive: true, force: true });
}

// ---- chaos runs ----
const chaosDir = (agentId: string) => path.join(DATA_DIR, "chaos", safeId(agentId));
export const saveRun = (run: ChaosRun) => writeJson(path.join(chaosDir(run.agentId), `${safeId(run.runId)}.json`), run);
export const getRun = (agentId: string, runId: string) => readJson<ChaosRun>(path.join(chaosDir(agentId), `${safeId(runId)}.json`));
export async function listRuns(agentId: string): Promise<ChaosRun[]> {
  try {
    const files = await fs.readdir(chaosDir(agentId));
    const runs = await Promise.all(files.filter((f) => f.endsWith(".json") && f !== "tests.json").map((f) => readJson<ChaosRun>(path.join(chaosDir(agentId), f))));
    return runs.filter((r): r is ChaosRun => r !== null).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  } catch {
    return [];
  }
}

// ---- simulation test ids (so a test is created once per persona+promise) ----
const testIdsFile = (agentId: string) => path.join(chaosDir(agentId), "tests.json");
export const getTestIds = async (agentId: string) => (await readJson<Record<string, string>>(testIdsFile(agentId))) ?? {};
export const saveTestIds = (agentId: string, ids: Record<string, string>) => writeJson(testIdsFile(agentId), ids);

// ---- cached persona audio ----
export const audioPath = (hash: string) => path.join(DATA_DIR, "audio", `${safeId(hash)}.pcm`);
export async function readAudio(hash: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(audioPath(hash));
  } catch {
    return null;
  }
}
export async function writeAudio(hash: string, data: Buffer): Promise<void> {
  await fs.mkdir(path.dirname(audioPath(hash)), { recursive: true });
  await fs.writeFile(audioPath(hash), data);
}
