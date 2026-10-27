// TOPBAR COMPARTILHADA + NAVEGAÇÃO RÁPIDA ENTRE PÁGINAS
// Para criar uma nova aba: adicione uma linha em PAGINAS e crie a página.

const PAGINAS = [
  { id: 'kanban',     rotulo: 'Tarefas',    url: 'tarefas.html',    acao: '+ Tarefa',
    recursos: ['css/kanban.css', 'css/modal-tarefa.css', 'js/modules/kanban.js', 'js/modules/kanban-dnd.js', 'js/modules/tarefa-modal.js', 'js/modules/tarefa-interacoes.js', 'js/modules/tarefa-tags.js'] },
  { id: 'equipe',     rotulo: 'Equipe',     url: 'equipe.html',     acao: '+ Membro',
    recursos: ['css/equipe.css', 'js/modules/equipe.js'] },
  { id: 'ferias',     rotulo: 'Férias',     url: 'ferias.html',     acao: '+ Férias',
    recursos: ['css/ferias.css', 'js/modules/ferias.js'] },
  { id: 'automacoes', rotulo: 'Automações', url: 'automacoes.html', acao: '+ Robô',
    recursos: ['css/automacoes.css', 'js/modules/automacoes.js'] },
];

function renderizarTopbar() {
  const el = document.getElementById('topbar');
  if (!el) return;
  const atual = PAGINAS.find(p => p.id === ABA_ATUAL_ID) || PAGINAS[0];

  el.innerHTML = `
    <div class="brand-area">
      <a href="hub.html"><img src="assets/images/logo.png" alt="Trilha Participações" class="brand-logo" width="119" height="48"></a>
    </div>
    <div class="nav-group">
      <nav class="nav-buttons">
        ${PAGINAS.map(p => `<a class="btn-nav${p.id === atual.id ? ' active' : ''}" href="${p.url}"${p.id === atual.id ? ' aria-current="page"' : ''}>${p.rotulo}</a>`).join('')}
      </nav>
    </div>
    <div class="header-action-area">
      <button id="btn-acao-contextual" class="btn-action-highlight" onclick="executarAcaoAba()">${atual.acao}</button>
    </div>
    <div class="header-search-area" id="headerSearchArea" style="display:flex;">
      <input type="search" id="campoBusca" class="search-input" placeholder="Buscar…" oninput="filtrarBusca(this.value)">
    </div>
    <div class="user-profile-container" id="userProfileContainer">
      <div class="user-profile-avatar" id="userProfileAvatar" onclick="alternarMenuUsuario(event)"><span id="userAvatarText">?</span></div>
      <div class="user-dropdown-menu" id="userDropdownMenu">
        <div class="dropdown-header">
          <strong id="dropdownUserName">Usuário</strong>
          <span id="dropdownUserEmail">email@triviatrens.com.br</span>
        </div>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item btn-logout" onclick="fazerLogout()">Desconectar</button>
      </div>
    </div>`;
}

function executarAcaoAba() {
  if (abaAtual === 'kanban') alert('Ação contextual de tarefa.');
  else if (abaAtual === 'ferias') alert('Em breve: registro de férias.');
  else if (abaAtual === 'equipe') alert('Em breve: cadastro de novos membros da equipe.');
  else if (abaAtual === 'automacoes') alert('Em breve: cadastro de novas automações.');
}

// Pré-carrega as outras abas para a troca ser quase instantânea
function prepararNavegacao() {
  const outras = PAGINAS.filter(p => p.id !== ABA_ATUAL_ID);

  // Chrome/Edge: pré-renderiza a página ao passar o mouse sobre a aba
  if (window.HTMLScriptElement && HTMLScriptElement.supports && HTMLScriptElement.supports('speculationrules')) {
    const s = document.createElement('script');
    s.type = 'speculationrules';
    s.textContent = JSON.stringify({ prerender: [{ urls: outras.map(p => p.url), eagerness: 'moderate' }] });
    document.head.appendChild(s);
  }

  // Todos os navegadores: baixa em segundo plano o CSS/JS das outras abas (e o HTML, se não houver prerender)
  const baixar = () => {
    const prerender = document.querySelector('script[type="speculationrules"]');
    outras.forEach(p => {
      const urls = prerender ? p.recursos : [p.url, ...p.recursos];
      urls.forEach(u => { const l = document.createElement('link'); l.rel = 'prefetch'; l.href = u; document.head.appendChild(l); });
    });
  };
  (window.requestIdleCallback || (f => setTimeout(f, 800)))(baixar);

  // Antes de trocar de aba, grava o que ainda estiver pendente (ex.: card arrastado)
  document.addEventListener('click', async e => {
    const a = e.target.closest('a.btn-nav');
    if (!a || a.classList.contains('active') || typeof flushPendentes !== 'function') return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    if (Object.keys(pendentesSupabase).length === 0) return;
    e.preventDefault();
    await flushPendentes();
    window.location.href = a.href;
  });
}

renderizarTopbar();
prepararNavegacao();
