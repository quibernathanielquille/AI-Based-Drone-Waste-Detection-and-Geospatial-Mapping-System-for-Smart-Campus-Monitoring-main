const TOKEN_KEY = 'scw_admin_token';
const USER_KEY = 'scw_admin_user';
const REMEMBER_KEY = 'scw_admin_remember';

export const getStorage = () => {
  const remember = localStorage.getItem(REMEMBER_KEY) === 'true';
  return remember ? localStorage : sessionStorage;
};

export const getToken = () => getStorage().getItem(TOKEN_KEY);
export const setToken = (token, remember = false) => {
  localStorage.setItem(REMEMBER_KEY, remember ? 'true' : 'false');
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, token);
  if (!remember) localStorage.removeItem(TOKEN_KEY);
  else sessionStorage.removeItem(TOKEN_KEY);
};

export const getUser = () => {
  const data = getStorage().getItem(USER_KEY) || localStorage.getItem(USER_KEY) || sessionStorage.getItem(USER_KEY);
  return data ? JSON.parse(data) : null;
};

export const setUser = (user, remember = false) => {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(REMEMBER_KEY);
  sessionStorage.removeItem(TOKEN_KEY);
  sessionStorage.removeItem(USER_KEY);
};
