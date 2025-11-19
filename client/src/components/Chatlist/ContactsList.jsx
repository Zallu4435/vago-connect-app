"use client";
import { GET_ALL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import React, { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { BiArrowBack, BiSearchAlt2 } from "react-icons/bi";
import { useStateProvider } from "@/context/StateContext";
import { reducerCases } from "@/context/constants";
import ChatListItem from "./ChatLIstItem";

function ContactsList() {
  const [sections, setSections] = useState({});
  const [search, setSearch] = useState("");
  const [, dispatch] = useStateProvider();

  useEffect(() => {
    const getContacts = async () => {
      try {
        const { data } = await axios.get(GET_ALL_CONTACTS_ROUTE);
        // server returns grouped object: { A: [...], B: [...] }
        if (data?.status && data?.users && typeof data.users === "object") {
          setSections(data.users);
        } else {
          setSections({});
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    getContacts()
  }, []);

  const filteredSections = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return sections;
    const out = {};
    Object.keys(sections || {}).forEach((letter) => {
      const list = sections[letter] || [];
      const filtered = list.filter((u) => {
        const name = String(u?.name || u?.username || "").toLowerCase();
        const about = String(u?.about || "").toLowerCase();
        return name.includes(term) || about.includes(term);
      });
      if (filtered.length) out[letter] = filtered;
    });
    return out;
  }, [sections, search]);

  return (
    <div className="h-full flex flex-col bg-search-input-container-background">
      <div className="h-24 flex items-end px-3 py-4 bg-panel-header-background border-b border-conversation-border">
        <div className="flex items-center gap-12 text-white">
          <BiArrowBack
            className="cursor-pointer text-xl"
            onClick={() =>
              dispatch({ type: reducerCases.SET_ALL_CONTACTS_PAGE, allContactsPage: false })
            }
          />
          <span>New Chat</span>
        </div>
      </div>

      <div className="bg-search-input-container-background flex py-3 pl-5 items-center gap-3 h-14 border-b border-conversation-border">
        <div className="bg-panel-header-background flex items-center gap-5 px-3 py-1 rounded-lg flex-grow">
        <div>
          <BiSearchAlt2 className="text-panel-header-icon cursor-pointer text-lg" />
        </div>
        <div>
          <input
            type="text"
            placeholder="Search or start a new chat"
            className="bg-transparent text-sm focus:outline-none text-white placeholder:text-secondary w-full"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {Object.keys(filteredSections).length === 0 ? (
          <div className="text-secondary text-sm px-4 py-6">No contacts found</div>
        ) : (
          Object.keys(filteredSections).sort().map((letter) => (
            <div key={letter}>
              <div className="px-4 py-2 text-xs text-secondary">{letter}</div>
              <ul>
                {filteredSections[letter].map((u) => (
                  <li key={u.id || u.email} className="border-b border-conversation-border/50">
                    <ChatListItem
                      isContactsPage
                      data={{
                        ...u,
                        profilePicture: u.image || "/default_avatar.png",
                      }}
                    />
                  </li>
                ))}
              </ul>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default ContactsList;
