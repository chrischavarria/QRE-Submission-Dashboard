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
  selectedApprovedId: null,
  activeView: "intake",
  isSubmittingVariance: false
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
  submitVarianceButton: document.querySelector("#submitVarianceButton"),
  authNote: document.querySelector("#authNote"),
  viewTitle: document.querySelector("#viewTitle"),
  pendingList: document.querySelector("#pendingList"),
  pendingCount: document.querySelector("#pendingCount"),
  selectedStatus: document.querySelector("#selectedStatus"),
  reviewSummary: document.querySelector("#reviewSummary"),
  approvedList: document.querySelector("#approvedList"),
  approvedCount: document.querySelector("#approvedCount"),
  approvedStatus: document.querySelector("#approvedStatus"),
  approvedPreview: document.querySelector("#approvedPreview"),
  printApprovedButton: document.querySelector("#printApprovedButton"),
  printReviewButton: document.querySelector("#printReviewButton"),
  printReport: document.querySelector("#printReport"),
  qreItems: document.querySelector("#qreItems"),
  metricMonth: document.querySelector("#metricMonth"),
  metricCards: document.querySelector("#metricCards"),
  metricTableBody: document.querySelector("#metricTable tbody"),
  trendTableBody: document.querySelector("#trendTable tbody"),
  trendRange: document.querySelector("#trendRange"),
  trendMonthOne: document.querySelector("#trendMonthOne"),
  trendMonthTwo: document.querySelector("#trendMonthTwo"),
  trendMonthThree: document.querySelector("#trendMonthThree")
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

  document.querySelector("#printButton").addEventListener("click", onPrintCurrentView);
  document.querySelector("#signOutButton").addEventListener("click", signOut);
  document.querySelector("#resetFormButton").addEventListener("click", () => {
    resetVarianceForm();
    setVarianceSubmitState("idle");
  });
  els.varianceForm.addEventListener("input", () => setVarianceSubmitState("idle"));
  els.varianceForm.addEventListener("change", () => setVarianceSubmitState("idle"));

  els.loginForm.addEventListener("submit", onLogin);
  els.varianceForm.addEventListener("submit", onSubmitVariance);
  els.reviewForm.addEventListener("submit", onApprove);
  document.querySelector("#rejectButton").addEventListener("click", onReject);
  els.printReviewButton.addEventListener("click", () => {
    const record = selectedRecord();
    if (!record) {
      showStatus("Select a pending submission before printing.", "error");
      return;
    }
    printRecord({ ...record, ...reviewFormToPrintable() }, "review");
  });
  els.printApprovedButton.addEventListener("click", () => printRecord(selectedApprovedRecord(), "approved"));
  els.reviewForm.elements.qre_category.addEventListener("change", (event) => renderQreItems(event.target.value));
  document.addEventListener("change", onOtherControlChange);
  els.metricMonth.addEventListener("change", renderMetrics);
  document.querySelector("#exportButton").addEventListener("click", exportMetricsCsv);
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-record");
    els.printReport.innerHTML = "";
  });
}

function setDefaultDates() {
  const today = new Date();
  els.varianceForm.elements.event_date.value = today.toISOString().slice(0, 10);
  els.varianceForm.elements.event_time.value = today.toTimeString().slice(0, 5);
  els.metricMonth.value = today.toISOString().slice(0, 7);
}

function onOtherControlChange(event) {
  const target = event.target;
  if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;

  if (target.type === "checkbox" && target.value === "Other") {
    syncOtherField(target.name, target.checked);
  }

  if (target.tagName === "SELECT") {
    syncOtherField(target.name, target.value === "Other");
  }
}

