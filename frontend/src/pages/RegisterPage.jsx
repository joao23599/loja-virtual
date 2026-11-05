import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import Layout from "../components/Layout";
import { registerUser } from "../services/userService";
import "./AuthPage.css";

const EMPTY = { firstname: "", surname: "", email: "", password: "", confirmPassword: "" };

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const onChange = (event) => setForm({ ...form, [event.target.name]: event.target.value });

  async function onSubmit(event) {
    event.preventDefault();
    setError("");

    // validações rápidas antes de chamar a API (o back-end valida de novo)
    if (Object.values(form).some((v) => !v.trim())) return setError("Preencha todos os campos.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return setError("Digite um e-mail válido.");
    if (form.password !== form.confirmPassword) return setError("As senhas não conferem.");

    setSending(true);
    try {
      await registerUser(form);
      navigate("/login", { state: { registered: true, email: form.email, from: location.state?.from } });
    } catch (err) {
      setError(err.message || "Não foi possível criar a conta.");
    } finally {
      setSending(false);
    }
  }

  return (
    <Layout>
      <div className="auth">
        <h1>Criar conta</h1>
        <form className="auth__form" onSubmit={onSubmit} noValidate>
          <label htmlFor="firstname">Nome</label>
          <input id="firstname" name="firstname" autoComplete="given-name" value={form.firstname} onChange={onChange} />

          <label htmlFor="surname">Sobrenome</label>
          <input id="surname" name="surname" autoComplete="family-name" value={form.surname} onChange={onChange} />

          <label htmlFor="email">E-mail</label>
          <input id="email" name="email" type="email" autoComplete="email" value={form.email} onChange={onChange} />

          <label htmlFor="password">Senha</label>
          <input id="password" name="password" type="password" autoComplete="new-password" value={form.password} onChange={onChange} />

          <label htmlFor="confirmPassword">Confirmar senha</label>
          <input id="confirmPassword" name="confirmPassword" type="password" autoComplete="new-password" value={form.confirmPassword} onChange={onChange} />

          {error && <p className="auth__error" role="alert">{error}</p>}

          <button type="submit" disabled={sending}>{sending ? "Criando..." : "Criar conta"}</button>
        </form>
        <p className="auth__alt">Já tem conta? <Link to="/login" state={{ from: location.state?.from }}>Entrar</Link></p>
      </div>
    </Layout>
  );
}
