// Agrupa as opções de TODOS os produtos pelo título (ex.: "Tamanho") e conta quantos produtos têm cada valor.
function buildOptionFacets(rows) {
  const groups = new Map();

  for (const row of rows) {
    const title = String(row.title).trim();
    const key = title.toLowerCase();
    if (!groups.has(key)) {
      groups.set(key, { title, type: row.type, shape: row.shape, radius: row.radius, values: new Map() });
    }
    const group = groups.get(key);
    const values = String(row.optionValues).split(',').map((v) => v.trim()).filter(Boolean);
    for (const value of values) {
      if (!group.values.has(value)) group.values.set(value, new Set());
      group.values.get(value).add(row.product_id); // Set: cada produto conta uma vez
    }
  }

  return [...groups.values()].map((group) => {
    const values = [...group.values.entries()].map(([value, products]) => ({ value, count: products.size }));
    // 39, 40, 41... em ordem numérica; P, M, G, GG... na ordem em que aparecem
    if (values.every((v) => /^\d+([.,]\d+)?$/.test(v.value))) {
      values.sort((a, b) => parseFloat(a.value.replace(',', '.')) - parseFloat(b.value.replace(',', '.')));
    }
    return { title: group.title, type: group.type, shape: group.shape, radius: group.radius, values };
  });
}

module.exports = { buildOptionFacets };
