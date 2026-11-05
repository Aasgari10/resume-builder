// Reading and writing one value of the resume by a path written on the page, e.g.
// "basics.fullName", "site.tagline", "projects[p1].title", "projects[p1].images.0".
// "[id]" picks an array item by its id, a plain number picks by position.

import type { ResumeData } from "@rb/schema";

type Seg = { key: string } | { id: string } | { index: number };

function parse(path: string): Seg[] {
  const segs: Seg[] = [];
  for (const part of path.match(/[^.[\]]+|\[[^\]]+\]/g) ?? []) {
    if (part.startsWith("[")) segs.push({ id: part.slice(1, -1) });
    else if (/^\d+$/.test(part)) segs.push({ index: Number(part) });
    else segs.push({ key: part });
  }
  return segs;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function step(node: any, seg: Seg): any {
  if (node == null) return undefined;
  if ("key" in seg) return node[seg.key];
  if ("index" in seg) return Array.isArray(node) ? node[seg.index] : undefined;
  return Array.isArray(node) ? node.find((x) => x?.id === seg.id) : undefined;
}

export function getAt(data: ResumeData, path: string): unknown {
  return parse(path).reduce<any>(step, data);
}

/**
 * Returns a copy of `data` with the value at `path` replaced. When the path points into an item
 * that only exists in the preview's sample content (`shown`), that item is copied in first,
 * so editing a sample project turns just that project into the user's own.
 */
export function setAt(data: ResumeData, shown: ResumeData, path: string, value: unknown): ResumeData {
  const segs = parse(path);
  const write = (node: any, sample: any, i: number): any => {
    if (i === segs.length) return value;
    const seg = segs[i]!;
    if ("key" in seg) {
      const base = node && typeof node === "object" ? node : {};
      return { ...base, [seg.key]: write(base[seg.key], sample?.[seg.key], i + 1) };
    }
    const list: any[] = Array.isArray(node) ? node : [];
    if ("index" in seg) {
      const next = [...list];
      next[seg.index] = write(list[seg.index], sample?.[seg.index], i + 1);
      return next.filter((x) => x !== undefined);
    }
    const at = list.findIndex((x) => x?.id === seg.id);
    const sampleItem = Array.isArray(sample) ? sample.find((x: any) => x?.id === seg.id) : undefined;
    if (at >= 0) return list.map((x, k) => (k === at ? write(x, sampleItem, i + 1) : x));
    return sampleItem ? [...list, write(structuredClone(sampleItem), sampleItem, i + 1)] : list;
  };
  return write(data, shown, 0) as ResumeData;
}

/** Removes the array item a path points into ("projects[p1].title" removes project p1). */
export function removeItem(data: ResumeData, path: string): ResumeData {
  const m = /^(.*)\[([^\]]+)\]/.exec(path);
  if (!m) return data;
  const [, listPath, id] = m;
  const list = getAt(data, listPath!);
  if (!Array.isArray(list)) return data;
  return setAt(data, data, listPath!, list.filter((x: any) => x?.id !== id));
}

/** True when the path points into an array item, so the item can be deleted. */
export const isItemPath = (path: string) => /\[[^\]]+\]/.test(path);
