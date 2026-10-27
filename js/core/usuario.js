// MENU DROPDOWN DE USUÁRIO & LOGOUT

function alternarMenuUsuario(event) {
  if (event) event.stopPropagation();
  const menu = document.getElementById('userDropdownMenu');
  if (menu) {
    menu.classList.toggle('active');
  }
}

document.addEventListener('click', (event) => {
  const container = document.getElementById('userProfileContainer');
  const menu = document.getElementById('userDropdownMenu');
  if (container && menu && !container.contains(event.target)) {
    menu.classList.remove('active');
  }
});

async function fazerLogout() {
  if (sbClient) {
    await sbClient.auth.signOut();
  }
  Cache.limparTudo();
  window.location.href = "index.html";
}
