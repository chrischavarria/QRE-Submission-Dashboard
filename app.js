const SUPABASE_URL = "https://xjprkxxhepalknpxnqlb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcHJreHhoZXBhbGtucHhucWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjQ1MjksImV4cCI6MjA5NzIwMDUyOX0.GE1LfJA-sHRCYZpw1m3N8x2uoYBXYxO8d2oUrqSOcOg";

const DEPARTMENTS = ["Front", "Lab", "Contract Fulfillment", "Front Fulfillment", "RPh", "Other"];

const OPTIONS = {
  nature: ["Death", "Injury/Infection", "Adverse drug reaction", "Error", "Complaint", "Facility/equipment", "Material", "Other"],
  source: ["In-person/internal", "Phone", "Email", "Mail", "Other"],
  issue: [
    "Drug",
    "Strength",
    "Dosage Form",
    "Quantity",
    "Patient",
    "Packaging",
    "Labeling",
    "Directions",
    "QC Result",
    "Potency",
    "Shipping, delivery, or receipt",
    "Environmental monitoring",
    "Appearance",
    "Storage",
    "Facility/Equipment",
    "Quality",
    "Compounding process",
    "Other"
  ],
  failure: [
    "Over-utilization",
    "Therapeutic duplication",
    "Drug-Disease contraindications",
    "Drug-Drug contraindications",
    "Incorrect dosage or duration of treatment",
    "Directions/documentation",
    "Drug allergy",
    "Drug interaction",
    "Abuse/misuse",
    "Adverse outcomes",
    "Other"
  ]
};

const QRE_CATEGORIES = {
  clinical: {
    label: "Clinical Issues",
    threshold: "QRE form with investigation/resolution needed for all patient safety issues.",
    items: ["Patient Compliance", "Dosing Issue", "Drug/Drug Issue", "Drug/Disease Issue", "Allergy"]
  },
  complaints: {
    label: "Patient Complaints",
    threshold: "QRE form with investigation required for all drug errors and adverse reactions.",
    items: ["Drug Errors", "Adverse Reactions", "Preparation Quality", "Labeling Issue", "Packaging Issue", "Receipt Issue", "Other"]
  },
  internal: {
    label: "Internal (not dispensed)",
    threshold: "QRE form with investigation required for all drug errors and issues with potency.",
    items: ["Drug Errors", "Preparation Quality", "Labeling Issue", "Packaging Issue", "Potency Issue", "Other"]
  },
  recalls: {
    label: "Recalls",
    threshold: "QRE form with investigation/resolution and recall report needed for all issues.",
    items: ["Manufacturer", "Potency Issue", "Other"]
  },
  facility: {
    label: "Facility",
    threshold: "QRE with investigation/resolution needed for all issues.",
    items: ["Environmental Monitoring Issue", "Equipment Issue", "Other"]
  }
};

const DEMO_USERS = [
  { id: "staff-demo", email: "staff@qre.local", password: "staff123", full_name: "Demo Staff", title: "Staff", role: "staff" },
  { id: "rph-demo", email: "pharmacist@qre.local", password: "rph123", full_name: "Demo Pharmacist", title: "Pharmacist", role: "pharmacist" },
  { id: "admin-demo", email: "admin@qre.local", password: "admin123", full_name: "Demo Admin", title: "Admin", role: "admin" }
];

const state = {
  supabase: null,
  user: null,
  profile: null,
  records: [],
  selectedRecordId: null,
  activeView: "intake"
};

const storage = {
  get records() {
    return JSON.parse(localStorage.getItem("qre_records") || "[]");
  },
  set records(value) {
    localStorage.setItem("qre_records", JSON.stringify(value));
  }
};

