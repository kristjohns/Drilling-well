// Turns on-screen narration text into text the TTS voice pronounces well.
// Acronyms are spelled out, Norwegian names are respelled phonetically, fractions are spoken.
'use strict';

// Acronyms spoken letter by letter (word-boundary match, case-sensitive)
const SPELL = [
  'BOP', 'NCS', 'APA', 'PL', 'HSE', 'HMS', 'PSA', 'NPD', 'SUT', 'MD', 'TVD', 'TVDSS', 'RKB', 'MSL', 'LAT', 'KOP', 'DLS',
  'MWD', 'LWD', 'RSS', 'PDM', 'BHA', 'HWDP', 'DC', 'DP', 'PDC', 'TFA', 'SPM', 'SPP', 'WBM', 'OBM', 'SBM', 'PV', 'YP', 'LCM',
  'ECD', 'ESD', 'EMW', 'LOT', 'FIT', 'XLOT', 'MAASP', 'HPHT', 'MPD', 'ERD', 'TOC', 'WOC', 'CBL', 'LMRP', 'VBR', 'BSR', 'CSR',
  'EDS', 'SIDPP', 'SICP', 'KMW', 'IWCF', 'IADC', 'WBE', 'WBS', 'DST', 'SSTT', 'GR', 'NMR', 'VSP', 'TD', 'POOH', 'RIH',
  'WOB', 'RPM', 'ROP', 'MSE', 'NPT', 'ILT', 'DDR', 'AFE', 'KPI', 'EOWR', 'MOC', 'PTW', 'SJA', 'OIM', 'POB', 'GSK', 'EBS',
  'RUH', 'PSV', 'AHTS', 'ERRV', 'DPO', 'ROV', 'TMS', 'MODU', 'VDL', 'LQ', 'AHC', 'CMC', 'TDS', 'IBOP', 'FOSV', 'XO', 'PU', 'SO',
  'ROT', 'PP', 'FG', 'OBG', 'SG', 'GOC', 'OWC', 'GWC', 'FWL', 'NG', 'CSEM', 'DHI', 'AVO', 'TWT', 'COS', 'POS', 'STOIIP', 'GIIP',
  'BCU', 'UK', 'US', 'PPFG', 'CPI', 'MDT', 'WFT', 'TLC', 'PVT', 'SWC', 'ID', 'OD', 'API', 'LPM', 'CCS', 'ST', 'PGB', 'LP', 'HP',
  'WL', 'DD', 'AD', 'TP', 'HPU', 'MUX', 'ESD', 'RT', 'RTOC', 'WSG', 'BHP', 'BHT', 'GA', 'PA', 'MOB',
  'UBD', 'PWD', 'CT', 'BU', 'OH', 'HUET', 'DWOP', 'DOP', 'LTI', 'HAZID', 'HAZOP', 'TRA', 'BoD', 'PDO', 'SDFI', 'FPSO', 'NOFO',
  'LCM', 'FIV', 'DV', 'TAM', 'RMR', 'TCC', 'PWV', 'IP', 'AMF', 'TA', 'PPE', 'DFU', 'AMU', 'AT', 'DSV', 'RCA', 'SCAL', 'FMI', 'RCI', 'LAS',
  'DLIS', 'PI', 'GOR', 'SWC', 'RCA', 'AAR', 'HS', 'SCR', 'WOW', 'MMS', 'CCU', 'HMI', 'QHSE', 'SDS', 'ALARP', 'SIMOPS', 'JSA', 'NDT', 'FAT', 'SIT', 'LTA', 'DSO',
];
// Pronounced as words (override letter spelling)
const WORDS = {
  NORSOK: 'Nor-sock', Hs: 'H S', MUX: 'mucks', SCAL: 'scal', ALARP: 'ah-larp', SIMOPS: 'sim-ops', DISKOS: 'disk-os', Diskos: 'disk-os', MODU: 'moe-doo', DWOP: 'dee-wop', HUET: 'hue-et', HAZID: 'haz-id', HAZOP: 'haz-op', NOFO: 'no-foe',
  MAASP: 'M A A S P', SCADA: 'skada', Sodir: 'Soh-deer', Havtil: 'Hahv-teel', Ptil: 'Peh-teel', AoC: 'A O C', BoD: 'B O D',
  'D&W': 'D and W', 'P&A': 'P and A', 'T&D': 'torque and drag', 'H2S': 'H 2 S', CO2: 'C O 2', STOIIP: 'stoyp', GIIP: 'gip',
  'PU/SO': 'pick-up and slack-off', MoC: 'M O C', P90: 'P ninety', P50: 'P fifty', P10: 'P ten', 'D-010': 'D ten', 'D-001': 'D zero zero one',
  psi: 'P S I', ppg: 'pounds per gallon', ppf: 'pounds per foot', bbl: 'barrels', lpm: 'litres per minute', kNm: 'kilonewton metres', kN: 'kilonewtons',
};
// Norwegian / special names respelled for an English voice
const RESPELL = {
  Sokkeldirektoratet: 'Sokkel-dee-rek-to-rah-teh',
  Havindustritilsynet: 'Hahv-in-doo-stree-til-seeneh',
  Miljødirektoratet: 'Mil-yuh-dee-rek-to-rah-teh',
  Energidepartementet: 'Ener-ghee-departe-menteh',
  Oljedirektoratet: 'Ol-yeh-dee-rek-to-rah-teh',
  Petroleumstilsynet: 'Petroleums-til-seeneh',
  Equinor: 'Eck-wee-nor',
  Stavanger: 'Sta-vang-er',
  Bergen: 'Bair-ghen',
  Flesland: 'Fless-lahn',
  Sola: 'Soo-la',
  'Ågotnes': 'Oh-got-ness',
  Mongstad: 'Mong-stah',
  Kristiansund: 'Kristian-soon',
  'Sandnessjøen': 'Sand-ness-shuh-en',
  Hammerfest: 'Hammer-fest',
  'Brønnøysund': 'Brunn-uh-soon',
  'Snøhvit': 'Snuh-veet',
  Goliat: 'Goal-ee-aht',
  'Johan Castberg': 'Yo-hahn Cast-bairg',
  'Johan Sverdrup': 'Yo-hahn Svair-droop',
  'Åsgard': 'Ohs-gard',
  Heidrun: 'Hay-droon',
  Haltenbanken: 'Hahl-ten-bahn-ken',
  Skrugard: 'Skroo-gard',
  Ekofisk: 'Echo-fisk',
  Gullfaks: 'Gool-fahks',
  Troll: 'Troll',
  Draupne: 'Drowp-neh',
  Statfjord: 'Staht-fyord',
  Hordaland: 'Hor-da-lahn',
  Rogaland: 'Roo-ga-lahn',
  Nordland: 'Nord-lahn',
  'Offshore Norge': 'Offshore Nor-geh',
  'Norsk olje og gass': 'Norsk olyeh oh gahss',
  samtykke: 'sahm-tick-eh',
  samsvarsuttalelse: 'sahm-svahrs-oot-tah-lel-seh',
  sokkelen: 'sock-el-en',
  Aasta: 'Ohs-ta',
  Hansteen: 'Hahn-steen',
  Polarbase: 'Polar-base',
  verneombud: 'vairneh-om-bood',
  Synergi: 'Seener-ghee',
  Tananger: 'Tah-nang-er',
  'Dusavik': 'Doo-sa-veek',
  Utsira: 'Oot-seera',
  'Frøya': 'Fruh-ya',
  Kvitebjørn: 'Kveeteh-byurn',
  Kristin: 'Krist-in',
  Koomey: 'Koo-mee',
};
const FRACTIONS = { '½': ' and a half', '¼': ' and a quarter', '¾': ' and three quarter', '⅜': ' and three eighths', '⅝': ' and five eighths', '⅞': ' and seven eighths', '⅛': ' and one eighth' };

