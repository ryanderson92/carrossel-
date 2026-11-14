// Funções de apoio do servidor do Gira (arquivos com "_" não viram endereço na Vercel).
const crypto = require("crypto");

// Código de convite: se CODIGO_CONVITE estiver definido, só quem souber o código usa o servidor.
function codigoOk(req) {
  const esperado = process.env.CODIGO_CONVITE || "";
  if (!esperado) return true;
  const a = Buffer.from(String(req.headers["x-gira-codigo"] || "").trim());
  const b = Buffer.from(esperado.trim());
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

// Limite diário simples por pessoa (por IP). Vale por instância do servidor: suficiente para um teste.
const usos = new Map();
function dentroDoLimite(req, tipo, max) {
  const ip = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "?";
  const chave = `${new Date().toISOString().slice(0, 10)}|${tipo}|${ip}`;
  const n = (usos.get(chave) || 0) + 1;
  if (usos.size > 5000) usos.clear();
  usos.set(chave, n);
  return n <= max;
}

function responder(res, status, corpo) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.end(JSON.stringify(corpo));
}

module.exports = { codigoOk, dentroDoLimite, responder };
