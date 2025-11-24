"use client";
import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import ItemModal from "./item-modal";

type Props = { item: any; references?: { quests: any[]; projects: any[] }; lookup?: Record<string, any> };

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

export default function ItemCard({ item, references, lookup }: Props) {
  const name = getLocalizedString(item.name ?? item.id ?? "Unknown");
  const rawRarity = item.rarity ?? item.tier ?? item.tierName ?? "";
  const rarityKey = normalizeRarityKey(rawRarity);
  const rarityLabel = getLocalizedString(rawRarity) || getLocalizedString(item.tier) || "Common";
  const type = getLocalizedString(item.type ?? item.itemType ?? "");
  const description = getLocalizedString(item.description ?? item.desc) || (item.effects ? Object.keys(item.effects).slice(0, 3).join(", ") : "");
  const cls = rarityClassesFor(rarityKey);
  const imageSrc = item._image ?? item.imageFilename ?? null;

  const [open, setOpen] = React.useState(false);

  return (
    <>
      <Card
        className={`group cursor-pointer ${cls.wrapper} ${cls.bg} h-full flex flex-col hover:scale-105 hover:shadow-xl transition-all duration-300 ease-in-out`}
        onClick={() => setOpen(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            setOpen(true);
          }
        }}
      >
        <CardContent className="p-2 flex flex-col h-full">
          {/* Centered Image */}
          <div className="flex justify-center mb-3">
            {imageSrc ? (
              <div className="relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-md bg-gray-200 dark:bg-gray-700 transition-all duration-200 ease-in-out">
                <Image src={imageSrc} alt={name} width={64} height={64} className="object-cover transition-transform duration-200 ease-in-out group-hover:scale-115" />
              </div>
            ) : (
              <div className="h-16 w-16 flex-shrink-0 rounded-md bg-gray-200 dark:bg-gray-700 transition-all duration-200 ease-in-out" />
            )}
          </div>

          {/* Name and Rarity Badge */}
          <div className="text-center mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-zinc-100 transition-colors duration-200 ease-in-out group-hover:text-gray-700 dark:group-hover:text-zinc-200">{name}</h3>
            <div className="mt-3 flex items-center justify-center gap-2">
              <span className="whitespace-nowrap rounded-full bg-gray-200 px-2 py-1 text-xs text-gray-700 dark:bg-gray-700 dark:text-zinc-200 transition-all duration-200 ease-in-out group-hover:bg-gray-300 dark:group-hover:bg-gray-600">{type}</span>
              <span className={`${cls.badgeBg} ${cls.badgeText} rounded-full px-2 py-1 text-xs font-medium transition-all duration-200 ease-in-out`}>{rarityLabel}</span>
            </div>
          </div>

          {/* Description */}
          {description ? <p className="text-xs pb-4 text-gray-700 dark:text-zinc-300 flex-1 transition-colors duration-200 ease-in-out group-hover:text-gray-600 dark:group-hover:text-zinc-400">{description}</p> : null}

          {/* Value Info */}
          <div className="mt-auto flex items-center justify-between text-xs text-gray-600 dark:text-zinc-300 transition-colors duration-200 ease-in-out group-hover:text-gray-500 dark:group-hover:text-zinc-400">
            <span>Sell ≈ {item.value ?? "—"}</span>
            {item._recycleValue ? <span>Recycle ≈ {item._recycleValue}</span> : null}
          </div>
        </CardContent>
      </Card>

      {open && <ItemModal item={item} references={references} lookup={lookup} onClose={() => setOpen(false)} />}
    </>
  );
}