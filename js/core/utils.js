// Funções Auxiliares
function formatarDataHora(dataIso) {
  if (!dataIso) return '—';
  try {
    const data = new Date(dataIso);
    if (isNaN(data.getTime())) return '—';
    return data.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return '—';
  }
}
