// KANBAN DRAG & DROP INSTANTÂNEO

const temporizadoresSupabase = {};
const pendentesSupabase = {};

function permitirSoltar(ev) {
  ev.preventDefault();
}

function soltarCard(ev, idColunaAlvo) {
  ev.preventDefault();

  const idTarefa = ev.dataTransfer.getData("text/plain");
  if (!idTarefa) return;

  const idColunaBanco = Number(idColunaAlvo) || idColunaAlvo;
  const tarefa = listaTarefas.find(t => (t.id_tarefa == idTarefa || t.id == idTarefa));

  if (tarefa) {
    // 1. Atualização instantânea na interface (sem nova consulta ao banco)
    tarefa.id_coluna = idColunaBanco;
    Cache.gravar('tarefas', listaTarefas);
    renderizarTarefas();

    // 2. Gravação em segundo plano
    agendarSincronizacaoSupabase(tarefa, idColunaBanco);
  }
}

function agendarSincronizacaoSupabase(tarefa, idNovaColuna) {
  const idReal = tarefa.id_tarefa || tarefa.id;
  const campoId = tarefa.id_tarefa ? 'id_tarefa' : 'id';

  clearTimeout(temporizadoresSupabase[idReal]);
  pendentesSupabase[idReal] = { campoId, idNovaColuna };
  temporizadoresSupabase[idReal] = setTimeout(() => gravarMovimento(idReal), 600);
}

async function gravarMovimento(idReal) {
  clearTimeout(temporizadoresSupabase[idReal]);
  delete temporizadoresSupabase[idReal];

  const pendente = pendentesSupabase[idReal];
  if (!pendente) return;
  delete pendentesSupabase[idReal];

  if (!sbClient) return;
  const { error } = await sbClient
    .from('tarefas')
    .update({ id_coluna: pendente.idNovaColuna })
    .eq(pendente.campoId, idReal);

  if (error) console.error('Erro ao mover tarefa no Supabase:', error.message);
}

// Grava tudo o que ainda está na fila (usado antes de trocar de página)
function flushPendentes() {
  return Promise.all(Object.keys(pendentesSupabase).map(gravarMovimento));
}
window.addEventListener('pagehide', () => { flushPendentes(); });
