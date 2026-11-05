import { formatPrice } from "../utils/format";

/**
 * Resumo do pedido (coluna da direita).
 * method: null/"pix" (mostra total no Pix) | "card" | "boleto"
 */
export default function OrderSummary({ quote, method = null, children, after }) {
  const showPix = method === null || method === "pix";

  return (
    <aside className="summary-col">
      <div className="summary">
        {!quote ? (
          <p className="summary__loading" role="status">Calculando...</p>
        ) : (
          <>
            <dl className="summary__lines">
              <div><dt>Produtos</dt><dd>{formatPrice(quote.subtotal)}</dd></div>
              {quote.product_discount > 0 && (
                <div><dt>Desconto em produtos</dt><dd>-{formatPrice(quote.product_discount)}</dd></div>
              )}
              {quote.coupon && quote.coupon.discount > 0 && (
                <div><dt>Cupom {quote.coupon.code}</dt><dd>-{formatPrice(quote.coupon.discount)}</dd></div>
              )}
              {quote.shipping && (
                <div>
                  <dt>Frete{quote.coupon?.free_shipping ? ` (${quote.coupon.code})` : ""}</dt>
                  <dd>{quote.shipping.price === 0 ? "Grátis" : formatPrice(quote.shipping.price)}</dd>
                </div>
              )}
              {showPix && <div><dt>Desconto no Pix</dt><dd>-{formatPrice(quote.pix_discount)}</dd></div>}
            </dl>

            <div className="summary__total">
              <span className="summary__total-label">Total</span>
              <span className="summary__total-value">
                <strong>{formatPrice(showPix ? quote.total_pix : quote.total)}</strong>
                <small> {showPix ? "no Pix" : method === "card" ? "em 1x sem juros" : "no boleto"}</small>
              </span>
            </div>
            {showPix && (
              <p className="summary__alt">ou em 1x de <b>{formatPrice(quote.total)}</b> sem juros</p>
            )}
          </>
        )}
        {children}
      </div>
      {after}
    </aside>
  );
}
