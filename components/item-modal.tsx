"use client";
import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import ItemMiniCard from "./item-mini-card";

function getLocalizedString(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return (
      value.en ||
      value["en-US"] ||
      Object.values(value).find((v) => typeof v === "string") ||
      ""
    );
  }
  return String(value);
}

function normalizeRarityKey(raw: any) {
  const s = String(getLocalizedString(raw || "")).trim().toLowerCase();
  if (!s) return "common";
  if (s.includes("uncommon") || s.includes("green")) return "uncommon";
  if (s.includes("rare") || s.includes("blue")) return "rare";
  if (s.includes("epic") || s.includes("purple")) return "epic";
  if (s.includes("legendary") || s.includes("yellow") || s.includes("gold")) return "legendary";
  if (s.includes("common") || s.includes("gray") || s.includes("grey")) return "common";
  const roman = s.replace(/[^ivx]/g, "");
  if (/^i{1,5}$/.test(roman)) {
    const len = roman.length;
    if (len === 1) return "common";
    if (len === 2) return "uncommon";
    if (len === 3) return "rare";
    if (len === 4) return "epic";
    return "legendary";
  }
  return "common";
}

function rarityClassesFor(key: string) {
  switch (key) {
    case "uncommon":
      return {
        wrapper: "border-green-600 dark:border-green-500",
        bg: "bg-green-50 dark:bg-green-950",
        badgeBg: "bg-green-100 dark:bg-green-800",
        badgeText: "text-green-800 dark:text-green-200"
      };
    case "rare":
      return {
        wrapper: "border-blue-600 dark:border-blue-500",
        bg: "bg-blue-50 dark:bg-blue-950",
        badgeBg: "bg-blue-100 dark:bg-blue-800",
        badgeText: "text-blue-800 dark:text-blue-200"
      };
    case "epic":
      return {
        wrapper: "border-purple-600 dark:border-purple-500",
        bg: "bg-purple-50 dark:bg-purple-950",
        badgeBg: "bg-purple-100 dark:bg-purple-800",
        badgeText: "text-purple-800 dark:text-purple-200"
      };
    case "legendary":
      return {
        wrapper: "border-yellow-600 dark:border-yellow-500",
        bg: "bg-yellow-50 dark:bg-yellow-950",
        badgeBg: "bg-yellow-100 dark:bg-yellow-800",
        badgeText: "text-yellow-800 dark:text-yellow-100"
      };
    case "common":
    default:
      return {
        wrapper: "border-gray-600 dark:border-gray-500",
        bg: "bg-gray-100 dark:bg-gray-800",
        badgeBg: "bg-gray-200 dark:bg-gray-700",
        badgeText: "text-gray-800 dark:text-gray-100"
      };
  }
}

