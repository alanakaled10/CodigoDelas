(function () {
  const { $, esc, normalizar } = CD.util;
  const { final, rotas, codigoFinal } = CD.conteudo;

  CD.montarTopo();

  const alvo = $("#conteudo");
  const progresso = CD.jogo.progresso();

  function desenharCadeado() {
    const minhaRota = rotas[progresso.rota] ? progresso.rota : null;
    alvo.innerHTML = `
      <span class="rotulo">Arquivo do Tempo · Registro final</span>
      <h1 style="font-size: clamp(34px, 8vw, 52px)">O tesouro está trancado</h1>
      <p style="color: var(--texto-suave)">
        Cada rota guarda metade do código. Juntem os fragmentos das duas equipes,
        na ordem <strong style="color: var(--teal)">Teal</strong> e depois
        <strong style="color: var(--coral)">Coral</strong>, e digitem a senha.
      </p>

      ${minhaRota ? `
        <div class="cartao tema-${minhaRota}" style="margin: 20px 0">
          <span class="rotulo">Fragmentos da ${esc(rotas[minhaRota].nome)}</span>
          <div class="slots">${CD.jogo.slotsFragmentos(minhaRota)}</div>
        </div>` : ""}

      <form class="cartao" id="form-codigo" style="margin-top: 20px">
        <label class="rotulo" for="codigo">Código final</label>
        <input class="campo-codigo" id="codigo" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="_ _ _ _ _ _">
        <button class="botao botao--rosa botao--bloco" style="margin-top: 14px">Abrir o tesouro</button>
        <div id="retorno" aria-live="polite"></div>
      </form>`;

    $("#form-codigo").addEventListener("submit", (ev) => {
      ev.preventDefault();
      if (normalizar($("#codigo").value) === normalizar(codigoFinal)) {
        desenharAberto();
      } else {
        $("#retorno").innerHTML = `<div class="aviso aviso--erro">O código não abriu o tesouro. Confiram a ordem dos fragmentos das duas rotas.</div>`;
      }
    });
  }

  function desenharAberto() {
    window.scrollTo(0, 0);
    alvo.innerHTML = `
      <section class="legado-restaurado sucesso">
        <span class="rotulo">Missão concluída</span>
        <h2>Legado restaurado</h2>
        <div class="sucesso__fragmento">${esc(codigoFinal)}</div>
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
  }

  desenharCadeado();
})();
