// LÓGICA DO MODAL DE DETALHES DA TAREFA

let tarefaModalAtual = null;

async function abrirModalDetalhesCard(idTarefa) {
  if (!sbClient) return;

  try {
    const { data: tarefa, error } = await sbClient
      .from('tarefas')
      .select(`
        *,renderizarTarefas
        tarefas_colaboradores (
          id_colab,
          colaboradores (nome_colab, id_colab)
        ),
        subtarefas (*)
      `)
      .eq('id_tarefa', idTarefa)
      .single();

    if (error || !tarefa) {
      console.error('Erro ao buscar detalhes da tarefa:', error);
      return;
    }

    tarefaModalAtual = tarefa;

    const modal = document.getElementById('modalCardDetalhes');
    if (!modal) return;
    modal.classList.add('active');

    document.getElementById('modalCardTitulo').innerText = tarefa.titulo_tarefa || 'Sem título';
    document.getElementById('modalCardDescricao').value = tarefa.descricao_tarefa || '';
    document.getElementById('modalCardPrioridade').value = tarefa.prioridade_tarefa || 'Média';
    
    if (tarefa.prazo_fim) {
      document.getElementById('modalCardPrazoFim').value = tarefa.prazo_fim.split('T')[0];
    } else {
      document.getElementById('modalCardPrazoFim').value = '';
    }

    const colEncontrada = listaColunas.find(c => c.id_coluna == tarefa.id_coluna);
    const badge = document.getElementById('modalCardColunaBadge');
    if (badge) {
      badge.innerText = colEncontrada ? colEncontrada.titulo_coluna : 'Sem Status';
      if (colEncontrada && colEncontrada.cor_coluna) {
        badge.style.backgroundColor = colEncontrada.cor_coluna;
        badge.style.color = '#1e293b';
      }
    }

    renderizarModalResponsaveis();
    renderizarModalSubtarefas();
    renderizarModalTags();
    await carregarModalAnexos();
    await carregarModalComentarios();

  } catch (err) {
    console.error('Erro ao abrir modal:', err);
  }
}

function fecharModalDetalhes(event) {
  if (event && event.target !== event.currentTarget) return;
  const modal = document.getElementById('modalCardDetalhes');
  if (modal) modal.classList.remove('active');
  tarefaModalAtual = null;
  renderizarTarefas(true);
}

function renderizarModalResponsaveis() {
  const container = document.getElementById('modalResponsaveisAvatares');
  if (!container || !tarefaModalAtual) return;

  container.innerHTML = '';
  const vinculos = tarefaModalAtual.tarefas_colaboradores || [];

  if (vinculos.length === 0) {
    container.innerHTML = '<span style="font-size: 0.8rem; color: var(--text-muted);">Sem responsável</span>';
    return;
  }

  vinculos.forEach(v => {
    const colab = v.colaboradores;
    if (!colab) return;
    const inc = (colab.nome_colab || '?').split(' ').filter(Boolean).slice(0, 2).map(p => p[0].toUpperCase()).join('');

    const chip = document.createElement('div');
    chip.style.display = 'inline-flex';
    chip.style.alignItems = 'center';
    chip.style.gap = '6px';
    chip.style.background = 'var(--bg-subtle)';
    chip.style.padding = '4px 8px';
    chip.style.borderRadius = '12px';
    chip.style.fontSize = '0.8rem';

    chip.innerHTML = `
      <div class="avatar" style="background:${corDoAvatar(colab.id_colab)}; width:22px; height:22px; font-size:0.65rem;">${inc}</div>
      <span>${colab.nome_colab}</span>
    `;
    container.appendChild(chip);
  });
}

function renderizarModalSubtarefas() {
  const container = document.getElementById('modalSubtarefasLista');
  if (!container || !tarefaModalAtual) return;

  container.innerHTML = '';
  const subs = tarefaModalAtual.subtarefas || [];

  if (subs.length === 0) {
    document.getElementById('modalChecklistProgressBar').style.width = '0%';
    document.getElementById('modalChecklistProgressoTexto').innerText = '0%';
  } else {
    const concluidas = subs.filter(s => s.concluido).length;
    const porc = Math.round((concluidas / subs.length) * 100);
    document.getElementById('modalChecklistProgressBar').style.width = `${porc}%`;
    document.getElementById('modalChecklistProgressoTexto').innerText = `${porc}%`;
  }

  subs.forEach(s => {
    const item = document.createElement('div');
    item.className = `subtask-item ${s.concluido ? 'concluida' : ''}`;
    item.innerHTML = `
      <input type="checkbox" ${s.concluido ? 'checked' : ''} onchange="alternarSubtarefaModal(${s.id_subtarefas}, this.checked)">
      <span>${s.titulo_subtarefa}</span>
      <button type="button" class="btn-del-sub" onclick="excluirSubtarefaModal(${s.id_subtarefas})">&times;</button>
    `;
    container.appendChild(item);
  });
}

