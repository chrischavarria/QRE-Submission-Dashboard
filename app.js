const SUPABASE_URL = "https://xjprkxxhepalknpxnqlb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhqcHJreHhoZXBhbGtucHhucWxiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE2MjQ1MjksImV4cCI6MjA5NzIwMDUyOX0.GE1LfJA-sHRCYZpw1m3N8x2uoYBXYxO8d2oUrqSOcOg";
const SLACK_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzHHXGrplvwRT2OslJj_Nb3H29S71fBZERKd7BamyStkaaKkF8725fxmIZt2UC-A8VOIQ/exec";
const SLACK_APPS_SCRIPT_TOKEN = "qre-dashboard";

const DEPARTMENTS = ["Front", "Lab", "Contract Fulfillment", "Front Fulfillment", "RPh", "Other"];
const COMPLAINANTS = ["Internal", "Patient/Delegate", "Doctor"];
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
  "DC"
];

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
    "Data Entry",
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

const state = {
  supabase: null,
  user: null,
  profile: null,
  records: [],
  selectedRecordId: null,
  selectedApprovedId: null,
  selectedMetricRecordId: null,
  metricDrilldownRecords: [],
  metricDrilldownLabel: "",
  editingRecordId: null,
  activeView: "intake",
  isSubmittingVariance: false
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
  varianceFormTitle: document.querySelector("#varianceFormTitle"),
  varianceFormStatus: document.querySelector("#varianceFormStatus"),
  cancelEditButton: document.querySelector("#cancelEditButton"),
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
  returnToReviewButton: document.querySelector("#returnToReviewButton"),
  printReviewButton: document.querySelector("#printReviewButton"),
  editSubmissionButton: document.querySelector("#editSubmissionButton"),
  approveButton: document.querySelector("#approveButton"),
  printReport: document.querySelector("#printReport"),
  qreItems: document.querySelector("#qreItems"),
  metricMonth: document.querySelector("#metricMonth"),
  metricSearchFilter: document.querySelector("#metricSearchFilter"),
  metricStartDate: document.querySelector("#metricStartDate"),
  metricEndDate: document.querySelector("#metricEndDate"),
  metricDepartmentFilter: document.querySelector("#metricDepartmentFilter"),
  metricPatientFilter: document.querySelector("#metricPatientFilter"),
  metricStaffFilter: document.querySelector("#metricStaffFilter"),
  metricNatureFilter: document.querySelector("#metricNatureFilter"),
  metricComplaintSourceFilter: document.querySelector("#metricComplaintSourceFilter"),
  metricOriginFilter: document.querySelector("#metricOriginFilter"),
  metricComplainantFilter: document.querySelector("#metricComplainantFilter"),
  metricIssueFilter: document.querySelector("#metricIssueFilter"),
  metricCards: document.querySelector("#metricCards"),
  metricTableBody: document.querySelector("#metricTable tbody"),
  metricResultCount: document.querySelector("#metricResultCount"),
  metricResultList: document.querySelector("#metricResultList"),
  metricRecordPreview: document.querySelector("#metricRecordPreview"),
  printMetricRecordButton: document.querySelector("#printMetricRecordButton"),
  trendTableBody: document.querySelector("#trendTable tbody"),
  trendRange: document.querySelector("#trendRange"),
  trendMonthOne: document.querySelector("#trendMonthOne"),
  trendMonthTwo: document.querySelector("#trendMonthTwo"),
  trendMonthThree: document.querySelector("#trendMonthThree"),
  historicalCsvInput: document.querySelector("#historicalCsvInput"),
  importHistoricalButton: document.querySelector("#importHistoricalButton"),
  clearMetricFiltersButton: document.querySelector("#clearMetricFiltersButton")
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

  document.querySelectorAll('select[name="department"]').forEach((select) => {
    select.innerHTML = DEPARTMENTS.map((department) => `<option>${department}</option>`).join("");
  });

  document.querySelector('select[name="complainants"]').innerHTML = [
    `<option value="">Select complainant</option>`,
    ...COMPLAINANTS.map((complainant) => `<option>${complainant}</option>`)
  ].join("");

  hydrateMetricFilters();

  els.varianceForm.elements.shipped_to_state.innerHTML = [
    `<option value="">Select state</option>`,
    ...US_STATES.map((stateCode) => `<option>${stateCode}</option>`)
  ].join("");

  const categorySelect = els.reviewForm.elements.qre_category;
  categorySelect.innerHTML = Object.entries(QRE_CATEGORIES)
    .map(([key, value]) => `<option value="${key}">${value.label}</option>`)
    .join("");
  renderQreItems("clinical");
}

function hydrateMetricFilters() {
  setFilterOptions(els.metricDepartmentFilter, DEPARTMENTS);
  setFilterOptions(els.metricPatientFilter, ["yes", "no", "na"], { labels: { yes: "Yes", no: "No", na: "N/A" } });
  setFilterOptions(els.metricStaffFilter, ["yes", "no", "na"], { labels: { yes: "Yes", no: "No", na: "N/A" } });
  setFilterOptions(els.metricNatureFilter, OPTIONS.nature);
  setFilterOptions(els.metricComplaintSourceFilter, ["Internal", "External"]);
  setFilterOptions(els.metricOriginFilter, ["In-person", "Phone", "Email", "Mail", "Other"]);
  setFilterOptions(els.metricComplainantFilter, COMPLAINANTS);
  setFilterOptions(els.metricIssueFilter, OPTIONS.issue);
}

