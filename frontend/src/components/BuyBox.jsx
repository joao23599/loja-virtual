import StarIcon from "../assets/star-icon.svg";
import { formatPrice } from "../utils/format";
import "./BuyBox.css";

/**
 * Bloco de informações e compra do produto.
 * `children` recebe variações (ex.: <ProductOptions />).
 */
export default function BuyBox({
  name,
  reference,
  stars,
  rating,
  price,
  priceDiscount,
  description,
  children,
  onBuy,
  buyMessage,
}) {
  const hasDiscount = priceDiscount != null;

  return (
    <section className="buy-box">
      <h1 className="buy-box__name">{name}</h1>

      {reference && <p className="buy-box__reference">Ref: {reference}</p>}

      {(stars != null || rating != null) && (
        <div className="buy-box__reviews">
          {stars != null && (
            <span className="buy-box__stars">
              {stars}
              <img src={StarIcon} alt="" width="14" height="14" />
            </span>
          )}
          {rating != null && (
            <span className="buy-box__rating">({rating} avaliações)</span>
          )}
        </div>
      )}

      <div className="buy-box__prices">
        {hasDiscount ? (
          <>
            <span className="buy-box__price buy-box__price--old">{formatPrice(price)}</span>
            <span className="buy-box__price">{formatPrice(priceDiscount)}</span>
          </>
        ) : (
          <span className="buy-box__price">{formatPrice(price)}</span>
        )}
      </div>

      {description && <p className="buy-box__description">{description}</p>}

      {children && <div className="buy-box__extras">{children}</div>}

      {buyMessage && <p className="buy-box__message" role="alert">{buyMessage}</p>}
      <button type="button" className="buy-box__cta" onClick={onBuy}>COMPRAR</button>
    </section>
  );
}