const els = {
  authView: document.querySelector("#authView"),
  dashboardView: document.querySelector("#dashboardView"),
  loginForm: document.querySelector("#loginForm"),
  varianceForm: document.querySelector("#varianceForm"),
  reviewForm: document.querySelector("#reviewForm"),
  sessionCard: document.querySelector("#sessionCard"),
  statusBanner: document.querySelector("#statusBanner"),
  authNote: document.querySelector("#authNote"),
  viewTitle: document.querySelector("#viewTitle"),
  pendingList: document.querySelector("#pendingList"),
  pendingCount: document.querySelector("#pendingCount"),
  selectedStatus: document.querySelector("#selectedStatus"),
  reviewSummary: document.querySelector("#reviewSummary"),
  qreItems: document.querySelector("#qreItems"),
  metricMonth: document.querySelector("#metricMonth"),
  metricCards: document.querySelector("#metricCards"),
  metricTableBody: document.querySelector("#metricTable tbody")
};

init();

async function init() {
  hydrateStaticControls();
  bindEvents();
  setDefaultDates();
  await connectSupabase();
  await restoreSession();
  render();
}

function hydrateStaticControls() {
  document.querySelectorAll("[data-checkboxes]").forEach((target) => {
    const key = target.dataset.checkboxes;
    target.innerHTML = OPTIONS[key].map((option) => checkboxMarkup(key, option)).join("");
  });

  document.querySelectorAll('select[name="department"], select[name="review_department"]').forEach((select) => {
    select.innerHTML = DEPARTMENTS.map((department) => `<option>${department}</option>`).join("");
  });

  const categorySelect = els.reviewForm.elements.qre_category;
  categorySelect.innerHTML = Object.entries(QRE_CATEGORIES)
    .map(([key, value]) => `<option value="${key}">${value.label}</option>`)
    .join("");
  renderQreItems("clinical");
}

function checkboxMarkup(name, value) {
  return `<label><input type="checkbox" name="${name}" value="${escapeHtml(value)}" /> ${escapeHtml(value)}</label>`;
}

function bindEvents() {
  document.querySelectorAll(".nav-item").forEach((button) => {
    button.addEventListener("click", () => switchView(button.dataset.view));
  });

  document.querySelector("#printButton").addEventListener("click", () => window.print());
  document.querySelector("#signOutButton").addEventListener("click", signOut);
  document.querySelector("#resetFormButton").addEventListener("click", () => {
    els.varianceForm.reset();
    setDefaultDates();
  });

  els.loginForm.addEventListener("submit", onLogin);
  els.varianceForm.addEventListener("submit", onSubmitVariance);
  els.reviewForm.addEventListener("submit", onApprove);
  document.querySelector("#rejectButton").addEventListener("click", onReject);
  els.reviewForm.elements.qre_category.addEventListener("change", (event) => renderQreItems(event.target.value));
  els.metricMonth.addEventListener("change", renderMetrics);
  document.querySelector("#exportButton").addEventListener("click", exportMetricsCsv);
}

function setDefaultDates() {
  const today = new Date();
  els.varianceForm.elements.event_date.value = today.toISOString().slice(0, 10);
  els.varianceForm.elements.event_time.value = today.toTimeString().slice(0, 5);
  els.metricMonth.value = today.toISOString().slice(0, 7);
}

async function connectSupabase() {
  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_ANON_KEY;

  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseUrl.includes("YOUR-PROJECT-REF") ||
    supabaseAnonKey.includes("YOUR-ANON-PUBLIC-KEY")
  ) {
    return;
  }

  try {
    const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
    state.supabase = createClient(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.warn("Supabase client could not load. Demo mode remains available.", error);
  }
}

async function restoreSession() {
  if (state.supabase) {
    const { data } = await state.supabase.auth.getSession();
    if (data.session?.user) {
      state.user = data.session.user;
      await loadProfile();
      await loadRecords();
      return;
    }
  }

  const demoUser = JSON.parse(localStorage.getItem("qre_demo_user") || "null");
  if (demoUser) {
    state.user = demoUser;
    state.profile = demoUser;
    state.records = storage.records;
  }
}