function setFilterOptions(select, options, config = {}) {
  const labels = config.labels || {};
  select.innerHTML = [
    `<option value="">All</option>`,
    ...options.map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(labels[option] || option)}</option>`)
  ].join("");
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
    if (state.editingRecordId) {
      const record = state.records.find((candidate) => candidate.id === state.editingRecordId);
      if (record) populateVarianceForm(record);
    } else {
      resetVarianceForm();
    }
    setVarianceSubmitState("idle");
  });
  els.cancelEditButton.addEventListener("click", cancelVarianceEdit);
  els.varianceForm.addEventListener("input", () => setVarianceSubmitState("idle"));
  els.varianceForm.addEventListener("change", () => setVarianceSubmitState("idle"));

  els.loginForm.addEventListener("submit", onLogin);
  els.varianceForm.addEventListener("submit", onSubmitVariance);
  els.reviewForm.addEventListener("submit", onApprove);
  document.querySelector("#rejectButton").addEventListener("click", onReject);
  els.editSubmissionButton.addEventListener("click", startVarianceEdit);
  els.printReviewButton.addEventListener("click", () => {
    const record = selectedRecord();
    if (!record) {
      showStatus("Select a pending submission before printing.", "error");
      return;
    }
    printRecord({ ...record, ...reviewFormToPrintable() }, "review");
  });
  els.printApprovedButton.addEventListener("click", () => printRecord(selectedApprovedRecord(), "approved"));
  els.printMetricRecordButton.addEventListener("click", () => printRecord(selectedMetricRecord(), "approved"));
  els.returnToReviewButton.addEventListener("click", returnApprovedToReview);
  els.reviewForm.elements.qre_category.addEventListener("change", (event) => renderQreItems(event.target.value));
  document.addEventListener("change", onOtherControlChange);
  metricFilterElements().forEach((input) => input.addEventListener("change", renderMetrics));
  els.metricSearchFilter.addEventListener("input", renderMetrics);
  els.clearMetricFiltersButton.addEventListener("click", clearMetricFilters);
  document.querySelector("#exportButton").addEventListener("click", exportMetricsCsv);
  els.importHistoricalButton.addEventListener("click", () => els.historicalCsvInput.click());
  els.historicalCsvInput.addEventListener("change", onImportHistoricalCsv);
  window.addEventListener("afterprint", () => {
    document.body.classList.remove("printing-record");
    els.printReport.innerHTML = "";
  });
}

function metricFilterElements() {
  return [
    els.metricMonth,
    els.metricSearchFilter,
    els.metricStartDate,
    els.metricEndDate,
    els.metricDepartmentFilter,
    els.metricPatientFilter,
    els.metricStaffFilter,
    els.metricNatureFilter,
    els.metricComplaintSourceFilter,
    els.metricOriginFilter,
    els.metricComplainantFilter,
    els.metricIssueFilter
  ];
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

  if (target.name === "complaint_source") {
    syncComplaintSourceField(target.value === "External");
  }

  if (target.name === "origin_of_complaint") {
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

function syncComplaintSourceField(isExternal) {
  const field = document.querySelector('[data-other-field="complaint_source_external"]');
  if (!field) return;

  const select = field.querySelector("select");
  field.classList.toggle("hidden", !isExternal);
  select.required = isExternal;
  if (!isExternal) select.value = "";
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
    console.error("Supabase client could not load.", error);
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
    els.authNote.textContent = "The secure sign-in service is unavailable. Contact an administrator.";
    return;
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
  if (!state.supabase) return;

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
  const editingRecord = state.records.find((record) => record.id === state.editingRecordId);

  try {
    if (!state.supabase) {
      showStatus("The secure data service is unavailable.", "error");
      return;
    }

    if (editingRecord) {
      const { submitted_by, status, ...update } = payload;
      const saved = await persistUpdate(editingRecord.id, update);
      if (!saved) return;
    } else {
      const { error } = await state.supabase.from("variance_reports").insert(payload);
      if (error) {
        showStatus(error.message, "error");
        return;
      }
      await loadRecords();
    }

    resetVarianceForm();
    const wasEditing = Boolean(editingRecord);
    state.editingRecordId = null;
    if (wasEditing) state.activeView = "review";
    render();
    state.isSubmittingVariance = false;
    if (wasEditing) {
      showStatus("Submission changes saved. Continue with pharmacist review.", "success", { persist: true });
    } else {
      setVarianceSubmitState("submitted");
      showStatus("Variance submitted successfully. It is now in Pharmacist Review.", "success", { persist: true });
    }
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
  syncComplaintSourceField(false);
}

function startVarianceEdit() {
  if (!requirePharmacist()) return;
  const record = selectedRecord();
  if (!record) return;

  state.editingRecordId = record.id;
  populateVarianceForm(record);
  state.activeView = "intake";
  render();
  setVarianceSubmitState("idle");
}

function cancelVarianceEdit() {
  if (!state.editingRecordId) return;
  state.editingRecordId = null;
  resetVarianceForm();
  state.activeView = "review";
  render();
  showStatus("Editing cancelled. The submitted variance was not changed.", "info");
}

function populateVarianceForm(record) {
  const form = els.varianceForm;
  form.reset();

  [
    "event_date", "event_time", "reported_by", "patient_identifier", "staff_names", "complainants",
    "shipped_to_state", "drug_details", "complaint", "investigation", "resolution", "follow_up", "completed_by"
  ].forEach((name) => {
    form.elements[name].value = record[name] || "";
  });

  setSelectValueWithOther(form, "department", record.department);
  ["patient_involved", "staff_involved", "drug_involved", "drug_recalled", "patient_notified", "prescriber_notified"].forEach((name) => {
    setRadioValue(form, name, record[name]);
  });
  const sourceValue = recordComplaintSource(record);
  setRadioValue(form, "complaint_source", sourceValue);
  setRadioValueWithOther(form, "origin_of_complaint", record.origin_of_complaint);
  ["nature", "source", "issue", "failure"].forEach((name) => setCheckboxValuesWithOther(form, name, record[name]));
  syncComplaintSourceField(sourceValue === "External");
}

function setRadioValue(form, name, value) {
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = input.value === value;
  });
}

function setSelectValueWithOther(form, name, value) {
  const select = form.elements[name];
  const otherPrefix = "Other: ";
  const isOther = typeof value === "string" && value.startsWith(otherPrefix);
  select.value = isOther ? "Other" : (value || DEPARTMENTS[0]);
  form.elements[`${name}_other`].value = isOther ? value.slice(otherPrefix.length) : "";
  syncOtherField(name, isOther);
}

function setRadioValueWithOther(form, name, value) {
  const otherPrefix = "Other: ";
  const isOther = typeof value === "string" && value.startsWith(otherPrefix);
  setRadioValue(form, name, isOther ? "Other" : value);
  form.elements[`${name}_other`].value = isOther ? value.slice(otherPrefix.length) : "";
  syncOtherField(name, isOther);
}

function setCheckboxValuesWithOther(form, name, values) {
  const selected = Array.isArray(values) ? values : [];
  const otherPrefix = "Other: ";
  const otherValue = selected.find((value) => value.startsWith(otherPrefix));
  form.querySelectorAll(`input[name="${name}"]`).forEach((input) => {
    input.checked = selected.includes(input.value) || (input.value === "Other" && Boolean(otherValue));
  });
  if (!form.elements[`${name}_other`]) return;
  form.elements[`${name}_other`].value = otherValue ? otherValue.slice(otherPrefix.length) : "";
  syncOtherField(name, Boolean(otherValue));
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
    complaint_source: data.get("complaint_source"),
    shipped_to_state: data.get("complaint_source") === "External" ? data.get("shipped_to_state") : "",
    origin_of_complaint: valueWithOther(data, "origin_of_complaint"),
    source: data.get("complaint_source") ? [data.get("complaint_source")] : valuesWithOther(data, "source"),
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

  setApproveButtonState("approving");
  const data = new FormData(event.currentTarget);
  const update = {
    status: "approved",
    qre_category: data.get("qre_category"),
    qre_items: valuesWithOther(data, "qre_items"),
    review_department: record.department || "",
    pharmacist_name: data.get("pharmacist_name"),
    pharmacist_notes: data.get("pharmacist_notes"),
    documentation_complete: data.get("documentation_complete"),
    reviewed_by: state.user.id,
    reviewed_at: new Date().toISOString()
  };

  try {
    const saved = await persistUpdate(record.id, update);
    if (!saved) return;
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
    setApproveButtonState("approved");
  } finally {
    if (els.approveButton.textContent !== "Approved") {
      setApproveButtonState("idle");
    }
  }
}

async function onReject() {
  if (!requirePharmacist()) return;
  const record = selectedRecord();
  if (!record) return;
  const saved = await persistUpdate(record.id, { status: "returned", reviewed_by: state.user.id, reviewed_at: new Date().toISOString() });
  if (!saved) return;
  state.selectedRecordId = null;
  render();
}

async function returnApprovedToReview() {
  if (!requirePharmacist()) return;
  const record = selectedApprovedRecord();
  if (!record) return;

  const label = `${record.reported_by || "approved variance"} from ${record.event_date || "unknown date"}`;
  const confirmed = window.confirm(`Return ${label} to Pharmacist Review? Existing pharmacist entries will be kept.`);
  if (!confirmed) return;

  const saved = await persistUpdate(record.id, {
    status: "pending",
    review_department: record.review_department || record.department || ""
  });
  if (!saved) return;

  state.selectedApprovedId = null;
  state.selectedRecordId = record.id;
  state.activeView = "review";
  render();
  showStatus("Approved variance returned to Pharmacist Review. Prior pharmacist entries were kept.", "success", { persist: true });
}

async function persistUpdate(id, update) {
  if (!state.supabase) {
    showStatus("The secure data service is unavailable.", "error");
    return false;
  }

  const { error } = await state.supabase.from("variance_reports").update(update).eq("id", id);
  if (error) {
    showStatus(error.message, "error");
    return false;
  }
  await loadRecords();
  return true;
}

async function deleteSubmission(id) {
  if (!requireAdmin()) return;
  const record = state.records.find((candidate) => candidate.id === id);
  if (!record) return;

  const label = `${record.reported_by || "submission"} from ${record.event_date || "unknown date"}`;
  if (!window.confirm(`Delete ${label}? This cannot be undone.`)) return;

  if (!state.supabase) {
    showStatus("The secure data service is unavailable.", "error");
    return;
  }

  const { error } = await state.supabase.from("variance_reports").delete().eq("id", id);
  if (error) {
    showStatus(error.message, "error");
    return;
  }
  await loadRecords();

  if (state.selectedRecordId === id) state.selectedRecordId = null;
  render();
  showStatus("Submission deleted.", "success");
}

async function notifySlack(payload) {
  if (!SLACK_APPS_SCRIPT_URL || SLACK_APPS_SCRIPT_URL.includes("YOUR-GOOGLE-APPS-SCRIPT")) {
    return { ok: false, reason: "Google Apps Script URL is not configured" };
  }

  const response = await fetch(SLACK_APPS_SCRIPT_URL, {
    method: "POST",
    mode: "no-cors",
    headers: { "content-type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      token: SLACK_APPS_SCRIPT_TOKEN,
      ...payload
    })
  });

  return { ok: response.type === "opaque" || response.ok, reason: response.ok ? "" : "Google Apps Script did not accept the request" };
}

function requirePharmacist() {
  if (hasPharmacistAccess()) return true;
  showStatus("A pharmacist or admin login is required for approval.", "error");
  return false;
}

function hasPharmacistAccess() {
  return state.profile?.role === "pharmacist" || state.profile?.role === "admin";
}

function requireAdmin() {
  if (state.profile?.role === "admin") return true;
  showStatus("An admin login is required to delete submissions.", "error");
  return false;
}

async function signOut() {
  if (state.supabase) await state.supabase.auth.signOut();
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
  renderVarianceFormMode();
  els.authView.classList.toggle("hidden", signedIn);
  els.dashboardView.classList.toggle("hidden", !signedIn);
  document.querySelector("#signOutButton").classList.toggle("hidden", !signedIn);
  document.querySelector("#printButton").classList.toggle("hidden", !signedIn);

  if (!signedIn) {
    els.sessionCard.innerHTML = "Sign in with your authorized pharmacy account.";
    return;
  }

  document.querySelectorAll(".nav-item").forEach((button) => {
    button.classList.toggle("active", button.dataset.view === state.activeView);
  });
  document.querySelectorAll(".view-panel").forEach((panel) => {
    panel.classList.toggle("hidden", panel.dataset.panel !== state.activeView);
  });

  els.viewTitle.textContent = document.querySelector(`.nav-item[data-view="${state.activeView}"]`).textContent;
  const connectionLabel = "Supabase connected";
  const connectionClass = "connected";
  const roleLabel = formatRole(state.profile?.role);
  const titleLabel = state.profile?.title && state.profile.title !== roleLabel ? ` - ${state.profile.title}` : "";
  els.sessionCard.innerHTML = `<strong>${escapeHtml(state.profile?.full_name || state.user.email)}</strong><br>${escapeHtml(roleLabel + titleLabel)}<br><span class="connection-pill ${connectionClass}">${connectionLabel}</span>`;
  els.importHistoricalButton.classList.toggle("hidden", state.profile?.role !== "admin");

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
  const isEditing = Boolean(state.editingRecordId);

  if (status === "submitting") {
    els.submitVarianceButton.disabled = true;
    els.submitVarianceButton.textContent = isEditing ? "Saving changes..." : "Submitting...";
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
  els.submitVarianceButton.textContent = isEditing ? "Save changes" : "Submit variance";
}

function renderVarianceFormMode() {
  const isEditing = Boolean(state.editingRecordId);
  els.varianceFormTitle.textContent = isEditing ? "Edit Pending Variance" : "Variance Report";
  els.varianceFormStatus.textContent = isEditing ? "Editing pending submission" : "Draft";
  els.cancelEditButton.classList.toggle("hidden", !isEditing);
  document.querySelector("#resetFormButton").textContent = isEditing ? "Reset changes" : "Reset";
}

function setApproveButtonState(status) {
  window.clearTimeout(setApproveButtonState.timeoutId);
  els.approveButton.classList.remove("submitted-button");

  if (status === "approving") {
    els.approveButton.disabled = true;
    els.approveButton.textContent = "Approving...";
    return;
  }

  if (status === "approved") {
    els.approveButton.disabled = true;
    els.approveButton.textContent = "Approved";
    els.approveButton.classList.add("submitted-button");
    setApproveButtonState.timeoutId = window.setTimeout(() => setApproveButtonState("idle"), 2500);
    return;
  }

  els.approveButton.disabled = !selectedRecord();
  els.approveButton.textContent = "Approve and track";
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
      renderSelectedApproved();
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
    els.editSubmissionButton.disabled = true;
    els.editSubmissionButton.classList.toggle("hidden", !hasPharmacistAccess());
    setApproveButtonState("idle");
    return;
  }

  els.selectedStatus.textContent = "Ready for pharmacist review";
  els.printReviewButton.disabled = false;
  els.editSubmissionButton.disabled = !hasPharmacistAccess();
  els.editSubmissionButton.classList.toggle("hidden", !hasPharmacistAccess());
  populateReviewForm(record);
  setApproveButtonState("idle");
  els.reviewSummary.innerHTML = `
    <div class="preview-header">
      <div>
        <span>Issue / Complaint</span>
        <strong>${escapeHtml(record.complaint || "No complaint text")}</strong>
      </div>
      <time>${escapeHtml(record.event_date || "")} ${escapeHtml(record.event_time || "")}</time>
    </div>
    <div class="preview-grid">
      ${previewItem("Reported by", record.reported_by)}
      ${previewItem("Department", record.department)}
      ${previewItem("Patient involved", record.patient_involved)}
      ${previewItem("Patient ID / RX / Lot #", record.patient_identifier)}
      ${previewItem("Staff involved", record.staff_involved)}
      ${previewItem("Staff names", record.staff_names)}
      ${previewItem("Nature", listValue(record.nature))}
      ${previewItem("Complaint source", complaintSourceLabel(record))}
      ${previewItem("Origin of complaint", record.origin_of_complaint)}
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
    els.returnToReviewButton.disabled = true;
    els.returnToReviewButton.classList.toggle("hidden", !hasPharmacistAccess());
    return;
  }

  els.approvedStatus.textContent = "Approved variance";
  els.approvedPreview.innerHTML = printableRecordBody(record, { includeTitle: false });
  els.printApprovedButton.disabled = false;
  els.returnToReviewButton.disabled = !hasPharmacistAccess();
  els.returnToReviewButton.classList.toggle("hidden", !hasPharmacistAccess());
}

