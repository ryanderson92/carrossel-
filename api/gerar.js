// Escreve os textos do carrossel com o Gemini, usando a chave guardada no servidor.
const { codigoOk, dentroDoLimite, responder } = require("./_comum");

module.exports = async (req, res) => {
  if (req.method !== "POST") return responder(res, 405, { erro: "Use POST." });
  const chave = process.env.GEMINI_API_KEY;
  if (!chave) return responder(res, 503, { erro: "O servidor ainda não tem a chave do Gemini." });
  if (!codigoOk(req)) return responder(res, 401, { erro: "Código de convite inválido." });
  if (!dentroDoLimite(req, "gerar", Number(process.env.LIMITE_DIARIO || 30)))
    return responder(res, 429, { erro: "Você chegou ao limite de carrosséis de hoje. Volte amanhã." });

  let corpo = req.body;
  if (typeof corpo === "string") { try { corpo = JSON.parse(corpo); } catch (e) { corpo = {}; } }
  const pedido = String((corpo && corpo.prompt) || "");
  if (!pedido || pedido.length > 20000) return responder(res, 400, { erro: "Pedido inválido." });

  const modelo = encodeURIComponent(process.env.GEMINI_MODEL || "gemini-flash-latest");
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": chave },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: pedido }] }],
        generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
      }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) {
      console.error("Gemini", r.status, d && d.error && d.error.message);
      if (r.status === 429) return responder(res, 429, { erro: "O limite gratuito do Gemini foi atingido por agora. Tente daqui a pouco." });
      return responder(res, 502, { erro: `A IA respondeu com erro (${r.status}).` });
    }
    const partes = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
    const texto = partes.map((p) => p.text || "").join("");
    if (!texto) return responder(res, 502, { erro: "A IA não devolveu texto. Tente de novo." });
    return responder(res, 200, { text: texto });
  } catch (e) {
    console.error("Gemini", e);
    return responder(res, 502, { erro: "Não foi possível falar com a IA agora. Tente de novo." });
  }
};
