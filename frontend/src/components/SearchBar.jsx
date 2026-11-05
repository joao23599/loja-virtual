import { useEffect, useId, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { SearchIcon } from "./icons";
import { searchProducts } from "../services/productService";
import { formatPrice } from "../utils/format";
import { highlightParts } from "../utils/highlight";
import "./SearchBar.css";

const MIN_CHARS = 2;

function Highlighted({ text, term }) {
  return highlightParts(text, term).map((part, i) =>
    part.match ? <mark key={i}>{part.text}</mark> : <span key={i}>{part.text}</span>
  );
}

export default function SearchBar() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [params] = useSearchParams();
  const urlTerm = pathname === "/products" ? params.get("match") || "" : "";

  const [value, setValue] = useState(urlTerm);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [state, setState] = useState({ status: "idle", items: [], total: 0 }); // idle | loading | ready | error
  const inputRef = useRef(null);
  const listId = useId();
  const term = value.trim();

  useEffect(() => setValue(urlTerm), [urlTerm]);

  // Atalho: "/" foca a busca (se a pessoa não estiver digitando em outro campo)
  useEffect(() => {
    const onKey = (event) => {
      if (event.key !== "/" || event.ctrlKey || event.metaKey || event.altKey) return;
      const el = document.activeElement;
      const tag = el?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el?.isContentEditable) return;
      event.preventDefault();
      inputRef.current?.focus();
      inputRef.current?.select();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  // Busca sugestões 250 ms depois da última tecla (só enquanto a pessoa está digitando)
  useEffect(() => {
    if (!open || term.length < MIN_CHARS) {
      setState((prev) => (prev.status === "idle" ? prev : { status: "idle", items: [], total: 0 }));
      return undefined;
    }
    let cancelled = false;
    setState((prev) => ({ ...prev, status: "loading" }));

    const timer = setTimeout(() => {
      searchProducts({ match: term, limit: 5 })
        .then((result) => !cancelled && setState({ status: "ready", items: result.items, total: result.total }))
        .catch(() => !cancelled && setState({ status: "error", items: [], total: 0 })); // sem sugestões, a busca normal continua
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [term, open]);

  // Opções navegáveis pelo teclado: produtos + "ver todos os resultados"
  const options = useMemo(() => {
    const list = state.items.map((item) => ({ type: "product", id: `p-${item.id}`, item }));
    if (state.items.length) list.push({ type: "all", id: "all" });
    return list;
  }, [state.items]);

  const showPanel = open && term.length >= MIN_CHARS && state.status !== "idle" && state.status !== "error";
  const showList = showPanel && options.length > 0;

  function goSearch() {
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    navigate(term ? `/products?match=${encodeURIComponent(term)}` : "/products");
  }

  function choose(option) {
    if (option.type === "all") return goSearch();
    setOpen(false);
    setActive(-1);
    inputRef.current?.blur();
    return navigate(`/product/${option.item.id}`);
  }

  function onSubmit(event) {
    event.preventDefault();
    if (showList && active >= 0) choose(options[active]);
    else goSearch();
  }

  function onKeyDown(event) {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      if (!showList) setOpen(true);
      else setActive((a) => (a + 1) % options.length);
    } else if (event.key === "ArrowUp" && showList) {
      event.preventDefault();
      setActive((a) => (a <= 0 ? options.length - 1 : a - 1));
    } else if (event.key === "Escape" && open) {
      setOpen(false);
      setActive(-1);
    }
  }

  const announcement =
    showPanel && state.status === "ready"
      ? state.items.length
        ? `${state.items.length} sugestão(ões) disponível(is). Use as setas para navegar.`
        : "Nenhuma sugestão encontrada."
      : "";

  return (
    <div
      className="search"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false);
          setActive(-1);
        }
      }}
    >
      <form className="search-bar" role="search" onSubmit={onSubmit}>
        <input
          ref={inputRef}
          type="search"
          role="combobox"
          placeholder="O que você procura?"
          aria-label="Buscar produtos"
          aria-expanded={showList}
          aria-controls={showList ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={showList && active >= 0 ? `${listId}-opt-${active}` : undefined}
          autoComplete="off"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setOpen(true);
            setActive(-1);
          }}
          onFocus={() => term.length >= MIN_CHARS && setOpen(true)}
          onKeyDown={onKeyDown}
        />
        <kbd className="search-bar__kbd" aria-hidden="true">/</kbd>
        <span className="search-bar__divider" aria-hidden="true" />
        <button type="submit" aria-label="Buscar"><SearchIcon /></button>
      </form>

      <p className="sr-only" role="status" aria-live="polite">{announcement}</p>

      {showPanel && (
        // onMouseDown evita que o input perca o foco ao clicar numa sugestão
        <div className="suggest" onMouseDown={(e) => e.preventDefault()}>
          {options.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Sugestões de produtos" className={state.status === "loading" ? "is-stale" : ""}>
              {options.map((option, index) => (
                <li
                  key={option.id}
                  id={`${listId}-opt-${index}`}
                  role="option"
                  aria-selected={index === active}
                  className={`suggest__option${option.type === "all" ? " suggest__option--all" : ""}${index === active ? " is-active" : ""}`}
                  onMouseEnter={() => setActive(index)}
                  onClick={() => choose(option)}
                >
                  {option.type === "product" ? (
                    <>
                      <span className="suggest__thumb">{option.item.image && <img src={option.item.image} alt="" loading="lazy" />}</span>
                      <span className="suggest__name"><Highlighted text={option.item.name} term={term} /></span>
                      <span className="suggest__price">{formatPrice(option.item.priceDiscount ?? option.item.price)}</span>
                    </>
                  ) : (
                    <>
                      <SearchIcon size={16} />
                      <span className="suggest__name">
                        Ver todos os resultados para “{term}”{state.total > state.items.length ? ` (${state.total})` : ""}
                      </span>
                    </>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="suggest__status">
              {state.status === "loading" ? "Buscando..." : `Nenhum produto encontrado para “${term}”.`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
