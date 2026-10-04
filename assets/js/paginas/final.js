CD.aoCarregar(function () {
  const { $, esc, normalizar, formatarTempo } = CD.util;
  const { final, rotas } = CD.conteudo;

  CD.montarTopo();

  const alvo = $("#conteudo");
  let cronometro = null;
  CD.store.onCronometro((c) => { cronometro = c; });

  function desenharCadeado() {
    const progresso = CD.jogo.progresso();
    const minhaRota = rotas[progresso.rota] ? progresso.rota : null;
    alvo.innerHTML = `
      <span class="rotulo">Arquivo do Tempo · Registro final</span>
      <h1 style="font-size: clamp(34px, 8vw, 52px)">O tesouro está trancado</h1>
      <p style="color: var(--texto-suave)">
        Juntem os fragmentos que a equipe recuperou, na ordem das estações, e digitem a
        palavra-chave da ${minhaRota ? `<strong style="color: var(--${minhaRota})">${esc(rotas[minhaRota].nome)}</strong>` : "sua rota"}.
        Vence quem chegar primeiro!
      </p>

      ${minhaRota ? `
        <div class="cartao tema-${minhaRota}" style="margin: 20px 0">
          <span class="rotulo">Fragmentos da ${esc(rotas[minhaRota].nome)}</span>
          <div class="slots">${CD.jogo.slotsFragmentos(minhaRota)}</div>
        </div>` : ""}

      <form class="cartao" id="form-codigo" style="margin-top: 20px">
        <label class="rotulo" for="codigo">Palavra-chave</label>
        <input class="campo-codigo" id="codigo" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="_ _ _ _ _ _">
        <button class="botao botao--rosa botao--bloco" style="margin-top: 14px">Abrir o tesouro</button>
        <div id="retorno" aria-live="polite"></div>
      </form>`;

    $("#form-codigo").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const digitado = normalizar($("#codigo").value);
      const rotaCerta = digitado && Object.keys(rotas).find((r) => normalizar(rotas[r].codigo) === digitado);
      if (rotaCerta && (!minhaRota || rotaCerta === minhaRota)) {
        concluir(rotaCerta);
        return;
      }
      $("#retorno").innerHTML = `<div class="aviso aviso--erro">${rotaCerta
        ? "Essa palavra não é da rota de vocês. Usem só os fragmentos que a equipe recuperou."
        : "A palavra não abriu o tesouro. Confiram a ordem dos fragmentos."}</div>`;
    });
  }

  // Guarda a chegada neste aparelho: recarregar a página mostra a mesma tela.
  function concluir(rota) {
    const p = CD.jogo.progresso();
    const iniciado = cronometro && (cronometro.rodando || cronometro.acumulado > 0);
    p.rota = rota;
    p.concluida = {
      rota,
      em: Date.now(),
      tempo: iniciado ? CD.cronometro.decorrido(cronometro) : null
    };
    CD.jogo.salvarProgresso(p);
    desenharAberto(p.concluida);
    CD.jogo.sincronizarAcertos().then(desenharStatusChegada);
  }

  // Mostra a colocação registrada no ranking, atualizada em tempo real.
  let grupos = [];
  let chegadas = {};
  let falhou = false;
  CD.store.onGrupos((lista) => { grupos = lista; desenharStatusChegada(); });
  CD.store.onChegadas((c) => { chegadas = c; desenharStatusChegada(); });

  function desenharStatusChegada(ok) {
    if (ok === false) falhou = true;
    if (ok === true) falhou = false;
    const el = $("#status-chegada");
    if (!el) return;
    const p = CD.jogo.progresso();
    if (!p.grupo) {
      el.innerHTML = `<p style="margin: 0">Mostrem esta tela à monitora para registrar a chegada no ranking.</p>`;
      return;
    }
    const placar = CD.placares(grupos, {}, chegadas)[p.grupo.id];
    if (placar && placar.chegada) {
      el.innerHTML = `<div class="pontos-ganhos">🏁 ${esc(p.grupo.nome)} chegou em ${placar.chegada.colocacao}º lugar${placar.bonus ? ` · +${placar.bonus} pontos de bônus` : ""}</div>
        <p style="margin: 0; color: var(--texto-suave)">A chegada já está no ranking.</p>`;
    } else if (falhou) {
      el.innerHTML = `<div class="aviso aviso--erro" style="margin: 0">Não conseguimos registrar a chegada agora. Mostrem esta tela à monitora.</div>
        <button class="botao botao--fantasma botao--pequeno" id="tentar-chegada" style="margin-top: 10px">Tentar de novo</button>`;
      $("#tentar-chegada").addEventListener("click", () => CD.jogo.sincronizarAcertos().then(desenharStatusChegada));
    } else {
      el.innerHTML = `<p style="margin: 0">Registrando a chegada de <strong>${esc(p.grupo.nome)}</strong> no ranking...</p>`;
    }
  }

  function desenharAberto(chegada) {
    window.scrollTo(0, 0);
    const rota = rotas[chegada.rota];
    const hora = new Date(chegada.em).toLocaleTimeString("pt-BR");
    alvo.innerHTML = `
      <section class="legado-restaurado sucesso tema-${chegada.rota}">
        <span class="rotulo">Missão concluída · ${esc(rota.nome)}</span>
        <h2>Legado restaurado</h2>
        <div class="sucesso__fragmento">${esc(rota.codigo)}</div>
        <div class="cartao chegada">
          <span class="rotulo">${chegada.tempo !== null ? "Tempo da equipe" : "Horário de chegada"}</span>
          <div class="chegada__tempo">${chegada.tempo !== null ? formatarTempo(chegada.tempo) : esc(hora)}</div>
          <div id="status-chegada"></div>
        </div>
      </section>

      <article class="cartao" style="margin-top: 24px">
        <span class="rotulo">Último registro recuperado</span>
        <h2>${esc(final.titulo)}</h2>
        <p>${esc(final.texto)}</p>
        <ul class="nomes-eniac">${final.nomes.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>
      </article>

      <article class="cartao" style="margin-top: 20px">
        <span class="rotulo">Bastidores</span>
        <p>${esc(final.bastidores)}</p>
        <blockquote class="citacao">${esc(final.mensagem)}</blockquote>
      </article>

      <div class="linha" style="margin-top: 24px">
        <a class="botao botao--rosa" href="${esc(CD.config.urlCursos)}" target="_blank" rel="noopener">Conhecer os cursos de tecnologia</a>
        <a class="botao botao--fantasma" href="ranking.html">Ver ranking</a>
      </div>`;
    desenharStatusChegada();
  }

  const salvo = CD.jogo.progresso().concluida;
  if (salvo && rotas[salvo.rota]) desenharAberto(salvo); else desenharCadeado();
  CD.jogo.sincronizarAcertos().then(desenharStatusChegada);
});
