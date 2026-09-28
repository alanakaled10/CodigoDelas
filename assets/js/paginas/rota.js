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

  let grupos = null; // null enquanto a lista de equipes carrega
  CD.store.onGrupos((lista) => {
    grupos = lista;
    // Se a equipe escolhida foi removida do painel, pede para escolher de novo.
    const p = CD.jogo.progresso();
    if (p.grupo && !lista.some((g) => g.id === p.grupo.id)) esquecerGrupo();
    desenhar();
  });
  CD.jogo.sincronizarAcertos();

  // Volta para a tela de escolha da equipe.
  function esquecerGrupo() {
    const p = CD.jogo.progresso();
    p.grupo = null;
    p.semGrupo = false;
    CD.jogo.salvarProgresso(p);
  }

  function escolhaDeEquipe() {
    const daRota = (grupos || [])
      .filter((g) => g.rota === id)
      .sort((a, b) => (b.criadoEm || 0) - (a.criadoEm || 0));
    return `
      <div class="cartao" style="margin: 24px 0">
        <span class="rotulo">Antes de começar</span>
        <h2 style="font-size: 26px">Qual é a sua equipe?</h2>
        <p style="color: var(--texto-suave)">Escolham o nome que a monitora cadastrou. Cada pergunta certa soma pontos no ranking automaticamente.</p>
        ${grupos === null ? `<p>Carregando equipes...</p>` : daRota.length ? `
          <div class="lista-equipes">
            ${daRota.map((g) => `
              <button class="botao botao--fantasma botao--bloco equipe-opcao" data-grupo="${esc(g.id)}">
                <span>${esc(g.nome)}</span>${g.sessao ? `<small>${esc(g.sessao)}</small>` : ""}
              </button>`).join("")}
          </div>` : `<div class="aviso aviso--dica">Nenhuma equipe cadastrada nesta rota ainda. Peçam para a monitora cadastrar.</div>`}
        <p style="margin: 16px 0 0; text-align: center">
          <button class="botao botao--fantasma botao--pequeno" id="sem-equipe">Jogar sem pontuação automática</button>
        </p>
      </div>`;
  }

  function desenhar() {
    const p = CD.jogo.progresso();
    if (!p.grupo && !p.semGrupo) {
      alvo.innerHTML = `
        <span class="rotulo"><span aria-hidden="true">${rota.simbolo}</span> ${esc(rota.nome)}</span>
        <h1 style="font-size: clamp(34px, 8vw, 52px)">A missão vai começar</h1>
        ${escolhaDeEquipe()}`;
      alvo.querySelectorAll("[data-grupo]").forEach((b) => b.addEventListener("click", () => {
        CD.jogo.definirGrupo(grupos.find((g) => g.id === b.dataset.grupo));
        desenhar();
      }));
      $("#sem-equipe").addEventListener("click", () => { CD.jogo.definirGrupo(null); desenhar(); });
      return;
    }
    const feitas = estacoes.filter((e) => p.fragmentos[e.id]);
    const completa = feitas.length === estacoes.length;
    const ultima = feitas[feitas.length - 1];
    const proxima = !ultima ? rota.inicio : ultima.proxima;

    alvo.innerHTML = `
      <span class="rotulo"><span aria-hidden="true">${rota.simbolo}</span> ${esc(rota.nome)} · Missão ativa</span>
      <h1 style="font-size: clamp(34px, 8vw, 52px)">${completa ? "Rota concluída!" : feitas.length ? "Continuem a busca" : "A missão começa agora"}</h1>
      <div class="equipe-atual">
        ${p.grupo
          ? `Equipe <strong>${esc(p.grupo.nome)}</strong> · pontos automáticos ativados`
          : "Jogando sem pontuação automática"}
        <button class="link-botao" id="trocar-equipe">${p.grupo ? "trocar" : "escolher equipe"}</button>
      </div>

      <div class="cartao" style="margin: 24px 0">
        ${completa ? `
          <span class="rotulo">Destino final</span>
          <p style="font-size: 20px">${esc(CD.conteudo.final.local)}</p>
          <p style="color: var(--texto-suave)">Juntem os fragmentos na ordem, formem a palavra-chave e abram o tesouro. Rápido: vence quem chegar primeiro!</p>
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

    $("#trocar-equipe").addEventListener("click", () => { esquecerGrupo(); desenhar(); });

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
