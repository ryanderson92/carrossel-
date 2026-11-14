// Busca fotos no Pexels usando a chave guardada no servidor.
const { codigoOk, dentroDoLimite, responder } = require("./_comum");

module.exports = async (req, res) => {
  const chave = process.env.PEXELS_API_KEY;
  if (!chave) return responder(res, 503, { erro: "O servidor não tem a chave do Pexels." });
  if (!codigoOk(req)) return responder(res, 401, { erro: "Código de convite inválido." });
  if (!dentroDoLimite(req, "fotos", Number(process.env.LIMITE_FOTOS_DIARIO || 300)))
    return responder(res, 429, { erro: "Limite de buscas de fotos de hoje atingido." });

  const url = new URL(req.url, "http://localhost");
  const q = String(url.searchParams.get("q") || "").slice(0, 100).trim();
  const orientacao = ["portrait", "landscape", "square"].includes(url.searchParams.get("orientation")) ? url.searchParams.get("orientation") : "portrait";
  if (!q) return responder(res, 400, { erro: "Busca vazia." });
  try {
    const r = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(q)}&per_page=12&orientation=${orientacao}`, {
      headers: { Authorization: chave },
    });
    if (r.status === 429) return responder(res, 429, { erro: "Limite de buscas do Pexels atingido por agora. Tente mais tarde." });
    if (!r.ok) return responder(res, 502, { erro: `O Pexels respondeu com erro (${r.status}).` });
    const d = await r.json();
    const photos = (d.photos || []).map((p) => ({
      id: p.id, url: p.url, photographer: p.photographer, alt: p.alt,
      src: { tiny: p.src.tiny, large: p.src.large, large2x: p.src.large2x, original: p.src.original },
    }));
    return responder(res, 200, { photos });
  } catch (e) {
    console.error("Pexels", e);
    return responder(res, 502, { erro: "Não foi possível buscar fotos agora." });
  }
};
