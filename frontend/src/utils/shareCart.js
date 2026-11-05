// Carrinho -> texto curto para a URL (/cart?s=...). Só vai id, quantidade e opções; preços vêm sempre da API.
export function encodeCart(list) {
  const bytes = new TextEncoder().encode(JSON.stringify(list));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeCart(text) {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const list = JSON.parse(new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0))));
  if (!Array.isArray(list) || list.length > 20) throw new Error("carrinho inválido");

  return list.map((entry) => {
    const options = {};
    Object.entries(entry.o || {}).forEach(([k, v]) => {
      if (typeof v === "string") options[k] = v;
    });
    if (!Number.isInteger(entry.id) || !Number.isInteger(entry.q) || entry.q < 1 || entry.q > 99) {
      throw new Error("item inválido");
    }
    return { id: entry.id, q: entry.q, o: options };
  });
}
