// Load libphonenumber from CDN — formats any number to E.164 automatically
function formatToE164(rawPhone, defaultCountry = "US") {
  try {
    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
    const parsed    = phoneUtil.parse(rawPhone, defaultCountry);
    if (phoneUtil.isValidNumber(parsed)) {
      return phoneUtil.format(parsed, libphonenumber.PhoneNumberFormat.E164);
    }
    return rawPhone;
  } catch(e) {
    return rawPhone;
  }
}

async function verifyPhone(phone) {
  try {
    const formatted = formatToE164(phone);
    const url = `${CONFIG.ABSTRACT_URL}?api_key=${CONFIG.ABSTRACT_KEY}&phone=${encodeURIComponent(formatted)}`;
    const res  = await fetch(url);
    if (!res.ok) return null;
    const data = await res.json();
    data._formatted = formatted;
    return data;
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