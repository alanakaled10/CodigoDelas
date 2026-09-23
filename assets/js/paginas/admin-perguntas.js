/*
 * Aba "Perguntas" do painel admin: criar, editar, reordenar e remover estações.
 * Tudo é salvo no banco (Firebase) e substitui o conteúdo padrão de conteudo.js.
 */
window.CD = window.CD || {};

CD.adminPerguntas = function (alvo) {
  const { esc } = CD.util;
  const { rotas } = CD.conteudo;
  const store = CD.store;
  const LETRAS = "ABCD";

  let estacoes = [];
  let personalizado = false;
  let editando = null; // estação em edição (cópia) ou null

  const cancelar = store.onConteudo((salvo) => {
    const lista = Object.values(salvo || {});
    personalizado = lista.length > 0;
    estacoes = (personalizado ? lista : JSON.parse(JSON.stringify(CD.estacoesPadrao)))
      .map(({ proxima, ...e }) => e);
    ordenar();
    if (!editando) desenhar();
  });

  function ordenar() {
    estacoes.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
    Object.keys(rotas).forEach((r) => {
      estacoes.filter((e) => e.rota === r).forEach((e, i) => { e.ordem = i + 1; });
    });
  }

  function daRota(r) { return estacoes.filter((e) => e.rota === r); }

  function codigoFinal() {
    return Object.keys(rotas).map((r) => daRota(r).map((e) => e.fragmento).join("")).filter(Boolean).join(" ");
  }

  function novoId() {
    const chars = "abcdefghjkmnpqrstuvwxyz23456789";
    let id;
    do {
      id = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    } while (estacoes.some((e) => e.id === id));
    return id;
  }

  async function salvar(mensagem) {
    ordenar();
    const mapa = {};
    estacoes.forEach((e) => { mapa[e.id] = e; });
    try {
      await store.salvarConteudo(mapa);
      if (mensagem) CD.toast(mensagem);
      return true;
    } catch (e) {
      alert("Não foi possível salvar: " + e.message);
      return false;
    }
  }

  /* ---------- Lista ---------- */
  function desenhar() {
    alvo.innerHTML = `
      <div class="aviso ${store.modo === "local" ? "aviso--dica" : "aviso--info"}" style="margin: 0 0 20px">
        ${store.modo === "local"
          ? "<strong>Modo local:</strong> as perguntas ficam salvas só neste navegador. Para aparecerem nos celulares das participantes, configure o Firebase (veja o README)."
          : "As perguntas salvas aqui aparecem na hora para todas as participantes, no gabarito e na versão impressa."}
      </div>

      <div class="registro__cabecalho">
        <div>
          <span class="rotulo">Código final atual</span>
          <div class="codigo-atual">${esc(codigoFinal()) || "nenhum"}</div>
        </div>
        <div class="linha">
          <span class="etiqueta" style="color: var(--texto-suave)">${personalizado ? "Perguntas personalizadas" : "Usando as perguntas padrão"}</span>
          ${personalizado ? `<button class="botao botao--perigo botao--pequeno" data-acao="restaurar">Restaurar padrão</button>` : ""}
        </div>
      </div>

      <div class="grade-rotas">
        ${Object.entries(rotas).map(([r, rota]) => `
          <section class="cartao tema-${r}">
            <div class="registro__cabecalho" style="margin-bottom: 14px">
              <h2 style="margin: 0; color: var(--cor-rota); font-size: 24px">${rota.simbolo} ${esc(rota.nome)}</h2>
              <button class="botao botao--${r} botao--pequeno" data-acao="nova" data-rota="${r}">+ Nova estação</button>
            </div>
            <div class="lista-estacoes">
              ${daRota(r).length ? daRota(r).map((e, i, todas) => `
                <article class="estacao-admin" data-id="${esc(e.id)}">
                  <div class="estacao-admin__ordem">${e.ordem}</div>
                  <div class="estacao-admin__corpo">
                    <div class="estacao-admin__titulo">${esc(e.pioneira)}</div>
                    <div class="ranking__info">
                      <span>Coord. <strong>${esc(e.coordenada)}</strong></span>
                      <span>Fragmento <strong>${esc(e.fragmento)}</strong></span>
                      <span>código ${esc(e.id)}</span>
                    </div>
                    <p class="estacao-admin__pergunta">${esc(e.pergunta)}</p>
                  </div>
                  <div class="estacao-admin__acoes">
                    <button class="botao botao--fantasma botao--pequeno" data-acao="subir" ${i === 0 ? "disabled" : ""} aria-label="Mover para cima">↑</button>
                    <button class="botao botao--fantasma botao--pequeno" data-acao="descer" ${i === todas.length - 1 ? "disabled" : ""} aria-label="Mover para baixo">↓</button>
                    <button class="botao botao--fantasma botao--pequeno" data-acao="editar">Editar</button>
                    <a class="botao botao--fantasma botao--pequeno" href="estacao.html?id=${encodeURIComponent(e.id)}" target="_blank">Ver</a>
                    <button class="botao botao--perigo botao--pequeno" data-acao="remover">Remover</button>
                  </div>
                </article>`).join("") : `<div class="vazio">Nenhuma estação nesta rota.</div>`}
            </div>
          </section>`).join("")}
      </div>`;
  }

  alvo.addEventListener("click", async (ev) => {
    const botao = ev.target.closest("button[data-acao]");
    if (!botao) return;
    const acao = botao.dataset.acao;
    const item = botao.closest("[data-id]");
    const estacao = item && estacoes.find((e) => e.id === item.dataset.id);

    if (acao === "nova") {
      const rota = botao.dataset.rota;
      editando = {
        id: novoId(), rota, ordem: daRota(rota).length + 1, coordenada: "", pioneira: "", periodo: "", area: "",
        contexto: "", curiosidade: "", pergunta: "", opcoes: ["", "", "", ""], correta: 0, dica: "", fragmento: "", nova: true
      };
      desenharFormulario();
    } else if (acao === "editar") {
      editando = JSON.parse(JSON.stringify(estacao));
      desenharFormulario();
    } else if (acao === "subir" || acao === "descer") {
      const lista = daRota(estacao.rota);
      const i = lista.indexOf(estacao);
      const outra = lista[acao === "subir" ? i - 1 : i + 1];
      if (!outra) return;
      [estacao.ordem, outra.ordem] = [outra.ordem, estacao.ordem];
      await salvar();
    } else if (acao === "remover") {
      if (!confirm(`Remover a estação "${estacao.pioneira}"? O QR Code dela vai parar de funcionar.`)) return;
      estacoes = estacoes.filter((e) => e !== estacao);
      if (!estacoes.length) {
        alert("O jogo precisa de pelo menos uma estação.");
        estacoes.push(estacao);
        return;
      }
      await salvar("Estação removida");
    } else if (acao === "restaurar") {
      if (!confirm("Apagar todas as perguntas personalizadas e voltar às perguntas padrão? QR Codes de estações novas vão parar de funcionar.")) return;
      try {
        await store.restaurarConteudo();
        CD.toast("Perguntas padrão restauradas");
      } catch (e) {
        alert("Não foi possível restaurar: " + e.message);
      }
    }
  });

  /* ---------- Formulário ---------- */
  function desenharFormulario() {
    const e = editando;
    const opcoes = [0, 1, 2, 3].map((i) => e.opcoes[i] || "");
    alvo.innerHTML = `
      <form class="cartao tema-${e.rota}" id="form-estacao" novalidate>
        <div class="registro__cabecalho">
          <div>
            <span class="rotulo">${e.nova ? "Nova estação" : "Editar estação"} · código ${esc(e.id)}</span>
            <h2 style="margin: 0; font-size: 28px">${e.nova ? "Criar pergunta" : esc(e.pioneira)}</h2>
          </div>
          <button type="button" class="botao botao--fantasma botao--pequeno" data-form="cancelar">Voltar sem salvar</button>
        </div>

        <fieldset class="bloco-form">
          <legend>Onde fica</legend>
          <div class="linha">
            <div class="campo">
              <label for="f-rota">Rota</label>
              <select id="f-rota">
                ${Object.entries(rotas).map(([r, rota]) => `<option value="${r}" ${r === e.rota ? "selected" : ""}>${rota.simbolo} ${esc(rota.nome)}</option>`).join("")}
              </select>
            </div>
            <div class="campo">
              <label for="f-coordenada">Coordenada na sala *</label>
              <input id="f-coordenada" maxlength="6" value="${esc(e.coordenada)}" placeholder="Ex.: B3" required>
            </div>
            <div class="campo">
              <label for="f-fragmento">Fragmento do código *</label>
              <input id="f-fragmento" maxlength="6" value="${esc(e.fragmento)}" placeholder="Ex.: LE" required>
            </div>
          </div>
        </fieldset>

        <fieldset class="bloco-form">
          <legend>Registro da pioneira</legend>
          <div class="campo"><label for="f-pioneira">Nome *</label><input id="f-pioneira" maxlength="60" value="${esc(e.pioneira)}" required></div>
          <div class="linha">
            <div class="campo"><label for="f-periodo">Período e país</label><input id="f-periodo" maxlength="60" value="${esc(e.periodo)}" placeholder="Ex.: 1815 a 1852 · Inglaterra"></div>
            <div class="campo"><label for="f-area">Área</label><input id="f-area" maxlength="60" value="${esc(e.area)}" placeholder="Ex.: Matemática e algoritmos"></div>
          </div>
          <div class="campo">
            <label for="f-contexto">Texto do registro * <span class="contador" data-para="f-contexto"></span></label>
            <textarea id="f-contexto" rows="4" maxlength="600" required placeholder="Até 60 palavras. A resposta da pergunta precisa estar aqui.">${esc(e.contexto)}</textarea>
          </div>
          <div class="campo">
            <label for="f-curiosidade">Curiosidade</label>
            <textarea id="f-curiosidade" rows="2" maxlength="300">${esc(e.curiosidade)}</textarea>
          </div>
        </fieldset>

        <fieldset class="bloco-form">
          <legend>Desafio</legend>
          <div class="campo"><label for="f-pergunta">Pergunta *</label><input id="f-pergunta" maxlength="160" value="${esc(e.pergunta)}" required></div>
          <p class="ajuda">Preencha de 2 a 4 alternativas e marque a correta.</p>
          <div class="lista-opcoes">
            ${opcoes.map((o, i) => `
              <label class="opcao-form">
                <input type="radio" name="f-correta" value="${i}" ${i === e.correta ? "checked" : ""} aria-label="Alternativa ${LETRAS[i]} é a correta">
                <span class="opcao__letra">${LETRAS[i]}</span>
                <input class="entrada" id="f-opcao-${i}" maxlength="100" value="${esc(o)}" placeholder="Alternativa ${LETRAS[i]}">
              </label>`).join("")}
          </div>
          <div class="campo" style="margin-top: 14px"><label for="f-dica">Dica (aparece depois de um erro) *</label><input id="f-dica" maxlength="160" value="${esc(e.dica)}" required></div>
        </fieldset>

        <div id="erros-form" aria-live="polite"></div>
        <div class="linha" style="margin-top: 16px">
          <button class="botao botao--rosa">Salvar estação</button>
          <button type="button" class="botao botao--fantasma" data-form="cancelar">Cancelar</button>
        </div>
      </form>`;

    const form = alvo.querySelector("#form-estacao");
    const contexto = form.querySelector("#f-contexto");
    const contador = form.querySelector(".contador");
    const contar = () => {
      const palavras = contexto.value.trim().split(/\s+/).filter(Boolean).length;
      contador.textContent = `(${palavras} palavras)`;
      contador.style.color = palavras > 60 ? "var(--ouro)" : "";
    };
    contexto.addEventListener("input", contar);
    contar();

    form.querySelectorAll('[data-form="cancelar"]').forEach((b) => b.addEventListener("click", () => {
      editando = null;
      desenhar();
    }));

    form.addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const valor = (id) => form.querySelector("#" + id).value.trim();
      const brutas = [0, 1, 2, 3].map((i) => valor("f-opcao-" + i));
      const marcada = Number((form.querySelector('input[name="f-correta"]:checked') || {}).value);

      const erros = [];
      const obrigatorios = { "f-coordenada": "coordenada", "f-fragmento": "fragmento", "f-pioneira": "nome", "f-contexto": "texto do registro", "f-pergunta": "pergunta", "f-dica": "dica" };
      Object.entries(obrigatorios).forEach(([id, nome]) => { if (!valor(id)) erros.push(`Preencha o campo ${nome}.`); });
      if (valor("f-fragmento") && !/^[A-Za-z0-9]+$/.test(valor("f-fragmento"))) erros.push("O fragmento deve ter só letras e números, sem espaços.");
      if (brutas.filter(Boolean).length < 2) erros.push("Preencha pelo menos 2 alternativas.");
      if (!brutas[marcada]) erros.push("A alternativa marcada como correta está vazia.");

      if (erros.length) {
        form.querySelector("#erros-form").innerHTML = `<div class="aviso aviso--erro">${erros.map(esc).join("<br>")}</div>`;
        return;
      }

      // Remove alternativas vazias sem perder qual é a correta.
      const opcoesFinais = [];
      let correta = 0;
      brutas.forEach((o, i) => {
        if (!o) return;
        if (i === marcada) correta = opcoesFinais.length;
        opcoesFinais.push(o);
      });

      const novaRota = valor("f-rota");
      const trocouRota = novaRota !== editando.rota;
      const estacao = {
        id: editando.id,
        rota: novaRota,
        ordem: editando.nova || trocouRota ? daRota(novaRota).length + 1 : editando.ordem,
        coordenada: valor("f-coordenada").toUpperCase(),
        pioneira: valor("f-pioneira"),
        periodo: valor("f-periodo"),
        area: valor("f-area"),
        contexto: valor("f-contexto"),
        curiosidade: valor("f-curiosidade"),
        pergunta: valor("f-pergunta"),
        opcoes: opcoesFinais,
        correta,
        dica: valor("f-dica"),
        fragmento: valor("f-fragmento").toUpperCase()
      };

      const indice = estacoes.findIndex((e) => e.id === estacao.id);
      if (indice >= 0) estacoes[indice] = estacao; else estacoes.push(estacao);
      if (await salvar(editando.nova ? "Estação criada" : "Estação atualizada")) {
        editando = null;
        desenhar();
      }
    });

    form.querySelector("#f-pioneira").focus();
  }

  return cancelar;
};
