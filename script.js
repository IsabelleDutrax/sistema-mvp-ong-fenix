// 🔑 Config Supabase
const SUPABASE_URL = "https://qsiisduhdqecxuemdcjp.supabase.co";
const SUPABASE_KEY = "sb_publishable_cbNKYP7-t9VWYp4tYqNaVQ_OPKA2d55";
const { createClient } = supabase;
const supabaseClient = createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentDoadorId = null;
let isAdmin = false;

// Cache local dos últimos dados carregados, usado pelo Dashboard
let doadoresData = [];
let doacoesData = [];
let interacoesData = [];

// Alternar visualização das páginas:
function showLogin() {
  document.getElementById("login-page").classList.remove("hidden");
  document.getElementById("app-shell").classList.add("hidden");
}

function showSystem() {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("app-shell").classList.remove("hidden");
}

// --------------
// LOGIN
// --------------

//Email: admin@admin.com
//Senha: 123123

//Email: alvesisabele370@gmail.com
//Senha: 123123

async function signIn() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  showSystem();

  currentUser = data.user;
  document.getElementById("userEmailDisplay").textContent = currentUser.email;

  // Checa se o usuário é admin
  const { data: doadorData } = await supabaseClient
    .from("doador")
    .select("nivel_acesso")
    .eq("id_usuario", currentUser.id)
    .single();

  isAdmin = doadorData && doadorData.nivel_acesso === 99;

  Swal.fire({
    icon: "success",
    title: "Successo!",
    text: `Login OK!`,
    // text: `Login OK! Admin:${isAdmin}`,
    position: "top-right",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,

    animation: true,
  });
  if (!choicesDoador) initSelectsBuscaDoador();
  loadData();
  //   toggleSections(true);
}

async function signOut() {
  await supabaseClient.auth.signOut();
  showLogin();
  fecharMenuMobile();

  currentUser = null;
  //   toggleSections(false);
  // alert("Saiu!");
  Swal.fire({
    icon: "success",
    title: "Desconectado com sucesso!",
    position: "top-right",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,

    animation: true,
  });
}

// function toggleSections(show) {
//   document.getElementById("login-container").classList.toggle("hidden", show);
//   document.getElementById("app-shell").classList.toggle("hidden", !show);
//   if (show && currentUser) {
//     document.getElementById("userEmailDisplay").textContent = currentUser.email;
//     showPage("dashboard");
//   }
// }

// Páginas do app logado (sidebar) e a página atualmente visível
const PAGES = {
  dashboard: "dashboard-page",
  doador: "doador-section",
  doacao: "doacao-section",
  interacao: "interacao-section",
};

function showPage(page) {
  Object.values(PAGES).forEach((id) =>
    document.getElementById(id).classList.add("hidden"),
  );
  document.getElementById(PAGES[page]).classList.remove("hidden");

  document
    .querySelectorAll(".sidebar .nav-link[data-page]")
    .forEach((el) => el.classList.remove("active"));
  const activeLink = document.querySelector(
    `.sidebar .nav-link[data-page="${page}"]`,
  );
  if (activeLink) activeLink.classList.add("active");

  if (page === "dashboard") renderDashboard();

  fecharMenuMobile();
}

function fecharMenuMobile() {
  bootstrap.Offcanvas.getInstance(
    document.getElementById("sidebarSystem"),
  )?.hide();
}

// Soma o valor das doações dentro do período escolhido (dias contados a partir de hoje)
function calcularTotalArrecadado(periodo) {
  if (periodo === "todos") {
    return doacoesData.reduce((soma, d) => soma + (Number(d.valor) || 0), 0);
  }

  const diasPorPeriodo = {
    semana: 7,
    mes: 30,
    bimestre: 60,
    trimestre: 90,
    semestre: 180,
    ano: 365,
  };

  const inicio = new Date();
  inicio.setDate(inicio.getDate() - diasPorPeriodo[periodo]);
  const inicioISO = inicio.toISOString().split("T")[0];
  const hojeStr = hojeISO();

  return doacoesData
    .filter((d) => {
      const data = (d.data_doacao || "").split("T")[0];
      return data >= inicioISO && data <= hojeStr;
    })
    .reduce((soma, d) => soma + (Number(d.valor) || 0), 0);
}

