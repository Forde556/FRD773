/**
 * dentalLexicon.js
 * Curated English → Arabic dental terminology used by the methodical
 * translation service, the term extractor and the examination engine.
 * Each term carries a category so that distractors are always drawn from
 * the same clinical family (anatomy with anatomy, materials with materials…).
 */

const GROUPS = {
  anatomy: {
    enamel: 'المينا',
    dentin: 'العاج',
    dentine: 'العاج',
    pulp: 'اللب',
    cementum: 'الملاط',
    'periodontal ligament': 'الرباط حول السني',
    'alveolar bone': 'العظم السنخي',
    gingiva: 'اللثة',
    crown: 'التاج',
    root: 'الجذر',
    apex: 'الذروة الجذرية',
    cusp: 'الحدبة',
    'cusp tip': 'رأس الحدبة',
    'cusp of carabelli': 'حدبة كارابيلي',
    fossa: 'الحفرة',
    'central fossa': 'الحفرة المركزية',
    'distal fossa': 'الحفرة الوحشية',
    groove: 'الميزاب',
    'central groove': 'الميزاب المركزي',
    fissure: 'الشق',
    pit: 'النقرة',
    ridge: 'الحافة',
    'marginal ridge': 'الحافة الحفافية',
    'oblique ridge': 'الحافة المائلة',
    'transverse ridge': 'الحافة المستعرضة',
    'triangular ridge': 'الحافة المثلثية',
    cingulum: 'الحزام السني',
    'contact area': 'منطقة التماس',
    embrasure: 'الفُرجة',
    'cementoenamel junction': 'الملتقى المينائي الملاطي',
    furcation: 'مفترق الجذور',
    bifurcation: 'التفرع الثنائي',
    trifurcation: 'التفرع الثلاثي',
    'root trunk': 'جذع الجذر',
    'root canal': 'القناة الجذرية',
    'pulp chamber': 'الحجرة اللبية',
    'pulp horn': 'القرن اللبي',
    'apical foramen': 'الثقبة الذروية',
    'dentinal tubules': 'الأنابيب العاجية',
    odontoblast: 'الخلية المصوّرة للعاج',
    ameloblast: 'الخلية المصوّرة للمينا',
    hydroxyapatite: 'الهيدروكسي أباتيت',
    molar: 'الرحى',
    premolar: 'الضاحك',
    canine: 'الناب',
    incisor: 'القاطعة',
    'primary teeth': 'الأسنان اللبنية',
    'permanent teeth': 'الأسنان الدائمة',
    mandible: 'الفك السفلي',
    maxilla: 'الفك العلوي',
    'temporomandibular joint': 'المفصل الفكي الصدغي',
    'inferior alveolar nerve': 'العصب السنخي السفلي',
    lobe: 'الفص',
    mamelon: 'الحليمة القاطعة',
    tubercle: 'الحديبة',
  },
  direction: {
    mesial: 'إنسي',
    distal: 'وحشي',
    buccal: 'شدقي',
    lingual: 'لساني',
    palatal: 'حنكي',
    labial: 'شفوي',
    occlusal: 'إطباقي',
    incisal: 'قاطع',
    cervical: 'عنقي',
    proximal: 'ملاصق',
    mesiobuccal: 'إنسي شدقي',
    distobuccal: 'وحشي شدقي',
    mesiolingual: 'إنسي لساني',
    distolingual: 'وحشي لساني',
    mesiopalatal: 'إنسي حنكي',
    distopalatal: 'وحشي حنكي',
    maxillary: 'علوي (فكي علوي)',
    mandibular: 'سفلي (فكي سفلي)',
  },
  material: {
    amalgam: 'الملغم',
    'composite resin': 'الراتنج المركّب',
    composite: 'المركّب الراتنجي',
    'glass ionomer cement': 'إسمنت الزجاج الشاردي',
    'glass ionomer': 'الزجاج الشاردي',
    'resin-modified glass ionomer': 'الزجاج الشاردي المعدّل بالراتنج',
    'luting cement': 'إسمنت الإلصاق',
    liner: 'البطانة',
    base: 'القاعدة',
    varnish: 'الورنيش',
    'bonding agent': 'عامل الربط',
    'polyacrylic acid': 'حمض البولي أكريليك',
    'tartaric acid': 'حمض الطرطريك',
    'fluoroaluminosilicate glass': 'زجاج فلورو ألومينو سيليكات',
    'zinc oxide eugenol': 'أكسيد الزنك والأوجينول',
    'zinc phosphate': 'فوسفات الزنك',
    'calcium hydroxide': 'هيدروكسيد الكالسيوم',
    alginate: 'الألجينات',
    gypsum: 'الجبس',
    wax: 'الشمع',
    silica: 'السيليكا',
    alumina: 'الألومينا',
    'calcium fluoride': 'فلوريد الكالسيوم',
    conditioner: 'المكيّف السطحي',
    'petroleum jelly': 'الفازلين',
    powder: 'المسحوق',
    liquid: 'السائل',
    filler: 'الحشوة المالئة',
  },
  property: {
    'setting time': 'زمن التصلّب',
    'working time': 'زمن العمل',
    'setting reaction': 'تفاعل التصلّب',
    'acid-base reaction': 'تفاعل حمض-قاعدة',
    'compressive strength': 'مقاومة الانضغاط',
    'tensile strength': 'مقاومة الشد',
    'flexural strength': 'مقاومة الانثناء',
    'modulus of elasticity': 'معامل المرونة',
    'coefficient of thermal expansion': 'معامل التمدد الحراري',
    'thermal conductivity': 'الناقلية الحرارية',
    solubility: 'الذوبانية',
    viscosity: 'اللزوجة',
    biocompatibility: 'التوافق الحيوي',
    'fluoride release': 'تحرير الفلورايد',
    'powder-liquid ratio': 'نسبة المسحوق إلى السائل',
    'chemical adhesion': 'الالتصاق الكيميائي',
    chelation: 'الاستخلاب',
    polymerization: 'البلمرة',
    'polymerization shrinkage': 'انكماش البلمرة',
    translucency: 'الشفوفية',
    radiopacity: 'الظلالية الشعاعية',
  },
  clinical: {
    caries: 'النخر السني',
    'secondary caries': 'النخر الثانوي',
    plaque: 'اللويحة السنية',
    calculus: 'القلح',
    gingivitis: 'التهاب اللثة',
    periodontitis: 'التهاب دواعم السن',
    pulpitis: 'التهاب اللب',
    abscess: 'الخراج',
    radiograph: 'الصورة الشعاعية',
    restoration: 'الترميم',
    'cavity preparation': 'تحضير الحفرة',
    'crown preparation': 'تحضير التاج',
    etching: 'التخريش',
    isolation: 'العزل',
    'rubber dam': 'الحاجز المطاطي',
    'moisture contamination': 'التلوث بالرطوبة',
    desiccation: 'التجفيف المفرط',
    microleakage: 'التسرّب المجهري',
    'smear layer': 'طبقة اللطاخة',
    sensitivity: 'الحساسية',
    'postoperative sensitivity': 'الحساسية بعد العلاج',
    indication: 'استطباب',
    contraindication: 'مضاد استطباب',
    'local anesthesia': 'التخدير الموضعي',
    occlusion: 'الإطباق',
    malocclusion: 'سوء الإطباق',
    eruption: 'البزوغ',
    impression: 'الطبعة',
    endodontics: 'مداواة الجذور',
    orthodontics: 'تقويم الأسنان',
    prosthodontics: 'التعويضات السنية',
    periodontics: 'علم أمراض اللثة وما حول السن',
    'atraumatic restorative treatment': 'المعالجة الترميمية اللارضّية',
    'class v': 'الصنف الخامس',
    'cervical lesion': 'الآفة العنقية',
  },
};

