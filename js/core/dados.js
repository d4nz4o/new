// CACHE + CARGA DE DADOS (stale-while-revalidate)
// Mostra na hora o que já foi baixado nesta sessão e atualiza em segundo plano.

const Cache = {
  ler(k) { try { return JSON.parse(sessionStorage.getItem('trilha:' + k)); } catch { return null; } },
  gravar(k, v) { try { sessionStorage.setItem('trilha:' + k, JSON.stringify(v)); } catch {} },
  limpar(k) { try { sessionStorage.removeItem('trilha:' + k); } catch {} },
  limparTudo() {
    try { Object.keys(sessionStorage).filter(k => k.startsWith('trilha:')).forEach(k => sessionStorage.removeItem(k)); } catch {}
  }
};

async function swr(chave, consulta, aoDados) {
  const emCache = Cache.ler(chave);
  if (emCache) aoDados(emCache);
  try {
    const { data, error } = await consulta();
    if (error) { console.error(`Erro ao carregar ${chave}:`, error.message); return; }
    const novo = data || [];
    if (JSON.stringify(novo) !== JSON.stringify(emCache)) {
      Cache.gravar(chave, novo);
      aoDados(novo);
    }
  } catch (err) {
    console.error(`Falha de rede ao carregar ${chave}:`, err);
  }
}

// Colaboradores são usados nas páginas Equipe e Férias
async function carregarColaboradoresDados(aoAtualizar) {
  if (!sbClient) return;
  await swr('colaboradores',
    () => sbClient.from('colaboradores').select('*').order('nome_colab', { ascending: true }),
    d => { listaColaboradores = d; if (aoAtualizar) aoAtualizar(); });
}