function syncOtherField(name, isVisible) {
  const field = document.querySelector(`[data-other-field="${name}"]`);
  if (!field) return;

  const input = field.querySelector("input");
  field.classList.toggle("hidden", !isVisible);
  input.required = isVisible;
  if (!isVisible) input.value = "";
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
  if (state.isSubmittingVariance) return;

  state.isSubmittingVariance = true;
  setVarianceSubmitState("submitting");
  showStatus("Submitting variance...", "info", { persist: true });

  const payload = formToVariance(event.currentTarget);

  try {
    if (state.supabase) {
      const { error } = await state.supabase.from("variance_reports").insert(payload);
      if (error) {
        showStatus(error.message, "error");
        return;
      }
      await loadRecords();
    } else {
      const next = [{ ...payload, id: crypto.randomUUID(), created_at: new Date().toISOString() }, ...state.records];
      state.records = next;
      storage.records = next;
    }

    resetVarianceForm();
    render();
    state.isSubmittingVariance = false;
    setVarianceSubmitState("submitted");
    showStatus("Variance submitted successfully. It is now in Pharmacist Review.", "success", { persist: true });
  } finally {
    if (state.isSubmittingVariance) {
      state.isSubmittingVariance = false;
      setVarianceSubmitState("idle");
    }
  }
}

function resetVarianceForm() {
  els.varianceForm.reset();
  setDefaultDates();
  syncAllOtherFields();
}

function formToVariance(form) {
  const data = new FormData(form);
  return {
    event_date: data.get("event_date"),
    event_time: data.get("event_time"),
    reported_by: data.get("reported_by"),
    department: valueWithOther(data, "department"),
    patient_involved: data.get("patient_involved"),
    patient_identifier: data.get("patient_identifier"),
    staff_involved: data.get("staff_involved"),
    staff_names: data.get("staff_names"),
    nature: valuesWithOther(data, "nature"),
    source: valuesWithOther(data, "source"),
    complainants: data.get("complainants"),
    drug_involved: data.get("drug_involved"),
    drug_details: data.get("drug_details"),
    drug_recalled: data.get("drug_recalled"),
    issue: valuesWithOther(data, "issue"),
    failure: valuesWithOther(data, "failure"),
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
    qre_items: valuesWithOther(data, "qre_items"),
    review_department: valueWithOther(data, "review_department"),
    pharmacist_notes: data.get("pharmacist_notes"),
    documentation_complete: data.get("documentation_complete"),
    reviewed_by: state.user.id,
    reviewed_at: new Date().toISOString()
  };

  await persistUpdate(record.id, update);
  const slackResult = await notifySlack({ type: "approved", record: { ...record, ...update } });
  if (!slackResult.ok) {
    showStatus(`Approved and tracked. Slack notification was not sent: ${slackResult.reason}.`, "warning", { persist: true });
  } else {
    showStatus("Approved and tracked. Slack notification sent.", "success", { persist: true });
  }
  state.selectedApprovedId = record.id;
  state.selectedRecordId = null;
  els.reviewForm.reset();
  renderQreItems("clinical");
  syncAllOtherFields();
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

async function deleteSubmission(id) {
  if (!requireAdmin()) return;
  const record = state.records.find((candidate) => candidate.id === id);
  if (!record) return;

  const label = `${record.reported_by || "submission"} from ${record.event_date || "unknown date"}`;
  if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

  if (state.supabase) {
    const { error } = await state.supabase.from("variance_reports").delete().eq("id", id);
    if (error) {
      showStatus(error.message, "error");
      return;
    }
    await loadRecords();
  } else {
    state.records = state.records.filter((candidate) => candidate.id !== id);
    storage.records = state.records;
  }

  if (state.selectedRecordId === id) state.selectedRecordId = null;
  render();
  showStatus("Submission deleted.", "success");
}

async function notifySlack(payload) {
  if (!state.supabase) return { ok: false, reason: "Supabase is not connected" };

  try {
    const { data, error } = await state.supabase.functions.invoke("slack-notify", { body: payload });
    if (error) return { ok: false, reason: error.message || "Edge Function error" };
    if (!data?.ok) return { ok: false, reason: data?.reason || "Slack rejected the notification" };
    return { ok: true };
  } catch (error) {
    return { ok: false, reason: error.message || "Unable to call Slack function" };
  }
}

function requirePharmacist() {
  const role = state.profile?.role;
  if (role === "pharmacist" || role === "admin") return true;
  showStatus("A pharmacist or admin login is required for approval.", "error");
  return false;
}

function requireAdmin() {
  if (state.profile?.role === "admin") return true;
  showStatus("An admin login is required to delete submissions.", "error");
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
  renderApprovedArchive();
  renderMetrics();
}

function onPrintCurrentView() {
  if (!state.user) return;

  if (state.activeView === "intake") {
    printRecord(formToVariance(els.varianceForm), "draft");
    return;
  }

  if (state.activeView === "review") {
    const record = selectedRecord();
    if (!record) {
      showStatus("Select a pending submission before printing.", "error");
      return;
    }
    printRecord({ ...record, ...reviewFormToPrintable() }, "review");
    return;
  }

  if (state.activeView === "archive") {
    const record = selectedApprovedRecord();
    if (!record) {
      showStatus("Select an approved variance before printing.", "error");
      return;
    }
    printRecord(record, "approved");
    return;
  }

  window.print();
}

function setVarianceSubmitState(status) {
  window.clearTimeout(setVarianceSubmitState.timeoutId);
  els.submitVarianceButton.classList.remove("submitted-button");

  if (status === "submitting") {
    els.submitVarianceButton.disabled = true;
    els.submitVarianceButton.textContent = "Submitting...";
    return;
  }

  if (status === "submitted") {
    els.submitVarianceButton.disabled = true;
    els.submitVarianceButton.textContent = "Submitted";
    els.submitVarianceButton.classList.add("submitted-button");
    setVarianceSubmitState.timeoutId = window.setTimeout(() => setVarianceSubmitState("idle"), 2500);
    return;
  }

  els.submitVarianceButton.disabled = false;
  els.submitVarianceButton.textContent = "Submit variance";
}

function showStatus(message, tone = "success", options = {}) {
  els.statusBanner.textContent = message;
  els.statusBanner.className = `status-banner ${tone}`;
  window.clearTimeout(showStatus.timeoutId);
  if (!options.persist) {
    showStatus.timeoutId = window.setTimeout(() => {
      els.statusBanner.classList.add("hidden");
    }, 5500);
  }
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
        const deleteButton = state.profile?.role === "admin"
          ? `<button class="danger-button delete-record" data-id="${record.id}" type="button">Delete</button>`
          : "";
        return `<div class="record-card${active}">
          <button class="record-select" data-id="${record.id}" type="button">
            <strong>${escapeHtml(record.reported_by || "Unassigned")}</strong>
            <span>${escapeHtml(record.event_date || "")} - ${escapeHtml(record.department || "")}</span>
            <span>${escapeHtml((record.nature || []).join(", ") || "Variance")}</span>
          </button>
          ${deleteButton}
        </div>`;
      })
      .join("");
  }

  els.pendingList.querySelectorAll(".record-select").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedRecordId = button.dataset.id;
      const record = selectedRecord();
      if (record.department?.startsWith("Other: ")) {
        els.reviewForm.elements.review_department.value = "Other";
        els.reviewForm.elements.review_department_other.value = record.department.replace("Other: ", "");
        syncOtherField("review_department", true);
      } else {
        els.reviewForm.elements.review_department.value = record.department || DEPARTMENTS[0];
        syncOtherField("review_department", false);
      }
      renderSelectedRecord();
      renderPending();
    });
  });

  els.pendingList.querySelectorAll(".delete-record").forEach((button) => {
    button.addEventListener("click", () => deleteSubmission(button.dataset.id));
  });

  renderSelectedRecord();
}

