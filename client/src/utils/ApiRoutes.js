export const HOST = "http://localhost:3005";

const AUTH_ROUTES = `${HOST}/api/auth`
const MESSAGE_ROUTES = `${HOST}/api/messages`

export const CHECK_USER_ROUTE = `${AUTH_ROUTES}/check-user`
export const ONBOARD_USER_ROUTE = `${AUTH_ROUTES}/onboard-user`
export const GET_ALL_CONTACTS_ROUTE = `${AUTH_ROUTES}/all-users`
export const ADD_MESSAGE_ROUTE = `${MESSAGE_ROUTES}/add-message`
export const ADD_IMAGE_ROUTE = `${MESSAGE_ROUTES}/add-image`
export const ADD_AUDIO_ROUTE = `${MESSAGE_ROUTES}/add-audio`
export const GET_MESSAGES_ROUTE = `${MESSAGE_ROUTES}/get-messages`
export const GET_INITIAL_CONTACTS_ROUTE = `${MESSAGE_ROUTES}/get-initial-contacts`
export const UPDATE_MESSAGE_STATUS_ROUTE = `${MESSAGE_ROUTES}/update-status`