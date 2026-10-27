const pendingUpdates = {};

// Armazena as listas globais
let listaColaboradores = [];
let listaAutomacoes = [];
let listaFerias = [];
let listaTarefas = [];
let listaColunas = [];
let anoFeriasAtual = new Date().getFullYear();
let colaboradorLogado = null;

// Aba da página atual (definida em <body data-aba="...">) e termo de busca
const ABA_ATUAL_ID = document.body.dataset.aba || 'kanban';
let abaAtual = ABA_ATUAL_ID;
let buscaAtual = '';
