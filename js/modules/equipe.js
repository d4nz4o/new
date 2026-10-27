function resetarSelecaoEquipe() {
  const cards = document.querySelectorAll('#teamListEquipe .member-card');
  cards.forEach(card => card.classList.remove('active-member'));

  const detailsPanel = document.getElementById('colabDetailsPanel');
  if (detailsPanel) {
    detailsPanel.innerHTML = `
      <div class="details-placeholder">
        <div class="placeholder-icon">🙋🏽‍♀️</div>
        <h3>Selecione um(a) colaborador(a)</h3>
        <p>Clique em um(a) colaborador(a) na barra lateral para visualizar suas informações.</p>
      </div>
    `;
  }
}

// COLABORADORES — Supabase

async function carregarColaboradores() {
  await carregarColaboradoresDados(renderizarEquipeFiltrada);
}

function renderizarEquipeFiltrada() {
  const filtro = (abaAtual === 'equipe') ? buscaAtual : '';

  const filtrados = !filtro
    ? listaColaboradores
    : listaColaboradores.filter(c => {
        const nome = (c.nome_colab || '').toLowerCase();
        const cargo = (c.cargo_colab || '').toLowerCase();
        return nome.includes(filtro) || cargo.includes(filtro);
      });

  renderizarEquipeSidebar(filtrados, 'teamListEquipe', true);
}

function renderizarEquipeSidebar(colaboradores, elementId, permitirClique) {
  const container = document.getElementById(elementId);
  if (!container) return;
  container.innerHTML = '';

  if (colaboradores.length === 0) {
    container.innerHTML = '<small class="empty-msg">Nenum colaborador encontrado.</small>';
    return;
  }

  colaboradores.forEach(c => {
    const iniciais = (c.nome_colab || '?')
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(p => p[0].toUpperCase())
      .join('');

    const div = document.createElement('div');
    div.className = 'member-card';
    if (permitirClique) {
      div.classList.add('clickable');
      div.onclick = () => selecionarColaborador(c, div);
    }

    div.innerHTML = `
      <div class="avatar" style="background:${corDoAvatar(c.id_colab)};">${iniciais}</div>
      <div class="member-info">
        <strong>${c.nome_colab}</strong>
        <span>${c.cargo_colab || ''}</span>
      </div>
    `;
    container.appendChild(div);
  });
}

function selecionarColaborador(c, elementoCard) {
  const cards = document.querySelectorAll('#teamListEquipe .member-card');
  cards.forEach(card => card.classList.remove('active-member'));
  elementoCard.classList.add('active-member');

  let data_aniver = 'Não informado';
  if (c.aniver_colab) {
    const partes = c.aniver_colab.split('-');
    if (partes.length === 3) {
      data_aniver = `${partes[2]}/${partes[1]}`;
    }
  }

  let wpp_colab = 'Não informado';
  if (c.cel_colab) {
    c.cel_colab = String(c.cel_colab);
    if (c.cel_colab.length === 11) {
      wpp_colab = c.cel_colab.replace(/^(\d{2})(\d{5})(\d{4})$/, `($1) $2-$3`);
    } else {
      wpp_colab = c.cel_colab;
    }
  }

  let tempo_colab = '';
  if (c.data_admissao) {
    const admissao = new Date(c.data_admissao);
    const hoje = new Date();
    let anos = hoje.getFullYear() - admissao.getFullYear();
    let meses = hoje.getMonth() - admissao.getMonth();

    if (hoje.getDate() < admissao.getDate()) {
      meses--;
    }

    if (meses < 0) {
      anos--;
      meses += 12;
    }

    const partes = [];
    if (anos > 0) partes.push(`${anos} ${anos === 1 ? 'ano' : 'anos'}`);
    if (meses > 0) partes.push(`${meses} ${meses === 1 ? 'mês' : 'meses'}`);

    tempo_colab = partes.length > 0 ? partes.join(' e ') : 'Menos de 1 mês';
  }

  const iniciais = (c.nome_colab || '?')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(p => p[0].toUpperCase())
    .join('');

  const detailsPanel = document.getElementById('colabDetailsPanel');
  if (!detailsPanel) return;

  detailsPanel.innerHTML = `
    <div class="colab-profile-card">
      <button type="button" class="btn-close-details" onclick="resetarSelecaoEquipe()" title="Fechar">&times;</button>
      
      <div class="profile-header">
        <div class="avatar profile-avatar" style="background:${corDoAvatar(c.id_colab)};">${iniciais}</div>
        <div class="profile-title">
          <h2>${c.nome_comp_colab || c.nome_colab}</h2>
          <span class="role-badge">${c.cargo_colab || 'Não informado'}</span>
        </div>
      </div>

      <div class="profile-details-grid">
        <div class="detail-item">
          <label>Matrícula</label>
          <p>${c.matricula_colab || 'Não informado'}</p>
        </div>

        <div class="detail-item">
          <label>Usuário SAP</label>
          <p>${c.sap_colab || 'Não informado'}</p>
        </div>

        <div class="detail-item">
          <label>Data de aniversário</label>
          <p>${data_aniver || 'Não informado'}</p>
        </div>

        <div class="detail-item">
          <label>WhatsApp</label>
          <p>${wpp_colab || 'Não informado'}</p>
        </div>

        <div class="detail-item">
          <label>Tempo de Empresa</label>
          <p>${tempo_colab || 'Não informado'}</p>
        </div>
      </div>        

      <div class="profile-details-grid-2">
        <div class="detail-item">
          <label>E-mail corporativo</label>
          <p>${c.email_colab || 'Não informado'}</p>
        </div>
      </div>
    </div>
  `;
}
