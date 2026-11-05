import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { login } from "../services/userService";
import "./AuthPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [email, setEmail] = useState(state?.email ?? "");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  async function onSubmit(event) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !password) return setError("Informe e-mail e senha.");

    setSending(true);
    try {
      await login({ email, password });
      navigate(state?.from ?? "/products", { replace: true });
    } catch (err) {
      setError(err.message || "Não foi possível entrar.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout>
      <div className="auth">
        <h1>Entrar</h1>
        {state?.registered && (
          <p className="auth__success" role="status">Conta criada com sucesso! Agora é só entrar.</p>
        )}
        <form className="auth__form" onSubmit={onSubmit} noValidate>
          <label htmlFor="email">E-mail</label>
          <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />

          <label htmlFor="password">Senha</label>
          <input id="password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} />

          {error && <p className="auth__error" role="alert">{error}</p>}

          <button type="submit" disabled={sending}>{sending ? "Entrando..." : "Entrar"}</button>
        </form>
        <p className="auth__alt">Ainda não tem conta? <Link to="/register" state={{ from: state?.from }}>Criar conta</Link></p>
      </div>
    </Layout>
  );
}