function previewItem(label, value) {
  return `<div><span>${escapeHtml(label)}</span><strong>${escapeHtml(value || "N/A")}</strong></div>`;
}

function populateReviewForm(record) {
  const category = QRE_CATEGORIES[record.qre_category] ? record.qre_category : "clinical";
  els.reviewForm.elements.qre_category.value = category;
  renderQreItems(category);
  setCheckboxValuesWithOther(els.reviewForm, "qre_items", record.qre_items || []);
  els.reviewForm.elements.pharmacist_name.value = record.pharmacist_name || "";
  els.reviewForm.elements.pharmacist_notes.value = record.pharmacist_notes || "";
  setRadioValue(els.reviewForm, "documentation_complete", record.documentation_complete);
}

function listValue(value) {
  return Array.isArray(value) && value.length ? value.join(", ") : "";
}

function recordComplaintSource(record) {
  if (record.complaint_source) return record.complaint_source;
  const legacySource = Array.isArray(record.source) ? record.source[0] : "";
  if (legacySource === "Internal" || legacySource === "External") return legacySource;
  if (legacySource === "In-person/internal") return "Internal";
  return "";
}

function complaintSourceLabel(record) {
  const source = recordComplaintSource(record);
  if (!source) return listValue(record.source);
  if (source === "External" && record.shipped_to_state) {
    return `${source} - ${record.shipped_to_state}`;
  }
  return source;
}

