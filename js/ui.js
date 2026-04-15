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