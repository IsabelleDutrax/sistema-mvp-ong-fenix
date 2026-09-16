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

// ALternar visualização das páginas:
function showLogin() {
  document.getElementById("login-page").classList.remove("hidden");
  document.getElementById("system-page").classList.add("hidden");
}

function showSystem() {
  document.getElementById("login-page").classList.add("hidden");
  document.getElementById("system-page").classList.remove("hidden");
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
  if (error) return alert("Erro: " + error.message);

  showSystem();

  currentUser = data.user;

  // Checa se o usuário é admin
  const { data: doadorData } = await supabaseClient
    .from("doador")
    .select("nivel_acesso")
    .eq("id_usuario", currentUser.id)
    .single();

  isAdmin = doadorData && doadorData.nivel_acesso === 99;

  // alert("Login OK! Admin: " + isAdmin);
  Swal.fire({
    icon: "success",
    title: "Successo!",
    text: `Login OK! Admin:${isAdmin}`,
    position: "top-right",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,

    animation: true,
  });
  loadData();
  //   toggleSections(true);
}

async function signOut() {
  await supabaseClient.auth.signOut();
  showLogin();

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
}

// Calcula e exibe os números do dashboard a partir dos dados já carregados
function renderDashboard() {
  const totalArrecadado = doacoesData.reduce(
    (soma, d) => soma + (Number(d.valor) || 0),
    0,
  );
  document.getElementById("statTotalArrecadado").textContent =
    totalArrecadado.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  document.getElementById("statDoadores").textContent = doadoresData.length;
  document.getElementById("statDoacoes").textContent = doacoesData.length;
  document.getElementById("statInteracoes").textContent = interacoesData.length;
}

// Fecha o modal do Bootstrap e limpa os campos do formulário
function fecharModal(modalId, formId) {
  const modalEl = document.getElementById(modalId);
  bootstrap.Modal.getOrCreateInstance(modalEl).hide();
  document.getElementById(formId).reset();
}

// =========================
// 🧑 DOADOR NOVO
// =========================
async function loadDoadores() {
  const { data, error } = await supabaseClient.from("doador_novo").select("*");
  if (error) return console.error(error);

  doadoresData = data;

  const tbody = document.querySelector("#doadorTable tbody");
  tbody.innerHTML = "";
  data.forEach((d) => {
    tbody.innerHTML += `<tr>
      <td>${d.id_doador}</td>
      <td>${d.nome}</td>
      <td>${d.email || ""}</td>
      <td>${d.telefone || ""}</td>
      <td>
        <button onclick="updateDoador(${d.id_doador})"><i class="fi fi-rr-pencil"></i></button>
        <button onclick="deleteDoador(${d.id_doador})"><i class="fi fi-rr-trash"></i></button>
      </td>
    </tr>`;
  });
}

async function addDoador() {
  const nome = document.getElementById("doadorNome").value.trim();
  const telefone = document.getElementById("doadorTelefone").value;
  const cpf = document.getElementById("doadorCpf").value;
  const endereco = document.getElementById("doadorEndereco").value;
  const email = document.getElementById("doadorEmail").value || ""; // opcional

  if (!nome) return alert("Informe o nome do doador!");

  const { error } = await supabaseClient
    .from("doador_novo")
    .insert({ nome, telefone, cpf_cnpj: cpf, endereco, email });
  if (error) return alert("Erro: " + error.message);

  fecharModal("modalNovoDoador", "formNovoDoador");
  loadDoadores();
}

async function updateDoador(id) {
  const nome = prompt("Novo nome do doador:");
  const telefone = prompt("Novo telefone:");
  const cpf = prompt("Novo CPF/CNPJ:");
  const endereco = prompt("Novo endereço:");
  const email = prompt("Novo email (opcional):");

  const updateData = {};
  if (nome) updateData.nome = nome;
  if (telefone) updateData.telefone = telefone;
  if (cpf) updateData.cpf_cnpj = cpf;
  if (endereco) updateData.endereco = endereco;
  if (email) updateData.email = email;

  const { error } = await supabaseClient
    .from("doador_novo")
    .update(updateData)
    .eq("id_doador", id);
  if (error) return alert("Erro: " + error.message);
  loadDoadores();
}

async function deleteDoador(id) {
  if (!confirm("Tem certeza que deseja deletar este doador?")) return;
  const { error } = await supabaseClient
    .from("doador_novo")
    .delete()
    .eq("id_doador", id);
  if (error) return alert("Erro: " + error.message);
  loadDoadores();
}

// =========================
// 💸 DOAÇÃO NOVA
// =========================
async function loadDoacoes() {
  const { data, error } = await supabaseClient.from("doacao_nova").select("*");
  if (error) return console.error(error);

  doacoesData = data;

  const tbody = document.querySelector("#doacaoTable tbody");
  tbody.innerHTML = "";
  data.forEach((d) => {
    tbody.innerHTML += `<tr>
      <td>${d.id_doacao}</td>
      <td>${d.id_doador}</td>
      <td>${d.valor}</td>
      <td>${d.data_doacao || ""}</td>
      <td>${d.status || ""}</td>
      <td>
        <button onclick="updateDoacao(${d.id_doacao})"><i class="fi fi-rr-pencil"></i></button>
        <button onclick="deleteDoacao(${d.id_doacao})"><i class="fi fi-rr-trash"></i></button>
      </td>
    </tr>`;
  });
}

