import { reducerCases } from "./constants";

export const initialState = {
    userInfo: undefined,
    newUserInfo: false,
    allContactsPage: false,
    currentChatUser: undefined,
    messages: [],
    socket: undefined,
    messageSearch: false,
    userContacts: [],
    onlineUsers: [],
    contactsSearch: "",
    filteredContacts: [],
    // call state
    audioCall: false,
    videoCall: false,
    call: null,
    calling: false,
    callAccepted: false,
    callRejected: false,
}

const reducer = (state, action) => {
    switch (action.type) {
        case reducerCases.SET_USER_INFO:
            return { ...state, userInfo: action.userInfo }
        case reducerCases.SET_NEW_USER:
            return { ...state, newUserInfo: action.newUser }
        case reducerCases.SET_ALL_CONTACTS_PAGE:
            return { ...state, allContactsPage: action.allContactsPage }
        case reducerCases.SET_CURRENT_CHAT_USER:
            return { ...state, currentChatUser: action.payload }
        case reducerCases.SET_MESSAGES:
            return { ...state, messages: action.messages }
        case reducerCases.SET_SOCKET:
            return { ...state, socket: action.socket }
        case reducerCases.SET_NEW_MESSAGE:
            return { ...state, messages: [...state.messages, action.newMessage] }
        case reducerCases.SET_MESSAGE_SEARCH:
            return { ...state, messageSearch: action.messageSearch }
        case reducerCases.SET_USER_CONTACTS:
            return { ...state, userContacts: action.userContacts }
        case reducerCases.SET_ONLINE_USERS:
            return { ...state, onlineUsers: action.onlineUsers }
        case reducerCases.SET_CONTACTS_SEARCH:
            return { ...state, contactsSearch: action.contactsSearch }
        case reducerCases.SET_FILTERED_CONTACTS:
            return { ...state, filteredContacts: action.filteredContacts }
        // call reducers
        case reducerCases.SET_AUDIO_CALL:
            return { ...state, audioCall: action.audioCall }
        case reducerCases.SET_VIDEO_CALL:
            return { ...state, videoCall: action.videoCall }
        case reducerCases.SET_CALL:
            return { ...state, call: action.call }
        case reducerCases.SET_CALLING:
            return { ...state, calling: action.calling }
        case reducerCases.SET_CALL_ACCEPTED:
            return { ...state, callAccepted: action.callAccepted }
        case reducerCases.SET_CALL_REJECTED:
            return { ...state, callRejected: action.callRejected }
        case reducerCases.SET_CALL_ENDED:
            return { ...state, audioCall: false, videoCall: false, call: null, calling: false, callAccepted: false, callRejected: false }
            
        default:
            return state
    }
}

export default reducer