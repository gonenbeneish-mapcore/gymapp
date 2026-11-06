export type SaveResult = "shared" | "downloaded" | "cancelled";

/**
 * Hand a text file to the user. On iPhone this opens the share sheet, where
 * "Save to Files" can put it in iCloud Drive or Google Drive. Falls back to a
 * normal download where sharing files isn't supported. Must be called from a
 * tap (browsers only allow sharing in response to the user).
 */
export async function saveTextFile(name: string, text: string): Promise<SaveResult> {
  for (const type of ["application/json", "text/plain"]) {
    const file = new File([text], name, { type });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: name });
        return "shared";
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return "cancelled";
        break; // share failed for another reason — fall back to download
      }
    }
  }

  const url = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  try {
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  } finally {
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  }
  return "downloaded";
}
