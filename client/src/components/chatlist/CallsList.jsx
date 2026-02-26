import React from "react";
import { BiArrowBack } from "react-icons/bi";
import {
  MdPhone, MdVideocam,
  MdCallMade, MdCallReceived, MdCallMissed
} from "react-icons/md";
import { useChatStore } from "@/stores/chatStore";
import { useAuthStore } from "@/stores/authStore";
import { useCallStore } from "@/stores/callStore";
import { useCallHistory } from '@/hooks/calls/useCallHistory';
import Avatar from "../common/Avatar";
import { getAbsoluteUrl } from "@/lib/url";
import { BiSearchAlt2 } from "react-icons/bi";
import { BsCalendarDate } from "react-icons/bs";
import LoadingSpinner from "../common/LoadingSpinner";
import EmptyState from "../common/EmptyState";
import { formatTimestamp } from "@/utils/CalculateTime";


export default function CallsList() {
  const setActivePage = useChatStore((s) => s.setActivePage);
  const userInfo = useAuthStore((s) => s.userInfo);
  const { setAudioCall, setVideoCall } = useCallStore();

  const [searchTerm, setSearchTerm] = React.useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = React.useState("");
  const [filterDate, setFilterDate] = React.useState("");

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const { data: calls = [], isLoading } = useCallHistory(debouncedSearchTerm, filterDate);

  const handleStartCall = (contact, type) => {
    setActivePage("default");
    if (type === "video") setVideoCall(contact);
    else setAudioCall(contact);
  };

  return (
    <div className="h-full flex flex-col bg-ancient-bg-dark animate-slide-in">
      {/* 1. Header Row - Matched exactly to ChatListHeader */}
      <div className="
        h-14 sm:h-16 px-4 sm:px-5 py-2 sm:py-3
        flex items-center gap-6
        bg-ancient-bg-medium border-b border-ancient-border-stone shadow-md shrink-0
      ">
        <button
          onClick={() => setActivePage("default")}
          className="text-ancient-icon-inactive hover:text-ancient-icon-glow transition flex items-center"
        >
          <BiArrowBack className="text-xl sm:text-2xl" />
        </button>
        <span className="text-ancient-text-light font-medium text-lg sm:text-xl">Calls</span>
      </div>

      {/* 2. Search & Filter Row */}
      <div className="bg-ancient-bg-medium flex items-center gap-2 h-12 sm:h-14 px-2 sm:px-5 border-b border-ancient-border-stone shadow-md shrink-0">
        <div className="relative flex-grow h-9 sm:h-10 flex items-center bg-ancient-input-bg border border-ancient-input-border rounded-full px-3 sm:px-4 shadow-inner focus-within:border-ancient-icon-glow transition-all duration-300">
          <BiSearchAlt2 className="text-ancient-icon-inactive text-lg sm:text-xl mr-2 sm:mr-3 transition-colors duration-300" />
          <input
            type="text"
            placeholder="Search by name or email..."
            className="bg-transparent flex-1 text-ancient-text-light placeholder:text-ancient-text-muted text-sm sm:text-base focus:outline-none h-full"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-full hover:bg-ancient-input-bg transition-colors duration-300 border border-ancient-input-border shadow overflow-hidden group">
          <BsCalendarDate className="text-ancient-icon-inactive text-lg sm:text-xl group-hover:text-ancient-icon-glow transition-colors duration-300 absolute pointer-events-none" />
          <input
            type="date"
            className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
            title="Filter by date"
          />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-ancient-bg-dark">
        {isLoading ? (
          <div className="flex justify-center mt-10"><LoadingSpinner /></div>
        ) : calls.length === 0 ? (
          <div className="mt-10">
            <EmptyState title="No recent calls" layout="embedded" />
          </div>
        ) : (
          <div className="flex flex-col">
            {calls.map((callMsg) => {
              const isIncoming = callMsg.receiverId === userInfo?.id;
              // Resolve the other participant
              const contact = isIncoming ? callMsg.sender : callMsg.receiver;

              // Parse call data from message content
              let callType = "audio", status = "initiated";
              try {
                const p = JSON.parse(callMsg.content || "{}");
                callType = p.callType ?? "audio";
                status = p.status ?? "initiated";
              } catch { }

              const isVideo = callType === "video";
              const CallIcon = isVideo ? MdVideocam : MdPhone;

              // Derive status visual
              const missed = status === "missed";
              const rejected = status === "rejected";
              const ended = status === "ended";

              let ArrowIcon = isIncoming ? MdCallReceived : MdCallMade;
              if (missed) ArrowIcon = MdCallMissed;

              const isBad = missed || rejected;
              const isGood = ended;

              const arrowColor = isBad ? "text-red-400" : isGood ? "text-ancient-icon-glow" : "text-ancient-text-muted";
              const nameColor = missed ? "text-red-500 font-medium" : "text-ancient-text-light";
              const timeLabel = formatTimestamp(callMsg.createdAt);

              const avatarSrc = getAbsoluteUrl(contact?.profileImage || "");

              return (
                <div
                  key={callMsg.id}
                  className="flex items-center gap-4 px-4 py-3 hover:bg-ancient-input-bg transition cursor-pointer border-b border-ancient-border-stone/20"
                >
                  {/* Avatar */}
                  <Avatar type="md" image={avatarSrc} />

                  {/* Info */}
                  <div className="flex flex-col flex-1 min-w-0 pr-2">
                    <span className={`text-[17px] truncate ${nameColor}`}>
                      {contact?.name || "Unknown"}
                    </span>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <ArrowIcon className={`text-[15px] ${arrowColor}`} />
                      <span className="text-ancient-text-muted text-[13px]">{timeLabel}</span>
                    </div>
                  </div>

                  {/* Actions (Call back) */}
                  <div className="flex gap-4">
                    {/* Voice Call Button */}
                    <button
                      className="text-ancient-icon-inactive hover:text-ancient-icon-glow p-2 rounded-full hover:bg-ancient-bg-medium transition"
                      onClick={(e) => { e.stopPropagation(); handleStartCall(contact, "audio"); }}
                      title="Voice call"
                    >
                      <MdPhone className="text-[20px]" />
                    </button>
                    {/* Video Call Button */}
                    {/* Need to ensure contact obj has necessary fields for WebRTC */}
                    <button
                      className="text-ancient-icon-inactive hover:text-ancient-icon-glow p-2 rounded-full hover:bg-ancient-bg-medium transition"
                      onClick={(e) => { e.stopPropagation(); handleStartCall(contact, "video"); }}
                      title="Video call"
                    >
                      <MdVideocam className="text-[22px]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
