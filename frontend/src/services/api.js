// Cliente HTTP mínimo para o back-end (Express, prefixo /v1).
const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000/v1";

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

function buildQuery(params = {}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") query.append(key, value);
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

export async function request(path, { params, headers, body, ...options } = {}) {
  // POST/PUT/DELETE exigem "Authorization: Bearer <jwt>"; GETs são públicos.
  const token = localStorage.getItem("token");

  let response;
  try {
    response = await fetch(`${BASE_URL}${path}${buildQuery(params)}`, {
      ...options,
      body: body === undefined ? undefined : JSON.stringify(body),
      headers: {
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
    });
  } catch {
    throw new ApiError(0, "Não foi possível conectar à API");
  }

  if (!response.ok) {
    const data = await response.json().catch(() => null); // o back-end responde { message }
    throw new ApiError(response.status, data?.message ?? response.statusText);
  }
  if (response.status === 204) return null; // 204 não tem corpo
  return response.json();
}
