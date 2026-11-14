// Escreve os textos do carrossel com a IA configurada no servidor (Gemini ou OpenAI).
// As chaves ficam só nas variáveis de ambiente da Vercel.
const { codigoOk, dentroDoLimite, responder, provedorIA } = require("./_comum");

async function chamarGemini(pedido) {
  const modelo = encodeURIComponent(process.env.GEMINI_MODEL || "gemini-flash-latest");
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: pedido }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.8 },
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    console.error("Gemini", r.status, d && d.error && d.error.message);
    return { status: r.status === 429 ? 429 : 502, erro: r.status === 429 ? "O limite gratuito do Gemini foi atingido por agora. Tente daqui a pouco." : `A IA respondeu com erro (${r.status}).` };
  }
  const partes = (d.candidates && d.candidates[0] && d.candidates[0].content && d.candidates[0].content.parts) || [];
  return { texto: partes.map((p) => p.text || "").join("") };
}

async function chamarOpenAI(pedido) {
  const r = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL || "gpt-5-mini",
      messages: [{ role: "user", content: pedido }],
      response_format: { type: "json_object" },
    }),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const m = (d && d.error && d.error.message) || "";
    console.error("OpenAI", r.status, m);
    if (r.status === 429 && /quota|billing|credit/i.test(m)) return { status: 503, erro: "A conta da OpenAI do servidor está sem créditos." };
    return { status: r.status === 429 ? 429 : 502, erro: r.status === 429 ? "Limite da OpenAI atingido por agora. Tente daqui a pouco." : `A IA respondeu com erro (${r.status}).` };
  }
  const msg = d.choices && d.choices[0] && d.choices[0].message;
  return { texto: (msg && msg.content) || "" };
}

module.exports = async (req, res) => {
  if (req.method !== "POST") return responder(res, 405, { erro: "Use POST." });
  const provedor = provedorIA();
  if (!provedor) return responder(res, 503, { erro: "O servidor ainda não tem a chave da IA." });
  if (!codigoOk(req)) return responder(res, 401, { erro: "Código de convite inválido." });
  if (!dentroDoLimite(req, "gerar", Number(process.env.LIMITE_DIARIO || 30)))
    return responder(res, 429, { erro: "Você chegou ao limite de carrosséis de hoje. Volte amanhã." });

  let corpo = req.body;
  if (typeof corpo === "string") { try { corpo = JSON.parse(corpo); } catch (e) { corpo = {}; } }
  const pedido = String((corpo && corpo.prompt) || "");
  if (!pedido || pedido.length > 20000) return responder(res, 400, { erro: "Pedido inválido." });

  try {
    const r = provedor === "openai" ? await chamarOpenAI(pedido) : await chamarGemini(pedido);
    if (r.erro) return responder(res, r.status, { erro: r.erro });
    if (!r.texto) return responder(res, 502, { erro: "A IA não devolveu texto. Tente de novo." });
    return responder(res, 200, { text: r.texto });
  } catch (e) {
    console.error(provedor, e);
    return responder(res, 502, { erro: "Não foi possível falar com a IA agora. Tente de novo." });
  }
};
