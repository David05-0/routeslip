import {
  auth, db, onAuthStateChanged, signOut, doc, getDoc, addDoc, updateDoc,
  collection, onSnapshot, query, orderBy, serverTimestamp, STAGES, initials
} from "./firebase-config.js";

let currentUser = null;   // { uid, name, role, email }
let allSlips = [];
let activeTab = "action";
let activeSlipId = null;

const els = {
  roleChip: document.getElementById("roleChip"),
  nameLabel: document.getElementById("nameLabel"),
  pageTitle: document.getElementById("pageTitle"),
  pageSub: document.getElementById("pageSub"),
  newSlipBtn: document.getElementById("newSlipBtn"),
  tabs: document.getElementById("tabs"),
  slipList: document.getElementById("slipList"),
  detailBackdrop: document.getElementById("detailBackdrop"),
  detailPayee: document.getElementById("detailPayee"),
  detailStatus: document.getElementById("detailStatus"),
  detailBody: document.getElementById("detailBody"),
  detailClose: document.getElementById("detailClose"),
  newBackdrop: document.getElementById("newBackdrop"),
  newClose: document.getElementById("newClose"),
  newSlipForm: document.getElementById("newSlipForm"),
};

// ── Auth guard ────────────────────────────────────────────────────────────
onAuthStateChanged(auth, async (user) => {
  if (!user) { window.location.href = "index.html"; return; }

  const snap = await getDoc(doc(db, "users", user.uid));
  if (!snap.exists()) { await signOut(auth); window.location.href = "index.html"; return; }

  const profile = snap.data();
  currentUser = { uid: user.uid, name: profile.name, role: profile.role, email: profile.email };

  els.roleChip.textContent = currentUser.role;
  els.nameLabel.textContent = currentUser.name;
  els.pageSub.textContent = `Signed in as ${currentUser.role}`;
  els.newSlipBtn.style.display = currentUser.role === "Evaluator" ? "inline-flex" : "none";

  renderTabs();
  listenForSlips();
});

document.getElementById("signOutBtn").addEventListener("click", () => signOut(auth));

// ── Slip stream ──────────────────────────────────────────────────────────
function listenForSlips() {
  const q = query(collection(db, "routeSlips"), orderBy("createdAt", "desc"));
  onSnapshot(q, (snap) => {
    allSlips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderTabs();
    renderList();
    if (activeSlipId) {
      const fresh = allSlips.find(s => s.id === activeSlipId);
      if (fresh) renderDetail(fresh); else closeDetail();
    }
  });
}

function stageState(slip, idx) {
  if (idx < slip.currentStageIndex || slip.status === "completed") return "done";
  if (idx === slip.currentStageIndex) return "active";
  return "upcoming";
}

function actionNeededCount() {
  return allSlips.filter(s =>
    s.status !== "completed" && STAGES[s.currentStageIndex] === currentUser.role
  ).length;
}

// ── Tabs ─────────────────────────────────────────────────────────────────
function renderTabs() {
  const count = allSlips.length ? actionNeededCount() : 0;
  els.tabs.innerHTML = `
    <button class="tab ${activeTab === 'action' ? 'active' : ''}" data-tab="action">
      Action Needed ${count ? `<span class="count">${count}</span>` : ""}
    </button>
    <button class="tab ${activeTab === 'all' ? 'active' : ''}" data-tab="all">All Slips</button>
    <button class="tab ${activeTab === 'completed' ? 'active' : ''}" data-tab="completed">Completed</button>
  `;
  els.tabs.querySelectorAll(".tab").forEach(btn => {
    btn.addEventListener("click", () => { activeTab = btn.dataset.tab; renderTabs(); renderList(); });
  });
}