function renderApprovedArchive() {
  const approved = state.records.filter((record) => record.status === "approved");
  els.approvedCount.textContent = `${approved.length} approved`;

  if (!approved.length) {
    els.approvedList.innerHTML = `<div class="summary-box">No approved variances yet.</div>`;
  } else {
    els.approvedList.innerHTML = approved
      .map((record) => {
        const active = record.id === state.selectedApprovedId ? " active" : "";
        const category = QRE_CATEGORIES[record.qre_category]?.label || "Approved variance";
        const deleteButton = state.profile?.role === "admin"
          ? `<button class="danger-button delete-approved-record" data-id="${record.id}" type="button">Delete</button>`
          : "";
        return `<div class="record-card${active}">
          <button class="record-select approved-select" data-id="${record.id}" type="button">
            <strong>${escapeHtml(record.reported_by || "Unassigned")}</strong>
            <span>${escapeHtml(record.event_date || "")} - ${escapeHtml(record.review_department || record.department || "")}</span>
            <span>${escapeHtml(category)} - ${escapeHtml(listValue(record.qre_items) || "No metric selected")}</span>
          </button>
          ${deleteButton}
        </div>`;
      })
      .join("");
  }

  els.approvedList.querySelectorAll(".approved-select").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedApprovedId = button.dataset.id;
      renderApprovedArchive();
    });
  });

  els.approvedList.querySelectorAll(".delete-approved-record").forEach((button) => {
    button.addEventListener("click", () => deleteSubmission(button.dataset.id));
  });

  renderSelectedApproved();
}

