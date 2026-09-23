(function () {
  const { $, esc } = CD.util;
  const { missao, rotas } = CD.conteudo;

  CD.montarTopo("inicio");

  $("#chamada").textContent = missao.chamada;
  $("#missao-titulo").textContent = missao.titulo;
  $("#narrativa").textContent = missao.narrativa;
  $("#regras").innerHTML = missao.regras.map((r) => `<li>${esc(r)}</li>`).join("");

  $("#lista-rotas").innerHTML = Object.entries(rotas).map(([id, rota]) => `
    <article class="cartao rota-cartao rota-cartao--${id}">
      <h3><span class="simbolo" aria-hidden="true">${rota.simbolo}</span>${esc(rota.nome)}</h3>
      <p style="color: var(--texto-suave); margin: 0">
        Símbolo: ${esc(rota.forma)} · ${rota.estacoes.length} estações · começa na coordenada <strong>${esc(rota.inicio)}</strong>
      </p>
      <a class="botao botao--${id} botao--bloco" href="rota.html?r=${id}">Seguir a ${esc(rota.nome)}</a>
    </article>`).join("");
})();