// ── List ─────────────────────────────────────────────────────────────────
function renderList() {
  let items = allSlips;
  if (activeTab === "action") {
    items = allSlips.filter(s => s.status !== "completed" && STAGES[s.currentStageIndex] === currentUser.role);
  } else if (activeTab === "completed") {
    items = allSlips.filter(s => s.status === "completed");
  }

  if (!items.length) {
    els.slipList.innerHTML = `
      <div class="empty-state">
        <h3>Nothing here yet</h3>
        <p>${activeTab === "action" ? "No slips are waiting on your office right now." : "No route slips to show."}</p>
      </div>`;
    return;
  }

  els.slipList.innerHTML = items.map(s => {
    const pill = s.status === "completed"
      ? `<span class="status-pill completed">Released</span>`
      : `<span class="status-pill ${STAGES[s.currentStageIndex] === currentUser.role ? 'waiting' : 'stage'}">At ${STAGES[s.currentStageIndex]}</span>`;
    return `
      <div class="slip-row" data-id="${s.id}">
        <div class="slip-main">
          <span class="slip-payee">${escapeHtml(s.payee)}</span>
          <span class="slip-meta">${s.voucherNumber ? "V# " + escapeHtml(s.voucherNumber) + " · " : ""}${formatDate(s.createdAt)}</span>
        </div>
        <div class="slip-side">
          <span class="slip-amount mono">₱${Number(s.amount).toLocaleString(undefined, {minimumFractionDigits:2})}</span>
          ${pill}
        </div>
      </div>`;
  }).join("");

  els.slipList.querySelectorAll(".slip-row").forEach(row => {
    row.addEventListener("click", () => openDetail(row.dataset.id));
  });
}

// ── Detail modal ─────────────────────────────────────────────────────────
function openDetail(id) {
  activeSlipId = id;
  const slip = allSlips.find(s => s.id === id);
  if (slip) renderDetail(slip);
  els.detailBackdrop.classList.add("show");
}

function closeDetail() {
  activeSlipId = null;
  els.detailBackdrop.classList.remove("show");
}
els.detailClose.addEventListener("click", closeDetail);
els.detailBackdrop.addEventListener("click", (e) => { if (e.target === els.detailBackdrop) closeDetail(); });

function renderDetail(slip) {
  els.detailPayee.textContent = slip.payee;
  els.detailStatus.className = "status-pill " + (slip.status === "completed" ? "completed" : "stage");
  els.detailStatus.textContent = slip.status === "completed" ? "Released" : `At ${STAGES[slip.currentStageIndex]}`;

  const trail = STAGES.map((role, idx) => {
    const st = stageState(slip, idx);
    return `
      <div class="stamp-node ${st}">
        <div class="stamp-connector"></div>
        <div class="stamp-circle">${st === "done" ? "✓" : idx + 1}</div>
        <div class="stamp-label">${role}</div>
      </div>`;
  }).join("");

  const logRows = slip.stages.map((st, idx) => `
    <tr>
      <td>${STAGES[idx]}</td>
      <td>${st.dateReceived || "—"}</td>
      <td>${st.dateOut || "—"}</td>
      <td>${st.initials || "—"}</td>
      <td>${st.remarks ? escapeHtml(st.remarks) : "—"}</td>
    </tr>`).join("");

  const detailGrid = `
    <div class="detail-grid">
      <div class="detail-item"><div class="k">Amount</div><div class="v">₱${Number(slip.amount).toLocaleString(undefined,{minimumFractionDigits:2})}</div></div>
      <div class="detail-item"><div class="k">BUS No.</div><div class="v">${slip.busNumber || "—"}</div></div>
      <div class="detail-item"><div class="k">Voucher No.</div><div class="v">${slip.voucherNumber || "—"}</div></div>
      <div class="detail-item"><div class="k">Cheque No.</div><div class="v">${slip.chequeNumber || "—"}</div></div>
      <div class="detail-item"><div class="k">Cheque Date</div><div class="v">${slip.chequeDate || "—"}</div></div>
      <div class="detail-item"><div class="k">Date Released</div><div class="v">${slip.dateReleased || "—"}</div></div>
    </div>
    <div class="detail-item"><div class="k">Particulars</div><div class="v" style="font-family:'IBM Plex Sans',sans-serif;">${escapeHtml(slip.particulars || "—")}</div></div>
  `;

  const canAct = slip.status !== "completed" && STAGES[slip.currentStageIndex] === currentUser.role;
  const currentStage = slip.stages[slip.currentStageIndex];

  els.detailBody.innerHTML = `
    ${detailGrid}
    <div class="stamp-trail">${trail}</div>
    <table class="log-table">
      <thead><tr><th>Office</th><th>Received</th><th>Forwarded</th><th>Initials</th><th>Remarks</th></tr></thead>
      <tbody>${logRows}</tbody>
    </table>
    ${canAct ? actionPanelHtml(currentStage) : ""}
  `;

  if (canAct) bindActionPanel(slip, currentStage);
}

