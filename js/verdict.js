function getVerdict(result) {
  if (!result || !result.valid) {
    return {
      label:    "Invalid",
      cls:      "invalid",
      guidance: "Not a recognised number — check format or remove"
    };
  }

  const type = (result.type || "").toLowerCase();

  if (type === "voip") {
    return {
      label:    "Verify first",
      cls:      "verify",
      guidance: "VoIP number — may not reach a real person"
    };
  }

  if (type === "toll_free" || type === "premium_rate" || type === "shared_cost") {
    return {
      label:    "Do not call",
      cls:      "dncall",
      guidance: `${type === "toll_free" ? "Toll-free" : "Premium/shared"} line — not a personal contact`
    };
  }

  if (type === "mobile" || type === "landline" || type === "fixed_line_or_mobile") {
    return {
      label:    "Call ready",
      cls:      "ready",
      guidance: `${type === "mobile" ? "Mobile" : "Landline"} · ${result.carrier || "carrier unknown"}${result.country?.name ? " · " + result.country.name : ""}`
    };
  }

  return {
    label:    "Verify first",
    cls:      "verify",
    guidance: "Line type unclear — verify before adding to campaign"
  };
}

function getSummary(results) {
  const ready   = results.filter(r => r.verdict.cls === "ready").length;
  const verify  = results.filter(r => r.verdict.cls === "verify").length;
  const dnc     = results.filter(r => r.verdict.cls === "dncall").length;
  const invalid = results.filter(r => r.verdict.cls === "invalid").length;
  return { ready, verify, dnc, invalid, total: results.length };
}