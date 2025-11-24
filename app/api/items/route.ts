import { NextResponse } from "next/server";
import { categorizeAllItems } from "../../../lib/categorizeItems";
import { getAllItems } from "../../../lib/getItems";

export async function GET() {
  try {
    const { shouldSell, safeToRecycle, keep, itemReferences } = await categorizeAllItems();
    const allItems = await getAllItems();
    const itemsLookup: Record<string, any> = {};
    for (const it of allItems) itemsLookup[String(it.id)] = it;

    const types = Array.from(new Set(allItems.map((it: any) => it.type).filter(Boolean))).sort();

    return NextResponse.json({
      shouldSell,
      safeToRecycle,
      keep,
      itemReferences,
      allItems,
      types,
    });
  } catch (error) {
    console.error("Error fetching items:", error);
    return NextResponse.json({ error: "Failed to fetch items" }, { status: 500 });
  }
}