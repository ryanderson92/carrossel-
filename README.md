# Gira 🎠

**Do tema ao carrossel pronto para postar.**

O Gira é um gerador de carrosséis para Instagram e LinkedIn que roda inteiro no navegador, em um único arquivo HTML. Você escreve o tema (ou cola um texto, artigo ou roteiro), e o app:

- escreve os textos de cada slide com o **Gemini** (grátis) ou o **Claude**;
- busca uma foto para cada slide no **Pexels** (grátis);
- monta os slides em vários estilos (Sólido, Editorial, Noturno, Foto, Foto e texto, Tweet e Tweet escuro) e formatos (4:5, 1:1 e 9:16);
- exporta tudo em PNG (ZIP), PDF para o LinkedIn ou direto para a galeria do celular, junto com a legenda e as hashtags.

Não tem chave nenhuma? Use o modo **Colar roteiro**: o app monta o pedido, você cola em qualquer chat de IA e traz a resposta de volta.

O app também pode ser **instalado no celular** como um aplicativo (PWA): abra o site no navegador e escolha "Adicionar à tela inicial" (Safari no iPhone) ou "Instalar app" (Chrome no Android).

## Suas chaves ficam só no seu aparelho

As chaves de API são digitadas por você na tela **Configuração** e ficam salvas apenas no `localStorage` do seu navegador. Elas **não** ficam no código nem neste repositório, e só são enviadas diretamente para o serviço correspondente (Google, Anthropic ou Pexels).

## Como obter a chave gratuita do Gemini

1. Acesse [aistudio.google.com](https://aistudio.google.com/apikey) e entre com sua conta Google.
2. Clique em **Get API key** e depois em **Create API key**.
3. Copie a chave gerada.
4. No Gira, abra **Configuração**, escolha **Gemini (grátis)** e cole a chave no campo **Chave do Gemini**.

O plano gratuito tem limite de uso. Se aparecer o aviso de limite atingido, espere um pouco e tente de novo.

## Como obter a chave gratuita do Pexels (fotos)

1. Acesse [pexels.com/api](https://www.pexels.com/api/) e crie uma conta gratuita (ou entre na sua).
2. Clique em **Your API Key** (ou "Get Started"), preencha o formulário curto sobre o uso e aceite os termos.
3. Copie a chave exibida.
4. No Gira, abra **Configuração** e cole a chave no campo **Chave do Pexels (fotos)**.

Sem a chave do Pexels, você ainda pode subir fotos da galeria do seu aparelho.

## Claude (opcional, pago)

Se preferir o Claude, crie uma chave no [console da Anthropic](https://console.anthropic.com). O uso é cobrado.

## Publicação

O site é publicado automaticamente no GitHub Pages a cada push na branch `main`, pelo workflow `.github/workflows/pages.yml`.

## Arquivos

- `index.html`: o app completo.
- `manifest.json`, `sw.js` e `icons/`: o que torna o app instalável no celular. O service worker guarda os arquivos do app para abrir mais rápido, mas nunca guarda as chamadas para as APIs de IA e de fotos.