function reviewFormToPrintable() {
  const data = new FormData(els.reviewForm);
  return {
    qre_category: data.get("qre_category"),
    qre_items: valuesWithOther(data, "qre_items"),
    pharmacist_name: data.get("pharmacist_name"),
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
        ${printItem("Source of complaint", complaintSourceLabel(record))}
        ${printItem("Origin of complaint", record.origin_of_complaint)}
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
        ${printItem("Department", record.review_department || record.department)}
        ${printItem("Approved by pharmacist", record.pharmacist_name)}
        ${printItem("Documentation complete", record.documentation_complete)}
        ${printItem("Reviewed at", formatDateTime(record.reviewed_at))}
      </div>
      ${printBlock("Pharmacist notes", record.pharmacist_notes)}
    </div>
  `;
}

function printItem(label, value) {
  const content = value || "N/A";
  const spanClass = String(content).length > 32 ? " wide-print-item" : "";
  return `<div class="print-item${spanClass}"><span>${escapeHtml(label)}</span><strong>${escapeHtml(content)}</strong></div>`;
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
  ["department", "nature", "source", "issue", "failure", "origin_of_complaint", "qre_items"].forEach((name) => {
    syncOtherField(name, false);
  });
}

function renderMetrics() {
  if (!state.user) return;
  const filters = getMetricFilters();
  const trendMonths = getThreeMonthRange(filters.month || monthFromDate(filters.endDate));
  const approved = state.records.filter((record) => recordMatchesMetricFilters(record, filters));

  const rows = [];
  ["Internal", "External"].forEach((source) => {
    const matching = approved.filter((record) => recordComplaintSource(record) === source);
    rows.push({
      kind: "source",
      source,
      category: "Complaint Source",
      item: source,
      count: matching.length,
      documentation: documentationRate(matching),
      trend: matching.length > 5 ? "Investigate trend" : "Within threshold"
    });
  });

  Object.entries(QRE_CATEGORIES).forEach(([key, category]) => {
    category.items.forEach((item) => {
      const matching = approved.filter((record) => record.qre_category === key && includesMetricItem(record.qre_items || [], item));
      rows.push({
        kind: "qre",
        categoryKey: key,
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
    <div class="metric-card"><strong>${approved.filter((record) => recordComplaintSource(record) === "Internal").length}</strong><p>Internal complaints</p></div>
    <div class="metric-card"><strong>${approved.filter((record) => recordComplaintSource(record) === "External").length}</strong><p>External complaints</p></div>
  `;

  els.metricTableBody.innerHTML = rows
    .map((row) => `<tr class="metric-drill-row" data-kind="${escapeHtml(row.kind)}" data-category="${escapeHtml(row.categoryKey || "")}" data-item="${escapeHtml(row.item)}" data-source="${escapeHtml(row.source || "")}" tabindex="0">
      <td>${escapeHtml(row.category)}</td>
      <td>${escapeHtml(row.item)}</td>
      <td>${row.count}</td>
      <td>${escapeHtml(row.documentation)}</td>
      <td>${escapeHtml(row.trend)}</td>
    </tr>`)
    .join("");

  renderTrendTable(trendMonths, filters);
  renderMetricDrilldown(approved, "Filtered approved variances");
}

function includesMetricItem(values, item) {
  return values.some((value) => value === item || (item === "Other" && value.startsWith("Other: ")));
}

function documentationRate(records) {
  if (!records.length) return "N/A";
  const complete = records.filter((record) => record.documentation_complete === "yes").length;
  return `${complete}/${records.length} complete`;
}

function renderTrendTable(months, filters = getMetricFilters()) {
  const approved = state.records.filter((record) => record.status === "approved" && recordMatchesNonDateMetricFilters(record, filters));
  els.trendMonthOne.textContent = formatMonthLabel(months[0]);
  els.trendMonthTwo.textContent = formatMonthLabel(months[1]);
  els.trendMonthThree.textContent = formatMonthLabel(months[2]);
  els.trendRange.textContent = `${formatMonthLabel(months[0])} - ${formatMonthLabel(months[2])}`;

  const rows = [];
  ["Internal", "External"].forEach((source) => {
    const counts = months.map((monthKey) => {
      return approved.filter((record) => {
        return (record.event_date || "").startsWith(monthKey) &&
          recordComplaintSource(record) === source;
      }).length;
    });

    if (counts.some((count) => count > 0)) {
      rows.push({
        kind: "source",
        source,
        category: "Complaint Source",
        item: source,
        counts,
        trend: trendLabel(counts)
      });
    }
  });

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
          kind: "qre",
          categoryKey: key,
          category: category.label,
          item,
          counts,
          trend: trendLabel(counts)
        });
      }
    });
  });

  els.trendTableBody.innerHTML = rows.length
    ? rows.map((row) => `<tr class="metric-drill-row" data-kind="${escapeHtml(row.kind)}" data-category="${escapeHtml(row.categoryKey || "")}" data-item="${escapeHtml(row.item)}" data-source="${escapeHtml(row.source || "")}" data-trend-months="${escapeHtml(months.join(","))}" tabindex="0">
        <td>${escapeHtml(row.category)}</td>
        <td>${escapeHtml(row.item)}</td>
        <td>${row.counts[0]}</td>
        <td>${row.counts[1]}</td>
        <td>${row.counts[2]}</td>
        <td>${escapeHtml(row.trend)}</td>
      </tr>`).join("")
    : `<tr><td colspan="6">No approved QRE metrics in this 3-month range.</td></tr>`;
  bindMetricRows(filters);
}

