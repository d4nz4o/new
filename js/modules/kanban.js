// ==========================================
// TAREFAS / KANBAN — COLUNAS DINÂMICAS DO SUPABASE
// ==========================================

// Busca e gera as colunas dinamicamente a partir do Supabase
function desenharColunas(board) {
    board.innerHTML = '';
    listaColunas.forEach(col => {
      const colDiv = document.createElement('div');
      colDiv.className = 'kanban-column';
      colDiv.setAttribute('ondragover', 'permitirSoltar(event)');
      colDiv.setAttribute('ondrop', `soltarCard(event, '${col.id_coluna}')`);

      const corHex = col.cor_coluna || '#cbd5e1';

      colDiv.innerHTML = `
        <div class="column-header" style="background-color: ${corHex}; color: #1e293b;">
          ${col.titulo_coluna}
        </div>
        <div class="cards-container" id="col-${col.id_coluna}"></div>
      `;

      board.appendChild(colDiv);
    });
}

async function carregarEConstruirColunas() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  if (!sbClient) {
    console.error('Cliente do Supabase não inicializado.');
    board.innerHTML = '<p style="color: red; padding: 1rem;">Erro: Cliente Supabase não inicializado.</p>';
    return;
  }

  // Desenha na hora as colunas guardadas nesta sessão (se houver)
  const colunasEmCache = Cache.ler('colunas');
  const assinaturaCache = colunasEmCache ? JSON.stringify(colunasEmCache) : null;
  if (colunasEmCache && colunasEmCache.length) { listaColunas = colunasEmCache; desenharColunas(board); }

  try {
    // Consulta a tabela colunas_tarefas do Supabase ordenada por ordem_coluna
    const { data, error } = await sbClient
      .from('colunas_tarefas')
      .select('*')
      .order('ordem_coluna', { ascending: true });

    if (error) {
      console.error('Erro ao consultar colunas_tarefas no Supabase:', error);
      board.innerHTML = `<p style="color: red; padding: 1rem;">Erro ao carregar colunas do Supabase: ${error.message}</p>`;
      return;
    }

    if (!data || data.length === 0) {
      console.warn('Tabela colunas_tarefas retornou vazia.');
      board.innerHTML = '<p style="color: #64748b; padding: 1rem;">Nenhuma coluna encontrada na tabela "colunas_tarefas".</p>';
      return;
    }

    listaColunas = data;

    Cache.gravar('colunas', data);
    if (JSON.stringify(data) !== assinaturaCache) desenharColunas(board);
  } catch (err) {
    console.error('Falha crítica ao carregar colunas:', err);
    board.innerHTML = `<p style="color: red; padding: 1rem;">Erro de conexão: ${err.message}</p>`;
  }
}

let tarefasCarregadas = false;
let carregandoTarefas = null;

// recarregar=true força nova consulta ao banco; sem ele usa a lista em memória
// (busca e arrastar-e-soltar não refazem a consulta a cada ação).
async function renderizarTarefas(recarregar = false) {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  // Colunas e tarefas são buscadas em paralelo
  const colunasProntas = (!listaColunas || listaColunas.length === 0) ? carregarEConstruirColunas() : null;

  if (!tarefasCarregadas && listaTarefas.length === 0) {
    const emCache = Cache.ler('tarefas');
    if (emCache) { listaTarefas = emCache; await desenharTarefas(); }
  }

  if (recarregar || !tarefasCarregadas) {
    carregandoTarefas = carregandoTarefas || buscarTarefas().finally(() => { carregandoTarefas = null; });
    await Promise.all([colunasProntas, carregandoTarefas]);
    tarefasCarregadas = true;
  } else if (colunasProntas) {
    await colunasProntas;
  }

  await desenharTarefas();
}

async function buscarTarefas() {
  if (sbClient) {
    try {
      const { data, error } = await sbClient
        .from('tarefas')
        .select(`
          *,
          tarefas_colaboradores (
            id_colab,
            colaboradores (id_colab, nome_colab)
          )
        `);

      if (error) {
        const { data: dataSimples, error: errSimples } = await sbClient
          .from('tarefas')
          .select('*');

        if (!errSimples) {
          listaTarefas = dataSimples || [];
        }
      } else {
        listaTarefas = data || [];
      }
    } catch (err) {
      console.error('Erro de conexão ao carregar tarefas:', err);
    }
  }
  Cache.gravar('tarefas', listaTarefas);
}

