import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Layout from "../components/Layout";
import FiltersSidebar from "../components/FiltersSidebar";
import ProductListing from "../components/ProductListing";
import { getFilters, searchProducts } from "../services/productService";
import "./ProductsPage.css";

const EMPTY_SELECTION = { categories: [], options: {}, min: "", max: "" };

// URL -> seleção.  Ex.: /products?match=nike&category=1,3&opt.Tamanho=39,40&min=100&max=300
function readSelection(params) {
  const options = {};
  params.forEach((value, key) => {
    if (key.startsWith("opt.")) options[key.slice(4)] = value.split(",").filter(Boolean);
  });
  return {
    categories: (params.get("category") || "").split(",").filter(Boolean),
    options,
    min: params.get("min") || "",
    max: params.get("max") || "",
  };
}

// seleção -> URL (sempre volta para a página 1)
function writeParams(match, selection) {
  const next = new URLSearchParams();
  if (match) next.set("match", match);
  if (selection.categories.length) next.set("category", selection.categories.join(","));
  Object.entries(selection.options).forEach(([title, values]) => {
    if (values.length) next.set(`opt.${title}`, values.join(","));
  });
  if (selection.min) next.set("min", selection.min);
  if (selection.max) next.set("max", selection.max);
  return next;
}

function toPriceRange(min, max) {
  if (!min && !max) return undefined;
  let low = Number(min || 0);
  let high = Number(max || 1e9);
  if (!Number.isFinite(low) || !Number.isFinite(high) || low < 0 || high < 0) return undefined;
  if (low > high) [low, high] = [high, low];
  return `${low}-${high}`;
}

export default function ProductsPage() {
  const [params, setParams] = useSearchParams();
  const urlKey = params.toString();
  const selection = useMemo(() => readSelection(params), [urlKey]); // eslint-disable-line react-hooks/exhaustive-deps
  const match = params.get("match") || "";
  const page = Number(params.get("page") || 1);

  const [facets, setFacets] = useState(null);
  const [result, setResult] = useState({ items: [], total: 0, limit: 12 });
  const [status, setStatus] = useState("loading"); // loading | ready | error

  // filtros disponíveis (uma vez)
  useEffect(() => {
    getFilters().then(setFacets).catch(() => setFacets(null)); // sem filtros a lista continua funcionando
  }, []);

  // produtos (a cada mudança na URL)
  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    searchProducts({
      page,
      match: match || undefined,
      categoryIds: selection.categories.join(",") || undefined,
      priceRange: toPriceRange(selection.min, selection.max),
      optionValues: selection.options,
    })
      .then((data) => {
        if (cancelled) return;
        setResult(data);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));
    return () => {
      cancelled = true;
    };
  }, [urlKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.max(1, Math.ceil(result.total / result.limit));
  const applySelection = (next) => setParams(writeParams(match, next));

  const goTo = (nextPage) => {
    const next = new URLSearchParams(params);
    next.set("page", String(nextPage));
    setParams(next);
    window.scrollTo({ top: 0 });
  };

  return (
    <Layout>
      <div className="products">
        {facets && (
          <FiltersSidebar
            facets={facets}
            selection={selection}
            onChange={applySelection}
            onClear={() => applySelection(EMPTY_SELECTION)}
          />
        )}

        <section className="products__results">
          <h1>{match ? `Resultados para “${match}”` : "Produtos"}</h1>
          {status === "ready" && <p className="products__count">{result.total} produto(s) encontrado(s)</p>}

          {status === "loading" && <p role="status">Carregando produtos...</p>}
          {status === "error" && <p role="alert">Não foi possível carregar os produtos. A API está rodando?</p>}
          {status === "ready" && result.items.length === 0 && <p>Nenhum produto encontrado com esses filtros.</p>}

          {status === "ready" && result.items.length > 0 && (
            <>
              <ProductListing products={result.items} />
              {totalPages > 1 && (
                <nav className="pagination" aria-label="Paginação">
                  <button type="button" disabled={page <= 1} onClick={() => goTo(page - 1)}>Anterior</button>
                  <span>Página {page} de {totalPages}</span>
                  <button type="button" disabled={page >= totalPages} onClick={() => goTo(page + 1)}>Próxima</button>
                </nav>
              )}
            </>
          )}
        </section>
      </div>
    </Layout>
  );
}