function bindMetricRows(filters) {
  document.querySelectorAll(".metric-drill-row").forEach((row) => {
    const showRecords = () => {
      const records = recordsForMetricRow(row.dataset, filters);
      const label = metricRowLabel(row.dataset, row.children);
      renderMetricDrilldown(records, label);
    };
    row.addEventListener("click", showRecords);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        showRecords();
      }
    });
  });
}

function recordsForMetricRow(dataset, filters) {
  const months = dataset.trendMonths ? dataset.trendMonths.split(",") : null;
  return state.records.filter((record) => {
    const matchesDate = months
      ? months.some((month) => (record.event_date || "").startsWith(month))
      : recordMatchesMetricFilters(record, filters);
    return matchesDate &&
      record.status === "approved" &&
      recordMatchesNonDateMetricFilters(record, filters) &&
      recordMatchesMetricDimension(record, dataset);
  });
}

function recordMatchesMetricDimension(record, dataset) {
  if (dataset.kind === "source") return recordComplaintSource(record) === dataset.source;
  if (dataset.kind === "qre") {
    return record.qre_category === dataset.category &&
      includesMetricItem(record.qre_items || [], dataset.item);
  }
  return true;
}

function metricRowLabel(dataset, cells) {
  const category = cells?.[0]?.textContent || "Metric";
  const item = cells?.[1]?.textContent || "";
  const range = dataset.trendMonths ? `, ${dataset.trendMonths.replaceAll(",", " - ")}` : "";
  return `${category}: ${item}${range}`;
}

