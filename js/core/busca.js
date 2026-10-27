// CAMPO DE BUSCA (cada página só carrega o módulo que usa)

function aplicarBusca() {
  if (abaAtual === 'kanban') renderizarTarefas();
  else if (abaAtual === 'equipe') renderizarEquipeFiltrada();
  else if (abaAtual === 'ferias') renderizarFeriasFiltradas();
  else if (abaAtual === 'automacoes') renderizarAutomacoesFiltradas();
}

let temporizadorBusca = null;
function filtrarBusca(valor) {
  buscaAtual = (valor || '').trim().toLowerCase();
  clearTimeout(temporizadorBusca);
  temporizadorBusca = setTimeout(aplicarBusca, 150);
}
