// AUTOMAÇÕES

async function carregarAutomacoes() {
  if (!sbClient) { renderizarAutomacoes(listaAutomacoes); return; }
  await swr('automacoes',
    () => sbClient.from('automacoes').select('*').order('id_automacao', { ascending: true }),
    d => { listaAutomacoes = d; renderizarAutomacoesFiltradas(); });
}

function renderizarAutomacoesFiltradas() {
  const filtro = (abaAtual === 'automacoes') ? buscaAtual : '';
  const filtrados = !filtro
    ? listaAutomacoes
    : listaAutomacoes.filter(a => {
        const nome = (a.nome_automacao || '').toLowerCase();
        const desc = (a.desc_automacao || '').toLowerCase();
        return nome.includes(filtro) || desc.includes(filtro);
      });

  renderizarAutomacoes(filtrados);
}

function renderizarAutomacoes(automacoes) {
  const container = document.getElementById('listaAutomacoes');
  if (!container) return;
  container.innerHTML = '';

  if (automacoes.length === 0) {
    container.innerHTML = '<p class="empty-msg">Nenhuma automação encontrada.</p>';
    return;
  }

  automacoes.forEach(a => {
    const ativada = a['esta_ativo'] ?? false;
    const nome = a.nome_automacao || 'Sem nome';
    const descricao = a.desc_automacao || 'Sem descrição cadastrada.';
    const dataCriacao = a.criado_em ? formatarDataHora(a.criado_em) : '—';
    const ultimaExecucao = a.ultima_atualizacao ? formatarDataHora(a.ultima_atualizacao) : 'Nunca executada';

    const card = document.createElement('div');
    card.className = `automacao-card ${ativada ? 'status-ativa' : 'status-desativada'}`;

    card.innerHTML = `
      <div class="automacao-card-header">
        <div class="automacao-title-area">
          <h3>${nome}</h3>
          <span class="status-badge ${ativada ? 'badge-ativa' : 'badge-desativada'}">
            ${ativada ? '● Ativada' : '○ Desativada'}
          </span>
        </div>
        <button class="btn-toggle-status ${ativada ? 'btn-desativar' : 'btn-ativar'}" onclick="alternarStatusAutomacao(${a.id_automacao}, ${!ativada})">
          ${ativada ? 'Desativar' : 'Ativar'}
        </button>
      </div>

      <p class="automacao-descricao">${descricao}</p>

      <div class="automacao-footer">
        <div class="meta-item">
          <span>Criada em:</span>
          <strong>${dataCriacao}</strong>
        </div>

        <div class="meta-item">
          <span>Última ativação:</span>
          <strong>${ultimaExecucao}</strong>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

async function alternarStatusAutomacao(id, novoStatus) {
  if (!sbClient) {
    const item = listaAutomacoes.find(a => a.id_automacao === id);
    if (item) item['esta_ativo'] = novoStatus;
    renderizarAutomacoesFiltradas();
    return;
  }

  try {
    const { error } = await sbClient
      .from('automacoes')
      .update({ 'esta_ativo': novoStatus })
      .eq('id_automacao', id);

    if (error) {
      console.error('Erro ao atualizar status da automação:', error.message);
      alert('Não foi possível alterar o status da automação.');
      return;
    }

    Cache.limpar('automacoes');
    carregarAutomacoes();
  } catch (err) {
    console.error('Falha de conexão ao atualizar status:', err);
  }
}
