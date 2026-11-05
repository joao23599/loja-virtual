import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import SearchBar from "./SearchBar";
import { getMenuCategories } from "../services/categoryService";
import { CartIcon } from "./icons";
import { useCart } from "../context/CartContext";
import { clearToken, getSession } from "../utils/auth";
import "./Layout.css";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const { count } = useCart();
  const [categories, setCategories] = useState([]);
  const [session, setSession] = useState(getSession);

  useEffect(() => {
    let cancelled = false;
    getMenuCategories()
      .then((data) => !cancelled && setCategories(data))
      .catch(() => {}); // menu é opcional: se a API falhar, a página segue funcionando
    return () => {
      cancelled = true;
    };
  }, []);

  function logout() {
    clearToken();
    setSession(null);
    navigate("/products");
  }

  return (
    <div className="layout">
      <header className="layout__header">
        <div className="container layout__header-inner">
          <Link to="/products" className="layout__logo">Loja</Link>

          <SearchBar />

          <div className="layout__account">
            <Link to="/cart" className="layout__cart" aria-label={`Carrinho, ${count} item(ns)`}>
              <CartIcon />
              {count > 0 && <span>{count}</span>}
            </Link>
            {session ? (
              <>
                <span className="layout__user">{session.email}</span>
                <button type="button" onClick={logout}>Sair</button>
              </>
            ) : (
              <>
                <Link to="/login">Entrar</Link>
                <Link to="/register" className="layout__cta">Criar conta</Link>
              </>
            )}
          </div>
        </div>

        <nav className="container layout__nav" aria-label="Categorias">
          <Link to="/products">Todos</Link>
          {categories.map((c) => (
            <Link key={c.id} to={`/products?category=${c.id}`}>{c.name}</Link>
          ))}
        </nav>
      </header>

      <main className="container layout__main">{children}</main>

      <footer className="layout__footer">
        <div className="container">© {new Date().getFullYear()} Loja — projeto de estudo</div>
      </footer>
    </div>
  );
}
