async function verifyPhone(phone) {
  try {
    const url = `${CONFIG.ABSTRACT_URL}?api_key=${CONFIG.ABSTRACT_KEY}&phone=${encodeURIComponent(phone)}`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    return await res.json();
  } catch(e) { return null; }
}

async function checkUsageRemote(userEmail) {
  try {
    const url  = CONFIG.LEAD_URL + "?action=checkUsage&userEmail=" + encodeURIComponent(userEmail);
    const res  = await fetch(url);
    const data = await res.json();
    return parseInt(data.count || 0);
  } catch(e) { return 0; }
}

function recordUsageRemote(userEmail, type, checkedPhone, usageCount) {
  try {
    const url = CONFIG.LEAD_URL
      + "?action=recordUsage"
      + "&userEmail="    + encodeURIComponent(userEmail)
      + "&type="         + encodeURIComponent(type)
      + "&checkedEmail=" + encodeURIComponent(checkedPhone)
      + "&usageCount="   + encodeURIComponent(usageCount);
    fetch(url);
  } catch(e) {}
}

function isOwner(email) {
  return CONFIG.OWNER_EMAILS.includes((email || "").toLowerCase().trim());
}