async function onLogin(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const email = form.get("email").toString().trim();
  const password = form.get("password").toString();

  if (state.supabase) {
    const { data, error } = await state.supabase.auth.signInWithPassword({ email, password });
    if (error) {
      els.authNote.textContent = error.message;
      return;
    }
    state.user = data.user;
    await loadProfile();
    await loadRecords();
  } else {
    const demoUser = DEMO_USERS.find((candidate) => candidate.email === email && candidate.password === password);
    if (!demoUser) {
      els.authNote.textContent = "Demo credentials: staff@qre.local / staff123 or pharmacist@qre.local / rph123.";
      return;
    }
    state.user = demoUser;
    state.profile = demoUser;
    localStorage.setItem("qre_demo_user", JSON.stringify(demoUser));
    state.records = storage.records;
  }

  els.loginForm.reset();
  render();
}

async function loadProfile() {
  if (!state.supabase || !state.user) return;
  const { data, error } = await state.supabase.from("profiles").select("*").eq("id", state.user.id).single();
  if (error) {
    state.profile = { id: state.user.id, email: state.user.email, full_name: state.user.email, title: "Staff", role: "staff" };
    return;
  }
  state.profile = data;
}

async function loadRecords() {
  if (!state.supabase) {
    state.records = storage.records;
    return;
  }

  const { data, error } = await state.supabase
    .from("variance_reports")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error(error);
    state.records = [];
    return;
  }
  state.records = data || [];
}

