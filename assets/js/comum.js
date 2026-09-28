/* Funções compartilhadas por todas as páginas. */
window.CD = window.CD || {};

(function () {
  const PROGRESSO = "cd:progresso";

  CD.util = {
    $(sel, raiz) { return (raiz || document).querySelector(sel); },

    esc(texto) {
      return String(texto ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
      }[c]));
    },

    // Remove acentos, espaços e diferenças entre maiúsculas e minúsculas.
    normalizar(texto) {
      return String(texto || "")
        .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]/gi, "")
        .toUpperCase();
    },

    param(nome) { return new URLSearchParams(location.search).get(nome); },

    urlDe(caminho) {
      const base = CD.config.urlSite || location.href;
      return new URL(caminho, base).href;
    },

    formatarTempo(ms) {
      const total = Math.max(0, Math.ceil(ms / 1000));
      const m = Math.floor(total / 60);
      const s = total % 60;
      return String(m).padStart(2, "0") + ":" + String(s).padStart(2, "0");
    }
  };

  const CACHE_CONTEUDO = "cd:conteudo-cache";

  // Cópia das estações padrão (conteudo.js), usada para restaurar pelo painel.
  CD.estacoesPadrao = JSON.parse(JSON.stringify(CD.conteudo.estacoes));

  CD.jogo = {
    // Organiza as estações por rota e calcula o que depende da ordem:
    // início de cada rota, próxima coordenada de cada estação e a palavra-chave da rota.
    aplicarEstacoes(lista) {
      const c = CD.conteudo;
      const validas = (lista || []).filter((e) => e && e.id && c.rotas[e.rota]);
      c.estacoes = validas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      Object.entries(c.rotas).forEach(([id, rota]) => {
        const daRota = c.estacoes.filter((e) => e.rota === id);
        daRota.forEach((e, i) => {
          e.ordem = i + 1;
          e.proxima = daRota[i + 1] ? daRota[i + 1].coordenada : null;
        });
        rota.estacoes = daRota.map((e) => e.id);
        rota.inicio = daRota[0] ? daRota[0].coordenada : "?";
        rota.codigo = daRota.map((e) => e.fragmento).join("");
      });
    },

    estacao(id) { return CD.conteudo.estacoes.find((e) => e.id === id); },

    estacoesDaRota(rota) {
      return CD.conteudo.rotas[rota].estacoes.map((id) => CD.jogo.estacao(id));
    },

    // Progresso da equipe salvo neste celular. Expira depois de um tempo sem uso,
    // para que a equipe da sessão seguinte comece do zero no mesmo aparelho.
    progresso() {
      const vazio = { rota: null, fragmentos: {} };
      let p;
      try { p = JSON.parse(localStorage.getItem(PROGRESSO)); } catch (e) { p = null; }
      if (!p) return vazio;
      const validade = (CD.config.minutosProgresso || 40) * 60000;
      if (!p.atualizadoEm || Date.now() - p.atualizadoEm > validade) return vazio;
      p.fragmentos = p.fragmentos || {};
      return p;
    },

    salvarProgresso(p) {
      p.atualizadoEm = Date.now();
      try { localStorage.setItem(PROGRESSO, JSON.stringify(p)); } catch (e) { /* navegador sem armazenamento */ }
    },

    escolherRota(rota) {
      const p = CD.jogo.progresso();
      if (p.rota !== rota) {
        p.rota = rota;
        p.fragmentos = {};
        p.concluida = null;
        p.grupo = null;
      }
      CD.jogo.salvarProgresso(p);
    },

    registrarFragmento(estacao) {
      const p = CD.jogo.progresso();
      p.rota = p.rota || estacao.rota;
      p.fragmentos[estacao.id] = estacao.fragmento;
      CD.jogo.salvarProgresso(p);
    },

    // Equipe escolhida neste celular para somar os pontos automaticamente.
    definirGrupo(grupo) {
      const p = CD.jogo.progresso();
      p.grupo = grupo ? { id: grupo.id, nome: grupo.nome } : null;
      p.semGrupo = !grupo;
      if (grupo) p.dono = { id: grupo.id, nome: grupo.nome };
      CD.jogo.salvarProgresso(p);
      if (grupo) CD.jogo.sincronizarAcertos();
    },

    // Envia ao banco todos os acertos deste celular. Pode ser chamado várias vezes:
    // cada estação só é contada uma vez por equipe, e o que falhar sem internet vai na próxima.
    async sincronizarAcertos() {
      const p = CD.jogo.progresso();
      if (!p.grupo || !CD.store || !CD.store.registrarAcerto) return false;
      try {
        await Promise.all(Object.keys(p.fragmentos).map((id) => CD.store.registrarAcerto(p.grupo.id, id)));
        return true;
      } catch (e) {
        return false;
      }
    },

    reiniciar() {
      try { localStorage.removeItem(PROGRESSO); } catch (e) { /* ignora */ }
    },

    // Desenha os espaços dos fragmentos da rota: coletados aparecem, os demais ficam ocultos.
    slotsFragmentos(rota) {
      const p = CD.jogo.progresso();
      return CD.jogo.estacoesDaRota(rota).map((e) => {
        const ok = p.fragmentos[e.id];
        return `<span class="slot ${ok ? "slot--ok" : ""}">${ok ? CD.util.esc(ok) : "?"}</span>`;
      }).join("");
    }
  };

  CD.jogo.aplicarEstacoes(CD.conteudo.estacoes);

  // Carrega as perguntas salvas pelas admins antes de desenhar a página.
  // Sem internet, usa a última versão vista neste aparelho; sem nada salvo, o conteúdo padrão.
  function lerCache() {
    try { return JSON.parse(localStorage.getItem(CACHE_CONTEUDO)); } catch (e) { return null; }
  }
  function estacoesSalvas(obj) {
    const lista = Object.values(obj || {});
    return lista.length ? lista : null;
  }
  CD.conteudoPronto = (async function () {
    if (!CD.store || !CD.store.lerConteudo) return;
    try {
      const limite = new Promise((_, falha) => setTimeout(() => falha(new Error("tempo esgotado")), 6000));
      const salvo = await Promise.race([CD.store.lerConteudo(), limite]);
      const lista = estacoesSalvas(salvo);
      if (lista) CD.jogo.aplicarEstacoes(lista);
      try {
        if (lista) localStorage.setItem(CACHE_CONTEUDO, JSON.stringify(salvo));
        else localStorage.removeItem(CACHE_CONTEUDO);
      } catch (e) { /* ignora */ }
    } catch (e) {
      const lista = estacoesSalvas(lerCache());
      if (lista) CD.jogo.aplicarEstacoes(lista);
    }
  })();

  CD.aoCarregar = function (fn) { CD.conteudoPronto.then(fn); };

  // Chip do cronômetro no topo das páginas do jogo. Só aparece quando a sessão está rodando.
  CD.chipCronometro = function (elemento) {
    if (!elemento || !CD.store) return;
    let estado = null;
    CD.store.onCronometro((c) => { estado = c; desenhar(); });
    setInterval(desenhar, 250);

    function desenhar() {
      if (!estado || (!estado.rodando && !estado.acumulado)) {
        elemento.hidden = true;
        return;
      }
      const restante = CD.cronometro.restante(estado);
      elemento.hidden = false;
      elemento.textContent = CD.util.formatarTempo(restante);
      elemento.classList.toggle("chip-tempo--alerta", restante <= 60000);
    }
  };

  // Monta o topo com a marca, a navegação e o chip do cronômetro.
  CD.montarTopo = function (atual, semCronometro) {
    const alvo = document.getElementById("topo");
    if (!alvo) return;
    const links = [
      ["inicio", "index.html", "Início"],
      ["ranking", "ranking.html", "Ranking"]
    ];
    alvo.className = "topo";
    alvo.innerHTML = `
      <div class="container topo__barra">
        <a class="marca" href="index.html"><span class="marca__icone">&lt;/&gt;</span>Código Delas</a>
        <div class="nav">
          ${links.map(([id, href, nome]) =>
            `<a href="${href}" ${id === atual ? 'aria-current="page"' : ""}>${nome}</a>`).join("")}
          <span class="chip-tempo" id="chip-tempo" hidden aria-label="Tempo restante"></span>
        </div>
      </div>`;
    if (!semCronometro) CD.chipCronometro(document.getElementById("chip-tempo"));
  };

  // Avisa quando o site está no modo local (sem Firebase configurado).
  CD.bannerModo = function (elemento) {
    if (!elemento || CD.store.modo !== "local") return;
    elemento.hidden = false;
    elemento.innerHTML = "<strong>Modo local:</strong> ranking e cronômetro sincronizam só entre abas deste navegador. " +
      "Configure o Firebase para ver em tempo real nos celulares.";
  };

  CD.toast = function (mensagem) {
    const t = document.createElement("div");
    t.className = "toast";
    t.setAttribute("role", "status");
    t.textContent = mensagem;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 2200);
  };

  // Pontuação total de um grupo: pontos das admins + acertos registrados pelos celulares.
  CD.pontuacao = function (grupo, acertos) {
    const n = Object.keys((acertos || {})[grupo.id] || {}).length;
    const porAcerto = CD.config.pontosPorAcerto || 0;
    return { acertos: n, automaticos: n * porAcerto, manuais: grupo.pontos || 0, total: (grupo.pontos || 0) + n * porAcerto };
  };

  // Texto da chegada de um grupo, usado no ranking e no painel.
  CD.textoChegada = function (chegada) {
    if (!chegada) return "";
    const quando = chegada.tempo !== null && chegada.tempo !== undefined
      ? CD.util.formatarTempo(chegada.tempo)
      : new Date(chegada.em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
    return `🏁 ${chegada.colocacao}º a chegar · ${quando}`;
  };

  CD.cronometro = {
    decorrido(c) {
      return (c.acumulado || 0) + (c.rodando && c.inicio ? CD.store.agora() - c.inicio : 0);
    },
    restante(c) {
      return Math.max(0, c.duracao - CD.cronometro.decorrido(c));
    }
  };
})();
