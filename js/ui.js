function renderCounter(sessionUsage, ownerActive) {
  const remaining = Math.max(0, CONFIG.FREE_LIMIT - sessionUsage);
  const limitHit  = remaining === 0;

  const ownerHTML = `<span class="counter-owner">Owner account — unlimited checks</span>`;
  const limitHTML = `<span class="counter-limit">You've used all ${CONFIG.FREE_LIMIT} free checks.</span> <a href="${CONFIG.GUMROAD_PRO}" target="_blank" class="counter-link">Get Pro for $37 →</a>`;
  const freeHTML  = `<span class="counter-free">${remaining} of ${CONFIG.FREE_LIMIT} free checks remaining</span>`;

  const html = ownerActive ? ownerHTML : (limitHit ? limitHTML : freeHTML);

  ["usage-counter", "usage-counter-single"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.innerHTML = html;
  });

  document.getElementById("btn-single").disabled = !ownerActive && limitHit;
  document.getElementById("btn-bulk").disabled   = !ownerActive && limitHit;
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((t, i) => {
    t.classList.toggle("active", (i === 0 && tab === "single") || (i === 1 && tab === "bulk"));
  });
  document.getElementById("panel-single").classList.toggle("active", tab === "single");
  document.getElementById("panel-bulk").classList.toggle("active",   tab === "bulk");
  document.getElementById("results-area").style.display = "none";
}

function openGate(type, sessionEmail) {
  window._pendingType = type;
  document.getElementById("modal-error").textContent = "";
  if (sessionEmail) document.getElementById("userEmail").value = sessionEmail;
  document.getElementById("leadModal").classList.add("open");
}

function closeGate() {
  document.getElementById("leadModal").classList.remove("open");
}

function setGateBtn(text, disabled) {
  const btn = document.getElementById("unlockBtn");
  btn.textContent = text;
  btn.disabled    = disabled;
}

function displayResults(results) {
  const summary = getSummary(results);

  document.getElementById("results-count").textContent =
    `${summary.total} number${summary.total !== 1 ? "s" : ""} checked`;

  document.getElementById("summary-ready").textContent  = summary.ready;
  document.getElementById("summary-verify").textContent = summary.verify;
  document.getElementById("summary-dnc").textContent    = summary.dnc + summary.invalid;

  let rows = "";
  results.forEach(r => {
    const flag = r.raw?.country?.code
      ? `<span class="flag">${getFlagEmoji(r.raw.country.code)}</span>`
      : "";
    rows += `<tr>
      <td class="td-phone">${r.phone}</td>
      <td class="td-badge"><span class="badge ${r.verdict.cls}">${r.verdict.label}</span></td>
      <td class="td-type">${capitalise(r.raw?.type || "—")}</td>
      <td class="td-carrier">${r.raw?.carrier || "—"}</td>
      <td class="td-country">${flag} ${r.raw?.country?.name || "—"}</td>
    </tr>`;
  });

  document.getElementById("result-body").innerHTML = rows;
  document.getElementById("results-area").style.display = "block";

  const removeCount = summary.dnc + summary.invalid;
  if (removeCount > 0) {
    document.getElementById("remove-count").textContent =
      `${removeCount} number${removeCount !== 1 ? "s" : ""}`;
    document.getElementById("upgrade-box").classList.add("visible");
  }
}

function setStatus(panelType, text) {
  document.getElementById(panelType === "single" ? "status-single" : "status-bulk").textContent = text;
}

function setVerifyBtn(panelType, text, disabled) {
  const btn = document.getElementById(panelType === "single" ? "btn-single" : "btn-bulk");
  btn.textContent = text;
  btn.disabled    = disabled;
}

function getFlagEmoji(countryCode) {
  if (!countryCode || countryCode.length !== 2) return "";
  return countryCode.toUpperCase().replace(/./g, char =>
    String.fromCodePoint(127397 + char.charCodeAt(0))
  );
}

function capitalise(str) {
  if (!str) return "—";
  return str.charAt(0).toUpperCase() + str.slice(1).replace(/_/g, " ");
}