// Calcula e exibe os números do dashboard a partir dos dados já carregados
function renderDashboard() {
  const periodoSelecionado =
    document.getElementById("periodoTotalArrecadado")?.value || "todos";
  const totalArrecadado = calcularTotalArrecadado(periodoSelecionado);

  document.getElementById("statTotalArrecadado").textContent =
    totalArrecadado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  document.getElementById("statDoadores").textContent = doadoresData.length;
  document.getElementById("statDoacoes").textContent = doacoesData.length;
  document.getElementById("statInteracoes").textContent = interacoesData.length;
}

// =========================
// ORDENAR TABELAS (clique no cabeçalho da coluna)
// =========================

// Guarda qual coluna e direção está ordenada em cada tabela
const ordenacaoAtual = {};

// Converte o texto da célula num valor comparável, de acordo com o tipo da coluna
function valorParaOrdenar(texto, tipo) {
  const limpo = texto.trim();

  if (tipo === "numero") {
    return parseFloat(limpo) || 0;
  }

  if (tipo === "moeda") {
    return parseFloat(limpo.replace(/[^\d.,-]/g, "").replace(",", ".")) || 0;
  }

  if (tipo === "data") {
    const [dia, mes, ano] = limpo.split("/");
    return dia && mes && ano ? `${ano}-${mes}-${dia}` : limpo;
  }

  return limpo.toLowerCase();
}

// Ordena as linhas de uma tabela pela coluna clicada, alternando crescente/decrescente
function ordenarTabela(tableId, colunaIndex, tipo) {
  const table = document.getElementById(tableId);
  const tbody = table.querySelector("tbody");
  const linhas = [...tbody.querySelectorAll("tr")];

  const estadoAnterior = ordenacaoAtual[tableId];
  const crescente =
    estadoAnterior && estadoAnterior.coluna === colunaIndex
      ? !estadoAnterior.crescente
      : true;
  ordenacaoAtual[tableId] = { coluna: colunaIndex, crescente };

  linhas.sort((a, b) => {
    const valorA = valorParaOrdenar(a.children[colunaIndex].textContent, tipo);
    const valorB = valorParaOrdenar(b.children[colunaIndex].textContent, tipo);
    if (valorA < valorB) return crescente ? -1 : 1;
    if (valorA > valorB) return crescente ? 1 : -1;
    return 0;
  });

  linhas.forEach((linha) => tbody.appendChild(linha));
  atualizarIconesOrdenacao(table, colunaIndex, crescente);
}

// Mostra uma seta pra cima/baixo na coluna ordenada e o ícone neutro nas outras
function atualizarIconesOrdenacao(table, colunaIndex, crescente) {
  const ths = [...table.querySelectorAll("thead th")];
  ths.forEach((th, i) => {
    const icone = th.querySelector(".icone-ordenacao");
    if (!icone) return;
    icone.className =
      i === colunaIndex
        ? `fi fi-rr-arrow-${crescente ? "up" : "down"} icone-ordenacao`
        : "fi fi-rr-sort icone-ordenacao";
  });
}

// Fecha o modal do Bootstrap e limpa os campos do formulário
function fecharModal(modalId, formId) {
  const modalEl = document.getElementById(modalId);
  bootstrap.Modal.getOrCreateInstance(modalEl).hide();
  document.getElementById(formId).reset();
}

// =========================
// DOADOR NOVO
// =========================
async function loadDoadores() {
  const { data, error } = await supabaseClient.from("doador_novo").select("*");
  if (error) return console.error(error);

  doadoresData = data;
  preencherDropdownDoadores();
  renderDoadorTable();
}

function renderDoadorTable() {
  const tbody = document.querySelector("#doadorTable tbody");
  tbody.innerHTML = "";
  doadoresData.forEach((d) => {
    const totalDoacoes = doacoesData.filter(
      (doacao) => doacao.id_doador === d.id_doador,
    ).length;

    tbody.innerHTML += `<tr>
      <td>${d.nome}</td>
      <td>${d.email || ""}</td>
      <td>${d.telefone || ""}</td>
      <td class="text-center">
        <button type="button" class="btn btn-link p-0" title="Ver doações deste doador" onclick="abrirDoacoesDoador(${d.id_doador})">${totalDoacoes}</button>
      </td>
      <td class="actions-td">
        <div class="actions-content">
          ${d.email ? `<a href="mailto:${d.email}" class="btn btn-outline-primary" title="Enviar e-mail para ${d.nome}"><i class="fi fi-rr-envelope"></i></a>` : ""}
          <button type="button" class="btn btn-outline-secondary" title="Copiar mensagem de lembrete" onclick="copiarMensagemLembrete(${d.id_doador})"><i class="fi fi-rr-clipboard"></i></button>
          <primary-button icon="fi fi-rr-pencil" className="btn btn-outline-secondary" data-onclick="updateDoador(${d.id_doador})"></primary-button>
          <primary-button icon="fi fi-rr-trash" className="btn btn-danger" data-onclick="deleteDoador(${d.id_doador})"></primary-button>
        </div>
      </td>
    </tr>`;
  });
}

