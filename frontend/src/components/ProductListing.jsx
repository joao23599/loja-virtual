import { Link } from "react-router-dom";
import { formatPrice } from "../utils/format";
import "./ProductListing.css";

function ProductCard({ id, name, image, price, priceDiscount }) {
  const content = (
    <>
      <div className="product-card__image">
        {image ? <img src={image} alt={name} loading="lazy" /> : null}
      </div>
      <h3 className="product-card__name">{name}</h3>
      <p className="product-card__prices">
        {priceDiscount ? (
          <>
            <span className="product-card__price-old">{formatPrice(price)}</span>
            <span className="product-card__price">{formatPrice(priceDiscount)}</span>
          </>
        ) : (
          <span className="product-card__price">{formatPrice(price)}</span>
        )}
      </p>
    </>
  );

  return id ? (
    <Link to={`/product/${id}`} className="product-card">{content}</Link>
  ) : (
    <div className="product-card">{content}</div>
  );
}

/** @param {{id?: number, name: string, image: string, price: number, priceDiscount?: number}[]} products */
export default function ProductListing({ products = [] }) {
  return (
    <div className="product-listing">
      {products.map((p) => (
        <ProductCard key={p.id ?? p.name} {...p} />
      ))}
    </div>
  );
}
