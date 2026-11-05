const strip = (char) => char.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const plain = (text) => [{ text, match: false }];

// Divide o texto em partes para destacar o trecho digitado, ignorando acentos e maiúsculas:
// highlightParts("Tênis Nike", "tenis") -> [{text:"Tênis", match:true}, {text:" Nike", match:false}]
export function highlightParts(text, term) {
  const source = String(text ?? "");
  const query = String(term ?? "").trim();
  if (!query) return plain(source);

  const chars = [...source];
  const normalized = chars.map(strip);
  const needle = [...query].map(strip);
  // se algum caractere muda de tamanho ao normalizar, os índices não batem: não destaca
  if (normalized.some((c) => c.length !== 1) || needle.some((c) => c.length !== 1)) return plain(source);

  const at = normalized.join("").indexOf(needle.join(""));
  if (at < 0) return plain(source);
  const end = at + needle.length;

  return [
    { text: chars.slice(0, at).join(""), match: false },
    { text: chars.slice(at, end).join(""), match: true },
    { text: chars.slice(end).join(""), match: false },
  ].filter((part) => part.text);
}
