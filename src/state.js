const state = {};

export const getUserState = (userId) => ({ ...state[userId], state: state[userId]?.state || STATE_NOSTATE });
export const setUserState = (userId, newState, data) => state[userId] = { ...state[userId], state: newState, ...(data !== undefined ? { data } : {}) };