export const downloadMedia = async (url, fileName = "download") => {
    if (!url) return;

    try {
        let downloadUrl = url;

        // If it's a Cloudinary URL, we can force the server to send it as an attachment.
        if (downloadUrl.includes("res.cloudinary.com") && downloadUrl.includes("/upload/")) {
            // Find where the version tag starts (e.g., /v171.../)
            // We want to inject fl_attachment RIGHT BEFORE the version or right after /upload/
            const uploadPart = "/upload/";
            const uploadIndex = downloadUrl.indexOf(uploadPart) + uploadPart.length;

            // Clean output filename to be URL-safe without spaces
            const safeName = (fileName || "document").replace(/[^a-zA-Z0-9.-]/g, "_");

            // Reconstruct: .../upload/fl_attachment:filename/v12345/...
            downloadUrl = downloadUrl.slice(0, uploadIndex) + `fl_attachment:${safeName}/` + downloadUrl.slice(uploadIndex);
        }

        // --- Execute Native Download ---
        // Instead of fetching the blob into RAM (which causes CORS issues) or opening a new tab,
        // we create a temporary invisible iframe and set its source to the forced-attachment URL.
        // The browser natively handles the download dialog without changing the user's page.
        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = downloadUrl;
        document.body.appendChild(iframe);

        // Cleanup the DOM after giving the browser time to initiate the download
        setTimeout(() => {
            document.body.removeChild(iframe);
        }, 3000);

    } catch (error) {
        console.error("Native Downloader Failed. Triggering hard-fallback to window.open", error);
        window.open(url, "_blank", "noopener,noreferrer");
    }
};