// Abre o modal com a lista de doações de um doador específico
function abrirDoacoesDoador(idDoador) {
  const doador = doadoresData.find((d) => d.id_doador === idDoador);
  const doacoesDoDoador = doacoesData.filter((d) => d.id_doador === idDoador);

  document.getElementById("modalDoacoesDoadorLabel").textContent =
    `Doações de ${doador ? doador.nome : "-"}`;

  const tbody = document.querySelector("#doacoesDoadorTable tbody");
  tbody.innerHTML = doacoesDoDoador.length
    ? doacoesDoDoador
        .map(
          (d) => `<tr>
            <td>R$ ${d.valor}</td>
            <td>${destaqueDataFutura(d.data_doacao)}${formatarData(d.data_doacao)}</td>
            <td>${badgeStatus(d.status)}</td>
          </tr>`,
        )
        .join("")
    : `<tr><td colspan="3" class="text-center text-muted">Nenhuma doação registrada</td></tr>`;

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalDoacoesDoador"),
  ).show();
}

// Copia uma mensagem de lembrete pronta com os dados do doador
function copiarMensagemLembrete(idDoador) {
  const doador = doadoresData.find((d) => d.id_doador === idDoador);
  if (!doador) return;

  const mensagem = `Olá, ${doador.nome}! Aqui é da Ong Fênix. Passando para agradecer o seu apoio e lembrar que estamos à disposição para qualquer dúvida sobre sua doação.`;

  navigator.clipboard.writeText(mensagem).then(() => {
    Swal.fire({
      icon: "success",
      title: "Mensagem copiada!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  });
}

// Baixa um arquivo único com todos os dados do sistema (cópia de segurança manual)
function exportarBackupCompleto() {
  const backup = {
    geradoEm: new Date().toISOString(),
    doadores: doadoresData,
    doacoes: doacoesData,
    interacoes: interacoesData,
  };

  const blob = new Blob([JSON.stringify(backup, null, 2)], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `backup-fenix-conecta-${hojeISO()}.json`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// =========================
// EXPORTAR TABELAS (CSV e PDF)
// =========================

// Gera um CSV a partir de uma tabela HTML, ignorando a coluna de Ações
function exportarCSV(tableId, nomeArquivo) {
  const table = document.getElementById(tableId);
  const linhas = [...table.querySelectorAll("tr")];

  const csv = linhas
    .map((tr) =>
      [...tr.querySelectorAll("th, td")]
        .filter(
          (celula) =>
            !celula.classList.contains("actions-td") &&
            celula.textContent.trim() !== "Ações",
        )
        .map((celula) => `"${celula.textContent.trim().replace(/"/g, '""')}"`)
        .join(";"),
    )
    .join("\n");

  // ﻿ no início evita acentos quebrados ao abrir o CSV no Excel
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${nomeArquivo}.csv`;
  link.click();
  URL.revokeObjectURL(link.href);
}

// Gera um PDF a partir de uma tabela HTML, ignorando a coluna de Ações
function exportarPDF(tableId, nomeArquivo, titulo) {
  const table = document.getElementById(tableId);
  const doc = new jspdf.jsPDF();

  doc.text(titulo, 14, 15);

  const colunas = [...table.querySelectorAll("thead th")]
    .filter((th) => th.textContent.trim() !== "Ações")
    .map((th) => th.textContent.trim());

  const linhas = [...table.querySelectorAll("tbody tr")].map((tr) =>
    [...tr.querySelectorAll("td")]
      .filter((td) => !td.classList.contains("actions-td"))
      .map((td) => td.textContent.trim()),
  );

  doc.autoTable({ head: [colunas], body: linhas, startY: 20 });
  doc.save(`${nomeArquivo}.pdf`);
}

function apenasDigitos(texto) {
  return texto.replace(/\D/g, "");
}

function nomeDoador(idDoador) {
  const doador = doadoresData.find((d) => d.id_doador === idDoador);
  return doador ? `${doador.nome} (${doador.email || "sem email"})` : "-";
}

// Selects de doador com campo de busca (biblioteca Choices.js)
let choicesDoador,
  choicesEditDoador,
  choicesDoadorInteracao,
  choicesEditDoadorInteracao;

function initSelectsBuscaDoador() {
  const config = {
    searchEnabled: true,
    searchPlaceholderValue: "Buscar doador...",
    noResultsText: "Nenhum doador encontrado",
    placeholder: true,
    placeholderValue: "Selecione um doador",
    shouldSort: false,
    itemSelectText: "",
  };

  choicesDoador = new Choices("#idDoador", config);
  choicesEditDoador = new Choices("#editIdDoador", config);
  choicesDoadorInteracao = new Choices("#idDoadorInteracao", config);
  choicesEditDoadorInteracao = new Choices("#editIdDoadorInteracao", config);
}

function preencherDropdownDoadores() {
  const opcoes = doadoresData.map((d) => ({
    value: String(d.id_doador),
    label: `${d.nome} (${d.email || "sem email"})`,
  }));

  [
    choicesDoador,
    choicesEditDoador,
    choicesDoadorInteracao,
    choicesEditDoadorInteracao,
  ].forEach((instancia) => {
    instancia.clearStore();
    instancia.setChoices(opcoes, "value", "label", true);
  });
}

function badgeStatus(status) {
  const cores = {
    Pago: "bg-success",
    Pendente: "bg-warning",
    "Não Pago": "bg-danger",
  };
  const cor = cores[status] || "bg-secondary";
  return `<span class="badge ${cor}">${status || "-"}</span>`;
}

function formatarData(data) {
  if (!data) return "";
  const [ano, mes, dia] = data.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

function hojeISO() {
  const hoje = new Date();
  const ano = hoje.getFullYear();
  const mes = String(hoje.getMonth() + 1).padStart(2, "0");
  const dia = String(hoje.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

// Ícone de alerta para doações com data futura (doador disse que vai doar, mas ainda não doou)
function destaqueDataFutura(data) {
  if (!data) return "";
  const ehFutura = data.split("T")[0] > hojeISO();
  return ehFutura
    ? `<i class="fi fi-rr-clock text-danger me-1" title="Data futura - doação ainda não realizada"></i>`
    : "";
}

document
  .getElementById("modalNovaDoacao")
  .addEventListener("show.bs.modal", () => {
    document.getElementById("doacaoData").value = hojeISO();
  });

document.getElementById("dataInteracao").max = hojeISO();
document.getElementById("editDataInteracao").max = hojeISO();

document
  .getElementById("modalNovaInteracao")
  .addEventListener("show.bs.modal", () => {
    document.getElementById("dataInteracao").value = hojeISO();
  });

async function addDoador() {
  const nomeDigitado = document.getElementById("doadorNome").value.trim();
  const nome = nomeDigitado.charAt(0).toUpperCase() + nomeDigitado.slice(1);
  const telefone = document.getElementById("doadorTelefone").value;
  const cpf = document.getElementById("doadorCpf").value;
  const endereco = document.getElementById("doadorEndereco").value;
  const email = document.getElementById("doadorEmail").value || ""; // opcional

  if (!nome) {
    return Swal.fire({
      icon: "error",
      title: "Informe o nome do doador!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return Swal.fire({
      icon: "error",
      title: "E-mail inválido",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const telefoneDigitos = apenasDigitos(telefone);
  if (
    telefoneDigitos &&
    telefoneDigitos.length !== 10 &&
    telefoneDigitos.length !== 11
  ) {
    return Swal.fire({
      icon: "error",
      title: "Telefone inválido (informe DDD + número)",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const cpfDigitos = apenasDigitos(cpf);
  if (cpfDigitos && cpfDigitos.length !== 11 && cpfDigitos.length !== 14) {
    return Swal.fire({
      icon: "error",
      title: "CPF/CNPJ inválido",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { error } = await supabaseClient
    .from("doador_novo")
    .insert({ nome, telefone, cpf_cnpj: cpf, endereco, email });
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro ao salvar, tente novamente: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  fecharModal("modalNovoDoador", "formNovoDoador");
  loadDoadores();
}

function updateDoador(id) {
  const doador = doadoresData.find((d) => d.id_doador === id);
  if (!doador) {
    return Swal.fire({
      icon: "error",
      title: "Doador não encontrado no cache. Recarregue a página.",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  document.getElementById("editDoadorId").value = doador.id_doador;
  document.getElementById("editDoadorNome").value = doador.nome || "";
  document.getElementById("editDoadorTelefone").value = doador.telefone || "";
  document.getElementById("editDoadorCpf").value = doador.cpf_cnpj || "";
  document.getElementById("editDoadorEndereco").value = doador.endereco || "";
  document.getElementById("editDoadorEmail").value = doador.email || "";

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalEditarDoador"),
  ).show();
}

async function salvarEdicaoDoador() {
  const id = document.getElementById("editDoadorId").value;
  const nome = document.getElementById("editDoadorNome").value.trim();
  const telefone = document.getElementById("editDoadorTelefone").value;
  const cpf = document.getElementById("editDoadorCpf").value;
  const endereco = document.getElementById("editDoadorEndereco").value;
  const email = document.getElementById("editDoadorEmail").value;

  if (!nome) {
    return Swal.fire({
      icon: "error",
      title: "Informe o nome do doador!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (email && !/^\S+@\S+\.\S+$/.test(email)) {
    return Swal.fire({
      icon: "error",
      title: "E-mail inválido",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const telefoneDigitos = apenasDigitos(telefone);
  if (
    telefoneDigitos &&
    telefoneDigitos.length !== 10 &&
    telefoneDigitos.length !== 11
  ) {
    return Swal.fire({
      icon: "error",
      title: "Telefone inválido (informe DDD + número)",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const cpfDigitos = apenasDigitos(cpf);
  if (cpfDigitos && cpfDigitos.length !== 11 && cpfDigitos.length !== 14) {
    return Swal.fire({
      icon: "error",
      title: "CPF/CNPJ inválido",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { error } = await supabaseClient
    .from("doador_novo")
    .update({ nome, telefone, cpf_cnpj: cpf, endereco, email })
    .eq("id_doador", id);
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro ao salvar, tente novamente: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  Swal.fire({
    icon: "success",
    title: "Informações salvas!",
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,
    animation: true,
  });

  fecharModal("modalEditarDoador", "formEditarDoador");
  loadDoadores();
}

function deleteDoador(id) {
  const temDoacoes = doacoesData.some((d) => d.id_doador === id);
  const temInteracoes = interacoesData.some((i) => i.id_doador === id);

  if (temDoacoes || temInteracoes) {
    return Swal.fire({
      icon: "error",
      title: "Não é possível excluir",
      text: "Esse doador tem doações ou interações registradas. Exclua ou reatribua esses registros a outro doador antes de excluí-lo.",
      position: "top-end",
      showConfirmButton: false,
      timer: 2500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  Swal.fire({
    title: "Tem certeza?",
    text: "Essa ação não pode ser desfeita!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-danger me-2",
      cancelButton: "btn btn-ghost",
    },
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    const { error } = await supabaseClient
      .from("doador_novo")
      .delete()
      .eq("id_doador", id);
    if (error) {
      return Swal.fire({
        icon: "error",
        title: "Erro ao excluir: " + error.message,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        toast: true,
        animation: true,
      });
    }

    Swal.fire({
      icon: "success",
      title: "Doador excluído!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
    loadDoadores();
  });
}

// =========================
//  DOAÇÃO NOVA
// =========================
async function loadDoacoes() {
  const { data, error } = await supabaseClient.from("doacao_nova").select("*");
  if (error) return console.error(error);

  doacoesData = data;

  const tbody = document.querySelector("#doacaoTable tbody");
  tbody.innerHTML = "";
  data.forEach((d) => {
    tbody.innerHTML += `<tr>
      <td>${nomeDoador(d.id_doador)}</td>
      <td>R$ <strong>${d.valor}</strong></td>
      <td>${destaqueDataFutura(d.data_doacao)}${formatarData(d.data_doacao)}</td>
      <td>${badgeStatus(d.status)}</td>
      <td class="actions-td">
        <div class="actions-content">
          <primary-button icon="fi fi-rr-pencil" className="btn btn-outline-secondary" data-onclick="updateDoacao(${d.id_doacao})"></primary-button>
          <primary-button icon="fi fi-rr-trash" className="btn btn-danger" data-onclick="deleteDoacao(${d.id_doacao})"></primary-button>
        </div>
      </td>
    </tr>`;
  });

  // Atualiza o contador de doações na tabela de doadores, se ela já tiver sido carregada
  if (doadoresData.length) renderDoadorTable();
}

async function addDoacao() {
  const valor = document.getElementById("doacaoValor").value;
  const dataDoacao = document.getElementById("doacaoData").value;
  const forma = document.getElementById("doacaoForma").value;
  const idDoador = document.getElementById("idDoador").value;

  if (!idDoador) {
    return Swal.fire({
      icon: "error",
      title: "Informe o Id do Doador!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!valor || parseFloat(valor) <= 0) {
    return Swal.fire({
      icon: "error",
      title: "Informe um valor válido maior que zero",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!forma) {
    return Swal.fire({
      icon: "error",
      title: "Selecione a forma de pagamento",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { data: doador, error: doadorError } = await supabaseClient
    .from("doador_novo")
    .select("id_doador")
    .eq("id_doador", idDoador)
    .single();

  if (doadorError || !doador) {
    return Swal.fire({
      icon: "error",
      title: "Doador não encontrado! Verifique o ID informado.",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { error } = await supabaseClient.from("doacao_nova").insert({
    id_doador: parseInt(idDoador),
    valor: parseFloat(valor),
    data_doacao: dataDoacao,
    forma_pagamento: forma,
    status: "Pendente",
  });
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro ao salvar, tente novamente: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  fecharModal("modalNovaDoacao", "formNovaDoacao");
  loadDoacoes();
}

function updateDoacao(id) {
  const doacao = doacoesData.find((d) => d.id_doacao === id);
  if (!doacao) {
    return Swal.fire({
      icon: "error",
      title: "Doação não encontrada no cache. Recarregue a página.",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  document.getElementById("editDoacaoId").value = doacao.id_doacao;
  choicesEditDoador.setChoiceByValue(String(doacao.id_doador));
  document.getElementById("editDoacaoValor").value = doacao.valor || "";
  document.getElementById("editDoacaoData").value = doacao.data_doacao || "";
  document.getElementById("editDoacaoForma").value =
    doacao.forma_pagamento || "";
  document.getElementById("editDoacaoStatus").value = doacao.status || "";

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalEditarDoacao"),
  ).show();
}

async function salvarEdicaoDoacao() {
  const id = document.getElementById("editDoacaoId").value;
  const idDoador = document.getElementById("editIdDoador").value;
  const valor = document.getElementById("editDoacaoValor").value;
  const dataDoacao = document.getElementById("editDoacaoData").value;
  const forma = document.getElementById("editDoacaoForma").value;
  const status = document.getElementById("editDoacaoStatus").value;

  if (!idDoador) {
    return Swal.fire({
      icon: "error",
      title: "Selecione o doador",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!valor || parseFloat(valor) <= 0) {
    return Swal.fire({
      icon: "error",
      title: "Informe um valor válido maior que zero",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!forma) {
    return Swal.fire({
      icon: "error",
      title: "Selecione a forma de pagamento",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!status) {
    return Swal.fire({
      icon: "error",
      title: "Selecione o status",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { error } = await supabaseClient
    .from("doacao_nova")
    .update({
      id_doador: parseInt(idDoador),
      valor: parseFloat(valor),
      data_doacao: dataDoacao,
      forma_pagamento: forma,
      status,
    })
    .eq("id_doacao", id);
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro ao salvar, tente novamente: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  Swal.fire({
    icon: "success",
    title: "Informações salvas!",
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,
    animation: true,
  });

  fecharModal("modalEditarDoacao", "formEditarDoacao");
  loadDoacoes();
}

function deleteDoacao(id) {
  Swal.fire({
    title: "Tem certeza?",
    text: "Essa ação não pode ser desfeita!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-danger me-2",
      cancelButton: "btn btn-ghost",
    },
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    const { error } = await supabaseClient
      .from("doacao_nova")
      .delete()
      .eq("id_doacao", id);
    if (error) {
      return Swal.fire({
        icon: "error",
        title: "Erro ao excluir: " + error.message,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        toast: true,
        animation: true,
      });
    }

    Swal.fire({
      icon: "success",
      title: "Doação excluída!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
    loadDoacoes();
  });
}

// =========================
// INTERAÇÃO NOVA (ong e doador)
// =========================
async function loadInteracoes() {
  let query = supabaseClient.from("interacao_nova").select("*");
  // if (!isAdmin) query = query.eq("id_doador", currentDoadorId);

  const { data, error } = await query;
  if (error) return console.error(error);

  interacoesData = data;

  const tbody = document.querySelector("#interacaoTable tbody");
  tbody.innerHTML = "";
  data.forEach((i) => {
    tbody.innerHTML += `<tr>
      <td>${nomeDoador(i.id_doador)}</td>
      <td>${i.tipo_interacao}</td>
      <td>${i.observacoes || ""}</td>
      <td>${formatarData(i.data_interacao)}</td>
      <td class="actions-td">
        <div class="actions-content">
          <primary-button icon="fi fi-rr-pencil" className="btn btn-outline-secondary" data-onclick="updateInteracaoNova(${i.id_interacao})"></primary-button>
          ${isAdmin ? `<primary-button icon="fi fi-rr-trash" className="btn btn-danger" data-onclick="deleteInteracaoNova(${i.id_interacao})"></primary-button>` : ""}
        </div>
      </td>
    </tr>`;
  });
}

async function addInteracaoNova() {
  const tipo = document.getElementById("tipoInteracao").value;
  const obs = document.getElementById("observacoes").value;
  const dataInteracao = document.getElementById("dataInteracao").value;
  const idDoador = document.getElementById("idDoadorInteracao").value || "";

  if (!idDoador) {
    return Swal.fire({
      icon: "error",
      title: "Informe o ID do Doador!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!tipo) {
    return Swal.fire({
      icon: "error",
      title: "Informe o tipo da interação",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (dataInteracao && dataInteracao > hojeISO()) {
    return Swal.fire({
      icon: "error",
      title: "A data da interação não pode ser no futuro",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { data: doador, error: doadorError } = await supabaseClient
    .from("doador_novo")
    .select("id_doador")
    .eq("id_doador", idDoador)
    .single();

  if (doadorError || !doador) {
    return Swal.fire({
      icon: "error",
      title: "Doador não encontrado! Verifique o ID informado.",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { error } = await supabaseClient.from("interacao_nova").insert({
    id_doador: parseInt(idDoador),
    id_usuario: currentUser.id,
    tipo_interacao: tipo,
    observacoes: obs,
    data_interacao: dataInteracao,
  });
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro ao salvar, tente novamente: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  Swal.fire({
    icon: "success",
    title: "Informações salvas!",
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,
    animation: true,
  });

  fecharModal("modalNovaInteracao", "formNovaInteracao");
  loadInteracoes();
}

function updateInteracaoNova(id) {
  const interacao = interacoesData.find((i) => i.id_interacao === id);
  if (!interacao) {
    return Swal.fire({
      icon: "error",
      title: "Interação não encontrada no cache. Recarregue a página.",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  document.getElementById("editInteracaoId").value = interacao.id_interacao;
  choicesEditDoadorInteracao.setChoiceByValue(String(interacao.id_doador));
  document.getElementById("editTipoInteracao").value =
    interacao.tipo_interacao || "";
  document.getElementById("editObservacoes").value =
    interacao.observacoes || "";
  document.getElementById("editDataInteracao").value = interacao.data_interacao
    ? interacao.data_interacao.split("T")[0]
    : "";

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalEditarInteracao"),
  ).show();
}

async function salvarEdicaoInteracao() {
  const id = document.getElementById("editInteracaoId").value;
  const idDoador = document.getElementById("editIdDoadorInteracao").value;
  const tipo = document.getElementById("editTipoInteracao").value;
  const obs = document.getElementById("editObservacoes").value;
  const dataInteracao = document.getElementById("editDataInteracao").value;

  if (!idDoador) {
    return Swal.fire({
      icon: "error",
      title: "Informe o ID do Doador!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (!tipo) {
    return Swal.fire({
      icon: "error",
      title: "Informe o tipo da interação",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  if (dataInteracao && dataInteracao > hojeISO()) {
    return Swal.fire({
      icon: "error",
      title: "A data da interação não pode ser no futuro",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { data: doador, error: doadorError } = await supabaseClient
    .from("doador_novo")
    .select("id_doador")
    .eq("id_doador", idDoador)
    .single();

  if (doadorError || !doador) {
    return Swal.fire({
      icon: "error",
      title: "Doador não encontrado! Verifique o ID informado.",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  const { error } = await supabaseClient
    .from("interacao_nova")
    .update({
      id_doador: parseInt(idDoador),
      tipo_interacao: tipo,
      observacoes: obs,
      data_interacao: dataInteracao,
    })
    .eq("id_interacao", id);
  if (error) {
    return Swal.fire({
      icon: "error",
      title: "Erro ao salvar, tente novamente: " + error.message,
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  Swal.fire({
    icon: "success",
    title: "Informações salvas!",
    position: "top-end",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,
    animation: true,
  });

  fecharModal("modalEditarInteracao", "formEditarInteracao");
  loadInteracoes();
}

function deleteInteracaoNova(id) {
  if (!isAdmin) {
    return Swal.fire({
      icon: "error",
      title: "Somente admins podem deletar interações",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
  }

  Swal.fire({
    title: "Tem certeza?",
    text: "Essa ação não pode ser desfeita!",
    icon: "warning",
    showCancelButton: true,
    confirmButtonText: "Sim, excluir!",
    cancelButtonText: "Cancelar",
    buttonsStyling: false,
    customClass: {
      confirmButton: "btn btn-danger me-2",
      cancelButton: "btn btn-ghost",
    },
  }).then(async (result) => {
    if (!result.isConfirmed) return;

    const { error } = await supabaseClient
      .from("interacao_nova")
      .delete()
      .eq("id_interacao", id);
    if (error) {
      return Swal.fire({
        icon: "error",
        title: "Erro ao excluir: " + error.message,
        position: "top-end",
        showConfirmButton: false,
        timer: 1500,
        timerProgressBar: true,
        toast: true,
        animation: true,
      });
    }

    Swal.fire({
      icon: "success",
      title: "Interação excluída!",
      position: "top-end",
      showConfirmButton: false,
      timer: 1500,
      timerProgressBar: true,
      toast: true,
      animation: true,
    });
    loadInteracoes();
  });
}

// =========================
// Load inicial do sistema
// =========================
async function loadData() {
  await loadDoadores();
  await loadDoacoes();
  await loadInteracoes();
  renderDashboard();
}

function viewSenha() {
  var tipo = document.getElementById("password");
  var icon = document.getElementById("icon-password");

  if (tipo.type == "password") {
    tipo.type = "text";
    icon.className = "fi fi-rr-eye";
  } else {
    tipo.type = "password";
    icon.className = "fi fi-rr-eye-crossed";
  }
}

function toggleSenhaBtn() {
  var senha = document.getElementById("password");
  var btn = document.getElementById("btn-toggle-senha");
  btn.disabled = senha.value.length === 0;
}

// COMPONENTES MODULARES
// function primaryButton({
//   label = "",
//   type = "primary",
//   title = "",
//   onClick,
//   className = "",
//   icon,
//   iconId,
// }) {
//   return `
//     <button type="button" ${title ? `title="${title}"` : ""} class="${className}" ${onClick ? `onclick="${onClick}"` : ""}>
//         ${icon ? `<i ${iconId ? `id="${iconId}"` : ""} class="${icon}"></i>` : ""}
//         ${label}
//     </button>
//   `;
// }

// Função berga botão // igual react
function primaryButton({
  label = "",
  title = "",
  onClick,
  className = "",
  icon,
  iconId,
  id,
  disabled,
}) {
  return `
    <button type="button" ${id ? `id="${id}"` : ""} ${title ? `title="${title}"` : ""} class="${className}" ${onClick ? `onclick="${onClick}"` : ""} ${disabled ? "disabled" : ""}>
        ${icon ? `<i ${iconId ? `id="${iconId}"` : ""} class="${icon}${label ? " me-1" : ""}"></i>` : ""}
        ${label ? `<span class="">${label}</span>` : ""}
    </button>
  `;
}

// Registrando a Tag Nativa
customElements.define(
  "primary-button",
  class extends HTMLElement {
    connectedCallback() {
      this.innerHTML = primaryButton({
        label: this.getAttribute("label"),
        title: this.getAttribute("title"),
        className: this.getAttribute("className") || "",
        onClick: this.getAttribute("data-onclick"),
        icon: this.getAttribute("icon"),
        iconId: this.getAttribute("iconId"),
        id: this.getAttribute("data-id"),
        disabled: this.hasAttribute("disabled"),
      });
    }
  },
);
