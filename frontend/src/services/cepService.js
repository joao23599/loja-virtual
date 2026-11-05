// Consulta de CEP no ViaCEP (serviço público e gratuito). A chamada sai do navegador do cliente.
export class CepError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code; // "invalid" | "not_found" | "unavailable"
  }
}

export async function lookupCep(cep, { timeoutMs = 6000 } = {}) {
  const digits = String(cep ?? "").replace(/\D/g, "");
  if (digits.length !== 8) throw new CepError("invalid", "CEP inválido");

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`https://viacep.com.br/ws/${digits}/json/`, { signal: controller.signal });
    if (!response.ok) throw new CepError("unavailable", "Serviço de CEP indisponível");

    const data = await response.json();
    if (data.erro) throw new CepError("not_found", "CEP não encontrado");

    // CEPs "gerais" (de cidade pequena) vêm sem rua e sem bairro
    return {
      street: data.logradouro || "",
      district: data.bairro || "",
      city: data.localidade || "",
      state: data.uf || "",
    };
  } catch (err) {
    if (err instanceof CepError) throw err;
    throw new CepError("unavailable", "Serviço de CEP indisponível"); // rede, timeout ou resposta inválida
  } finally {
    clearTimeout(timer);
  }
}