export default function ItemModal({
  item,
  references,
  lookup,
  onClose,
}: {
  item: any;
  references?: any;
  lookup?: Record<string, any>;
  onClose: () => void;
}) {
  const [animatingOut, setAnimatingOut] = useState(false);

  const handleClose = () => {
    setAnimatingOut(true);
    setTimeout(onClose, 300);
  };

  const name = (typeof item.name === "string" ? item.name : item.name?.en) || item.id || "Item";
  const type = getLocalizedString(item.type ?? item.itemType ?? "");
  const recycles = item.recyclesInto ?? item.salvagesInto ?? {};
  const recipe = item.recipe ?? null;
  const rawRarity = item.rarity ?? item.tier ?? item.tierName ?? "";
  const rarityKey = normalizeRarityKey(rawRarity);
  const rarityLabel = getLocalizedString(rawRarity) || getLocalizedString(item.tier) || "Common";
  const cls = rarityClassesFor(rarityKey);

  const recyclesList = Object.entries(recycles).map(([k, v]) => ({
    id: String(k),
    qty: Number(v) || 0,
    itemObj: lookup?.[String(k)],
  }));

  const recipeList = recipe
    ? Object.entries(recipe).map(([k, v]) => ({
        id: String(k),
        qty: Number(v) || 0,
        itemObj: lookup?.[String(k)],
      }))
    : [];

  const description = String(
    (typeof item.description === "string" ? item.description : item.description?.en) ||
      item.desc ||
      ""
  );

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center px-4 ${animatingOut ? 'animate-out fade-out-0 zoom-out-95 duration-300 ease-in' : 'animate-in fade-in-0 zoom-in-95 duration-300 ease-out'}`}>
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ease-in-out"
        onClick={handleClose}
        aria-hidden
      />
      <div className={`relative z-10 w-full max-w-7xl overflow-hidden rounded-2xl shadow-2xl ${cls.wrapper} ${cls.bg} dark:text-zinc-100 animate-in slide-in-from-bottom-4 fade-in duration-300 ease-out`}>
        {/* Header: Image, Name, Chips, Close */}
        <div className="flex items-center justify-between gap-4 border-b border-gray-300 p-5 dark:border-gray-700 transition-all duration-200 ease-in-out">
          <div className="flex items-center gap-4">
            <div className="rounded-xl bg-gray-200 p-1 shadow-sm dark:bg-gray-800 transition-all duration-200 ease-in-out hover:shadow-md">
              {item._image || item.imageFilename ? (
                <Image
                  src={item._image ?? item.imageFilename}
                  alt={String(name)}
                  width={84}
                  height={84}
                  className="rounded-lg object-cover transition-transform duration-200 ease-in-out hover:scale-105"
                />
              ) : (
                <div className="h-20 w-20 rounded-lg bg-gray-200 dark:bg-gray-800 transition-all duration-200 ease-in-out" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-zinc-100 leading-tight transition-colors duration-200 ease-in-out">
                {String(name)}
              </h3>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="whitespace-nowrap rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-zinc-200">{type}</span>
                <span className={`${cls.badgeBg} ${cls.badgeText} rounded-full px-2 py-1 text-xs font-medium`}>{rarityLabel}</span>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-zinc-200">Sell: ${String(item.value ?? "—")}</span>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-zinc-200">{String(item.weightKg ?? "—")} kg</span>
                <span className="rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-zinc-200">Stack {String(item.stackSize ?? "—")}</span>
              </div>
            </div>
          </div>
          <Button
            onClick={handleClose}
            variant="outline"
            size="icon"
            aria-label="Close modal"
            className="bg-gray-200 text-gray-800 hover:bg-gray-300 dark:bg-gray-700 dark:text-zinc-200 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out hover:scale-105"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Description */}
        <div className="p-6 pb-0">
          <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-zinc-200">Description</h4>
          <p className="text-sm text-gray-700 dark:text-zinc-400">{description || "No description available."}</p>
        </div>

        {/* Materials & Crafting */}
        <div className="p-6 pt-4 pb-0 grid gap-6 md:grid-cols-2">
          <div>
            <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-zinc-200">Recycles Into</h4>
            <div className="flex flex-wrap gap-3">
              {recyclesList.length === 0 ? (
                <div className="text-sm text-gray-600 dark:text-zinc-400">None</div>
              ) : (
                recyclesList.slice(0, 6).map((r) => (
                  <div key={r.id} className="w-40">
                    {r.itemObj ? <ItemMiniCard item={r.itemObj} suffix={`×${r.qty}`} /> : <div className="text-sm text-gray-700 dark:text-zinc-300">{String(r.id)} ×{String(r.qty)}</div>}
                  </div>
                ))
              )}
            </div>
          </div>
          <div>
<h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-zinc-200">
  Crafting Recipe
  {item.craftBench
    ? ` (${Array.isArray(item.craftBench)
        ? item.craftBench.map((b: any) => {
            const bench = getLocalizedString(b)
              .replace(/_/g, " ")
              .replace(/\b\w/g, c => c.toUpperCase());
            return bench;
          }).join(", ")
        : (() => {
            const bench = getLocalizedString(item.craftBench)
              .replace(/_/g, " ")
              .replace(/\b\w/g, c => c.toUpperCase());
            return bench;
          })()
      })`
    : ""}
</h4>
  <div className="flex flex-wrap gap-3">
    {recipeList.length === 0 ? (
      <div className="text-sm text-gray-600 dark:text-zinc-400">Not craftable</div>
    ) : (
      recipeList.slice(0, 6).map((r) => (
        <div key={r.id} className="w-40">
          {r.itemObj ? <ItemMiniCard item={r.itemObj} suffix={`×${r.qty}`} /> : <div className="text-sm text-gray-700 dark:text-zinc-300">{String(r.id)} ×{String(r.qty)}</div>}
        </div>
      ))
    )}
  </div>
</div>
        </div>

        {/* References */}
        <div className="p-6 pt-4">
          <h4 className="mb-2 text-sm font-semibold text-gray-800 dark:text-zinc-200">Referenced In</h4>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Projects</span>
                <span className="text-xs text-gray-600 dark:text-zinc-400">{String((references?.projects?.length) ?? 0)}</span>
              </div>
              <ul className="space-y-3">
                {(references?.projects?.length ?? 0) === 0 ? (
                  <li className="text-sm text-gray-600 dark:text-zinc-400">No projects reference this item.</li>
                ) : (
                  references.projects.map((p: any, i: number) => (
                    <li key={i} className="flex items-start gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">
                          {String(p.name ?? p.file)} {p.level ? `Level ${p.level}` : ''}
                        </div>
                        {p.qty ? <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">Quantity: {String(p.qty)}</div> : null}
                        {p.description ? <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">{String(p.description)}</div> : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-700 dark:text-zinc-300">Quests</span>
                <span className="text-xs text-gray-600 dark:text-zinc-400">{String((references?.quests?.length) ?? 0)}</span>
              </div>
              <ul className="space-y-3">
                {(references?.quests?.length ?? 0) === 0 ? (
                  <li className="text-sm text-gray-600 dark:text-zinc-400">No quests reference this item.</li>
                ) : (
                  references.quests.map((q: any, i: number) => (
                    <li key={i} className="flex items-start gap-4 hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded-lg">
                      <div>
                        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">{String(q.name ?? q.file)}</div>
                        {q.description ? <div className="text-xs text-gray-600 dark:text-zinc-400 mt-1">{String(q.description)}</div> : null}
                        {q.objectives ? <div className="mt-2 text-xs text-gray-600 dark:text-zinc-400">Objectives: {String(q.objectives)}</div> : null}
                      </div>
                    </li>
                  ))
                )}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}