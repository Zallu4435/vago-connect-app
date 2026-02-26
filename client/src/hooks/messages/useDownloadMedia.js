import { useState, useCallback } from 'react';
import { MessageService } from '@/services/messageService';
import { showToast } from '@/lib/toast';

export const useDownloadMedia = () => {
    const [downloadProgress, setDownloadProgress] = useState({ id: null, percent: 0 });

    const downloadMedia = useCallback(async (msg) => {
        if (!msg || !msg.id || !msg.content) return;

        try {
            setDownloadProgress({ id: msg.id, percent: 0 });

            const onProgress = (e) => {
                if (e.total) {
                    const pct = Math.round((e.loaded * 100) / e.total);
                    setDownloadProgress({ id: msg.id, percent: pct });
                }
            };

            const blobObj = await MessageService.downloadMedia(msg.id, onProgress);
            const objectUrl = URL.createObjectURL(blobObj);

            const a = document.createElement("a");
            a.href = objectUrl;

            let ext = "bin";
            if (msg.type === "image") ext = "jpg";
            else if (msg.type === "video") ext = "mp4";
            else if (msg.type === "audio") ext = "mp3";
            else {
                const parts = msg.content.split(".");
                if (parts.length > 1) ext = parts[parts.length - 1];
            }

            a.download = `VagoConnect_${msg.id}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);

            setTimeout(() => { URL.revokeObjectURL(objectUrl); }, 1000);

        } catch (error) {
            console.error("Download failed:", error);
            showToast.error("Failed to download media");
        } finally {
            setTimeout(() => setDownloadProgress({ id: null, percent: 0 }), 300);
        }
    }, []);

    return { downloadMedia, downloadProgress };
};
