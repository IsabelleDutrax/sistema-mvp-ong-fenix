# Release Notes — MVP Doações

Histórico de mudanças do projeto, organizado por commit/entrega. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).



## 2026-09-17 — Fim dos alertas nativos + cards do Dashboard clicáveis
### Adicionado
- Cards "Doadores", "Doações" e "Interações" do Dashboard agora são clicáveis e levam direto pra aba correspondente, com destaque no hover (o card "Total Arrecadado" continua sem ação).
### Alterado
- Todas as confirmações de exclusão (Doador/Doação/Interação) trocadas do `confirm()` nativo do navegador para um `Swal.fire` de confirmação, com botão "Excluir" vermelho e "Cancelar" no estilo ghost (reaproveitando as classes `btn btn-danger`/`btn-ghost` já existentes).
- Últimos `alert()` nativos que restavam (erro de login, "item não encontrado no cache", "somente admins podem excluir") trocados pelo mesmo toast de erro usado no resto do sistema.

## 2026-09-17 — Menu mobile com Offcanvas do Bootstrap + refinamentos
### Adicionado
- Menu lateral no mobile virou um menu-gaveta (Bootstrap Offcanvas, classe `offcanvas-md`): fica escondido por padrão e abre por cima do conteúdo ao tocar num botão de hambúrguer, em vez de virar uma barra horizontal com scroll.
- Botão de hambúrguer (visível só no mobile) e botão "X" de fechar dentro do menu.
- Menu fecha sozinho ao trocar de página ou ao clicar em "Sair" (mobile).
- Tag `<meta name="viewport">` no `<head>` — faltava por completo, e sem ela o navegador tratava a página como desktop mesmo no celular, quebrando toda a responsividade já feita.
- Subtítulo "Sistema de gestão de doações" abaixo do título da tela de login.
### Alterado
- Espaçamento no topo do conteúdo (mobile) aumentado, pra não ficar colado no botão de hambúrguer.
- Padding das células das tabelas reduzido no mobile (de 15px para 10px), deixando as linhas mais compactas.
### Corrigido
- Menu lateral no mobile ficava idêntico ao desktop: havia uma declaração `flex-direction` duplicada e conflitante no CSS, e a versão errada estava vencendo.
- Ícone do botão de hambúrguer invisível (branco sobre fundo branco).
- Botão "X" de fechar o menu não funcionava (dependia de um atributo automático do Bootstrap que exigia uma classe que tivemos que remover por outro motivo); passou a fechar via JavaScript direto.

## 2026-09-17 — Identidade visual da Ong (Fênix Conecta)
### Adicionado
- Sistema renomeado para "Fênix Conecta" (título de login e nome na sidebar), removida menção ao Supabase e o subtítulo "Login / Cadastro" da tela de login.
- Fonte "Libre Baskerville" (Google Fonts) aplicada nos títulos: H1 (login e Dashboard), H2 das seções (Doadores/Doações/Interações) e título dos modais.
- Logo da Ong exibida na tela de login, e como fundo do circulo de logo (login e sidebar), com borda na cor escura da marca.
- Novas variáveis de cor da identidade visual: `$bg-color` (branco ovo, `#FFFDF6`), `$ong-dark` (`#010101`) e `$ong-orange` (`#FF5722`). Cores da identidade da Ong
- Classe `.btn-orange` para os botões de ação principal (criar e salvar nos modais).
- Transição + suave de 2s nas trocas de cor no hover dos botões e itens do menu, nas abas.
### Alterado
- Fundo das páginas (login e área principal) trocado para branco da ong.
- Cor dos H1, do botão "Entrar", do item ativo do menu lateral e da borda do circulo trocada para `$ong-dark`.
- Botões "Novo Doador/Doação/Interação +" e "Salvar" dos modais trocados de verde (`btn-success`) para `.btn-orange`.
- Hover do link "Sair" trocado para laranja da ong #FF5722
- Botões de excluir trocados da classe customizada `.btn-danger` para a classe nativa do Bootstrap (`btn btn-danger`), alinhando a cor com o badge "Não Pago" e ganhando o hover de graça.
- Ícone do `<primary-button>` só ganha a margem `me-1` quando existe `label` junto (ícone sozinho fica sem espaçamento extra).
### Corrigido
- "Logado como" na sidebar aparecia vazio: faltava preencher `userEmailDisplay` com o e-mail do usuário após o login.
- Hover ausente no botão de excluir (a classe customizada `.btn-danger` nunca teve um estado de hover definido).

