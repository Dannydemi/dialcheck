function getVerdict(result) {
  if (!result || !result.valid) {
    return {
      label:    "Invalid",
      cls:      "invalid",
      guidance: "Not a real number — remove from your list"
    };
  }

  const type     = (result.type || "").toLowerCase();
  const carrier  = result.carrier || "Unknown carrier";
  const country  = result.country?.name || "";
  const intl     = result.international_format || result.phone;
  const local    = result.local_format || "";

  if (type === "voip") {
    return {
      label:    "Verify first",
      cls:      "verify",
      guidance: `VoIP number (${carrier}) — may not ring a real person`
    };
  }

  if (type === "mobile") {
    return {
      label:    "Call ready",
      cls:      "ready",
      guidance: `Mobile · ${carrier}${country ? " · " + country : ""}`
    };
  }

  if (type === "landline") {
    return {
      label:    "Call ready",
      cls:      "ready",
      guidance: `Landline · ${carrier}${country ? " · " + country : ""}`
    };
  }

  if (type === "premium_rate" || type === "toll_free") {
    return {
      label:    "Do not call",
      cls:      "dncall",
      guidance: `${type === "toll_free" ? "Toll-free" : "Premium rate"} number — not a personal contact`
    };
  }

  return {
    label:    "Verify first",
    cls:      "verify",
    guidance: `Line type unclear (${type || "unknown"}) — verify before calling`
  };
}

function getSummary(results) {
  const ready  = results.filter(r => r.verdict.cls === "ready").length;
  const verify = results.filter(r => r.verdict.cls === "verify").length;
  const dnc    = results.filter(r => r.verdict.cls === "dncall").length;
  const invalid= results.filter(r => r.verdict.cls === "invalid").length;
  return { ready, verify, dnc, invalid, total: results.length };
}