// INICIALIZAÇÃO: valida a sessão, preenche o perfil e chama iniciarPagina() da página

document.addEventListener("DOMContentLoaded", async () => {
  if (!sbClient) { window.location.href = "index.html"; return; }

  // getSession lê a sessão guardada no navegador (não faz chamada de rede)
  const { data: { session }, error } = await sbClient.auth.getSession();
  if (error || !session) { window.location.href = "index.html"; return; }

  const user = session.user;
  const email = user?.email || "";

  if (!email.endsWith("@triviatrens.com.br")) {
    await sbClient.auth.signOut();
    Cache.limparTudo();
    window.location.href = "index.html?erro=dominio_invalido";
    return;
  }

  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const nomeUsuario = user?.user_metadata?.full_name || user?.user_metadata?.name || email;
  const nameElem = document.getElementById('dropdownUserName');
  const emailElem = document.getElementById('dropdownUserEmail');
  const avatarElem = document.getElementById('userProfileAvatar');

  if (nameElem) nameElem.innerText = nomeUsuario;
  if (emailElem) emailElem.innerText = email;
  if (avatarElem) {
    avatarElem.title = `${nomeUsuario} (${email})`;
    if (avatarUrl) {
      avatarElem.innerHTML = `<img src="${avatarUrl}" alt="" referrerpolicy="no-referrer">`;
    } else {
      avatarElem.innerHTML = `<span>${nomeUsuario.charAt(0).toUpperCase()}</span>`;
    }
  }

  if (typeof iniciarPagina === "function") iniciarPagina(user);
});
