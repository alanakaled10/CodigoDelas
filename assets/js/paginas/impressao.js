(function () {
  const { $, esc, urlDe } = CD.util;
  const { rotas, estacoes, final, codigoFinal, missao } = CD.conteudo;

  if (!CD.config.urlSite && !/^https:/.test(location.href)) {
    $("#aviso-url").textContent = "Atenção: os QR Codes estão apontando para um endereço local. " +
      "Preencha urlSite em assets/js/config.js com o endereço publicado antes de imprimir.";
  }

  function qr(url) {
    const codigo = qrcode(0, "M");
    codigo.addData(url);
    codigo.make();
    return codigo.createSvgTag({ cellSize: 8, margin: 4, scalable: true });
  }

  function cabeca(texto) {
    return `<div class="cabeca"><span class="marca">&lt;/&gt; Código Delas</span><span>${esc(texto)}</span></div>`;
  }

  function nomeRota(id) { return rotas[id] ? rotas[id].nome : ""; }
  function numero(e) { return rotas[e.rota].estacoes.indexOf(e.id) + 1; }

  /* ---------- Cartazes com QR Code ---------- */
  const cartazes = [
    { classe: "geral", simbolo: "&lt;/&gt;", titulo: "Código Delas", sub: missao.titulo + " · Comecem por aqui", url: urlDe("index.html"), nota: "Telão ou entrada da sala" },
    ...Object.entries(rotas).map(([id, r]) => ({
      classe: id, simbolo: r.simbolo, titulo: r.nome, sub: "Início da rota · coordenada " + r.inicio,
      url: urlDe("rota.html?r=" + id), nota: "Entregar à equipe da " + r.nome
    })),
    ...estacoes.map((e) => ({
      classe: e.rota, simbolo: rotas[e.rota].simbolo, titulo: "Registro perdido",
      sub: "Escaneiem para recuperar o registro", coord: e.coordenada,
      url: urlDe("estacao.html?id=" + e.id),
      nota: `${nomeRota(e.rota)} · estação ${numero(e)} · código ${e.id}`
    })),
    { classe: "geral", simbolo: "🔒", titulo: "O Tesouro", sub: "Juntem os fragmentos das duas rotas", url: urlDe("final.html"), nota: "Junto ao tesouro final" },
    { classe: "geral", simbolo: "🏆", titulo: "Ranking ao vivo", sub: "Acompanhem a pontuação", url: urlDe("ranking.html"), nota: "Telão ou mural" }
  ];

  const paginasQr = cartazes.map((c) => `
    <section class="pagina ${c.classe}" data-secao="qr">
      ${cabeca(c.nota)}
      <div class="cartaz">
        <div class="cartaz__simbolo">${c.simbolo}</div>
        <h1 class="cartaz__titulo">${esc(c.titulo)}</h1>
        <div class="cartaz__sub">${esc(c.sub)}</div>
        ${c.coord ? `<div class="coord">${esc(c.coord)}</div>` : ""}
        <div class="cartaz__qr">${qr(c.url)}</div>
        <div class="cartaz__url">${esc(c.url)}</div>
      </div>
    </section>`);

  /* ---------- Pistas impressas (sem respostas) ---------- */
  const paginasPistas = estacoes.map((e) => `
    <section class="pagina ${e.rota}" data-secao="pistas">
      ${cabeca(`${rotas[e.rota].simbolo} ${nomeRota(e.rota)} · Coordenada ${e.coordenada}`)}
      <article class="pista">
        <div class="pista__meta">REGISTRO RECUPERADO · ${esc(e.periodo)} · ${esc(e.area)}</div>
        <h1 class="pista__nome">${esc(e.pioneira)}</h1>
        <p>${esc(e.contexto)}</p>
        <p class="pista__curiosidade"><strong>Curiosidade:</strong> ${esc(e.curiosidade)}</p>
        <h2 class="pista__pergunta">${esc(e.pergunta)}</h2>
        <ol>${e.opcoes.map((o) => `<li>${esc(o)}</li>`).join("")}</ol>
        <div class="pista__rodape">Digam a resposta para a monitora da rota para receber o fragmento do código e a próxima coordenada.</div>
      </article>
    </section>`);

  /* ---------- Gabarito das monitoras ---------- */
  const paginasGabarito = Object.entries(rotas).map(([id, r]) => `
    <section class="pagina ${id}" data-secao="gabarito">
      ${cabeca("Gabarito · uso exclusivo da monitora")}
      <h1>${r.simbolo} ${esc(r.nome)}</h1>
      <p>Começa na coordenada <strong>${esc(r.inicio)}</strong>. Ofereça a dica só se a equipe ficar parada por muito tempo.</p>
      <table class="bloco">
        <thead><tr><th>#</th><th>Coord.</th><th>Pioneira</th><th>Resposta</th><th>Dica</th><th>Fragmento</th><th>Próxima</th></tr></thead>
        <tbody>
          ${CD.jogo.estacoesDaRota(id).map((e, i) => `
            <tr>
              <td class="mono">${i + 1}</td>
              <td class="mono">${esc(e.coordenada)}</td>
              <td>${esc(e.pioneira)}</td>
              <td><strong>${"ABCD"[e.correta]})</strong> ${esc(e.opcoes[e.correta])}</td>
              <td>${esc(e.dica)}</td>
              <td class="mono forte">${esc(e.fragmento)}</td>
              <td class="mono">${esc(e.proxima || "Tesouro")}</td>
            </tr>`).join("")}
        </tbody>
      </table>
      <p>Código final (Teal + Coral):</p>
      <div class="codigo-final">${esc(codigoFinal)}</div>
      <p style="margin-top: 8mm">${esc(final.local)}</p>
    </section>`);

  /* ---------- Planilha mestra ---------- */
  const paginaMestra = `
    <section class="pagina geral" data-secao="mestra">
      ${cabeca("Planilha mestra · montagem da sala")}
      <h1>Planilha mestra</h1>
      <p>Confira cada QR Code com um celular Android e um iPhone antes de cada período.</p>
      <table>
        <thead><tr><th>Etapa</th><th>Rota</th><th>Coord.</th><th>Conteúdo</th><th>Endereço</th><th>Conferido</th></tr></thead>
        <tbody>
          <tr><td>Início</td><td>Todas</td><td class="mono">Telão</td><td>Página inicial</td><td class="url-pequena">${esc(urlDe("index.html"))}</td><td>☐</td></tr>
          ${Object.entries(rotas).map(([id, r]) => `
            <tr class="${id}"><td>Rota</td><td>${esc(r.nome)}</td><td class="mono">${esc(r.inicio)}</td><td>Início da rota</td><td class="url-pequena">${esc(urlDe("rota.html?r=" + id))}</td><td>☐</td></tr>`).join("")}
          ${estacoes.map((e) => `
            <tr class="${e.rota}"><td>Estação ${numero(e)}</td><td>${esc(nomeRota(e.rota))}</td><td class="mono forte">${esc(e.coordenada)}</td><td>${esc(e.pioneira)} · fragmento <strong>${esc(e.fragmento)}</strong></td><td class="url-pequena">${esc(urlDe("estacao.html?id=" + e.id))}</td><td>☐</td></tr>`).join("")}
          <tr><td>Final</td><td>Todas</td><td class="mono">Centro</td><td>Tesouro · ${esc(codigoFinal)}</td><td class="url-pequena">${esc(urlDe("final.html"))}</td><td>☐</td></tr>
          <tr><td>Ranking</td><td>Todas</td><td class="mono">Telão</td><td>Placar ao vivo</td><td class="url-pequena">${esc(urlDe("ranking.html"))}</td><td>☐</td></tr>
        </tbody>
      </table>
    </section>`;

  $("#paginas").innerHTML = [...paginasQr, ...paginasPistas, ...paginasGabarito, paginaMestra].join("");

  document.querySelectorAll("[data-secao]").forEach((caixa) => {
    if (caixa.tagName !== "INPUT") return;
    caixa.addEventListener("change", () => {
      document.querySelectorAll(`.pagina[data-secao="${caixa.dataset.secao}"]`)
        .forEach((p) => p.classList.toggle("oculto", !caixa.checked));
    });
  });

  $("#imprimir").addEventListener("click", () => window.print());
})();
