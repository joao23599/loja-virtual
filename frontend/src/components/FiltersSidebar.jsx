import { useState } from "react";
import { ChevronIcon, SearchIcon } from "./icons";
import "./FiltersSidebar.css";

const toggle = (list, value) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
const normalize = (text) => text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const formatCount = (n) => new Intl.NumberFormat("pt-BR").format(n);

// Bloco recolhível: título + seta
function FilterSection({ title, children }) {
  const [open, setOpen] = useState(true);
  return (
    <section className="filter">
      <button type="button" className="filter__header" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="filter__body">{children}</div>}
    </section>
  );
}

// Campo "Faça sua busca" de dentro de cada filtro
function FilterSearch({ value, onChange }) {
  return (
    <label className="filter__search">
      <input type="search" placeholder="Faça sua busca" aria-label="Buscar neste filtro" value={value} onChange={(e) => onChange(e.target.value)} />
      <SearchIcon size={16} />
    </label>
  );
}

// Lista com caixinhas de seleção e contagem: "Tênis (3)"
function CheckboxFilter({ items, selected, onToggle }) {
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  const matching = items.filter((i) => normalize(i.label).includes(normalize(query)));
  const visible = showAll || query ? matching : matching.slice(0, 6);

  return (
    <>
      {items.length > 5 && <FilterSearch value={query} onChange={setQuery} />}
      <ul className={`filter__list${showAll ? " is-scroll" : ""}`}>
        {visible.map((item) => (
          <li key={item.id}>
            <label>
              <input type="checkbox" checked={selected.includes(item.id)} onChange={() => onToggle(item.id)} />
              <span><strong>{item.label}</strong> ({formatCount(item.count)})</span>
            </label>
          </li>
        ))}
      </ul>
      {matching.length === 0 && <p className="filter__empty">Nada encontrado.</p>}
      {!query && matching.length > 6 && (
        <button type="button" className="filter__more" onClick={() => setShowAll(!showAll)}>
          {showAll ? "Ver menos" : "Ver todos"}
        </button>
      )}
    </>
  );
}

// Grade de caixinhas (tamanhos) ou bolinhas (cores)
function BoxFilter({ values, type, selected, onToggle }) {
  const [query, setQuery] = useState("");
  const visible = values.filter((v) => normalize(v.value).includes(normalize(query)));

  return (
    <>
      {values.length > 8 && <FilterSearch value={query} onChange={setQuery} />}
      <div className={`box-grid${type === "color" ? " box-grid--color" : ""}`}>
        {visible.map(({ value, count }) => {
          const isSelected = selected.includes(value);
          return type === "color" ? (
            <button
              key={value}
              type="button"
              className={`box-grid__swatch${isSelected ? " is-selected" : ""}`}
              style={{ background: value }}
              aria-pressed={isSelected}
              aria-label={`Cor ${value} (${count})`}
              title={`${count} produto(s)`}
              onClick={() => onToggle(value)}
            />
          ) : (
            <button
              key={value}
              type="button"
              className={`box-grid__box${isSelected ? " is-selected" : ""}`}
              aria-pressed={isSelected}
              title={`${count} produto(s)`}
              onClick={() => onToggle(value)}
            >
              {value}
            </button>
          );
        })}
      </div>
      {visible.length === 0 && <p className="filter__empty">Nada encontrado.</p>}
    </>
  );
}

function PriceFilter({ min, max, bounds, onApply }) {
  const [low, setLow] = useState(min);
  const [high, setHigh] = useState(max);

  return (
    <div className="price-filter">
      <div className="price-filter__row">
        <input type="number" min="0" inputMode="decimal" placeholder={`Mín. ${Math.floor(bounds.min)}`} aria-label="Preço mínimo" value={low} onChange={(e) => setLow(e.target.value)} />
        <span aria-hidden="true">—</span>
        <input type="number" min="0" inputMode="decimal" placeholder={`Máx. ${Math.ceil(bounds.max)}`} aria-label="Preço máximo" value={high} onChange={(e) => setHigh(e.target.value)} />
      </div>
      <button type="button" onClick={() => onApply(low, high)}>Aplicar</button>
    </div>
  );
}

/**
 * @param facets     { categories, options, price } vindo de GET /v1/product/filters
 * @param selection  { categories: string[], options: {titulo: string[]}, min: string, max: string }
 */
export default function FiltersSidebar({ facets, selection, onChange, onClear }) {
  const hasFilters =
    selection.categories.length > 0 ||
    Object.values(selection.options).some((v) => v.length > 0) ||
    Boolean(selection.min) ||
    Boolean(selection.max);

  return (
    <aside className="filters" aria-label="Filtros">
      <div className="filters__top">
        <h2>Filtros</h2>
        {hasFilters && <button type="button" onClick={onClear}>Limpar</button>}
      </div>

      {facets.categories.length > 0 && (
        <FilterSection title="Categoria">
          <CheckboxFilter
            items={facets.categories.map((c) => ({ id: String(c.id), label: c.name, count: c.count }))}
            selected={selection.categories}
            onToggle={(id) => onChange({ ...selection, categories: toggle(selection.categories, id) })}
          />
        </FilterSection>
      )}

      {facets.options.map((option) => (
        <FilterSection key={option.title} title={option.title}>
          <BoxFilter
            values={option.values}
            type={option.type}
            selected={selection.options[option.title] || []}
            onToggle={(value) =>
              onChange({
                ...selection,
                options: { ...selection.options, [option.title]: toggle(selection.options[option.title] || [], value) },
              })
            }
          />
        </FilterSection>
      ))}

      <FilterSection title="Preço">
        <PriceFilter
          key={`${selection.min}-${selection.max}`}
          min={selection.min}
          max={selection.max}
          bounds={facets.price}
          onApply={(min, max) => onChange({ ...selection, min, max })}
        />
      </FilterSection>
    </aside>
  );
}
