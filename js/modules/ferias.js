// FÉRIAS — Lógica do Calendário e Supabase

async function carregarFerias() {
  await Promise.all([
    carregarColaboradoresDados(renderizarFeriasFiltradas),
    swr('ferias', () => sbClient.from('ferias').select('*'), d => { listaFerias = d; renderizarFeriasFiltradas(); })
  ]);
}

function renderizarFeriasFiltradas() {
  renderizarMapaFerias(listaFerias, listaColaboradores);
}

function mudarAnoFerias(delta) {
  anoFeriasAtual += delta;

  const elem = document.getElementById('anoFeriasAtual');
  if (elem) {
    elem.innerText = anoFeriasAtual;
  }

  renderizarFeriasFiltradas();
}

function renderizarMapaFerias(ferias, colaboradores) {
  const containerGrid = document.getElementById('mapaFeriasGrid');
  const containerLegenda = document.getElementById('legendaFerias');
  if (!containerGrid || !containerLegenda) return;

  containerGrid.innerHTML = '';
  containerLegenda.innerHTML = '';

  const colabsComFerias = colaboradores.filter(c => 
    ferias.some(f => f.id_colab === c.id_colab)
  );

  colabsComFerias.forEach(c => {
    const legItem = document.createElement('div');
    legItem.className = 'legenda-item';
    legItem.innerHTML = `
      <span class="legenda-cor" style="background-color: ${corDoAvatar(c.id_colab)};"></span>
      <span>${c.nome_colab}</span>
    `;
    containerLegenda.appendChild(legItem);
  });

  const nomesMeses = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const diasSemana = ["D", "S", "T", "Q", "Q", "S", "S"];

  for (let mes = 0; mes < 12; mes++) {
    const mesCard = document.createElement('div');
    mesCard.className = 'mes-card';

    const mesTitle = document.createElement('h4');
    mesTitle.innerText = nomesMeses[mes];
    mesCard.appendChild(mesTitle);

    const semanaHeader = document.createElement('div');
    semanaHeader.className = 'dias-semana-grid';
    diasSemana.forEach(d => {
      const span = document.createElement('span');
      span.innerText = d;
      semanaHeader.appendChild(span);
    });
    mesCard.appendChild(semanaHeader);

    const gridDias = document.createElement('div');
    gridDias.className = 'dias-grid';

    const primeiroDia = new Date(anoFeriasAtual, mes, 1).getDay();
    const totalDias = new Date(anoFeriasAtual, mes + 1, 0).getDate();

    for (let i = 0; i < primeiroDia; i++) {
      const cellVazia = document.createElement('div');
      cellVazia.className = 'dia-cell vazio';
      gridDias.appendChild(cellVazia);
    }

    for (let dia = 1; dia <= totalDias; dia++) {
      const cellDia = document.createElement('div');
      cellDia.className = 'dia-cell';
      cellDia.innerText = dia;

      const mesFormatado = String(mes + 1).padStart(2, '0');
      const diaFormatado = String(dia).padStart(2, '0');
      const dataStr = `${anoFeriasAtual}-${mesFormatado}-${diaFormatado}`;

      const registroFerias = ferias.find(f => dataStr >= f.data_de && dataStr <= f.data_ate);

      if (registroFerias) {
        const colab = colaboradores.find(c => c.id_colab === registroFerias.id_colab);
        if (colab) {
          const cor = corDoAvatar(colab.id_colab);
          cellDia.classList.add('com-ferias');
          cellDia.style.backgroundColor = cor;
          cellDia.style.cursor = 'pointer';
          cellDia.title = `${colab.nome_colab} (Clique para remover)`;

          cellDia.onclick = () => {
            excluirFerias(
              registroFerias.id_ferias,
              colab.nome_colab,
              registroFerias.data_de,
              registroFerias.data_ate
            );
          };
        }
      }

      gridDias.appendChild(cellDia);
    }

    mesCard.appendChild(gridDias);
    containerGrid.appendChild(mesCard);
  }
}

async function excluirFerias(idFerias, nomeColab, dataDe, dataAte) {
  const inicio = dataDe.split('-').reverse().join('/');
  const fim = dataAte.split('-').reverse().join('/');

  const confirmou = confirm(
    `Deseja realmente remover o período de férias de ${nomeColab} (${inicio} até ${fim})?`
  );

  if (!confirmou) return;

  if (sbClient) {
    try {
      const { error } = await sbClient
        .from('ferias')
        .delete()
        .eq('id_ferias', idFerias);

      if (error) {
        console.error('Erro ao excluir férias:', error.message);
        alert('Erro ao excluir férias no banco de dados: ' + error.message);
        return;
      }
    } catch (err) {
      console.error('Falha de conexão ao excluir férias:', err);
      alert('Falha de conexão ao excluir férias.');
      return;
    }
  } else {
    listaFerias = listaFerias.filter(f => f.id_ferias !== idFerias);
  }

  alert('Férias removidas com sucesso!');
  Cache.limpar('ferias');
  await carregarFerias();
}
