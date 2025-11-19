"use client";
import React, { useMemo, useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContacts } from "@/hooks/queries/useContacts";
import { useChatMedia } from "@/hooks/queries/useChatMedia";
import { useSearchChatMedia } from "@/hooks/queries/useSearchChatMedia";
import { useDownloadMediaUrl } from "@/hooks/queries/useDownloadMediaUrl";
import { MdClose, MdImage, MdAudiotrack, MdVideocam, MdInsertDriveFile, MdLocationOn } from "react-icons/md"; // Generic icons
import { FaDownload, FaSearch, FaTimesCircle, FaChevronLeft, FaChevronRight } from "react-icons/fa"; // Added specific icons

// --- SUB-COMPONENTS TO BE CREATED ---
// I'm defining these here as placeholders. You'd create them as separate files.
// For brevity, I won't write out their full code here, but describe their purpose.

// 1. MediaPreviewGridItem.jsx
//    Purpose: Renders a single media item in the grid, handling different types (image, video, document, audio, location).
//    It should also have hover effects and potentially a play button for videos/audio.
//    Props: { mediaItem, onSelect, onDownload }
function MediaPreviewGridItem({ mediaItem, onSelect, onDownload }) {
  const [showOverlay, setShowOverlay] = useState(false);
  const Icon = useMemo(() => {
    switch (mediaItem.type) {
      case 'image': return MdImage;
      case 'video': return MdVideocam;
      case 'audio': return MdAudiotrack;
      case 'location': return MdLocationOn;
      default: return MdInsertDriveFile; // documents
    }
  }, [mediaItem.type]);

  return (
    <div
      className="group relative w-full h-36 bg-ancient-bg-dark rounded-md overflow-hidden cursor-pointer border border-ancient-border-stone hover:border-ancient-icon-glow transition-all duration-200"
      onMouseEnter={() => setShowOverlay(true)}
      onMouseLeave={() => setShowOverlay(false)}
      onClick={() => onSelect(mediaItem)}
    >
      {String(mediaItem.type).startsWith("image") || String(mediaItem.type).startsWith("video") ? (
        <img
          src={mediaItem.thumbnailUrl || mediaItem.url} // Assume thumbnailUrl exists or fallback
          alt={mediaItem.fileName || mediaItem.type}
          className="object-cover w-full h-full"
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-full h-full p-2 text-center text-ancient-text-muted text-sm">
          <Icon className="text-4xl text-ancient-icon-inactive mb-2" />
          <span className="truncate w-full px-1">{mediaItem.fileName || mediaItem.type}</span>
        </div>
      )}

      {(showOverlay || String(mediaItem.type).startsWith("video") || String(mediaItem.type).startsWith("audio")) && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          {String(mediaItem.type).startsWith("video") && (
            <MdVideocam className="text-white text-4xl opacity-70" />
          )}
          {String(mediaItem.type).startsWith("audio") && (
            <MdAudiotrack className="text-white text-4xl opacity-70" />
          )}
          {String(mediaItem.type).startsWith("image") && (
             <MdImage className="text-white text-4xl opacity-70" />
          )}
          {(String(mediaItem.type).startsWith("document") || String(mediaItem.type).startsWith("location")) && (
             <MdInsertDriveFile className="text-white text-4xl opacity-70" />
          )}

          <button
            className="absolute bottom-2 right-2 bg-ancient-bg-dark text-ancient-icon-glow rounded-full p-2 hover:bg-ancient-bubble-user-light shadow-lg"
            onClick={(e) => { e.stopPropagation(); onDownload(mediaItem.mediaId); }}
            title="Download Relic"
          >
            <FaDownload className="text-sm" />
          </button>
        </div>
      )}
    </div>
  );
}

