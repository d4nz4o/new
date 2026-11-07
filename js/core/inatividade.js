// DESLIGUE AUTOMÁTICO POR INATIVIDADE
// Encerra a sessão depois de INATIVIDADE_MS sem uso. Avisa AVISO_MS antes.
// A última atividade fica no localStorage, então todas as abas (e o retorno após o
// computador dormir) usam o mesmo relógio: usar uma aba mantém as outras conectadas.

(() => {
  const INATIVIDADE_MS = 1 * 1 * 30 * 1000;   // tempo sem uso até desconectar (2 horas)
  const AVISO_MS = 60 * 1000;                  // aviso antes de desconectar (60 segundos)
  const CHAVE = 'trilha_atividade';
  const GRAVA_A_CADA_MS = 5000;                // evita gravar a cada movimento do mouse

  let ultimaMemoria = Date.now();              // reserva se o localStorage estiver indisponível
  let ultimaGravacao = 0;
  let encerrando = false;
  let aviso = null;

  /* ---------- Última atividade (compartilhada entre abas) ---------- */
  function lerAtividade() {
    try {
      const v = Number(localStorage.getItem(CHAVE));
      if (Number.isFinite(v) && v > 0) return v;
    } catch {}
    return null;
  }

  function gravarAtividade(t) {
    ultimaMemoria = t;
    try { localStorage.setItem(CHAVE, String(t)); } catch {}
  }

  function registrarAtividade() {
    if (aviso || encerrando) return;           // com o aviso aberto, só o botão "Continuar" vale
    const agora = Date.now();
    if (agora - ultimaGravacao < GRAVA_A_CADA_MS) return;
    ultimaGravacao = agora;
    gravarAtividade(agora);
  }

  /* ---------- Aviso ---------- */
  function criarAviso() {
    const estilo = document.createElement('style');
    estilo.textContent = `
      .inat-fundo { position: fixed; inset: 0; z-index: 99999; display: grid; place-items: center; padding: 16px;
        background: rgba(8, 23, 43, .55); backdrop-filter: blur(3px); animation: inat-in .25s ease; }
      .inat-caixa { width: 100%; max-width: 400px; padding: 26px 24px 22px; border-radius: 16px; background: #fff;
        color: #15385e; text-align: center; font-family: inherit; box-shadow: 0 24px 48px -12px rgba(2, 10, 24, .5); }
      .inat-caixa h2 { margin: 0 0 8px; font-size: 1.15rem; }
      .inat-caixa p { margin: 0; color: #46607c; font-size: .95rem; line-height: 1.45; }
      .inat-tempo { margin: 14px 0 18px; font-size: 2.2rem; font-weight: 700; font-variant-numeric: tabular-nums; color: #2573c0; }
      .inat-botoes { display: flex; gap: 10px; }
      .inat-botoes button { flex: 1; padding: 11px 12px; border-radius: 10px; font: inherit; font-weight: 600; cursor: pointer; }
      .inat-continuar { border: 0; background: #2573c0; color: #fff; }
      .inat-continuar:hover { background: #1b5a9a; }
      .inat-sair { border: 1px solid #cbd5e1; background: #fff; color: #1e293b; }
      .inat-sair:hover { background: #f1f5f9; }
      @keyframes inat-in { from { opacity: 0; } }
      @media (prefers-reduced-motion: reduce) { .inat-fundo { animation: none; } }
    `;
    const fundo = document.createElement('div');
    fundo.className = 'inat-fundo';
    fundo.setAttribute('role', 'alertdialog');
    fundo.setAttribute('aria-modal', 'true');
    fundo.setAttribute('aria-labelledby', 'inat-titulo');
    fundo.innerHTML = `
      <div class="inat-caixa">
        <h2 id="inat-titulo">Você ainda está aí?</h2>
        <p>Por segurança, sua sessão será encerrada por inatividade em:</p>
        <div class="inat-tempo" aria-live="polite"></div>
        <div class="inat-botoes">
          <button type="button" class="inat-sair">Sair agora</button>
          <button type="button" class="inat-continuar">Continuar conectado</button>
        </div>
      </div>`;
    fundo.querySelector('.inat-continuar').addEventListener('click', continuarConectado);
    fundo.querySelector('.inat-sair').addEventListener('click', () => encerrar(''));
    return { estilo, fundo, tempo: fundo.querySelector('.inat-tempo') };
  }

  function mostrarAviso(restanteMs) {
    if (!aviso) {
      aviso = criarAviso();
      document.head.appendChild(aviso.estilo);
      document.body.appendChild(aviso.fundo);
      aviso.fundo.querySelector('.inat-continuar').focus();
    }
    aviso.tempo.textContent = Math.max(0, Math.ceil(restanteMs / 1000)) + ' s';
  }

  function esconderAviso() {
    if (!aviso) return;
    aviso.fundo.remove();
    aviso.estilo.remove();
    aviso = null;
  }

  function continuarConectado() {
    esconderAviso();
    ultimaGravacao = Date.now();
    gravarAtividade(ultimaGravacao);
  }

  /* ---------- Encerramento ---------- */
  async function encerrar(motivo) {
    if (encerrando) return;
    encerrando = true;
    try { localStorage.removeItem(CHAVE); } catch {}
    try {
      // scope "local": encerra só este navegador, sem derrubar o usuário em outros aparelhos
      if (typeof sbClient !== 'undefined' && sbClient) await sbClient.auth.signOut({ scope: 'local' });
    } catch (err) {
      console.error('Erro ao encerrar a sessão:', err);
    }
    if (typeof Cache !== 'undefined') Cache.limparTudo();
    window.location.href = motivo ? 'index.html?erro=' + motivo : 'index.html';
  }

  /* ---------- Verificação ---------- */
  function verificar() {
    if (encerrando) return;
    const ultima = lerAtividade() ?? ultimaMemoria;
    const restante = INATIVIDADE_MS - (Date.now() - ultima);
    if (restante <= 0) encerrar('inatividade');
    else if (restante <= AVISO_MS) mostrarAviso(restante);
    else esconderAviso();                      // outra aba registrou atividade
  }

  function iniciar() {
    // Se a última atividade for muito antiga (ex.: computador ficou desligado), desconecta já
    if (lerAtividade() === null) gravarAtividade(Date.now());
    verificar();

    ['pointerdown', 'keydown', 'scroll', 'touchstart', 'mousemove', 'wheel']
      .forEach(ev => window.addEventListener(ev, registrarAtividade, { passive: true, capture: true }));

    setInterval(verificar, 1000);
    // Temporizadores pausam em segundo plano: ao voltar, confere na hora
    document.addEventListener('visibilitychange', () => { if (!document.hidden) verificar(); });
    window.addEventListener('pageshow', verificar);
    window.addEventListener('storage', (e) => { if (e.key === CHAVE) verificar(); });

    // Se o usuário sair em outra aba, esta também volta para o login
    if (typeof sbClient !== 'undefined' && sbClient) {
      sbClient.auth.onAuthStateChange((evento) => {
        if (evento === 'SIGNED_OUT' && !encerrando) {
          encerrando = true;
          window.location.href = 'index.html';
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', async () => {
    if (typeof sbClient === 'undefined' || !sbClient) return;
    const { data: { session } } = await sbClient.auth.getSession();
    if (session) iniciar();                    // sem sessão, o main.js já manda para o login
  });
})();
