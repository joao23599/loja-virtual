import { request } from "./api";
import { saveToken } from "../utils/auth";

// POST /v1/user  (público)
export const registerUser = (data) => request("/user", { method: "POST", body: data });

// POST /v1/user/token  -> guarda o JWT no navegador
export async function login({ email, password }) {
  const { token } = await request("/user/token", { method: "POST", body: { email, password } });
  saveToken(token);
}
