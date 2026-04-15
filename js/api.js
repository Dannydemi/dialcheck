// ── LIBPHONENUMBER — runs in browser, free, unlimited, 240+ countries ──
function parseWithLibPhone(rawPhone) {
  try {
    const phoneUtil = libphonenumber.PhoneNumberUtil.getInstance();
    const PNF       = libphonenumber.PhoneNumberFormat;
    const PNT       = libphonenumber.PhoneNumberType;

    // Try parsing as international first, then fallback to US
    let parsed;
    try {
      parsed = phoneUtil.parse(rawPhone, null);
    } catch(e) {
      parsed = phoneUtil.parse(rawPhone, "US");
    }

    if (!phoneUtil.isValidNumber(parsed)) {
      return { valid: false, e164: rawPhone, type: "unknown", country: null };
    }

    const typeNum   = phoneUtil.getNumberType(parsed);
    const typeMap   = {
      [PNT.MOBILE]:        "mobile",
      [PNT.FIXED_LINE]:    "landline",
      [PNT.FIXED_LINE_OR_MOBILE]: "mobile",
      [PNT.VOIP]:          "voip",
      [PNT.TOLL_FREE]:     "toll_free",
      [PNT.PREMIUM_RATE]:  "premium_rate",
      [PNT.SHARED_COST]:   "shared_cost",
      [PNT.UNKNOWN]:       "unknown"
    };

    const regionCode = phoneUtil.getRegionCodeForNumber(parsed);
    const countryName = getCountryName(regionCode);

    return {
      valid:     true,
      e164:      phoneUtil.format(parsed, PNF.E164),
      national:  phoneUtil.format(parsed, PNF.NATIONAL),
      intl:      phoneUtil.format(parsed, PNF.INTERNATIONAL),
      type:      typeMap[typeNum] || "unknown",
      country:   { code: regionCode, name: countryName }
    };
  } catch(e) {
    return { valid: false, e164: rawPhone, type: "unknown", country: null };
  }
}

// ── NUMVERIFY — adds carrier data ──
async function getCarrierData(e164Number) {
  try {
    const clean = e164Number.replace("+", "");
    const url   = `${CONFIG.NUMVERIFY_URL}?access_key=${CONFIG.NUMVERIFY_KEY}&number=${clean}&format=1`;
    const res   = await fetch(url);
    if (!res.ok) return null;
    const data  = await res.json();
    if (!data.valid) return null;
    return { carrier: data.carrier || null, location: data.location || null };
  } catch(e) { return null; }
}

// ── COMBINED VERIFY ──
async function verifyPhone(rawPhone) {
  const libResult = parseWithLibPhone(rawPhone.trim());
  if (!libResult.valid) {
    return { valid: false, phone: rawPhone, e164: rawPhone, type: "unknown", carrier: null, country: null, location: null };
  }
  const carrierData = await getCarrierData(libResult.e164);
  return {
    valid:    true,
    phone:    libResult.intl || libResult.e164,
    e164:     libResult.e164,
    national: libResult.national,
    type:     libResult.type,
    carrier:  carrierData?.carrier || null,
    location: carrierData?.location || null,
    country:  libResult.country
  };
}

// ── COUNTRY NAME LOOKUP ──
function getCountryName(code) {
  const map = {
    US:"United States",GB:"United Kingdom",NG:"Nigeria",GH:"Ghana",KE:"Kenya",
    ZA:"South Africa",IN:"India",AU:"Australia",CA:"Canada",DE:"Germany",
    FR:"France",IT:"Italy",ES:"Spain",BR:"Brazil",MX:"Mexico",AR:"Argentina",
    JP:"Japan",CN:"China",SG:"Singapore",AE:"UAE",SA:"Saudi Arabia",
    PH:"Philippines",PK:"Pakistan",BD:"Bangladesh",EG:"Egypt",ET:"Ethiopia",
    TZ:"Tanzania",UG:"Uganda",RW:"Rwanda",CM:"Cameroon",SN:"Senegal",
    CI:"Ivory Coast",MA:"Morocco",DZ:"Algeria",TN:"Tunisia",LY:"Libya",
    NZ:"New Zealand",IE:"Ireland",PT:"Portugal",NL:"Netherlands",BE:"Belgium",
    CH:"Switzerland",AT:"Austria",SE:"Sweden",NO:"Norway",DK:"Denmark",
    FI:"Finland",PL:"Poland",CZ:"Czech Republic",HU:"Hungary",RO:"Romania",
    UA:"Ukraine",RU:"Russia",TR:"Turkey",IL:"Israel",ZW:"Zimbabwe",
    ZM:"Zambia",MW:"Malawi",BW:"Botswana",NA:"Namibia",MZ:"Mozambique",
    MU:"Mauritius",SC:"Seychelles",SL:"Sierra Leone",LR:"Liberia",
    GN:"Guinea",ML:"Mali",BF:"Burkina Faso",NE:"Niger",TD:"Chad",
    CF:"Central African Republic",CG:"Congo",CD:"DR Congo",GA:"Gabon",
    GQ:"Equatorial Guinea",BI:"Burundi",SO:"Somalia",ER:"Eritrea",
    DJ:"Djibouti",KM:"Comoros",MG:"Madagascar",HK:"Hong Kong",
    TW:"Taiwan",KR:"South Korea",MY:"Malaysia",TH:"Thailand",
    VN:"Vietnam",ID:"Indonesia",MM:"Myanmar",KH:"Cambodia",LA:"Laos",
    ID:"Indonesia",NP:"Nepal",LK:"Sri Lanka",AF:"Afghanistan",IQ:"Iraq",
    IR:"Iran",JO:"Jordan",LB:"Lebanon",SY:"Syria",YE:"Yemen",
    KW:"Kuwait",QA:"Qatar",BH:"Bahrain",OM:"Oman",CO:"Colombia",
    VE:"Venezuela",PE:"Peru",CL:"Chile",EC:"Ecuador",BO:"Bolivia",
    PY:"Paraguay",UY:"Uruguay",GY:"Guyana",SR:"Suriname",TT:"Trinidad",
    JM:"Jamaica",CU:"Cuba",DO:"Dominican Republic",HT:"Haiti",
    GT:"Guatemala",HN:"Honduras",SV:"El Salvador",NI:"Nicaragua",
    CR:"Costa Rica",PA:"Panama"
  };
  return map[code] || code || "Unknown";
}

// ── USAGE TRACKING ──
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