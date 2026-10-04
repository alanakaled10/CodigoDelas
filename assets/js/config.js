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
    apiKey: "AIzaSyAZe9r2xuT7SrSFU57MxlVQ0QxLWQwt0Wc",
    authDomain: "codigo-delas.firebaseapp.com",
    databaseURL: "https://codigo-delas-default-rtdb.firebaseio.com",
    projectId: "codigo-delas",
    appId: "1:328660739947:web:cc3ea07b17113c11a28e2e"
  },

  // Senha do painel admin no MODO LOCAL (no modo Firebase o login é por e-mail e senha).
  pinAdminLocal: "delas2026",

  // Pontos somados automaticamente a cada pergunta acertada pela equipe.
  // Vale sempre o valor inteiro: errar antes de acertar não tira pontos.
  pontosPorAcerto: 10,

  // Pontos extras pela chegada ao tesouro: 1º, 2º, 3º lugar da sessão.
  // A chegada é registrada sozinha quando a equipe abre o tesouro (ou pelo painel).
  // As demais equipes que concluírem ganham o último valor da lista.
  bonusChegada: [30, 20, 10],

  // Depois de quantos minutos sem uso o progresso salvo no celular é apagado.
  // Garante que a equipe da sessão seguinte comece do zero no mesmo aparelho.
  minutosProgresso: 40,

  // Duração padrão do cronômetro, em minutos.
  duracaoPadraoMinutos: 15,

  // Endereço público do site, usado nos QR Codes da versão impressa.
  // Deixe vazio para usar o endereço de onde a página foi aberta.
  // Exemplo: "https://codigo-delas.vercel.app/"
  urlSite: "https://codigo-delas.vercel.app/",

  // Link com as informações oficiais dos cursos, exibido no encerramento.
  urlCursos: "https://www.up.edu.br/"
};
