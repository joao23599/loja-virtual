import { request } from "./api";

// Categorias que devem aparecer no menu (GET /v1/category/search?use_in_menu=true)
export async function getMenuCategories() {
  const { data } = await request("/category/search", {
    params: { use_in_menu: true, limit: -1, fields: "id,name,slug" },
  });
  return data;
}