async function onSubmitVariance(event) {
  event.preventDefault();
  const payload = formToVariance(event.currentTarget);

  if (state.supabase) {
    const { error } = await state.supabase.from("variance_reports").insert(payload);
    if (error) {
      showStatus(error.message, "error");
      return;
    }
    await notifySlack({ type: "submitted", record: payload });
    await loadRecords();
  } else {
    const next = [{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...state.records];
    state.records = next;
    storage.records = next;
  }

  event.currentTarget.reset();
  setDefaultDates();
  render();
  showStatus("Variance submitted successfully.", "success");
}

function formToVariance(form) {
  const data = new FormData(form);
  return {
    event_date: data.get("event_date"),
    event_time: data.get("event_time"),
    reported_by: data.get("reported_by"),
    department: data.get("department"),
    patient_involved: data.get("patient_involved"),
    patient_identifier: data.get("patient_identifier"),
    staff_involved: data.get("staff_involved"),
    staff_names: data.get("staff_names"),
    nature: data.getAll("nature"),
    source: data.getAll("source"),
    complainants: data.get("complainants"),
    drug_involved: data.get("drug_involved"),
    drug_details: data.get("drug_details"),
    drug_recalled: data.get("drug_recalled"),
    issue: data.getAll("issue"),
    failure: data.getAll("failure"),
    complaint: data.get("complaint"),
    investigation: data.get("investigation"),
    resolution: data.get("resolution"),
    follow_up: data.get("follow_up"),
    patient_notified: data.get("patient_notified"),
    prescriber_notified: data.get("prescriber_notified"),
    completed_by: data.get("completed_by"),
    status: "pending",
    submitted_by: state.user?.id || null
  };
}

async function onApprove(event) {
  event.preventDefault();
  if (!requirePharmacist()) return;

  const record = selectedRecord();
  if (!record) return;

  const data = new FormData(event.currentTarget);
  const update = {
    status: "approved",
    qre_category: data.get("qre_category"),
    qre_items: data.getAll("qre_items"),
    review_department: data.get("review_department"),
    pharmacist_notes: data.get("pharmacist_notes"),
    documentation_complete: data.get("documentation_complete"),
    reviewed_by: state.user.id,
    reviewed_at: new Date().toISOString()
  };

  await persistUpdate(record.id, update);
  await notifySlack({ type: "approved", record: { ...record, ...update } });
  state.selectedRecordId = null;
  els.reviewForm.reset();
  renderQreItems("clinical");
  render();
}

async function onReject() {
  if (!requirePharmacist()) return;
  const record = selectedRecord();
  if (!record) return;
  await persistUpdate(record.id, { status: "returned", reviewed_by: state.user.id, reviewed_at: new Date().toISOString() });
  state.selectedRecordId = null;
  render();
}

async function persistUpdate(id, update) {
  if (state.supabase) {
    const { error } = await state.supabase.from("variance_reports").update(update).eq("id", id);
    if (error) {
      showStatus(error.message, "error");
      return;
    }
    await loadRecords();
  } else {
    state.records = state.records.map((record) => (record.id === id ? { ...record, ...update } : record));
    storage.records = state.records;
  }
}

async function notifySlack(payload) {
  if (!state.supabase) return;
  await state.supabase.functions.invoke("slack-notify", { body: payload });
}

function requirePharmacist() {
  const role = state.profile?.role;
  if (role === "pharmacist" || role === "admin") return true;
  showStatus("A pharmacist or admin login is required for approval.", "error");
  return false;
}

async function signOut() {
  if (state.supabase) await state.supabase.auth.signOut();
  localStorage.removeItem("qre_demo_user");
  state.user = null;
  state.profile = null;
  state.records = [];
  render();
}

function switchView(view) {
  state.activeView = view;
  render();
}

function render() {
  const signedIn = Boolean(state.user);
  els.authView.classList.toggle("hidden", signedIn);
  els.dashboardView.classList.toggle("hidden", !signedIn);
  document.querySelector("#signOutButton").classList.toggle("hidden", !signedIn);
  document.querySelector("#printButton").classList.toggle("hidden", !signedIn);

  if (!signedIn) {
    els.sessionCard.innerHTML = "Demo mode is available until Supabase settings are saved.<br><br>staff@qre.local / staff123<br>pharmacist@qre.local / rph123";
    return;
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== state.activeView);
  });

  els.viewTitle.textContent = document.querySelector(`.nav-item[data-view="${state.activeView}"]`).textContent;
  const connectionLabel = state.supabase ? "Supabase connected" : "Local demo mode";
  const connectionClass = state.supabase ? "connected" : "demo";
  const roleLabel = formatRole(state.profile?.role);
  const titleLabel = state.profile?.title && state.profile.title !== roleLabel ? ` - ${state.profile.title}` : "";
  els.sessionCard.innerHTML = `<strong>${escapeHtml(state.profile?.full_name || state.user.email)}</strong><br>${escapeHtml(roleLabel + titleLabel)}<br><span class="connection-pill ${connectionClass}">${connectionLabel}</span>`;

  renderPending();
  renderMetrics();
}

function showStatus(message, tone = "success") {
  els.statusBanner.textContent = message;
  els.statusBanner.className = `status-banner ${tone}`;
  window.clearTimeout(showStatus.timeoutId);
  showStatus.timeoutId = window.setTimeout(() => {
    els.statusBanner.classList.add("hidden");
  }, 5500);
}

function formatRole(role) {
  const labels = {
    admin: "Admin",
    pharmacist: "Pharmacist",
    staff: "Staff"
  };
  return labels[role] || "Staff";
}

function renderPending() {
  const pending = state.records.filter((record) => record.status === "pending");
  els.pendingCount.textContent = `${pending.length} pending`;

  if (!pending.length) {
    els.pendingList.innerHTML = `<div class="summary-box">No pending variance reports.</div>`;
  } else {
    els.pendingList.innerHTML = pending
      .map((record) => {
        const active = record.id === state.selectedRecordId ? " active" : "";
        return `<button class="record-card${active}" data-id="${record.id}" type="button">
          <strong>${escapeHtml(record.reported_by || "Unassigned")}</strong>
          <span>${escapeHtml(record.event_date || "")} - ${escapeHtml(record.department || "")}</span>
          <span>${escapeHtml((record.nature || []).join(", ") || "Variance")}</span>
        </button>`;
      })
      .join("");
  }

  els.pendingList.querySelectorAll(".record-card").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRecordId = button.dataset.id;
      const record = selectedRecord();
      els.reviewForm.elements.review_department.value = record.department || DEPARTMENTS[0];
      renderSelectedRecord();
      renderPending();
    });
  });

  renderSelectedRecord();
}