// 2. MediaCarouselView.jsx (This will be the full-screen viewer)
//    Purpose: Displays a selected media item in full screen, allowing navigation between items.
//    Props: { mediaItems, initialIndex, onClose, onDownload }
function MediaCarouselView({ mediaItems, initialIndex, onClose, onDownload }) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const currentMedia = useMemo(() => mediaItems[currentIndex], [mediaItems, currentIndex]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % mediaItems.length);
  }, [mediaItems]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + mediaItems.length) % mediaItems.length);
  }, [mediaItems]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight') goToNext();
      else if (e.key === 'ArrowLeft') goToPrev();
      else if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev, onClose]);


  if (!currentMedia) return null;

  const Icon = useMemo(() => {
    switch (currentMedia.type) {
      case 'audio': return MdAudiotrack;
      case 'location': return MdLocationOn;
      default: return MdInsertDriveFile;
    }
  }, [currentMedia.type]);

  return (
    <div className="fixed inset-0 z-[60] bg-black/90 flex flex-col items-center justify-center animate-fade-in">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between bg-black/50 text-ancient-text-light shadow-lg z-[61]">
        <h3 className="text-lg font-semibold">{currentMedia.fileName || "Ancient Relic"}</h3>
        <button className="text-ancient-icon-glow hover:text-red-400 transition-colors duration-200" onClick={onClose} title="Close">
          <MdClose className="text-3xl" />
        </button>
      </div>

      {/* Media Content */}
      <div className="relative flex items-center justify-center flex-grow w-full h-full">
        {mediaItems.length > 1 && (
          <button
            className="absolute left-4 z-[61] bg-ancient-bg-medium/70 text-ancient-icon-glow p-3 rounded-full hover:bg-ancient-bubble-user-light transition-colors duration-200 shadow-xl"
            onClick={goToPrev}
            title="Previous Relic"
          >
            <FaChevronLeft className="text-2xl" />
          </button>
        )}

        <div className="max-w-[80vw] max-h-[80vh] flex items-center justify-center">
          {String(currentMedia.type).startsWith("image") && (
            <img src={currentMedia.url} alt={currentMedia.fileName} className="object-contain max-w-full max-h-full rounded-lg shadow-2xl border border-ancient-border-stone" />
          )}
          {String(currentMedia.type).startsWith("video") && (
            <video controls src={currentMedia.url} className="object-contain max-w-full max-h-full rounded-lg shadow-2xl border border-ancient-border-stone"></video>
          )}
          {String(currentMedia.type).startsWith("audio") && (
            <div className="bg-ancient-bg-dark p-8 rounded-lg text-ancient-text-light flex flex-col items-center gap-4 border border-ancient-border-stone shadow-2xl">
              <Icon className="text-6xl text-ancient-icon-glow" />
              <p className="text-xl font-semibold">{currentMedia.fileName || "Ancient Chant"}</p>
              <audio controls src={currentMedia.url} className="w-full"></audio>
            </div>
          )}
          {(String(currentMedia.type).startsWith("document") || String(currentMedia.type).startsWith("location")) && (
            <div className="bg-ancient-bg-dark p-8 rounded-lg text-ancient-text-light flex flex-col items-center gap-4 border border-ancient-border-stone shadow-2xl">
              <Icon className="text-6xl text-ancient-icon-glow" />
              <p className="text-xl font-semibold">{currentMedia.fileName || "Ancient Scroll"}</p>
              <a
                href={currentMedia.url}
                target="_blank"
                rel="noreferrer"
                className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-semibold px-6 py-3 rounded-lg shadow-md transition-colors duration-200"
              >
                View Scroll
              </a>
            </div>
          )}
        </div>

        {mediaItems.length > 1 && (
          <button
            className="absolute right-4 z-[61] bg-ancient-bg-medium/70 text-ancient-icon-glow p-3 rounded-full hover:bg-ancient-bubble-user-light transition-colors duration-200 shadow-xl"
            onClick={goToNext}
            title="Next Relic"
          >
            <FaChevronRight className="text-2xl" />
          </button>
        )}
      </div>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex items-center justify-between bg-black/50 text-ancient-text-light shadow-lg z-[61]">
        <div>
          <p className="text-sm text-ancient-text-muted">{new Date(currentMedia.createdAt).toLocaleString()}</p>
          <p className="text-xs text-ancient-text-muted italic">{currentMedia.mimeType || currentMedia.type}</p>
        </div>
        <button
          className="bg-ancient-icon-glow hover:bg-ancient-bubble-user-light text-ancient-bg-dark font-semibold px-4 py-2 rounded-lg shadow-md transition-colors duration-200"
          onClick={() => onDownload(currentMedia.mediaId)}
        >
          <FaDownload className="inline-block mr-2" /> Download Relic
        </button>
      </div>
    </div>
  );
}


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
          <h3 className="text-ancient-text-light text-xl font-bold">Ancient Relics Gallery</h3>
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
              placeholder="Search ancient echoes..."
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
              Ancient scrolls of this conversation have not yet been inscribed. Initiate a whisper.
            </div>
          )}

          {convoId && (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {(allMediaLoading) && (
                 <div className="col-span-full text-center text-ancient-text-muted p-4">Divining ancient relics...</div>
              )}
              {!allMediaLoading && mediaItems.length === 0 && (
                <div className="col-span-full text-center text-ancient-text-muted p-4">No relics found in this category.</div>
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