## 2026-09-16 — Dropdown de doadores e selects nos formulários
### Adicionado
- Campo "Id do Doador" (criação de Doação/Interação e edição de Interação) virou um dropdown mostrando "Nome (email)", em vez de digitar o ID de cabeça — preenchido a partir do cache de doadores já carregado.
- "Forma de Pagamento" da Doação virou um dropdown (Pix, Boleto, Transferência, Dinheiro em espécie, Débito, Prestação de serviço).
- Placeholders dos selects (ex: "Selecione um doador", "Selecione o tipo") marcados como desabilitados, pra não dar pra selecionar de volta depois de escolher um valor real.
### Alterado
- Tabelas de Doador e Doação: coluna "ID" removida.
- Tabelas de Doação e Interação: coluna "Doador" mostra "Nome (email)" em vez do ID cru.
- Valor da doação na tabela: só o número fica em negrito, o "R$" fica normal.

## 2026-09-16 — Modais de edição (CRUD completo), validações e refinamentos das tabelas
### Adicionado
- Modais de edição (Bootstrap msm) pra doação e interação, já usado na tabela doadores.
- Validações antes de salvar infos (nome, e-mail, CPF/CNPJ, valor, data, tipo obrigatório) na criação e edição dos 3 formulários, com alert toast de erro em vez de deixar dado inválido ir pro banco.
- Campo "R$" fixo (Bootstrap input-group) no campo 'valor da doação', na criação e na edição.
- Status da doação virou um dropdown (Pago/Pendente/Não Pago), mostrando como badge colorido na tabela
- Tipo da interação virou um dropdown (Mensagem/Telefone/E-mail/Redes Sociais/Visita presencial/Conversa/Outro).
- Campo de Data em doação e interação: abre já com a data de hoje selecionada, e bloqueia datas futuras tanto no calendário quanto validação.
- Campo "ID do Doador" editável no modal de editar interação, futuro select.
### Alterado
- Datas exibidas nas tabelas de doação/interação formatadas como dia,mes,ano, em vez do formato cru do banco.
- Coluna de ID removida da tabela de Interações (mantém só o ID do Doador).
### Corrigido
- Validação de "data não pode ser futura" comparava com a data em UTC, o que à noite no Brasil aceitava um dia futuro por engano; corrigido pra usar a data local.
- Altura da coluna de ações (editar/excluir) menor que as outras colunas: causada por display-flex direto no TD; o flex foi movido pra uma div interna '.actions-content'.
- Coluna de ações mais estreita que as demais no mobile: adicionado `table-layout: fixed` pra todas as colunas terem a mesma largura.

## 2026-09-16 — Componente de botão reutilizável + tabelas responsivas + tooling do Sass
### Adicionado
- Suporte a `data-id` e `disabled` no componente 'primary-button', permitindo reaproveitá-lo em botões que precisam ser encontrados por id (ex: mostrar/ocultar senha) ou desabilitados dinamicamente.
- Classe `.btn-danger` (fundo vermelho) para os botões de excluir.
- Tabelas de Doadores/Doações/Interações envolvidas em `.table-responsive`, com rolagem horizontal no mobile em vez de espremer as colunas.
- Classe `.actions-td` na última coluna das tabelas (ícones de editar/excluir), com `display: flex` e espaçamento entre os botões.
- Tarefa do VS Code (`.vscode/tasks.json`) que inicia o `watch:css` automaticamente ao abrir o projeto.
### Alterado
- Todos os botões de ação (login, salvar, cancelar, abrir modal, editar, excluir) convertidos para usar o componente 'primary-button' de forma consistente.
- Botões de editar (lápis) com estilo "ghost" do Bootstrap (`btn btn-outline-secondary`).
- Versão do `sass` fixada em `1.77.8` no `package.json` (a `1.101.0` exigia uma versão do Node mais nova que a instalada), restaurando o funcionamento de `build:css` e `watch:css`.
- Menu lateral no modo mobile (`scss/dashboard.scss`) ajustado pra empilhar os itens em coluna e ocupar a largura total.
- Tabela de tecnologias do README reformatada e removida a linha de atribuição de IA no rodapé.
- Modal de edição das tabelas com alert de sucesso e erro
### Corrigido
- `TypeError` ao logar: `showSystem()`/`showLogin()` referenciavam um elemento `system-page` que não existe no HTML (o container correto é `app-shell`).
- Toast de sucesso duplicado ao entrar: o atributo onClick do componente 'primary-button' colidia com o atributo global onclick do navegador, disparando `signIn()` duas vezes; renomeado para `data-onclick`.

