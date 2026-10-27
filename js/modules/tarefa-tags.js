function extrairTagsArray(tagsOrigem) {
  if (!tagsOrigem) return [];
  if (Array.isArray(tagsOrigem)) return tagsOrigem.map(t => String(t).trim()).filter(Boolean);
  if (typeof tagsOrigem === 'string') {
    return tagsOrigem.split(',').map(t => t.trim()).filter(Boolean);
  }
  return [];
}

function renderizarModalTags() {
  const container = document.getElementById('modalCardTagsContainer');
  if (!container || !tarefaModalAtual) return;

  container.innerHTML = '';

  const listaTags = extrairTagsArray(tarefaModalAtual.tags);

  listaTags.forEach((tag, index) => {
    const pill = document.createElement('span');
    pill.className = 'task-tag-pill';
    pill.innerHTML = `
      🏷️ ${tag}
      <span style="cursor:pointer; margin-left:4px; font-weight:bold; color:#dc2626;" onclick="removerTagModal(${index})">&times;</span>
    `;
    container.appendChild(pill);
  });

  const btnAdd = document.createElement('button');
  btnAdd.type = 'button';
  btnAdd.className = 'btn-add-tag-modal';
  btnAdd.innerText = '+ Tag';
  btnAdd.onclick = adicionarTagModal;
  container.appendChild(btnAdd);
}

async function salvarTagsNoSupabase(idTarefa, listaTags) {
  if (!sbClient) return;

  let { error } = await sbClient
    .from('tarefas')
    .update({ tags: listaTags })
    .eq('id_tarefa', idTarefa);

  if (error) {
    const stringTags = listaTags.join(', ');
    const res = await sbClient
      .from('tarefas')
      .update({ tags: stringTags })
      .eq('id_tarefa', idTarefa);
      
    if (res.error) {
      console.error('Erro ao salvar tags no Supabase:', res.error.message);
      alert('Erro ao salvar tags no banco de dados: ' + res.error.message);
      return false;
    }
  }

  return true;
}

async function adicionarTagModal() {
  const novaTag = prompt("Digite a nova tag (ex: Financeiro, Urgente, BI):");
  if (!novaTag || !novaTag.trim() || !tarefaModalAtual) return;

  const tagLimpa = novaTag.trim();
  let listaTags = extrairTagsArray(tarefaModalAtual.tags);

  if (!listaTags.includes(tagLimpa)) {
    listaTags.push(tagLimpa);

    const ok = await salvarTagsNoSupabase(tarefaModalAtual.id_tarefa, listaTags);

    if (ok) {
      tarefaModalAtual.tags = listaTags;
      const tGlobal = listaTarefas.find(t => (t.id_tarefa || t.id) === tarefaModalAtual.id_tarefa);
      if (tGlobal) tGlobal.tags = listaTags;

      renderizarModalTags();
      renderizarTarefas();
    }
  }
}

async function removerTagModal(index) {
  if (!tarefaModalAtual) return;

  let listaTags = extrairTagsArray(tarefaModalAtual.tags);
  listaTags.splice(index, 1);

  const ok = await salvarTagsNoSupabase(tarefaModalAtual.id_tarefa, listaTags);

  if (ok) {
    tarefaModalAtual.tags = listaTags;
    const tGlobal = listaTarefas.find(t => (t.id_tarefa || t.id) === tarefaModalAtual.id_tarefa);
    if (tGlobal) tGlobal.tags = listaTags;

    renderizarModalTags();
    renderizarTarefas();
  }
}