function actionPanelHtml(stage) {
  if (!stage.dateReceived) {
    return `
      <div class="action-panel">
        <h3>Log receipt</h3>
        <div class="sub">Confirm this slip has physically arrived at your office.</div>
        <button class="btn" id="receiveBtn">Log receipt now</button>
      </div>`;
  }
  return `
    <div class="action-panel">
      <h3>Complete &amp; forward</h3>
      <div class="sub">Received ${stage.dateReceived} · ${stage.timeIn || ""}. Fill this in before forwarding.</div>
      <form id="forwardForm">
        <div class="form-grid">
          <div class="field"><label>Initials</label><input type="text" id="a_initials" required></div>
          <div class="field"><label>Remarks (optional)</label><input type="text" id="a_remarks"></div>
        </div>
        <button type="submit" class="btn full" style="margin-top:10px;">Complete &amp; forward</button>
      </form>
    </div>`;
}

function bindActionPanel(slip, stage) {
  const receiveBtn = document.getElementById("receiveBtn");
  if (receiveBtn) {
    receiveBtn.addEventListener("click", async () => {
      receiveBtn.disabled = true; receiveBtn.textContent = "Logging…";
      const now = new Date();
      const stages = [...slip.stages];
      stages[slip.currentStageIndex] = {
        ...stages[slip.currentStageIndex],
        dateReceived: now.toISOString().slice(0, 10),
        timeIn: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        receivedBy: currentUser.name
      };
      await updateDoc(doc(db, "routeSlips", slip.id), { stages });
    });
  }

  const forwardForm = document.getElementById("forwardForm");
  if (forwardForm) {
    document.getElementById("a_initials").value = initials(currentUser.name);
    forwardForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const btn = forwardForm.querySelector("button[type=submit]");
      btn.disabled = true; btn.textContent = "Forwarding…";

      const now = new Date();
      const dateOut = now.toISOString().slice(0, 10);
      const timeOut = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const stages = [...slip.stages];
      stages[slip.currentStageIndex] = {
        ...stages[slip.currentStageIndex],
        dateOut, timeOut,
        initials: document.getElementById("a_initials").value.trim(),
        remarks: document.getElementById("a_remarks").value.trim(),
        completedBy: currentUser.name
      };

      const isLastStage = slip.currentStageIndex === STAGES.length - 1;
      const payload = {
        stages,
        currentStageIndex: isLastStage ? slip.currentStageIndex : slip.currentStageIndex + 1,
        status: isLastStage ? "completed" : "in-progress",
        ...(isLastStage ? { dateReleased: dateOut } : {})
      };
      await updateDoc(doc(db, "routeSlips", slip.id), payload);
    });
  }
}

// ── New slip ─────────────────────────────────────────────────────────────
els.newSlipBtn.addEventListener("click", () => els.newBackdrop.classList.add("show"));
els.newClose.addEventListener("click", () => els.newBackdrop.classList.remove("show"));
els.newBackdrop.addEventListener("click", (e) => { if (e.target === els.newBackdrop) els.newBackdrop.classList.remove("show"); });

els.newSlipForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const btn = document.getElementById("createBtn");
  btn.disabled = true; btn.textContent = "Creating…";

  const emptyStages = STAGES.map(role => ({
    role, dateReceived: null, timeIn: null, dateOut: null, timeOut: null,
    initials: null, remarks: null, receivedBy: null, completedBy: null
  }));

  try {
    await addDoc(collection(db, "routeSlips"), {
      payee: document.getElementById("f_payee").value.trim(),
      amount: parseFloat(document.getElementById("f_amount").value),
      busNumber: document.getElementById("f_bus").value.trim(),
      voucherNumber: document.getElementById("f_voucher").value.trim(),
      chequeNumber: document.getElementById("f_cheque").value.trim(),
      chequeDate: document.getElementById("f_chequeDate").value,
      particulars: document.getElementById("f_particulars").value.trim(),
      stages: emptyStages,
      currentStageIndex: 0,
      status: "in-progress",
      dateReleased: null,
      createdBy: currentUser.name,
      createdAt: serverTimestamp()
    });
    els.newSlipForm.reset();
    els.newBackdrop.classList.remove("show");
  } catch (err) {
    alert("Couldn't create the route slip. Please try again.");
  } finally {
    btn.disabled = false; btn.textContent = "Create route slip";
  }
});

// ── Helpers ──────────────────────────────────────────────────────────────
function formatDate(ts) {
  if (!ts) return "—";
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
function escapeHtml(str) {
  return (str || "").replace(/[&<>"']/g, m => ({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;" }[m]));
}