function renderSelectedRecord() {
  const record = selectedRecord();
  if (!record) {
    els.selectedStatus.textContent = "No record selected";
    els.reviewSummary.innerHTML = "Select a pending report to review.";
    els.printReviewButton.disabled = true;
    return;
  }

  els.selectedStatus.textContent = "Ready for pharmacist review";
  els.printReviewButton.disabled = false;
  els.reviewSummary.innerHTML = `
    <div class="preview-header">
      <strong>${escapeHtml(record.complaint || "No complaint text")}</strong>
      <span>${escapeHtml(record.event_date || "")} ${escapeHtml(record.event_time || "")}</span>
    </div>
    <div class="preview-grid">
      ${previewItem("Reported by", record.reported_by)}
      ${previewItem("Department", record.department)}
      ${previewItem("Patient involved", record.patient_involved)}
      ${previewItem("Patient ID / RX / Lot #", record.patient_identifier)}
      ${previewItem("Staff involved", record.staff_involved)}
      ${previewItem("Staff names", record.staff_names)}
      ${previewItem("Nature", listValue(record.nature))}
      ${previewItem("Source", listValue(record.source))}
      ${previewItem("Complainants", record.complainants)}
      ${previewItem("Drug involved", record.drug_involved)}
      ${previewItem("Drug details", record.drug_details)}
      ${previewItem("Drug recalled", record.drug_recalled)}
      ${previewItem("Issue with", listValue(record.issue))}
      ${previewItem("Failure to identify/manage", listValue(record.failure))}
      ${previewItem("Patient notified", record.patient_notified)}
      ${previewItem("Prescriber notified", record.prescriber_notified)}
      ${previewItem("Report filled out by", record.completed_by)}
    </div>
    <div class="preview-section"><span>Investigation / root cause</span><p>${escapeHtml(record.investigation || "Not entered")}</p></div>
    <div class="preview-section"><span>Resolution / corrective action</span><p>${escapeHtml(record.resolution || "Not entered")}</p></div>
    <div class="preview-section"><span>Follow-up / recurrence prevention</span><p>${escapeHtml(record.follow_up || "Not entered")}</p></div>
  `;
}

function renderSelectedApproved() {
  const record = selectedApprovedRecord();
  if (!record) {
    els.approvedStatus.textContent = "No record selected";
    els.approvedPreview.innerHTML = "Select an approved variance to review or print.";
    els.printApprovedButton.disabled = true;
    return;
  }

  els.approvedStatus.textContent = "Approved variance";
  els.approvedPreview.innerHTML = printableRecordBody(record, { includeTitle: false });
  els.printApprovedButton.disabled = false;
}