function renderSelectedRecord() {
  const record = selectedRecord();
  if (!record) {
    els.selectedStatus.textContent = "No record selected";
    els.reviewSummary.innerHTML = "Select a pending report to review.";
    return;
  }

  els.selectedStatus.textContent = "Ready for pharmacist review";
  els.reviewSummary.innerHTML = `
    <strong>${escapeHtml(record.complaint || "No complaint text")}</strong>
    <div>Date: ${escapeHtml(record.event_date || "")} ${escapeHtml(record.event_time || "")}</div>
    <div>Issue with: ${escapeHtml((record.issue || []).join(", ") || "N/A")}</div>
    <div>Investigation: ${escapeHtml(record.investigation || "Not entered")}</div>
    <div>Resolution: ${escapeHtml(record.resolution || "Not entered")}</div>
  `;
}

function selectedRecord() {
  return state.records.find((record) => record.id === state.selectedRecordId);
}

function renderQreItems(categoryKey) {
  const category = QRE_CATEGORIES[categoryKey];
  els.qreItems.innerHTML = category.items.map((item) => checkboxMarkup("qre_items", item)).join("");
}

function renderMetrics() {
  if (!state.user) return;
  const month = els.metricMonth.value;
  const approved = state.records.filter((record) => {
    return record.status === "approved" && (!month || (record.event_date || "").startsWith(month));
  });

  const rows = [];
  Object.entries(QRE_CATEGORIES).forEach(([key, category]) => {
    category.items.forEach((item) => {
      const matching = approved.filter((record) => record.qre_category === key && (record.qre_items || []).includes(item));
      rows.push({
        category: category.label,
        item,
        count: matching.length,
        documentation: documentationRate(matching),
        trend: matching.length > 5 ? "Investigate trend" : "Within threshold"
      });
    });
  });

  const docsComplete = approved.filter((record) => record.documentation_complete === "yes").length;
  els.metricCards.innerHTML = `
    <div class="metric-card"><strong>${approved.length}</strong><p>Total QREs</p></div>
    <div class="metric-card"><strong>${docsComplete}</strong><p>Documentation complete</p></div>
    <div class="metric-card"><strong>${approved.filter((record) => record.qre_category === "complaints").length}</strong><p>Patient complaints</p></div>
    <div class="metric-card"><strong>${approved.filter((record) => record.qre_category === "internal").length}</strong><p>Internal events</p></div>
  `;

  els.metricTableBody.innerHTML = rows
    .map((row) => `<tr>
      <td>${escapeHtml(row.category)}</td>
      <td>${escapeHtml(row.item)}</td>
      <td>${row.count}</td>
      <td>${escapeHtml(row.documentation)}</td>
      <td>${escapeHtml(row.trend)}</td>
    </tr>`)
    .join("");
}

function documentationRate(records) {
  if (!records.length) return "N/A";
  const complete = records.filter((record) => record.documentation_complete === "yes").length;
  return `${complete}/${records.length} complete`;
}

function exportMetricsCsv() {
  const rows = [["Category", "Metric", "Count", "Documentation", "Trend status"]];
  els.metricTableBody.querySelectorAll("tr").forEach((tr) => {
    rows.push([...tr.children].map((td) => td.textContent));
  });
  const csv = rows.map((row) => row.map((cell) => `"${cell.replaceAll('"', '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `qre-metrics-${els.metricMonth.value || "all"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
