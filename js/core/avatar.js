// PALETA DE CORES E AVATAR

const AVATAR_PALETTE = [
  '#3b91d8', '#7c3aed', '#059669', '#d97706', '#db2777', 
  '#0891b2', '#4f46e5', '#65806e', '#2563eb', '#ea580c', 
  '#0d9488', '#9333ea', '#c026d3', '#475569', '#16a34a', 
  '#b91c1c', '#0284c7', '#78350f', '#57534e', '#e11d48', 
  '#6366f1', '#d946ef', '#ca8a04', '#0e7490', '#4338ca', 
  '#be123c', '#15803d', '#334155'
];

function corDoAvatar(id) {
  if (!id) return AVATAR_PALETTE[0];
  if (typeof id === 'number' || !isNaN(id)) {
    return AVATAR_PALETTE[Math.abs(Number(id)) % AVATAR_PALETTE.length];
  }
  let hash = 0;
  const idStr = String(id);
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash * 31 + idStr.charCodeAt(i)) >>> 0;
  }
  return AVATAR_PALETTE[hash % AVATAR_PALETTE.length];
}
