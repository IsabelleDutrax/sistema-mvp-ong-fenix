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
      <td class="actions-td">
        <div class="actions-content">
          <primary-button icon="fi fi-rr-pencil" className="btn btn-outline-secondary" data-onclick="updateDoador(${d.id_doador})"></primary-button>
          <primary-button icon="fi fi-rr-trash" className="btn-danger" data-onclick="deleteDoador(${d.id_doador})"></primary-button>
        </div>
      </td>
    </tr>`;
  });
}

function apenasDigitos(texto) {
  return texto.replace(/\D/g, "");
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

document.getElementById("doacaoData").max = hojeISO();
document.getElementById("editDoacaoData").max = hojeISO();

document.getElementById("modalNovaDoacao").addEventListener("show.bs.modal", () => {
  document.getElementById("doacaoData").value = hojeISO();
});

document.getElementById("dataInteracao").max = hojeISO();
document.getElementById("editDataInteracao").max = hojeISO();

document.getElementById("modalNovaInteracao").addEventListener("show.bs.modal", () => {
  document.getElementById("dataInteracao").value = hojeISO();
});

async function addDoador() {
  const nome = document.getElementById("doadorNome").value.trim();
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
  if (!doador) return alert("Doador não encontrado no cache. Recarregue a página.");

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
      <td><strong>R$</strong> ${d.valor}</td>
      <td>${formatarData(d.data_doacao)}</td>
      <td>${badgeStatus(d.status)}</td>
      <td class="actions-td">
        <div class="actions-content">
          <primary-button icon="fi fi-rr-pencil" className="btn btn-outline-secondary" data-onclick="updateDoacao(${d.id_doacao})"></primary-button>
          <primary-button icon="fi fi-rr-trash" className="btn-danger" data-onclick="deleteDoacao(${d.id_doacao})"></primary-button>
        </div>
      </td>
    </tr>`;
  });
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

  if (dataDoacao && dataDoacao > hojeISO()) {
    return Swal.fire({
      icon: "error",
      title: "A data da doação não pode ser no futuro",
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
  if (!doacao) return alert("Doação não encontrada no cache. Recarregue a página.");

  document.getElementById("editDoacaoId").value = doacao.id_doacao;
  document.getElementById("editDoacaoValor").value = doacao.valor || "";
  document.getElementById("editDoacaoData").value = doacao.data_doacao || "";
  document.getElementById("editDoacaoForma").value = doacao.forma_pagamento || "";
  document.getElementById("editDoacaoStatus").value = doacao.status || "";

  bootstrap.Modal.getOrCreateInstance(
    document.getElementById("modalEditarDoacao"),
  ).show();
}

async function salvarEdicaoDoacao() {
  const id = document.getElementById("editDoacaoId").value;
  const valor = document.getElementById("editDoacaoValor").value;
  const dataDoacao = document.getElementById("editDoacaoData").value;
  const forma = document.getElementById("editDoacaoForma").value;
  const status = document.getElementById("editDoacaoStatus").value;

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

  if (dataDoacao && dataDoacao > hojeISO()) {
    return Swal.fire({
      icon: "error",
      title: "A data da doação não pode ser no futuro",
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
    .update({ valor: parseFloat(valor), data_doacao: dataDoacao, forma_pagamento: forma, status })
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
      <td>${i.id_doador || ""}</td>
      <td>${i.tipo_interacao}</td>
      <td>${i.observacoes || ""}</td>
      <td>${formatarData(i.data_interacao)}</td>
      <td class="actions-td">
        <div class="actions-content">
          <primary-button icon="fi fi-rr-pencil" className="btn btn-outline-secondary" data-onclick="updateInteracaoNova(${i.id_interacao})"></primary-button>
          ${isAdmin ? `<primary-button icon="fi fi-rr-trash" className="btn-danger" data-onclick="deleteInteracaoNova(${i.id_interacao})"></primary-button>` : ""}
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
  if (!interacao) return alert("Interação não encontrada no cache. Recarregue a página.");

  document.getElementById("editInteracaoId").value = interacao.id_interacao;
  document.getElementById("editIdDoadorInteracao").value = interacao.id_doador || "";
  document.getElementById("editTipoInteracao").value = interacao.tipo_interacao || "";
  document.getElementById("editObservacoes").value = interacao.observacoes || "";
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
  id,
  disabled,
}) {
  return `
    <button type="button" ${id ? `id="${id}"` : ""} ${title ? `title="${title}"` : ""} class="${className}" ${onClick ? `onclick="${onClick}"` : ""} ${disabled ? "disabled" : ""}>
        ${icon ? `<i ${iconId ? `id="${iconId}"` : ""} class="${icon}"></i>` : ""}
        ${label ? `<span class="ms-1">${label}</span>` : ""}
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
