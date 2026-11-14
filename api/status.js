// Diz ao app que existe servidor e o que ele oferece. Nunca devolve as chaves.
const { responder, provedorIA } = require("./_comum");

module.exports = (req, res) => {
  responder(res, 200, {
    ok: true,
    ia: Boolean(provedorIA()),
    fotos: Boolean(process.env.PEXELS_API_KEY),
    convite: Boolean(process.env.CODIGO_CONVITE),
  });
};
