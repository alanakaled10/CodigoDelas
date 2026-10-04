(function () {
  const { $, esc, formatarTempo } = CD.util;
  const { rotas } = CD.conteudo;
  const store = CD.store;

  CD.montarTopo(null, true);
  CD.bannerModo($("#modo-banner"));

  const alvo = $("#conteudo");
  let grupos = [];
  let acertos = {};
  let chegadas = {};
  let cronometro = null;
  let cancelar = [];

  store.onAuth((usuario) => {
    cancelar.forEach((fn) => fn());
    cancelar = [];
    if (usuario) desenharPainel(usuario); else desenharLogin();
  });

  /* ---------- Login ---------- */
  function desenharLogin() {
    const local = store.modo === "local";
    alvo.innerHTML = `
      <form class="cartao container--estreito" id="form-login" style="margin: 0 auto; max-width: 440px">
        <span class="rotulo">Área da equipe</span>
        <h1 style="font-size: 32px">Entrar no painel</h1>
        ${local ? "" : `
          <div class="campo"><label for="email">E-mail</label><input id="email" type="email" autocomplete="username" required></div>`}
        <div class="campo"><label for="senha">Senha</label><input id="senha" type="password" autocomplete="current-password" required></div>
        <button class="botao botao--rosa botao--bloco">Entrar</button>
        <div id="erro-login" aria-live="polite"></div>
      </form>`;

    $("#form-login").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await store.login(local ? "" : $("#email").value.trim(), $("#senha").value);
      } catch (e) {
        $("#erro-login").innerHTML = `<div class="aviso aviso--erro">${esc(e.message)}</div>`;
      }
    });
  }

  /* ---------- Painel ---------- */
  function desenharPainel(usuario) {
    alvo.innerHTML = `
      <div class="registro__cabecalho">
        <div>
          <span class="rotulo">Painel da equipe</span>
          <h1 style="font-size: 34px; margin: 0">Controle da oficina</h1>
        </div>
        <div class="linha">
          <a class="botao botao--fantasma botao--pequeno" href="ranking.html" target="_blank">Abrir ranking (telão)</a>
          <a class="botao botao--fantasma botao--pequeno" href="impressao.html" target="_blank">Versão impressa</a>
          <button class="botao botao--fantasma botao--pequeno" id="sair" title="${esc(usuario.nome)}">Sair</button>
        </div>
      </div>

      <div class="abas" role="tablist">
        <button class="aba" role="tab" data-aba="oficina" aria-selected="true">Oficina</button>
        <button class="aba" role="tab" data-aba="perguntas" aria-selected="false">Perguntas</button>
      </div>

      <div id="aba-perguntas" hidden></div>

      <div class="admin-grid" id="aba-oficina">
        <div style="display: grid; gap: 20px">
          <section class="cartao">
            <span class="rotulo">Cronômetro da sessão</span>
            <div class="relogio-admin" id="relogio-admin">--:--</div>
            <div class="controles">
              <button class="botao botao--teal" id="iniciar">Iniciar</button>
              <button class="botao botao--fantasma" id="zerar">Zerar</button>
              <button class="botao botao--fantasma botao--pequeno" id="menos-minuto">− 1 min</button>
              <button class="botao botao--fantasma botao--pequeno" id="mais-minuto">+ 1 min</button>
            </div>
            <form class="linha" id="form-duracao" style="margin-top: 14px">
              <div class="campo"><label for="duracao">Duração (minutos)</label><input id="duracao" type="number" min="1" max="120" required></div>
              <button class="botao botao--fantasma botao--pequeno">Definir</button>
            </form>
          </section>

          <form class="cartao" id="form-grupo">
            <span class="rotulo">Cadastrar grupo</span>
            <div class="campo"><label for="nome">Nome do grupo</label><input id="nome" maxlength="40" required placeholder="Ex.: As Hoppers"></div>
            <div class="campo">
              <label for="rota">Rota</label>
              <select id="rota">
                ${Object.entries(rotas).map(([id, r]) => `<option value="${id}">${r.simbolo} ${esc(r.nome)}</option>`).join("")}
              </select>
            </div>
            <div class="campo"><label for="sessao">Sessão</label><input id="sessao" maxlength="30" placeholder="Ex.: Manhã 1" list="lista-sessoes"></div>
            <datalist id="lista-sessoes"></datalist>
            <button class="botao botao--rosa botao--bloco">Cadastrar</button>
          </form>
        </div>

        <section class="cartao">
          <div class="registro__cabecalho" style="margin-bottom: 14px">
            <span class="rotulo" style="margin: 0">Grupos e pontuações</span>
            <button class="botao botao--perigo botao--pequeno" id="limpar">Apagar todos</button>
          </div>
          <div class="tabela-grupos" id="grupos"></div>
        </section>
      </div>`;

    $("#sair").addEventListener("click", () => store.logout());
    ligarAbas();
    ligarCronometro();
    ligarGrupos();
    cancelar.push(CD.adminPerguntas($("#aba-perguntas")));
  }

  function ligarAbas() {
    let atual = "oficina";
    try { atual = sessionStorage.getItem("cd:aba") || "oficina"; } catch (e) { /* ignora */ }
    const mostrar = (aba) => {
      document.querySelectorAll(".aba").forEach((b) => b.setAttribute("aria-selected", String(b.dataset.aba === aba)));
      $("#aba-oficina").hidden = aba !== "oficina";
      $("#aba-perguntas").hidden = aba !== "perguntas";
      try { sessionStorage.setItem("cd:aba", aba); } catch (e) { /* ignora */ }
    };
    document.querySelectorAll(".aba").forEach((b) => b.addEventListener("click", () => mostrar(b.dataset.aba)));
    mostrar(atual);
  }

  /* ---------- Cronômetro ---------- */
  function ligarCronometro() {
    cancelar.push(store.onCronometro((c) => {
      cronometro = c;
      if (document.activeElement !== $("#duracao")) $("#duracao").value = Math.round(c.duracao / 60000);
      desenharRelogio();
    }));
    const intervalo = setInterval(desenharRelogio, 250);
    cancelar.push(() => clearInterval(intervalo));

    $("#iniciar").addEventListener("click", () => {
      const c = { ...cronometro };
      if (c.rodando) {
        c.acumulado = CD.cronometro.decorrido(c);
        c.rodando = false;
        c.inicio = null;
      } else {
        if (CD.cronometro.restante(c) === 0) c.acumulado = 0;
        c.rodando = true;
        c.inicio = store.agora();
      }
      store.salvarCronometro(c);
    });

    $("#zerar").addEventListener("click", () => {
      store.salvarCronometro({ ...cronometro, rodando: false, inicio: null, acumulado: 0 });
    });

    const ajustar = (delta) => {
      const duracao = Math.max(60000, cronometro.duracao + delta);
      store.salvarCronometro({ ...cronometro, duracao });
    };
    $("#mais-minuto").addEventListener("click", () => ajustar(60000));
    $("#menos-minuto").addEventListener("click", () => ajustar(-60000));

    $("#form-duracao").addEventListener("submit", (ev) => {
      ev.preventDefault();
      const minutos = Number($("#duracao").value);
      if (minutos > 0) {
        store.salvarCronometro({ ...cronometro, duracao: minutos * 60000 });
        CD.toast("Duração definida: " + minutos + " min");
      }
    });
  }

  function desenharRelogio() {
    const relogio = $("#relogio-admin");
    if (!cronometro || !relogio) return;
    relogio.textContent = formatarTempo(CD.cronometro.restante(cronometro));
    const botao = $("#iniciar");
    botao.textContent = cronometro.rodando ? "Pausar" : (cronometro.acumulado ? "Retomar" : "Iniciar");
    botao.className = "botao " + (cronometro.rodando ? "botao--coral" : "botao--teal");
  }

  /* ---------- Grupos ---------- */
  function ligarGrupos() {
    cancelar.push(store.onGrupos((lista) => {
      grupos = lista.sort((a, b) => (a.criadoEm || 0) - (b.criadoEm || 0));
      desenharGrupos();
    }));
    cancelar.push(store.onAcertos((a) => {
      acertos = a;
      desenharGrupos();
    }));
    cancelar.push(store.onChegadas((c) => {
      chegadas = c;
      desenharGrupos();
    }));

    $("#form-grupo").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const nome = $("#nome").value.trim();
      if (!nome) return;
      await acao(store.adicionarGrupo({ nome, rota: $("#rota").value, sessao: $("#sessao").value.trim() }), "Grupo cadastrado");
      $("#nome").value = "";
      $("#nome").focus();
    });

    $("#limpar").addEventListener("click", () => {
      if (grupos.length && confirm("Apagar TODOS os grupos e pontuações? Isso não pode ser desfeito.")) {
        acao(store.limparGrupos(), "Grupos apagados");
      }
    });

    $("#grupos").addEventListener("click", (ev) => {
      const botao = ev.target.closest("button[data-acao]");
      if (!botao) return;
      const item = botao.closest("[data-id]");
      const id = item.dataset.id;
      const grupo = grupos.find((g) => g.id === id);
      const acaoBotao = botao.dataset.acao;

      if (acaoBotao === "somar") {
        acao(store.alterarPontos(id, Number(botao.dataset.valor)));
      } else if (acaoBotao === "personalizado") {
        const valor = Number(item.querySelector(".entrada").value);
        if (!valor) return;
        acao(store.alterarPontos(id, valor), (valor > 0 ? "+" : "") + valor + " pontos para " + grupo.nome);
        item.querySelector(".entrada").value = "";
      } else if (acaoBotao === "chegada") {
        registrarChegada(grupo);
      } else if (acaoBotao === "desfazer-chegada") {
        desfazerChegada(grupo);
      } else if (acaoBotao === "renomear") {
        const nome = prompt("Novo nome do grupo:", grupo.nome);
        if (nome && nome.trim()) acao(store.atualizarGrupo(id, { nome: nome.trim().slice(0, 40) }));
      } else if (acaoBotao === "remover") {
        if (confirm(`Remover o grupo "${grupo.nome}"?`)) acao(store.removerGrupo(id), "Grupo removido");
      }
    });
  }

  // Registro manual, para quando o celular da equipe não conseguiu registrar sozinho.
  // A colocação e o bônus são calculados pela ordem de chegada dentro da sessão.
  function registrarChegada(grupo) {
    const iniciado = cronometro && (cronometro.rodando || cronometro.acumulado > 0);
    const tempo = iniciado ? CD.cronometro.decorrido(cronometro) : null;
    acao(store.registrarChegada(grupo.id, { rota: grupo.rota, tempo }), `Chegada de ${grupo.nome} registrada`);
  }

  function desfazerChegada(grupo) {
    const placar = CD.placares(grupos, acertos, chegadas)[grupo.id];
    const antigo = !chegadas[grupo.id] && grupo.chegada;
    const bonus = antigo ? grupo.chegada.bonus || 0 : placar.bonus;
    if (!confirm(`Desfazer a chegada de "${grupo.nome}"? ${bonus ? `Os ${bonus} pontos de bônus serão retirados. ` : ""}As equipes que chegaram depois sobem uma colocação.`)) return;
    // Registro antigo: o bônus foi somado direto nos pontos do grupo.
    const tarefas = [store.removerChegada(grupo.id)];
    if (grupo.chegada) tarefas.push(store.atualizarGrupo(grupo.id, { chegada: null }));
    if (antigo && bonus) tarefas.push(store.alterarPontos(grupo.id, -bonus));
    acao(Promise.all(tarefas), "Chegada desfeita");
  }

  function desenharGrupos() {
    const sessoes = [...new Set(grupos.map((g) => g.sessao).filter(Boolean))];
    $("#lista-sessoes").innerHTML = sessoes.map((s) => `<option value="${esc(s)}">`).join("");

    const alvoGrupos = $("#grupos");
    // Preserva o que estava sendo digitado nos campos de pontos ao redesenhar.
    const digitados = {};
    alvoGrupos.querySelectorAll("[data-id] .entrada").forEach((el) => {
      if (el.value) digitados[el.closest("[data-id]").dataset.id] = el.value;
    });
    const focado = document.activeElement && document.activeElement.closest && document.activeElement.closest("#grupos [data-id]");
    const idFocado = focado && document.activeElement.classList.contains("entrada") ? focado.dataset.id : null;

    if (!grupos.length) {
      alvoGrupos.innerHTML = `<div class="vazio">Nenhum grupo cadastrado.</div>`;
      return;
    }
    const placares = CD.placares(grupos, acertos, chegadas);
    alvoGrupos.innerHTML = grupos.map((g) => {
      const rota = rotas[g.rota];
      const placar = placares[g.id];
      return `
        <div class="grupo-admin ${rota ? "tema-" + g.rota : ""}" data-id="${esc(g.id)}">
          <div class="grupo-admin__topo">
            <div>
              <div class="grupo-admin__nome">${esc(g.nome)}</div>
              <div class="ranking__info">
                ${rota ? `<span class="pilula-rota">${rota.simbolo} ${esc(rota.nome)}</span>` : ""}
                ${g.sessao ? `<span>${esc(g.sessao)}</span>` : ""}
                ${placar.chegada ? `<span class="pilula-chegada">${esc(CD.textoChegada(placar.chegada))}</span>` : ""}
              </div>
            </div>
            <div class="grupo-admin__pontos" title="Pontos automáticos + pontos do painel">
              ${placar.total} <small style="font-size: 14px; color: var(--texto-suave)">pts</small>
              <div class="grupo-admin__detalhe">${placar.acertos} ${placar.acertos === 1 ? "acerto" : "acertos"} (${placar.automaticos}) + painel (${placar.manuais})${placar.bonus ? ` + chegada (${placar.bonus})` : ""}</div>
            </div>
          </div>
          <div class="grupo-admin__acoes">
            ${placar.chegada
              ? `<button class="botao botao--fantasma botao--pequeno" data-acao="desfazer-chegada">Desfazer chegada</button>`
              : `<button class="botao botao--rosa botao--pequeno" data-acao="chegada">🏁 Registrar chegada</button>`}
            <button class="botao botao--teal botao--pequeno" data-acao="somar" data-valor="10">+10</button>
            <button class="botao botao--teal botao--pequeno" data-acao="somar" data-valor="5">+5</button>
            <button class="botao botao--fantasma botao--pequeno" data-acao="somar" data-valor="-5">−5</button>
            <input class="entrada" type="number" placeholder="±pts" aria-label="Pontos personalizados para ${esc(g.nome)}">
            <button class="botao botao--fantasma botao--pequeno" data-acao="personalizado">Aplicar</button>
            <span style="flex: 1"></span>
            <button class="botao botao--fantasma botao--pequeno" data-acao="renomear">Renomear</button>
            <button class="botao botao--perigo botao--pequeno" data-acao="remover">Remover</button>
          </div>
        </div>`;
    }).join("");

    Object.entries(digitados).forEach(([id, valor]) => {
      const el = alvoGrupos.querySelector(`[data-id="${CSS.escape(id)}"] .entrada`);
      if (el) el.value = valor;
    });
    if (idFocado) {
      const el = alvoGrupos.querySelector(`[data-id="${CSS.escape(idFocado)}"] .entrada`);
      if (el) el.focus();
    }
  }

  async function acao(promessa, mensagem) {
    try {
      await promessa;
      if (mensagem) CD.toast(mensagem);
    } catch (e) {
      alert("Não foi possível salvar: " + e.message);
    }
  }
})();
