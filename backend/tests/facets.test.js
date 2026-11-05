const { buildOptionFacets } = require('../src/utils/facets');

const rows = [
  { product_id: 1, title: 'Tamanho', type: 'text', shape: 'square', radius: 4, optionValues: '41,39,40' },
  { product_id: 2, title: 'tamanho', type: 'text', shape: 'square', radius: 4, optionValues: '40,42' },
  { product_id: 3, title: 'Tamanho', type: 'text', shape: 'square', radius: 4, optionValues: 'P,M,G' },
  { product_id: 1, title: 'Cor', type: 'color', shape: 'circle', radius: 0, optionValues: '#000,#fff' },
];

describe('buildOptionFacets', () => {
  const facets = buildOptionFacets(rows);

  test('agrupa por título ignorando maiúsculas', () => {
    expect(facets.map((f) => f.title)).toEqual(['Tamanho', 'Cor']);
  });

  test('conta quantos produtos têm cada valor', () => {
    const tamanho = facets[0].values;
    expect(tamanho.find((v) => v.value === '40').count).toBe(2);
    expect(tamanho.find((v) => v.value === '39').count).toBe(1);
  });

  test('guarda o tipo da opção para o front desenhar caixa ou cor', () => {
    expect(facets[1]).toMatchObject({ type: 'color', shape: 'circle' });
  });

  test('ordena numericamente só quando todos os valores são números', () => {
    const onlyNumbers = buildOptionFacets(rows.slice(0, 2))[0].values.map((v) => v.value);
    expect(onlyNumbers).toEqual(['39', '40', '41', '42']);
    const mixed = facets[0].values.map((v) => v.value);
    expect(mixed).toEqual(['41', '39', '40', '42', 'P', 'M', 'G']);
  });
});
