import { describe, expect, it } from "vitest";
import { smileDentalIR } from "@/lib/fixtures/smile-dental";
import { applyOps, describeChanges, PatchError, type RawOp } from "@/lib/patch";
import { addVersion, emptyHistory, nextVersionNumber, undo, undoTarget } from "@/lib/versions";

const ir = smileDentalIR();
const shorter: RawOp = {
  op: "replace",
  path: "/persona/firstMessage",
  valueJson: JSON.stringify("Namaste! Smile Dental here. I'm an AI assistant. How can I help?"),
};

describe("JSON patch on VoiceIR", () => {
  it("replaces a field without mutating the original", () => {
    const next = applyOps(ir, [shorter]);
    expect(next.persona.firstMessage).toContain("Smile Dental here");
    expect(ir.persona.firstMessage).toContain("Namaste, you've reached");
  });

  it("appends a promise with /-", () => {
    const next = applyOps(ir, [
      { op: "add", path: "/promises/-", valueJson: JSON.stringify({ id: "no_discounts", kind: "never", text: "Never offer discounts." }) },
    ]);
    expect(next.promises.at(-1)?.id).toBe("no_discounts");
  });

  it("rejects a patch that would drop the AI disclosure", () => {
    expect(() => applyOps(ir, [{ op: "replace", path: "/persona/firstMessage", valueJson: '"Hello!"' }])).toThrow(PatchError);
  });

  it("rejects paths that only VaniForge manages and bad JSON", () => {
    expect(() => applyOps(ir, [{ op: "replace", path: "/version", valueJson: "9" }])).toThrow(PatchError);
    expect(() => applyOps(ir, [{ op: "remove", path: "/tools/0" }])).toThrow(PatchError);
    expect(() => applyOps(ir, [{ op: "replace", path: "/persona/tone", valueJson: "{oops" }])).toThrow(PatchError);
    expect(() => applyOps(ir, [{ op: "replace", path: "/nope/x", valueJson: '"a"' }])).toThrow(PatchError);
  });

  it("describes a change in plain words with before and after", () => {
    const [line] = describeChanges(ir, [shorter]);
    expect(line.label).toBe("Welcome message");
    expect(line.before).toBe(ir.persona.firstMessage);
    expect(String(line.after)).toContain("Smile Dental here");
  });
});

describe("version history and undo", () => {
  it("numbers versions and undo returns to the parent", () => {
    let h = emptyHistory(1, "Created");
    h = addVersion(h, "shorter greeting");
    h = addVersion(h, "form edit");
    expect(h.current).toBe(3);
    expect(nextVersionNumber(h)).toBe(4);
    h = undo(h);
    expect(h.current).toBe(2);
    h = undo(h);
    expect(h.current).toBe(1);
    expect(undoTarget(h)).toBeNull();
    expect(() => undo(h)).toThrow("Nothing to undo");
  });

  it("a new version after undo gets a fresh number and parents the undone-to version", () => {
    let h = addVersion(emptyHistory(1, "Created"), "a");
    h = undo(h);
    h = addVersion(h, "b");
    expect(h.current).toBe(3);
    expect(undoTarget(h)).toBe(1);
  });
});
