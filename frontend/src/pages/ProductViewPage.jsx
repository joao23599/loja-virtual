import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import Gallery from "../components/Gallery";
import BuyBox from "../components/BuyBox";
import ProductOptions from "../components/ProductOptions";
import Section from "../components/Section";
import ProductListing from "../components/ProductListing";
import { useCart } from "../context/CartContext";
import { getProduct, getRecommended } from "../services/productService";
import "./ProductViewPage.css";

export default function ProductViewPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addItem } = useCart();

  const [product, setProduct] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ready | notFound | error
  const [selected, setSelected] = useState({}); // { Tamanho: "40", Cor: "#FF6969" }
  const [buyMessage, setBuyMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setStatus("loading");
    setSelected({});
    setBuyMessage("");

    getProduct(id)
      .then(async (data) => {
        if (cancelled) return;
        setProduct(data);
        setStatus("ready");
        try {
          const items = await getRecommended({ categoryIds: data.categoryIds, excludeId: data.id });
          if (!cancelled) setRecommended(items);
        } catch {
          if (!cancelled) setRecommended([]);
        }
      })
      .catch((err) => {
        if (!cancelled) setStatus(err.status === 404 ? "notFound" : "error");
      });

    return () => {
      cancelled = true;
    };
  }, [id]);

  function handleBuy() {
    const missing = product.options.filter((o) => !selected[o.title]).map((o) => o.title);
    if (missing.length) {
      setBuyMessage(`Selecione: ${missing.join(", ")}`);
      return;
    }
    addItem({
      productId: product.id,
      name: product.name,
      image: product.images[0]?.src ?? null,
      options: selected,
      quantity: 1,
    });
    navigate("/cart");
  }

  if (status !== "ready") {
    const messages = {
      loading: "Carregando produto...",
      notFound: "Produto não encontrado.",
      error: "Não foi possível carregar o produto. Tente novamente.",
    };
    return (
      <Layout>
        <p className="product-view__state" role={status === "loading" ? "status" : "alert"}>{messages[status]}</p>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="product-view">
        <Gallery images={product.images} showThumbs width="700px" height="570px" radius="4px" />

        <BuyBox
          name={product.name}
          price={product.price}
          priceDiscount={product.priceDiscount}
          description={product.description}
          onBuy={handleBuy}
          buyMessage={buyMessage}
        >
          {product.options.map((option) => (
            <div key={option.id}>
              <p className="product-view__label">{option.title}</p>
              <ProductOptions
                options={option.values}
                shape={option.shape}
                radius={option.radius}
                type={option.type}
                selected={selected[option.title] ?? null}
                onSelect={(value) => {
                  setSelected((prev) => ({ ...prev, [option.title]: value }));
                  setBuyMessage("");
                }}
              />
            </div>
          ))}
        </BuyBox>
      </div>

      {recommended.length > 0 && (
        <Section title="Produtos recomendados" titleAlign="left" link={{ text: "Ver todos", href: "/products" }}>
          <ProductListing products={recommended} />
        </Section>
      )}
    </Layout>
  );
}
