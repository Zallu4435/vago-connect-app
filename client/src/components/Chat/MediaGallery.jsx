"use client";
import React, { useMemo, useState } from "react";
import { useAuthStore } from "@/stores/authStore";
import { useChatStore } from "@/stores/chatStore";
import { useContacts } from "@/hooks/queries/useContacts";
import { useChatMedia } from "@/hooks/queries/useChatMedia";
import { useSearchChatMedia } from "@/hooks/queries/useSearchChatMedia";
import { useDownloadMediaUrl } from "@/hooks/queries/useDownloadMediaUrl";

export default function MediaGallery({ open, onClose }) {
  const userInfo = useAuthStore((s) => s.userInfo);
  const currentChatUser = useChatStore((s) => s.currentChatUser);
  const { data: contacts = [] } = useContacts(userInfo?.id);

  const convoId = useMemo(() => {
    const item = (contacts || []).find((c) => String(c?.user?.id) === String(currentChatUser?.id));
    return item?.conversationId;
  }, [contacts, currentChatUser?.id]);

  const [type, setType] = useState(undefined); // 'image' | 'video' | 'audio' | 'document'
  const [searchOpen, setSearchOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);

  const { data: listData, isLoading: listLoading } = useChatMedia({ chatId: convoId, type, limit: 40, offset: 0 });
  const { data: searchData, isLoading: searchLoading } = useSearchChatMedia({ chatId: convoId, type, page, pageSize, ...(searchOpen ? {} : { page: undefined }) });

  const mediaItems = searchOpen ? (searchData?.mediaItems || []) : (listData?.items || []);

  const [downloadId, setDownloadId] = useState(undefined);
  const { data: dl } = useDownloadMediaUrl(downloadId);

  const onDownload = (mediaId) => {
    setDownloadId(mediaId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[#111b21] border border-[#2a3942] rounded-lg w-full max-w-3xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-base">Media</h3>
          <button className="text-bubble-meta hover:underline" onClick={onClose}>Close</button>
        </div>

        {!convoId && (
          <div className="text-bubble-meta text-sm">Conversation not found yet. Open chat and send a message to initialize.</div>
        )}

        {convoId && (
          <>
            <div className="flex items-center gap-2 mb-3">
              <select className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 text-white text-sm" value={type || ""} onChange={(e) => setType(e.target.value || undefined)}>
                <option value="">All</option>
                <option value="image">Images</option>
                <option value="video">Videos</option>
                <option value="audio">Audio</option>
                <option value="document">Documents</option>
              </select>
              <button className="text-bubble-meta hover:underline" onClick={() => setSearchOpen((v) => !v)}>
                {searchOpen ? "Simple view" : "Advanced search"}
              </button>
            </div>

            {searchOpen && (
              <div className="flex items-center gap-2 mb-3 text-sm">
                <label className="text-bubble-meta">Page</label>
                <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 w-16 text-white" type="number" min={1} value={page} onChange={(e) => setPage(Number(e.target.value) || 1)} />
                <label className="text-bubble-meta">Size</label>
                <input className="bg-[#1f2c33] border border-[#2a3942] rounded px-2 py-1 w-16 text-white" type="number" min={1} max={100} value={pageSize} onChange={(e) => setPageSize(Number(e.target.value) || 20)} />
                <span className="text-bubble-meta">Total: {searchData?.totalCount ?? '-'}</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2 max-h-[60vh] overflow-auto custom-scrollbar">
              {(mediaItems || []).map((it) => (
                <div key={it.mediaId} className="group relative border border-[#2a3942] rounded-md overflow-hidden">
                  <div className="aspect-video bg-[#0b141a] flex items-center justify-center">
                    {String(it.type).startsWith("image") ? (
                      <img src={it.url} alt={it.fileName || 'image'} className="object-cover w-full h-full" />
                    ) : (
                      <div className="text-bubble-meta text-xs p-2 break-all">
                        <div className="mb-1">{it.fileName || it.type}</div>
                        <div>{it.mimeType || it.type}</div>
                      </div>
                    )}
                  </div>
                  <div className="absolute bottom-1 left-1 right-1 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <span className="text-[10px] text-bubble-meta px-1 py-[1px] bg-[#1f2c33] rounded">{new Date(it.createdAt).toLocaleString()}</span>
                    <button className="text-xs text-emerald-400 hover:underline px-2 py-[1px] bg-[#1f2c33] rounded" onClick={() => onDownload(it.mediaId)}>Download</button>
                  </div>
                </div>
              ))}
              {!listLoading && mediaItems.length === 0 && (
                <div className="col-span-3 text-bubble-meta text-sm">No media found.</div>
              )}
            </div>

            {dl?.url && typeof window !== 'undefined' && (
              <a href={dl.url} target="_blank" rel="noreferrer" className="hidden" id="_dlink">download</a>
            )}
          </>
        )}
      </div>
    </div>
  );
}
