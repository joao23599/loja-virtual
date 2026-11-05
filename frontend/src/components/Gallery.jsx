import { useState } from "react";
import "./Gallery.css";

/**
 * @param {{src: string}[]} images
 * @param {boolean} showThumbs  exibe miniaturas (basta a prop existir)
 * @param {string} width, height, radius  ex.: "700px", "570px", "4px"
 */
export default function Gallery({ images = [], showThumbs = false, width, height, radius }) {
  const [current, setCurrent] = useState(0);
  const index = Math.min(current, Math.max(images.length - 1, 0));
  const active = images[index];

  return (
    <div className="gallery" style={{ width }}>
      <div className="gallery__stage" style={{ height, borderRadius: radius }}>
        {active ? (
          <img src={active.src} alt={`Imagem ${index + 1} de ${images.length}`} />
        ) : (
          <span className="gallery__empty">Sem imagens</span>
        )}
      </div>

      {showThumbs && images.length > 1 && (
        <ul className="gallery__thumbs">
          {images.map((image, i) => (
            <li key={image.src}>
              <button
                type="button"
                className={i === index ? "is-active" : ""}
                style={{ borderRadius: radius }}
                aria-label={`Ver imagem ${i + 1}`}
                aria-current={i === index}
                onClick={() => setCurrent(i)}
              >
                <img src={image.src} alt="" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
