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
    // início de cada rota, próxima coordenada de cada estação e código final.
    aplicarEstacoes(lista) {
      const c = CD.conteudo;
      const validas = (lista || []).filter((e) => e && e.id && c.rotas[e.rota]);
      c.estacoes = validas.sort((a, b) => (a.ordem || 0) - (b.ordem || 0));
      const partes = [];
      Object.entries(c.rotas).forEach(([id, rota]) => {
        const daRota = c.estacoes.filter((e) => e.rota === id);
        daRota.forEach((e, i) => {
          e.ordem = i + 1;
          e.proxima = daRota[i + 1] ? daRota[i + 1].coordenada : null;
        });
        rota.estacoes = daRota.map((e) => e.id);
        rota.inicio = daRota[0] ? daRota[0].coordenada : "?";
        partes.push(daRota.map((e) => e.fragmento).join(""));
      });
      c.codigoFinal = partes.filter(Boolean).join(" ");
    },

    estacao(id) { return CD.conteudo.estacoes.find((e) => e.id === id); },

    estacoesDaRota(rota) {
      return CD.conteudo.rotas[rota].estacoes.map((id) => CD.jogo.estacao(id));
    },

    progresso() {
      try {
        return JSON.parse(localStorage.getItem(PROGRESSO)) || { rota: null, fragmentos: {} };
      } catch (e) {
        return { rota: null, fragmentos: {} };
      }
    },

    salvarProgresso(p) {
      try { localStorage.setItem(PROGRESSO, JSON.stringify(p)); } catch (e) { /* navegador sem armazenamento */ }
    },

    escolherRota(rota) {
      const p = CD.jogo.progresso();
      if (p.rota !== rota) {
        p.rota = rota;
        p.fragmentos = {};
      }
      CD.jogo.salvarProgresso(p);
    },

    registrarFragmento(estacao) {
      const p = CD.jogo.progresso();
      p.rota = p.rota || estacao.rota;
      p.fragmentos[estacao.id] = estacao.fragmento;
      CD.jogo.salvarProgresso(p);
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

  CD.cronometro = {
    decorrido(c) {
      return (c.acumulado || 0) + (c.rodando && c.inicio ? CD.store.agora() - c.inicio : 0);
    },
    restante(c) {
      return Math.max(0, c.duracao - CD.cronometro.decorrido(c));
    }
  };
})();
