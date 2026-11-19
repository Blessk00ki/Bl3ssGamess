# BL3SS · versão para GitHub Pages

Versão estática do BL3SS, com os 828 jogos e o BlessSounds. Não precisa de npm, servidor próprio, chave de API, Git LFS ou compilação. O HTML antigo, de arquivo único, é uma versão separada; não é necessário para publicar esta.

## Publicar pelo navegador

1. Extraia `BL3SS-GitHub.zip`. No seu **repositório**, vá a **Add file → Upload files**.
2. Envie o **conteúdo** extraído para a raiz do repositório, mantendo a pasta `assets/`. `index.html`, `style.css`, `app.js`, `catalogo.js` e `assets/` devem ficar no mesmo nível. Se já houver um `index.html` antigo, substitua-o. Não envie só o ZIP nem só o HTML.
3. Faça o commit. Em **Settings → Pages**, escolha **Deploy from a branch → main → /(root)** e salve. Se sua branch tiver outro nome, selecione-a em vez de `main`.
4. Abra o endereço publicado que aparece em **Settings → Pages**. A página do arquivo em `github.com` mostra o código; o endereço do Pages abre o site.

Os caminhos são relativos, então o mesmo pacote funciona em `https://seu-usuario.github.io/nome-do-repo/` ou na raiz de um domínio. Veja as instruções oficiais de [upload](https://docs.github.com/en/repositories/working-with-files/managing-files/adding-a-file-to-a-repository) e [publicação](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site).

## O que editar

| Arquivo | O que contém |
| --- | --- |
| `index.html` | Estrutura, navegação e ícones SVG pequenos. |
| `style.css` | Layout e aparência. |
| `app.js` | Busca, player, cache da sessão e demais interações. |
| `catalogo.js` | Jogos e catálogo do BlessSounds, sem imagens em base64. |
| `assets/` | Capas WebP, fundo, fontes e ícones da aba. |

As capas dos jogos estão agrupadas em lotes de 36 por arquivo WebP, com alguns destaques em arquivos próprios. Isso mantém a quantidade de arquivos abaixo do limite de 100 por envio no navegador. Se for trocar a capa de um jogo, coloque `minha-capa.webp` em `assets/capas/` e mude `cover` nas opções daquele jogo em `catalogo.js` para `"minha-capa"`. Não precisa reempacotar os lotes.

Para testar em uma máquina com Python, execute `python3 -m http.server 8000` dentro da pasta e abra `http://localhost:8000/`. O catálogo de música precisa do site pela web: o Audiomack não permite seu player numa página `file://`. Jogos e músicas continuam dependendo de suas fontes externas. Saves de jogos externos não são apagados pelo BL3SS.

As fontes Inter e Space Grotesk são distribuídas com suas licenças SIL OFL em `assets/fontes/`. Capas, jogos e músicas pertencem aos respectivos autores; confirme as permissões de uso para a sua publicação.
