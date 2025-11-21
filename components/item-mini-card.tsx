// new small card used inside modals
"use client";
import React from "react";
import Image from "next/image";

function getLocalizedString(value: any) {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    return value.en || value["en-US"] || Object.values(value).find((v) => typeof v === "string") || "";
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
  return "common";
}

function rarityAccent(key: string) {
  switch (key) {
    case "uncommon": return "ring-emerald-300 dark:ring-emerald-700";
    case "rare": return "ring-sky-300 dark:ring-sky-700";
    case "epic": return "ring-violet-300 dark:ring-violet-700";
    case "legendary": return "ring-yellow-300 dark:ring-yellow-600";
    case "common":
    default: return "ring-gray-200 dark:ring-zinc-800";
  }
}

export default function ItemMiniCard({ item, suffix }: { item: any; suffix?: string }) {
  const name = getLocalizedString(item.name ?? item.id ?? "Unknown");
  const rarityKey = normalizeRarityKey(item.rarity ?? item.tier ?? "");
  const img = item._image ?? item.imageFilename ?? null;

  return (
    <div className={`flex items-center gap-3 rounded-lg border p-3 bg-gray-100 dark:bg-gray-700 ${rarityAccent(rarityKey)} transition-all duration-200 ease-in-out hover:shadow-md`}>
      <div className="h-12 w-12 flex-shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-900 flex justify-center items-center">
        {img ? <Image src={img} alt={name} width={48} height={48} className="object-cover w-full h-full" /> : null}
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-medium text-gray-900 dark:text-zinc-100">{name}</div>
        {suffix ? <div className="text-xs text-gray-600 dark:text-zinc-300 mt-1">{suffix}</div> : null}
      </div>
    </div>
  );
}