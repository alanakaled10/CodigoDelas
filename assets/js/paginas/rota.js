CD.aoCarregar(function () {
  const { $, esc, param } = CD.util;
  const { rotas } = CD.conteudo;

  CD.montarTopo();

  let id = param("r");
  if (!rotas[id]) id = CD.jogo.progresso().rota;
  const alvo = $("#conteudo");

  if (!rotas[id]) {
    alvo.innerHTML = `
      <div class="cartao">
        <h1>Escolham uma rota</h1>
        <p>Voltem à página inicial para escolher a Rota Teal ou a Rota Coral.</p>
        <a class="botao botao--rosa" href="index.html#rotas">Escolher rota</a>
      </div>`;
    return;
  }

  CD.jogo.escolherRota(id);
  const rota = rotas[id];
  const estacoes = CD.jogo.estacoesDaRota(id);
  document.body.classList.add("tema-" + id);

  function desenhar() {
    const p = CD.jogo.progresso();
    const feitas = estacoes.filter((e) => p.fragmentos[e.id]);
    const completa = feitas.length === estacoes.length;
    const ultima = feitas[feitas.length - 1];
    const proxima = !ultima ? rota.inicio : ultima.proxima;

    alvo.innerHTML = `
      <span class="rotulo"><span aria-hidden="true">${rota.simbolo}</span> ${esc(rota.nome)} · Missão ativa</span>
      <h1 style="font-size: clamp(34px, 8vw, 52px)">${completa ? "Rota concluída!" : feitas.length ? "Continuem a busca" : "A missão começa agora"}</h1>

      <div class="cartao" style="margin: 24px 0">
        ${completa ? `
          <span class="rotulo">Destino final</span>
          <p style="font-size: 20px">${esc(CD.conteudo.final.local)}</p>
          <p style="color: var(--texto-suave)">Encontrem a outra equipe, juntem os fragmentos e abram o tesouro.</p>
          <a class="botao botao--rosa botao--bloco" href="final.html">Abrir o tesouro</a>
        ` : `
          <span class="rotulo">Próxima coordenada</span>
          <div class="coordenada">${esc(proxima)} <small>fileira ${esc(proxima.charAt(0))} · posição ${esc(proxima.slice(1))}</small></div>
          <p style="color: var(--texto-suave); margin: 16px 0 0">
            Procurem o pergaminho com o símbolo <strong style="color: var(--cor-rota)">${rota.simbolo} ${esc(rota.forma)}</strong>
            e escaneiem o QR Code para abrir o registro.
          </p>
        `}
      </div>

      <div class="cartao">
        <span class="rotulo">Fragmentos recuperados · ${feitas.length} de ${estacoes.length}</span>
        <div class="slots">${CD.jogo.slotsFragmentos(id)}</div>
        ${feitas.length ? `
          <p style="margin: 18px 0 6px; color: var(--texto-suave)">Pioneiras encontradas:</p>
          <p style="margin: 0">${feitas.map((e) => `<a href="estacao.html?id=${e.id}">${esc(e.pioneira)}</a>`).join(" · ")}</p>
        ` : ""}
      </div>

      <p style="margin-top: 28px; text-align: center">
        <button class="botao botao--fantasma botao--pequeno" id="reiniciar">Reiniciar progresso neste aparelho</button>
      </p>`;

    $("#reiniciar").addEventListener("click", () => {
      if (confirm("Apagar os fragmentos salvos neste aparelho?")) {
        CD.jogo.reiniciar();
        CD.jogo.escolherRota(id);
        desenhar();
      }
    });
  }

  desenhar();
});
