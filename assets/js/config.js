/*
 * Configuração geral do site Código Delas.
 *
 * FIREBASE (ranking e cronômetro em tempo real em todos os aparelhos)
 * Enquanto `firebase` estiver com os campos vazios, o site roda em MODO LOCAL:
 * o ranking e o cronômetro só sincronizam entre abas do mesmo navegador
 * (por exemplo, a aba do admin e a aba do telão no computador da sala).
 * O passo a passo para ativar o Firebase está no README.md.
 */
window.CD = window.CD || {};

CD.config = {
  firebase: {
    apiKey: "",
    authDomain: "",
    databaseURL: "",
    projectId: "",
    appId: ""
  },

  // Senha do painel admin no MODO LOCAL (no modo Firebase o login é por e-mail e senha).
  pinAdminLocal: "delas2026",

  // Duração padrão do cronômetro, em minutos.
  duracaoPadraoMinutos: 15,

  // Endereço público do site, usado nos QR Codes da versão impressa.
  // Deixe vazio para usar o endereço de onde a página foi aberta.
  // Exemplo: "https://codigo-delas.vercel.app/"
  urlSite: "",

  // Link com as informações oficiais dos cursos, exibido no encerramento.
  urlCursos: "https://www.up.edu.br/"
};
