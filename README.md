# Código Delas · O Legado Perdido

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
| `admin.html` | Equipe | Login, cadastro de grupos, pontuação e cronômetro |
| `impressao.html` | Equipe | Cartazes com QR Code, pistas impressas, gabarito e planilha mestra |

## Onde editar

- **Conteúdo do jogo** (pioneiras, perguntas, respostas, dicas, fragmentos, coordenadas,
  código final): `assets/js/conteudo.js`. Os textos atuais são rascunho e precisam ser
  conferidos por cada responsável.
- **Configurações** (Firebase, senha do modo local, duração do cronômetro, endereço do site,
  link dos cursos): `assets/js/config.js`.
- **Visual**: `assets/css/style.css` (site) e `assets/css/impressao.css` (impressão).

Código final atual: `LEGADO DELAS` (Teal: LE + GA + DO, Coral: DE + LA + S).

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
   Assim qualquer pessoa pode ver o ranking, mas só admins logadas podem alterar.
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
