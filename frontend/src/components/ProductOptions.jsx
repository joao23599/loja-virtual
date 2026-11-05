import { useState } from "react";
import "./ProductOptions.css";

/**
 * Lista variações do produto (tamanhos, cores).
 * @param {string[]} options  ex.: ["39","41"] ou ["#000","#111"]
 * @param {string}   radius   border-radius (só vale quando shape="square")
 * @param {"square"|"circle"} shape
 * @param {"text"|"color"}    type
 */
export default function ProductOptions({
  options = [],
  radius = "0px",
  shape = "square",
  type = "text",
  selected: selectedProp,
  onSelect,
}) {
  const [internal, setInternal] = useState(null);
  const selected = selectedProp !== undefined ? selectedProp : internal;
  const choose = (option) => {
    setInternal(option);
    if (onSelect) onSelect(option);
  };

  return (
    <div className="product-options" role="group">
      {options.map((option) => {
        const isSelected = selected === option;
        const style = {
          ...(shape === "square" ? { borderRadius: radius } : {}),
          ...(type === "color" ? { backgroundColor: option } : {}),
        };

        return (
          <button
            key={option}
            type="button"
            aria-pressed={isSelected}
            aria-label={type === "color" ? `Cor ${option}` : undefined}
            className={[
              "product-option",
              `product-option--${shape}`,
              `product-option--${type}`,
              isSelected ? "is-selected" : "",
            ].join(" ")}
            style={style}
            onClick={() => choose(option)}
          >
            {type === "text" ? option : null}
          </button>
        );
      })}
    </div>
  );
}
