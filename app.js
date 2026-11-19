    'use strict';

    const BRAND_NAME = 'BL3SS';

    /* =====================================================================
       DADOS EDITÁVEIS — jogos, apps, catálogo BlessSounds e atalhos iniciais.
       Catálogo de música: id da faixa, capa e reproduções em music-catalog.
       O player local só reproduz arquivos escolhidos no dispositivo, sem upload.
       Catálogo importado: edite o bloco game-catalog. Os endereços aparecem só ao carregar
       um jogo. Como em qualquer HTML, ainda são acessíveis pelas ferramentas do navegador.
       ===================================================================== */
    const gameOrigins = {"s":"https://selenite.cc","y":"https://yandex.com.tr","ys":"https://static.games.yandex.net","q":"https://db.duck.quackprep.com","t":"https://truffled.lol","ml":"https://mathlesson.github.io","ng":"https://www.newgrounds.com","d":"https://dubdoo.com","em":"https://emupedia.net","sp":"https://stickpage.com","ow":"https://owlcraft.raymondjxu.net","ff":"https://fnaffree.io","ea":"https://eaglercrafthub.com","js":"https://cdn.jsdelivr.net","np":"https://picon.ngfiles.com"};
    // Linhas: [id, título, destino https ou chave/caminho, capa, gênero, coleções, opções?].
    // Opções: sourceLabel identifica o player; fallback abre em nova aba.
    // customFrame habilita uma segunda fonte no próprio player, só após o clique.
    // cover aponta para uma imagem ou uma célula dos lotes WebP.
    let gameRows = [];
    // Jogos com bloqueio de iframe ou link indisponível já observado na origem.
    const frameIssues = {"fast-food-manager":"missing","arrow-master":"missing","love-tester":"missing","tetris":"missing","the-impossible-quiz":"missing","the-impossible-quiz-2":"blocked","the-impossible-quiz-book-chapter-1":"blocked","the-impossible-quizmas":"blocked","the-impossible-quiz-book-chapter-2":"blocked","captchaware":"blocked"};
    // Falhas detectadas e alternativas escolhidas nesta sessão da página.
    const frameFallbacks = new Map();
    let games = [];
    const apps = [
      {id:'discord', name:'Discord', icon:'discord', color:'#9ea4ff', url:'https://discord.com/', description:'Converse por voz, texto e vídeo com sua comunidade.'},
      {id:'spotify', name:'Spotify', icon:'spotify', color:'#40e486', url:'https://open.spotify.com/', description:'Suas playlists, álbuns e podcasts.'},
      {id:'youtube', name:'YouTube', icon:'youtube', color:'#ff545f', url:'https://www.youtube.com/', description:'Gameplays, tutoriais e canais favoritos.'},
      {id:'twitch', name:'Twitch', icon:'twitch', color:'#c899ff', url:'https://www.twitch.tv/', description:'Acompanhe transmissões de jogos ao vivo.'},
      {id:'steam', name:'Steam', icon:'steam', color:'#7bcaff', url:'https://store.steampowered.com/', description:'Descubra jogos, ofertas e novidades para PC.'},
      {id:'itch', name:'itch.io', icon:'itch', color:'#ff8795', url:'https://itch.io/games', description:'Explore jogos independentes e criações experimentais.'}
    ];
    const routes = [
      {id:'inicio', label:'Início', icon:'home'},
      {id:'games', label:'Games', icon:'game'},
      {id:'random', label:'Random Games', icon:'dice'},
      {id:'apps', label:'Apps', icon:'grid'},
      {id:'musica', label:'Música', icon:'music'},
      {id:'configuracoes', label:'Configurações', icon:'settings'}
    ];
    const defaultShortcuts = [
      {id:'at-games', type:'page', ref:'games'},
      {id:'at-random', type:'page', ref:'random', label:'Sortear jogo', color:'#b6a1ff'},
      {id:'at-youtube', type:'app', ref:'youtube'},
      {id:'at-discord', type:'app', ref:'discord'},
      {id:'at-spotify', type:'app', ref:'spotify'}
    ];
    const accents = [
      {id:'cyan', label:'Ciano neon', hex:'#57e4ff', rgb:'87, 228, 255'},
      {id:'purple', label:'Violeta', hex:'#baa6ff', rgb:'186, 166, 255'},
      {id:'mint', label:'Menta', hex:'#79f0b9', rgb:'121, 240, 185'},
      {id:'pink', label:'Rosa elétrico', hex:'#ff9bcb', rgb:'255, 155, 203'},
      {id:'amber', label:'Âmbar', hex:'#ffd081', rgb:'255, 208, 129'}
    ];
    const themes = [
      {id:'bl3ss',label:'BL3SS Azul',detail:'Ciano & aço',accent:'cyan',panel:'#0a172d',background:'#071222'},
      {id:'nebulosa',label:'Nebulosa',detail:'Violeta & índigo',accent:'purple',panel:'#21153f',background:'#120e2f'},
      {id:'bosque',label:'Bosque',detail:'Menta & petróleo',accent:'mint',panel:'#142f2c',background:'#061b1b'},
      {id:'brasa',label:'Brasa',detail:'Âmbar & vinho',accent:'amber',panel:'#372124',background:'#211015'}
    ];
    const wallOptions = [
      {id:'cidade',label:'Cidade azul'}, {id:'violeta',label:'Cidade violeta'},
      {id:'escuro',label:'Azul profundo'}, {id:'solido',label:'Cor sólida'},
      {id:'aurora',label:'Aurora fluida',animated:true}, {id:'orbita',label:'Órbita estelar',animated:true},
      {id:'cidade-viva',label:'Cidade viva',animated:true}
    ];
    // O mesmo armazenamento mantém nome, atalhos e aparência das versões anteriores.
    const STORAGE = {prefs:'nexus.preferences.v1', shortcuts:'nexus.shortcuts.v1'};
    const motionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    const defaults = {
      theme:'bl3ss', accent:'cyan', accentCustom:'', surface:'', background:'',
      blur:16, motion:null, wallpaper:'cidade', wallMotion:true, musicCover:true, customImage:'', imageName:'', user:''
    };
    const cleanHex = v => typeof v === 'string' && v.length === 7 && /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : '';

    /* === Utilidades e persistência === */
    const $ = (query, root = document) => root.querySelector(query);
    const $$ = (query, root = document) => Array.from(root.querySelectorAll(query));
    const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[char]));
    const icon = (id, classes = '') => `<svg aria-hidden="true" focusable="false" class="icon ${classes}"><use href="#i-${escapeHTML(id)}"/></svg>`;
    const normalize = value => String(value ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
    const clamp = (value,min,max) => Math.min(max, Math.max(min,value));
    const number = (value, fallback) => typeof value === 'number' && Number.isFinite(value) ? value : fallback;
    const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);
    const data = window.BL3SS_DATA || {};
    const asset = id => id === 'cidade' ? './assets/fundos/cidade.webp' :
      /^music-art-[a-f0-9]+$/.test(id) ? `./assets/musica/${id}.webp` : '';
    const motionAllowed = () => prefs.motion ?? !motionQuery.matches;
    let prefs = {...defaults};
    let shortcuts = defaultShortcuts.slice();
    let currentRoute = '';
    let editingShortcuts = false;
    let toastTimer = 0;
    let modalCleanup = null;
    let returnFocus = null;
    let storageWarned = false;
    let currentGenre = '';
    let lastDraw = null;
    let rolling = false;

    function readLocal(key, fallback) {
      try { const str = localStorage.getItem(key); return str === null ? fallback : JSON.parse(str); }
      catch { return fallback; }
    }
    function writeLocal(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); return true; }
      catch { return false; }
    }
    function persist(key, value, message = '') {
      if (writeLocal(key,value)) { if (message) toast(message); return true; }
      if (!storageWarned || message) toast('A mudança vale nesta sessão, mas o navegador não permitiu salvá-la.', 'image');
      storageWarned = true;
      return false;
    }
    function loadPrefs() {
      const stored = readLocal(STORAGE.prefs, {});
      if (!isRecord(stored)) return {...defaults};
      const upload = typeof stored.customImage === 'string' && stored.customImage.length <= 4200000 && /^data:image\/jpeg;base64,[a-z0-9+/]+={0,2}$/i.test(stored.customImage) ? stored.customImage : '';
      const theme = themes.find(t => t.id === stored.theme) || themes[0];
      const accentCustom = cleanHex(stored.accentCustom);
      return {
        theme: theme.id,
        accent: stored.accent === 'custom' && accentCustom || accents.some(a => a.id === stored.accent) ? stored.accent : theme.accent,
        accentCustom,
        surface: cleanHex(stored.surface),
        background: cleanHex(stored.background),
        wallMotion: typeof stored.wallMotion === 'boolean' ? stored.wallMotion : defaults.wallMotion,
        musicCover: typeof stored.musicCover === 'boolean' ? stored.musicCover : defaults.musicCover,
        blur: clamp(Math.round(number(stored.blur,defaults.blur)),0,30),
        motion: typeof stored.motion === 'boolean' ? stored.motion : null,
        wallpaper: wallOptions.some(w => w.id === stored.wallpaper) || (stored.wallpaper === 'custom' && upload) ? stored.wallpaper : defaults.wallpaper,
        customImage: upload,
        imageName: typeof stored.imageName === 'string' ? stored.imageName.slice(0,120) : '',
        user: typeof stored.user === 'string' ? stored.user.slice(0,26) : ''
      };
    }
    function toast(message, glyph = 'check') {
      const feedback = $('#modal.dialog-studio[open] #studio-feedback');
      if (feedback) { feedback.textContent = message; return; }
      clearTimeout(toastTimer);
      const el = $('#toast');
      el.innerHTML = icon(glyph) + `<span>${escapeHTML(message)}</span>`;
      el.classList.add('is-visible');
      toastTimer = setTimeout(() => { el.classList.remove('is-visible'); el.textContent = ''; }, 3600);
    }
    function resolveURL(text, loose = false) {
      const input = String(text ?? '').trim();
      if (!input || /\s/.test(input)) return null;
      const explicit = /^https?:\/\//i.test(input);
      const domain = /^[\w\u00a0-\uffff-]+(?:\.[\w\u00a0-\uffff-]+)*\.[a-z\u00a0-\uffff]{2,63}(?::\d+)?(?:[/?#][^\s]*)?$/i.test(input);
      if (!explicit && !(loose && domain)) return null;
      try {
        const url = new URL(explicit ? input : `https://${input}`);
        if (!['http:','https:'].includes(url.protocol) || !url.hostname || url.username || url.password) return null;
        return url.href;
      } catch { return null; }
    }
    function webURL(text) { return resolveURL(text,true) || `https://www.google.com/search?q=${encodeURIComponent(text)}`; }
    // A prévia isolada pode bloquear novas abas. O HTML aberto no navegador não tem essa limitação.
    function inIsolatedViewer() { return window.self !== window.top && window.origin === 'null'; }
    function openExternal(href) {
      if (inIsolatedViewer()) { toast('Abra o HTML no navegador para acessar links externos.', 'external'); return; }
      window.open(href,'_blank','noopener,noreferrer');
    }
    function putRange(input, value) {
      input.value = value;
      const pct = 100 * (Number(input.value) - Number(input.min)) / (Number(input.max) - Number(input.min));
      input.style.setProperty('--fill', `${pct}%`);
    }

    /* === SPA com histórico e suporte a links diretos (#games, etc.) === */
    function readRoute() { const hash = location.hash.slice(1); return routes.find(r => r.id === hash)?.id || 'inicio'; }
    function go(route, {focus = false, write = true} = {}) {
      const destination = routes.find(r => r.id === route);
      if (!destination) return;
      const main = $('#conteudo');
      const modal = $('#modal');
      if (modalCleanup || modal?.open) closeDialog();
      if (route !== currentRoute || !main.hasAttribute('data-spa')) {
        currentRoute = route;
        for (const el of $$('.view',main)) {
          const active = el.dataset.page === route;
          el.hidden = !active;
          el.classList.toggle('enter',active && route !== 'inicio');
        }
        main.setAttribute('data-spa','');
        main.dataset.activeView = route;
        for (const link of $$('#primary-nav .nav-link')) {
          if (link.dataset.route === route) link.setAttribute('aria-current','page');
          else link.removeAttribute('aria-current');
        }
        document.title = route === 'inicio' ? `${BRAND_NAME} · Hub de Jogos` : `${route === 'musica' ? 'BlessSounds' : destination.label} · ${BRAND_NAME}`;
        closeSuggestions();
        window.scrollTo(0,0);
        updateLibraryRoute(route);
        if (route === 'musica') queueMicrotask(syncCatalogPlayer);
      }
      // Alguns visualizadores isolam o histórico. Isso não impede trocar de aba.
      if (write && !inIsolatedViewer() && location.hash !== `#${route}`) {
        try { window.history.pushState(null,'',`#${route}`); }
        catch { try { location.hash = route; } catch { /* aba já atualizada */ } }
      }
      if (focus) main.focus({preventScroll:true});
    }
    function updateClock() {
      const date = new Date();
      const h = String(date.getHours()).padStart(2,'0');
      const m = String(date.getMinutes()).padStart(2,'0');
      if ($('#hours').textContent !== h || $('#minutes').textContent !== m || !$('#clock').dateTime) {
        $('#hours').textContent = h;
        $('#minutes').textContent = m;
        $('#clock').dateTime = `${h}:${m}`;
        $('#clock').setAttribute('aria-label', `${h}:${m}`);
        const label = new Intl.DateTimeFormat('pt-BR',{weekday:'long',day:'numeric',month:'long'}).format(date);
        $('#date-label').textContent = label[0].toLocaleUpperCase('pt-BR') + label.slice(1);
        $('#date-label').dateTime = `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
      }
    }
    /* === Busca e atalhos personalizáveis === */
    function shortcutData(raw) {
      if (!isRecord(raw)) return null;
      if (raw.type === 'page') {
        const route = routes.find(r => r.id === raw.ref);
        return route ? {id:raw.id, label:raw.label || route.label, icon:route.icon, href:'#'+route.id, route:route.id, color:raw.color || 'var(--accent)'} : null;
      }
      if (raw.type === 'app') {
        const app = apps.find(a => a.id === raw.ref);
        const href = resolveURL(app?.url);
        return href ? {id:raw.id, label:app.name, icon:app.icon, href, color:app.color} : null;
      }
      const href = raw.type === 'link' && resolveURL(raw.url);
      if (!href || !raw.label) return null;
      return {id:raw.id, label:raw.label, icon:'link', href, color:'var(--accent)'};
    }
    function tone(value) { return /^(#[0-9a-f]{6}|var\(--accent\))$/i.test(value ?? '') ? value : 'var(--accent)'; }
    function renderShortcuts() {
      const list = shortcuts.map(shortcutData).filter(Boolean);
      const out = list.map(item => {
        const label = escapeHTML(item.label);
        const relationship = item.route ? `data-route="${item.route}"` : 'target="_blank" rel="noopener noreferrer"';
        return `<div class="shortcut-wrap"><a class="shortcut glass" style="--tile-tone:${tone(item.color)}" href="${escapeHTML(item.href)}" ${relationship} title="${label}">
          <span class="app-logo" style="--tile-tone:${tone(item.color)}">${icon(item.icon)}</span><span class="shortcut-label">${label}</span>${item.route || editingShortcuts ? '' : `<span class="shortcut-ext">${icon('external')}</span>`}</a>
          ${editingShortcuts ? `<button type="button" class="remove-shortcut" data-remove="${escapeHTML(item.id)}" aria-label="Remover ${label}" title="Remover ${label}">${icon('x')}</button>` : ''}</div>`;
      });
      if (list.length < 11) out.push(`<button type="button" class="shortcut shortcut-add glass" id="add-shortcut"><span class="app-logo">${icon('plus')}</span><span class="shortcut-label">Adicionar</span></button>`);
      $('#quick-grid').innerHTML = out.join('');
      const edit = $('#edit-shortcuts');
      edit.setAttribute('aria-pressed',String(editingShortcuts));
      edit.innerHTML = icon(editingShortcuts ? 'check' : 'edit') + `<span>${editingShortcuts ? 'Concluir edição' : 'Editar atalhos'}</span>`;
    }
    function addShortcut() {
      if (shortcuts.length >= 11) { toast('Remova um atalho para adicionar outro.', 'link'); return; }
      openDialog('Adicionar atalho','ACESSO RÁPIDO',`
        <form class="modal-form" id="shortcut-form">
          <div><label for="shortcut-name">Nome do atalho</label><input class="text-input" id="shortcut-name" required maxlength="32" placeholder="Ex.: Meu site favorito" autocomplete="off"></div>
          <div><label for="shortcut-url">Endereço do site</label><input class="text-input" id="shortcut-url" required type="text" inputmode="url" maxlength="480" placeholder="https://exemplo.com" aria-describedby="shortcut-error" autocomplete="off"></div>
          <p class="error-note" id="shortcut-error" role="status"></p>
          <div class="dialog-actions"><button class="btn btn-secondary" type="button" data-dismiss>Cancelar</button><button class="btn btn-primary" type="submit">${icon('plus')} Adicionar</button></div>
        </form>`, false, root => {
        const name = $('#shortcut-name',root); const urlInput = $('#shortcut-url',root);
        name.focus();
        $('#shortcut-form',root).addEventListener('submit',event => {
          event.preventDefault();
          const label = name.value.trim(); const url = resolveURL(urlInput.value,true);
          if (!label || !url) {
            $('#shortcut-error',root).textContent = !label ? 'Digite um nome para o atalho.' : 'Use um endereço válido, como https://exemplo.com.';
            (!label ? name : urlInput).focus();
            return;
          }
          shortcuts.push({id:`at-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,6)}`, type:'link', label, url});
          closeDialog();
          renderShortcuts();
          if ($('#add-shortcut')) $('#add-shortcut').focus({preventScroll:true});
          persist(STORAGE.shortcuts,shortcuts,'Atalho adicionado.');
        });
      });
    }
    function closeSuggestions() { $('#search-suggestions').hidden = true; }
    function searchEntries() {
      return [
        ...games.map(g => ({kind:'game',id:g.id,label:g.title,extra:`${g.sourceLabel} ${g.fallbackLabel}`,hint:g.yandex ? 'Yandex' : gameOpensInTab(g) ? 'Outra aba' : (g.sourceLabel || g.genre),icon:gameOpensInTab(g) ? 'external' : 'game'})),
        ...apps.map(a => ({kind:'url',href:resolveURL(a.url),label:a.name,hint:'App',icon:a.icon})).filter(a => a.href),
        ...shortcuts.filter(s => s.type === 'link').map(shortcutData).filter(Boolean).map(s => ({kind:'url',href:s.href,label:s.label,hint:'Atalho',icon:'link'})),
        ...routes.filter(r => r.id !== 'inicio').map(r => ({kind:'route',id:r.id,label:r.label,hint:'Página',icon:r.icon})),
        ...music.tracks.concat(music.files).map(t => ({kind:'track',id:t.id,label:t.title,hint:t.artist,extra:t.artist,icon:'music'}))
      ];
    }
    function renderSuggestions() {
      const box = $('#search-suggestions'); const query = $('#search-main').value.trim();
      const key = normalize(query);
      if (!key) { closeSuggestions(); return; }
      const hits = searchEntries().filter(entry => normalize(`${entry.label} ${entry.extra || ''}`).includes(key));
      hits.sort((a,b) => Number(normalize(b.label).startsWith(key)) - Number(normalize(a.label).startsWith(key)));
      const body = hits.slice(0,5).map(entry => {
        const text = `${icon(entry.icon)}<span class="suggestion-text">${escapeHTML(entry.label)}</span><small>${escapeHTML(entry.hint)}</small>`;
        if (entry.kind === 'route') return `<a class="suggestion" href="#${entry.id}" data-route="${entry.id}">${text}</a>`;
        if (entry.kind === 'url') return `<a class="suggestion" href="${escapeHTML(entry.href)}" target="_blank" rel="noopener noreferrer">${text}</a>`;
        return `<button type="button" class="suggestion" data-${entry.kind}="${escapeHTML(entry.id)}">${text}</button>`;
      }).join('');
      const webLabel = resolveURL(query,true) ? 'Abrir endereço' : 'Buscar no Google';
      const localHits = body ? `<p class="suggestion-heading">NO ${escapeHTML(BRAND_NAME)}</p>${body}` : '';
      box.innerHTML = `${localHits}<a class="suggestion ${body ? 'suggestion-web' : ''}" href="${escapeHTML(webURL(query))}" target="_blank" rel="noopener noreferrer">${icon('globe')}<span class="suggestion-text">${webLabel}: ${escapeHTML(query)}</span>${icon('external')}</a>`;
      box.hidden = false;
    }
    function focusSearch() {
      if (currentRoute !== 'inicio') go('inicio');
      $('#search-main').focus();
      $('#search-main').select();
    }
    function setupSearch() {
      const input = $('#search-main'); const wrap = $('.home-search-wrap'); const results = $('#search-suggestions');
      input.addEventListener('input',renderSuggestions);
      input.addEventListener('focus',renderSuggestions);
      wrap.addEventListener('focusout', event => { if (!wrap.contains(event.relatedTarget)) closeSuggestions(); });
      wrap.addEventListener('keydown',event => {
        if (event.key === 'Escape' && !results.hidden) { event.preventDefault(); input.focus(); closeSuggestions(); return; }
        if (results.hidden || event.isComposing) return;
        const items = $$('.suggestion',results);
        if (event.key === 'Enter' && event.target === input) {
          const needle = normalize(input.value);
          const match = items.find(item => normalize($('.suggestion-text',item)?.textContent) === needle);
          if (match) { event.preventDefault(); match.click(); }
        }
        if (!['ArrowDown','ArrowUp'].includes(event.key)) return;
        const at = items.indexOf(document.activeElement);
        event.preventDefault();
        if (event.key === 'ArrowDown') items[(at+1) % items.length]?.focus();
        else if (at <= 0) input.focus();
        else items[at-1].focus();
      });
      $('#key-hint').addEventListener('click',focusSearch);
      const mac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
      $('#key-mod').textContent = mac ? '⌘' : 'Ctrl';
      $('#home-search').addEventListener('submit',event => {
        event.preventDefault();
        const query = input.value.trim();
        if (!query) { input.focus(); return; }
        openExternal(webURL(query));
        closeSuggestions();
      });
      document.addEventListener('keydown',event => {
        if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k' && !$('#modal').open) { event.preventDefault(); focusSearch(); }
      });
    }

    /* === Cards, filtros e ordenação do catálogo === */
    const collectionTitles = {sans:'Sans',pvz:'Plants vs. Zombies',fnaf:'FNAF',fnf:'Friday Night Funkin’',henry:'Henry Stickmin',stickman:'Stickman',work:'Work Games',horror:'Horror / Creepy',yandex:'Yandex'};
    const genreOrder = ['Arcade','Ação','Puzzle','Corrida','Esporte','Plataforma','Terror','Ritmo','Simulação','Estratégia','Outros'];
    const genreTones = {'Arcade':'#62eaff','Ação':'#ff9db0','Puzzle':'#c1aeff','Corrida':'#ff9ce0','Esporte':'#98e8b9','Plataforma':'#a8bfff','Terror':'#ff9caa','Ritmo':'#9cb4ff','Simulação':'#ffcda0','Estratégia':'#afd8a1','Outros':'#9cc5e9'};
    const spotlight = new Set(['geometry-dash','subway-surfers-ny','cut-the-rope']);
    const catalogNumber = new Intl.NumberFormat('pt-BR');

    /* Ordem editorial do catálogo (não é um contador de visitas). As duas primeiras faixas
       têm ordem manual; nas outras, jogos de reconhecimento semelhante ficam em ordem alfabética.
       Jogos sem faixa ficam no fim. Mova os IDs entre as faixas para ajustar a ordem. */
    const fameTiers = [
      // Ícones, grandes sucessos e jogos com reconhecimento fora do navegador.
      `minecraft-eaglercraft super-mario-bros subway-surfers-ny geometry-dash tetris among-us
       angry-birds plants-vs-zombies fnaf-1 flappy-bird sonic-1 pokemon-red pou cut-the-rope
       friday-night-funkin undertale super-mario-64 block-blast fruit-ninja temple-run-2
       dino 2048 crossy-road rocket-league mario-kart-64 talking-tom-cat cookie-clicker
       jetpack-joyride hill-climb-racing bl3-poppy-playtime-chapter-1-original-543853
       pokemon-firered super-mario-world the-sims-3 hollow-knight stardew-valley terraria
       mortal-kombat-3 street-fighter-2 gacha-life super-smash-bros cuphead fnaf-2
       snake solitaire chess wordle minesweeper donkey-kong legend-of-zelda-ocarina-of-time
       kick-the-buddy slope drive-mad fireboy-and-watergirl-1 stickman-hook tomb-of-the-mask
       plague-inc balatro osu portal hollow-knight-silksong deltarune retro-bowl paper-io
       run-3 moto-x3m geometry-dash-lite geometry-meltdown pokemon-emerald pokemon-yellow
       the-sims-2 gacha-club lego-batman hill-climb-racing-2 mario-kart-ds monopoly
       space-invaders super-mario-bros-3 new-super-mario-bros the-legend-of-zelda-a-link-to-the-past`,

      // Grandes favoritos do navegador e títulos conhecidos em seus gêneros.
      `gorilla-tag getting-over-it level-devil escape-road-2 monkey-mart
       papas-freezeria papas-pizzeria papas-burgeria tiny-fishing bloons-tower-defense-5
       bloons-tower-defense-6-scratch super-smash-flash-2 polytrack basketball-stars
       moto-x3m-3 vex-3 vex-7 vex ovo basket-random speed-stars snow-rider-3d drift-boss
       dumb-ways-to-die-1 helix-jump color-switch agario-lite hole-io sudoku pong
       bitlife fallout raft slime-rancher pizza-tower untitled-goose-game celeste
       a-dance-of-fire-and-ice papers-please super-meat-boy fnaf-3 fnaf-4
       fnaf-sister-location fnaf-ultimate-custom-night bad-piggies five-nights-at-freddy-s
       pokemon-platinum pokemon-gold pokemon-silver pokemon-heartgold pokemon-soulsilver
       pokemon-diamond pokemon-crystal pokemon-leafgreen pokemon-ruby pokemon-sapphire
       pokemon-blue the-oregon-trail frogger 3d-space-cadet-pinball bubble-shooter
       legend-of-zelda final-fantasy-vi chrono-trigger simcity animal-crossing-wild-world
       animal-crossing-population-growing sonic-2 sonic-3 super-mario-bros-2
       super-mario-land super-mario-kart mario-party super-mario-rpg mortal-kombat-4
       rimworld banjo-kazooie donkey-kong-country kirby-s-dream-land metroid mega-man-2
       star-fox-64 baldurs-gate-2 crazy-taxi tomodachi-life cooking-mama nintendogs
       advance-wars ace-attorney-pheonix-wright super-metroid
       the-impossible-quiz worlds-hardest-game red-ball-4 bad-ice-cream duck-life-4
       duck-life-1 age-of-war line-rider bloxorz learn-to-fly burrito-bison idle-breakout
       clicker-heroes adventure-capitalist stick-rpg jacksmith fancy-pants-adventures
       riddle-school stickman-climb henry-stickmin-fleeing-the-complex
       henry-stickmin-escaping-the-prison henry-stickmin-stealing-the-diamond
       henry-stickmin-breaking-the-bank henry-stickmin-infiltrating-the-airship
       cut-the-rope-time-travel knife-hit solar-smash bl3-melon-sandbox-260481
       bl3-gamers-mod-448583 schoolboy-runaway stick-with-it territorial-io
       ovo-dimensions tunnel-rush house-of-hazards
       fnaf-pizzeria-simulator bl3-plants-vs-zombies-fusion-original-465975`,

      // Clássicos, sucessos de comunidade e continuações conhecidas.
      `ace-attorney-apollo-justice ace-attorney-investigations ace-attorney-justice-for-all
       ace-attorney-trials-and-tribulations advance-wars-2 advance-wars-days-of-ruin
       a-dark-room age-of-war-2 anton-blast aquapark-slides bad-ice-cream-2 bad-ice-cream-3
       bad-time-simulator ballistic-chickens banjo-tooie basket-bros basketball-frvr
       battleships battletoads bee-swarm-simulator bloons-tower-defense
       bloons-tower-defense-2 bloons-tower-defense-3 bloons-tower-defense-4 bob-the-robber-2
       bomberman boxing-random bouncy-motors breaking-the-bank cactus-mccoy cactus-mccoy-2
       cars-2 castlevania castlevania-aria-of-sorrow castlevania-dawn-of-sorrow
       castlevania-iii castlevania-order-of-ecclesia cat-goes-fishing cave-story
       champion-island chessformer class-of-09 cluster-rush connect-four
       conway-s-game-of-life cooking-mama-2 crazy-cattle-3d crush-the-castle
       cubefield cut-the-rope-experiments cut-the-rope-holiday dadish daggerfall
       diddy-kong-racing doodle-jump donkey-kong-64 donkey-kong-country-2 donkey-kong-country-3
       donkey-kong-land doge-miner doge-miner-2 dr-mario dragon-ball-z-supersonic-warriors
       drift-hunters duck-life-2 duck-life-3 duck-life-5 duck-life-6 duck-life-7 duck-life-8
       dumb-ways-to-die-2 dumb-ways-to-die-3 ducktales earthbound ecco-the-dolphin
       electric-man-2 epic-battle-fantasy epic-battle-fantasy-2 epic-battle-fantasy-3
       escape-road escape-road-city-2 excitebike-64 factory-balls fancy-pants-adventures-2
       fancy-pants-adventures-3 fire-emblem fireboy-and-watergirl-2 fireboy-and-watergirl-3
       fireboy-and-watergirl-4 first-kiss-at-a-spooky-soiree flying-gorilla fnaf-world
       fort-dmin f-zero f-zero-x gachaverse gladihoppers golden-axe golden-sun goober-dash
       guilty-gear halloween-2016 harvest-moon harvest-moon-64 hatsune-miku-project-diva
       helltaker hero-3-flying-robot hexgl hobo-1 hobo-2 ice-climber
       in-stars-and-time interactive-buddy jelly-drift justfall-lol
       kid-icarus kindergarten kindergarten-2 kindergarten-3 kirby-64
       kirby-and-the-amazing-mirror kirby-mass-attack kirby-power-paintbrush kirby-s-dream-land-2
       learn-to-fly-2 learn-to-fly-3 learn-to-fly-idle links-awakening-dx little-alchemy
       madalin-cars majora-s-mask mario-and-luigi-bowser-s-inside-story mario-and-luigi-partners-in-time
       mario-and-luigi-superstar-saga mario-combat mario-golf mario-kart-super-circuit mario-paint
       mario-party-2 mario-party-3 mario-party-ds mario-tennis mega-man mega-man-3 mega-man-x
       mega-man-zero metroid-fusion metroid-zero-mission milkman-karlson mindustry
       monster-tracks mother-3 moto-x3m-2 moto-x3m-pool-party moto-x3m-spooky moto-x3m-winter
       needy-streamer-overload neon-rider n-gon ninja-gaiden ngu-idle oneshot osu-mania
       pacman-world pandemic-2 papa-louie papa-louie-2 papa-louie-3 paper-mario
       papas-bakeria papas-cheeseria papas-donuteria papas-pancakeria papas-pastaria
       papas-scooperia papas-sushiria papas-tacomia papas-wingeria papa-s-cupcakeria
       papa-s-hotdoggeria parappa-the-rapper peggle phantasy-star-iv picross-ds plague-inc-evolved
       plants-vs-zombies-2-gardenless pokemon-mystery-dungeon pokemon-snap pokemon-stadium
       pokemon-unbound portal-flash professor-layton-and-the-curious-village punch-out
       pyongyang-racer raft-wars rayman-3 red-ball-1 red-ball-2 red-ball-3 retro-bowl-college
       rhythm-heaven run run-2 sandboxels scribblenauts shapez shrek-2
       simcity-2000 simon slowroads soccer-random sonic-advance sonic-advance-2 sonic-advance-3
       sonic-and-knuckles sonic-rush sonic-spinball sort-the-court stack stack-bounce
       state-io stickman-boost stickman-golf stick-war-2 streets-of-rage streets-of-rage-2
       super-auto-pets super-bomberman super-liquid-soccer super-mario-64-ds super-mario-63
       super-mario-flash super-mario-flash-2 super-mario-land-2 super-smash-flash
       swords-and-sandals swords-and-sandals-2 tap-road the-final-earth-2 the-impossible-game
       the-impossible-quiz-2 the-legend-of-zelda-spirit-tracks the-simpsons-road-rage
       the-sims-busting-out there-is-no-game this-is-the-only-level thirty-dollar-website
       theme-hotel thumb-fighter townscaper traffic-jam-3d tron ultimate-flash-sonic unfair-mario
       universal-paperclips vex-2 vex-4 vex-5 vex-6 vex-8 vex-x3m vex-x3m-2 volley-random
       warioware warioware-diy warioware-touched watermelon-game wave-race-64
       we-become-what-we-behold webfishing webretro wheely-1 wheely-2 wheely-3 wheely-4
       windows-98 wipeout worlds-hardest-game-2 worms-world-party yoshi-s-island yoshi-s-story
       your-only-move-is-hustle undertale-yellow`,

      // Mods, releituras e séries menores reconhecíveis por nicho.
      `60s-burger-run achievement-unlocked achievement-unlocked-2 achievement-unlocked-3
       achilles adventure-time-hey-ice-king altered-beast amorphous antimatter-dimensions
       apes-vs-helium arrow-master avalanche bacon-may-die badtime-simulator banjo-pilot
       bart-bash bl3-bad-apple-undertale-fight-506938 bl3-great-time-villains-522665
       bl3-jotaro-sans-fight-502624 bl3-motorcycle-racer-road-mayhem-234483
       bl3-plants-vs-zombie-hybrid-story-mod-388246 bl3-plants-vs-zombies-fusion-edition-462089
       bl3-plants-vs-zombies-fusion-era-475730 bl3-plants-vs-zombies-limited-edition-474134
       bl3-plants-vs-zombies-new-version-396398 bl3-plants-vs-zombies-unlocked-all-plants-474738
       bl3-pvz-fusion-hybrid-cheats-mod-479270 bl3-sans-fight-sans-simulator-380740
       bl3-undertale-last-breath-phase-1-531837 bl3-undertale-stronger-monster-515599
       bl3-undertale-stronger-than-you-507751 bloons-player-pack-1 bloons-player-pack-2
       bloons-player-pack-3 bloons-player-pack-4 bloons-player-pack-5 boxing-physics-2
       bus-and-subway-runner captchaware cave-chaos celeste-pico-8 chibi-knight circloo
       class-of-09-the-flip-side class-of-09-the-re-up cold-front comix-zone corporation-inc
       copter american-racing american-racing-2 bfb-5b football-bros
       surf-go the-enchanted-cave-2 mario-party-advance draw-climber cell-machine
       ovo-2 the-heist drill-dozer peaks-of-yore crush-the-castle-2 csgo-case-clicker dadish-2 dadish-3 death-run-3d deepest-sword
       deltarune-truffled deltatraveler drift-king electric-box extreme-run-3d factory-balls-2
       factory-balls-3 factory-balls-4 factory-balls-forever famidash-geometry-dash
       famidash-b-sides-geometry-dash famidash-c-sides-geometry-dash famidash-d-sides-geometry-dash
       fast-food-manager final-ninja five-nights-at-freddy-s-2 five-nights-at-freddy-s-3
       five-nights-at-freddy-s-4 flappy-2048 fnaf-4-halloween-edition fnaf-sister-location-2
       fnf-b-side fnf-hex fnf-miku fnf-neo fnf-sarvente-s fnf-sky fnf-tricky fnf-whitty
       frostpunk-pico funny-mad-racing game-maker-doodle geometry-dash-remastered
       geometry-dash-scratch geometry-dash-sky geometry-jump geometry-rash gex-64
       gold-digger-frvr hardware-tycoon hextris hobo-3 hobo-4 hobo-5 hobo-6 hobo-7
       i-wanna-be-thy-copy icebreaker idle-dice idle-research illusion-of-gaia jellytruck
       lo-fi-room love-tester mario mario-pinball-land mega-man-4 mega-man-5 mega-man-6
       metroid-ii mine-blocks minesweeper-plus mystical-ninja-starring-goemon
       osu-mania-scratch osu-scratch pandemic penrose pickcrafter pizza-tower-scoutdingo
       pokemon-emerald-crest pokemon-scarlet-and-violet-gba portal-2-flash portal-2d
       rabbit-samurai raft-wars-2 re-run red-ball-4-vol-2 red-ball-4-vol-3 riddle-school-2
       riddle-school-3 riddle-school-4 riddle-school-5 riddle-transfer riddle-transfer-2
       ristar rocket-soccer rogue run-3-editor sandtrix shining-force
       shinobi-iii-return-of-the-ninja-master shop-empire shop-empire-fable shift shift-2
       shift-3 shift-4 six-cats-under skibidi-1-v-100 skibidi-toilet-attack skywire
       skywire-2 skywire-vip-extended slope-2 slope-3 slope-ball slope-city snowball-io
       spacebar-clicker sprinter steak-and-jake super-mario-construct
       super-monkey-ball-jr super-princess-peach super-tennis tanuki-sunset
       the-impossible-quiz-book-chapter-1 the-impossible-quiz-book-chapter-2
       the-impossible-quizmas this-is-the-only-level-2 tube-jumpers twin-shot
       twin-shot-2 vectorman vectorman-2 vex-challenges wario-land-4 wario-land-ii
       wario-s-woods weave-silk webgl-fluid-sim wordle-bot yohoho-io 2d-rocket-league among-us-better`,
    ];
    const fameIndex = new Map(fameTiers.flatMap((group,tier) => group.trim().split(/\s+/).map((id,position) => [id,[tier,tier < 2 ? position : 0]])));
    const titleOrder = new Intl.Collator('pt-BR',{numeric:true,sensitivity:'base'});
    function gamesByFame(entries) {
      const unranked = [fameTiers.length,0];
      return [...entries].sort((a,b) => {
        const [aTier,aPosition] = fameIndex.get(a.id) || unranked;
        const [bTier,bPosition] = fameIndex.get(b.id) || unranked;
        return aTier-bTier || aPosition-bPosition || titleOrder.compare(a.title,b.title) || titleOrder.compare(a.id,b.id);
      });
    }

    function catalogURL(ref) {
      if (!ref || typeof ref !== 'string') return '';
      const slash = ref.indexOf('/');
      const key = slash > 0 ? ref.slice(0,slash) : '';
      const full = Object.prototype.hasOwnProperty.call(gameOrigins,key) ? gameOrigins[key] + ref.slice(slash) : ref;
      const url = resolveURL(full);
      return url?.startsWith('https://') ? url : '';
    }
    function isYandexGame(url) {
      if (!url) return false;
      return /(?:^|\.)yandex\.(?:com(?:\.tr)?|ru|net|by|kz|uz|games)$/i.test(new URL(url).hostname);
    }
    function gameOpensInTab(game) {
      return !game.customFrame && (gameUsesOriginalTab(game) || frameFallbacks.has(game.id));
    }
    function loadCatalog() {
      return gameRows.map(([id,title,destination,thumb,genre,collections,{sourceLabel = '',fallback = '',fallbackLabel = '',customFrame = '',cover} = {}]) => ({
        id,title,destination,thumb,genre,collections,sourceLabel,fallback,fallbackLabel,customFrame,cover,
        yandex:isYandexGame(catalogURL(destination)),
        issue:frameIssues[id] || '',
        tone:genreTones[genre] || 'var(--accent)',
        search:normalize(`${title} ${sourceLabel} ${fallbackLabel} ${genre} ${collections.map(c => collectionTitles[c] || c).join(' ')}`)
      }));
    }
    function packedGameCover(cover) {
      if (!Number.isSafeInteger(cover) || cover < 0) return '';
      const sheet = String(Math.floor(cover/36)+1).padStart(2,'0');
      const tile = cover%36;
      const x = tile%6*244, y = Math.floor(tile/6)*116;
      return `<svg class="game-cover-sheet" viewBox="${x} ${y} 244 116" preserveAspectRatio="xMidYMid slice" aria-hidden="true" focusable="false"><image href="./assets/capas/lote-${sheet}.webp" width="1464" height="696"/></svg>`;
    }
    function gameCard(g, {shuffling = false, result = false, eager = false, ordinal = -1} = {}) {
      const tag = shuffling ? 'article' : 'button';
      const name = escapeHTML(g.title);
      const label = gameOpensInTab(g) ? `${name} (abre em outra aba)` : name;
      const order = ordinal < 0 ? '' : ` data-catalog-index="${ordinal}"`;
      const attributes = shuffling ? 'aria-hidden="true"' : `type="button" data-game="${escapeHTML(g.id)}" aria-label="${label}" title="${name}"${order}`;
      const sheet = packedGameCover(g.cover);
      const file = typeof g.cover === 'string' && /^[a-z0-9-]+$/.test(g.cover) ? `./assets/capas/${g.cover}.webp` : '';
      const art = file || (!sheet && !shuffling && catalogURL(g.thumb)) || '';
      const photo = art ? `<img data-catalog-cover src="${escapeHTML(art)}" alt="" decoding="async" draggable="false" referrerpolicy="no-referrer"${eager ? '' : ' loading="lazy"'}>` : '';
      const placeholder = `<span class="catalog-fallback" aria-hidden="true"${art ? ' hidden' : ''}>${icon('game')}</span>`;
      return `<${tag} class="game-card${shuffling ? ' static' : ''}${result ? ' random-pick' : ''}" ${attributes} style="--card-tone:${tone(g.tone)}">
        <span class="card-cover">${photo}${placeholder}${sheet}</span>
        <span class="game-name">${name}</span></${tag}>`;
    }
    function renderGenreFilters() {
      const available = new Set(games.map(g => g.genre));
      const categories = genreOrder.filter(genre => available.has(genre));
      $('#genre-filters').innerHTML = ['',...categories].map(genre => `<button type="button" class="chip" data-genre="${escapeHTML(genre)}" aria-pressed="${String(currentGenre === genre)}">${escapeHTML(genre || 'Todos')}</button>`).join('');
      const present = new Set(games.flatMap(g => g.collections));
      $('#game-collection').innerHTML = '<option value="">Todas as coleções</option>' + Object.entries(collectionTitles).filter(([id]) => present.has(id)).map(([id,title]) => `<option value="${id}">${escapeHTML(title)}</option>`).join('');
    }
    /* === Rolagem virtual bidirecional da biblioteca ===
       A caixa mantém a altura de todas as linhas. Só existem no DOM as linhas
       perto da tela. Isso serve igualmente
       ao rolar para cima, para baixo ou arrastar a barra de rolagem. */
    const library = {catalog:[], results:[], rows:new Map(), layout:null, frame:0};
    const LIBRARY_BUFFER = 3;
    const LIBRARY_MAX_COLUMNS = 7;

    function libraryGeometry(width) {
      // Até sete por fileira, sem forçar cartões estreitos no celular.
      const gap = width < 500 ? 9 : width < 900 ? 12 : 14;
      const minCard = width < 500 ? 130 : width < 720 ? 146 : 150;
      const columns = clamp(Math.floor((width + gap) / (minCard + gap)),1,LIBRARY_MAX_COLUMNS);
      const cell = (width - (columns - 1) * gap) / columns;
      const cover = Math.max(69,Math.round(cell / 2.1));
      const height = cover + 7 + 2*18; // capa, espaço e até duas linhas de título
      return {width,columns,gap,cover,height,step:height+gap,count:Math.ceil(library.results.length/columns)};
    }
    function dropLibraryRows() {
      for (const row of library.rows.values()) row.remove();
      library.rows.clear();
    }
    function insertLibraryRow(index, grid, layout, eager = index<2) {
      if (library.rows.has(index)) {
        const mounted = library.rows.get(index);
        if (eager) for (const image of $$('img[loading="lazy"]',mounted)) image.loading = 'eager';
        return mounted;
      }
      const row = document.createElement('div');
      row.className = 'library-row'; row.dataset.libraryRow = index;
      row.style.top = `${index*layout.step}px`;
      const base = index*layout.columns;
      row.innerHTML = library.results.slice(base,base+layout.columns).map((game,i) => gameCard(game,{eager,ordinal:base+i})).join('');
      // Preserva a ordem dos botões ao reinserir linhas acima das já montadas.
      const next = Array.from(grid.children).find(child => Number(child.dataset.libraryRow)>index);
      grid.insertBefore(row,next || null);
      library.rows.set(index,row);
      return row;
    }
    function paintLibraryWindow() {
      if (currentRoute !== 'games' || !library.results.length || $('#modal').open) return;
      const grid = $('#games-grid');
      const width = grid.clientWidth;
      if (!width) return;
      const previous = library.layout;
      let layout = previous;
      if (!previous || previous.width !== width) {
        layout = libraryGeometry(width);
        library.layout = layout;
        const oldTop = grid.getBoundingClientRect().top;
        const oldOffset = Math.max(0,-oldTop);
        const oldPosition = previous ? oldOffset / previous.step : 0;
        const oldIndex = previous ? Math.floor(oldPosition)*previous.columns : 0;
        const oldFocus = grid.contains(document.activeElement) ? Number(document.activeElement.dataset.catalogIndex) : NaN;
        if (!previous || previous.columns !== layout.columns) dropLibraryRows();
        else for (const [at,row] of library.rows) row.style.top = `${at*layout.step}px`;
        grid.style.setProperty('--library-columns',layout.columns);
        grid.style.setProperty('--library-gap',`${layout.gap}px`);
        grid.style.setProperty('--library-card-height',`${layout.height}px`);
        grid.style.setProperty('--library-cover-height',`${layout.cover}px`);
        grid.style.height = `${layout.count*layout.step-layout.gap}px`;
        if (previous && oldOffset>0 && layout.step>0 && (previous.step!==layout.step || previous.columns!==layout.columns)) {
          const newTop = Math.floor(oldIndex/layout.columns)*layout.step+(oldPosition%1)*layout.step;
          window.scrollBy(0,Math.round(newTop+grid.getBoundingClientRect().top));
        }
        if (previous && previous.columns!==layout.columns && Number.isInteger(oldFocus) && oldFocus<library.results.length) {
          const row = insertLibraryRow(Math.floor(oldFocus/layout.columns),grid,layout);
          $(`[data-catalog-index="${oldFocus}"]`,row)?.focus({preventScroll:true});
        }
      }
      const top = grid.getBoundingClientRect().top;
      const viewStart = Math.floor(-top/layout.step);
      const viewEnd = Math.ceil((window.innerHeight-top)/layout.step);
      const first = clamp(viewStart-LIBRARY_BUFFER,0,layout.count-1);
      const end = clamp(viewEnd+LIBRARY_BUFFER,first+1,layout.count);
      for (const [at,row] of library.rows) {
        if (at<first || at>=end) {
          // Mantém o teclado na biblioteca se a rolagem manual tirar o botão de foco da tela.
          if (row.contains(document.activeElement)) grid.focus({preventScroll:true});
          row.remove(); library.rows.delete(at);
        }
      }
      for (let at=first;at<end;at++) insertLibraryRow(at,grid,layout,at>=viewStart && at<viewEnd);
    }
    function scheduleLibraryWindow() {
      if (currentRoute !== 'games' || library.frame) return;
      library.frame = requestAnimationFrame(() => { library.frame = 0; paintLibraryWindow(); });
    }
    function updateLibraryRoute(route) {
      if (route === 'games') scheduleLibraryWindow();
      else {
        if (library.frame) cancelAnimationFrame(library.frame);
        library.frame = 0; library.layout = null;
        dropLibraryRows();
      }
    }
    function scrollToLibraryCard(index) {
      const grid = $('#games-grid');
      const layout = library.layout;
      if (!layout) return;
      const rowIndex = Math.floor(index/layout.columns);
      const row = insertLibraryRow(rowIndex,grid,layout,true);
      const button = $(`[data-catalog-index="${index}"]`,row);
      if (!button) return;
      const rect = button.getBoundingClientRect();
      const toolbar = $('#view-games .game-filters');
      const bar = toolbar.getBoundingClientRect();
      const sticky = getComputedStyle(toolbar).position === 'sticky' && bar.top <= 12;
      const minY = sticky ? bar.bottom + 8 : 10;
      const rail = $('.rail').getBoundingClientRect();
      const maxY = (rail.width >= window.innerWidth*0.8 ? rail.top : window.innerHeight)-10;
      if (rect.top < minY) window.scrollBy(0,Math.floor(rect.top-minY));
      else if (rect.bottom > maxY) window.scrollBy(0,Math.ceil(rect.bottom-maxY));
      button.focus({preventScroll:true});
      scheduleLibraryWindow();
    }
    function setupLibraryWindow() {
      const grid = $('#games-grid');
      window.addEventListener('scroll',scheduleLibraryWindow,{passive:true});
      window.addEventListener('resize',scheduleLibraryWindow,{passive:true});
      $('#modal').addEventListener('close',scheduleLibraryWindow);
      if (typeof window.ResizeObserver === 'function') {
        let observedWidth = -1;
        new window.ResizeObserver(entries => {
          const width = entries[0]?.contentRect.width || 0;
          if (width !== observedWidth) { observedWidth = width; scheduleLibraryWindow(); }
        }).observe(grid);
      }
      grid.addEventListener('keydown',event => {
        const index = Number(event.target.closest('[data-catalog-index]')?.dataset.catalogIndex);
        const n = library.results.length;
        const columns = library.layout?.columns || 1;
        if (!Number.isInteger(index) || !n || event.altKey || event.metaKey || event.ctrlKey || event.isComposing) return;
        const moves = {ArrowUp:index-columns,ArrowDown:index+columns,ArrowLeft:index-1,ArrowRight:index+1,Home:0,End:n-1,Tab:index+(event.shiftKey?-1:1)};
        if (!Object.prototype.hasOwnProperty.call(moves,event.key)) return;
        const next = moves[event.key];
        if (event.key==='Tab' && (next<0 || next>=n)) return; // permite sair da grade
        event.preventDefault();
        scrollToLibraryCard(clamp(next,0,n-1));
      });
    }
    function renderGames({resetScroll=false} = {}) {
      const grid = $('#games-grid');
      const query = normalize($('#game-search').value);
      const collection = $('#game-collection').value;
      if (resetScroll && currentRoute==='games' && grid.getBoundingClientRect().top<80) window.scrollTo(0,0);
      library.results = library.catalog.filter(g => (!currentGenre || g.genre === currentGenre) && (!collection || g.collections.includes(collection)) && (!query || g.search.includes(query)));
      dropLibraryRows(); grid.replaceChildren(); grid.style.height = ''; library.layout = null;
      const total = library.results.length;
      const filterActive = !!(query || currentGenre || collection);
      $('#games-count').textContent = total === 1 ? '1 jogo encontrado' : `${catalogNumber.format(total)} jogos${filterActive ? ' encontrados' : ' no catálogo'}`;
      for (const button of $$('#genre-filters .chip')) button.setAttribute('aria-pressed',String(button.dataset.genre === currentGenre));
      if (!total) {
        grid.innerHTML = `<div class="no-results glass">${icon('search')}<h2>Nenhum jogo encontrado</h2><p>Tente outro termo ou limpe os filtros.</p><button type="button" id="clear-filters" class="btn btn-secondary">Limpar filtros</button></div>`;
      } else if (currentRoute==='games') paintLibraryWindow();
    }
    function updateLibraryFilters() { renderGames({resetScroll:true}); }
    function renderFixedCards() {
      $('#feature-grid').innerHTML = games.filter(g => spotlight.has(g.id)).slice(0,3).map(g => gameCard(g,{eager:true})).join('');
      $('#app-grid').innerHTML = apps.map(a => {
        const href = resolveURL(a.url); if (!href) return '';
        const domain = new URL(href).hostname.replace(/^www\./i,'');
        return `<a class="app-card glass" href="${escapeHTML(href)}" target="_blank" rel="noopener noreferrer" style="--tile-tone:${tone(a.color)}">
          <span class="app-logo" style="--tile-tone:${tone(a.color)}">${icon(a.icon)}</span>${icon('external','app-out')}<div><h2>${escapeHTML(a.name)}</h2><p>${escapeHTML(a.description)}</p></div><small>${escapeHTML(domain)}</small></a>`;
      }).join('');
      $('#random-slot').innerHTML = `<div class="random-empty">${icon('spark')}<strong>O próximo jogo é uma surpresa</strong><p>Clique em “Sortear jogo” para descobrir.</p></div>`;
    }
    function drawGame() {
      if (rolling || !games.length) return;
      const available = games.filter(g => g.issue !== 'missing' && frameFallbacks.get(g.id) !== 'missing');
      if (!available.length) { toast('Nenhum jogo disponível para o sorteio.', 'dice'); return; }
      const pool = available.length > 1 ? available.filter(g => g.id !== lastDraw) : available;
      const choice = pool[Math.floor(Math.random()*pool.length)];
      const btn = $('#draw-game'); const slot = $('#random-slot');
      const end = () => {
        rolling = false; lastDraw = choice.id;
        btn.disabled = false; $('span',btn).textContent = 'Sortear de novo';
        $('#random-dice').classList.remove('rolling');
        $('#random-output').removeAttribute('aria-busy');
        slot.innerHTML = gameCard(choice,{result:true});
        $('#random-status').textContent = `Jogo sorteado: ${choice.title}.`;
      };
      if (!motionAllowed()) { end(); return; }
      rolling = true; btn.disabled = true; $('span',btn).textContent = 'Sorteando…';
      $('#random-dice').classList.add('rolling');
      $('#random-output').setAttribute('aria-busy','true');
      const delays = [65,70,80,90,105,125,155,182];
      const offset = Math.floor(Math.random()*games.length);
      function step(i) {
        if (i >= delays.length) { end(); return; }
        slot.innerHTML = gameCard(games[(offset+i)%games.length],{shuffling:true});
        setTimeout(() => step(i+1),delays[i]);
      }
      step(0);
    }

    /* === Caixa de diálogo reutilizada === */
    function openDialog(title,label,html,wide = false,setup = null) {
      const modal = $('#modal');
      if (modal.open && modalCleanup) { modalCleanup(); modalCleanup = null; }
      if (!modal.open) returnFocus = document.activeElement;
      $('#modal-title').textContent = title;
      $('#modal-label').textContent = label;
      const body = $('#modal-body');
      body.innerHTML = html;
      modal.classList.toggle('dialog-wide',wide);
      if (!modal.open) modal.showModal();
      document.body.classList.add('dialog-open');
      modalCleanup = setup?.(body) || null;
    }
    function finishDialog() {
      const cleanup = modalCleanup;
      modalCleanup = null;
      cleanup?.();
      document.body.classList.remove('dialog-open');
      $('#modal-body').replaceChildren();
      if (returnFocus?.closest('#search-suggestions[hidden]')) $('#search-main').focus({preventScroll:true});
      else if (returnFocus?.isConnected) returnFocus.focus({preventScroll:true});
      returnFocus = null;
    }
    function closeDialog() {
      const modal = $('#modal');
      if (!modal.open) return;
      modal.close(); finishDialog();
    }
    /* === Dados dos jogos nesta aba (não incluem saves de outras origens) === */
    const gameSessionKey = 'bl3ss.game-session.v1';
    const gameSessionSources = new Map();
    let gameSessionEpoch = 0;
    function loadGameSession() {
      try {
        const rows = JSON.parse(sessionStorage.getItem(gameSessionKey) || '[]');
        if (!Array.isArray(rows)) return;
        const byId = new Map(games.map(game => [game.id,game]));
        for (const row of rows.slice(-180)) {
          if (!Array.isArray(row) || row.length!==2) continue;
          const [id,host] = row, game = byId.get(id);
          if (!game || typeof host !== 'string') continue;
          if ([game.destination,game.fallback,game.customFrame].some(ref => {
            const url = catalogURL(ref);
            return url && new URL(url).hostname === host;
          })) gameSessionSources.set(`${id}:${host}`,{game,host});
        }
      } catch { /* O visualizador pode não permitir sessionStorage. */ }
    }
    function noteGameSource(game,url) {
      const host = new URL(url).hostname;
      const key = `${game.id}:${host}`;
      if (gameSessionSources.has(key)) return;
      if (gameSessionSources.size === 180) gameSessionSources.delete(gameSessionSources.keys().next().value);
      gameSessionSources.set(key,{game,host});
      try { sessionStorage.setItem(gameSessionKey,JSON.stringify([...gameSessionSources.values()].map(({game,host}) => [game.id,host]))); }
      catch { /* Continua funcionando em memória. */ }
    }
    function gameSessionSites() {
      const sites = new Map();
      for (const {game,host} of gameSessionSources.values()) {
        if (!sites.has(host)) sites.set(host,new Set());
        sites.get(host).add(game.title);
      }
      return [...sites].map(([host,titles]) => {
        const names = [...titles].slice(0,4).join(' · ') + (titles.size > 4 ? ` · +${titles.size-4}` : '');
        return `<li><code>${escapeHTML(host)}</code><small>${escapeHTML(names)}</small></li>`;
      }).join('');
    }
    function clearGameSession() {
      gameSessionEpoch++;
      const routes = new Set(frameFallbacks.keys());
      frameFallbacks.clear();
      for (const card of $$('.game-card[data-game]')) {
        if (!routes.has(card.dataset.game)) continue;
        const game = games.find(entry => entry.id === card.dataset.game);
        if (game) card.setAttribute('aria-label',gameOpensInTab(game) ? `${game.title} (abre em outra aba)` : game.title);
      }
      gameSessionSources.clear();
      try { sessionStorage.removeItem(gameSessionKey); return true; }
      catch { return false; }
    }
    function openGameCache() {
      const routes = frameFallbacks.size, sources = gameSessionSources.size, sites = gameSessionSites();
      openDialog('Limpar Cache','DADOS DOS JOGOS',`
        <div class="cache-panel">
          <p>Limpe os registros de jogos nesta aba. Seus temas, atalhos e áudios ficam como estão.</p>
          <ul class="cache-list" aria-label="Itens da limpeza">
            <li class="cache-row"><strong>Rotas lembradas do player</strong><output id="cache-routes">${routes} na sessão</output></li>
            <li class="cache-row"><strong>Registros de jogos abertos</strong><output id="cache-records">${sources} na sessão</output></li>
          </ul>
          <section class="cache-external" aria-labelledby="cache-sites-title">
            <h3 id="cache-sites-title">Saves e dados dos jogos externos <span>NO CHROME</span></h3>
            <p>Feche o jogo, cole o endereço abaixo em uma nova aba do Chrome e procure o domínio na lista de sites. O BL3SS não pode apagar esses dados por você.</p>
            <div class="cache-address">
              <input id="cache-address" aria-label="Endereço dos dados de sites no Chrome" readonly value="chrome://settings/content/all">
              <button type="button" class="btn btn-secondary" data-cache-copy>Copiar</button>
            </div>
            ${sites ? `<ul class="cache-list cache-sites" aria-label="Sites dos jogos abertos nesta aba" tabindex="0">${sites}</ul>` : '<p>Nenhum jogo registrado nesta aba. Para saves antigos, procure pelo endereço do jogo.</p>'}
            <p class="cache-note">Remover os dados de um site pode apagar saves e logins de outros jogos nesse mesmo domínio.</p>
          </section>
          <p id="cache-result" role="status" aria-live="polite" tabindex="-1"></p>
          <div class="dialog-actions">
            <button type="button" class="btn btn-secondary" data-dismiss>Fechar</button>
            <button type="button" class="btn btn-primary" data-cache-confirm ${routes || sources ? '' : 'disabled'}>${icon('trash')} Limpar dados da aba</button>
          </div>
        </div>`,false,body => {
        const dialog = $('#modal');
        dialog.classList.add('dialog-game-cache');
        const result = $('#cache-result',body), confirm = $('[data-cache-confirm]',body);
        confirm.addEventListener('click',() => {
          const storageCleared = clearGameSession();
          for (const [id,count] of [['cache-routes',routes],['cache-records',sources]]) {
            const row = $(`#${id}`,body);
            const memoryOnly = id === 'cache-records' && !storageCleared;
            const removed = id === 'cache-routes' ? (count === 1 ? 'removida' : 'removidas') : (count === 1 ? 'removido' : 'removidos');
            row.textContent = count ? `${count} ${memoryOnly ? 'remov. da memória' : removed}` : 'Nada a limpar';
            row.toggleAttribute('data-done',count > 0 && !memoryOnly);
          }
          result.textContent = storageCleared ? 'Dados da aba limpos. Saves externos não foram alterados.' : 'Limpeza feita na memória; o Chrome não liberou o armazenamento da aba.';
          result.focus({preventScroll:true});
          confirm.disabled = true;
        },{once:true});
        $('[data-cache-copy]',body).addEventListener('click',async () => {
          const address = $('#cache-address',body);
          try {
            await navigator.clipboard.writeText(address.value);
            result.textContent = 'Endereço copiado. Cole na barra de uma nova aba do Chrome.';
          } catch {
            address.focus(); address.select();
            result.textContent = 'Endereço selecionado. Use Ctrl+C para copiar.';
          }
        });
        return () => dialog.classList.remove('dialog-game-cache');
      });
    }

    /* === BlessSounds: catálogo online e reprodução de arquivos locais === */
    const CATALOG_ORIGIN = 'https://audiomack.com';
    const songPathPattern = /^[a-z0-9_-]+\/song\/[a-z0-9_-]+$/i;
    const audioFileExtension = /\.(mp3|m4a|aac|wav|ogg|oga|opus|flac|webm|aiff?|caf|mp4|weba)$/i;
    const soundGroups = [
      {label:'Pop',tone:'rose',glyph:'music',genres:['Pop','Indie pop']},
      {label:'Eletrônica',tone:'violet',glyph:'wave',genres:['Eletrônica','Eurodance','House','Hardstyle']},
      {label:'Afrobeats',tone:'mint',glyph:'music',genres:['Afrobeats']},
      {label:'Hip-hop / Rap',tone:'violet',glyph:'headphones',genres:['Hip-hop / Rap','Trap BR']},
      {label:'R&B',tone:'rose',glyph:'music',genres:['R&B']},
      {label:'Latino',tone:'amber',glyph:'wave',genres:['Latino','Reggaeton']},
      {label:'Funk BR',tone:'rose',glyph:'headphones',genres:['Funk BR']},
      {label:'Amapiano',tone:'violet',glyph:'wave',genres:['Amapiano']},
      {label:'Trilhas de jogos',tone:'mint',glyph:'game',genres:['Trilhas de jogos']}
    ];
    const music = {
      tracks:[], files:[], byId:new Map(), selected:null, catalogSelected:null, stream:null, loaded:null, url:'', playNonce:0,
      fileSerial:0, library:'catalogo', results:[], laneScroll:0, groupCount:0, consulted:''
    };
    const soundKey = value => normalize(value).replace(/[^\p{L}\p{N}]+/gu,' ').trim();
    const soundText = (value,len=160) => typeof value === 'string' ? value.trim().slice(0,len) : '';
    function soundLength(value) {
      const seconds = Number.isFinite(value) && value>0 ? Math.floor(value) : 0;
      const sec = String(seconds%60).padStart(2,'0');
      const minutes = Math.floor(seconds/60);
      return `${minutes>=60 ? `${Math.floor(minutes/60)}:${String(minutes%60).padStart(2,'0')}` : minutes}:${sec}`;
    }
    function trackWords(title,artist,genre,alias='') { return soundKey(`${title} ${artist} ${genre} ${alias}`).split(' '); }
    function musicTrackFrom(row) {
      if (!isRecord(row) || typeof row.id !== 'string' || !songPathPattern.test(row.id) || !soundText(row.title) || !soundText(row.artist)) return null;
      const title = soundText(row.title), artist = soundText(row.artist,260), genre = soundText(row.genre,42) || 'Outros';
      const seconds = Number.isSafeInteger(row.duration) && row.duration>0 && row.duration<86400 ? row.duration : 0;
      const plays = Number.isSafeInteger(row.plays) && row.plays>0 ? row.plays : 0;
      const access = ['plus','region'].includes(row.access) ? row.access : '';
      const cover = typeof row.art === 'string' && /^music-art-[a-f0-9]+$/.test(row.art) ? asset(row.art) : '';
      const alias = row.id.startsWith('kaitlyn-davenport/') ? 'baldi baldis basics music youre mine' : title === 'E.T.' ? 'et' : '';
      return {id:row.id,embed:`${CATALOG_ORIGIN}/embed/${row.id}`,title,artist,genre,seconds,plays,access,explicit:row.explicit===true,cover,words:trackWords(title,artist,genre,alias)};
    }
    function coverMarkup(track) {
      return `<span class="music-cover" aria-hidden="true">${icon(track.file?'blesssounds':'music')}${track.cover ? `<img src="${escapeHTML(track.cover)}" alt="" decoding="async" loading="lazy" data-music-cover>` : ''}</span>`;
    }
    const musicAccessName = track => track.access==='plus' ? 'Audiomack+' : track.access==='region' ? 'Acesso regional' : '';
    function songLabel(track) {
      return `${track.title} — ${track.artist}${track.access ? ` · ${musicAccessName(track)}` : ''}${track.explicit ? ' · Conteúdo explícito' : ''}`;
    }
    function featureButton(track) {
      const label = escapeHTML(songLabel(track));
      return `<li><button type="button" class="sound-feature" data-track="${escapeHTML(track.id)}" aria-label="Selecionar: ${label}" title="${label}">${escapeHTML(track.title)}</button></li>`;
    }
    function songRow(track) {
      const label = escapeHTML(songLabel(track));
      return `<li><button type="button" class="sound-song" data-track="${escapeHTML(track.id)}"${track.access?' data-access':''} title="${label}" aria-label="${track.file?'Reproduzir':'Selecionar'}: ${label}">${coverMarkup(track)}<span class="sound-song-text"><strong>${escapeHTML(track.title)}</strong><small>${escapeHTML(track.artist)}</small></span>${icon(track.file?'play':'chevron')}</button></li>`;
    }
    function soundLane(group,rows,index) {
      return `<section class="sound-lane" data-tone="${group.tone}" aria-labelledby="sound-list-${index}"><header class="sound-lane-head"><span class="sound-lane-icon">${icon(group.glyph)}</span><h3 id="sound-list-${index}">${escapeHTML(group.label)}</h3><span class="sound-lane-count" aria-label="${rows.length} faixas">${String(rows.length).padStart(2,'0')}</span></header><ul class="sound-track-list sound-lane-list" tabindex="0" aria-labelledby="sound-list-${index}">${rows.map(songRow).join('')}</ul></section>`;
    }
    function syncMusicSelection() {
      const key = music.selected?.id.toLowerCase();
      for (const row of $$('.music-browser [data-track]')) {
        if (row.dataset.track.toLowerCase() === key) row.setAttribute('aria-current','true');
        else row.removeAttribute('aria-current');
      }
    }
    function setSoundStatus(text) {
      const status = $('#music-status');
      if (status.textContent !== text) status.textContent = text;
    }
    function setTrackDuration(value) {
      const duration = $('#music-duration');
      $('#music-time-box').hidden = !(Number.isFinite(value) && value>0);
      duration.textContent = soundLength(value);
      duration.dateTime = `PT${Math.max(0,Math.floor(value||0))}S`;
    }
    function showMusicSelection(track) {
      const switched = music.selected !== track;
      const local = !!track?.file;
      music.selected = track;
      if (switched) {
        for (const layer of $$('#view-musica [data-selected-cover]')) {
          if (!track?.cover) { layer.replaceChildren(); continue; }
          const art = document.createElement('img');
          art.alt = ''; art.decoding = 'async'; art.loading = 'lazy'; art.setAttribute('data-music-cover','');
          art.src = track.cover;
          layer.replaceChildren(art);
        }
      }
      $('#music-player').dataset.mode = local ? 'local' : track ? 'catalogo' : 'vazio';
      $('#music-mode-label').textContent = local ? 'PLAYER LOCAL' : track ? 'FAIXA DO CATÁLOGO' : 'MÚSICA DO BL3SS';
      $('#music-now').hidden = !track;
      $('#bless-stream-brand').hidden = !track?.embed;
      if (switched) $('#bless-stream-reload').hidden = true;
      for (const id of ['bless-timeline','bless-play','bless-mute']) $(`#${id}`).hidden = !local;
      const canStep = !!track && (local ? music.files.length : music.tracks.length) > 1;
      $('#music-prev').disabled = $('#music-next').disabled = !canStep;
      if (track) {
        $('#music-track-title').textContent = track.title;
        $('#music-artist').textContent = track.artist;
        $('#music-genre').textContent = track.genre;
        $('#music-access').hidden = !track.access;
        $('#music-access').textContent = musicAccessName(track);
        $('#music-plays-box').hidden = !track.plays;
        if (track.plays) $('#music-plays').textContent = catalogNumber.format(track.plays);
        setTrackDuration(track.seconds);
        $('#music-now-art').innerHTML = coverMarkup(track);
      }
      if (local) setSoundStatus('Arquivo local. Nenhum áudio é enviado.');
      else if (!track) setSoundStatus('Adicione um arquivo para ouvir no BlessSounds.');
      if (switched && track && motionAllowed() && currentRoute==='musica') $('#music-now').animate?.([{opacity:0.45,transform:'translateY(3px)'},{opacity:1,transform:'translateY(0)'}],{duration:220,easing:'cubic-bezier(.2,.72,.3,1)'});
      syncMusicSelection();
      syncMediaUI();
      syncCatalogPlayer();
    }
    function bringMusicPlayer(focus=false) {
      const panel = $('#music-player');
      if (focus) panel.focus({preventScroll:true});
      const top = panel.getBoundingClientRect().top;
      if (top < -1 || top+110 > window.innerHeight) panel.scrollIntoView({block:'start',behavior:motionAllowed() && !focus ? 'smooth' : 'auto'});
    }

    // O oEmbed publica este formato de iframe. A reprodução e suas permissões
    // ficam com o Audiomack: não assinamos a Data API nem copiamos URLs de mídia.
    function releaseCatalogPlayer() {
      const stream = music.stream;
      if (!stream) return;
      music.stream = null;
      clearTimeout(stream.timer);
      stream.frame.remove();
      const host = $('#bless-stream');
      host.hidden = true;
      host.setAttribute('aria-busy','false');
    }
    function syncCatalogPlayer() {
      const track = music.selected;
      if (currentRoute !== 'musica' || !track?.embed || music.stream) return;
      const reload = $('#bless-stream-reload');
      if (track.access === 'plus') {
        setSoundStatus('Faixa Audiomack+. Escolha uma faixa disponível para ouvir aqui.');
        return;
      }
      if (track.access === 'region') {
        setSoundStatus('Esta faixa tem restrições regionais de reprodução.');
        return;
      }
      if (inIsolatedViewer()) {
        setSoundStatus('A prévia do arquivo não acessa a internet. Use a prévia ao vivo do site para ouvir o catálogo.');
        return;
      }
      // frame-ancestors do Audiomack não permite páginas locais file://.
      if (!/^https?:$/.test(location.protocol)) {
        setSoundStatus('O catálogo toca na versão web do BL3SS. Neste arquivo, você pode usar Meus áudios.');
        return;
      }
      reload.hidden = false;
      if (navigator.onLine === false) {
        setSoundStatus('Sem conexão. Você pode usar Meus áudios ou recarregar o player quando voltar.');
        return;
      }
      const host = $('#bless-stream');
      const frame = document.createElement('iframe');
      frame.title = `Player do Audiomack: ${track.title}`;
      frame.referrerPolicy = 'no-referrer';
      // Sem pop-ups, navegação do topo ou autoplay delegado. O Play é do iframe.
      frame.sandbox = location.origin === CATALOG_ORIGIN ? 'allow-scripts' : 'allow-scripts allow-same-origin';
      frame.setAttribute('aria-describedby','music-status');
      const stream = {frame,timer:0};
      music.stream = stream;
      const showControls = message => {
        if (music.stream !== stream) return;
        clearTimeout(stream.timer);
        host.setAttribute('aria-busy','false');
        setSoundStatus(message);
      };
      frame.addEventListener('load',() => {
        // load não garante que o Audiomack conseguiu reproduzir a faixa.
        showControls('Play e pausa acima. Não carregou? Use ↻.');
      },{once:true});
      frame.addEventListener('error',() => {
        if (music.stream === stream) catalogPlayerFailure();
      },{once:true});
      stream.timer = setTimeout(() => showControls('O player está demorando. Você pode aguardar ou usar ↻ para recarregar.'),8000);
      frame.src = track.embed;
      host.setAttribute('aria-busy','true');
      host.hidden = false;
      setSoundStatus('Carregando o player do Audiomack…');
      host.append(frame);
    }
    function catalogPlayerFailure() {
      releaseCatalogPlayer();
      setSoundStatus('Não deu para abrir o player do Audiomack. Use ↻ para tentar novamente.');
    }

    const soundAudio = () => $('#bless-audio');
    function validDuration(audio) { return Number.isFinite(audio.duration) && audio.duration>0 ? audio.duration : 0; }
    function syncMediaClock() {
      const audio = soundAudio();
      const hasAudio = !!music.loaded && music.loaded === music.selected;
      const total = hasAudio ? validDuration(audio) : 0;
      const elapsed = hasAudio && Number.isFinite(audio.currentTime) ? audio.currentTime : 0;
      const range = $('#bless-seek');
      range.disabled = !total || !!audio.error;
      range.max = total ? String(Math.ceil(total*10)/10) : '1';
      putRange(range,Math.min(elapsed,total));
      const first = soundLength(elapsed), last = soundLength(total);
      if ($('#bless-elapsed').textContent !== first) $('#bless-elapsed').textContent = first;
      if ($('#bless-total').textContent !== last) $('#bless-total').textContent = last;
      range.setAttribute('aria-valuetext',`${first} de ${last}`);
    }
    function syncMediaUI() {
      const audio = soundAudio(), local = !!music.loaded && music.loaded === music.selected;
      const playing = local && !audio.paused && !audio.ended;
      const play = $('#bless-play'), mute = $('#bless-mute');
      const playLabel = playing ? 'Pausar' : 'Play';
      play.disabled = !local || !!audio.error;
      play.title = playing ? 'Pausar arquivo local' : 'Reproduzir arquivo local';
      play.setAttribute('aria-label',playLabel);
      $('#bless-play-text').textContent = playLabel;
      $('use',play).setAttribute('href',playing?'#i-pause':'#i-play');
      const muteLabel = audio.muted ? 'Ativar som' : 'Silenciar áudio';
      mute.title = muteLabel; mute.setAttribute('aria-label',muteLabel);
      mute.setAttribute('aria-pressed',String(audio.muted));
      $('use',mute).setAttribute('href',audio.muted?'#i-volume-off':'#i-volume');
      const header = $('#header-audio');
      header.classList.toggle('has-player',playing);
      header.title = local ? `BlessSounds: ${music.selected.title}` : 'BlessSounds';
      syncMediaClock();
    }
    function releaseLocalAudio() {
      const audio = soundAudio();
      music.playNonce++;
      music.loaded = null;
      audio.pause();
      if (audio.hasAttribute('src')) { audio.removeAttribute('src'); audio.load(); }
      if (music.url) { URL.revokeObjectURL(music.url); music.url = ''; }
    }
    function mediaFailure(message='Não deu para ler este áudio. Tente um arquivo compatível, como MP3 ou WAV.') {
      if (!music.loaded || music.selected !== music.loaded) return;
      setSoundStatus(message);
      syncMediaUI();
    }
    function playLocalAudio() {
      const audio = soundAudio();
      if (!music.loaded || music.selected !== music.loaded || audio.error) return;
      const nonce = ++music.playNonce;
      audio.play()?.catch(error => {
        if (nonce!==music.playNonce || error.name==='AbortError') return;
        mediaFailure(error.name==='NotAllowedError' ? 'Toque em Play para iniciar.' : undefined);
      });
    }
    function openMusicTrack(track,{reveal=true,focus=false,play=false}={}) {
      const audio = soundAudio();
      if (track !== music.selected) releaseCatalogPlayer();
      if (track?.file) {
        if (music.loaded !== track) {
          releaseLocalAudio();
          try {
            music.url = URL.createObjectURL(track.file);
            music.loaded = track;
            audio.src = music.url;
            audio.load();
          } catch {
            showMusicSelection(track);
            setSoundStatus('Não deu para abrir este arquivo neste navegador.');
            return;
          }
        }
      } else {
        if (music.loaded || music.url) releaseLocalAudio();
        if (track) music.catalogSelected = track;
      }
      showMusicSelection(track);
      if (reveal) bringMusicPlayer(focus);
      if (track?.file && play) playLocalAudio();
    }
    function stepMusicTrack(direction) {
      const previous = music.selected;
      const list = previous?.file ? music.files : music.tracks;
      const at = list.indexOf(previous);
      if (at<0 || list.length<2) return;
      openMusicTrack(list[(at+direction+list.length)%list.length],{reveal:false,play:!!previous.file && !soundAudio().paused});
    }
    function fileKey(file) { return `${file.name}\n${file.size}\n${file.lastModified}`; }
    function addLocalAudio(files) {
      if (!files.length) return;
      const keys = new Set(music.files.map(track => fileKey(track.file)));
      const accepted = [];
      let invalid=0, capacity=false;
      for (const file of files) {
        const ext = file.name.match(audioFileExtension);
        if (!file.size || (!file.type.startsWith('audio/') && !ext)) { invalid++; continue; }
        const key = fileKey(file);
        if (keys.has(key)) continue;
        if (music.files.length+accepted.length>=160) { capacity = true; break; }
        keys.add(key);
        const title = soundText(file.name.replace(audioFileExtension,'')) || 'Sem título';
        const artist = 'Arquivo do dispositivo';
        const genre = ext ? ext[1].toUpperCase() : 'Arquivo local';
        const track = {id:`local-${++music.fileSerial}`,file,title,artist,genre,seconds:0,words:trackWords(title,artist,genre)};
        accepted.push(track);
        music.byId.set(track.id,track);
      }
      if (!accepted.length) {
        toast(invalid ? 'Escolha um arquivo de áudio, como MP3 ou WAV.' : capacity ? 'A fila está cheia (160 arquivos).' : 'Esses arquivos já estão na fila.', 'music');
        return;
      }
      music.files.push(...accepted);
      setMusicLibrary('local');
      if (!music.loaded) openMusicTrack(accepted[0],{reveal:false});
      else $('#music-prev').disabled = $('#music-next').disabled = music.files.length < 2;
      toast(capacity ? 'A fila comporta até 160 arquivos.' : invalid ? 'Áudios adicionados. Alguns arquivos não foram aceitos.' : accepted.length===1 ? 'Áudio adicionado à fila.' : `${accepted.length} áudios adicionados à fila.`, 'music');
    }
    function clearLocalAudio() {
      for (const track of music.files) music.byId.delete(track.id);
      music.files = [];
      if (music.selected?.file) openMusicTrack(music.catalogSelected || music.tracks[0] || null,{reveal:false});
      renderMusicSearch();
      $('#bless-file-empty [data-audio-import]')?.focus({preventScroll:true});
    }
    function knownCatalogId(value) {
      try {
        const uri = new URL(/^audiomack\.com\//i.test(value) ? `https://${value}` : value);
        if (uri.origin !== CATALOG_ORIGIN || uri.username || uri.password) return '';
        const id = uri.pathname.replace(/^\/|\/$/g,'');
        return songPathPattern.test(id) ? id.toLowerCase() : '';
      } catch { return ''; }
    }
    function renderMusicSearch() {
      const shelf = $('#music-carousel');
      const local = music.library==='local';
      const search = $('#music-search');
      const value = search.value.trim();
      const query = soundKey(value);
      const searching = !!value;
      const showShelf = !local && !searching;
      const returning = showShelf && shelf.hidden;
      if (!shelf.hidden && !showShelf && shelf.clientWidth) music.laneScroll = shelf.scrollLeft;
      shelf.hidden = !showShelf;
      $('#music-results').hidden = showShelf || local;
      $('#music-local').hidden = !local;
      $('#music-arrows').hidden = !showShelf;
      $('#music-features').hidden = !showShelf || !$('#music-highlights').childElementCount;
      $('#music-clear').hidden = !search.value;
      search.placeholder = local ? 'Pesquisar seus arquivos…' : 'Pesquisar música ou artista…';
      $('#music-library-heading').textContent = local ? 'Meus áudios' : 'Explore por gênero';
      $('#music-library-count').textContent = local ? `${music.files.length} ${music.files.length===1?'arquivo':'arquivos'}` : `${catalogNumber.format(music.tracks.length)} faixas · ${music.groupCount} gêneros`;
      const note = $('#music-library-note');
      note.textContent = local ? 'Fila desta sessão · sem upload' : 'Catálogo BlessSounds';
      note.title = !local && music.consulted ? `Reproduções consultadas em ${music.consulted.split('-').reverse().join('/')}.` : '';
      $('#music-show-catalog').setAttribute('aria-pressed',String(!local));
      $('#music-show-local').setAttribute('aria-pressed',String(local));
      if (showShelf) {
        if (returning) shelf.scrollLeft = music.laneScroll;
        music.results = [];
        updateSoundArrows(); updateSoundHighlights();
        return;
      }
      const id = !local && searching ? knownCatalogId(value) : '';
      const terms = query ? query.split(' ') : [];
      const entries = local ? music.files : music.tracks;
      const found = id ? entries.filter(t => t.id.toLowerCase()===id) : searching ? terms.length ? entries.filter(t => terms.every(term => t.words.some(word => term.length===1 ? word===term : word.includes(term)))) : [] : entries;
      const results = !local && !id ? found.slice().sort((a,b) => Number(soundKey(b.title)===query)-Number(soundKey(a.title)===query) || b.plays-a.plays) : found;
      music.results = results;
      const list = $(local ? '#bless-file-list' : '#music-result-list');
      list.hidden = !results.length;
      list.innerHTML = results.map(songRow).join('');
      list.scrollTop = 0;
      if (local) {
        $('#bless-file-count').textContent = `${results.length} ${results.length===1?'arquivo':'arquivos'}`;
        $('#bless-clear-list').hidden = !music.files.length;
        $('#bless-file-empty').hidden = !!music.files.length;
        $('#bless-file-no-match').hidden = !music.files.length || !!results.length;
      } else {
        $('#music-search-empty').hidden = !!results.length;
        $('#music-result-count').textContent = `${catalogNumber.format(results.length)} ${results.length===1?'resultado':'resultados'}`;
      }
      syncMusicSelection();
    }
    function setMusicLibrary(name) {
      if (music.library !== name) $('#music-search').value = '';
      music.library = name;
      renderMusicSearch();
    }

    function updateSoundHighlights() {
      const rail = $('#music-highlights');
      const control = $('#music-highlight-more');
      if (!rail.clientWidth) return;
      // Reservar o espaço da seta só quando o conteúdo não cabe sem ela.
      const max = rail.scrollWidth-rail.clientWidth;
      const reserved = control.hidden ? 0 : control.offsetWidth;
      control.hidden = max <= reserved;
      const end = rail.scrollLeft >= rail.scrollWidth-rail.clientWidth-2;
      const label = end ? 'Voltar ao início dos destaques' : 'Ver mais destaques';
      control.dataset.end = String(end);
      control.title = label;
      control.setAttribute('aria-label',label);
    }
    function updateSoundArrows() {
      const rail = $('#music-carousel');
      if (!rail.clientWidth) return;
      const lanes = Array.from(rail.children);
      const rect = rail.getBoundingClientRect();
      const which = lanes.map((el,i) => ({i,rect:el.getBoundingClientRect()})).filter(c => c.rect.right > rect.left+9 && c.rect.left < rect.right-9);
      const full = which.filter(c => c.rect.left >= rect.left-2 && c.rect.right <= rect.right+2);
      const shown = full.length ? full : which;
      const first = shown[0]?.i ?? 0, last = shown.at(-1)?.i ?? 0;
      $('#music-lane-position').textContent = !lanes.length ? '0 listas' : `${first===last ? first+1 : `${first+1}–${last+1}`} / ${lanes.length}`;
      $('#music-lane-prev').disabled = rail.scrollLeft < 3;
      $('#music-lane-next').disabled = rail.scrollLeft >= rail.scrollWidth-rail.clientWidth-3;
    }
    function stepSoundRail(step) {
      const rail = $('#music-carousel');
      const width = rail.children.length > 1 ? rail.children[1].offsetLeft-rail.children[0].offsetLeft : rail.clientWidth;
      rail.scrollBy({left:width*step,behavior:motionAllowed()?'smooth':'auto'});
    }
    function setupMusic() {
      const source = data.music || {};
      const take = items => (Array.isArray(items)?items:[]).slice(0,230).map(musicTrackFrom).filter(track => {
        if (!track) return false;
        const key = track.id.toLowerCase();
        if (music.byId.has(key)) return false;
        music.byId.set(key,track); return true;
      });
      const picks = take(source.picks);
      const rank = take(source.rank).sort((a,b) => b.plays-a.plays || a.title.localeCompare(b.title,'pt-BR'));
      music.tracks = [...picks,...rank];
      const allSorted = music.tracks.slice().sort((a,b) => b.plays-a.plays || a.title.localeCompare(b.title,'pt-BR'));
      const seen = new Set(soundGroups.flatMap(g => g.genres));
      const groups = [...soundGroups,{label:'Outros',tone:'mint',glyph:'music',genres:[]}].map(g => [g,allSorted.filter(t => g.genres.length ? g.genres.includes(t.genre) : !seen.has(t.genre))]).filter(([,tracks]) => tracks.length);
      music.groupCount = groups.length;
      music.consulted = typeof source.consulted==='string' && /^\d{4}-\d{2}-\d{2}$/.test(source.consulted) ? source.consulted : '';
      const rail = $('#music-carousel'), pinned = $('#music-highlights'), more = $('#music-highlight-more');
      rail.innerHTML = groups.map(([g,list],i) => soundLane(g,list,i)).join('');
      pinned.innerHTML = picks.map(featureButton).join('');
      openMusicTrack(music.tracks[0] || null,{reveal:false});
      renderMusicSearch();
      pinned.addEventListener('scroll',updateSoundHighlights,{passive:true});
      rail.addEventListener('scroll',updateSoundArrows,{passive:true});
      more.addEventListener('click',() => {
        const atEnd = pinned.scrollLeft >= pinned.scrollWidth-pinned.clientWidth-2;
        pinned.scrollTo({left:atEnd?0:pinned.scrollLeft+Math.max(70,pinned.clientWidth-46),behavior:motionAllowed()?'smooth':'auto'});
      });
      if (typeof window.ResizeObserver === 'function') {
        new window.ResizeObserver(updateSoundArrows).observe(rail);
        new window.ResizeObserver(updateSoundHighlights).observe(pinned);
      } else window.addEventListener('resize',() => { updateSoundArrows(); updateSoundHighlights(); },{passive:true});
      $('#music-lane-prev').addEventListener('click',() => stepSoundRail(-1));
      $('#music-lane-next').addEventListener('click',() => stepSoundRail(1));
      rail.addEventListener('keydown',event => {
        if (event.target===rail && ['ArrowLeft','ArrowRight'].includes(event.key)) {
          event.preventDefault(); stepSoundRail(event.key==='ArrowLeft'?-1:1);
        }
      });
      const search = $('#music-search');
      search.addEventListener('input',renderMusicSearch);
      function resetSearch() { search.value = ''; renderMusicSearch(); search.focus({preventScroll:true}); }
      search.addEventListener('keydown',event => { if (event.key==='Escape' && search.value) { event.preventDefault(); resetSearch(); } });
      $('#music-clear').addEventListener('click',resetSearch);
      $('#music-form').addEventListener('submit',event => {
        event.preventDefault();
        if (!search.value.trim() || !music.results.length) return;
        const first = music.results[0];
        if (music.results.length===1 || soundKey(first.title)===soundKey(search.value)) {
          search.blur(); openMusicTrack(first,{focus:true,play:!!first.file});
        } else $(music.library==='local'?'#bless-file-list button':'#music-result-list button')?.focus();
      });
      $('#music-show-catalog').addEventListener('click',() => setMusicLibrary('catalogo'));
      $('#music-show-local').addEventListener('click',() => setMusicLibrary('local'));
      $('#music-prev').addEventListener('click',() => stepMusicTrack(-1));
      $('#music-next').addEventListener('click',() => stepMusicTrack(1));
      $('#bless-clear-list').addEventListener('click',clearLocalAudio);
      $('#music-files').addEventListener('change',event => { addLocalAudio(Array.from(event.target.files || [])); event.target.value = ''; });
      const audio = soundAudio();
      $('#bless-stream-reload').addEventListener('click',() => {
        releaseCatalogPlayer();
        syncCatalogPlayer();
      });
      document.addEventListener('securitypolicyviolation',event => {
        if (!music.stream || !['frame-src','child-src'].includes(event.effectiveDirective)) return;
        const {blockedURI} = event;
        if (blockedURI === CATALOG_ORIGIN || blockedURI === music.stream.frame.src) catalogPlayerFailure();
      });
      $('#bless-play').addEventListener('click',() => {
        if (audio.paused || audio.ended) playLocalAudio();
        else { music.playNonce++; audio.pause(); }
      });
      $('#bless-mute').addEventListener('click',() => { audio.muted = !audio.muted; });
      $('#bless-seek').addEventListener('input',event => {
        const total = validDuration(audio);
        if (music.loaded && total) { audio.currentTime = clamp(Number(event.target.value),0,total); syncMediaClock(); }
      });
      for (const type of ['play','pause','volumechange','emptied']) audio.addEventListener(type,syncMediaUI);
      for (const type of ['timeupdate','seeking','seeked']) audio.addEventListener(type,syncMediaClock);
      for (const type of ['loadedmetadata','durationchange']) audio.addEventListener(type,() => {
        if (!music.loaded || music.loaded!==music.selected) return;
        music.loaded.seconds = validDuration(audio);
        setTrackDuration(music.loaded.seconds);
        syncMediaUI();
      });
      audio.addEventListener('playing',() => { if (music.loaded) setSoundStatus('Reproduzindo no dispositivo.'); syncMediaUI(); });
      audio.addEventListener('pause',() => { if (music.loaded && !audio.ended && !audio.error) setSoundStatus('Arquivo local. Nenhum áudio é enviado.'); });
      audio.addEventListener('error',() => { if (audio.error) mediaFailure(); });
      audio.addEventListener('ended',() => {
        if (!audio.ended || !music.loaded) return;
        const at = music.files.indexOf(music.loaded);
        if (at>=0 && at+1<music.files.length) openMusicTrack(music.files[at+1],{reveal:false,play:true});
        else { setSoundStatus('Fim da fila.'); syncMediaUI(); }
      });
    }

    /* === Preferências compartilhadas pelo Estúdio e pelo hub === */
    const rgbFromHex = hex => [1,3,5].map(i => parseInt(hex.slice(i,i+2),16));
    const hexFromRgb = rgb => '#' + rgb.map(v => Math.round(v).toString(16).padStart(2,'0')).join('');
    function luminance(rgb) {
      const [r,g,b] = rgb.map(v => { const x = v/255; return x <= 0.04045 ? x/12.92 : ((x+0.055)/1.055)**2.4; });
      return 0.2126*r + 0.7152*g + 0.0722*b;
    }
    // O projeto usa texto claro. Tons muito claros em superfícies são suavizados;
    // acentos escuros recebem contraste para que os indicadores continuem legíveis.
    function themeSurface(hex,maxChannel) {
      const rgb = rgbFromHex(hex);
      const factor = Math.min(1,maxChannel / Math.max(1,...rgb));
      return rgb.map(v => Math.round(v*factor));
    }
    function themeAccent(hex) {
      const rgb = rgbFromHex(hex);
      for (let mix = 0; mix < 1; mix += 0.035) {
        const color = rgb.map(v => Math.round(v+(255-v)*mix));
        if (luminance(color) >= 0.34) return color;
      }
      return rgb;
    }
    function currentPalette() {
      const theme = themes.find(t => t.id === prefs.theme) || themes[0];
      const accent = prefs.accent === 'custom' && prefs.accentCustom
        ? {label:'Personalizado',hex:prefs.accentCustom} : accents.find(a => a.id === prefs.accent) || accents[0];
      return {
        theme,accent,
        panel:prefs.surface || theme.panel,
        background:prefs.background || theme.background,
        customized:!!(prefs.surface || prefs.background || prefs.accent !== theme.accent)
      };
    }
    let appliedWallImage = '';
    function applyPrefs() {
      const root = document.documentElement;
      const {theme,accent,panel,background,customized} = currentPalette();
      const accentRgb = themeAccent(accent.hex), panelRgb = themeSurface(panel,78), backgroundRgb = themeSurface(background,66);
      const isTinted = theme.id !== defaults.theme || !!(prefs.surface || prefs.background);
      const bluePanel = [13,29,50], blueDeep = [6,15,30];
      const surface = isTinted ? panelRgb : bluePanel;
      const deep = isTinted ? panelRgb.map((v,i) => Math.round(v*0.43 + backgroundRgb[i]*0.46)) : blueDeep;
      root.style.setProperty('--accent',hexFromRgb(accentRgb));
      root.style.setProperty('--accent-rgb',accentRgb.join(','));
      root.style.setProperty('--accent-ink',luminance(accentRgb) > 0.25 ? '#061525' : '#f0f6ff');
      root.style.setProperty('--bg',hexFromRgb(backgroundRgb));
      root.style.setProperty('--theme-bg-rgb',backgroundRgb.join(','));
      root.style.setProperty('--theme-panel-rgb',surface.join(','));
      root.style.setProperty('--theme-deep-rgb',deep.join(','));
      root.style.setProperty('--theme-deep',hexFromRgb(deep));
      root.style.setProperty('--glass',isTinted ? `rgba(${panelRgb.join(',')},.78)` : '');
      root.style.setProperty('--blur',`${prefs.blur}px`);
      root.toggleAttribute('data-tint',isTinted);
      root.dataset.motion = prefs.motion === null ? 'system' : motionAllowed() ? 'on' : 'off';
      const reduceWalls = motionQuery.matches || !motionAllowed();
      root.dataset.wallMotion = prefs.wallMotion && !reduceWalls ? 'on' : 'off';
      $('meta[name="theme-color"]').content = isTinted ? hexFromRgb(deep) : '#081327';
      const wall = $('#wallpaper');
      wall.dataset.wall = prefs.wallpaper;
      const useImage = prefs.wallpaper === 'custom' ? prefs.customImage : '';
      if (useImage !== appliedWallImage) {
        wall.style.backgroundImage = useImage ? `url("${useImage}"), var(--city-wallpaper)` : '';
        appliedWallImage = useImage;
      }
      $('#view-musica').dataset.coverMode = prefs.musicCover ? 'on' : 'off';
      const hello = prefs.user ? `Bem-vindo, ${prefs.user}` : 'SEU PONTO DE PARTIDA';
      if ($('#hero-label').textContent !== hello) $('#hero-label').textContent = hello;
      const avatar = $('#avatar');
      const avatarTitle = prefs.user ? `Perfil: ${prefs.user}` : 'Configurar perfil';
      if (avatar.title !== avatarTitle) {
        avatar.title = avatarTitle;
        if (prefs.user) avatar.textContent = Array.from(prefs.user)[0];
        else avatar.innerHTML = icon('user');
      }
      $('#studio-theme-active').textContent = customized ? 'Personalizado' : theme.label;
      $('#studio-wall-active').textContent = wallOptions.find(w => w.id === prefs.wallpaper)?.label || 'Minha imagem';
      $('#active-accent').textContent = accent.label;
      for (const btn of $$('#theme-options [data-theme-choice]')) btn.setAttribute('aria-pressed',String(!customized && btn.dataset.themeChoice === theme.id));
      for (const btn of $$('#accent-options [data-accent]')) btn.setAttribute('aria-pressed',String(btn.dataset.accent === prefs.accent));
      for (const btn of $$('#prefs-studio [data-wall-choice]')) btn.setAttribute('aria-pressed',String(btn.dataset.wallChoice === prefs.wallpaper));
      for (const [id,color] of [['accent',accent.hex],['surface',panel],['background',background]]) {
        const picker = $(`#${id}-picker`);
        if (picker.value !== color) picker.value = color;
        $(`#${id}-hex`).value = color;
      }
      putRange($('#blur-range'),prefs.blur); $('#blur-output').value = `${prefs.blur} px`;
      $('#motion-toggle').checked = motionAllowed();
      $('#wall-motion-toggle').checked = prefs.wallMotion;
      $('#wall-motion-toggle').disabled = reduceWalls;
      $('#wall-motion-note').textContent = motionQuery.matches ? 'Pausado pela opção de reduzir movimento do dispositivo.'
        : reduceWalls ? 'Pausado: as animações da interface estão desligadas.' : 'Movimento nos fundos animados.';
      $('#music-cover-toggle').checked = prefs.musicCover;
      $('#wall-file-desc').textContent = prefs.customImage ? `Imagem carregada: ${prefs.imageName || 'Personalizada'}.` : 'Envie uma imagem estática em JPG, PNG ou WebP.';
    }
    function renderWallOptions() {
      const options = prefs.customImage ? [...wallOptions,{id:'custom',label:'Minha imagem'}] : wallOptions;
      const markup = w => {
        const src = w.id === 'custom' ? prefs.customImage : ['cidade','violeta','cidade-viva'].includes(w.id) ? asset('cidade') : '';
        const thumb = `<span class="wall-thumb" aria-hidden="true">${src ? `<img src="${escapeHTML(src)}" alt="" decoding="async" loading="lazy">` : ''}${w.animated ? `<span class="wall-play-mark">${icon('wave')}</span>` : ''}</span>`;
        return `<button type="button" class="wall-choice" data-wall-choice="${w.id}" aria-pressed="${String(prefs.wallpaper === w.id)}">${thumb}<strong>${escapeHTML(w.label)}</strong></button>`;
      };
      $('#wall-choices').innerHTML = options.filter(w => !w.animated).map(markup).join('');
      $('#animated-wall-choices').innerHTML = options.filter(w => w.animated).map(markup).join('');
    }
    const studioTabNames = ['temas','wallpapers','protecao'];
    function selectStudioTab(id,{focus=false}={}) {
      if (!studioTabNames.includes(id)) return;
      for (const tab of $$('#prefs-studio [data-studio-tab]')) {
        const active = tab.dataset.studioTab === id;
        tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1;
        $(`#${tab.getAttribute('aria-controls')}`).hidden = !active;
      }
      const body = $('#modal.dialog-studio[open] #modal-body');
      if (body) body.scrollTop = 0;
      if (focus) $(`#studio-tab-${id}`).focus({preventScroll:true});
    }
    function openStudio(id) {
      if (!studioTabNames.includes(id)) return;
      const studio = $('#prefs-studio'), slot = $('#studio-slot'), dialog = $('#modal');
      openDialog('Personalizar BL3SS','ESTÚDIO VISUAL','',true,body => {
        dialog.classList.add('dialog-studio');
        body.append(studio);
        selectStudioTab(id,{focus:true});
        return () => {
          slot.append(studio);
          dialog.classList.remove('dialog-studio');
          $('#studio-feedback').textContent = '';
        };
      });
    }
    let wallpaperChoiceEpoch = 0;
    async function uploadWallpaper(file) {
      if (!file) return;
      if ((file.type && !file.type.startsWith('image/')) || file.size > 30*1024*1024) { toast('Escolha uma imagem de até 30 MB.', 'image'); return; }
      const choiceEpoch = ++wallpaperChoiceEpoch;
      const source = URL.createObjectURL(file);
      try {
        const img = new Image(); img.src = source;
        if (img.decode) await img.decode();
        else await new Promise((resolve,reject) => { img.onload = resolve; img.onerror = reject; });
        if (choiceEpoch !== wallpaperChoiceEpoch) return;
        if (!img.naturalWidth) throw new Error('Imagem inválida');
        const scale = Math.min(1,1800/Math.max(img.naturalWidth,img.naturalHeight));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1,Math.round(img.naturalWidth*scale)); canvas.height = Math.max(1,Math.round(img.naturalHeight*scale));
        const ctx = canvas.getContext('2d'); ctx.fillStyle = '#081426'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.drawImage(img,0,0,canvas.width,canvas.height);
        let data = canvas.toDataURL('image/jpeg',0.82);
        if (data.length > 950000) data = canvas.toDataURL('image/jpeg',0.65);
        if (!data.startsWith('data:image/jpeg;base64,')) throw new Error('Formato não disponível');
        prefs.customImage = data; prefs.imageName = file.name.slice(0,120); prefs.wallpaper = 'custom';
        renderWallOptions(); applyPrefs(); persist(STORAGE.prefs,prefs,'Papel de parede atualizado.');
      } catch { if (choiceEpoch === wallpaperChoiceEpoch) toast('Não foi possível abrir a imagem. Tente um arquivo JPG, PNG ou WebP.', 'image'); }
      finally { URL.revokeObjectURL(source); }
    }
    function setupPrefs() {
      $('#theme-options').innerHTML = themes.map(t => {
        const accent = accents.find(a => a.id === t.accent)?.hex || accents[0].hex;
        return `<button type="button" class="studio-preset" data-theme-choice="${t.id}" style="--sample-bg:${t.background};--sample-panel:${t.panel};--sample-accent:${accent}"><span class="preset-preview" aria-hidden="true"><span class="preset-window"><span></span><b><i></i><i></i><i></i></b></span><span class="preset-check">${icon('check')}</span></span><span class="preset-copy"><strong>${escapeHTML(t.label)}</strong><small>${escapeHTML(t.detail)}</small></span></button>`;
      }).join('');
      $('#accent-options').innerHTML = accents.map(a => `<button type="button" class="swatch" data-accent="${a.id}" style="--swatch:${a.hex}" aria-label="${escapeHTML(a.label)}" title="${escapeHTML(a.label)}"><span>${icon('check')}</span></button>`).join('');
      $('#prefs-studio .studio-tabs').addEventListener('keydown',event => {
        const at = studioTabNames.indexOf(event.target.dataset.studioTab);
        if (at < 0) return;
        const moves = {ArrowLeft:at-1,ArrowRight:at+1,Home:0,End:studioTabNames.length-1};
        if (!Object.prototype.hasOwnProperty.call(moves,event.key)) return;
        event.preventDefault();
        selectStudioTab(studioTabNames[(moves[event.key]+studioTabNames.length)%studioTabNames.length],{focus:true});
      });
      renderWallOptions(); applyPrefs();
      for (const picker of $$('#prefs-studio [data-appearance]')) {
        picker.addEventListener('input',() => {
          const value = cleanHex(picker.value);
          if (!value) return;
          const key = picker.dataset.appearance;
          prefs[key] = value;
          if (key === 'accentCustom') prefs.accent = 'custom';
          applyPrefs();
        });
        picker.addEventListener('change',() => persist(STORAGE.prefs,prefs));
      }
      $('#user-name').value = prefs.user;
      $('#blur-range').addEventListener('input',event => {
        prefs.blur = Number(event.target.value);
        document.documentElement.style.setProperty('--blur',`${prefs.blur}px`);
        putRange(event.target,prefs.blur); $('#blur-output').value = `${prefs.blur} px`;
      });
      $('#blur-range').addEventListener('change',() => persist(STORAGE.prefs,prefs));
      for (const [id,key] of [['motion-toggle','motion'],['wall-motion-toggle','wallMotion'],['music-cover-toggle','musicCover']]) {
        $(`#${id}`).addEventListener('change',event => {
          prefs[key] = event.target.checked; applyPrefs(); persist(STORAGE.prefs,prefs);
        });
      }
      if (motionQuery.addEventListener) motionQuery.addEventListener('change',applyPrefs);
      else motionQuery.addListener?.(applyPrefs);
      $('#bg-upload').addEventListener('change',event => {
        uploadWallpaper(event.target.files?.[0]); event.target.value = '';
      });
      $('#name-form').addEventListener('submit',event => {
        event.preventDefault(); prefs.user = $('#user-name').value.trim().slice(0,26);
        $('#user-name').value = prefs.user; applyPrefs();
        persist(STORAGE.prefs,prefs,prefs.user ? 'Nome salvo.' : 'Nome removido.');
      });
      $('#reset-prefs').addEventListener('click',() => openDialog('Restaurar padrões?','CONFIGURAÇÕES',`<p class="modal-message">O visual e o nome voltam ao padrão. Seus atalhos são mantidos.</p><div class="dialog-actions"><button type="button" class="btn btn-secondary" data-dismiss>Cancelar</button><button type="button" class="btn btn-primary" id="confirm-reset">Restaurar</button></div>`,false,root => {
        $('#confirm-reset',root).addEventListener('click',() => {
          wallpaperChoiceEpoch++;
          prefs = {...defaults}; renderWallOptions(); applyPrefs();
          $('#user-name').value = ''; closeDialog(); persist(STORAGE.prefs,prefs,'Preferências restauradas.');
        });
      }));
    }

    /* === Inicialização e delegação dos cliques === */
    function handleClick(event) {
      const el = event.target.closest('a, button');
      if (!el || event.defaultPrevented) return;
      const {route,genre,game,track,accent,wallChoice,themeChoice,studioOpen,studioTab,remove} = el.dataset;
      if (route) {
        if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        event.preventDefault(); go(route,{focus:event.detail === 0});
        if (el.id === 'header-audio' && (music.loaded || music.stream)) bringMusicPlayer(event.detail===0);
        return;
      }
      if (el.matches('a[target="_blank"]') && inIsolatedViewer()) { event.preventDefault(); openExternal(el.href); return; }
      if (el.matches('[data-audio-import]')) { $('#music-files').click(); return; }
      if (el.matches('.skip')) { event.preventDefault(); $('#conteudo').focus(); return; }
      if (el.matches('[data-dismiss], #close-modal')) { closeDialog(); return; }
      if (el.id === 'home-clear-cache') { openGameCache(); return; }
      if (el.id === 'add-shortcut') { addShortcut(); return; }
      if (el.id === 'edit-shortcuts') { editingShortcuts = !editingShortcuts; renderShortcuts(); return; }
      if (remove !== undefined) {
        shortcuts = shortcuts.filter(s => s.id !== remove); renderShortcuts(); $('#edit-shortcuts').focus({preventScroll:true});
        persist(STORAGE.shortcuts,shortcuts,'Atalho removido.'); return;
      }
      if (el.id === 'clear-filters') { currentGenre = ''; $('#game-search').value = ''; $('#game-collection').value = ''; updateLibraryFilters(); $('#game-search').focus(); return; }
      if (genre !== undefined) { currentGenre = genre; updateLibraryFilters(); return; }
      if (el.id === 'draw-game') { drawGame(); return; }
      if (game) { const g = games.find(g => g.id === game); if (g) openGame(g); closeSuggestions(); return; }
      if (track !== undefined) {
        const song = music.byId.get(track.toLowerCase());
        if (!song) return;
        if (currentRoute !== 'musica') { go('musica'); setMusicLibrary(song.file?'local':'catalogo'); }
        closeSuggestions();
        openMusicTrack(song,{focus:event.detail===0,play:!!song.file});
        return;
      }
      if (studioOpen) { openStudio(studioOpen); return; }
      if (studioTab) { selectStudioTab(studioTab); return; }
      if (themeChoice) {
        const theme = themes.find(t => t.id === themeChoice);
        if (!theme) return;
        Object.assign(prefs,{theme:theme.id,accent:theme.accent,accentCustom:'',surface:'',background:''});
        applyPrefs(); persist(STORAGE.prefs,prefs); return;
      }
      if (accent && accents.some(a => a.id === accent)) { prefs.accent = accent; applyPrefs(); persist(STORAGE.prefs,prefs); return; }
      if (wallChoice && (wallOptions.some(w => w.id === wallChoice) || wallChoice === 'custom' && prefs.customImage)) {
        wallpaperChoiceEpoch++; prefs.wallpaper = wallChoice; applyPrefs(); persist(STORAGE.prefs,prefs); return;
      }
      if (el.classList.contains('suggestion')) setTimeout(closeSuggestions,0);
    }
    function loadCatalogData() {
      const rows = Array.isArray(data.games) ? data.games : [];
      gameRows = rows.filter(r => Array.isArray(r) && (r.length===6 || (r.length===7 && isRecord(r[6]))) && typeof r[0]==='string' && typeof r[1]==='string' && Array.isArray(r[5]));
    }
    function init() {
      document.addEventListener('click',handleClick);
      window.addEventListener('hashchange',() => go(readRoute(),{write:false}));
      window.addEventListener('popstate',() => go(readRoute(),{write:false}));
      go(readRoute(),{write:false});
      updateClock(); setInterval(updateClock,1000);
      loadCatalogData();
      prefs = loadPrefs();
      const localShortcuts = readLocal(STORAGE.shortcuts,null);
      if (Array.isArray(localShortcuts)) shortcuts = localShortcuts.filter(s => typeof s?.id === 'string' && shortcutData(s)).slice(0,11);
      games = loadCatalog();
      loadGameSession();
      library.catalog = gamesByFame(games);
      document.addEventListener('error',event => {
        const img = event.target;
        if (!(img instanceof HTMLImageElement)) return;
        if (img.hasAttribute('data-music-cover')) { img.hidden = true; return; }
        if (!img.hasAttribute('data-catalog-cover')) return;
        img.hidden = true;
        const placeholder = img.nextElementSibling;
        if (placeholder?.matches('.catalog-fallback')) placeholder.hidden = false;
      },true);
      renderShortcuts(); renderGenreFilters(); renderGames(); renderFixedCards();
      setupLibraryWindow();
      setupMusic(); setupSearch(); setupPrefs();
      $('#game-search').addEventListener('input',updateLibraryFilters);
      $('#game-collection').addEventListener('change',updateLibraryFilters);
      const modal = $('#modal');
      modal.addEventListener('cancel',event => { event.preventDefault(); closeDialog(); });
      modal.addEventListener('close',() => { if (!modal.open && (returnFocus || modalCleanup)) finishDialog(); });
      modal.addEventListener('click',event => {
        if (event.target !== modal) return;
        const r = modal.getBoundingClientRect();
        if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog();
      });
    }

    /* === Player BL3SS e modo em nova aba === */
    // O about:blank herda a origem do hub. Só preservamos o armazenamento do
    // jogo quando nenhuma origem permitida para iframes pode coincidir com ela.
    const embeddedOrigins = new Set(Object.values(gameOrigins));
    const originalTabReasons = new Set(['blocked','missing','original']);
    function gameUsesOriginalTab(game) {
      return game.yandex || !!game.issue || originalTabReasons.has(frameFallbacks.get(game.id));
    }
    function rememberGameTab(game,reason) {
      // Jogos com duas fontes no player sempre recomeçam no player padrão.
      if (game.customFrame) return;
      frameFallbacks.set(game.id,reason);
      for (const card of $$(`.game-card[data-game="${CSS.escape(game.id)}"]`)) {
        card.setAttribute('aria-label',`${game.title} (abre em outra aba)`);
      }
    }
    function gameFrameSandbox(url) {
      const features = ['allow-scripts','allow-forms','allow-pointer-lock','allow-orientation-lock'];
      if (!embeddedOrigins.has(location.origin) && new URL(url).origin !== location.origin) features.push('allow-same-origin');
      return features.join(' ');
    }
    function createGameFrame(doc,title,sandbox) {
      const frame = doc.createElement('iframe');
      frame.className = 'player-frame';
      frame.title = `Jogo: ${title}`;
      frame.referrerPolicy = 'no-referrer';
      frame.setAttribute('allow','autoplay; fullscreen; gamepad');
      frame.allowFullscreen = true;
      // Sem pop-ups ou permissão para navegar a página principal.
      frame.setAttribute('sandbox',sandbox);
      return frame;
    }
    function configureOriginalGameLink(link,url) {
      link.href = url;
      link.rel = 'noopener noreferrer';
      link.target = '_self';
    }
    function navigateGameTab(tab,url) {
      const doc = tab.document;
      const link = doc.createElement('a');
      configureOriginalGameLink(link,url);
      link.hidden = true;
      doc.body.append(link);
      link.click();
    }
    function detachedIcon(doc,id) {
      const part = $(`#i-${id}`);
      const svg = doc.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox',part.getAttribute('viewBox'));
      svg.setAttribute('aria-hidden','true');
      svg.setAttribute('focusable','false');
      svg.classList.add('tab-glyph');
      for (const child of part.children) svg.append(doc.importNode(child,true));
      return svg;
    }
    const detachedGameCSS = `
      :root { color-scheme: dark; --accent: #57e4ff; --accent-ink: #061525; --theme-deep: #060f1e; --line: #a9c5ea38; color: #f0f6ff; background: var(--theme-deep); font: 14px/1.45 system-ui, "Segoe UI", sans-serif; }
      * { box-sizing: border-box; }
      [hidden] { display: none !important; }
      body { margin: 0; height: 100vh; height: 100dvh; display: grid; grid-template-rows: auto minmax(0,1fr) auto; gap: 9px; padding: max(10px,env(safe-area-inset-top)) max(12px,env(safe-area-inset-right)) max(8px,env(safe-area-inset-bottom)) max(12px,env(safe-area-inset-left)); background: radial-gradient(ellipse at 0 0,color-mix(in srgb,var(--accent) 11%,var(--theme-deep)),var(--theme-deep) 68%); }
      .tab-header { display: grid; grid-template-columns: minmax(0,1fr) auto; align-items: center; gap: 12px; }
      .tab-identity { display: flex; align-items: center; gap: 10px; min-width: 0; }
      .tab-identity > div { min-width: 0; }
      .tab-brand, .tab-emblem { display: grid; place-items: center; flex: none; color: var(--accent); background: #14243b; border: 1px solid var(--line); border-radius: 11px; }
      .tab-brand { width: 42px; height: 42px; }
      .tab-glyph { width: 16px; height: 16px; flex: none; fill: none; stroke: currentColor; stroke-width: 1.65; stroke-linecap: round; stroke-linejoin: round; }
      .tab-brand .tab-glyph { width: 23px; height: 23px; }
      .tab-tagline { margin: 0; color: #b7c9e4; font-size: 10px; font-weight: 700; letter-spacing: .105em; }
      h1 { margin: 1px 0 0; font-size: clamp(16px,2.15vw,21px); line-height: 1.2; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
      .tab-controls { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; }
      .tab-control { color: inherit; font: 650 13px/1.15 system-ui,"Segoe UI",sans-serif; min-height: 40px; padding: 6px 10px; display: inline-flex; align-items: center; justify-content: center; gap: 6px; border: 1px solid var(--line); border-radius: 9px; background: #14243b; cursor: pointer; text-decoration: none; white-space: nowrap; }
      .tab-control:hover { border-color: var(--accent); background: #1e324f; }
      .tab-control:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px; }
      .tab-original { color: var(--accent-ink); background: var(--accent); border-color: transparent; }
      .tab-original:hover { background: var(--accent); filter: brightness(1.12); }
      #tab-stage { position: relative; isolation: isolate; min-height: 0; overflow: hidden; border: 1px solid var(--line); border-radius: 10px; background: #050b15; }
      .player-frame { position: absolute; inset: 0; width: 100%; height: 100%; border: 0; background: #050b15; }
      .tab-state { position: absolute; inset: 0; display: grid; place-content: safe center; justify-items: center; gap: 10px; overflow: auto; text-align: center; padding: 14px; background: radial-gradient(ellipse at 50% 42%,#172c47,#081224 76%); }
      .tab-state strong { font-size: clamp(16px,3vw,22px); }
      .tab-state p { margin: 0; max-width: 42ch; color: #b7c9e4; }
      .tab-emblem { width: 52px; height: 52px; }
      .tab-emblem .tab-glyph { width: 28px; height: 28px; }
      .tab-footer { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 3px 12px; color: #bfcee4; font-size: 11px; }
      .tab-status, .tab-guard { display: inline-flex; align-items: center; gap: 6px; }
      .tab-status-dot { width: 6px; height: 6px; border-radius: 50%; flex: none; background: var(--accent); }
      .tab-guard .tab-glyph { width: 13px; height: 13px; }
      @media (max-width: 640px) {
        .tab-header { grid-template-columns: minmax(0,1fr); gap: 8px; }
        .tab-controls .tab-control { flex: 1 1 auto; padding-inline: 8px; min-height: 44px; }
        .tab-help { display: none; }
      }
      @media (max-width: 440px) {
        .tab-controls { display: grid; grid-template-columns: repeat(auto-fit,minmax(0,1fr)); gap: 5px; }
        .tab-controls .tab-control { font-size: 12px; padding-inline: 5px; white-space: normal; text-align: center; }
        .tab-control .tab-glyph { display: none; }
      }
      @media (max-height: 420px) and (min-width: 641px) {
        body { gap: 5px; padding-block: 5px; }
        .tab-help { display: none; }
        .tab-emblem { display: none; }
      }
    `;

    // Roda no contexto da nova aba, inclusive após fechar ou recarregar o hub.
    function setupDetachedGame({url,title,sandbox,ancestorOrigin}) {
      const find = id => document.getElementById(id);
      const root = document.documentElement;
      const stage = find('tab-stage'), state = find('tab-state'), status = find('tab-status');
      const reload = find('tab-reload'), full = find('tab-full'), original = find('tab-original');
      const report = reason => window.dispatchEvent(new CustomEvent('bl3ss:game-route',{detail:reason}));
      let frame = null, timer = 0, deadline = 0, probe = null, failed = false;
      function cancelChecks() {
        clearTimeout(timer); clearTimeout(deadline);
        probe?.abort(); probe = null;
      }
      function show(heading,copy,busy=false) {
        stage.setAttribute('aria-busy',String(busy));
        state.hidden = false;
        find('tab-state-title').textContent = heading;
        find('tab-state-message').textContent = copy;
      }
      function showUnavailable() {
        failed = true;
        clearTimeout(timer);
        status.textContent = 'Não foi possível carregar o jogo';
        show('O jogo não abriu aqui','Use Abrir original para continuar no site do jogo.');
      }
      function mount() {
        cancelChecks(); frame?.remove(); frame = null; failed = false;
        if (navigator.onLine === false) {
          status.textContent = 'Sem conexão';
          show('Sem internet','Conecte-se e use Recarregar para tentar de novo.');
          return;
        }
        status.textContent = 'Conectando…';
        show('Abrindo o jogo…','Conectando ao site de origem.',true);
        const element = createGameFrame(document,title,sandbox);
        frame = element;
        element.addEventListener('load',() => {
          if (frame !== element || failed) return;
          clearTimeout(timer);
          stage.setAttribute('aria-busy','false');
          state.hidden = true;
          // load sozinho não comprova que o jogo abriu entre origens.
          status.textContent = 'Player BL3SS · about:blank';
        },{once:true});
        element.addEventListener('error',() => { if (frame === element) showUnavailable(); },{once:true});
        element.src = url;
        stage.prepend(element);
        timer = setTimeout(() => {
          if (frame !== element) return;
          status.textContent = 'Aguardando o site de origem…';
          show('O jogo está demorando','Aguarde mais um pouco, recarregue ou abra o jogo no site original.');
        },13000);
        // Sem esta API, o iframe ainda carrega e a saída manual continua disponível.
        if (typeof window.AbortController !== 'function') return;
        const controller = new window.AbortController();
        probe = controller;
        const limit = setTimeout(() => controller.abort(),4000);
        deadline = limit;
        checkGameFrame(url,controller.signal,ancestorOrigin).then(reason => {
          if (!reason || frame !== element || controller.signal.aborted) return;
          report(reason);
          showUnavailable();
          // Falha comprovada: segue ao endereço original nesta mesma aba.
          original.click();
        }).finally(() => {
          clearTimeout(limit);
          if (probe === controller) probe = null;
        });
      }
      full.hidden = !root.requestFullscreen || !document.fullscreenEnabled;
      function fullLabel() {
        const active = document.fullscreenElement === root;
        const text = active ? 'Sair da tela cheia' : 'Tela cheia';
        full.querySelector('span').textContent = text;
        full.setAttribute('aria-pressed',String(active));
        full.title = text;
      }
      const fullscreenError = 'Tela cheia indisponível neste navegador.';
      let priorStatus = '';
      full.addEventListener('click',async () => {
        try {
          if (document.fullscreenElement === root) await document.exitFullscreen();
          else await root.requestFullscreen();
          if (status.textContent === fullscreenError) status.textContent = priorStatus;
        } catch {
          if (status.textContent !== fullscreenError) priorStatus = status.textContent;
          status.textContent = fullscreenError;
        }
      });
      document.addEventListener('fullscreenchange',fullLabel);
      document.addEventListener('securitypolicyviolation',event => {
        if (frame && (event.effectiveDirective === 'frame-src' || event.effectiveDirective === 'child-src')) showUnavailable();
      });
      original.addEventListener('click',event => {
        if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
        report('original'); cancelChecks();
      });
      reload.addEventListener('click',mount);
      window.addEventListener('pagehide',cancelChecks);
      fullLabel();
      mount();
      stage.dataset.ready = 'true';
    }

    function mountDetachedGame(tab,game,url) {
      const doc = tab.document;
      const root = doc.documentElement;
      root.lang = 'pt-BR';
      doc.title = `${game.title} · ${BRAND_NAME}`;
      const csp = $('meta[http-equiv="Content-Security-Policy"]');
      if (csp) doc.head.append(doc.importNode(csp,true));
      const meta = doc.createElement('meta');
      meta.name = 'viewport'; meta.content = 'width=device-width,initial-scale=1,viewport-fit=cover';
      const referrer = doc.createElement('meta');
      referrer.name = 'referrer'; referrer.content = 'no-referrer';
      doc.head.append(meta,referrer);
      const favicon = $('link[rel="icon"][type="image/png"]');
      if (favicon) { const link = doc.importNode(favicon,true); link.href = favicon.href; doc.head.append(link); }
      const theme = getComputedStyle(document.documentElement);
      for (const variable of ['--accent','--accent-ink','--theme-deep']) {
        const value = cleanHex(theme.getPropertyValue(variable).trim());
        if (value) root.style.setProperty(variable,value);
      }
      const style = doc.createElement('style'); style.textContent = detachedGameCSS;
      doc.head.append(style);
      doc.body.innerHTML = `<header class="tab-header">
        <div class="tab-identity"><span class="tab-brand" aria-hidden="true"></span><div><p class="tab-tagline">BL3SS / PLAYER EM OUTRA ABA</p><h1></h1></div></div>
        <div class="tab-controls" role="group" aria-label="Controles do jogo">
          <button class="tab-control" id="tab-reload" type="button" title="Recarregar jogo"><span>Recarregar</span></button>
          <button class="tab-control" id="tab-full" type="button" aria-pressed="false" hidden><span>Tela cheia</span></button>
          <a class="tab-control tab-original" id="tab-original" title="Abrir jogo no site de origem nesta aba"><span>Abrir original</span></a>
        </div>
      </header>
      <main id="tab-stage" aria-label="Área do jogo" aria-busy="true">
        <div id="tab-state" class="tab-state"><span class="tab-emblem" aria-hidden="true"></span><strong id="tab-state-title">Abrindo o jogo…</strong><p id="tab-state-message">Conectando ao site de origem.</p></div>
      </main>
      <footer class="tab-footer">
        <span class="tab-status" role="status"><span class="tab-status-dot" aria-hidden="true"></span><span id="tab-status">Conectando…</span></span>
        <span class="tab-help">Se a tela ficar vazia, use <strong>Abrir original</strong>.</span>
        <span class="tab-guard" title="O jogo incorporado não pode abrir pop-ups nem redirecionar esta aba."><span>Proteção ativa</span></span>
      </footer>`;
      const heading = doc.querySelector('h1');
      heading.textContent = game.title; heading.title = game.title;
      configureOriginalGameLink(doc.getElementById('tab-original'),url);
      for (const [selector,id] of [['.tab-brand','game'],['.tab-emblem','game'],['#tab-reload','reset'],['#tab-full','fullscreen'],['#tab-original','external'],['.tab-guard','shield']]) {
        doc.querySelector(selector).prepend(detachedIcon(doc,id));
      }
      const session = gameSessionEpoch;
      tab.addEventListener('bl3ss:game-route',({detail}) => {
        if (session === gameSessionEpoch && originalTabReasons.has(detail)) rememberGameTab(game,detail);
      },{once:true});
      const script = doc.createElement('script');
      const config = {url,title:game.title,sandbox:gameFrameSandbox(url),ancestorOrigin:location.origin};
      // Código próprio e dados serializados em texto, nunca vindos do iframe.
      script.textContent = `'use strict';\n${createGameFrame.toString()}\n${checkGameFrame.toString()}\n(${setupDetachedGame.toString()})(${JSON.stringify(config)});`;
      doc.body.append(script);
      if (doc.getElementById('tab-stage').dataset.ready !== 'true') throw new Error('Player indisponível');
      script.remove();
    }
    function openGameTab(game,url,{original = false} = {}) {
      const fallbackURL = catalogURL(game.fallback);
      let tab;
      try {
        // Chamada síncrona no clique: não abre aba extra durante o jogo no hub.
        tab = window.open('about:blank','_blank');
        if (!tab || tab.closed) return false;
        tab.opener = null;
        const target = fallbackURL || url;
        if (original || fallbackURL || gameUsesOriginalTab(game)) navigateGameTab(tab,target);
        else {
          mountDetachedGame(tab,game,url);
          rememberGameTab(game,'detached');
        }
        noteGameSource(game,target);
        return true;
      } catch {
        try { tab?.close(); } catch { /* Já pode ter sido fechada. */ }
        return false;
      }
    }

    async function checkGameFrame(url,signal,ancestorOrigin = location.origin,detectServerError = false) {
      // Só consulta o jogo escolhido, sem cookies e em paralelo com o player.
      // Sem CORS (ou sem cabeçalhos expostos), a incorporação fica indeterminada.
      try {
        const response = await fetch(url,{method:'HEAD',mode:'cors',credentials:'omit',referrerPolicy:'no-referrer',signal});
        if (response.status === 404 || response.status === 410) return 'missing';
        const crossOrigin = new URL(response.url || url).origin !== ancestorOrigin;
        const csp = response.headers.get('Content-Security-Policy') || '';
        const ancestors = [...csp.matchAll(/(?:^|[;,])\s*frame-ancestors\s+([^;,]+)/gi)].map(([,value]) => value.trim().toLowerCase());
        if (ancestors.includes("'none'") || (crossOrigin && ancestors.includes("'self'"))) return 'blocked';
        if (!ancestors.length) {
          const rule = response.headers.get('X-Frame-Options')?.trim().toUpperCase();
          if (rule === 'DENY' || (crossOrigin && rule === 'SAMEORIGIN')) return 'blocked';
        }
        // 501 pode significar apenas que o servidor não implementa HEAD.
        if (detectServerError && response.status >= 500 && response.status !== 501) return 'error';
      } catch { /* Uma falha no HEAD não prova uma falha no iframe. */ }
      return '';
    }

    function openGame(game) {
      const url = catalogURL(game.destination);
      if (!url) { toast('Este jogo não tem um endereço válido.', 'game'); return; }
      if (inIsolatedViewer()) {
        toast('Use a prévia do site ou abra o HTML no navegador para carregar jogos externos.', 'external');
        return;
      }
      const fallbackURL = catalogURL(game.fallback);
      const customURL = catalogURL(game.customFrame);
      const tabURL = fallbackURL || url;
      const fallbackLabel = game.fallbackLabel || 'versão alternativa';
      const tabLabel = fallbackURL ? `Abrir ${fallbackLabel}` : 'Abrir em outra aba';
      const tabHint = fallbackURL ? `${tabLabel} em outra aba` : 'Jogos compatíveis abrem em about:blank';
      const hereLabel = fallbackURL ? `${tabLabel} nesta aba` : 'Abrir original nesta aba';
      if (gameOpensInTab(game)) {
        if (openGameTab(game,url)) return;
        openDialog(game.title,'ABRIR JOGO',`
          <p class="modal-message" data-tab-note role="status">O navegador não abriu a nova aba. Tente novamente ou abra o site do jogo nesta aba.</p>
          <div class="dialog-actions">
            <a class="btn btn-secondary" data-game-original>${icon('external')} ${escapeHTML(hereLabel)}</a>
            <button class="btn btn-primary" type="button" data-game-tab>${icon('external')} ${escapeHTML(tabLabel)}</button>
          </div>`, false, root => {
          const button = $('[data-game-tab]',root);
          const originalLink = $('[data-game-original]',root);
          configureOriginalGameLink(originalLink,tabURL);
          originalLink.addEventListener('click',() => noteGameSource(game,tabURL));
          button.focus();
          button.addEventListener('click',() => {
            if (openGameTab(game,url)) closeDialog();
            else $('[data-tab-note]',root).textContent = `Permita novas abas para o ${BRAND_NAME} ou use o link original.`;
          });
        });
        return;
      }
      const playerName = game.sourceLabel ? `Player ${BRAND_NAME} · ${game.sourceLabel}` : `Player ${BRAND_NAME}`;
      openDialog(game.title,playerName.toUpperCase(),`
        <div class="player-stage" aria-busy="true">
          <div class="player-state" data-player-state data-loading>
            <span class="player-state-mark">${icon('game')}</span><strong>Abrindo o jogo…</strong>
            <p>Aguarde o carregamento do conteúdo.</p>
            <div class="player-state-actions">
              <button type="button" class="btn btn-primary" data-player-tab ${fallbackURL ? `aria-label="${escapeHTML(tabHint)}" ` : ''}hidden>${icon('external')} ${escapeHTML(tabLabel)}</button>
              <button type="button" class="btn btn-secondary" data-player-retry hidden>${icon('reset')} Recarregar</button>
            </div>
          </div>
        </div>
        <div class="player-footer">
          <span class="player-status" role="status"><span class="live-dot"></span><span data-player-status>Conectando ao jogo…</span></span>
          <span class="player-guard" title="Jogos incorporados não podem abrir novas abas ou redirecionar o BL3SS.">${icon('shield')} Proteção ativa</span>
          ${customURL ? `<button class="btn btn-secondary player-custom" type="button" data-player-custom title="Abrir a versão Custom fnaf neste player">${icon('play')}<span>Skip loading (Custom fnaf)</span></button>` : ''}
          <button type="button" class="text-btn player-tab" data-player-tab title="${escapeHTML(tabHint)}"${fallbackURL ? ` aria-label="${escapeHTML(tabHint)}"` : ''}>${icon('external')} ${escapeHTML(tabLabel)}</button>
          <p class="player-tab-note" data-tab-note hidden><span data-tab-message role="status"></span> <a data-game-original>${escapeHTML(hereLabel)}</a></p>
        </div>`, true, root => {
        const dialog = $('#modal');
        dialog.classList.add('dialog-player');
        const stage = $('.player-stage',root);
        const state = $('[data-player-state]',root);
        const title = $('strong',state);
        const message = $('p',state);
        const retry = $('[data-player-retry]',state);
        const status = $('[data-player-status]',root);
        const stateTab = $('[data-player-tab]',state);
        const footerTab = $('.player-footer [data-player-tab]',root);
        const tabNote = $('[data-tab-note]',root);
        const tabMessage = $('[data-tab-message]',tabNote);
        const originalHere = $('[data-game-original]',tabNote);
        const customButton = $('[data-player-custom]',root);
        let customActive = false, sourceFailed = false;
        const selectedURL = () => customActive ? customURL : url;
        configureOriginalGameLink(originalHere,tabURL);
        originalHere.addEventListener('click',() => noteGameSource(game,fallbackURL || selectedURL()));
        const toolbar = document.createElement('div');
        toolbar.className = 'player-toolbar';
        toolbar.innerHTML = `<button type="button" class="btn btn-secondary" data-player-reload aria-label="Recarregar jogo" title="Recarregar jogo">${icon('reset')}<span>Recarregar</span></button><button type="button" class="btn btn-secondary" data-player-full aria-label="Tela cheia" title="Tela cheia">${icon('fullscreen')}<span>Tela cheia</span></button>`;
        $('#close-modal').before(toolbar);
        const full = $('[data-player-full]',toolbar);
        let frame = null, timeout = 0, probe = null;
        let active = true;
        function showState(heading,copy,{loading = false, canRetry = false, canOpenTab = false} = {}) {
          stage.setAttribute('aria-busy',String(loading));
          state.hidden = false;
          state.toggleAttribute('data-loading',loading);
          title.textContent = heading;
          message.textContent = copy;
          retry.hidden = !canRetry;
          stateTab.hidden = !canOpenTab;
          footerTab.hidden = canOpenTab;
        }
        function discardFrame() {
          clearTimeout(timeout);
          probe?.abort(); probe = null;
          const previous = frame; frame = null; previous?.remove();
        }
        function offlineState() {
          status.textContent = 'Sem conexão';
          showState('Sem internet','Conecte-se à internet e tente carregar o jogo de novo.',{canRetry:true});
        }
        function showTabNote(copy) {
          tabNote.hidden = false;
          tabMessage.textContent = copy;
        }
        function leavePlayer() {
          if (!openGameTab(game,selectedURL(),{original:!!customURL && sourceFailed})) {
            showTabNote('O navegador não abriu a nova aba. Permita pop-ups ou use o link direto:');
            return false;
          }
          closeDialog();
          return true;
        }
        function frameFailed(reason) {
          const hadPlayerFocus = toolbar.contains(document.activeElement) || footerTab === document.activeElement || frame === document.activeElement;
          discardFrame();
          if (!navigator.onLine) { offlineState(); return; }
          const confirmed = originalTabReasons.has(reason);
          if (customButton) {
            sourceFailed = true;
            status.textContent = 'Não foi possível carregar esta versão';
            const copy = customActive ? 'Você pode voltar ao jogo original, recarregar ou abrir a versão Custom no site de origem.' : 'Use Skip loading (Custom fnaf) para tentar a outra versão sem sair do player.';
            showState(customActive ? 'Custom fnaf não abriu' : 'O jogo original não abriu',copy,{canRetry:true,canOpenTab:true});
            if (hadPlayerFocus) customButton.focus({preventScroll:true});
            return;
          }
          if (fallbackURL) {
            // A reserva não substitui a preferência pelo iframe no próximo clique.
            if (leavePlayer()) return;
            status.textContent = `${fallbackLabel} disponível em outra aba`;
            showState(`${game.sourceLabel || 'O jogo'} não abriu no player`,
              `Abra ${fallbackLabel} em outra aba ou tente carregar o player novamente.`,
              {canRetry:true,canOpenTab:true});
            if (hadPlayerFocus) stateTab.focus({preventScroll:true});
            return;
          }
          if (confirmed) {
            rememberGameTab(game,reason);
            if (leavePlayer()) return;
            toolbar.hidden = true;
            status.textContent = 'Abra o jogo na origem';
          } else {
            showTabNote('Se o problema continuar, use o link direto:');
            status.textContent = 'Não foi possível carregar o jogo';
          }
          const copy = reason === 'missing' ? 'O endereço não respondeu com um jogo. Você pode conferir o link original.' : confirmed ? 'Este site não permite abertura no player. Use a página original do jogo.' : 'Tente recarregar o jogo ou abrir em outra aba.';
          showState('O jogo não abriu no player',copy,{canRetry:!confirmed,canOpenTab:true});
          if (hadPlayerFocus) stateTab.focus({preventScroll:true});
        }
        function framePolicyBlocked(event) {
          // Detecta quando a política do próprio BL3SS não permite o destino
          // do frame (por exemplo, se a origem redirecionar para outro domínio).
          if (active && frame && dialog.open && event.disposition === 'enforce'
              && (event.effectiveDirective === 'frame-src' || event.effectiveDirective === 'child-src')) frameFailed('blocked');
        }
        function mountFrame() {
          discardFrame();
          sourceFailed = false;
          tabNote.hidden = true;
          const frameURL = selectedURL();
          const currentPlayer = customActive ? `Player ${BRAND_NAME} · Custom FNAF` : playerName;
          configureOriginalGameLink(originalHere,fallbackURL || frameURL);
          if (!navigator.onLine) { offlineState(); return; }
          status.textContent = 'Conectando ao jogo…';
          showState(customActive ? 'Abrindo Custom fnaf…' : 'Abrindo o jogo…','Aguarde o carregamento do conteúdo.',{loading:true});
          const element = createGameFrame(document,game.title,gameFrameSandbox(frameURL));
          element.addEventListener('load',() => {
            if (frame !== element) return;
            clearTimeout(timeout);
            stage.setAttribute('aria-busy','false');
            const hadStateFocus = state.contains(document.activeElement);
            state.hidden = true;
            footerTab.hidden = false;
            if (hadStateFocus) footerTab.focus({preventScroll:true});
            // O evento load sozinho não confirma que o jogo abriu entre origens.
            status.textContent = currentPlayer;
          },{once:true});
          element.addEventListener('error',() => { if (dialog.open && frame === element) frameFailed('error'); },{once:true});
          frame = element;
          element.src = frameURL; // só atribuído em resposta à seleção do jogador
          stage.prepend(element);
          noteGameSource(game,frameURL);
          timeout = setTimeout(() => {
            if (frame !== element) return;
            status.textContent = 'Aguardando o site de origem…';
            const hadFooterFocus = footerTab === document.activeElement;
            const waitCopy = fallbackURL ? `Você pode aguardar, tentar de novo ou abrir ${fallbackLabel} em outra aba.` : customButton && !customActive ? 'Você pode aguardar ou experimentar Skip loading (Custom fnaf).' : 'Você pode aguardar mais um pouco ou abrir o jogo em outra aba.';
            showState('O jogo está demorando para abrir',waitCopy,{canRetry:true,canOpenTab:true});
            if (hadFooterFocus) stateTab.focus({preventScroll:true});
          },13000);
          // A consulta ao link é opcional; não impede abrir o player.
          if (typeof window.AbortController !== 'function') return;
          const request = new window.AbortController();
          probe = request;
          const deadline = setTimeout(() => request.abort(),4000);
          checkGameFrame(frameURL,request.signal,location.origin,!!(fallbackURL || customURL)).then(reason => {
            if (reason && dialog.open && frame === element && !request.signal.aborted) frameFailed(reason);
          }).finally(() => {
            clearTimeout(deadline);
            if (probe === request) probe = null;
          });
        }
        function fullLabel() {
          const expanded = document.fullscreenElement === dialog || dialog.classList.contains('player-expanded');
          const label = expanded ? 'Sair da tela cheia' : 'Tela cheia';
          $('span',full).textContent = label;
          full.title = label;
          full.setAttribute('aria-label',label);
          full.setAttribute('aria-pressed',String(expanded));
        }
        full.addEventListener('click',async () => {
          if (document.fullscreenElement === dialog) { await document.exitFullscreen?.()?.catch(() => {}); }
          else if (dialog.classList.contains('player-expanded')) dialog.classList.remove('player-expanded');
          else {
            try {
              if (!dialog.requestFullscreen || !document.fullscreenEnabled) throw new Error('Fullscreen indisponível');
              await dialog.requestFullscreen();
            } catch { if (active) dialog.classList.add('player-expanded'); }
          }
          if (active) fullLabel();
        });
        fullLabel();
        document.addEventListener('fullscreenchange',fullLabel);
        $('[data-player-reload]',toolbar).addEventListener('click',mountFrame);
        retry.addEventListener('click',mountFrame);
        stateTab.addEventListener('click',leavePlayer);
        footerTab.addEventListener('click',leavePlayer);
        customButton?.addEventListener('click',() => {
          customActive = !customActive;
          customButton.classList.toggle('player-custom-active',customActive);
          customButton.title = customActive ? 'Voltar ao link original do jogo' : 'Abrir a versão Custom fnaf neste player';
          customButton.innerHTML = customActive ? `${icon('reset')}<span>Voltar ao original</span>` : `${icon('play')}<span>Skip loading (Custom fnaf)</span>`;
          $('#modal-label').textContent = customActive ? `PLAYER ${BRAND_NAME} · CUSTOM FNAF` : playerName.toUpperCase();
          mountFrame();
        });
        if (fallbackURL || customURL) document.addEventListener('securitypolicyviolation',framePolicyBlocked);
        mountFrame();
        return () => {
          active = false;
          discardFrame();
          document.removeEventListener('fullscreenchange',fullLabel);
          if (fallbackURL || customURL) document.removeEventListener('securitypolicyviolation',framePolicyBlocked);
          if (document.fullscreenElement === dialog) document.exitFullscreen?.()?.catch(() => {});
          toolbar.remove(); dialog.classList.remove('dialog-player','player-expanded');
        };
      });
    }
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded',init,{once:true});
    else init();
  
