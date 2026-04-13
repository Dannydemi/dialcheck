let lastResults  = [];
let pendingNumbers = [];
let sessionEmail = localStorage.getItem("dc_email") || "";
let sessionUsage = parseInt(localStorage.getItem("dc_usage") || "0");
let ownerActive  = isOwner(sessionEmail);

document.addEventListener("DOMContentLoaded", () => {
  renderCounter(sessionUsage, ownerActive);
});

function startSingle() {
  const phone = document.getElementById("phone").value.trim();
  if (!phone) { setStatus("single", "Please enter a phone number."); return; }
  if (!ownerActive && sessionUsage >= CONFIG.FREE_LIMIT) {
    setStatus("single", "Free limit reached. Upgrade to Pro to check more numbers."); return;
  }
  pendingNumbers = [{ phone }];
  openGate("single", sessionEmail);
}

function startBulk() {
  const file   = document.getElementById("file").files[0];
  if (!file) { setStatus("bulk", "Please select a file first."); return; }
  if (!ownerActive && sessionUsage >= CONFIG.FREE_LIMIT) {
    setStatus("bulk", "Free limit reached. Upgrade to Pro to check more numbers."); return;
  }
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const workbook = XLSX.read(e.target.result);
      const sheet    = workbook.Sheets[workbook.SheetNames[0]];
      const json     = XLSX.utils.sheet_to_json(sheet);
      const numbers  = json.map(row => ({
        phone: row.Phone || row.phone || row.Number || row.number ||
               Object.values(row).find(v => typeof v === "string" && v.match(/^\+?[\d\s\-().]{7,}$/))
      })).filter(n => n.phone);
      if (!numbers.length) { setStatus("bulk", "No phone numbers found in your file."); return; }
      pendingNumbers = numbers;
      openGate("bulk", sessionEmail);
    } catch(err) { setStatus("bulk", "Failed to read file. Please check the format."); }
  };
  reader.readAsArrayBuffer(file);
}

async function handleGate() {
  const userEmail = document.getElementById("userEmail").value.trim();
  const errEl     = document.getElementById("modal-error");
  const emailRx   = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  errEl.textContent = "";
  if (!emailRx.test(userEmail)) { errEl.textContent = "Please enter a valid email address."; return; }

  setGateBtn("Checking…", true);

  try {
    if (isOwner(userEmail)) {
      sessionEmail = userEmail;
      sessionUsage = 0;
      ownerActive  = true;
      localStorage.setItem("dc_email", sessionEmail);
      localStorage.setItem("dc_usage", "0");
      closeGate();
      renderCounter(sessionUsage, ownerActive);
      await runVerification(pendingNumbers, window._pendingType, userEmail, true);
      setGateBtn("Continue →", false);
      return;
    }

    const serverCount = await checkUsageRemote(userEmail);
    if (serverCount >= CONFIG.FREE_LIMIT) {
      errEl.innerHTML = `You've used all ${CONFIG.FREE_LIMIT} free checks. <a href="${CONFIG.GUMROAD_PRO}" target="_blank">Get Pro for $37 →</a>`;
      setGateBtn("Continue →", false); return;
    }

    sessionEmail = userEmail;
    sessionUsage = serverCount;
    ownerActive  = false;
    localStorage.setItem("dc_email", sessionEmail);
    localStorage.setItem("dc_usage", sessionUsage);
    closeGate();
    await runVerification(pendingNumbers, window._pendingType, userEmail, false);

  } catch(err) { errEl.textContent = "Something went wrong. Please try again."; }

  setGateBtn("Continue →", false);
}

async function runVerification(numbers, type, userEmail, bypass) {
  const remaining = bypass ? numbers.length : (CONFIG.FREE_LIMIT - sessionUsage);
  const capped    = numbers.slice(0, remaining);

  setVerifyBtn(type, "Checking…", true);
  if (!bypass && type === "bulk" && capped.length < numbers.length) {
    setStatus(type, `Free plan: checking first ${capped.length} of ${numbers.length} numbers.`);
  }

  const results = [];
  for (let i = 0; i < capped.length; i++) {
    setStatus(type, `Checking ${i + 1} of ${capped.length}…`);
    const raw     = await verifyPhone(capped[i].phone);
    const verdict = getVerdict(raw);
    results.push({ phone: capped[i].phone, verdict, raw });
    await new Promise(r => setTimeout(r, 400));
  }

  if (!bypass) {
    recordUsageRemote(userEmail, type, capped.map(n => n.phone).join(", "), capped.length);
    sessionUsage += capped.length;
    localStorage.setItem("dc_usage", sessionUsage);
    renderCounter(sessionUsage, ownerActive);
  }

  lastResults = results;
  setStatus(type, "");
  setVerifyBtn(type, type === "single" ? "Check this number" : "Verify my list", false);
  displayResults(results);
}

function downloadAll() {
  if (!lastResults.length) return;
  let csv = "Phone,Status,Type,Carrier,Country\n";
  lastResults.forEach(r => {
    csv += `"${r.phone}","${r.verdict.label}","${capitalise(r.raw?.type || "")}","${r.raw?.carrier || ""}","${r.raw?.country?.name || ""}"\n`;
  });
  triggerDownload(csv, "all_numbers.csv");
}

function downloadReady() {
  const rows = lastResults.filter(r => r.verdict.cls === "ready");
  if (!rows.length) { alert("No Call Ready numbers in your results."); return; }
  let csv = "Phone,Type,Carrier,Country\n";
  rows.forEach(r => {
    csv += `"${r.phone}","${capitalise(r.raw?.type || "")}","${r.raw?.carrier || ""}","${r.raw?.country?.name || ""}"\n`;
  });
  triggerDownload(csv, "call_ready.csv");
}

function downloadReadyAndVerify() {
  const rows = lastResults.filter(r => r.verdict.cls === "ready" || r.verdict.cls === "verify");
  if (!rows.length) { alert("No Call Ready or Verify First numbers in your results."); return; }
  let csv = "Phone,Status,Type,Carrier,Country\n";
  rows.forEach(r => {
    csv += `"${r.phone}","${r.verdict.label}","${capitalise(r.raw?.type || "")}","${r.raw?.carrier || ""}","${r.raw?.country?.name || ""}"\n`;
  });
  triggerDownload(csv, "call_ready_and_verify.csv");
}

function triggerDownload(content, filename) {
  const a    = document.createElement("a");
  a.href     = URL.createObjectURL(new Blob([content]));
  a.download = filename;
  a.click();
}