function getMetricFilters() {
  return {
    month: els.metricMonth.value,
    search: els.metricSearchFilter.value.trim(),
    startDate: els.metricStartDate.value,
    endDate: els.metricEndDate.value,
    department: els.metricDepartmentFilter.value,
    patientInvolved: els.metricPatientFilter.value,
    staffInvolved: els.metricStaffFilter.value,
    nature: els.metricNatureFilter.value,
    complaintSource: els.metricComplaintSourceFilter.value,
    origin: els.metricOriginFilter.value,
    complainant: els.metricComplainantFilter.value,
    issue: els.metricIssueFilter.value
  };
}

function recordMatchesMetricFilters(record, filters) {
  if (record.status !== "approved") return false;
  if (filters.month && !(record.event_date || "").startsWith(filters.month)) return false;
  if (filters.startDate && (record.event_date || "") < filters.startDate) return false;
  if (filters.endDate && (record.event_date || "") > filters.endDate) return false;
  return recordMatchesNonDateMetricFilters(record, filters);
}

function recordMatchesNonDateMetricFilters(record, filters) {
  if (filters.department && !filterValueMatches(record.department, filters.department)) return false;
  if (filters.patientInvolved && record.patient_involved !== filters.patientInvolved) return false;
  if (filters.staffInvolved && record.staff_involved !== filters.staffInvolved) return false;
  if (filters.nature && !arrayFilterMatches(record.nature, filters.nature)) return false;
  if (filters.complaintSource && recordComplaintSource(record) !== filters.complaintSource) return false;
  if (filters.origin && !filterValueMatches(record.origin_of_complaint, filters.origin)) return false;
  if (filters.complainant && record.complainants !== filters.complainant) return false;
  if (filters.issue && !arrayFilterMatches(record.issue, filters.issue)) return false;
  if (filters.search && !recordMatchesSearch(record, filters.search)) return false;
  return true;
}

function recordMatchesSearch(record, search) {
  const terms = search.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return true;
  const haystack = [
    record.reported_by,
    record.department,
    record.patient_identifier,
    record.staff_names,
    record.complainants,
    record.drug_details,
    record.complaint,
    record.investigation,
    record.resolution,
    record.follow_up,
    record.completed_by,
    record.pharmacist_name,
    record.pharmacist_notes,
    record.shipped_to_state,
    record.origin_of_complaint,
    record.review_department,
    record.documentation_complete,
    listValue(record.nature),
    listValue(record.issue),
    listValue(record.failure),
    listValue(record.qre_items),
    recordComplaintSource(record),
    QRE_CATEGORIES[record.qre_category]?.label
  ].join(" ").toLowerCase();
  return terms.every((term) => haystack.includes(term));
}

function filterValueMatches(value, filter) {
  if (value === filter) return true;
  return typeof value === "string" && filter === "Other" && value.startsWith("Other: ");
}

function arrayFilterMatches(values, filter) {
  return Array.isArray(values) && values.some((value) => filterValueMatches(value, filter));
}

function clearMetricFilters() {
  metricFilterElements().forEach((input) => {
    input.value = "";
  });
  renderMetrics();
}

function renderMetricDrilldown(records, label) {
  state.metricDrilldownRecords = [...records].sort((a, b) => String(b.event_date || "").localeCompare(String(a.event_date || "")));
  state.metricDrilldownLabel = label;
  if (!state.metricDrilldownRecords.some((record) => record.id === state.selectedMetricRecordId)) {
    state.selectedMetricRecordId = state.metricDrilldownRecords[0]?.id || null;
  }

  els.metricResultCount.textContent = `${state.metricDrilldownRecords.length} variance${state.metricDrilldownRecords.length === 1 ? "" : "s"}`;
  els.metricResultList.innerHTML = state.metricDrilldownRecords.length
    ? state.metricDrilldownRecords.map((record) => metricRecordCard(record)).join("")
    : `<div class="summary-box">No approved variances match ${escapeHtml(label)}.</div>`;

  els.metricResultList.querySelectorAll(".metric-record-select").forEach((button) => {
    button.addEventListener("click", () => {
      state.selectedMetricRecordId = button.dataset.id;
      renderMetricDrilldown(state.metricDrilldownRecords, state.metricDrilldownLabel);
    });
  });

  renderSelectedMetricRecord();
}

function metricRecordCard(record) {
  const active = record.id === state.selectedMetricRecordId ? " active" : "";
  const category = QRE_CATEGORIES[record.qre_category]?.label || "Approved variance";
  return `<div class="record-card${active}">
    <button class="record-select metric-record-select" data-id="${record.id}" type="button">
      <strong>${escapeHtml(record.reported_by || "Unassigned")}</strong>
      <span>${escapeHtml(record.event_date || "")} - ${escapeHtml(record.department || "")}</span>
      <span>${escapeHtml(category)} - ${escapeHtml(listValue(record.qre_items) || "No metric selected")}</span>
    </button>
  </div>`;
}

function selectedMetricRecord() {
  return state.metricDrilldownRecords.find((record) => record.id === state.selectedMetricRecordId);
}

function renderSelectedMetricRecord() {
  const record = selectedMetricRecord();
  if (!record) {
    els.metricRecordPreview.innerHTML = "Click a metric row or variance to preview matching approved variances.";
    els.printMetricRecordButton.disabled = true;
    return;
  }
  els.metricRecordPreview.innerHTML = printableRecordBody(record, { includeTitle: false });
  els.printMetricRecordButton.disabled = false;
}