## 2026-07-16 — Dashboard com sidebar + refinamentos dos modais
### Adicionado
- Página de Dashboard (dentro do próprio index html) com sidebar fixa (Dashboard/Doadores/Doações/Interações/Sair) e 4 cards de estatística (total arrecadado, doadores, doações e interações), calculados a partir dos dados do Supabase.
- Navegação por página única: só uma seção fica visível por vez, trocada ao clicar na sidebar (`showPage()`), substituindo a antiga barra "Logado como..." e as três seções empilhadas.
- Layout responsivo: sidebar vira barra horizontal em telas pequenas.
### Alterado
- Sidebar com altura fixa (100vh) e sem scroll próprio; só o conteúdo principal rola quando a página (ex: Interações) é mais comprida que a tela.
- Botão "Cancelar" dos modais (Doador/Doação/Interação) movido para a ponta esquerda do rodapé e com estilo "ghost" (sem preenchimento/borda), no lugar do `btn-secondary` cinza.
- Labels e inputs dentro dos modais com fonte reduzida (`0.875rem`), pra não ficarem desproporcionais ao restante do formulário.
### Removido
- `.logged-in-bar` (barra compacta pós-login) e seu CSS, substituída pela sidebar.

## 2026-07-16 — Modais Bootstrap para criação + toggle de senha + tooling
### Adicionado
- Bootstrap 5 (CSS/JS via CDN) para os formulários de criação de Doadores, Doações e Interações: cada um virou um botão "Novo X +" que abre um modal, em vez de inputs soltos na tela.
- Botão de mostrar/ocultar senha na tela de login, habilitado apenas quando o campo tem conteúdo digitado.
- Estado de foco customizado nos inputs (substitui o outline nativo do navegador por uma borda/box-shadow na cor do sistema).
- `package.json` com scripts `build:css`/`watch:css` e `sass` como dependência local, pra não depender mais de instalação global.
- `.gitignore` para `node_modules/`.
### Corrigido
- Divergência de largura entre os campos de email e senha na tela de login (causada por margem legada conflitando com layout flex).
- Lógica invertida do ícone de olho (mostrar/ocultar senha) que não mudava visualmente no primeiro clique.
### Alterado
- README: nova seção documentando o uso do Bootstrap, instruções de instalação atualizadas (build local do Sass via npm em vez de instalação global) e estrutura de pastas corrigida.

## 2026-07-16 — Redesenha tela de login e adiciona release notes
### Adicionado
- Tela de Login/Cadastro redesenhada: card centralizado vertical e horizontalmente na tela, com círculo de logo acima do título.
- Barra compacta pós-login ("Logado como ...") que substitui o formulário de login enquanto o usuário está autenticado.
- Layout responsivo do login (breakpoint pra telas pequenas).
### Alterado
- Credenciais do Supabase (`SUPABASE_URL`/`SUPABASE_KEY`) atualizadas para o novo projeto (formato de chave `sb_publishable_...`).

## 2025-12-16 — mudei caminho style
### Corrigido
- Caminho de referência do `style.css` no index html.

## 2025-12-16 — Correção lógica de funcionalidades + validação + estilos + README
### Adicionado
- CRUD completo (criar, editar, excluir) para Doadores, Doações e Interações via Supabase.
- Autenticação (login/logout) com verificação de nível de acesso administrador (tabela `doador`, campo `nivel_acesso`).
- Validação de existência do doador antes de registrar uma doação ou interação.
- Alertas estilizados com SweetAlert2, substituindo `alert()`/`confirm()` nativos do navegador.
- Ícones do Flaticon nos botões de ação (editar/excluir/sair).
- Estrutura SCSS modular (`_variables`, `_mixins`, `_base`, `_components`) compilada para `style.css`.
- README detalhado com descrição, funcionalidades, tecnologias utilizadas e instruções de instalação.
### Alterado
- Reorganização e indentação do HTML/JS pra melhorar legibilidade.

## 2025-12-15 — Add site link to README
### Adicionado
- Link do site publicado (GitHub Pages) no README.

## 2025-12-15 — Add initial HTML structure for MVP Doações
### Adicionado
- Estrutura HTML inicial do sistema, com seções de Login, Doadores, Doações e Interações.

## 2025-12-16 — Separar arquivo index com login, codigo js e alguns estilos 
### Adicionado
- Index com arquivos Js agora separados em script.js
- Mudança na forma de apresentar o login e as abas de funcionaldiades
- teste de componente em botão do Login