function handleKeySubtarefa(e) {
  if (e.key === 'Enter') {
    e.preventDefault();
    adicionarSubtarefaModal();
  }
}

async function adicionarSubtarefaModal() {
  const input = document.getElementById('inputNovaSubtarefa');
  const titulo = input.value.trim();
  if (!titulo || !tarefaModalAtual) return;

  if (sbClient) {
    const { data, error } = await sbClient
      .from('subtarefas')
      .insert([{ id_tarefa: tarefaModalAtual.id_tarefa, titulo_subtarefa: titulo, concluido: false }])
      .select()
      .single();

    if (!error && data) {
      if (!tarefaModalAtual.subtarefas) tarefaModalAtual.subtarefas = [];
      tarefaModalAtual.subtarefas.push(data);
      input.value = '';
      renderizarModalSubtarefas();
    }
  }
}

async function alternarSubtarefaModal(idSub, novoStatus) {
  if (sbClient) {
    await sbClient
      .from('subtarefas')
      .update({ concluido: novoStatus })
      .eq('id_subtarefas', idSub);

    const sub = (tarefaModalAtual.subtarefas || []).find(s => s.id_subtarefas === idSub);
    if (sub) sub.concluido = novoStatus;
    renderizarModalSubtarefas();
  }
}

async function excluirSubtarefaModal(idSub) {
  if (sbClient) {
    await sbClient.from('subtarefas').delete().eq('id_subtarefas', idSub);
    tarefaModalAtual.subtarefas = (tarefaModalAtual.subtarefas || []).filter(s => s.id_subtarefas !== idSub);
    renderizarModalSubtarefas();
  }
}

async function salvarTituloCardModal() {
  const novoTitulo = document.getElementById('modalCardTitulo').innerText.trim();
  if (novoTitulo && tarefaModalAtual && novoTitulo !== tarefaModalAtual.titulo_tarefa) {
    tarefaModalAtual.titulo_tarefa = novoTitulo;
    await sbClient.from('tarefas').update({ titulo_tarefa: novoTitulo }).eq('id_tarefa', tarefaModalAtual.id_tarefa);
  }
}

async function salvarDescricaoCardModal() {
  const novaDesc = document.getElementById('modalCardDescricao').value.trim();
  if (tarefaModalAtual && novaDesc !== tarefaModalAtual.descricao_tarefa) {
    tarefaModalAtual.descricao_tarefa = novaDesc;
    await sbClient.from('tarefas').update({ descricao_tarefa: novaDesc }).eq('id_tarefa', tarefaModalAtual.id_tarefa);
  }
}

async function salvarPrioridadeCardModal() {
  const novaPrio = document.getElementById('modalCardPrioridade').value;
  if (tarefaModalAtual && novaPrio !== tarefaModalAtual.prioridade_tarefa) {
    tarefaModalAtual.prioridade_tarefa = novaPrio;
    await sbClient.from('tarefas').update({ prioridade_tarefa: novaPrio }).eq('id_tarefa', tarefaModalAtual.id_tarefa);
  }
}

async function salvarDatasCardModal() {
  const pFim = document.getElementById('modalCardPrazoFim').value || null;
  if (tarefaModalAtual) {
    tarefaModalAtual.prazo_fim = pFim;
    await sbClient.from('tarefas').update({ prazo_fim: pFim }).eq('id_tarefa', tarefaModalAtual.id_tarefa);
  }
}

async function arquivarTarefaModal() {
  if (!tarefaModalAtual) return;
  if (confirm("Deseja realmente arquivar esta tarefa?")) {
    await sbClient.from('tarefas').update({ arquivada: true }).eq('id_tarefa', tarefaModalAtual.id_tarefa);
    fecharModalDetalhes();
  }
}