async function onImportHistoricalCsv(event) {
  if (!requireAdmin()) return;
  const file = event.target.files?.[0];
  event.target.value = "";
  if (!file) return;

  if (!state.supabase) {
    showStatus("The secure data service is unavailable.", "error");
    return;
  }

  try {
    showStatus("Reading historical file...", "info", { persist: true });
    const rows = await readHistoricalRows(file);
    const payloads = rows
      .map(mapHistoricalCsvRow)
      .filter(Boolean)
      .filter((payload) => !hasHistoricalDuplicate(payload));

    if (!payloads.length) {
      showStatus("No new historical QRE rows were found to import.", "warning", { persist: true });
      return;
    }

    const confirmed = window.confirm(`Import ${payloads.length} approved historical QRE record(s) from ${file.name}? Slack notifications will not be sent.`);
    if (!confirmed) {
      showStatus("Historical import cancelled.", "info");
      return;
    }

    els.importHistoricalButton.disabled = true;
    for (let index = 0; index < payloads.length; index += 100) {
      const chunk = payloads.slice(index, index + 100);
      const { error } = await state.supabase.from("variance_reports").insert(chunk);
      if (error) {
        showStatus(error.message, "error", { persist: true });
        return;
      }
    }

    await loadRecords();
    render();
    showStatus(`Imported ${payloads.length} approved historical QRE record(s). Metrics have been refreshed.`, "success", { persist: true });
  } catch (error) {
    console.error(error);
    showStatus(`Historical import failed: ${error.message}`, "error", { persist: true });
  } finally {
    els.importHistoricalButton.disabled = false;
  }
}

async function readHistoricalRows(file) {
  const extension = file.name.split(".").pop()?.toLowerCase();
  if (extension === "xlsx" || extension === "xls") {
    return readExcelRows(file);
  }

  const text = await readFileAsText(file);
  return parseCsv(text);
}

function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(String(reader.result || "")));
    reader.addEventListener("error", () => reject(reader.error || new Error("Unable to read file.")));
    reader.readAsText(file, "windows-1252");
  });
}

async function readExcelRows(file) {
  const XLSX = await loadXlsxLibrary();
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetRows = workbook.SheetNames.map((sheetName) => {
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], {
      defval: "",
      raw: false,
      dateNF: "m/d/yyyy"
    }).map((row) => normalizeHistoricalRow(row));
    return { sheetName, rows };
  });

  const importSheet = sheetRows.find(({ rows }) => rows.some(isHistoricalImportRow));
  return importSheet?.rows || sheetRows[0]?.rows || [];
}

async function loadXlsxLibrary() {
  if (window.XLSX) return window.XLSX;
  try {
    const module = await import("https://cdn.sheetjs.com/xlsx-0.20.3/package/xlsx.mjs");
    window.XLSX = module.default || module;
    return window.XLSX;
  } catch (error) {
    throw new Error("Excel import library could not load. Please check your internet connection or upload a CSV instead.");
  }
}

function normalizeHistoricalRow(row) {
  return Object.entries(row).reduce((normalized, [key, value]) => {
    normalized[String(key).trim()] = value instanceof Date
      ? value.toISOString().slice(0, 10)
      : String(value ?? "").trim();
    return normalized;
  }, {});
}

function isHistoricalImportRow(row) {
  return Boolean(
    rowValue(row, "Date") &&
    rowValue(row, "Notes") &&
    rowValue(row, "Section") &&
    rowValue(row, "Error Type")
  );
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && inQuotes && next === '"') {
      cell += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const headers = rows.shift()?.map((header) => header.trim()) || [];
  return rows.map((values) => {
    return headers.reduce((record, header, index) => {
      record[header] = (values[index] || "").trim();
      return record;
    }, {});
  });
}

function rowValue(row, ...names) {
  for (const name of names) {
    if (Object.prototype.hasOwnProperty.call(row, name)) return String(row[name] ?? "").trim();
  }

  const normalizedNames = names.map(normalizeHeader);
  const matchingKey = Object.keys(row).find((key) => normalizedNames.includes(normalizeHeader(key)));
  return matchingKey ? String(row[matchingKey] ?? "").trim() : "";
}

function normalizeHeader(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanImportIdentifier(value) {
  const text = String(value || "").trim();
  return text.endsWith(".0") ? text.slice(0, -2) : text;
}

function mapHistoricalCsvRow(row) {
  const eventDate = parseHistoricalDate(rowValue(row, "Date"));
  const complaint = rowValue(row, "Notes").trim();
  const section = rowValue(row, "Section");
  const errorType = rowValue(row, "Error Type");
  const rxNumber = cleanImportIdentifier(rowValue(row, "RX #", "Rx Number", "RX Number", "Rx #"));
  const formulaId = cleanImportIdentifier(rowValue(row, "Formula ID", "Formula"));
  const employee = rowValue(row, "Employee");
  const rph = rowValue(row, "Rph", "RPh", "Pharmacist");
  const shipToState = rowValue(row, "Ship to State", "Ship to state", "Shipped to State");
  const qreCategory = mapHistoricalCategory(section, errorType);
  const qreItem = mapHistoricalQreItem(errorType, qreCategory);

  if (!eventDate || !complaint || !qreCategory || !qreItem) return null;

  const complaintSource = normalizeComplaintSource(rowValue(row, "Internal vs External")) || defaultHistoricalComplaintSource(section);
  const department = mapHistoricalDepartment(section);
  const issue = mapHistoricalIssue(section, errorType);
  const identifierParts = [rxNumber, formulaId].filter(Boolean);

  return {
    event_date: eventDate,
    reported_by: employee || "Historical import",
    department,
    patient_involved: rxNumber ? "yes" : "na",
    patient_identifier: identifierParts.join(" / "),
    staff_involved: employee ? "yes" : "na",
    staff_names: employee || "",
    nature: ["Error"],
    source: complaintSource ? [complaintSource] : [],
    complaint_source: complaintSource,
    shipped_to_state: complaintSource === "External" ? shipToState : "",
    origin_of_complaint: "",
    complainants: "",
    drug_involved: formulaId || rxNumber ? "yes" : "na",
    drug_details: formulaId ? `Formula ID ${formulaId}` : "",
    drug_recalled: "na",
    issue,
    failure: [],
    complaint,
    investigation: "",
    resolution: "",
    follow_up: "",
    patient_notified: "na",
    prescriber_notified: "na",
    completed_by: "Historical CSV import",
    status: "approved",
    qre_category: qreCategory,
    qre_items: [qreItem],
    review_department: department,
    pharmacist_name: rph || "Historical import",
    pharmacist_notes: "Imported from historical QI dashboard raw data.",
    documentation_complete: "yes",
    reviewed_by: state.user?.id || null,
    reviewed_at: new Date().toISOString(),
    submitted_by: state.user?.id || null
  };
}

function parseHistoricalDate(value) {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  const text = String(value || "").trim();
  const slashMatch = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/);
  if (slashMatch) {
    const [, month, day, yearValue] = slashMatch;
    const year = yearValue.length === 2 ? `20${yearValue}` : yearValue;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  const isoMatch = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:\s+\d{1,2}:\d{2}:\d{2})?$/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  }

  return "";
}

