import fs from "fs/promises";
import path from "path";
import { getAllItems } from "./getItems";

function getLocalizedString(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.en ||
      value["en-US"] ||
      Object.values(value).find((v: any) => typeof v === "string") ||
      ""
    );
  }
  return String(value);
}

function objectContainsId(obj: any, id: string, excludeKeys: string[] = []): boolean {
  if (obj == null) return false;
  if (typeof obj === "string" || typeof obj === "number" || typeof obj === "boolean") {
    return String(obj) === id;
  }
  if (Array.isArray(obj)) {
    for (const v of obj) if (objectContainsId(v, id, excludeKeys)) return true;
    return false;
  }
  if (typeof obj === "object") {
    for (const k of Object.keys(obj)) {
      if (excludeKeys.includes(k)) continue;
      if (k === id) return true;
      if (objectContainsId((obj as any)[k], id, excludeKeys)) return true;
    }
  }
  return false;
}

async function loadJsonFile(p: string) {
  try {
    const raw = await fs.readFile(p, "utf8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function isWeapon(it: any) {
  if (!it) return false;
  const typeStr = (it.type || "").toString().toLowerCase();
  if (typeStr.includes("weapon")) return true;
  if (it.isWeapon === true) return true;
  if ((it.category || "").toString().toLowerCase().includes("weapon")) return true;
  if (it.weapon || it.weaponType || it.subtype || it.class) return true;
  return false;
}

function isBlueprint(it: any) {
  if (!it) return false;
  const typeStr = (it.type || "").toString().toLowerCase();
  const nameStr = (typeof it.name === "string" ? it.name : it.name?.en || "").toLowerCase();
  if (typeStr.includes("blueprint")) return true;
  if ((it.subtype || "").toString().toLowerCase().includes("blueprint")) return true;
  if ((it.category || "").toString().toLowerCase().includes("blueprint")) return true;
  if (nameStr.includes("blueprint")) return true;
  return false;
}

/**
 * Returns:
 *  { shouldSell: [], safeToRecycle: [], keep: [], itemReferences: { [itemId]: { quests: [], projects: [] } }, weapons: [], blueprints: [] }
 */
export async function categorizeAllItems() {
  const items = await getAllItems();
  const itemsById = new Map(items.map((it: any) => [String(it.id), it]));

  const root = process.cwd();
  const arc = path.join(root, "arcraiders-data");

  const candidates: Array<{ file: string; json: any; type: "quest" | "project" | "other" }> = [];

  // projects.json
  const projectFile = path.join(arc, "projects.json");
  const pj = await loadJsonFile(projectFile);
  if (pj) {
    if (Array.isArray(pj)) {
      pj.forEach((proj, index) => {
        candidates.push({ file: `projects.json[${index}]`, json: proj, type: "project" });
      });
    } else {
      candidates.push({ file: "projects.json", json: pj, type: "project" });
    }
  }

  // hideout folder (projects)
  const hideoutDir = path.join(arc, "hideout");
  const hFiles = (await fs.readdir(hideoutDir).catch(() => [])).filter(f => f.endsWith(".json"));
  for (const hf of hFiles) {
    const hj = await loadJsonFile(path.join(hideoutDir, hf));
    if (hj) candidates.push({ file: path.join("hideout", hf), json: hj, type: "project" });
  }

  // quests folder (for references display only, not for categorization)
  const questsDir = path.join(arc, "quests");
  const qFiles = (await fs.readdir(questsDir).catch(() => [])).filter(f => f.endsWith(".json"));
  for (const qf of qFiles) {
    const qj = await loadJsonFile(path.join(questsDir, qf));
    if (qj) candidates.push({ file: path.join("quests", qf), json: qj, type: "quest" });
  }

  // deprecated/quests.json
  const deprecatedQuestFile = path.join(arc, "deprecated", "quests.json");
  const dq = await loadJsonFile(deprecatedQuestFile);
  if (dq) {
    if (Array.isArray(dq)) {
      dq.forEach((quest, index) => {
        candidates.push({ file: `deprecated/quests.json[${index}]`, json: quest, type: "quest" });
      });
    } else {
      candidates.push({ file: path.join("deprecated", "quests.json"), json: dq, type: "quest" });
    }
  }

  // build item->references map (only for projects/quests display)
  const itemReferences: Record<string, { quests: any[]; projects: any[] }> = {};
  for (const it of items) itemReferences[String(it.id)] = { quests: [], projects: [] };

  for (const candidate of candidates) {
    const json = candidate.json;
    const title = getLocalizedString(json?.name ?? json?.title ?? json?.label ?? "");
    const description = getLocalizedString(json?.description ?? json?.desc ?? json?.summary ?? "");

    if (candidate.type === "project" && json.levels && Array.isArray(json.levels)) {
      // handle leveled projects (e.g., hideout stations)
      for (const levelObj of json.levels) {
        const level = levelObj.level;
        const reqs = levelObj.requirementItemIds || [];
        for (const req of reqs) {
          const itemId = String(req.itemId);
          const qty = Number(req.quantity) || 1;
          if (itemReferences[itemId]) {
            const entry = {
              file: candidate.file,
              name: title || undefined,
              description: description || undefined,
              level: level,
              qty: qty,
            };
            itemReferences[itemId].projects.push(entry);
          }
        }
      }
    } else if (candidate.type === "project") {
      // handle non-leveled projects (if any)
      for (const it of items) {
        const id = String(it.id);
        if (objectContainsId(json, id)) {
          const entry = {
            file: candidate.file,
            name: title || undefined,
            description: description || undefined,
          };
          itemReferences[id].projects.push(entry);
        }
      }
    } else if (candidate.type === "quest") {
      // for quests, collect references for display, but don't use for categorization
      let objectivesTxt = "";
      const objectives = json?.objectives ?? json?.tasks ?? json?.steps ?? json?.objectivesList;
      if (Array.isArray(objectives)) {
        objectivesTxt = objectives
          .map((o: any) => {
            if (!o) return "";
            if (typeof o === "string") return o;
            if (typeof o === "object") return getLocalizedString(o?.description ?? o?.title ?? o?.text ?? o);
            return String(o);
          })
          .filter(Boolean)
          .join(" • ");
      } else if (typeof objectives === "object" && objectives !== null) {
        objectivesTxt = Object.values(objectives)
          .map((v: any) => (typeof v === "string" ? v : getLocalizedString(v?.description ?? v?.title ?? v)))
          .filter(Boolean)
          .join(" • ");
      } else {
        objectivesTxt = description || "";
      }

      // still scan for display purposes, but exclude rewards
      const excludeKeys = ["rewardItemIds", "rewardItems", "rewards", "reward", "loot", "drops", "prize", "prizes"];
      for (const it of items) {
        const id = String(it.id);
        if (objectContainsId(json, id, excludeKeys)) {
          const entry = {
            file: candidate.file,
            name: title || undefined,
            description: description || undefined,
            objectives: objectivesTxt || undefined,
          };
          itemReferences[id].quests.push(entry);
        }
      }
    }
  }

  // find keepSet based on project references only
  const keepSet = new Set<string>();
  for (const [id, refs] of Object.entries(itemReferences)) {
    if (refs.projects && refs.projects.length > 0) keepSet.add(id);
  }

  function computeRecycleInfo(item: any) {
    const map = item.recyclesInto ?? item.salvagesInto ?? {};
    let sum = 0;
    const components: string[] = [];
    for (const [comp, count] of Object.entries(map)) {
      const compItem = itemsById.get(String(comp));
      const compValue = Number(compItem?.value ?? 0);
      const qty = Number(count) || 0;
      sum += compValue * qty;
      components.push(String(comp));
    }
    return { value: sum, components };
  }

  const shouldSell: any[] = [];
  const safeToRecycle: any[] = [];
  const keep: any[] = [];
  const weapons: any[] = [];
  const blueprints: any[] = [];

  for (const it of items) {
    const id = String(it.id);

    // classify weapons / blueprints first and exclude them from monetary categorization
    if (isWeapon(it)) {
      weapons.push(it);
      // still annotate recycleValue for completeness
      it._recycleValue = computeRecycleInfo(it).value;
      continue;
    }
    if (isBlueprint(it)) {
      blueprints.push(it);
      it._recycleValue = computeRecycleInfo(it).value;
      continue;
    }

    const sellValue = Number(it.value) || 0;
    const recycleInfo = computeRecycleInfo(it);
    const recycleValue = recycleInfo.value;
    it._recycleValue = recycleValue; // add to all items

    // If project requires it, keep
    if (keepSet.has(id)) { keep.push(it); continue; }

    // If both values zero, keep (can't be sold or recycled)
    if (sellValue === 0 && recycleValue === 0) {
      keep.push(it);
      continue;
    }

    // If recycling yields components that are used by projects/quests, prefer recycling
    let producesNeededComponent = false;
    for (const compId of recycleInfo.components) {
      const compRefs = itemReferences[String(compId)];
      const projectUses = compRefs?.projects?.length || 0;
      const questUses = compRefs?.quests?.length || 0;
      if (projectUses > 0 || questUses > 0) {
        producesNeededComponent = true;
        break;
      }
    }

    if (producesNeededComponent) {
      safeToRecycle.push(it);
      continue;
    }

    // Fallback: numeric comparison (recycleValue > sellValue -> recycle)
    if (recycleValue > sellValue) {
      safeToRecycle.push(it);
    } else {
      shouldSell.push(it);
    }
  }

  return { shouldSell, safeToRecycle, keep, itemReferences, weapons, blueprints };
}