async function desenharTarefas() {
  const board = document.getElementById('kanbanBoard');
  if (!board) return;

  // Limpa o conteúdo de cada coluna
  listaColunas.forEach(col => {
    const el = document.getElementById(`col-${col.id_coluna}`);
    if (el) el.innerHTML = "";
  });

  const filtro = (abaAtual === 'kanban') ? buscaAtual : '';

  // Filtra por título, descrição, tags e nomes dos responsáveis
  const listaFiltrada = !filtro
    ? listaTarefas
    : listaTarefas.filter(t => {
        const titulo = (t.titulo_tarefa || t.titulo || '').toLowerCase();
        const desc = (t.descricao_tarefa || t.descricao || '').toLowerCase();
        const respTexto = (t.responsavel || '').toLowerCase();

        let tagsTexto = '';
        if (t.tags) {
          tagsTexto = Array.isArray(t.tags)
            ? t.tags.join(' ').toLowerCase()
            : String(t.tags).toLowerCase();
        }

        let nomesColabs = '';
        if (t.tarefas_colaboradores && t.tarefas_colaboradores.length > 0) {
          nomesColabs = t.tarefas_colaboradores
            .map(tc => (tc.colaboradores?.nome_colab || '').toLowerCase())
            .join(' ');
        }

        return titulo.includes(filtro) || 
               desc.includes(filtro) || 
               respTexto.includes(filtro) || 
               tagsTexto.includes(filtro) || 
               nomesColabs.includes(filtro);
      });

  listaFiltrada.forEach(tarefa => {
    const containerCol = document.getElementById(`col-${tarefa.id_coluna}`);

    if (containerCol) {
      const card = document.createElement("div");
      card.className = "task-card";
      card.draggable = true;
      const idCard = tarefa.id_tarefa || tarefa.id;
      card.id = `task-${idCard}`;
      card.onclick = () => abrirModalDetalhesCard(idCard);

      card.ondragstart = (e) => e.dataTransfer.setData("text/plain", idCard);

      // Renderização dos avatares dos responsáveis
      let htmlAvatars = '';
      if (tarefa.tarefas_colaboradores && tarefa.tarefas_colaboradores.length > 0) {
        const colabs = tarefa.tarefas_colaboradores
          .map(tc => tc.colaboradores)
          .filter(Boolean);

        if (colabs.length > 0) {
          htmlAvatars = `<div class="task-avatars-flex">` + colabs.map(c => {
            const iniciais = (c.nome_colab || '?')
              .split(' ')
              .filter(Boolean)
              .slice(0, 2)
              .map(p => p[0].toUpperCase())
              .join('');
            const cor = corDoAvatar(c.id_colab);

            return `<div class="avatar task-avatar-sm" style="background:${cor};" title="${c.nome_colab}">${iniciais}</div>`;
          }).join('') + `</div>`;
        }
      }

      if (!htmlAvatars) {
        if (tarefa.responsavel) {
          const iniciais = tarefa.responsavel
            .split(' ')
            .filter(Boolean)
            .slice(0, 2)
            .map(p => p[0].toUpperCase())
            .join('');
          const cor = corDoAvatar(tarefa.responsavel);
          htmlAvatars = `<div class="task-avatars-flex"><div class="avatar task-avatar-sm" style="background:${cor};" title="${tarefa.responsavel}">${iniciais}</div></div>`;
        } else {
          htmlAvatars = `<span style="font-size: 0.75rem; color: var(--text-muted);">Sem responsável</span>`;
        }
      }

      // Formatação da data de término
      let prazoFormatado = "Sem prazo";
      const valorPrazo = tarefa.prazo_fim || tarefa.prazo;
      if (valorPrazo) {
        const partes = String(valorPrazo).split('T')[0].split('-');
        if (partes.length === 3) prazoFormatado = `${partes[2]}/${partes[1]}/${partes[0]}`;
        else prazoFormatado = valorPrazo;
      }

      const tituloText = tarefa.titulo_tarefa || tarefa.titulo || 'Sem título';

      // Leitura e montagem das tags diretamente do campo `tags` no Supabase
      let htmlTags = '';
      if (tarefa.tags) {
        const listaTags = Array.isArray(tarefa.tags) 
          ? tarefa.tags 
          : String(tarefa.tags).split(',').map(t => t.trim()).filter(Boolean);

        if (listaTags.length > 0) {
          htmlTags = `<div class="task-tags-flex">` + 
            listaTags.map(tag => `<span class="task-tag-pill">🏷️ ${tag}</span>`).join('') + 
            `</div>`;
        }
      }

      card.innerHTML = `
        <h4>${tituloText}</h4>
        ${htmlTags}
        <div class="task-meta task-date" style="margin-top: 8px;">
          ${htmlAvatars}
          <small>📅 ${prazoFormatado}</small>
        </div>
      `;

      containerCol.appendChild(card);
    }
  });

  // Exibe aviso em colunas sem tarefas
  listaColunas.forEach(col => {
    const container = document.getElementById(`col-${col.id_coluna}`);
    if (container && container.children.length === 0) {
      container.innerHTML = `
        <div class="empty-column-msg">
          Sem tarefas atribuídas
        </div>
      `;
    }
  });
}