function normalizeComplaintSource(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "internal") return "Internal";
  if (normalized === "external") return "External";
  return "";
}

function defaultHistoricalComplaintSource(section) {
  const sectionKey = normalizeLookup(section);
  return sectionKey === "data entry" ? "Internal" : "";
}

function mapHistoricalCategory(section, errorType) {
  const sectionKey = normalizeLookup(section);
  const errorKey = normalizeLookup(errorType);
  if (["allergies", "dosing issue"].includes(errorKey)) return "clinical";
  if (sectionKey === "patient complaints") return "complaints";
  if (sectionKey === "facility") return "facility";
  if (["internal", "lab", "receiving", "data entry"].includes(sectionKey)) return "internal";
  return "internal";
}

function mapHistoricalQreItem(errorType, categoryKey) {
  const key = normalizeLookup(errorType);
  const map = {
    allergies: "Allergy",
    "dosing issue": "Dosing Issue",
    environmental: "Environmental Monitoring Issue",
    "formulation error": "Preparation Quality",
    instructions: "Labeling Issue",
    "labeling issue": "Labeling Issue",
    "packaging issue": "Packaging Issue",
    potency: "Potency Issue",
    "potency issue": "Potency Issue",
    "preparation quality": "Preparation Quality",
    quantity: "Drug Errors",
    "receipt issue": "Receipt Issue",
    "wrong drug": "Drug Errors",
    "wrong ingredient amount": "Preparation Quality",
    "wrong patient": "Drug Errors",
    "wrong quantity": "Drug Errors"
  };
  const item = map[key] || (key ? `Other: ${errorType.trim()}` : "Other");
  const allowedItems = QRE_CATEGORIES[categoryKey]?.items || [];
  return allowedItems.some((allowed) => item === allowed || (allowed === "Other" && item.startsWith("Other: ")))
    ? item
    : `Other: ${errorType.trim() || "Historical import"}`;
}

function mapHistoricalIssue(section, errorType) {
  const values = [];
  if (normalizeLookup(section) === "data entry") values.push("Data Entry");

  const key = normalizeLookup(errorType);
  const map = {
    address: "Other: Address",
    environmental: "Environmental monitoring",
    instructions: "Directions",
    "labeling issue": "Labeling",
    "packaging issue": "Packaging",
    payment: "Other: Payment",
    "phone number": "Other: Phone number",
    "potency issue": "Potency",
    quantity: "Quantity",
    refills: "Other: Refills",
    "wrong doctor": "Other: Wrong doctor",
    "wrong drug": "Drug",
    "wrong expiration": "Other: Wrong expiration",
    "wrong ingredient amount": "Compounding process",
    "wrong patient": "Patient",
    "wrong quantity": "Quantity"
  };
  if (map[key]) values.push(map[key]);
  if (!values.length && errorType) values.push(`Other: ${errorType.trim()}`);
  return [...new Set(values)];
}

function mapHistoricalDepartment(section) {
  const key = normalizeLookup(section);
  if (key === "lab") return "Lab";
  if (key === "data entry") return "Other: Data entry";
  if (key === "facility") return "Other: Facility";
  if (key === "patient complaints") return "Other: Patient Complaints";
  if (key === "receiving") return "Other: Receiving";
  if (key === "internal") return "Other: Internal";
  return "Other: Historical import";
}

function normalizeLookup(value) {
  return String(value || "").trim().toLowerCase();
}

function hasHistoricalDuplicate(payload) {
  const payloadKey = historicalRecordKey(payload);
  return state.records.some((record) => historicalRecordKey(record) === payloadKey);
}

function historicalRecordKey(record) {
  return [
    record.event_date || "",
    record.patient_identifier || "",
    record.complaint || "",
    record.qre_category || "",
    listValue(record.qre_items || [])
  ].join("|").toLowerCase();
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

function monthFromDate(dateValue) {
  return dateValue ? dateValue.slice(0, 7) : "";
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
  const filters = getMetricFilters();
  const rows = [
    ["Monthly Metrics"],
    ["Filters", metricFilterSummary(filters)],
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
  link.download = `qre-metrics-${filters.month || filters.startDate || "all"}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function metricFilterSummary(filters) {
  return Object.entries({
    month: filters.month,
    search: filters.search,
    startDate: filters.startDate,
    endDate: filters.endDate,
    department: filters.department,
    patientInvolved: filters.patientInvolved,
    staffInvolved: filters.staffInvolved,
    nature: filters.nature,
    complaintSource: filters.complaintSource,
    origin: filters.origin,
    complainant: filters.complainant,
    issue: filters.issue
  })
    .filter(([, value]) => value)
    .map(([key, value]) => `${key}: ${value}`)
    .join("; ") || "All approved QREs";
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