function escapeRe(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

function toTTS(s) {
  let out = String(s);
  // quotes and dashes
  out = out.replace(/[“”]/g, '"').replace(/[‘’]/g, "'").replace(/ – /g, ', ').replace(/—/g, ', ');
  // inch marks after fractions/numbers: 12¼" -> 12¼ inch
  out = out.replace(/(\d[½¼¾⅜⅝⅞⅛]?)"/g, '$1 inch');
  for (const [k, v] of Object.entries(FRACTIONS)) out = out.split(k).join(v);
  for (const [k, v] of Object.entries(RESPELL)) out = out.replace(new RegExp(escapeRe(k), 'g'), v);
  for (const [k, v] of Object.entries(WORDS)) out = out.replace(new RegExp('(^|[^A-Za-z0-9])' + escapeRe(k) + '(?=$|[^A-Za-z0-9])', 'g'), '$1' + v);
  const spell = [...new Set(SPELL)].sort((a, b) => b.length - a.length);
  for (const a of spell) {
    const spaced = a.replace(/([A-Za-z])(?=[A-Za-z0-9])/g, '$1 ').replace(/(\d)(?=[A-Za-z])/g, '$1 ');
    out = out.replace(new RegExp('(^|[^A-Za-z0-9])' + escapeRe(a) + 's(?=$|[^A-Za-z0-9])', 'g'), '$1' + spaced + "'s");
    out = out.replace(new RegExp('(^|[^A-Za-z0-9])' + escapeRe(a) + '(?=$|[^A-Za-z0-9])', 'g'), '$1' + spaced);
  }
  // units
  out = out.replace(/(\d)\s?°C/g, '$1 degrees Celsius').replace(/(\d)\s?°/g, '$1 degrees');
  out = out.replace(/(\d)\s?m³/g, '$1 cubic metres').replace(/Sm³/g, 'standard cubic metres');
  out = out.replace(/(\d) ?%/g, '$1 percent');
  out = out.replace(/ ?& ?/g, ' and ');
  out = out.replace(/\s+/g, ' ').trim();
  return out;
}

module.exports = { toTTS };
