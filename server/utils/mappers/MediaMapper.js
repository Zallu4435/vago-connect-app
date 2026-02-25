import { buildCloudinaryUrl } from "../Cloudinary.js";

export class MediaMapper {
    static toMediaItem(m, mf = null) {
        if (mf) {
            let itemType = mf.cloudinaryResourceType || m.type || '';
            if (mf.mimeType) itemType = mf.mimeType.split('/')[0];
            if (!['image', 'video', 'audio', 'location'].includes(itemType)) itemType = 'document';

            return {
                mediaId: mf.id,
                messageId: m.id,
                conversationId: m.conversationId,
                senderId: m.senderId,
                type: itemType,
                url: buildCloudinaryUrl(mf.cloudinaryPublicId, { resource_type: mf.cloudinaryResourceType || 'auto' }),
                thumbnailUrl: mf.thumbnailKey ? buildCloudinaryUrl(mf.thumbnailKey, { resource_type: mf.cloudinaryResourceType || 'image' }) : m.thumbnailUrl || null,
                mimeType: mf.mimeType,
                fileSize: mf.fileSize != null ? String(mf.fileSize) : null,
                width: mf.width,
                height: mf.height,
                duration: mf.duration,
                createdAt: m.createdAt,
                fileName: mf.originalName || m.fileName || m.caption || null,
            };
        }

        if (!m.content) return null;

        let fallbackType = m.type;
        if (['text', 'unknown'].includes(fallbackType) || !fallbackType) {
            const urlLower = m.content.toLowerCase();
            if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|heic)(\?.*)?$/)) fallbackType = 'image';
            else if (urlLower.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/)) fallbackType = 'video';
            else if (urlLower.match(/\.(mp3|wav|ogg|m4a)(\?.*)?$/)) fallbackType = 'audio';
            else fallbackType = 'document';
        }

        const fallbackUrl = m.content.startsWith('http')
            ? m.content
            : buildCloudinaryUrl(m.content, { resource_type: fallbackType === 'document' ? 'raw' : fallbackType });

        return {
            mediaId: m.id,
            messageId: m.id,
            conversationId: m.conversationId,
            senderId: m.senderId,
            type: fallbackType,
            url: fallbackUrl,
            thumbnailUrl: m.thumbnailUrl || null,
            mimeType: null,
            fileSize: null,
            width: null,
            height: null,
            duration: null,
            createdAt: m.createdAt,
            fileName: m.fileName || m.caption || m.content,
        };
    }

    static mapMediaMessages(messages) {
        return messages.flatMap((m) => {
            if (m.mediaFiles && m.mediaFiles.length > 0) {
                return m.mediaFiles.map((mf) => this.toMediaItem(m, mf));
            }
            const fallback = this.toMediaItem(m);
            return fallback ? [fallback] : [];
        });
    }
}
