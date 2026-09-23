(function () {
  const { $, esc, param } = CD.util;
  const { rotas } = CD.conteudo;

  CD.montarTopo();

  const alvo = $("#conteudo");
  const estacao = CD.jogo.estacao(param("id"));

  if (!estacao) {
    alvo.innerHTML = `
      <div class="cartao">
        <h1>Registro não encontrado</h1>
        <p>Este QR Code não corresponde a nenhuma estação. Chamem uma monitora.</p>
        <a class="botao botao--fantasma" href="index.html">Voltar ao início</a>
      </div>`;
    return;
  }

  const rota = rotas[estacao.rota];
  const estacoes = CD.jogo.estacoesDaRota(estacao.rota);
  const numero = estacoes.indexOf(estacao) + 1;
  document.body.classList.add("tema-" + estacao.rota);
  document.title = estacao.pioneira + " · Código Delas";

  let erros = 0;

  function cabecalho() {
    return `
      <div class="registro__cabecalho">
        <span class="etiqueta"><span aria-hidden="true">${rota.simbolo}</span> ${esc(rota.nome)} · Estação ${numero} de ${estacoes.length}</span>
        <span class="etiqueta" style="color: var(--texto-suave)">${esc(estacao.coordenada)}</span>
      </div>`;
  }

  function registro() {
    return `
      <article class="cartao">
        ${cabecalho()}
        <span class="rotulo">Registro recuperado</span>
        <h1 class="registro__nome">${esc(estacao.pioneira)}</h1>
        <div class="registro__meta">${esc(estacao.periodo)} · ${esc(estacao.area)}</div>
        <p>${esc(estacao.contexto)}</p>
        <div class="curiosidade"><strong>Curiosidade:</strong> ${esc(estacao.curiosidade)}</div>
      </article>`;
  }

  function desenharPergunta() {
    alvo.innerHTML = registro() + `
      <section class="cartao" style="margin-top: 20px">
        <span class="rotulo">Desafio</span>
        <h2 class="pergunta">${esc(estacao.pergunta)}</h2>
        <div class="opcoes" id="opcoes">
          ${estacao.opcoes.map((o, i) => `
            <button class="opcao" data-i="${i}">
              <span class="opcao__letra">${"ABCD"[i]}</span><span>${esc(o)}</span>
            </button>`).join("")}
        </div>
        <div id="retorno" aria-live="polite"></div>
      </section>`;

    $("#opcoes").addEventListener("click", (ev) => {
      const botao = ev.target.closest(".opcao");
      if (!botao) return;
      const i = Number(botao.dataset.i);
      if (i === estacao.correta) {
        botao.classList.add("opcao--certa");
        CD.jogo.registrarFragmento(estacao);
        setTimeout(desenharSucesso, 500);
        return;
      }
      erros++;
      botao.classList.add("opcao--errada");
      botao.disabled = true;
      $("#retorno").innerHTML = `
        <div class="aviso aviso--erro">Ainda não. Releiam o registro com atenção e tentem de novo.</div>
        ${erros >= 1 ? `<div class="aviso aviso--dica"><strong>Dica:</strong> ${esc(estacao.dica)}</div>` : ""}`;
    });
  }

  function desenharSucesso() {
    const ultima = !estacao.proxima;
    alvo.innerHTML = `
      <section class="cartao sucesso">
        ${cabecalho()}
        <span class="rotulo">Fragmento recuperado</span>
        <div class="sucesso__fragmento">${esc(estacao.fragmento)}</div>
        <p>Vocês restauraram o registro de <strong>${esc(estacao.pioneira)}</strong>.</p>
        <div class="slots" style="justify-content: center; margin: 16px 0 24px">${CD.jogo.slotsFragmentos(estacao.rota)}</div>
        ${ultima ? `
          <span class="rotulo">Destino final</span>
          <p style="font-size: 20px">${esc(CD.conteudo.final.local)}</p>
          <a class="botao botao--rosa botao--bloco" href="final.html">Abrir o tesouro</a>
        ` : `
          <span class="rotulo">Próxima coordenada</span>
          <div class="coordenada">${esc(estacao.proxima)}</div>
          <p style="color: var(--texto-suave); margin-top: 12px">Procurem o próximo pergaminho com o símbolo ${rota.simbolo}.</p>
          <a class="botao botao--fantasma botao--bloco" href="rota.html?r=${estacao.rota}">Ver progresso da rota</a>
        `}
      </section>
      <details class="cartao" style="margin-top: 20px">
        <summary style="cursor: pointer">Reler o registro de ${esc(estacao.pioneira)}</summary>
        <p style="margin-top: 14px">${esc(estacao.contexto)}</p>
        <p style="margin: 0; color: var(--texto-suave)">${esc(estacao.curiosidade)}</p>
      </details>`;
  }

  function desenharOutraRota(rotaAtual) {
    alvo.innerHTML = `
      <div class="cartao">
        ${cabecalho()}
        <h1>Esta pista é da ${esc(rota.nome)}</h1>
        <p>Vocês estão na <strong>${esc(rotas[rotaAtual].nome)}</strong>. Procurem apenas os pergaminhos com o símbolo
          <strong>${rotas[rotaAtual].simbolo} ${esc(rotas[rotaAtual].forma)}</strong>.</p>
        <div class="linha">
          <a class="botao botao--${rotaAtual}" href="rota.html?r=${rotaAtual}">Voltar para a minha rota</a>
          <button class="botao botao--fantasma" id="continuar">Abrir mesmo assim</button>
        </div>
      </div>`;
    $("#continuar").addEventListener("click", desenharPergunta);
  }

  const progresso = CD.jogo.progresso();
  if (progresso.fragmentos[estacao.id]) {
    desenharSucesso();
  } else if (progresso.rota && progresso.rota !== estacao.rota && Object.keys(progresso.fragmentos).length) {
    desenharOutraRota(progresso.rota);
  } else {
    desenharPergunta();
  }
})();
