const KEY = "token";

export const getToken = () => localStorage.getItem(KEY);
export const saveToken = (token) => localStorage.setItem(KEY, token);
export const clearToken = () => localStorage.removeItem(KEY);

// Lê o e-mail dentro do JWT (só para exibir no cabeçalho; quem valida o token é o back-end)
export function getSession() {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      clearToken();
      return null;
    }
    return { email: payload.email };
  } catch {
    clearToken();
    return null;
  }
}
