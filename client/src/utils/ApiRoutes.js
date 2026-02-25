// Relative API prefix so Next.js rewrite proxies to backend in dev
const API_PREFIX = "/api";
// Socket server host (configurable via env, fallback for dev)
export const SOCKET_HOST = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3005";

const AUTH_ROUTES = `${API_PREFIX}/auth`
const MESSAGE_ROUTES = `${API_PREFIX}/messages`

export const CHECK_USER_ROUTE = `${AUTH_ROUTES}/check-user`
export const ONBOARD_USER_ROUTE = `${AUTH_ROUTES}/onboard-user`
export const GET_ALL_CONTACTS_ROUTE = `${AUTH_ROUTES}/all-users`
export const BLOCK_USER_ROUTE = (userId) => `${API_PREFIX}/users/block/${userId}`
export const UNBLOCK_USER_ROUTE = (userId) => `${API_PREFIX}/users/block/${userId}`
export const ADD_MESSAGE_ROUTE = `${MESSAGE_ROUTES}/add-message`
export const ADD_IMAGE_ROUTE = `${MESSAGE_ROUTES}/add-image`
export const ADD_AUDIO_ROUTE = `${MESSAGE_ROUTES}/audio`
export const ADD_VIDEO_ROUTE = `${MESSAGE_ROUTES}/video`
export const ADD_FILE_ROUTE = `${MESSAGE_ROUTES}/add-file`
export const LOCATION_ROUTE = `${MESSAGE_ROUTES}/location`
export const GET_MESSAGES_ROUTE = `${MESSAGE_ROUTES}/get-messages`
export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGE_ROUTES}/get-initial-contacts`
export const UPDATE_MESSAGE_STATUS_ROUTE = `${MESSAGE_ROUTES}/update-status`

// Message actions (id-based)
export const EDIT_MESSAGE_ROUTE = (id) => `${MESSAGE_ROUTES}/${id}/edit`
export const DELETE_MESSAGE_ROUTE = (id) => `${MESSAGE_ROUTES}/${id}`
export const STAR_MESSAGE_ROUTE = (id) => `${MESSAGE_ROUTES}/${id}/star`
export const REACT_MESSAGE_ROUTE = (id) => `${MESSAGE_ROUTES}/${id}/react`
export const FORWARD_MESSAGES_ROUTE = `${MESSAGE_ROUTES}/forward`

// Group routes
export const GROUPS_ROUTE = `${MESSAGE_ROUTES}/groups`
export const CREATE_GROUP_ROUTE = GROUPS_ROUTE
export const ADD_GROUP_MEMBERS_ROUTE = (groupId) => `${GROUPS_ROUTE}/${groupId}/members/add`
export const REMOVE_GROUP_MEMBERS_ROUTE = (groupId) => `${GROUPS_ROUTE}/${groupId}/members/remove`
export const UPDATE_GROUP_ROLE_ROUTE = (groupId) => `${GROUPS_ROUTE}/${groupId}/roles`
export const UPDATE_GROUP_SETTINGS_ROUTE = (groupId) => `${GROUPS_ROUTE}/${groupId}/settings`

// Group actions
export const LEAVE_GROUP_ROUTE = (groupId) => `${GROUPS_ROUTE}/${groupId}/leave`
export const DELETE_GROUP_ROUTE = (groupId) => `${GROUPS_ROUTE}/${groupId}`

// Chat maintenance
export const CLEAR_CHAT_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}/clear`
export const DELETE_CHAT_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}`
export const ARCHIVE_CHAT_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}/archive`
export const PIN_CHAT_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}/pin`
export const MUTE_CHAT_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}/mute`

// Media gallery and download
export const GET_CHAT_MEDIA_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}/media`
export const SEARCH_CHAT_MEDIA_ROUTE = (chatId) => `${MESSAGE_ROUTES}/chats/${chatId}/media/search`
export const DOWNLOAD_MEDIA_ROUTE = (mediaId) => `${MESSAGE_ROUTES}/media/${mediaId}/download`