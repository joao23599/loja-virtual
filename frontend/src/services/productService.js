import { request } from "./api";

// "values" chega como array (payload) ou string separada por vírgula (coluna do banco).
// O exemplo do back-end também usa "value" em um dos itens, então aceitamos os dois.
const toValuesArray = (raw) =>
  Array.isArray(raw)
    ? raw
    : String(raw ?? "")
        .split(",")
        .map((v) => v.trim())
        .filter(Boolean);

// API (snake_case, radius inteiro) -> formato esperado pelos componentes
export function toProductView(api) {
  return {
    id: api.id,
    name: api.name,
    description: api.description,
    price: api.price,
    // price_with_discount = 0 significa "sem desconto" (ver exemplo do PUT)
    priceDiscount: api.price_with_discount > 0 ? api.price_with_discount : undefined,
    categoryIds: api.category_ids ?? [],
    images: (api.images ?? []).map((img) => ({ src: img.content })),
    options: (api.options ?? []).map((opt) => ({
      id: opt.id,
      title: opt.title,
      shape: opt.shape ?? "square",
      type: opt.type ?? "text",
      radius: `${parseInt(opt.radius, 10) || 0}px`, // coluna é INTEGER; CSS precisa de unidade
      values: toValuesArray(opt.values ?? opt.value),
    })),
  };
}

// API -> item do <ProductListing />
export function toListingItem(api) {
  return {
    id: api.id,
    name: api.name,
    image: api.images?.[0]?.content,
    price: api.price,
    priceDiscount: api.price_with_discount > 0 ? api.price_with_discount : undefined,
  };
}

// GET /v1/product/:id  (404 vira ApiError com status 404)
export async function getProduct(id) {
  return toProductView(await request(`/product/${id}`));
}

// GET /v1/product/search
export async function getRecommended({ categoryIds = [], excludeId, limit = 4 } = {}) {
  const { data } = await request("/product/search", {
    params: {
      limit: limit + 1, // pega um a mais para poder descartar o produto atual
      fields: "id,name,images,price,price_with_discount",
      category_ids: categoryIds.slice(0, 1).join(","), // 1ª categoria do produto
    },
  });
  return data.filter((p) => p.id !== excludeId).slice(0, limit).map(toListingItem);
}

// GET /v1/product/search com paginação e filtros -> { items, total, limit, page }
export async function searchProducts({
  page = 1,
  limit = 12,
  match,
  categoryIds,
  priceRange,
  optionValues = {}, // { Tamanho: ["39","40"], Cor: ["#000"] }
} = {}) {
  const params = {
    page,
    limit,
    match,
    category_ids: categoryIds,
    "price-range": priceRange,
    fields: "id,name,images,price,price_with_discount",
  };
  Object.entries(optionValues).forEach(([title, values]) => {
    if (values.length) params[`option_values[${title}]`] = values.join(",");
  });

  const res = await request("/product/search", { params });
  return { items: res.data.map(toListingItem), total: res.total, limit: res.limit, page: res.page };
}

// GET /v1/product/filters -> { categories, options, price }
export const getFilters = () => request("/product/filters");
