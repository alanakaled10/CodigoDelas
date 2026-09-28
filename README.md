# Código Delas · O Legado Perdido

Repositório voltado para a oficina Código Delas, Universidade Positivo Londrina.

Site da oficina **Código Delas** (Mochilão 2026, 8 de outubro). É um jogo físico-digital:
as participantes seguem duas rotas pela sala, escaneiam QR Codes, recuperam registros
de pioneiras da tecnologia e juntam os fragmentos para abrir o tesouro final.

Feito só com HTML, CSS e JavaScript. Não precisa de build.

## Páginas

| Página | Para quem | O que faz |
|---|---|---|
| `index.html` | Participantes | Tela inicial, narrativa, regras e escolha da rota |
| `rota.html?r=teal` / `rota.html?r=coral` | Participantes | Próxima coordenada e fragmentos já recuperados |
| `estacao.html?id=...` | Participantes | Registro da pioneira, desafio, dica e fragmento |
| `final.html` | Participantes | Tesouro trancado por senha e mensagem final |
| `ranking.html` | Telão e celulares | Ranking e cronômetro em tempo real |
| `admin.html` | Equipe | Login, cadastro de grupos, pontuação, cronômetro e editor de perguntas |
| `impressao.html` | Equipe | Cartazes com QR Code, pistas impressas, gabarito e planilha mestra |

## Criar e editar perguntas pelo painel

No `admin.html`, a aba **Perguntas** permite que as admins:

- criem uma estação nova em qualquer rota (nome da pioneira, texto do registro, curiosidade,
  pergunta com 2 a 4 alternativas, dica, coordenada e fragmento do código);
- editem, removam e mudem a ordem das estações com as setas;
- abram a estação como as participantes vão ver (botão **Ver**);
- voltem às perguntas originais com **Restaurar padrão**.

A próxima coordenada, o início de cada rota e a **palavra-chave de cada rota** são calculados
sozinhos a partir da ordem das estações e dos fragmentos. As palavras atuais aparecem no topo da aba.

## Competição

**Pontos automáticos:** ao abrir a rota, a equipe escolhe o próprio nome na lista de grupos
cadastrados no painel. A partir daí, cada pergunta acertada soma `pontosPorAcerto` (padrão: 10)
no ranking sozinha. Cada estação conta uma única vez por equipe, e acertos feitos sem internet
ou antes de escolher a equipe são enviados depois, automaticamente. O painel mostra, em cada
grupo, quanto veio dos acertos e quanto foi dado pelas admins.

Cada rota tem a própria palavra-chave, formada pelos fragmentos das suas estações. A equipe
digita a palavra da própria rota na página final e vê a tela de "Missão concluída" com o tempo.
A monitora então clica em **Registrar chegada** no grupo, na aba Oficina do painel:

- a colocação é contada por sessão (1º, 2º...);
- o bônus é somado aos pontos automaticamente, conforme `bonusChegada` em `config.js`
  (padrão: 30, 20 e 10 pontos);
- o ranking mostra a chegada de cada equipe e, no empate de pontos, quem chegou antes fica na frente;
- **Desfazer chegada** retira o bônus, caso o clique tenha sido por engano.

Cuidados:

- Com o Firebase ativo, as mudanças aparecem na hora para todas as participantes. No modo
  local, ficam salvas só no navegador de quem editou.
- Cada estação tem um código fixo (ex.: `k7x2`) que vai no QR Code. Editar uma estação não
  muda o código, mas **estações novas precisam de um QR Code novo** e estações removidas
  deixam de funcionar. Reimprima pela `impressao.html` depois de mudanças.
- A resposta da pergunta precisa estar no texto do registro: o jogo não testa conhecimento prévio.

## Onde editar no código

- **Conteúdo padrão do jogo** (usado enquanto ninguém salvar perguntas pelo painel):
  `assets/js/conteudo.js`. Os textos atuais são rascunho e precisam ser conferidos por
  cada responsável.
