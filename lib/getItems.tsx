import fs from "fs/promises";
import path from "path";

// ...existing code...
export async function getAllItems(): Promise<any[]> {
  const itemsDir = path.join(process.cwd(), "arcraiders-data", "items");
  const imagesRoot = path.join(process.cwd(), "arcraiders-data", "images");
  const imagesDir = path.join(imagesRoot, "items");
  const publicImagesDir = path.join(process.cwd(), "public", "arcraiders-data", "images", "items");

  await fs.mkdir(publicImagesDir, { recursive: true }).catch(() => {});

  const itemFiles = (await fs.readdir(itemsDir).catch(() => [])).filter(f => f.endsWith(".json"));
  const imageList = (await fs.readdir(imagesDir).catch(() => [])).map(f => f.toString());
  const imageFilesLower = imageList.map(f => f.toLowerCase());

  const items: any[] = [];

  // Accept any since fields can be localized objects or strings
  function normalizeCandidateBase(s?: any) {
    if (!s) return "";
    // prefer english text if passed an object
    if (typeof s === "object" && s !== null) {
      const obj = s as Record<string, any>;
      const candidate = obj.en ?? obj["en-US"] ?? Object.values(obj).find((v: any) => typeof v === "string");
      s = candidate ?? "";
    }
    s = String(s).toLowerCase().trim();

    // remove "mk 1", "mk.2", "mk ii", "combat mk 1", " - I", roman numerals, trailing tier tokens
    s = s.replace(/\s*[-–—]\s*[ivx]{1,5}$/i, "");
    s = s.replace(/\s*\(?[ivx]{1,5}\)?$/i, "");
    s = s.replace(/\s*(?:mk\.?\s*\d+|mk\.?\s*[ivx]+|mk\s*\d+|mk\s*[ivx]+)$/i, "");
    s = s.replace(/\s*(?:\bI\b|\bII\b|\bIII\b|\bIV\b|\bV\b)$/i, "");
    // replace non-alnum with underscore for slug matching
    s = s.replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, "");
    return s;
  }

  // known JSON image fields (common names)
  const imageFieldCandidates = ["image", "icon", "sprite", "imagePath", "iconPath", "texture", "imageUrl", "thumbnail", "imageFilename"];

  const pushItem = async (p: any, srcFile: string) => {
    p._sourceFile = srcFile;

    // 1) If JSON explicitly links to an image, prefer that.
    let explicitImage: string | undefined;
    for (const key of imageFieldCandidates) {
      const v = p[key];
      if (!v) continue;
      if (typeof v === "string" && v.trim()) {
        explicitImage = v.trim();
        break;
      } else if (typeof v === "object" && v !== null) {
        const obj = v as Record<string, any>;
        explicitImage = obj.en ?? obj["en-US"] ?? Object.values(obj as any).find((x: any) => typeof x === "string") as string | undefined;
        if (explicitImage) break;
      }
    }

    if (explicitImage) {
      // normalize to basename if a path/URL is provided
      try {
        const basename = path.basename(explicitImage);
        // try to find this basename in images/items first
        const foundIndex = imageFilesLower.findIndex(f => f === basename.toLowerCase() || f.endsWith(basename.toLowerCase()));
        if (foundIndex >= 0) {
          const found = imageList[foundIndex];
          const src = path.join(imagesDir, found);
          const dest = path.join(publicImagesDir, found);
          try {
            const [sStat, dStat] = await Promise.all([
              fs.stat(src).catch(() => null),
              fs.stat(dest).catch(() => null),
            ]);
            if (!dStat || (sStat && dStat && sStat.size !== dStat.size)) {
              await fs.copyFile(src, dest).catch(() => {});
            }
            p._image = `/arcraiders-data/images/items/${found}`;
          } catch {
            // ignore
          }
        } else {
          // try to find the file anywhere under arcraiders-data/images (subfolders)
          const walkDirs = await fs.readdir(imagesRoot).catch(() => []);
          for (const sub of walkDirs) {
            const candidateDir = path.join(imagesRoot, sub);
            try {
              const files = await fs.readdir(candidateDir);
              const idx = files.findIndex(f => f.toLowerCase() === basename.toLowerCase());
              if (idx >= 0) {
                const found = files[idx];
                const src = path.join(candidateDir, found);
                const relDir = path.relative(imagesRoot, candidateDir); // e.g., "items"
                const destDir = path.join(process.cwd(), "public", "arcraiders-data", "images", relDir);
                await fs.mkdir(destDir, { recursive: true }).catch(() => {});
                const dest = path.join(destDir, found);
                await fs.copyFile(src, dest).catch(() => {});
                p._image = `/arcraiders-data/images/${relDir}/${found}`;
                break;
              }
            } catch {
              continue;
            }
          }
        }
      } catch {
        // ignore explicit image resolution errors
      }
    }

    // 2) If no explicit image found, fallback to filename/name-based heuristics (strip tiers like mk/roman)
    if (!p._image) {
      const candidates = new Set<string>();
      if (srcFile) candidates.add(srcFile.replace(/\.json$/i, "").toLowerCase());
      if (p.id) candidates.add(String(p.id).toLowerCase());

      const rawName = (typeof p.name === "string") ? p.name : (p.name?.en ?? "");
      if (rawName) {
        candidates.add(rawName.toLowerCase());
        candidates.add(rawName.toLowerCase().replace(/[^a-z0-9]+/g, "_"));
        candidates.add(normalizeCandidateBase(rawName));
      }

      const fileBase = srcFile.replace(/\.json$/i, "").toLowerCase();
      candidates.add(fileBase);
      candidates.add(normalizeCandidateBase(fileBase));

      let foundImgIndex: number | undefined;
      for (const c of candidates) {
        if (!c) continue;
        const idx = imageFilesLower.findIndex(f => f.startsWith(c));
        if (idx >= 0) { foundImgIndex = idx; break; }
      }
      if (foundImgIndex === undefined) {
        for (const c of candidates) {
          if (!c) continue;
          const idx = imageFilesLower.findIndex(f => f.includes(c));
          if (idx >= 0) { foundImgIndex = idx; break; }
        }
      }

      if (foundImgIndex !== undefined) {
        const found = imageList[foundImgIndex];
        const src = path.join(imagesDir, found);
        const dest = path.join(publicImagesDir, found);
        try {
          const [sStat, dStat] = await Promise.all([
            fs.stat(src).catch(() => null),
            fs.stat(dest).catch(() => null),
          ]);
          if (!dStat || (sStat && dStat && sStat.size !== dStat.size)) {
            await fs.copyFile(src, dest).catch(() => {});
          }
          p._image = `/arcraiders-data/images/items/${found}`;
        } catch {
          // ignore copy errors
        }
      }
    }

    items.push(p);
  };

  for (const f of itemFiles) {
    try {
      const raw = await fs.readFile(path.join(itemsDir, f), "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        for (const p of parsed) {
          if (p && typeof p === "object") await pushItem(p, f);
        }
      } else if (parsed && typeof parsed === "object") {
        await pushItem(parsed, f);
      }
    } catch {
      // ignore malformed
    }
  }

  items.sort((a, b) => {
    const an = (typeof a.name === "string" ? a.name : (a.name?.en ?? a.id ?? "")).toString().toLowerCase();
    const bn = (typeof b.name === "string" ? b.name : (b.name?.en ?? b.id ?? "")).toString().toLowerCase();
    return an.localeCompare(bn);
  });

  return items;
}