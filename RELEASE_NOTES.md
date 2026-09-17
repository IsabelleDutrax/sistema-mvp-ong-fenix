# Release Notes — MVP Doações

Histórico de mudanças do projeto, organizado por commit/entrega. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).



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

