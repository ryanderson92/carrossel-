#!/usr/bin/env bash
# Monta o site publicado: versão oficial na raiz e versão de teste em /teste/.
# Uso: montar-site.sh <pasta-oficial> <pasta-teste-ou-vazio> <pasta-saida>
set -euo pipefail
OFICIAL="$1"; TESTE="$2"; SAIDA="$3"
ARQUIVOS=(index.html manifest.json sw.js icons)

rm -rf "$SAIDA"; mkdir -p "$SAIDA"
for f in "${ARQUIVOS[@]}"; do cp -r "$OFICIAL/$f" "$SAIDA/"; done

if [ -z "$TESTE" ] || [ ! -f "$TESTE/index.html" ]; then
  echo "Sem branch 'teste': publicando só a versão oficial."
  exit 0
fi

T="$SAIDA/teste"; mkdir -p "$T"
for f in "${ARQUIVOS[@]}"; do [ -e "$TESTE/$f" ] && cp -r "$TESTE/$f" "$T/"; done

# Identidade da versão de teste: nome, cor e ícone próprios, para instalar as duas no celular.
jq '.name="Gira Teste" | .short_name="Gira Teste" | .theme_color="#F5A524" | .background_color="#F5A524"
    | .icons |= map(.src |= sub("icon-"; "teste-"))' "$TESTE/manifest.json" > "$T/manifest.json"

trocar() { # trocar <arquivo> <texto-antigo> <texto-novo>
  if grep -qF -- "$2" "$1"; then
    python3 -c 'import sys;p,a,b=sys.argv[1:];s=open(p,encoding="utf-8").read();open(p,"w",encoding="utf-8").write(s.replace(a,b,1))' "$1" "$2" "$3"
  else
    echo "::warning::Teste: não encontrei '$2' em $(basename "$1")"
  fi
}
H="$T/index.html"
trocar "$H" '<title>Gira:' '<title>[TESTE] Gira:'
trocar "$H" '<meta name="theme-color" content="#5B3DF5">' '<meta name="theme-color" content="#F5A524">'
trocar "$H" '<meta name="apple-mobile-web-app-title" content="Gira">' '<meta name="apple-mobile-web-app-title" content="Gira Teste">'
trocar "$H" '<link rel="apple-touch-icon" href="icons/icon-192.png">' '<link rel="apple-touch-icon" href="icons/teste-192.png">'
# Configuração (chaves) separada da versão oficial.
trocar "$H" 'const CFG_KEY="gira-config"' 'const CFG_KEY="gira-teste-config"'
trocar "$H" '</body>' '<div aria-hidden="true" style="position:fixed;top:calc(env(safe-area-inset-top,0px) + 6px);right:8px;z-index:9999;background:#F5A524;color:#1A1D24;font:700 11px/1 Figtree,Arial,sans-serif;letter-spacing:.08em;padding:5px 8px;border-radius:999px;pointer-events:none">TESTE</div>
</body>'
echo "Versão de teste montada em /teste/."
