const V = require('../src/utils/validators');
const { parsePagination, parseFields } = require('../src/utils/pagination');

describe('validators', () => {
  test('parseRadius aceita número, "4" e "4px"', () => {
    expect(V.parseRadius(4)).toBe(4);
    expect(V.parseRadius('4px')).toBe(4);
    expect(V.parseRadius(undefined)).toBe(0);
    expect(V.parseRadius('abc')).toBeNull();
    expect(V.parseRadius(-1)).toBeNull();
  });

  test('parseOptionValues aceita array ou string separada por vírgula', () => {
    expect(V.parseOptionValues(['PP', ' GG '])).toEqual(['PP', 'GG']);
    expect(V.parseOptionValues('39,40')).toEqual(['39', '40']);
    expect(V.parseOptionValues([])).toBeNull();
    expect(V.parseOptionValues(['a,b'])).toBeNull();
    expect(V.parseOptionValues(10)).toBeNull();
  });

  test('parseId', () => {
    expect(V.parseId('12')).toBe(12);
    expect(V.parseId('abc')).toBeNull();
    expect(V.parseId('-1')).toBeNull();
  });
});

describe('paginação', () => {
  test('padrões: limit 12, page 1', () => {
    expect(parsePagination({})).toMatchObject({ limit: 12, page: 1, offset: 0 });
  });

  test('limit -1 busca todos e ignora page', () => {
    expect(parsePagination({ limit: '-1', page: '3' })).toMatchObject({ limit: -1, page: 1, sqlLimit: undefined });
  });

  test('valores inválidos lançam 400', () => {
    expect(() => parsePagination({ limit: 'x' })).toThrow();
    expect(() => parsePagination({ limit: '0' })).toThrow();
    expect(() => parsePagination({ page: '0' })).toThrow();
  });

  test('fields só aceita campos permitidos', () => {
    expect(parseFields('name,slug', ['name', 'slug'])).toEqual(['name', 'slug']);
    expect(() => parseFields('password', ['name'])).toThrow();
  });
});
