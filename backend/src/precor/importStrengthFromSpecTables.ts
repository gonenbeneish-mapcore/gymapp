import { PDFParse } from "pdf-parse";

export type PrecorMachine = {
  model: string;
  name: string;
  line: "Resolute" | "Vitality" | "DiscoveryPlateLoaded" | "Unknown";
};

const SPEC_TABLES_PDF =
  "https://static.precor.com/spec-tables/en-us/Precor-2022-NA-Spec-Tables.pdf";

function normalizeMachineName(s: string) {
  return s
    .replace(/\s+/g, " ")
    .replace(/\s+\/\s+/g, " / ")
    .trim();
}

function extractModelCodes(s: string): string[] {
  const matches = s.match(/\b(?:RSL|VSL|DPL)\d{4}\b/gi) ?? [];
  return matches.map((m) => m.toUpperCase());
}

function stripModelCodes(s: string) {
  return s.replace(/\b(?:RSL|VSL|DPL)\d{4}\b/gi, "").replace(/\s+/g, " ").trim();
}

function inferLineFromModel(model: string): PrecorMachine["line"] {
  if (model.startsWith("RSL")) return "Resolute";
  if (model.startsWith("VSL")) return "Vitality";
  if (model.startsWith("DPL")) return "DiscoveryPlateLoaded";
  return "Unknown";
}

/**
 * Extracts strength machine model+name pairs from Precor's official spec tables PDF.
 *
 * Notes:
 * - We intentionally avoid scraping Issuu; this is a static asset hosted by Precor.
 * - The PDF is formatted as alternating lines in many places:
 *   MODEL_CODE (e.g., RSL0204) then NAME (e.g., BICEPS CURL).
 */
export async function importPrecorStrengthMachinesFromPdf(): Promise<{
  sourceUrl: string;
  machines: PrecorMachine[];
}> {
  const res = await fetch(SPEC_TABLES_PDF);
  if (!res.ok) {
    throw new Error(`Failed to fetch spec tables PDF (${res.status})`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  const parser = new PDFParse({ data: buf });
  const textResult = await parser.getText();
  await parser.destroy();

  const lines = textResult.text
    .split(/\r?\n/g)
    .map((l) => l.trim())
    .filter(Boolean);

  const machines: PrecorMachine[] = [];
  const seen = new Set<string>();

  for (let i = 0; i < lines.length - 1; i++) {
    const model = lines[i]!;
    // Strength model codes we care about for the bank.
    if (!/^(RSL|VSL|DPL)\d{4}$/i.test(model)) continue;

    let rawName = lines[i + 1]!;
    // Skip if next line looks like another model code.
    if (/^(RSL|VSL|DPL)\d{4}$/i.test(rawName)) continue;

    const maybeNext = lines[i + 2];
    if (
      maybeNext &&
      !/^(RSL|VSL|DPL)\d{4}$/i.test(maybeNext) &&
      rawName.length <= 14 &&
      /^[A-Z0-9 /-]+$/.test(rawName) &&
      /^[A-Z0-9 /-]+$/.test(maybeNext)
    ) {
      rawName = `${rawName} ${maybeNext}`;
    }

    const embeddedCodes = extractModelCodes(rawName);
    const baseName = normalizeMachineName(stripModelCodes(rawName));
    if (baseName.length < 3) continue;

    const codes = [model.toUpperCase(), ...embeddedCodes].filter(
      (v, idx, arr) => arr.indexOf(v) === idx,
    );

    for (const code of codes) {
      const key = `${code}|${baseName.toUpperCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);

      machines.push({
        model: code,
        name: baseName,
        line: inferLineFromModel(code),
      });
    }
  }

  // Prefer stable ordering.
  machines.sort((a, b) => a.name.localeCompare(b.name));

  return { sourceUrl: SPEC_TABLES_PDF, machines };
}

