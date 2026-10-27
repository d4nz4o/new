async function carregarModalComentarios() {
  const container = document.getElementById('modalComentariosLista');
  if (!container || !tarefaModalAtual) return;

  const { data } = await sbClient
    .from('tarefas_comentarios')
    .select('*, colaboradores(nome_colab)')
    .eq('id_tarefa', tarefaModalAtual.id_tarefa)
    .order('criado_em', { ascending: true });

  container.innerHTML = '';
  if (!data || data.length === 0) {
    container.innerHTML = '<small style="color: var(--text-muted);">Nenhum comentário.</small>';
    return;
  }

  data.forEach(c => {
    const autor = c.colaboradores?.nome_colab || 'Colaborador';
    const div = document.createElement('div');
    div.className = 'comentario-item';
    div.innerHTML = `
      <strong>${autor}</strong> <small>• ${formatarDataHora(c.criado_em)}</small>
      <p>${c.mensagem}</p>
    `;
    container.appendChild(div);
  });
}

async function enviarComentarioModal() {
  const input = document.getElementById('inputNovoComentario');
  const txt = input.value.trim();
  if (!txt || !tarefaModalAtual) return;

  await sbClient.from('tarefas_comentarios').insert([{
    id_tarefa: tarefaModalAtual.id_tarefa,
    id_colab: colaboradorLogado?.id_colab || null,
    mensagem: txt
  }]);

  input.value = '';
  await carregarModalComentarios();
}

async function carregarModalAnexos() {
  const container = document.getElementById('modalAnexosLista');
  if (!container || !tarefaModalAtual) return;

  const { data } = await sbClient
    .from('tarefas_anexos')
    .select('*')
    .eq('id_tarefa', tarefaModalAtual.id_tarefa);

  container.innerHTML = '';
  if (!data || data.length === 0) {
    container.innerHTML = '<small style="color: var(--text-muted);">Nenhum anexo enviado.</small>';
    return;
  }

  data.forEach(a => {
    const div = document.createElement('div');
    div.className = 'anexo-item';
    div.innerHTML = `<a href="${a.url_anexo}" target="_blank">📎 ${a.nome_anexo}</a>`;
    container.appendChild(div);
  });
}

async function enviarAnexoCardModal(event) {
  const file = event.target.files[0];
  if (!file || !tarefaModalAtual) return;

  const nomeArquivo = `${Date.now()}_${file.name}`;
  const { uploadErr } = await sbClient.storage
    .from('anexos-tarefas')
    .upload(nomeArquivo, file);

  if (uploadErr) {
    alert("Erro ao enviar arquivo: " + uploadErr.message);
    return;
  }

  const { data: publicUrlData } = sbClient.storage.from('anexos-tarefas').getPublicUrl(nomeArquivo);

  await sbClient.from('tarefas_anexos').insert([{
    id_tarefa: tarefaModalAtual.id_tarefa,
    nome_anexo: file.name,
    url_anexo: publicUrlData.publicUrl,
    tamanho_anexo: file.size,
    id_colab: colaboradorLogado?.id_colab || null
  }]);

  await carregarModalAnexos();
}