async function addDoacao() {
  const valor = document.getElementById("doacaoValor").value;
  const dataDoacao = document.getElementById("doacaoData").value;
  const forma = document.getElementById("doacaoForma").value;
  const idDoador = document.getElementById("idDoador").value;

  if (!idDoador) return alert("Informe o Id do Doador!");

  // Verificar se o ID do doador existe na tabela doadores
  const { data: doador, error: doadorError } = await supabaseClient
    .from("doador_novo")
    .select("id_doador") // Seleciona todo o conteúdo (ou só "id_doador" para otimizar)
    .eq("id_doador", idDoador)
    .single();

  // Tratamento dos erros ou ausência do doador no banco
  if (doadorError || !doador) {
    return alert("Doador não encontrado! Verifique o ID informado.");
  }

  const { error } = await supabaseClient.from("doacao_nova").insert({
    id_doador: parseInt(idDoador),
    valor: parseFloat(valor),
    data_doacao: dataDoacao,
    forma_pagamento: forma,
  });
  if (error) return alert("Erro: " + error.message);

  fecharModal("modalNovaDoacao", "formNovaDoacao");
  loadDoacoes();
}

async function updateDoacao(id) {
  const valor = prompt("Novo valor:");
  const forma = prompt("Nova forma de pagamento:");
  const status = prompt("Novo status:");

  const updateData = {};
  if (valor) updateData.valor = parseFloat(valor);
  if (forma) updateData.forma_pagamento = forma;
  if (status) updateData.status = status;

  const { error } = await supabaseClient
    .from("doacao_nova")
    .update(updateData)
    .eq("id_doacao", id);
  if (error) return alert("Erro: " + error.message);
  loadDoacoes();
}

async function deleteDoacao(id) {
  if (!confirm("Deseja deletar esta doação?")) return;
  const { error } = await supabaseClient
    .from("doacao_nova")
    .delete()
    .eq("id_doacao", id);
  if (error) return alert("Erro: " + error.message);
  loadDoacoes();
}

// =========================
// 📞 INTERAÇÃO NOVA
// =========================
async function loadInteracoes() {
  console.log("load das interações");
  let query = supabaseClient.from("interacao_nova").select("*");
  // if (!isAdmin) query = query.eq("id_doador", currentDoadorId);

  const { data, error } = await query;
  if (error) return console.error(error);

  interacoesData = data;

  const tbody = document.querySelector("#interacaoTable tbody");
  tbody.innerHTML = "";
  data.forEach((i) => {
    tbody.innerHTML += `<tr>
      <td>${i.id_interacao}</td>
      <td>${i.id_doador || ""}</td>
      <td>${i.tipo_interacao}</td>
      <td>${i.observacoes || ""}</td>
      <td>${i.data_interacao}</td>
      <td>
        <button onclick="updateInteracaoNova(${i.id_interacao})"><i class="fi fi-rr-pencil"></i></button>
        ${isAdmin ? `<button onclick="deleteInteracaoNova(${i.id_interacao})"><i class="fi fi-rr-trash"></i></button>` : ""}
      </td>
    </tr>`;
  });
}

async function addInteracaoNova() {
  const tipo = document.getElementById("tipoInteracao").value;
  const obs = document.getElementById("observacoes").value;
  const idDoador = document.getElementById("idDoadorInteracao").value || "";

  if (!idDoador) return alert("Informe o ID do Doador!");

  // Verificar se o ID do doador existe na tabela doadores
  const { data: doador, error: doadorError } = await supabaseClient
    .from("doador_novo")
    .select("id_doador") // Seleciona todo o conteúdo (ou só "id_doador" para otimizar)
    .eq("id_doador", idDoador)
    .single();

  // Tratamento dos erros ou ausência do doador no banco
  if (doadorError || !doador) {
    return alert("Doador não encontrado! Verifique o ID informado.");
  }

  const { error } = await supabaseClient.from("interacao_nova").insert({
    id_doador: parseInt(idDoador),
    id_usuario: currentUser.id,
    tipo_interacao: tipo,
    observacoes: obs,
  });
  if (error) return alert("Erro: " + error.message);

  Swal.fire({
    icon: "success",
    title: "Successo!",
    text: "Interação adicionada com sucesso!",
    position: "top-right",
    showConfirmButton: false,
    timer: 1500,
    timerProgressBar: true,
    toast: true,
  });

  fecharModal("modalNovaInteracao", "formNovaInteracao");
  loadInteracoes();
}

async function updateInteracaoNova(id) {
  const tipo = prompt("Novo tipo:");
  const obs = prompt("Nova observação:");
  const { error } = await supabaseClient
    .from("interacao_nova")
    .update({ tipo_interacao: tipo, observacoes: obs })
    .eq("id_interacao", id);
  if (error) return alert("Erro: " + error.message);
  loadInteracoes();
}

async function deleteInteracaoNova(id) {
  if (!isAdmin) return alert("Somente admins podem deletar interações");
  if (!confirm("Deseja deletar esta interação?")) return;

  const { error } = await supabaseClient
    .from("interacao_nova")
    .delete()
    .eq("id_interacao", id);
  if (error) return alert("Erro: " + error.message);
  loadInteracoes();
}

// =========================
// 🚀 Load inicial
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
}) {
  return `
    <button type="button" ${title ? `title="${title}"` : ""} class="${className}" ${onClick ? `onclick="${onClick}"` : ""}>
        ${icon ? `<i ${iconId ? `id="${iconId}"` : ""} class="${icon}"></i>` : ""}
        ${label}
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
        className: this.getAttribute("className") || "btn-block",
        onClick: this.getAttribute("onClick"),
        icon: this.getAttribute("icon"),
        iconId: this.getAttribute("iconId"),
      });
    }
  },
);
