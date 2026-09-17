# Release Notes — MVP Doações

Histórico de mudanças do projeto, organizado por commit/entrega. Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).



## [??] — 2026-09-16 — Componente de botão reutilizável + tabelas responsivas + tooling do Sass
### Adicionado
- Suporte a `data-id` e `disabled` no componente `<primary-button>`, permitindo reaproveitá-lo em botões que precisam ser encontrados por id (ex: mostrar/ocultar senha) ou desabilitados dinamicamente.
- Classe `.btn-danger` (fundo vermelho) para os botões de excluir.
- Tabelas de Doadores/Doações/Interações envolvidas em `.table-responsive`, com rolagem horizontal no mobile em vez de espremer as colunas.
- Classe `.actions-td` na última coluna das tabelas (ícones de editar/excluir), com `display: flex` e espaçamento entre os botões.
- Tarefa do VS Code (`.vscode/tasks.json`) que inicia o `watch:css` automaticamente ao abrir o projeto.
### Alterado
- Todos os botões de ação (login, salvar, cancelar, abrir modal, editar, excluir) convertidos para usar o componente `<primary-button>` de forma consistente.
- Botões de editar (lápis) com estilo "ghost" do Bootstrap (`btn btn-outline-secondary`).
- Versão do `sass` fixada em `1.77.8` no `package.json` (a `1.101.0` exigia uma versão do Node mais nova que a instalada), restaurando o funcionamento de `build:css`/`watch:css`.
- Menu lateral no modo mobile (`scss/dashboard.scss`) ajustado para empilhar os itens em coluna e ocupar a largura total.
- Tabela de tecnologias do README reformatada e removida a linha de atribuição de IA no rodapé.
- Modal de edição na tabela doadores com alert de sucesso e erro
### Corrigido
- `TypeError` ao logar: `showSystem()`/`showLogin()` referenciavam um elemento `system-page` que não existe no HTML (o container correto é `app-shell`).
- Toast de sucesso duplicado ao entrar: o atributo `onClick` do componente `<primary-button>` colidia com o atributo global `onclick` do navegador, disparando `signIn()` duas vezes; renomeado para `data-onclick`.

## [44d06d7] — 2026-07-16 — Dashboard com sidebar + refinamentos dos modais
### Adicionado
- Página de Dashboard (dentro do próprio `index.html`) com sidebar fixa (Dashboard/Doadores/Doações/Interações/Sair) e 4 cards de estatística (total arrecadado, doadores, doações e interações), calculados a partir dos dados do Supabase.
- Navegação por página única: só uma seção fica visível por vez, trocada ao clicar na sidebar (`showPage()`), substituindo a antiga barra "Logado como..." e as três seções empilhadas.
- Layout responsivo: sidebar vira barra horizontal em telas pequenas.
### Alterado
- Sidebar com altura fixa (100vh) e sem scroll próprio; só o conteúdo principal rola quando a página (ex: Interações) é mais comprida que a tela.
- Botão "Cancelar" dos modais (Doador/Doação/Interação) movido para a ponta esquerda do rodapé e com estilo "ghost" (sem preenchimento/borda), no lugar do `btn-secondary` cinza.
- Labels e inputs dentro dos modais com fonte reduzida (`0.875rem`), para não ficarem desproporcionais ao restante do formulário.
### Removido
- `.logged-in-bar` (barra compacta pós-login) e seu CSS, substituída pela sidebar.

## [e9fee10] — 2026-07-16 — Modais Bootstrap para criação + toggle de senha + tooling
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

## [3ca2128] — 2026-07-16 — Redesenha tela de login e adiciona release notes
### Adicionado
- Tela de Login/Cadastro redesenhada: card centralizado vertical e horizontalmente na tela, com círculo de logo acima do título.
- Barra compacta pós-login ("Logado como ...") que substitui o formulário de login enquanto o usuário está autenticado.
- Layout responsivo do login (breakpoint para telas pequenas).
### Alterado
- Credenciais do Supabase (`SUPABASE_URL`/`SUPABASE_KEY`) atualizadas para o novo projeto (formato de chave `sb_publishable_...`).

## [1b442ee] — 2025-12-16 — mudei caminho style
### Corrigido
- Caminho de referência do `style.css` no `index.html`.

## [cde66de] — 2025-12-16 — Correção lógica de funcionalidades + validação + estilos + README
### Adicionado
- CRUD completo (criar, editar, excluir) para Doadores, Doações e Interações via Supabase.
- Autenticação (login/logout) com verificação de nível de acesso administrador (tabela `doador`, campo `nivel_acesso`).
- Validação de existência do doador antes de registrar uma doação ou interação.
- Alertas estilizados com SweetAlert2, substituindo `alert()`/`confirm()` nativos do navegador.
- Ícones do Flaticon nos botões de ação (editar/excluir/sair).
- Estrutura SCSS modular (`_variables`, `_mixins`, `_base`, `_components`) compilada para `style.css`.
- README detalhado com descrição, funcionalidades, tecnologias utilizadas e instruções de instalação.
### Alterado
- Reorganização e indentação do HTML/JS para maior legibilidade.

## [beb4144] — 2025-12-15 — Add site link to README
### Adicionado
- Link do site publicado (GitHub Pages) no README.

## [f8f52e7] — 2025-12-15 — Add initial HTML structure for MVP Doações
### Adicionado
- Estrutura HTML inicial do sistema, com seções de Login, Doadores, Doações e Interações.

## [??] — 2025-12-16 — Separar arquivo index com login, codigo js e alguns estilos 
### Adicionado
- Index com arquivos Js agora separados em script.js
- Mudança na forma de apresentar o login e as abas de funcionaldiades
- teste de componente em botão do Login