function previewItem(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "N/A")}</strong></div>`;
}

function listValue(value) {
  return Array.isArray(value) && value.length ? value.join(", ") : "";
}

function reviewFormToPrintable() {
  const data = new FormData(els.reviewForm);
  return {
    qre_category: data.get("qre_category"),
    qre_items: valuesWithOther(data, "qre_items"),
    review_department: valueWithOther(data, "review_department"),
    pharmacist_notes: data.get("pharmacist_notes"),
    documentation_complete: data.get("documentation_complete")
  };
}

function printRecord(record, mode = "approved") {
  if (!record) return;
  els.printReport.innerHTML = printableRecordBody(record, { includeTitle: true, mode });
  document.body.classList.add("printing-record");
  window.print();
}

function printableRecordBody(record, options = {}) {
  const category = QRE_CATEGORIES[record.qre_category]?.label || record.qre_category || "Not selected";
  const statusLabel = formatStatus(record.status || (options.mode === "draft" ? "draft" : ""));
  const title = options.includeTitle
    ? `<div class="print-title">
        <div>
          <p>Quality Related Event</p>
          <h1>Variance Report</h1>
        </div>
        <span>${escapeHtml(statusLabel)}</span>
      </div>`
    : "";

  return `
    ${title}
    <div class="print-section">
      <h2>Event Details</h2>
      <div class="print-grid">
        ${printItem("Date", record.event_date)}
        ${printItem("Time", record.event_time)}
        ${printItem("Reported by", record.reported_by)}
        ${printItem("Department", record.department)}
        ${printItem("Patient involved", record.patient_involved)}
        ${printItem("Patient ID / RX / Lot #", record.patient_identifier)}
        ${printItem("Staff involved", record.staff_involved)}
        ${printItem("Staff name(s)", record.staff_names)}
      </div>
    </div>
    <div class="print-section">
      <h2>Variance Classification</h2>
      <div class="print-grid">
        ${printItem("Nature of variance", listValue(record.nature))}
        ${printItem("Source of complaint", listValue(record.source))}
        ${printItem("Complainant(s)", record.complainants)}
        ${printItem("Drug involved", record.drug_involved)}
        ${printItem("Name / strength of drug(s)", record.drug_details)}
        ${printItem("Drug recalled", record.drug_recalled)}
        ${printItem("Incorrect / issue with", listValue(record.issue))}
        ${printItem("Failure to identify/manage", listValue(record.failure))}
      </div>
    </div>
    <div class="print-section">
      <h2>Issue, Investigation, and Resolution</h2>
      ${printBlock("Issue / complaint", record.complaint)}
      ${printBlock("Investigation / root cause", record.investigation)}
      ${printBlock("Resolution / corrective action", record.resolution)}
      ${printBlock("Follow-up / recurrence prevention", record.follow_up)}
      <div class="print-grid">
        ${printItem("Client/patient notified", record.patient_notified)}
        ${printItem("Prescriber notified", record.prescriber_notified)}
        ${printItem("Report filled out by", record.completed_by)}
      </div>
    </div>
    <div class="print-section">
      <h2>Pharmacist Review</h2>
      <div class="print-grid">
        ${printItem("QRE category", category)}
        ${printItem("QRE metric item(s)", listValue(record.qre_items))}
        ${printItem("Notification department", record.review_department)}
        ${printItem("Documentation complete", record.documentation_complete)}
        ${printItem("Reviewed at", formatDateTime(record.reviewed_at))}
      </div>
      ${printBlock("Pharmacist notes", record.pharmacist_notes)}
    </div>
  `;
}

function printItem(label, value) {
  return `<div class="print-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "N/A")}</strong></div>`;
}

function printBlock(label, value) {
  return `<div class="print-block"><span>${escapeHtml(label)}</span><p>${escapeHtml(value || "N/A")}</p></div>`;
}

function formatStatus(status) {
  const labels = {
    draft: "Draft",
    pending: "Pending Review",
    approved: "Approved",
    returned: "Returned"
  };
  return labels[status] || "Variance";
}

function formatDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

function selectedRecord() {
  return state.records.find((record) => record.id === state.selectedRecordId);
}

function selectedApprovedRecord() {
  return state.records.find((record) => record.id === state.selectedApprovedId);
}

function renderQreItems(categoryKey) {
  const category = QRE_CATEGORIES[categoryKey];
  els.qreItems.innerHTML = category.items.map((item) => checkboxMarkup("qre_items", item)).join("");
  syncOtherField("qre_items", false);
}

function valuesWithOther(data, name) {
  const values = data.getAll(name).map((value) => value.toString());
  const otherValue = data.get(`${name}_other`)?.toString().trim();
  if (!values.includes("Other") || !otherValue) return values;
  return values.map((value) => (value === "Other" ? `Other: ${otherValue}` : value));
}

function valueWithOther(data, name) {
  const value = data.get(name)?.toString() || "";
  const otherValue = data.get(`${name}_other`)?.toString().trim();
  return value === "Other" && otherValue ? `Other: ${otherValue}` : value;
}

