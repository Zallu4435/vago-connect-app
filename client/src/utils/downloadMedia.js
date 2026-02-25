export const downloadMedia = async (url, fileName = "download") => {
    if (!url) return;

    try {
        let downloadUrl = url;

        // --- 1. Sanitize Cloudinary URLs ---
        // Cloudinary automatically serves highly compressed webp/avif if f_auto or q_auto are present.
        // We strip out transformation blocks (e.g., /upload/f_auto,q_auto/v123456/) to fetch the raw original.
        if (downloadUrl.includes("res.cloudinary.com") && downloadUrl.includes("/upload/")) {
            // Match any transformation parameters sitting between /upload/ and the version number /v123.../
            downloadUrl = downloadUrl.replace(/\/upload\/(?:[a-zA-Z0-9_.,-]+)\/v(\d+)\//, "/upload/v$1/");
            // fallback if it just doesn't have a v number.
            downloadUrl = downloadUrl.replace(/\/upload\/(?:[a-zA-Z0-9_.,-]+)\/(?!v\d+)/, "/upload/");
        }

        // --- 2. Clean the target file name ---
        // Ensure the filename actually possesses an extension from the URL if one isn't cleanly provided.
        let finalFileName = fileName;
        if (!finalFileName.includes(".")) {
            const urlMatches = downloadUrl.match(/\.([a-zA-Z0-9]+)(?:[\?#]|$)/);
            if (urlMatches && urlMatches[1]) {
                finalFileName = `${finalFileName}.${urlMatches[1]}`;
            } else {
                // Fallback guess based on the URL context if it's an image
                finalFileName = `${finalFileName}.jpg`;
            }
        }

        // --- 3. Execute Cross-Origin Blob Fetch ---
        // Fetching the file directly into client memory (RAM) bypasses browser cross-origin window policies.
        // This allows us to forcibly synthesize a native download dialog with exact filenames and MIME types.
        const response = await fetch(downloadUrl, {
            method: "GET",
            headers: {
                "Cache-Control": "no-cache"
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP Error: ${response.status} - Failed to fetch media chunk.`);
        }

        // Convert the HTTP response stream to a binary Blob
        const blob = await response.blob();

        // Create a temporary local URL pointing to the RAM blob
        const blobUrl = window.URL.createObjectURL(blob);

        // --- 4. Synthesize Native Download ---
        const link = document.createElement("a");
        link.href = blobUrl;
        link.download = finalFileName;
        link.style.display = "none";

        // Append -> Click -> Remove -> Revoke to keep the DOM completely clean and prevent memory leaks.
        document.body.appendChild(link);
        link.click();

        // Cleanup
        setTimeout(() => {
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        }, 100);

    } catch (error) {
        console.error("Industrial Downloader Failed. Triggering hard-fallback to window.open:", error);
        // Absolute fallback: If CORS blocks the fetch or the network fails, we gracefully degrade to 
        // opening the original URL in a new window so the user is never permanently blocked.
        window.open(url, "_blank", "noopener,noreferrer");
    }
};