/** Fine-grained families: distractors must come from the same family to stay plausible. */
const FAMILIES = {
  tissue: ['enamel', 'dentin', 'dentine', 'pulp', 'cementum', 'periodontal ligament', 'alveolar bone', 'gingiva', 'hydroxyapatite', 'dentinal tubules', 'odontoblast', 'ameloblast'],
  feature: ['cusp', 'cusp tip', 'fossa', 'central fossa', 'distal fossa', 'groove', 'central groove', 'fissure', 'pit', 'ridge', 'marginal ridge', 'oblique ridge', 'transverse ridge', 'triangular ridge', 'cingulum', 'lobe', 'mamelon', 'tubercle', 'contact area', 'embrasure', 'cusp of carabelli'],
  rootzone: ['crown', 'root', 'apex', 'furcation', 'bifurcation', 'trifurcation', 'root trunk', 'root canal', 'pulp chamber', 'pulp horn', 'apical foramen', 'cementoenamel junction'],
  toothtype: ['molar', 'premolar', 'canine', 'incisor', 'primary teeth', 'permanent teeth'],
  jaw: ['mandible', 'maxilla', 'temporomandibular joint', 'inferior alveolar nerve'],
  surface: ['mesial', 'distal', 'buccal', 'lingual', 'palatal', 'labial', 'occlusal', 'incisal', 'cervical', 'proximal'],
  compound: ['mesiobuccal', 'distobuccal', 'mesiolingual', 'distolingual', 'mesiopalatal', 'distopalatal'],
  arch: ['maxillary', 'mandibular'],
};
const FAMILY_OF = new Map();
for (const [fam, list] of Object.entries(FAMILIES)) for (const k of list) FAMILY_OF.set(k, fam);

