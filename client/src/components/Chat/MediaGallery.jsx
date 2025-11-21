"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContacts } from "@/hooks/queries/useContacts";
import { useChatMedia } from "@/hooks/queries/useChatMedia";
import { useSearchChatMedia } from "@/hooks/queries/useSearchChatMedia";
import { useDownloadMediaUrl } from "@/hooks/queries/useDownloadMediaUrl";
import { MdClose } from "react-icons/md";
import { FaSearch, FaTimesCircle } from "react-icons/fa";
import MediaPreviewGridItem from "./MediaGallery/MediaPreviewGridItem";
import MediaCarouselView from "./MediaGallery/MediaCarouselView";

// MAIN MediaGallery Component
export default function MediaGallery({ open, onClose }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const { data: contacts = [] } = useContacts(userInfo?.id);

  const convoId = useMemo(() => {
    const item = (contacts || []).find((c) => String(c?.user?.id) === String(currentChatUser?.id));
    return item?.conversationId;
  }, [contacts, currentChatUser?.id]);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'images', 'videos', 'documents', 'links', 'audio', 'location'
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [showCarousel, setShowCarousel] = useState(false);
  const [carouselInitialIndex, setCarouselInitialIndex] = useState(0);

  const typeMap = useMemo(() => ({
    all: undefined,
    images: 'image',
    videos: 'video',
    documents: 'document',
    audio: 'audio',
    location: 'location',
    // 'links' might require specific backend support to filter by URL content
  }), []);

  // Use a single query for all media, then filter and paginate client-side
  // or use separate queries if backend supports efficient filtering by type
  const { data: allMediaData, isLoading: allMediaLoading } = useChatMedia({ chatId: convoId, type: typeMap[activeTab], limit: 1000, offset: 0 }); // Fetch more for client-side filtering
  const mediaItems = useMemo(() => {
    return (allMediaData?.items || []).filter(item =>
      searchTerm ? item.fileName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    item.content?.toLowerCase().includes(searchTerm.toLowerCase()) : true
    );
  }, [allMediaData, searchTerm]);


  const [downloadId, setDownloadId] = useState(undefined);
  const { data: dl } = useDownloadMediaUrl(downloadId);

  // Auto-trigger download
  useEffect(() => {
    if (dl?.url && typeof window !== 'undefined') {
      const link = document.createElement('a');
      link.href = dl.url;
      link.setAttribute('download', 'true'); // Or a specific filename from dl.fileName
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      setDownloadId(undefined); // Reset download state
    }
  }, [dl]);

  const handleDownload = useCallback((mediaId) => {
    setDownloadId(mediaId);
  }, []);

  const handleMediaSelect = useCallback((mediaItem) => {
    const index = mediaItems.findIndex(item => item.mediaId === mediaItem.mediaId);
    if (index !== -1) {
      setCarouselInitialIndex(index);
      setShowCarousel(true);
    }
  }, [mediaItems]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-ancient-bg-dark border border-ancient-border-stone rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-xl animate-zoom-in">
        {/* Header */}
        <div className="p-4 bg-ancient-bg-medium border-b border-ancient-border-stone flex items-center justify-between rounded-t-lg">
          <h3 className="text-ancient-text-light text-xl font-bold">Media Gallery</h3>
          <button className="text-ancient-icon-inactive hover:text-ancient-icon-glow transition-colors duration-200" onClick={onClose} title="Close">
            <MdClose className="text-3xl" />
          </button>
        </div>

        {/* Search and Tabs */}
        <div className="p-4 bg-ancient-bg-medium border-b border-ancient-border-stone flex flex-col gap-3">
          <div className="flex items-center gap-3 bg-ancient-input-bg border border-ancient-input-border rounded-lg px-3 py-2">
            <FaSearch className="text-ancient-icon-inactive text-lg" />
            <input
              type="text"
              placeholder="Search..."
              className="flex-grow bg-transparent outline-none text-ancient-text-light placeholder:text-ancient-text-muted text-base"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button onClick={() => setSearchTerm('')} className="text-ancient-icon-inactive hover:text-red-400">
                <FaTimesCircle className="text-lg" />
              </button>
            )}
          </div>
          <div className="flex justify-around bg-ancient-bg-dark rounded-md p-1 border border-ancient-border-stone">
            {['all', 'images', 'videos', 'audio', 'documents', 'location'].map(tab => ( // Added location
              <button
                key={tab}
                className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${
                  activeTab === tab
                    ? 'bg-ancient-icon-glow text-ancient-bg-dark shadow-md'
                    : 'text-ancient-text-light hover:bg-ancient-bubble-user'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Media Grid */}
        <div className="flex-grow p-4 overflow-y-auto custom-scrollbar">
          {!convoId && (
            <div className="text-ancient-text-muted text-center text-sm p-4">
              No media available for this conversation yet.
            </div>
          )}

          {convoId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(allMediaLoading) && (
                 <div className="col-span-full text-center text-ancient-text-muted p-4">Loading media...</div>
              )}
              {!allMediaLoading && mediaItems.length === 0 && (
                <div className="col-span-full text-center text-ancient-text-muted p-4">No items found in this category.</div>
              )}
              {!allMediaLoading && mediaItems.map((it) => (
                <MediaPreviewGridItem
                  key={it.mediaId}
                  mediaItem={it}
                  onSelect={handleMediaSelect}
                  onDownload={handleDownload}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {showCarousel && (
        <MediaCarouselView
          mediaItems={mediaItems}
          initialIndex={carouselInitialIndex}
          onClose={() => setShowCarousel(false)}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
}