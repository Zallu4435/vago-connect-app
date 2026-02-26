"use client";
import React, { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContacts } from '@/hooks/contacts/useContacts';
import { useChatMedia } from '@/hooks/chat/useChatMedia';
import { useDownloadMedia } from '@/hooks/messages/useDownloadMedia';
import { MdClose } from "react-icons/md";
import MediaPreviewGridItem from "./MediaPreviewGridItem";
import MediaCarouselView from "./MediaCarouselView";
import LoadingSpinner from "../common/LoadingSpinner";

// MAIN MediaGallery Component
export default function MediaGallery({ open, onClose }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const { data: contacts = [] } = useContacts(userInfo?.id);

  const convoId = useMemo(() => {
    if (currentChatUser?.conversationId) return currentChatUser.conversationId;
    const item = (contacts || []).find((c) => String(c?.id) === String(currentChatUser?.id));
    return item?.conversationId;
  }, [contacts, currentChatUser]);

  const [activeTab, setActiveTab] = useState('all'); // 'all', 'images', 'videos', 'documents', 'links', 'audio', 'location'
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
  const {
    data: allMediaData,
    isLoading: allMediaLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useChatMedia({ chatId: open ? convoId : undefined, type: typeMap[activeTab], limit: 30 });

  const mediaItems = useMemo(() => {
    return allMediaData?.pages?.flatMap(page => page.items) || [];
  }, [allMediaData]);

  const scrollRef = useRef(null);
  const handleScroll = useCallback(() => {
    if (!scrollRef.current || !hasNextPage || isFetchingNextPage) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
    if (scrollHeight - scrollTop <= clientHeight * 1.5) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);


  const { downloadMedia, downloadProgress } = useDownloadMedia();

  const handleDownload = useCallback((mediaId) => {
    // Media previews contain `mediaId` but original items have `id`
    // Find the item to feed to our unified hook
    const found = mediaItems.find(it => it.mediaId === mediaId);
    if (!found) return;

    // We map id properly here to satisfy hook expectations
    downloadMedia({ ...found, id: found.mediaId || found.id });
  }, [mediaItems, downloadMedia]);

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

        {/* Tabs */}
        <div className="p-4 bg-ancient-bg-medium border-b border-ancient-border-stone flex flex-col gap-3">
          <div className="flex justify-around bg-ancient-bg-dark rounded-md p-1 border border-ancient-border-stone overflow-x-auto custom-scrollbar">
            {['all', 'images', 'videos', 'audio', 'documents', 'location'].map(tab => (
              <button
                key={tab}
                className={`flex-1 text-center py-2 text-sm font-semibold rounded-md transition-colors duration-200 ${activeTab === tab
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
        <div
          className="flex-grow p-4 overflow-y-auto custom-scrollbar min-h-[50vh]"
          ref={scrollRef}
          onScroll={handleScroll}
        >
          {!convoId && (
            <div className="text-ancient-text-muted text-center text-sm p-4">
              No media available for this conversation yet.
            </div>
          )}

          {convoId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(allMediaLoading) && (
                <div className="col-span-full flex justify-center items-center min-h-[300px] p-4">
                  <LoadingSpinner size={32} className="text-ancient-icon-glow flex-shrink-0" />
                </div>
              )}
              {!allMediaLoading && mediaItems.length === 0 && (
                <div className="col-span-full flex items-center justify-center min-h-[300px] text-center text-ancient-text-muted p-4">
                  No items found in this category.
                </div>
              )}
              {!allMediaLoading && mediaItems.map((it) => (
                <MediaPreviewGridItem
                  key={it.mediaId}
                  mediaItem={it}
                  onSelect={handleMediaSelect}
                  onDownload={handleDownload}
                  isDownloading={downloadProgress?.id === it.mediaId}
                />
              ))}
              {isFetchingNextPage && (
                <div className="col-span-full flex justify-center p-4">
                  <LoadingSpinner size={24} className="text-ancient-icon-glow" />
                </div>
              )}
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
          isDownloading={downloadProgress?.id === mediaItems[carouselInitialIndex]?.mediaId}
        />
      )}
    </div>
  );
}