function syncAllOtherFields() {
  ["department", "nature", "source", "issue", "failure", "qre_items", "review_department"].forEach((name) => {
    syncOtherField(name, false);
  });
}

function renderMetrics() {
  if (!state.user) return;
  const month = els.metricMonth.value;
  const trendMonths = getThreeMonthRange(month);
  const approved = state.records.filter((record) => {
    return record.status === "approved" && (!month || (record.event_date || "").startsWith(month));
  });

  const rows = [];
  Object.entries(QRE_CATEGORIES).forEach(([key, category]) => {
    category.items.forEach((item) => {
      const matching = approved.filter((record) => record.qre_category === key && includesMetricItem(record.qre_items || [], item));
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

  renderTrendTable(trendMonths);
}

function includesMetricItem(values, item) {
  return values.some((value) => value === item || (item === "Other" && value.startsWith("Other: ")));
}

function documentationRate(records) {
  if (!records.length) return "N/A";
  const complete = records.filter((record) => record.documentation_complete === "yes").length;
  return `${complete}/${records.length} complete`;
}

function renderTrendTable(months) {
  const approved = state.records.filter((record) => record.status === "approved");
  els.trendMonthOne.textContent = formatMonthLabel(months[0]);
  els.trendMonthTwo.textContent = formatMonthLabel(months[1]);
  els.trendMonthThree.textContent = formatMonthLabel(months[2]);
  els.trendRange.textContent = `${formatMonthLabel(months[0])} - ${formatMonthLabel(months[2])}`;

  const rows = [];
  Object.entries(QRE_CATEGORIES).forEach(([key, category]) => {
    category.items.forEach((item) => {
      const counts = months.map((monthKey) => {
        return approved.filter((record) => {
          return (record.event_date || "").startsWith(monthKey) &&
            record.qre_category === key &&
            includesMetricItem(record.qre_items || [], item);
        }).length;
      });

      if (counts.some((count) => count > 0)) {
        rows.push({
          category: category.label,
          item,
          counts,
          trend: trendLabel(counts)
        });
      }
    });
  });

  els.trendTableBody.innerHTML = rows.length
    ? rows.map((row) => `<tr>
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.item)}</td>
        <td>${row.counts[0]}</td>
        <td>${row.counts[1]}</td>
        <td>${row.counts[2]}</td>
        <td>${escapeHtml(row.trend)}</td>
      </tr>`).join("")
    : `<tr><td colspan="6">No approved QRE metrics in this 3-month range.</td></tr>`;
}

function getThreeMonthRange(selectedMonth) {
  const base = selectedMonth ? new Date(`${selectedMonth}-01T00:00:00`) : new Date();
  base.setDate(1);
  return [-2, -1, 0].map((offset) => {
    const date = new Date(base);
    date.setMonth(base.getMonth() + offset);
    return monthKey(date);
  });
}

function monthKey(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function formatMonthLabel(month) {
  const date = new Date(`${month}-01T00:00:00`);
  return date.toLocaleString(undefined, { month: "short", year: "numeric" });
}

function trendLabel(counts) {
  const [first, second, third] = counts;
  if (first === 0 && second === 0 && third > 0) return "New this month";
  if (third > second && second >= first) return "Increasing";
  if (third < second && second <= first) return "Decreasing";
  if (third > Math.max(first, second)) return "Up vs prior months";
  if (third < Math.min(first, second)) return "Down vs prior months";
  return "Stable";
}

function exportMetricsCsv() {
  const rows = [
    ["Monthly Metrics"],
    ["Category", "Metric", "Count", "Documentation", "Trend status"]
  ];
  els.metricTableBody.querySelectorAll("tr").forEach((tr) => {
    rows.push([...tr.children].map((td) => td.textContent));
  });
  rows.push([]);
  rows.push(["3-Month Trends"]);
  rows.push([
    "Category",
    "Metric",
    els.trendMonthOne.textContent,
    els.trendMonthTwo.textContent,
    els.trendMonthThree.textContent,
    "Trend"
  ]);
  els.trendTableBody.querySelectorAll("tr").forEach((tr) => {
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
