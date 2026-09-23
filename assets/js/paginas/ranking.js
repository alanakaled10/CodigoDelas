(function () {
  const { $, esc, formatarTempo } = CD.util;
  const { rotas } = CD.conteudo;

  CD.montarTopo("ranking", true);
  CD.bannerModo($("#modo-banner"));

  let grupos = [];
  let filtro = "todas";
  let cronometro = null;
  const pontosAnteriores = {};

  CD.store.onGrupos((lista) => { grupos = lista; desenharFiltros(); desenharRanking(); });
  CD.store.onCronometro((c) => { cronometro = c; desenharRelogio(); });
  setInterval(desenharRelogio, 200);

  function desenharRelogio() {
    if (!cronometro) return;
    const restante = CD.cronometro.restante(cronometro);
    const iniciado = cronometro.rodando || cronometro.acumulado > 0;
    const relogio = $("#relogio");
    relogio.textContent = formatarTempo(restante);
    relogio.className = "relogio" +
      (!cronometro.rodando ? " relogio--parado" : "") +
      (restante === 0 && iniciado ? " relogio--fim" : restante <= 60000 && cronometro.rodando ? " relogio--alerta" : "");
    $("#status-tempo").textContent =
      restante === 0 && iniciado ? "Tempo esgotado" :
      cronometro.rodando ? "Missão em andamento" :
      iniciado ? "Pausado" : "Aguardando início";
  }

  function sessoes() {
    return [...new Set(grupos.map((g) => g.sessao).filter(Boolean))].sort((a, b) =>
      a.localeCompare(b, "pt-BR", { numeric: true }));
  }

  function desenharFiltros() {
    const lista = sessoes();
    if (filtro !== "todas" && !lista.includes(filtro)) filtro = "todas";
    const alvo = $("#filtros");
    alvo.hidden = lista.length < 2;
    alvo.innerHTML = ["todas", ...lista].map((s) =>
      `<button class="filtro" data-s="${esc(s)}" aria-pressed="${s === filtro}">${s === "todas" ? "Geral do dia" : esc(s)}</button>`
    ).join("");
  }

  $("#filtros").addEventListener("click", (ev) => {
    const b = ev.target.closest(".filtro");
    if (!b) return;
    filtro = b.dataset.s;
    desenharFiltros();
    desenharRanking();
  });

  function desenharRanking() {
    const alvo = $("#ranking");
    const lista = grupos
      .filter((g) => filtro === "todas" || g.sessao === filtro)
      .sort((a, b) => (b.pontos || 0) - (a.pontos || 0) || (a.criadoEm || 0) - (b.criadoEm || 0));

    if (!lista.length) {
      alvo.innerHTML = `<li class="vazio">Nenhum grupo cadastrado ainda. As equipes aparecem aqui assim que a organização registrar.</li>`;
      return;
    }

    const maximo = Math.max(1, ...lista.map((g) => g.pontos || 0));
    let posicao = 0;
    let anterior = null;

    alvo.innerHTML = lista.map((g, i) => {
      // Empates dividem a mesma posição.
      if (g.pontos !== anterior) posicao = i + 1;
      anterior = g.pontos;
      const rota = rotas[g.rota];
      const mudou = pontosAnteriores[g.id] !== undefined && pontosAnteriores[g.id] !== g.pontos;
      pontosAnteriores[g.id] = g.pontos;
      return `
        <li class="ranking__item ${rota ? "tema-" + g.rota : ""} ${mudou ? "ranking__item--mudou" : ""}"
            style="--largura: ${Math.round(((g.pontos || 0) / maximo) * 100)}%">
          <div class="ranking__pos">${posicao}º</div>
          <div>
            <div class="ranking__nome">${esc(g.nome)}</div>
            <div class="ranking__info">
              ${rota ? `<span class="pilula-rota"><span aria-hidden="true">${rota.simbolo}</span>${esc(rota.nome)}</span>` : ""}
              ${g.sessao ? `<span>${esc(g.sessao)}</span>` : ""}
            </div>
          </div>
          <div class="ranking__pontos">${g.pontos || 0}<small>pts</small></div>
        </li>`;
    }).join("");
  }
})();
