"use client";
import React, { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sun, Moon, Sword } from "lucide-react";
import ItemCard from "../components/item-card";

export default function ItemsPage() {
  const { theme, setTheme } = useTheme();
  const [data, setData] = useState<{
    shouldSell: any[];
    safeToRecycle: any[];
    keep: any[];
    itemReferences: Record<string, { quests: any[]; projects: any[] }>;
    allItems: any[];
    types: string[];
  } | null>(null);

  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  // sections collapse state (top-level: keep/sell/recycle/blueprints/weapons/modifications/quickuse)
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    keep: true,
    sell: true,
    recycle: true,
    blueprints: false,
    weapons: false,
    "weapons-mods": false,
    quickuse: false,
    augments: false,
  });

  // refs for scrolling
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    async function load() {
      const res = await fetch("/api/items");
      if (res.ok) {
        const data = await res.json();
        setData(data);
      } else {
        console.error("Failed to fetch items");
      }
    }
    load();
  }, []);

  if (!data) return <div className="animate-pulse">Loading...</div>;

  const { shouldSell, safeToRecycle, keep, itemReferences, allItems, types } = data;
  const itemsLookup: Record<string, any> = {};
  for (const it of allItems) itemsLookup[String(it.id)] = it;

  // Heuristics for classification
  function isWeapon(it: any) {
    if (!it) return false;
    const typeStr = (it.type || "").toString().toLowerCase();
    if (typeStr.includes("weapon")) return true;
    if (it.isWeapon === true) return true;
    if ((it.category || "").toString().toLowerCase().includes("weapon")) return true;
    if (it.weapon || it.weaponType || it.subtype || it.class) return true;
    return false;
  }

  function isWeaponMod(it: any) {
    if (!it) return false;

    const typeStr = (it.type || "").toString().toLowerCase();
    const catStr = (it.category || "").toString().toLowerCase();
    const subStr = (it.subtype || "").toString().toLowerCase();
    const nameStr = (typeof it.name === "string" ? it.name : it.name?.en || "").toLowerCase();

    // ONLY include “modification”
    if (typeStr.includes("modification")) return true;
    if (catStr.includes("modification")) return true;
    if (subStr.includes("modification")) return true;
    if (nameStr.includes("modification")) return true;

    return false;
  }

  function isAugment(it: any) {
    if (!it) return false;

    const typeStr = (it.type || "").toString().toLowerCase();
    const catStr = (it.category || "").toString().toLowerCase();
    const subStr = (it.subtype || "").toString().toLowerCase();
    const nameStr = (typeof it.name === "string" ? it.name : it.name?.en || "").toLowerCase();

    if (typeStr.includes("augment")) return true;
    if (catStr.includes("augment")) return true;
    if (subStr.includes("augment")) return true;
    if (nameStr.includes("augment")) return true;

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

  function isQuickUse(it: any) {
    if (!it) return false;
    const name = (typeof it.name === "string" ? it.name : it.name?.en || "").toLowerCase();
    const type = (it.type || "").toString().toLowerCase();
    const cat = (it.category || "").toString().toLowerCase();
    const quickKeywords = ["quick-use", "quick use", "quickuse", "quick", "consumable", "usable", "instant", "medkit", "stim", "grenade", "throwable", "consumables"];
    const combined = `${name} ${type} ${cat}`;
    return quickKeywords.some((k) => combined.includes(k));
  }

  // Exclude weapon mods and quick-use items from main categories
  const filteredKeep = keep.filter((it) => !isWeaponMod(it) && !isQuickUse(it) && !isAugment(it));
  const filteredSell = shouldSell.filter((it) => !isWeaponMod(it) && !isQuickUse(it) && !isAugment(it));
  const filteredRecycle = safeToRecycle.filter((it) => !isWeaponMod(it) && !isQuickUse(it) && !isAugment(it));

  // All weapons and modifications collected into separate top-level lists
  const weaponMods = allItems.filter((it) => isWeaponMod(it));
  const weaponItems = allItems.filter((it) => isWeapon(it) && !isWeaponMod(it));

  // All blueprints collected into a single list
  const blueprintAll = allItems.filter((it) => isBlueprint(it));

  // Quick use category
  const quickUseAll = allItems.filter((it) => isQuickUse(it));

  const augmentAll = allItems.filter((it) => isAugment(it));

  function filterItems(items: any[]) {
    let filtered = items;
    if (selectedTypes.length > 0) {
      filtered = filtered.filter((it) => selectedTypes.includes(it.type));
    }
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter((it) =>
        (typeof it.name === "string" ? it.name : it.name?.en || "").toLowerCase().includes(query) ||
        (it.type && it.type.toLowerCase().includes(query))
      );
    }
    return filtered;
  }

  function toggleType(type: string) {
    setSelectedTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }

  function clearFilters() {
    setSelectedTypes([]);
    setSearchQuery("");
  }

  function slugify(s: string) {
    return s.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-_]/g, "");
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function scrollToSection(key: string) {
    const el = sectionRefs.current[key];
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      // expand navigated-to section
      setExpandedSections((prev) => ({ ...prev, [key]: true }));
    }
  }

  function Section({ title, items, sectionKey }: { title: string; items: any[]; sectionKey?: string }) {
    const filtered = filterItems(items);
    if (filtered.length === 0) return null;
    const isCollapsed = sectionKey ? !expandedSections[sectionKey] : false;
    const id = sectionKey ? sectionKey : slugify(title);

    return (
      <section
        id={id}
        ref={(el) => { sectionRefs.current[id] = el; }}
        className="mb-12 animate-in slide-in-from-bottom-4 fade-in duration-1000 ease-out"
      >
        <header className="mb-4 flex items-baseline justify-between">
          <div>
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 transition-colors duration-200 ease-in-out">{title}</h2>
            <span className="text-sm text-zinc-500 dark:text-zinc-400 transition-colors duration-200 ease-in-out">{filtered.length} items</span>
          </div>
          {sectionKey ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleSection(sectionKey)}
                className="rounded px-3 py-1 text-sm bg-gray-200 dark:bg-gray-700"
                aria-expanded={!isCollapsed}
              >
                {isCollapsed ? "Show" : "Hide"}
              </button>
            </div>
          ) : null}
        </header>

        {!isCollapsed && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3">
            {filtered.map((it: any, idx: number) => (
              <div key={it.id ?? it._sourceFile ?? idx} className="animate-in slide-in-from-bottom-4 fade-in duration-300 ease-out" style={{ animationDelay: `${idx * 50}ms` }}>
                <ItemCard
                  item={it}
                  references={itemReferences[String(it.id)] ?? { quests: [], projects: [] }}
                  lookup={itemsLookup}
                />
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  return (
    <main className="min-h-screen py-12 dark:text-zinc-100 transition-colors duration-300 ease-in-out relative">
      {/* Fixed background image (public/bg.jpg). Adjust blur px and opacity below to taste.
          Current: blur 8px, opacity 0.5 (50%). */}
      <div className="fixed inset-0 -z-10">
        <img
          src="/bg.jpg" // 1. Corrected file name back to .jpg
          alt=""
          className="w-full h-full object-cover"
          style={{ filter: "blur(8px)", opacity: 1 }}
        />
        {/* 2. Added a dark overlay to darken the image slightly and blend with the theme */}
        <div className="absolute inset-0 bg-zinc-50 dark:bg-gray-900 opacity-90"></div> 
      </div>

      <div className="mx-auto w-full max-w-6xl px-6 animate-in fade-in duration-500 ease-out">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 dark:text-zinc-50 transition-colors duration-200 ease-in-out flex items-center gap-2">
              <Sword className="h-8 w-8 text-zinc-700 dark:text-zinc-300" />
              RaiderHelper
            </h1>
            <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400 transition-colors duration-200 ease-in-out">Making inventory management a breeze.</p>
          </div>
          <Button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            variant="outline"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="bg-gray-800 text-zinc-200 hover:bg-gray-700 dark:bg-gray-700 dark:text-zinc-300 dark:hover:bg-gray-600 transition-all duration-200 ease-in-out hover:scale-105 p-2"
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>

        {/* Filters */}
        <div className="mb-8 animate-in slide-in-from-top-4 fade-in duration-500 ease-out">
          <div className="mb-4">
            <Input
              type="text"
              placeholder="Search items by name or type..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white dark:bg-gray-800 dark:text-zinc-100 dark:placeholder-zinc-400 dark:border-gray-600 transition-all duration-200 ease-in-out focus:scale-105"
            />
          </div>
          <h3 className="mb-2 text-lg font-medium text-zinc-900 dark:text-zinc-50 transition-colors duration-200 ease-in-out">Filter by Type</h3>
          <div role="group" aria-label="Filter by item type" className="flex flex-wrap gap-2">
            <button
              onClick={clearFilters}
              aria-pressed={selectedTypes.length === 0 && !searchQuery.trim()}
              className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ease-in-out hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:outline-none ${selectedTypes.length === 0 && !searchQuery.trim()
                  ? "bg-blue-500 text-white hover:bg-blue-600"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-zinc-300 dark:hover:bg-gray-600"
                }`}
            >
              All
            </button>
            {types.map((type) => (
              <button
                key={type}
                onClick={() => toggleType(type)}
                aria-pressed={selectedTypes.includes(type)}
                className={`rounded-full px-4 py-2 text-sm font-medium shadow-sm transition-all duration-200 ease-in-out hover:scale-105 focus:ring-2 focus:ring-blue-500 focus:outline-none ${selectedTypes.includes(type)
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-zinc-300 dark:hover:bg-gray-600"
                  }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* Layout with sidebar + content */}
        <div className="flex gap-8">
          {/* Sidebar (shadcn-like) */}
          <aside className="w-60 hidden md:block">
            <div className="sticky top-24 rounded-md border bg-white dark:bg-gray-800 dark:border-gray-700 p-4 shadow-sm">
              <h4 className="mb-3 text-sm font-semibold text-zinc-700 dark:text-zinc-200">Home</h4>

              <h5 className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-400">Items</h5>
              <nav aria-label="Page sections" className="flex flex-col gap-2 text-sm">
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("keep")}>Keep</button>
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("sell")}>Consider Selling</button>
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("recycle")}>Safe to Recycle</button>

                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("blueprints")}>Blueprints</button>
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("quickuse")}>Quick Use</button>
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("augments")}>Augments</button>

                <h5 className="mb-2 mt-3 text-xs font-medium text-zinc-600 dark:text-zinc-400">Weapons</h5>
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("weapons")}>Weapons</button>
                <button className="text-left rounded-md px-2 py-1 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors" onClick={() => scrollToSection("weapons-mods")}>Modifications</button>
              </nav>
            </div>
          </aside>

          {/* Main content */}
          <div className="flex-1">
            <Section title="Keep" items={filteredKeep} sectionKey="keep" />
            <Section title="Consider Selling" items={filteredSell} sectionKey="sell" />
            <Section title="Safe to Recycle" items={filteredRecycle} sectionKey="recycle" />
            <Section title="Blueprints" items={blueprintAll} sectionKey="blueprints" />
            <Section title="Quick Use" items={quickUseAll} sectionKey="quickuse" />

            <Section title="Augments" items={augmentAll} sectionKey="augments" />

            {/* Weapons and Modifications as separate top-level sections */}
            <Section title="Weapons" items={weaponItems} sectionKey="weapons" />
            <Section title="Modifications" items={weaponMods} sectionKey="weapons-mods" />
          </div>
        </div>
      </div>
    </main>
  );
}