export const LEXICON = new Map();
for (const [cat, entries] of Object.entries(GROUPS)) {
  for (const [en, ar] of Object.entries(entries)) {
    const key = normalizeTermKey(en);
    LEXICON.set(key, { en, ar, cat, family: FAMILY_OF.get(key) || cat });
  }
}

export function normalizeTermKey(s) {
  return String(s).toLowerCase().replace(/[\s\-‐–]+/g, ' ').trim();
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SORTED_KEYS = [...LEXICON.keys()].sort((a, b) => b.length - a.length);
const LEXICON_SOURCE = `\\b(${SORTED_KEYS.map((k) => escapeRe(k).replace(/ /g, '[\\s\\-]+')).join('|')})(?:es|s)?\\b`;

/** A fresh global, case-insensitive regex matching any lexicon term (longest first). */
export function lexiconRegex() {
  return new RegExp(LEXICON_SOURCE, 'gi');
}

/** Exact lookup with gentle plural handling. */
export function lookupTerm(raw) {
  const k = normalizeTermKey(raw);
  if (!k) return null;
  if (LEXICON.has(k)) return LEXICON.get(k);
  if (k.endsWith('ies') && LEXICON.has(k.slice(0, -3) + 'y')) return LEXICON.get(k.slice(0, -3) + 'y');
  if (k.endsWith('es') && LEXICON.has(k.slice(0, -2))) return LEXICON.get(k.slice(0, -2));
  if (k.endsWith('s') && LEXICON.has(k.slice(0, -1))) return LEXICON.get(k.slice(0, -1));
  if (k === 'teeth') return { en: 'teeth', ar: 'الأسنان', cat: 'anatomy' };
  if (k === 'fossae') return LEXICON.get('fossa');
  return null;
}

/** All lexicon matches inside a text, in reading order. */
export function findLexiconTerms(text) {
  const re = lexiconRegex();
  const out = [];
  let m;
  while ((m = re.exec(text))) {
    const entry = lookupTerm(m[1]);
    if (entry) out.push({ match: m[0], index: m.index, entry });
  }
  return out;
}

export const CATEGORY_LABELS = {
  anatomy: 'تشريح',
  direction: 'اتجاهات وسطوح',
  material: 'مواد',
  property: 'خواص',
  clinical: 'سريري',
};
