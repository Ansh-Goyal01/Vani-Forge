/** Pure version-history logic for VoiceIR files (v1.json, v2.json, ...). */

export type HistoryEntry = {
  version: number;
  /** The version that was current when this one was made; Undo returns here. */
  parent: number | null;
  note: string;
  createdAt: string;
};
export type History = { current: number; entries: HistoryEntry[] };

export function emptyHistory(version: number, note: string, now = new Date()): History {
  return { current: version, entries: [{ version, parent: null, note, createdAt: now.toISOString() }] };
}

export function nextVersionNumber(h: History): number {
  return Math.max(...h.entries.map((e) => e.version)) + 1;
}

export function addVersion(h: History, note: string, now = new Date()): History {
  const version = nextVersionNumber(h);
  return {
    current: version,
    entries: [...h.entries, { version, parent: h.current, note, createdAt: now.toISOString() }],
  };
}

export function undoTarget(h: History): number | null {
  return h.entries.find((e) => e.version === h.current)?.parent ?? null;
}

export function undo(h: History): History {
  const target = undoTarget(h);
  if (target === null) throw new Error("Nothing to undo.");
  return { ...h, current: target };
}
