import { existsSync, readFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { beforeAll, describe, expect, it, vi } from "vitest";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";

const dir = path.join(os.tmpdir(), `vf-${process.pid}-${Date.now()}`);
process.env.VANIFORGE_DATA_DIR = dir;

const calls = vi.hoisted(() => ({ created: [] as unknown[], updated: [] as { id: string; payload: unknown }[], dicts: 0 }));

vi.mock("@/lib/eleven", () => ({
  elevenConfigured: () => true,
  getCredits: async () => ({ remaining: 20000, used: 10000, limit: 30000, tier: "test" }),
  createAgent: async (p: unknown) => (calls.created.push(p), "agent_test_1"),
  updateAgent: async (id: string, payload: unknown) => void calls.updated.push({ id, payload }),
  deleteAgent: async () => {},
  createPronunciationDictionary: async () => (calls.dicts++, { id: "dict_1", versionId: "ver_1" }),
}));

let service: typeof import("@/lib/service");
let store: typeof import("@/lib/store");

beforeAll(async () => {
  service = await import("@/lib/service");
  store = await import("@/lib/store");
});

const firstMessageOf = (payload: unknown) =>
  (payload as { conversationConfig: { agent: { firstMessage: string } } }).conversationConfig.agent.firstMessage;

describe("agent lifecycle with a mocked ElevenLabs", () => {
  it("creates v1, saves v2 with a shorter greeting, then undoes back to v1", async () => {
    expect(dir).toContain("vf-");
    const { agentId } = await service.createAgentFromIR(smileDentalIR("voice_1"));
    expect(agentId).toBe("agent_test_1");
    expect(existsSync(path.join(dir, "agents", agentId, "v1.json"))).toBe(true);
    expect(calls.dicts).toBe(1);

    const state = await service.getAgentState(agentId);
    const shorter = {
      ...state!.ir,
      persona: { ...state!.ir.persona, firstMessage: "Namaste! Smile Dental here. I'm an AI assistant. Kaise help karun?" },
    };
    const saved = await service.saveNewVersion(agentId, shorter, "shorter greeting");
    expect(saved.ir.version).toBe(2);
    expect(JSON.parse(readFileSync(path.join(dir, "agents", agentId, "v2.json"), "utf8")).version).toBe(2);
    expect(firstMessageOf(calls.updated.at(-1)!.payload)).toContain("Kaise help karun");
    expect(calls.dicts).toBe(1); // same lexicon: dictionary is reused

    const back = await service.undoVersion(agentId);
    expect(back.ir.version).toBe(1);
    expect(firstMessageOf(calls.updated.at(-1)!.payload)).toContain("you've reached Smile Dental");
    expect((await store.getMeta(agentId))!.history.current).toBe(1);
    await expect(service.undoVersion(agentId)).rejects.toThrow("Nothing to undo");
  });

  it("reports credits through the guard", async () => {
    const s = await service.getCreditStatus();
    expect(s.guard.allowed).toBe(true);
    expect(s.remaining).toBe(20000);
  });

  it("rejects ids that could escape the data folder", () => {
    expect(() => store.safeId("../etc")).toThrow();
  });
});
