import { reducerCases } from "@/context/constants";
import { GET_INITIAL_CONTACTS_ROUTE } from "@/utils/ApiRoutes";
import React, { useEffect } from "react";
import axios from "axios";
import { useStateProvider } from "@/context/StateContext";
import ChatListItem from "./ChatLIstItem";

function List() {

  const [{ userInfo, userContacts, filteredContacts, contactsSearch }, dispatch] = useStateProvider();

  useEffect(() => {
    const getContacts = async () => {
      try {
        const { data: res } = await axios(`${GET_INITIAL_CONTACTS_ROUTE}/${userInfo.id}`);
        const { data: users, onlineUsers } = res || {};
        if (Array.isArray(users)) {
          dispatch({ type: reducerCases.SET_USER_CONTACTS, userContacts: users });
        }
        if (Array.isArray(onlineUsers)) {
          dispatch({ type: reducerCases.SET_ONLINE_USERS, onlineUsers });
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
    if (userInfo?.id) {
      getContacts();
    }
  }, [userInfo?.id, dispatch]);

  // derive filtered contacts from search term
  useEffect(() => {
    const term = (contactsSearch || "").trim().toLowerCase();
    if (!term) {
      dispatch({ type: reducerCases.SET_FILTERED_CONTACTS, filteredContacts: [] });
      return;
    }
    const base = Array.isArray(userContacts) ? userContacts : [];
    const filtered = base.filter((c) => {
      const name = String(c?.name || c?.username || "").toLowerCase();
      const msg = String(c?.message || "").toLowerCase();
      return name.includes(term) || msg.includes(term);
    });
    dispatch({ type: reducerCases.SET_FILTERED_CONTACTS, filteredContacts: filtered });
  }, [contactsSearch, userContacts, dispatch]);

  return (
    <div className="bg-search-input-container-background flex-auto overflow-auto max-h-full custom-scrollbar">
      {contactsSearch && filteredContacts.length === 0 ? (
        <div className="text-secondary text-sm px-4 py-6">No chats found</div>
      ) : (
        (filteredContacts.length > 0 ? filteredContacts : userContacts).map((contact) => (
          <ChatListItem data={contact} key={contact.id} />
        ))
      )}
    </div>
  )
}

export default List; 
