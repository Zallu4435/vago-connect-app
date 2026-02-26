/**
 * Safely extracts a readable filename from a URL or fallback string.
 * @param {string} urlOrName - The URL or name string to parse.
 * @returns {string} The decoded filename or an empty string/"Document" fallback.
 */
export function getFileName(urlOrName) {
    if (!urlOrName) return "Document";
    try {
        const u = new URL(urlOrName);
        const base = u.pathname.split("/").pop() || "Document";
        return decodeURIComponent(base);
    } catch {
        return String(urlOrName);
    }
}

/**
 * Extracts the file extension (uppercase) from a filename string.
 * @param {string} fileName - The filename to parse.
 * @returns {string} The uppercase extension (e.g., "PDF") or empty string.
 */
export function getFileExtension(fileName) {
    if (!fileName) return "";
    const parts = fileName.split(".");
    return parts.length > 1 ? parts.pop().toUpperCase() : "";
}

/**
 * Returns a Tailwind class string for a badge color based on common file extensions.
 * @param {string} ext - The uppercase file extension.
 * @returns {string} The Tailwind CSS classes for the background and text color.
 */
export function getExtensionColor(ext) {
    switch (ext) {
        case "PDF": return "bg-red-500 text-white";
        case "DOC":
        case "DOCX": return "bg-blue-500 text-white";
        case "XLS":
        case "XLSX": return "bg-emerald-600 text-white";
        case "PPT":
        case "PPTX": return "bg-orange-500 text-white";
        case "ZIP":
        case "RAR":
        case "7Z": return "bg-yellow-600 text-white";
        case "TXT":
        case "CSV": return "bg-slate-500 text-white";
        default: return "bg-ancient-bubble-user-light text-ancient-bg-dark";
    }
}
