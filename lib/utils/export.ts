/**
 * Converts an array of objects into a properly escaped CSV string
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  headers?: { key: keyof T; label: string }[]
): string {
  if (!data || data.length === 0) return "";

  const resolvedHeaders = headers
    ? headers
    : (Object.keys(data[0]) as (keyof T)[]).map((k) => ({
        key: k,
        label: String(k).replace(/_/g, " ").toUpperCase(),
      }));

  const headerRow = resolvedHeaders.map((h) => `"${h.label.replace(/"/g, '""')}"`).join(",");

  const rows = data.map((item) =>
    resolvedHeaders
      .map((h) => {
        const val = item[h.key];
        if (val === null || val === undefined) return '""';
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );

  return [headerRow, ...rows].join("\r\n");
}

/**
 * Initiates browser download of CSV text
 */
export function downloadCSV(filename: string, csvContent: string): void {
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
