/*
 * Conteúdo do jogo O Legado Perdido.
 *
 * IMPORTANTE: os textos abaixo são um RASCUNHO. Cada responsável deve conferir
 * datas, nomes e contribuições em fontes confiáveis antes do evento.
 *
 * Este arquivo guarda o CONTEÚDO PADRÃO. As admins também podem criar e
 * editar as estações pelo painel (admin.html, aba Perguntas); quando houver
 * perguntas salvas pelo painel, elas substituem as estações abaixo.
 *
 * Campos de cada estação:
 *  - `id` é o código que vai no endereço do QR Code (estacao.html?id=...).
 *    Use códigos não sequenciais para que ninguém adivinhe a próxima etapa.
 *  - `ordem` define a sequência dentro da rota. A próxima coordenada, o início
 *    da rota e o código final são calculados automaticamente a partir dela.
 *  - `coordenada` é a posição física na sala (fileira + número).
 *  - `correta` é o índice da alternativa certa (0 = primeira).
 *  - `fragmento` é o pedaço do código final entregue ao acertar.
 */
window.CD = window.CD || {};

CD.conteudo = {
  missao: {
    titulo: "O Legado Perdido",
    chamada: "Os nomes desapareceram, mas as ideias continuam presentes em tudo o que usamos. Encontrem as pioneiras, recuperem os fragmentos e reconstruam o Código Delas.",
    narrativa: "O Arquivo do Tempo perdeu parte dos registros das mulheres que construíram a tecnologia. Sem esses registros, a história ficou incompleta. Duas equipes foram convocadas para seguir as pistas, recuperar os fragmentos do código e restaurar o legado antes que o cronômetro termine.",
    regras: [
      "Cada equipe segue apenas a sua rota: Teal ou Coral.",
      "Escaneiem o QR Code de cada estação para abrir o registro da pioneira.",
      "Leiam o registro com atenção: a resposta está nele.",
      "Cada acerto revela um fragmento do código e a próxima coordenada.",
      "Não é permitido correr, retirar pistas do lugar ou seguir a outra equipe.",
      "No final, as duas equipes juntam os fragmentos para abrir o tesouro."
    ]
  },

  rotas: {
    teal: {
      nome: "Rota Teal",
      simbolo: "●",
      forma: "círculo"
    },
    coral: {
      nome: "Rota Coral",
      simbolo: "▲",
      forma: "triângulo"
    }
  },

  estacoes: [
    {
      id: "k7x2",
      rota: "teal",
      ordem: 1,
      coordenada: "A1",
      pioneira: "Ada Lovelace",
      periodo: "1815 a 1852 · Inglaterra",
      area: "Matemática e algoritmos",
      contexto: "Matemática inglesa que estudou a Máquina Analítica, um computador mecânico projetado por Charles Babbage. Em 1843, publicou notas sobre a máquina com um método passo a passo para calcular os números de Bernoulli, considerado um dos primeiros programas de computador da história.",
      curiosidade: "Ada imaginou que essas máquinas poderiam ir além dos números e até compor música. A linguagem de programação Ada recebeu esse nome em homenagem a ela.",
      pergunta: "Que máquina Ada Lovelace analisou em suas notas de 1843?",
      opcoes: ["O telégrafo elétrico", "A Máquina Analítica", "O ENIAC", "A máquina de escrever"],
      correta: 1,
      dica: "Procurem no registro o nome da máquina projetada por Charles Babbage.",
      fragmento: "LE"
    },
    {
      id: "m4q9",
      rota: "teal",
      ordem: 2,
      coordenada: "C2",
      pioneira: "Grace Hopper",
      periodo: "1906 a 1992 · Estados Unidos",
      area: "Linguagens de programação",
      contexto: "Matemática e oficial da Marinha dos Estados Unidos. Criou um dos primeiros compiladores, programa que traduz instruções escritas por pessoas para a linguagem da máquina, e teve papel central na criação da linguagem COBOL. Defendia que programar deveria usar palavras próximas da língua humana.",
      curiosidade: "Em 1947, a equipe em que ela trabalhava encontrou uma mariposa presa no computador Mark II. Grace ajudou a popularizar a história, e o termo bug ficou famoso para falar de erros em programas.",
      pergunta: "O que Grace Hopper defendia sobre a programação?",
      opcoes: ["Que só deveria usar números", "Que deveria ser feita com cabos e interruptores", "Que deveria usar palavras próximas da língua humana", "Que só militares poderiam programar"],
      correta: 2,
      dica: "Releiam a última frase do registro.",
      fragmento: "GA"
    },
    {
      id: "r2w8",
      rota: "teal",
      ordem: 3,
      coordenada: "E1",
      pioneira: "Irmã Mary Kenneth Keller",
      periodo: "1913 a 1985 · Estados Unidos",
      area: "Educação e computação",
      contexto: "Religiosa católica e cientista. Em 1965, tornou-se uma das primeiras pessoas dos Estados Unidos a receber um doutorado em Ciência da Computação. Trabalhou no centro de computação de Dartmouth, onde nasceu a linguagem BASIC, e depois fundou um departamento de computação em uma faculdade, que dirigiu por cerca de 20 anos.",
      curiosidade: "Ela defendia que a computação deveria estar ao alcance de todas as pessoas, inclusive das mulheres, e acreditava no seu poder para transformar a educação.",
      pergunta: "Qual conquista Mary Kenneth Keller alcançou em 1965?",
      opcoes: ["Um dos primeiros doutorados em Ciência da Computação dos EUA", "A invenção do primeiro celular", "A criação da internet", "O primeiro jogo de videogame"],
      correta: 0,
      dica: "O registro fala de um título acadêmico recebido em 1965.",
      fragmento: "DO"
    },
    {
      id: "p9d3",
      rota: "coral",
      ordem: 1,
      coordenada: "A6",
      pioneira: "Hedy Lamarr",
      periodo: "1914 a 2000 · Áustria e Estados Unidos",
      area: "Invenção e comunicação sem fio",
      contexto: "Atriz de cinema e inventora. Durante a Segunda Guerra Mundial, criou com o compositor George Antheil um sistema de salto de frequência, patenteado em 1942, para evitar que sinais de rádio fossem interceptados ou bloqueados. O princípio está relacionado a tecnologias de comunicação sem fio que usamos hoje, como Wi-Fi e Bluetooth.",
      curiosidade: "Por muitos anos, Hedy foi lembrada apenas como atriz. O reconhecimento como inventora veio décadas depois, com prêmios recebidos no fim da década de 1990.",
      pergunta: "Qual foi a invenção de Hedy Lamarr?",
      opcoes: ["Um sistema de salto de frequência", "O primeiro computador pessoal", "A câmera de cinema", "Uma linguagem de programação"],
      correta: 0,
      dica: "Procurem o que foi patenteado em 1942.",
      fragmento: "DE"
    },
    {
      id: "h6z1",
      rota: "coral",
      ordem: 2,
      coordenada: "C5",
      pioneira: "Radia Perlman",
      periodo: "Nascida em 1951 · Estados Unidos",
      area: "Redes de computadores",
      contexto: "Engenheira e cientista da computação. Em 1985, criou o algoritmo do protocolo Spanning Tree, que evita que dados fiquem circulando em loop dentro de uma rede. Graças a ideias como essa, redes com muitos computadores conseguem funcionar de forma estável.",
      curiosidade: "Ela escreveu um pequeno poema, chamado Algorhyme, para explicar o funcionamento do seu algoritmo.",
      pergunta: "O protocolo criado por Radia Perlman evita qual problema nas redes?",
      opcoes: ["Vírus em computadores", "Falta de energia", "Dados circulando em loop", "Senhas fracas"],
      correta: 2,
      dica: "Leiam o que o protocolo Spanning Tree evita.",
      fragmento: "LA"
    },
    {
      id: "v3n5",
      rota: "coral",
      ordem: 3,
      coordenada: "E6",
      pioneira: "Nina da Hora",
      periodo: "Brasil · referência contemporânea",
      area: "Ética em inteligência artificial",
      contexto: "Cientista da computação brasileira, do Rio de Janeiro. Pesquisa ética em inteligência artificial e os efeitos dos algoritmos na vida das pessoas, como decisões injustas causadas por dados enviesados. Também atua com divulgação científica para aproximar mais jovens, especialmente jovens negras, da computação.",
      curiosidade: "O trabalho dela mostra que a computação também é sobre justiça: estudar como a tecnologia afeta as pessoas é uma área de pesquisa em crescimento.",
      pergunta: "Qual é um dos temas de pesquisa de Nina da Hora?",
      opcoes: ["Ética em inteligência artificial", "Construção de foguetes", "Criação de fontes tipográficas", "Fabricação de chips"],
      correta: 0,
      dica: "A resposta está logo no começo do registro.",
      fragmento: "S"
    }
  ],

  final: {
    titulo: "As Programadoras do ENIAC",
    texto: "Em 1945 e 1946, seis mulheres programaram o ENIAC, um dos primeiros computadores eletrônicos de uso geral. Ainda não existiam linguagens de programação: elas configuravam a máquina com cabos, painéis e interruptores. Quando o ENIAC foi apresentado ao público, elas não foram reconhecidas. O trabalho delas só ganhou o devido destaque décadas depois.",
    nomes: [
      "Kathleen McNulty Antonelli",
      "Frances Bilas Spence",
      "Betty Jean Jennings Bartik",
      "Elizabeth Snyder Holberton",
      "Marlyn Wescoff Meltzer",
      "Ruth Lichterman Teitelbaum"
    ],
    local: "Ponto de encontro: centro da sala, junto ao tesouro.",
    mensagem: "O legado não termina aqui. A próxima mulher a transformar a tecnologia pode estar nesta sala.",
    bastidores: "Tudo o que vocês viveram aqui envolveu diferentes áreas da tecnologia: desenvolvimento do site, design, pesquisa, roteiro, testes dos QR Codes e gestão do projeto. Esta experiência foi criada e conduzida por mulheres."
  }
};
