/*
 * Camada de dados: grupos, pontuações, acertos, cronômetro e perguntas criadas pelas admins.
 *
 * Modo Firebase: usa o Realtime Database e sincroniza todos os aparelhos.
 * Modo local: usa o localStorage e sincroniza apenas as abas do mesmo navegador.
 */
window.CD = window.CD || {};

(function () {
  const VERSAO_FIREBASE = "10.12.2";
  const CHAVE_GRUPOS = "cd:grupos";
  const CHAVE_CRONOMETRO = "cd:cronometro";
  const CHAVE_ADMIN = "cd:admin";
  const CHAVE_CONTEUDO = "cd:conteudo";
  const CHAVE_ACERTOS = "cd:acertos";
  const CHAVE_CHEGADAS = "cd:chegadas";

  const cfg = CD.config.firebase || {};
  const usarFirebase = Boolean(cfg.apiKey && cfg.databaseURL);

  const cronometroPadrao = () => ({
    duracao: CD.config.duracaoPadraoMinutos * 60000,
    rodando: false,
    inicio: null,
    acumulado: 0
  });

  function carregarScript(src) {
    return new Promise((ok, falha) => {
      const s = document.createElement("script");
      s.src = src;
      s.onload = ok;
      s.onerror = () => falha(new Error("Não foi possível carregar " + src));
      document.head.appendChild(s);
    });
  }

  function listaDeGrupos(obj) {
    return Object.entries(obj || {}).map(([id, g]) => ({ id, ...g }));
  }

  function novoId() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }

  /* ---------------- Modo local ---------------- */
  function criarLocal() {
    const ouvintes = { grupos: [], cronometro: [], auth: [], conteudo: [], acertos: [], chegadas: [] };

    function ler(chave, padrao) {
      try { return JSON.parse(localStorage.getItem(chave)) || padrao; } catch (e) { return padrao; }
    }
    function gravar(chave, valor) {
      localStorage.setItem(chave, JSON.stringify(valor));
      avisar(chave);
    }
    function avisar(chave) {
      if (chave === CHAVE_GRUPOS) ouvintes.grupos.forEach((cb) => cb(listaDeGrupos(ler(CHAVE_GRUPOS, {}))));
      if (chave === CHAVE_CRONOMETRO) ouvintes.cronometro.forEach((cb) => cb(ler(CHAVE_CRONOMETRO, cronometroPadrao())));
      if (chave === CHAVE_CONTEUDO) ouvintes.conteudo.forEach((cb) => cb(ler(CHAVE_CONTEUDO, null)));
      if (chave === CHAVE_ACERTOS) ouvintes.acertos.forEach((cb) => cb(ler(CHAVE_ACERTOS, {})));
      if (chave === CHAVE_CHEGADAS) ouvintes.chegadas.forEach((cb) => cb(ler(CHAVE_CHEGADAS, {})));
    }
    // Outras abas do mesmo navegador recebem o evento "storage".
    window.addEventListener("storage", (e) => avisar(e.key));

    function adminLogado() {
      try { return sessionStorage.getItem(CHAVE_ADMIN) === "1"; } catch (e) { return false; }
    }
    function inscrever(lista, cb, valorInicial) {
      lista.push(cb);
      cb(valorInicial());
      return () => lista.splice(lista.indexOf(cb), 1);
    }

    return {
      modo: "local",
      pronto: Promise.resolve(),
      agora: () => Date.now(),

      onGrupos: (cb) => inscrever(ouvintes.grupos, cb, () => listaDeGrupos(ler(CHAVE_GRUPOS, {}))),
      onCronometro: (cb) => inscrever(ouvintes.cronometro, cb, () => ler(CHAVE_CRONOMETRO, cronometroPadrao())),
      onAuth: (cb) => inscrever(ouvintes.auth, cb, () => (adminLogado() ? { nome: "Admin" } : null)),

      async login(_email, senha) {
        if (senha !== CD.config.pinAdminLocal) throw new Error("Senha incorreta.");
        sessionStorage.setItem(CHAVE_ADMIN, "1");
        ouvintes.auth.forEach((cb) => cb({ nome: "Admin" }));
      },
      async logout() {
        sessionStorage.removeItem(CHAVE_ADMIN);
        ouvintes.auth.forEach((cb) => cb(null));
      },

      async adicionarGrupo(dados) {
        const grupos = ler(CHAVE_GRUPOS, {});
        grupos[novoId()] = { ...dados, pontos: 0, criadoEm: Date.now() };
        gravar(CHAVE_GRUPOS, grupos);
      },
      async alterarPontos(id, delta) {
        const grupos = ler(CHAVE_GRUPOS, {});
        if (!grupos[id]) return;
        grupos[id].pontos = (grupos[id].pontos || 0) + delta;
        grupos[id].atualizadoEm = Date.now();
        gravar(CHAVE_GRUPOS, grupos);
      },
      async atualizarGrupo(id, campos) {
        const grupos = ler(CHAVE_GRUPOS, {});
        if (!grupos[id]) return;
        grupos[id] = { ...grupos[id], ...campos, atualizadoEm: Date.now() };
        gravar(CHAVE_GRUPOS, grupos);
      },
      async removerGrupo(id) {
        const grupos = ler(CHAVE_GRUPOS, {});
        delete grupos[id];
        gravar(CHAVE_GRUPOS, grupos);
        [CHAVE_ACERTOS, CHAVE_CHEGADAS].forEach((chave) => {
          const dados = ler(chave, {});
          delete dados[id];
          gravar(chave, dados);
        });
      },
      async limparGrupos() {
        gravar(CHAVE_GRUPOS, {});
        gravar(CHAVE_ACERTOS, {});
        gravar(CHAVE_CHEGADAS, {});
      },

      // Acertos registrados pelos celulares: { grupoId: { estacaoId: horário } }.
      onAcertos: (cb) => inscrever(ouvintes.acertos, cb, () => ler(CHAVE_ACERTOS, {})),
      async registrarAcerto(grupoId, estacaoId) {
        const acertos = ler(CHAVE_ACERTOS, {});
        acertos[grupoId] = acertos[grupoId] || {};
        if (acertos[grupoId][estacaoId]) return;
        acertos[grupoId][estacaoId] = Date.now();
        gravar(CHAVE_ACERTOS, acertos);
      },

      // Chegadas ao tesouro: { grupoId: { em, rota, tempo } }. Só a primeira vale.
      onChegadas: (cb) => inscrever(ouvintes.chegadas, cb, () => ler(CHAVE_CHEGADAS, {})),
      async registrarChegada(grupoId, dados) {
        const chegadas = ler(CHAVE_CHEGADAS, {});
        if (chegadas[grupoId]) return;
        chegadas[grupoId] = { ...dados, em: Date.now() };
        gravar(CHAVE_CHEGADAS, chegadas);
      },
      async removerChegada(grupoId) {
        const chegadas = ler(CHAVE_CHEGADAS, {});
        delete chegadas[grupoId];
        gravar(CHAVE_CHEGADAS, chegadas);
      },
      async salvarCronometro(estado) { gravar(CHAVE_CRONOMETRO, estado); },

      // Estações criadas pelas admins. null significa "usar o conteúdo padrão".
      lerConteudo: async () => ler(CHAVE_CONTEUDO, null),
      onConteudo: (cb) => inscrever(ouvintes.conteudo, cb, () => ler(CHAVE_CONTEUDO, null)),
      async salvarConteudo(estacoes) { gravar(CHAVE_CONTEUDO, estacoes); },
      async restaurarConteudo() {
        localStorage.removeItem(CHAVE_CONTEUDO);
        avisar(CHAVE_CONTEUDO);
      }
    };
  }

  /* ---------------- Modo Firebase ---------------- */
  function criarFirebase() {
    let db = null;
    let auth = null;
    let diferencaRelogio = 0;
    const base = `https://www.gstatic.com/firebasejs/${VERSAO_FIREBASE}/`;

    const pronto = carregarScript(base + "firebase-app-compat.js")
      .then(() => Promise.all([
        carregarScript(base + "firebase-database-compat.js"),
        carregarScript(base + "firebase-auth-compat.js")
      ]))
      .then(() => {
        firebase.initializeApp(cfg);
        db = firebase.database();
        auth = firebase.auth();
        // Corrige a diferença entre o relógio do aparelho e o do servidor,
        // para que o cronômetro mostre o mesmo tempo em todos os celulares.
        db.ref(".info/serverTimeOffset").on("value", (s) => { diferencaRelogio = s.val() || 0; });
      });

    // Remove caminhos ligados aos grupos. Uma falha aqui não impede a remoção do grupo.
    async function limparExtras(caminhos) {
      const falhas = [];
      for (const caminho of caminhos) {
        try { await db.ref(caminho).remove(); } catch (e) { falhas.push(caminho); }
      }
      if (falhas.length) console.warn("Não foi possível limpar " + falhas.join(", ") + ". Confira as regras do Firebase.");
    }

    function depois(fn) {
      let cancelar = () => {};
      let cancelado = false;
      pronto.then(() => { if (!cancelado) cancelar = fn() || cancelar; });
      return () => { cancelado = true; cancelar(); };
    }

    return {
      modo: "firebase",
      pronto,
      agora: () => Date.now() + diferencaRelogio,

      onGrupos: (cb) => depois(() => {
        const ref = db.ref("grupos");
        const h = ref.on("value", (s) => cb(listaDeGrupos(s.val())));
        return () => ref.off("value", h);
      }),
      onCronometro: (cb) => depois(() => {
        const ref = db.ref("cronometro");
        const h = ref.on("value", (s) => cb(s.val() || cronometroPadrao()));
        return () => ref.off("value", h);
      }),
      onAuth: (cb) => depois(() => auth.onAuthStateChanged((u) => cb(u ? { nome: u.email } : null))),

      async login(email, senha) {
        await pronto;
        try {
          await auth.signInWithEmailAndPassword(email, senha);
        } catch (e) {
          throw new Error("E-mail ou senha incorretos.");
        }
      },
      async logout() { await pronto; await auth.signOut(); },

      async adicionarGrupo(dados) {
        await pronto;
        await db.ref("grupos").push({ ...dados, pontos: 0, criadoEm: firebase.database.ServerValue.TIMESTAMP });
      },
      async alterarPontos(id, delta) {
        await pronto;
        await db.ref("grupos/" + id).update({
          pontos: firebase.database.ServerValue.increment(delta),
          atualizadoEm: firebase.database.ServerValue.TIMESTAMP
        });
      },
      async atualizarGrupo(id, campos) {
        await pronto;
        await db.ref("grupos/" + id).update({ ...campos, atualizadoEm: firebase.database.ServerValue.TIMESTAMP });
      },
      // Apaga o grupo primeiro e depois os acertos e a chegada dele, separadamente:
      // assim a remoção funciona mesmo que as regras publicadas no Firebase estejam desatualizadas.
      async removerGrupo(id) {
        await pronto;
        await db.ref("grupos/" + id).remove();
        await limparExtras(["acertos/" + id, "chegadas/" + id]);
      },
      async limparGrupos() {
        await pronto;
        await db.ref("grupos").remove();
        await limparExtras(["acertos", "chegadas"]);
      },

      // Acertos registrados pelos celulares: { grupoId: { estacaoId: horário } }.
      onAcertos: (cb) => depois(() => {
        const ref = db.ref("acertos");
        const h = ref.on("value", (s) => cb(s.val() || {}));
        return () => ref.off("value", h);
      }),
      // A transação só grava se a estação ainda não foi contada para o grupo.
      async registrarAcerto(grupoId, estacaoId) {
        await pronto;
        await db.ref(`acertos/${grupoId}/${estacaoId}`)
          .transaction((atual) => (atual === null ? firebase.database.ServerValue.TIMESTAMP : undefined));
      },

      // Chegadas ao tesouro: { grupoId: { em, rota, tempo } }. Só a primeira vale.
      onChegadas: (cb) => depois(() => {
        const ref = db.ref("chegadas");
        const h = ref.on("value", (s) => cb(s.val() || {}));
        return () => ref.off("value", h);
      }),
      async registrarChegada(grupoId, dados) {
        await pronto;
        const registro = { rota: dados.rota, em: firebase.database.ServerValue.TIMESTAMP };
        if (typeof dados.tempo === "number") registro.tempo = Math.round(dados.tempo);
        await db.ref("chegadas/" + grupoId).transaction((atual) => (atual === null ? registro : undefined));
      },
      async removerChegada(grupoId) { await pronto; await db.ref("chegadas/" + grupoId).remove(); },
      async salvarCronometro(estado) { await pronto; await db.ref("cronometro").set(estado); },

      // Estações criadas pelas admins. null significa "usar o conteúdo padrão".
      async lerConteudo() {
        await pronto;
        return (await db.ref("conteudo/estacoes").once("value")).val();
      },
      onConteudo: (cb) => depois(() => {
        const ref = db.ref("conteudo/estacoes");
        const h = ref.on("value", (s) => cb(s.val()));
        return () => ref.off("value", h);
      }),
      async salvarConteudo(estacoes) { await pronto; await db.ref("conteudo/estacoes").set(estacoes); },
      async restaurarConteudo() { await pronto; await db.ref("conteudo").remove(); }
    };
  }

  CD.store = usarFirebase ? criarFirebase() : criarLocal();
})();