- **Configurações** (Firebase, senha do modo local, duração do cronômetro, endereço do site,
  link dos cursos): `assets/js/config.js`.
- **Visual**: `assets/css/style.css` (site) e `assets/css/impressao.css` (impressão).

Palavras-chave padrão: Teal `LEGADO` (LE + GA + DO) e Coral `DELAS` (DE + LA + S).

## Rodar no computador

Abra um terminal na pasta do projeto e rode:

```bash
python3 -m http.server 8000
```

Depois acesse `http://localhost:8000`. Também dá para abrir o `index.html` direto no
navegador, mas o servidor local é mais parecido com o site publicado.

## Modo local e modo Firebase

Sem configuração, o site roda no **modo local**: o ranking e o cronômetro sincronizam só
entre abas do mesmo navegador. Serve para ensaiar e como plano B no dia (admin numa aba,
ranking no telão em outra, no mesmo computador). A senha do admin nesse modo é a de
`pinAdminLocal` em `config.js` (padrão `delas2026`; troque antes do evento).

Para as participantes verem o ranking e o cronômetro **em tempo real no celular**, ative o
Firebase (gratuito para esse volume):

1. Acesse <https://console.firebase.google.com> e crie um projeto.
2. Em **Build > Realtime Database**, clique em **Criar banco de dados** e comece no modo bloqueado.
3. Na aba **Regras** do banco, cole o conteúdo de `database.rules.json` e publique.
   Assim qualquer pessoa pode ver o ranking e as perguntas, mas só admins logadas podem alterar.
   Os celulares só conseguem registrar acertos: um por estação, para uma equipe que exista.
4. Em **Build > Authentication**, ative o provedor **E-mail/senha** e, na aba **Usuários**,
   crie uma conta para cada admin.
5. Em **Configurações do projeto > Seus apps**, adicione um app **Web** (`</>`) e copie os
   valores `apiKey`, `authDomain`, `databaseURL`, `projectId` e `appId` para `config.js`.
   Essas chaves podem ficar públicas: quem protege os dados são as regras do passo 3.
6. Em **Authentication > Configurações > Domínios autorizados**, adicione o domínio da Vercel.

Com o Firebase ativo, o login do admin passa a ser por e-mail e senha.

## Publicar na Vercel

1. Em <https://vercel.com>, clique em **Add New > Project** e importe este repositório.
2. Em **Framework Preset**, escolha **Other**. Deixe o comando de build vazio e o diretório
   de saída como a raiz do projeto.
3. Clique em **Deploy**.
4. Copie o endereço gerado (por exemplo `https://codigo-delas.vercel.app/`) para `urlSite`
   em `config.js` e faça um novo commit. Isso garante que os QR Codes impressos apontem
   para o site publicado.

Cada push na branch principal publica uma nova versão automaticamente.

## Checklist antes do evento

- [ ] Conteúdo das pioneiras revisado e com fontes registradas
- [ ] Coordenadas ajustadas ao mapa real do laboratório
- [ ] `urlSite` preenchido e QR Codes impressos a partir do site publicado
- [ ] Cada QR Code testado em Android e iPhone
- [ ] Firebase configurado e contas das admins criadas
- [ ] Senha do modo local trocada
- [ ] Pistas impressas e gabarito separados por rota (contingência sem internet)
- [ ] Teste completo na sala com pessoas de fora da equipe

## Observações

- O progresso de cada equipe fica salvo no próprio celular, sem cadastro nem coleta de dados pessoais.
- Os endereços das estações usam códigos não sequenciais para ninguém adivinhar a próxima etapa.
  As respostas ficam no código-fonte do site, o que é aceitável para uma atividade de 15 minutos.
- Gerador de QR Code: [qrcode-generator](https://github.com/kazuhikoarase/qrcode-generator) (MIT), em `assets/js/vendor/`.
