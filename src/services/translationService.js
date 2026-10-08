/**
 * translationService.js
 * محرك الترجمة السريرية والقاموس السني الموسع لمنصة لبلبي (1200+ مصطلح سني وطبي)
 * مدمج مع Gemini AI و Google Neural Translation و Fallback ذكي ضد الحظر ومصحح المصطلحات السريرية.
 */

import {
  hasGeminiKey,
  translateLinesWithGemini,
  translateWithGemini,
  generateSmartSummaryWithGemini,
} from './geminiService';

// ============================================================================
// 1. القاموس السني الموسع الشامل (1200+ مصطلح مصنف حسب فروع طب الأسنان)
// ============================================================================

// أ. مصطلحات عامة وأعراض وعلامات طبية
const GENERAL_MED = `hypertension:ارتفاع ضغط الدم|hypotension:انخفاض ضغط الدم|diabetes mellitus:داء السكري|myocardial infarction:احتشاء عضلة القلب|angina pectoris:الذبحة الصدرية|stroke:السكتة الدماغية|pneumonia:التهاب رئوي|asthma:الربو القصبي|anemia:فقر الدم|inflammation:التهاب|infection:عدوى|sepsis:تعفّن الدم|edema:وذمة|ischemia:نقص التروية|thrombosis:خثار|embolism:انصمام|fibrosis:تليّف|necrosis:نخر|carcinoma:سرطانة|tumor:ورم|metastasis:انبثاث (نقائل)|benign:حميد|malignant:خبيث|diagnosis:التشخيص|prognosis:الإنذار|etiology:المسببات|pathogenesis:آلية حدوث المرض|pathophysiology:الفيزيولوجيا المرضية|symptom:عَرَض|sign:علامة سريرية|syndrome:متلازمة|antibiotic:مضاد حيوي|analgesic:مسكّن ألم|antipyretic:خافض للحرارة|anticoagulant:مضاد تخثّر|antiplatelet:مضاد للصفيحات|corticosteroid:كورتيكوستيرويد|insulin:الإنسولين|dyspnea:زلّة تنفسية|tachycardia:تسرّع القلب|bradycardia:بطء القلب|arrhythmia:اضطراب نظم القلب|hemorrhage:نزف|hepatitis:التهاب الكبد|cirrhosis:تشمّع الكبد|nephritis:التهاب الكلية|renal failure:فشل كلوي|hypoxia:نقص الأكسجة|cyanosis:زرقة|biopsy:خزعة|chronic:مزمن|acute:حاد|subacute:تحت الحاد|allergy:حساسية|anaphylaxis:صدمة تأقية|syncope:إغماء|fever:حمّى|nausea:غثيان|vomiting:إقياء|fatigue:إرهاق|shock:صدمة|vaccine:لقاح|immunity:مناعة|virus:فيروس|fungus:فطر|bacteria:بكتيريا|therapy:علاج|treatment:معالجة|prophylaxis:وقاية`.split('|').map((x) => x.split(':'));

// ب. المواد السنية وخواصها (Dental Materials)
const DENTAL_MATERIALS = `dental material:مادة سنية|biocompatibility:التوافق الحيوي|gypsum:الجبس السني|plaster:جص|plaster of paris:جص باريس الطبي|dental stone:حجر سني|die stone:حجر القالب الدقيق (داي ستون)|impression material:مادة طبعة سنية|alginate:ألجينات|irreversible hydrocolloid:هيدروكولويد غير عكوس (ألجينات)|reversible hydrocolloid:هيدروكولويد عكوس (آغار)|agar:آغار|elastomer:مادة مطاطية مرنة|silicone:سيليكون|addition silicone:سيليكون بالإضافة (بولي فينيل سيلوكسان)|condensation silicone:سيليكون بالتكاثف|polyether:بولي إيثر|polysulfide:بولي سلفيد (مطاط ميركابتان)|zinc oxide eugenol:أكسيد الزنك والأوجينول (ZOE)|impression compound:مركب الطبعة الحراري|green stick compound:مركب الطبعة الأخضر (عصا خضراء)|acrylic resin:راتنج أكريليكي (بولي ميثيل ميثاكريلات)|polymethyl methacrylate:بولي ميثيل ميثاكريلات (PMMA)|polymerization:بلمرة|polymerization shrinkage:انكماش البلمرة|monomer:مونومر (جزيء أحادي سائل)|polymer:بوليمر (مسحوق البوليمر)|cross-linking:الربط المتقاطع|amalgam:الملغم السني (أملغم)|dental amalgam:ملغم سني|amalgam alloy:سبيكة الملغم|trituration:سحق وخلط الملغم في المرملة|condensation:تكثيف ورصّ الحشوة|carving:نحت الحشوة|burnishing:صقل وتمليس الحشوة|creep:الزحف (التشوه اللزج مع الوقت)|tarnish:انطماس (فقدان لمعان السطح)|corrosion:تآكل كيميائي كهرطيسي|composite:كومبوزيت (حشوة ضوئية)|composite resin:راتنج مركب (كومبوزيت)|hybrid composite:كومبوزيت هجين|nanofilled composite:كومبوزيت نانوي الدقائق|flowable composite:كومبوزيت سائل|packable composite:كومبوزيت قابل للرص|filler:حبيبات مالئة|matrix:المطرق العضوي|silane:سيلان|silane coupling agent:عامل ربط سيلاني|light curing:تصليب ضوئي|curing light:جهاز التصليب الضوئي|acid etching:تخريش حمضي بالحمض الفوسفوري|phosphoric acid:حمض الفوسفوريك (37%)|bonding:ترابط وتثبيت سناني|bonding agent:عامل ربط وتثبيت (بوند)|hybrid layer:الطبقة الهجينة (بين العاج والبوند)|resin tags:أوتاد الراتنج داخل الأنابيب العاجية|glass ionomer cement:أسمنت زجاجي شاردي (GIC)|resin-modified glass ionomer:أسمنت زجاجي معدل بالراتنج (RMGI)|zinc phosphate cement:أسمنت فوسفات الزنك|zinc polycarboxylate:بولي كاربوكسيلات الزنك|luting agent:مادة إلصاق وتثبيت التيجان|luting cement:أسمنت تثبيت|cavity base:قاعدة عازلة للترميم|cavity liner:بطانة واقية رقيقة|calcium hydroxide:هيدروكسيد الكالسيوم (دايكال)|varnish:ورنيش سني (كوبال)|dental wax:شمع سني|inlay wax:شمع الحشوات المصبوبة|casting wax:شمع الصب السني|baseplate wax:شمع صفائح القواعد|sticky wax:شمع لاصق|utility wax:شمع خدمات وتعديل|casting:صبّ المعدن المنصهر|investment material:مادة الإكساء والصب الحرارية|porcelain:خزف سني|dental ceramic:سيراميك سني|feldspathic porcelain:خزف فلسباتي|lithium disilicate:ثنائي سيليكات الليثيوم (E-max)|zirconia:زركونيا (أكسيد الزركونيوم)|hardness:الصلادة السطحية|strength:المقاومة (القوة الميكانيكية)|compressive strength:مقاومة الانضغاط|tensile strength:مقاومة الشد|shear strength:مقاومة القص|flexural strength:مقاومة الانحناء|elastic modulus:معامل المرونة (يونغ)|proportional limit:حد التناسب|yield strength:مقاومة الخضوع|ultimate strength:المقاومة القصوى|ductility:المطيلية (القابلية للسحب كأسلاك)|malleability:القابلية للطرق (تكوين صفائح)|toughness:المتانة (امتصاص طاقة الصدم)|brittleness:الهشاشة (القصف والكسر المفاجئ)|resilience:المرونة الرجوعية|thermal conductivity:التوصيل الحراري|thermal diffusivity:الانتشار الحراري|coefficient of thermal expansion:معامل التمدد الحراري الخطي|percolation:التسرّب الحفافي بالتبدل الحراري|microleakage:تسرّب مجهري دقيق|viscosity:اللزوجة|wettability:التبلل|contact angle:زاوية التماس|adhesion:التصاق بين مادتين مختلفتين|cohesion:تماسك بين جزيئات المادة الواحدة`.split('|').map((x) => x.split(':'));

// ج. أنسجة الفم وتطور الأسنان (Oral Histology & Embryology)
const ORAL_HISTOLOGY = `oral histology:أنسجة الفم|odontogenesis:تطور وتكوّن الأسنان|dental lamina:الصفيحة السنية الجنينية|vestibular lamina:الصفيحة الدهليزية|bud stage:مرحلة البرعم الجنيني|cap stage:مرحلة القلنسوة|bell stage:مرحلة الجرس|enamel organ:العضو المينائي|dental papilla:الحليمة السنية (أصل اللب والعاج)|dental follicle:الجريب السني (أصل الملاط والرباط والعظم)|dental sac:الكيس السني|outer enamel epithelium:ظهارة المينا الخارجية (OEE)|inner enamel epithelium:ظهارة المينا الداخلية (IEE)|stratum intermedium:الطبقة المتوسطة|stellate reticulum:الشبكة النجمية|cervical loop:العروة العنقية|hertwig's epithelial root sheath:غمد هيرتويغ الظهاري للجذر (HERS)|epithelial rests of malassez:بقايا مالاسيز الظهارية|ameloblast:أرومة المينا (الخلية البانية للمينا)|odontoblast:أرومة العاج (الخلية البانية للعاج)|cementoblast:أرومة الملاط|osteoblast:أرومة العظم (بانية العظم)|osteoclast:ناقضة العظم (كاسرة العظم)|amelogenesis:تكوّن المينا|dentinogenesis:تكوّن العاج|cementogenesis:تكوّن الملاط|enamel:المينا السنية|enamel rod:المنشور المينائي|enamel prism:المنشور المينائي|rod sheath:غمد المنشور المينائي|interrod enamel:المينا بين المناشير|enamel tufts:خصلات مينائية|enamel lamellae:صفائح مينائية|enamel spindles:مغازل مينائية|striae of retzius:خطوط ريتزيوس النمائية|neonatal line:خط الولادة النمائي|perikymata:تموجات بريكيماتا السطحية|hunter-schreger bands:حزم هنتر-شريغر الضوئية|gnarled enamel:المينا المتشابكة المتعقدة|dentin:العاج السني|dentinal tubule:أنبوب عاجي (قنية عاجية)|peritubular dentin:عاج حول الأنبوب (شديد التكلس)|intertubular dentin:عاج بين الأنابيب|mantle dentin:عاج غطائي سطحي|circumpulpal dentin:عاج حول اللب|primary dentin:عاج أولي (قبل بزوغ السن)|secondary dentin:عاج ثانوي (طبيعي طوال العمر)|tertiary dentin:عاج ثالثي (ترميمي ارتكاسي)|reparative dentin:عاج ترميمي تعويضي|reactionary dentin:عاج ارتكاسي دفاعي|sclerotic dentin:عاج متصلب شفاف|dead tract:مسار ميت في الأنابيب العاجية|interglobular dentin:عاج بين الكريات قليل التكلس|tomes granular layer:طبقة تومز الحبيبية في جذر العاج|tomes process:ناتئ تومز لأرومة المينا|tomes fiber:ليفة تومز لأرومة العاج|predentin:طليعة العاج (عاج غير متكلس بعد)|pulp:اللب السني|dental pulp:لب السن|odontoblastic layer:طبقة أرومات العاج|cell-free zone of weil:منطقة ويل الخالية من الخلايا|cell-rich zone:المنطقة الغنية بالخلايا|pulp core:مركز ولباب اللب السني|raschkow plexus:ضفيرة راشكوف العصبية|pulp stone:حصاة لبية (كلسية)|denticle:سنيدة (حصاة عاجية داخل اللب)|cementum:الملاط الجذري|acellular cementum:ملاط لاخلوي (أولي يغطي نصف الجذر التاجي)|cellular cementum:ملاط خلوي (ثانوي عند ذروة الجذر)|cementoenamel junction:الملتقى المينائي الملاطي (CEJ)|periodontal ligament:الرباط حول السني (PDL)|sharpey's fibers:ألياف شاربي المغروسة في العظم والملاط|principal fibers:الألياف الرئيسية للرباط|alveolar crest fibers:ألياف القمة السنخية|horizontal fibers:ألياف أفقية|oblique fibers:ألياف مائلة (الأكثر عدداً)|apical fibers:ألياف ذروية|interradicular fibers:ألياف بين الجذور|alveolar bone:العظم السنخي|alveolar process:الناتئ السنخي للفك|alveolar bone proper:العظم السنخي الحقيقي (المبطن للمسكن)|lamina dura:الصفيحة القاسية الشعاعية|bundle bone:عظم حزمي|cortical plate:الصفيحة القشرية العظمية|trabecular bone:عظم ترابقي إسفنجي|oral mucosa:الغشاء المخاطي الفموي|masticatory mucosa:مخاطية ماضغة (اللثة وقبة الحنك الصلب)|lining mucosa:مخاطية مبطنة (الشفاه والخدود وقاع الفم)|specialized mucosa:مخاطية متخصصة (ظهر اللسان)|keratinized:متقرن|parakeratinized:شبه متقرن|non-keratinized:غير متقرن|lamina propria:الصفيحة المخصوصة الضامة|submucosa:طبقة تحت المخاطية|papillae of tongue:حليمات اللسان|filiform papillae:حليمات خيطية (لا تحتوي براعم تذوق)|fungiform papillae:حليمات فطرية الشكل|circumvallate papillae:حليمات كأسية محوطة|foliate papillae:حليمات ورقية|taste bud:برعم التذوق|salivary gland:غدة لعابية|major salivary gland:غدة لعابية رئيسية|minor salivary gland:غدة لعابية صغيرة|parotid gland:الغدة النكفية (إفراز مصلي خالص)|submandibular gland:الغدة تحت الفك (مختلط مصلي غالباً)|sublingual gland:الغدة تحت اللسان (مختلط مخاطي غالباً)|acinus:عنيبة إفرازية لعابية|serous acinus:عنيبة مصلية|mucous acinus:عنيبة مخاطية|myoepithelial cells:خلايا ظهارية عضلية ضاغطة|intercalated duct:قناة مقحمة دقيقة|striated duct:قناة مخططة منظمة للشوارد|excretory duct:قناة إفرازية مفرغة|stenon's duct:قناة ستينون (قناة الغدة النكفية)|wharton's duct:قناة وارتون (قناة غدة تحت الفك)|rivinus ducts:قنوات ريفينوس (الغدة تحت اللسان)|bartholin's duct:قناة بارثولين الرئيسية`.split('|').map((x) => x.split(':'));

// د. تشريح الرأس والعنق والفكين (Anatomy & Head and Neck)
const ANATOMY = `cranium:عظام القحف|skull:الجمجمة|mandible:الفك السفلي|maxilla:الفك العلوي|zygomatic bone:العظم الوجني|temporal bone:العظم الصدغي|sphenoid bone:العظم الوتدي|ethmoid bone:العظم الغربالي|palatine bone:عظم الحنك|frontal bone:العظم الجبهي|parietal bone:العظم الجداري|occipital bone:العظم القذالي|nasal bone:عظم الأنف|lacrimal bone:عظم دمعي|vomer:الميكعة|inferior nasal concha:القرين الأنفي السفلي|suture:درز عظمي|coronal suture:الدرز الإكليلي|sagittal suture:الدرز السهمي|lambdoid suture:الدرز اللامي|foramen:ثقبة تشريحية|mental foramen:الثقبة الذقنية|incisive foramen:الثقبة القاطعة|greater palatine foramen:الثقبة الحنكية الكبيرة|lesser palatine foramen:الثقبة الحنكية الصغيرة|mandibular foramen:الثقبة الفكية السفلية (مدخل القناة السنخية)|infraorbital foramen:الثقبة تحت الحجاج|mandibular canal:القناة الفكية السفلية|fossa:حفرة تشريحية|glenoid fossa:الحفرة العنابية (الصدغية للمفصل)|mandibular fossa:الحفرة الفكية|infratemporal fossa:الحفرة تحت الصدغية|pterygopalatine fossa:الحفرة الجناحية الحنكية|process:ناتئ عظمي|condylar process:الناتئ اللقمي (لقمة الفك السفلي)|coronoid process:الناتئ الإكليلي للفك|alveolar process:الناتئ السنخي الحامل للأسنان|ramus of mandible:الرأد (الفرع الصاعد للفك السفلي)|body of mandible:جسم الفك السفلي|angle of mandible:زاوية الفك السفلي (الغونيون)|mandibular notch:الثلمة الفكية السفلية|symphysis menti:ارتفاق الذقن|mylohyoid line:الخط الضاحك اللامي|retromolar pad:الوسادة خلف الرحوية|retromolar triangle:المثلث خلف الرحوي|genial tubercles:الحديبات الذقنية (الشوكية اللسانية)|lingula:اللسين العظمي (يستر الثقبة الفكية)|temporomandibular joint:المفصل الفكي الصدغي (TMJ)|articular disc:القرص المفصلي (الغضروفي)|articular eminence:البارزة المفصلية الصدغية|capsule:المحفظة المفصلية|temporomandibular ligament:الرباط الصدغي الفكي|sphenomandibular ligament:الرباط الوتدي الفكي|stylomandibular ligament:الرباط الإبري الفكي|muscles of mastication:عضلات المضغ الأربع|masseter muscle:العضلة الماضغة|temporalis muscle:العضلة الصدغية|medial pterygoid:العضلة الجناحية الإنسية|lateral pterygoid:العضلة الجناحية الوحشية (خافضة وفاتحة للفك)|superior belly:البطن العلوي|inferior belly:البطن السفلي|muscles of facial expression:عضلات التعبير الوجهي|buccinator muscle:العضلة المبوقة|orbicularis oris:العضلة الدويرية الفموية|mentalis:العضلة الذقنية|zygomaticus major:الوجنية الكبيرة|platysma:العضلة الجلدية للعنق (المبسطة)|trigeminal nerve:العصب مثلث التوائم (العصب القحفي الخامس CN V)|ophthalmic nerve:العصب العيني (V1)|maxillary nerve:العصب الفكي العلوي (V2)|mandibular nerve:العصب الفكي السفلي (V3 مختلط حسي وحركي)|inferior alveolar nerve:العصب السنخي السفلي (IAN)|lingual nerve:العصب اللساني (حس اللسان العام)|chorda tympani:حبل الطبل (فرع العصب السابع للذوق)|buccal nerve:العصب الشدقي الحسي|long buccal nerve:العصب الشدقي الطويل|mental nerve:العصب الذقني (فرع انتهائي للشفة السفلية)|incisive nerve:العصب القاطع السفلي|posterior superior alveolar:العصب السنخي العلوي الخلفي (PSA)|middle superior alveolar:العصب السنخي العلوي المتوسط (MSA)|anterior superior alveolar:العصب السنخي العلوي الأمامي (ASA)|greater palatine nerve:العصب الحنكي الكبير|nasopalatine nerve:العصب الأنفي الحنكي (ثقبة القواطع)|facial nerve:العصب الوجهي (العصب القحفي السابع CN VII)|maxillary artery:الشريان الفكي العلوي (فرع السباتي الظاهر)|external carotid artery:الشريان السباتي الظاهر|facial artery:الشريان الوجهي|lingual artery:الشريان اللساني|inferior alveolar artery:الشريان السنخي السفلي|pterygoid plexus:الضفيرة الوريدية الجناحية|internal jugular vein:الوريد الوداجي الباطن|facial vein:الوريد الوجهي|submandibular lymph nodes:العقد اللمفاوية تحت الفك|submental lymph nodes:العقد اللمفاوية تحت الذقن|deep cervical lymph nodes:العقد اللمفاوية الرقبية العميقة`.split('|').map((x) => x.split(':'));

// هـ. صناعة الأسنان والتعويضات (Prosthodontics)
const PROSTHODONTICS = `prosthodontics:التعويضات السنية (صناعة الأسنان)|prosthesis:بديل صناعي تعويضي|complete denture:طقم أسنان كامل|removable partial denture:طقم أسنان جزئي متحرك (RPD)|fixed partial denture:تعويض جزئي ثابت (جسر سناني)|bridge:جسر سناني ثابت|crown:تاج سني صناعي|abutment:سن دعامة|retainer:مثبت تاجي للتعويض|pontic:دمية الجسر (السن المعوض المعلق)|connector:وصلة رابطة بين أجزاء الجسر|major connector:الوصلة الكبرى للطقم الجزئي|minor connector:الوصلة الصغرى|clasp:ضامة سنية لتثبيت الطقم|rest:مهماز إطباقي أو حنكي|rest seat:مرقد المهماز المحضر في السن|denture base:قاعدة طقم الأسنان|edentulous:أدرد (فاقد لجميع الأسنان)|partially edentulous:أدرد جزئياً|residual ridge:الحافة السنخية المتبقية بعد القلع|resorption:امتصاص العظم وانحساره|bone resorption:امتصاص العظم السنخي|primary impression:طبعة أولية تشخيصية|secondary impression:طبعة نهائية دقيقة|final impression:طبعة نهائية|stock tray:طابع جاهز|custom tray:طابع إفرادي خاص للمريض|special tray:طابع خاص مفرّد|cast:مثال (قالب جصي مصبوب)|study cast:مثال دراسة وتشخيص|diagnostic cast:مثال تشخيصي|master cast:المثال الرئيسي النهائي|working cast:القالب التشغيلي المخبري|refractory cast:مثال صامد للحرارة|record base:قاعدة التسجيل البعدية|occlusal rim:طوق الإطباق الشمعي|bite rim:طوق العضة التسجيلي|vertical dimension:البعد العمودي للوجه|vertical dimension of occlusion:البعد العمودي الإطباقي (VDO)|vertical dimension of rest:البعد العمودي في وضع الراحة (VDR)|freeway space:الحيز الحر بين الأسنان في وضع الراحة (2-4 مم)|interocclusal distance:المسافة الإطباقية الحرة (VDR - VDO)|centric relation:العلاقة المركزية الفكية (أعلى وأخلف وضع للقمة)|centric occlusion:الإطباق المركزي (أقصى تشابك حدبي للأسنان)|maximum intercuspation:أقصى تشابك لحدبات الأسنان (MIP)|facebow:القوس الوجهي لتسجيل علاقة الفك بالمفصل|articulator:المفصلة الصناعية (الآرتيكوليتور)|semi-adjustable articulator:مفصلة نصف قابلة للتعديل|fully-adjustable articulator:مفصلة كاملة التعديل|mounting:تثبيت وتجبير القوالب على المفصلة|teeth arrangement:ترتيب وتصفيف الأسنان الاصطناعية|balanced occlusion:الإطباق المتوازن في الأطقم الكاملة|working side:جانب العمل والمضغ|balancing side:جانب الموازنة والتثبيت|canine guidance:التوجيه بالناب في الأسنان الطبيعية|group function:وظيفة المجموعة الإطباقية|wax-up:تشميع القالب والتعويض|flasking:إدخال في البوتقة المخبرية|packing:تعبئة وضغط الأكريليك الساخن|curing:طبخ وتصليب الأكريليك بحمام مائي|deflasking:إخراج الطقم من البوتقة بعد التبريد|finishing:إنهاء وتشذيب الحواف الزائدة|polishing:تلميع وتنعيم سطح الطقم|retention:التثبيت (مقاومة قوى السحب العمودية للأسفل)|stability:الاستقرار (مقاومة القوى الأفقية والجانبية)|support:الدعم (مقاومة قوى الضغط الإطباقي للداخل)|undercut:منطقة انحسار وتثلم غائرة|relief:تفريغ شمعي لتخفيف الضغط عن المناطق الحساسة|post dam:السد الحفافي الخلفي لطقم الفك العلوي|posterior palatal seal:السد الحنكي الخلفي (PPS)|border molding:تشكيل وتسجيل الحواف بالمركب الأخضر|suction:الالتصاق المصي لقاعدة الطقم|palatal vault:قبة الحنك العظمية|torus palatinus:حيد حنكي عظمي ولادي|torus mandibularis:حيد فكي سفلي عظمي|frenum:لجام شفوي أو لساني|labial frenum:اللجام الشفوي|buccal frenum:اللجام الشدقي|lingual frenum:اللجام اللساني (تحت اللسان)|immediate denture:طقم فوري يركب بعد القلع مباشرة|overdenture:طقم فوقي يركب فوق جذور متبقية أو زرعات`.split('|').map((x) => x.split(':'));

// و. المداواة الترميمية وحشوات الأسنان (Operative Dentistry)
const OPERATIVE = `operative dentistry:مداواة الأسنان والترميميات|restorative dentistry:طب الأسنان الترميمي|caries:تسوّس الأسنان (نخر الأسنان)|dental caries:نخر الأسنان السريري|cavity:حفرة نخرية سنية|cavity preparation:تحضير الحفرة السنية لاستقبال الحشوة|black's classification:تصنيف بلاك للحفر النخرية|class I cavity:حفرة الصنف الأول (الوهاد والميازيب الإطباقية)|class II cavity:حفرة الصنف الثاني (السطوح الملاصقة للأسنان الخلفية)|class III cavity:حفرة الصنف الثالث (السطوح الملاصقة للأسنان الأمامية دون الزاوية)|class IV cavity:حفرة الصنف الرابع (السطوح الملاصقة الأمامية مع الزاوية القاطعة)|class V cavity:حفرة الصنف الخامس (الثلث العنقي للأسنان)|class VI cavity:حفرة الصنف السادس (قمم الحدبات والحواف القاطعة)|outline form:الشكل المحيطي الخارجي للحفرة|resistance form:شكل المقاومة (تحمل قوى المضغ دون كسر السن أو الحشوة)|retention form:شكل التثبيت (منع خروج وسقوط الحشوة)|convenience form:شكل الملاءمة وتسهيل وصول الأدوات|removal of remaining carious dentin:إزالة العاج النخر المتبقي|finishing enamel walls:إنهاء وتنعيم جدران المينا|toilet of the cavity:تنظيف وتجفيف الحفرة المحضرة|pulpal wall:الجدار اللبي (أرضية الحفرة فوق اللب)|axial wall:الجدار المحوري الموازي لمحور السن|gingival wall:الجدار اللثوي للحفرة الملاصقة|gingival seat:المقعد اللثوي|buccal wall:الجدار الشدقي|lingual wall:الجدار اللساني|cavo-surface margin:الحافة الكهفية السطحية|line angle:زاوية خطية (التقاء جدارين)|point angle:زاوية نقطية (التقاء ثلاثة جدران)|isthmus:البرزخ الواصل بين الحفر الإطباقية|dovetail:ذيل الحمامة التثبيتي في الحفرة|undercut:تثلم داخلي لتثبيت الملغم|amalgam restoration:ترميم بحشوة الملغم|composite restoration:ترميم بحشوة الكومبوزيت الضوئية|matrix band:شريط المسندة لتشكيل الجدار المفقود|matrix retainer:حامل شريط المسندة (توفلماير)|tofflemire retainer:حامل توفلماير للمساند المعدنية|wedge:إسفين خشبي أو بلاستيكي لمباعدة الأسنان وتثبيت المسندة|rubber dam:الحاجز المطاطي لعزل الأسنان|rubber dam clamp:ملقط ومشبك الحاجز المطاطي|rubber dam punch:خرامة الحاجز المطاطي|rubber dam forceps:ملقط وضع مشبك الحاجز المطاطي|isolation:عزل منطقة العمل عن اللعاب والرطوبة|cotton roll:لفافة قطنية للعزل الموضعي|saliva ejector:ماصة اللعاب البطيئة|high-volume evacuator:شافطة جراحية عالية الشفط (HVE)|bur:سنبلة حفر وتنعيم|diamond bur:سنبلة ألماسية للقطع السريع|carbide bur:سنبلة كربيد التنجستن لقطع العاج وإزالة الحشوات|handpiece:قبضة الحفر السنية|high-speed handpiece:قبضة توربين عالية السرعة (مع تبريد مائي)|low-speed handpiece:قبضة منخفضة السرعة للتنظيف والتلميع|contra-angle:قبضة زاوية معقوفة|straight handpiece:قبضة مستقيمة جراحية ومخبرية|spoon excavator:مجرفة يدوية لإزالة العاج المتنخر الطري|chisel:إزميل سني لتشذيب حواف المينا|hatchet:بلطة سنية لتسوية الجدران|gingival margin trimmer:مشذبة الحواف اللثوية|condenser:مرصة يدوية لضغط ورص الحشوة|plugger:مرصة سدادة|burnisher:مصقلة كروية لتمليس الحشوة|carver:ناحت يدوي لنحت الحدبات والميازيب|cleoid-discoid carver:ناحت كليويد ديسكويد للملغم|hollenback carver:ناحت هولنباك الدقيق|cermet:سيرميت (إسمنت زجاجي مدعم بجزيئات الفضة)|inlay:ترميم مصبوب ضمن حدود الحفرة (إنلاي)|onlay:ترميم مصبوب يغطي حدبة أو أكثر (أونلاي)|veneer:قشرة خزفية تجميلية (فينير عدسات الأسنان)|bleaching:تبييض الأسنان الحيّة وغير الحيّة|vital tooth:سن حي يحتوي لباً حيوياً|non-vital tooth:سن غير حي تم سحب عصبه|sensitivity:حساسية سنية تجاه البرودة والحرارة|dentin hypersensitivity:فرط حساسية العاج السني المكشوف`.split('|').map((x) => x.split(':'));

// ز. المعالجة اللبية وعصب الأسنان (Endodontics)
const ENDODONTICS = `endodontics:المعالجة اللبية (طب لب الأسنان وعلاجه)|root canal:قناة الجذر السنية|root canal treatment:المعالجة اللبية لقناة الجذر (سحب العصب RCT)|root canal therapy:المعالجة اللبية للقناة الجذرية|pulpal disease:أمراض اللب السني|reversible pulpitis:التهاب اللب العكوس (يزول بزوال المخرش)|irreversible pulpitis:التهاب اللب غير العكوس (ألم تلقائي مستمر نابض)|pulp necrosis:تموت ونخر اللب السني|apical periodontitis:التهاب النسج حول الذروية السنية|acute apical periodontitis:التهاب حول الذروة الحاد (ألم شديد مع العض)|chronic apical periodontitis:التهاب حول الذروة المزمن (غير مؤلم عادة)|periapical abscess:خراج حول الذروة القيحية|acute apical abscess:خراج ذروي حاد متورم|chronic apical abscess:خراج ذروي مزمن مع ناسور قيحي|fistula:ناسور لتصريف القيح|sinus tract:مسار ناسوري مفرغ|apical granuloma:ورم حبيبي حول الذروة|radicular cyst:كيس جذري ذروي كيسي ملتهب|access cavity:حفرة المدخل اللبي لحجرة اللب|access opening:فتح حجرة اللب السنية|pulp chamber:حجرة اللب التاجية|canal orifice:فوهة مدخل قناة الجذر|working length:طول العمل السريري للقناة حتى الذروة|apex locator:جهاز تحديد الذروة الإلكتروني|electronic apex locator:محدد الذروة الإلكتروني (EAL)|radiographic apex:الذروة الشعاعية المشاهدة بالصورة|apical foramen:الثقبة الذروية الميكروسكوبية لخروج الأوعية|apical constriction:التضيق الذروي الطبيعي (نهاية تحضير القناة)|cleaning and shaping:تنظيف وتوسيع وتشكيل القنوات|endodontic file:مبرد لبي لتحضير القنوات|k-file:مبرد كيه اليدوي الكلاسيكي|hedstrom file:مبرد هيدستروم القاطع (H-file)|rotary files:مبارد دوارة من النيكل تيتانيوم (NiTi)|nickel-titanium:سبيكة النيكل تيتانيوم عالية المرونة|irrigation:إرواء وغسيل قنوات الجذر السنية|irrigant:سائل الإرواء والغسيل|sodium hypochlorite:هيبوكلوريت الصوديوم (NaOCl المطهر المذيب للأنسجة)|chlorhexidine:كلورهيكسيدين (مطهر واسع الطيف 2%)|edta:إيثيلين ثنائي أمين حمض الخل (EDTA لإزالة طبقة اللطاخة)|smear layer:طبقة اللطاخة الناتجة عن برد القنوات|saline:محلول ملحي نظامي فيزيولوجي|intracanal medicament:ضماد دوائي داخل القناة بين الجلسات|calcium hydroxide paste:معجون هيدروكسيد الكالسيوم القاتل للجراثيم|obturation:سد وحشو قنوات الجذر ثلاثي الأبعاد|gutta-percha:الكوتابيركا (المادة الرئيسية لحشو القنوات)|master cone:القمع اللبي الرئيسي المطابق لقياس التحضير|accessory cone:أقماع إضافية للملء الجانبي|lateral condensation:تكثيف جانبي بارد للكوتابيركا|spreader:موزعة يدوية للتكثيف الجانبي|vertical condensation:تكثيف عمودي دافئ للكوتابيركا|endodontic sealer:معجون ساد ومطفر لملء الفراغات الدقيقة (سيلر)|bioceramic sealer:سيلر السيراميك الحيوي فائق الالتصاق|mta:ثلاثي أكسيد المعادن التجميعي (MTA)|mineral trioxide aggregate:مركب ثلاثي أكسيد المعادن (MTA للترميم والذروة)|pulp capping:تغطية وحماية اللب|direct pulp capping:تغطية اللب المباشرة (انكشاف اللب المجهري النظيف)|indirect pulp capping:تغطية اللب غير المباشرة (فوق طبقة عاج رقيقة)|pulpotomy:بتر اللب التاجي الحي (خاصة بالأسنان اللبنية)|pulpectomy:استئصال اللب الكامل من التاج والجذور|apexification:تحريض إغلاق الذروة في الأسنان الدائمة الفتية غير الحية|apexogenesis:تحريض اكتمال نمو الجذر والذروة في الأسنان الحية|apicoectomy:قطع واستئصال الذروة الجذري جراحياً|retrograde filling:حشوة قمعية راجعة من الذروة جراحياً|post and core:وتد وقلب تعويضي للسن المعالج لبياً|fiber post:وتد مصنوع من الألياف الزجاجية|cast post:وتد وقلب معدني مصبوب`.split('|').map((x) => x.split(':'));

// ح. أمراض وجراحة اللثة (Periodontics)
const PERIODONTICS = `periodontics:طب وأمراض اللثة والأنسجة الداعمة|periodontium:النسج حول السنية الداعمة للسن (اللثة، العظم، الرباط، الملاط)|gingiva:اللثة السنية|free gingiva:اللثة الحرة المحيطة بعنق السن|attached gingiva:اللثة الملتصقة المثبتة على السمحاق|interdental papilla:الحليمة اللثوية بين السنية|col:السرج اللثوي المنخفض بين الأسنان|gingival sulcus:الميزاب اللثوي الطبيعي (عمقه 1-3 مم)|periodontal pocket:الجيب اللثوي المرضي (عمقه أكثر من 3 مم)|suprabony pocket:جيب لثوي فوق عظمي|infrabony pocket:جيب لثوي تحت عظمي (داخل العظم السنخي)|gingivitis:التهاب اللثة (مقتصر على النسيج الرخو دون فقد عظم)|periodontitis:التهاب النسج حول السنية (مع تخرب العظم والرباط)|chronic periodontitis:التهاب النسج الداعمة المزمن|aggressive periodontitis:التهاب النسج الداعمة الشرس السريع|necrotizing ulcerative gingivitis:التهاب اللثة التقرحي الناخر (NUG)|dental plaque:اللويحة الجرثومية السنية (بيوفيلم)|biofilm:الغشاء الحيوي الجرثومي الملتصق بالأسنان|calculus:القلح السني (الجير المتكلس)|tartar:الجير السني|supragingival calculus:قلح فوق لثوي مرئي مائل للصفرة|subgingival calculus:قلح تحت لثوي داخل الجيب بني أو أسود داكن|scaling:تقليح وإزالة القلح واللويحة|root planing:تسوية وكشط الجذر السني وتنعيمه|subgingival scaling:تقليح عميق تحت اللثة|curette:مجرفة لثوية خاصة (كوريت)|grace curette:مجرفة غريسي المتخصصة لمناطق معينة|universal curette:مجرفة عامة لجميع السطوح|ultrasonic scaler:جهاز التقليح بالأمواج فوق الصوتية|periodontal probe:مسبار اللثة لقياس عمق الجيوب|probing depth:عمق السبر اللثوي بالمسبار|clinical attachment loss:فقدان الارتباط السريري (CAL)|bleeding on probing:النزف عند السبر اللثوي (BOP علامة التهاب)|gingival recession:انحسار وتراجع اللثة وانكشاف الجذور|furcation involvement:إصابة مفرق الجذور في الأسنان متعددة الجذور|tooth mobility:حركة وتخلخل السن المرضي|grade I mobility:حركة سن خفيفة أقل من 1 مم أفقياً|grade II mobility:حركة سن متوسطة أكثر من 1 مم أفقياً|grade III mobility:حركة سن شديدة أفقياً وعمودياً معاً|fremitus:حركة السن المحسوسة أثناء الإطباق|splinting:تجبير وربط الأسنان المتحركة لتثبيتها|gingivectomy:استئصال وقص اللثة المتضخمة|gingivoplasty:تصنيع وتجميل شكل اللثة|periodontal flap:شريحة لثوية جراحية لكشف العظم|bone graft:طعم عظمي لتعويض العظم المفقود|guided tissue regeneration:إعادة التجدد النسجي الموجه (GTR)|barrier membrane:غشاء حاجز عازل في الجراحة التجددية|connective tissue graft:طعم نسج ضامة لتغطية انحسار اللثة|free gingival graft:طعم لثوي حر لزيادة عرض اللثة الملتصقة`.split('|').map((x) => x.split(':'));

// ط. جراحة الفم والوجه والفكين والتخدير (Oral Surgery & Anesthesia)
const ORAL_SURGERY = `oral surgery:جراحة الفم والوجه والفكين|extraction:قلع السن جراحياً أو بسيطاً|simple extraction:قلع بسيط للسن بالكلابات والمرافع|surgical extraction:قلع جراحي يتطلب شق شريحة وإزالة عظم|impacted tooth:سن منطمر داخل العظم واللثة|impacted third molar:ضرس عقل منطمر|wisdom tooth:ضرس العقل|dental forceps:كلابة قلع الأسنان|extraction elevator:رافعة سنية لخلخلة السن ورفعه|straight elevator:رافعة مستقيمة بسيطة|cryer elevator:رافعة كراير المثلثة للجذور المكسورة|coupland elevator:رافعة كوبلاند العريضة|root tip pick:مرفاع ذروي دقيق لانتشال شظايا الذرى|luxation:خلخلة السن وتوسيع عظم المسكن|socket:المسكن السنخي بعد قلع السن|alveolar osteitis:التهاب العظم السنخي (المسكن الجاف Dry Socket)|dry socket:المسكن الجاف المؤلم بعد القلع|blood clot:الجلطة الدموية الشافية داخل المسكن|hemostasis:إيقاف النزف وتخثر الدم|gelatamp:إسفنجة جيلاتينية دوائية لوقف النزف في المسكن|suture:خياطة جراحية|suture needle:إبرة خياطة جراحية|needle holder:حامل إبرة الخياطة الجراحية|scalpel:مشرط جراحي|blade No 15:شفرة مشرط رقم 15 القياسية لجراحة الفم|periosteal elevator:رافعة السمحاق لكشف الشريحة العظمية|rongeur:قاطعة عظم جراحية لتشذيب العظم الناتئ|bone file:مبرد عظم لتنعيم الحواف الحادة|curettage:تجريف وتنظيف المسكن من النسج الحبيبية|incision:شق جراحي|crevicular incision:شق ميزابي لثوي|vertical releasing incision:شق عمودي مفرغ للشريحة|flap:شريحة نسيجية جراحية|full-thickness flap:شريحة كاملة السماكة متضمنة السمحاق|partial-thickness flap:شريحة جزئية السماكة مقسومة|biopsy:خزعة تشخيصية مخبرية|excisional biopsy:خزعة استئصالية لكامل الآفة الصغيرة|incisional biopsy:خزعة اقتطاعية لجزء من الآفة الكبيرة|aspiration:بزل ورشف السائل بالإبرة للتأكد من المحتوى|cyst:كيس فكي مبطن بظهارة|enucleation:تقشير واستئصال الكيس بالكامل|marsupialization:تفويه وتصغير الكيس الفكي تدريجياً|local anesthesia:التخدير الموضعي السني|topical anesthesia:تخدير موضعي سطحي بالهلام أو البخاخ|infiltration anesthesia:تخدير ارتشاحي موضعي للأنسجة|nerve block:تخدير إحصار العصب الرئيسي|inferior alveolar nerve block:إحصار العصب السنخي السفلي (IANB)|gow-gates technique:تقنية غاو-غيتس لإحصار الفك السفلي|akinosi technique:تقنية أكينوزي للإحصار الفموي المغلق|mental nerve block:إحصار العصب الذقني|nasopalatine nerve block:إحصار العصب الأنفي الحنكي|greater palatine block:إحصار العصب الحنكي الكبير|vasoconstrictor:مقبض أوعية مضاف للمخدر الموضعي|epinephrine:إبينفرين (أدرينالين مضاف بنسبة 1:100,000)|lidocaine:ليدوكائين (المخدر الموضعي المعياري 2%)|articaine:أرتيكائين (مخدر فائق النفاذية في العظام 4%)|mepivacaine:ميبفيكائين (يستخدم بدون مقبض أوعية 3%)|bupivacaine:بوبيفيكائين (مخدر طويل المفعول لتسكين ما بعد الجراحة)|paresthesia:خدر وتنميل عصبي دائم أو مؤقت|hematoma:ورم دموي ناتج عن إصابة وعاء أثناء الحقن|trismus:ضزز (تشنج عضلات المضغ وصعوبة فتح الفم)|needle breakage:انكسار إبرة التخدير داخل النسج`.split('|').map((x) => x.split(':'));

// ي. تقويم الأسنان وطب أسنان الأطفال (Orthodontics & Pedodontics)
const ORTHO_PEDO = `orthodontics:تقويم الأسنان والفكين|malocclusion:سوء الإطباق وتشوه رصف الأسنان|angle's classification:تصنيف آنجل لسوء الإطباق|class I malocclusion:سوء إطباق من الصنف الأول|class II malocclusion:سوء إطباق من الصنف الثاني (تراجع الفك السفلي)|division 1:القسم الأول (بروز القواطع العلوية للأمام)|division 2:القسم الثاني (ميلان القواطع العلوية للخلف)|class III malocclusion:سوء إطباق من الصنف الثالث (بروز الفك السفلي)|overjet:البروز الأفقي للقواطع العلوية (طبيعياً 2-3 مم)|overbite:التغطية العمودية للقواطع العلوية على السفلية|open bite:عضة مفتوحة (عدم تلامس الأسنان عمودياً)|anterior open bite:عضة مفتوحة أمامية|crossbite:عضة متصالبة معكوسة|anterior crossbite:عضة متصالبة أمامية|posterior crossbite:عضة متصالبة خلفية|deep bite:عضة عميقة مفرطة التغطية|crowding:تزاحم الأسنان وركوبها فوق بعضها|spacing:تباعد الأسنان ووجود فراغات بينها|diastema:دياستيما (الفراغ بين الثنيتين العلويتين)|bracket:حاصرة تقويمية ملصقة على السن|archwire:سلك القوس التقويمي|ligature:سلك أو حلقة مطاطية لربط السلك بالحاصرة|elastics:مطاطات تقويمية لشد الأسنان بين الفكين|band:طوق معدني يحيط بالرحى للتقويم|anchor:دعامة ارتكاز تقويمي|anchorage:تثبيت وارتكاز تقويمي لمنع حركة الأسنان غير المرغوبة|temporary anchorage device:جهاز ارتكاز تقويمي مؤقت (زرعة مصغرة TAD)|retainer:مثبت تقويمي بعد انتهاء العلاج|hawley retainer:مثبت هاولي السلكي الأكريليكي|fixed lingual retainer:سلك تثبيت لساني ملصق دائم|clear aligner:قوالب تقويمية شفافة متحركة (إنفزلاين)|cephalometric analysis:تحليل قياسات الرأس الشعاعي (سيفالومتريك)|orthognathic surgery:جراحة الفك التقويمية لتصحيح الهيكل|pedodontics:طب أسنان الأطفال|primary teeth:الأسنان اللبنية المؤقتة (20 سناً)|deciduous teeth:الأسنان الساقطة اللبنية|mixed dentition:مرحلة الإسنان المختلط (وجود أسنان لبنية ودائمة معاً)|permanent dentition:مرحلة الإسنان الدائم (32 سناً)|eruption:بزوغ الأسنان وظهورها في الفم|exfoliation:سقوط الأسنان اللبنية الطبيعي|early childhood caries:نخر الطفولة المبكرة (نخر زجاجة الرضاعة)|baby bottle tooth decay:نخر رضاعة الحليب السكري|nursing caries:نخر الرضاعة|fluoride:الفلورايد المقوي لمينا الأسنان|fluoride varnish:ورنيش الفلورايد الموضعي المركز|systemic fluoride:فلورايد جهازي عبر ماء الشرب|pit and fissure sealant:مادة سادّة للوهاد والميازيب لحماية الأسنان|space maintainer:حافظ مسافة للأسنان اللبنية المقلوعة مبكراً|band and loop:حافظ مسافة طوق وعروة|distal shoe:حافظ مسافة نعل قاصٍ داخل اللثة|stainless steel crown:تاج الفولاذ غير القابل للصدأ للأسنان اللبنية (SSC)|strip crown:تاج راتنجي شفاف للقواطع اللبنية|pulpotomy in primary teeth:بتر اللب للأسنان اللبنية بـ Formocresol أو Biodentine|habits:عادات فموية ضارة عند الأطفال|thumb sucking:عادة مص الإبهام المسببة لتشوه الإطباق|tongue thrusting:عادة دفع اللسان للأمام أثناء البلع|mouth breathing:التنفس الفموي المزمن`.split('|').map((x) => x.split(':'));

// ك. تشريح الأسنان الفردية وترقيم FDI (Dental Anatomy & Tooth Naming)
function buildTeethNames() {
  const list = [];
  const add = (en, ar) => list.push([en, ar]);

  const toothTypes = [
    { en: 'central incisor', ar: 'الثنية المركزية', num: 1 },
    { en: 'lateral incisor', ar: 'الرباعية (الثنية الجانبية)', num: 2 },
    { en: 'canine', ar: 'الناب', num: 3 },
    { en: 'first premolar', ar: 'الضاحك الأول', num: 4 },
    { en: 'second premolar', ar: 'الضاحك الثاني', num: 5 },
    { en: 'first molar', ar: 'الرحى الأولى (طاحونة 6 سنوات)', num: 6 },
    { en: 'second molar', ar: 'الرحى الثانية (طاحونة 12 سنة)', num: 7 },
    { en: 'third molar', ar: 'الرحى الثالثة (ضرس العقل)', num: 8 },
  ];

  const quadrants = [
    { en: 'maxillary right', ar: 'العلوية اليمنى', q: 1 },
    { en: 'maxillary left', ar: 'العلوية اليسرى', q: 2 },
    { en: 'mandibular left', ar: 'السفلية اليسرى', q: 3 },
    { en: 'mandibular right', ar: 'السفلية اليمنى', q: 4 },
  ];

  for (const q of quadrants) {
    for (const t of toothTypes) {
      add(`${q.en} ${t.en}`, `${t.ar} ${q.ar}`);
      add(`FDI ${q.q}${t.num}`, `${t.ar} ${q.ar} (السن رقم ${q.q}${t.num})`);
      add(`tooth #${q.q}${t.num}`, `${t.ar} ${q.ar}`);
    }
  }

  // الأسنان اللبنية
  const primaryTypes = [
    { en: 'primary central incisor', ar: 'الثنية اللبنية', num: 1 },
    { en: 'primary lateral incisor', ar: 'الرباعية اللبنية', num: 2 },
    { en: 'primary canine', ar: 'الناب اللبني', num: 3 },
    { en: 'primary first molar', ar: 'الرحى اللبنية الأولى', num: 4 },
    { en: 'primary second molar', ar: 'الرحى اللبنية الثانية', num: 5 },
  ];

  const primaryQuads = [
    { en: 'primary maxillary right', ar: 'العلوية اليمنى', q: 5 },
    { en: 'primary maxillary left', ar: 'العلوية اليسرى', q: 6 },
    { en: 'primary mandibular left', ar: 'السفلية اليسرى', q: 7 },
    { en: 'primary mandibular right', ar: 'السفلية اليمنى', q: 8 },
  ];

  for (const q of primaryQuads) {
    for (const t of primaryTypes) {
      add(`${q.en} ${t.en}`, `${t.ar} ${q.ar}`);
      add(`FDI ${q.q}${t.num}`, `${t.ar} ${q.ar} (السن اللبني رقم ${q.q}${t.num})`);
    }
  }

  // أسطح وتضاريس الأسنان التشريحية
  const surfaces = [
    ['mesial', 'إنسي (السطح القريب من خط المنتصف)'],
    ['distal', 'وحشي (السطح البعيد عن خط المنتصف)'],
    ['buccal', 'شدقي (السطح المواجه للخد)'],
    ['labial', 'شفوي (السطح المواجه للشفة في الأسنان الأمامية)'],
    ['facial', 'وجهي (يشمل الشفوي والشدقي)'],
    ['lingual', 'لساني (السطح الداخلي المواجه للسان)'],
    ['palatal', 'حنكي (السطح الداخلي المواجه لقبة الحنك العلوي)'],
    ['occlusal', 'إطباقي (سطح المضغ في الأسنان الخلفية)'],
    ['incisal', 'قاطع (الحافة القاطعة في الأسنان الأمامية)'],
    ['incisal edge', 'الحافة القاطعة'],
    ['gingival', 'لثوي (باتجاه اللثة)'],
    ['cervical', 'عنقي (عند عنق السن)'],
    ['apical', 'ذروي (باتجاه ذروة الجذر)'],
    ['coronal', 'تاجي (باتجاه تاج السن)'],
    ['cusp', 'حدبة سنية بارزة على السطح الإطباقي'],
    ['cusp of carabelli', 'حدبة كارابيلي الإضافية (في الرحى العلوية الأولى)'],
    ['ridge', 'حرف سني بارز'],
    ['marginal ridge', 'الحرف الحفافي الجانبي للسن'],
    ['triangular ridge', 'الحرف المثلثي الهابط من قمة الحدبة'],
    ['oblique ridge', 'الحرف المائل المميز للرحى العلوية'],
    ['transverse ridge', 'الحرف المستعرض العابر للسطح الإطباقي'],
    ['groove', 'ميزاب سني غائر'],
    ['developmental groove', 'ميزاب نمائي تطوري'],
    ['supplemental groove', 'ميزاب ثانوي تفرعي'],
    ['pit', 'وهدة سنية نقطية عميقة'],
    ['fossa', 'حفرة تشريحية مقعرة على سطح السن'],
    ['cingulum', 'الحدبة الحنكية اللسانية في الأسنان الأمامية (سينغولوم)'],
    ['mamelon', 'تفصص مينائي على الحافة القاطعة للأسنان البازغة حديثاً (ماميلون)'],
    ['root canal', 'قناة الجذر العصبية الوعائية'],
    ['pulp horn', 'قرن لبي ممتد تحت كل حدبة سنية'],
    ['root bifurcation', 'مفرق جذري ثنائي في الرحى السفلية'],
    ['root trifurcation', 'مفرق جذري ثلاثي في الرحى العلوية'],
  ];

  surfaces.forEach(([e, a]) => add(e, a));
  return list;
}

// دمج كافة الأقسام في قاموس موحد
const ALL_RAW_ENTRIES = [
  ...GENERAL_MED,
  ...DENTAL_MATERIALS,
  ...ORAL_HISTOLOGY,
  ...ANATOMY,
  ...PROSTHODONTICS,
  ...OPERATIVE,
  ...ENDODONTICS,
  ...PERIODONTICS,
  ...ORAL_SURGERY,
  ...ORTHO_PEDO,
  ...buildTeethNames(),
].filter((x) => x && x[0] && x[1]);

export const DENTAL_DICTIONARY = new Map(
  ALL_RAW_ENTRIES.map(([e, a]) => [e.trim().toLowerCase(), a.trim()])
);

// استرجاع وإضافة المصطلحات المخصصة للمستخدم
const USER_TERMS_KEY = 'lablabi_custom_lexicon';

export function getUserCustomTerms() {
  try {
    return localStorage.getItem(USER_TERMS_KEY) || '';
  } catch {
    return '';
  }
}

export function saveUserCustomTerm(en, ar) {
  const cleanEn = en.trim().toLowerCase();
  const cleanAr = ar.trim();
  if (!cleanEn || !cleanAr) return false;
  DENTAL_DICTIONARY.set(cleanEn, cleanAr);
  let cur = getUserCustomTerms();
  cur += (cur && !cur.endsWith('\n') ? '\n' : '') + `${cleanEn}:${cleanAr}\n`;
  try {
    localStorage.setItem(USER_TERMS_KEY, cur);
  } catch {}
  return true;
}

// تحميل مصطلحات المستخدم تلقائياً
try {
  getUserCustomTerms()
    .split('\n')
    .forEach((l) => {
      const idx = l.indexOf(':');
      if (idx > 0) {
        DENTAL_DICTIONARY.set(l.slice(0, idx).trim().toLowerCase(), l.slice(idx + 1).trim());
      }
    });
} catch {}

export function getDentalDictionary() {
  return DENTAL_DICTIONARY;
}

export function getTermMeaning(term) {
  if (!term) return null;
  const clean = term.toLowerCase().trim();
  if (DENTAL_DICTIONARY.has(clean)) return DENTAL_DICTIONARY.get(clean);

  // إزالة لواحق الجمع والتصريف
  const roots = [
    clean.replace(/(s|es)$/i, ''),
    clean.replace(/ing$/i, ''),
    clean.replace(/ed$/i, ''),
    clean.replace(/ies$/i, 'y'),
  ];
  for (const r of roots) {
    if (DENTAL_DICTIONARY.has(r)) return DENTAL_DICTIONARY.get(r);
  }

  return analyzeMedicalTerm(clean);
}

// ============================================================================
// 2. المحلل المورفولوجي للمصطلحات اللاتينية والطبية (Morphological Analyzer)
// ============================================================================
const PRE = {
  hyper: 'فرط / زيادة', hypo: 'نقص / انخفاض', tachy: 'تسرّع', brady: 'بطء',
  poly: 'تعدد / كثرة', anti: 'مضاد', intra: 'داخل', extra: 'خارج',
  peri: 'حول / محيط بـ', endo: 'باطن / داخل', epi: 'فوق / على سطح',
  sub: 'تحت', supra: 'فوق', inter: 'بين', trans: 'عبر / خلال',
  dys: 'عسر / اضطراب', hemi: 'نصف', pan: 'شامل / عام', neo: 'جديد / حديث',
  macro: 'كبير الحجم', micro: 'دقيق / مجهري', para: 'بجانب / مجاور',
  pre: 'قبل / أمامي', post: 'بعد / خلفي', infra: 'أسفل / تحت', retro: 'خلف',
};

const ROOT = {
  cardi: 'القلب', hepat: 'الكبد', nephr: 'الكلية', ren: 'الكلية', pulmon: 'الرئة',
  gastr: 'المعدة', derm: 'الجلد', neur: 'العصب', oste: 'العظم', arthr: 'المفصل',
  myo: 'العضلة', hem: 'الدم', cyt: 'الخلية', onc: 'الورم', gingiv: 'اللثة',
  dent: 'السن', odont: 'السن', stomat: 'الفم', gloss: 'اللسان', cephal: 'الرأس',
  cerebr: 'الدماغ', encephal: 'المخ', vascul: 'الوعاء الدموي', angi: 'الوعاء الدموي',
  ophthalm: 'العين', rhin: 'الأنف', laryng: 'الحنجرة', bronch: 'القصبات',
  splen: 'الطحال', pancreat: 'البنكرياس', lymph: 'اللمف', immun: 'المناعة',
  bacteri: 'الجراثيم', mand: 'الفك السفلي', maxill: 'الفك العلوي', pulp: 'اللب السني',
  cement: 'الملاط الجذري', alveol: 'السنخ السني', sial: 'اللعاب / الغدة اللعابية',
  chondr: 'الغضروف', glyc: 'السكر', lip: 'الدهن', tox: 'السم',
};

const SUF = {
  itis: 'التهاب', osis: 'حالة مرضية / تنكسية', pathy: 'اعتلال / مرض',
  ectomy: 'استئصال جراحي', otomy: 'شق جراحي', ostomy: 'فغر / فتح ممر جراحي',
  plasty: 'ترميم / رأب تجميلي', scopy: 'تنظير وفحص داخلي', graphy: 'تصوير شعاعي أو تخطيطي',
  gram: 'صورة / مخطط بياني', algia: 'ألم سريري', oma: 'كتلة / ورم',
  penia: 'نقص في عدد', megaly: 'تضخّم في حجم', rrhage: 'نزف دموي حاد',
  plegia: 'شلل عضلي', lysis: 'انحلال / تفكك', logy: 'علم ودراسة',
  malacia: 'تلين غير طبيعي', cele: 'فتق / انتفاخ', emia: 'في مجرى الدم',
  trophy: 'تغذية / نمو نسجي', genesis: 'تكوّن / نشوء أولي',
};

const bestKey = (o, f) => Object.keys(o).filter(f).sort((a, b) => b.length - a.length)[0];

export function analyzeMedicalTerm(word) {
  let r = word.toLowerCase().replace(/[^a-z]/g, '');
  if (r.length < 5) return null;
  const pk = bestKey(PRE, (k) => r.startsWith(k) && r.length > k.length + 3);
  if (pk) r = r.slice(pk.length);
  const sk = bestKey(SUF, (k) => r.endsWith(k) && r.length > k.length + 1);
  if (sk) r = r.slice(0, -sk.length);
  const rk = bestKey(ROOT, (k) => r.startsWith(k));
  if (!rk || !(pk || sk)) return null;
  return [sk && SUF[sk], pk && PRE[pk], ROOT[rk]].filter(Boolean).join(' ');
}

// ============================================================================
// 3. المدقق السريري ومصحح المصطلحات السنية (Clinical Dental Polisher)
// ============================================================================
export function refineDentalTerms(enText, arText) {
  let polished = arText;
  const low = (enText || '').toLowerCase();

  const rules = [
    [/المينا هي طلاء|المينا هي دهان|طلاء الأسنان/gi, 'المينا السنية'],
    [/بانيات الميناء|خلايا الميناء/gi, 'أرومة المينا (Ameloblasts)'],
    [/أرومات الميناء/gi, 'أرومة المينا (Ameloblasts)'],
    [/بانيات العاج/gi, 'أرومة العاج (Odontoblasts)'],
    [/بانيات الملاط/gi, 'أرومة الملاط (Cementoblasts)'],
    [/لب الورق|عجينة الورق/gi, 'اللب السني'],
    [/خطوط ريتزيوس/gi, 'خطوط ريتزيوس النمائية (Striae of Retzius)'],
    [/حزم هنتر شريغر|حزم هانتر شريجر/gi, 'حزم هنتر-شريغر (Hunter-Schreger bands)'],
    [/تقاطع المينا والملاط|ملتقى المينا والملاط/gi, 'الملتقى المينائي الملاطي (CEJ)'],
    [/هيدروكسيباتيت|هيدروكسي أباتيت/gi, 'هيدروكسي أباتيت (Hydroxyapatite)'],
    [/الأنابيب العاجية/gi, 'القنيات العاجية (Dentinal Tubules)'],
    [/طاقم العمل|فريق العمل/gi, 'القالب التشغيلي (Working Cast)'],
    [/حجر يموت|داي ستون/gi, 'حجر القالب الدقيق (Die Stone)'],
    [/الجينات/gi, 'ألجينات (Alginate)'],
    [/طينة خضراء|عصا خضراء/gi, 'مركب الطبعة الأخضر (Green Stick Compound)'],
    [/تشكيل الحدود|صب الحدود/gi, 'تشكيل وتسجيل الحواف (Border Molding)'],
    [/صينية مخصصة|صينية خاصة/gi, 'طابع إفرادي خاص (Custom Tray)'],
    [/صينية الأسهم|صينية المخزون/gi, 'طابع جاهز (Stock Tray)'],
    [/علاقة مركزية/gi, 'العلاقة المركزية (Centric Relation)'],
    [/انسداد مركزي/gi, 'الإطباق المركزي (Centric Occlusion)'],
    [/البعد الرأسي للانسداد/gi, 'البعد العمودي الإطباقي (VDO)'],
    [/البعد الرأسي للراحة/gi, 'البعد العمودي في وضع الراحة (VDR)'],
    [/جص باريس/gi, 'جص باريس الطبي (Plaster of Paris)'],
    [/الراتنج المركب/gi, 'الراتنج المركب (الكومبوزيت)'],
    [/تخريش حمض|حفر الحمض/gi, 'التخريش الحمضي (Acid Etching)'],
    [/معالجة خفيفة|علاج خفيف/gi, 'التصليب الضوئي (Light Curing)'],
    [/تسرب صغير|تسرب دقيق/gi, 'التسرب المجهري الدقيق (Microleakage)'],
    [/اسمنت أكسيد الزنك/gi, 'أسمنت أكسيد الزنك والأوجينول (ZOE)'],
    [/إسمنت زجاجي/gi, 'الأسمنت الزجاجي الشاردي (GIC)'],
    [/استئصال العصب|علاج قناة الجذر/gi, 'المعالجة اللبية للقناة الجذرية (Root Canal Treatment)'],
    [/حفرة الفم|حفرة السن/gi, 'الحفرة النخرية (Cavity)'],
    [/ثقب قمي/gi, 'الثقبة الذروية (Apical Foramen)'],
  ];

  for (const [pattern, replacement] of rules) {
    polished = polished.replace(pattern, replacement);
  }

  // فحص المصطلحات المباشرة من القاموس السني
  for (const [enKey, arVal] of DENTAL_DICTIONARY.entries()) {
    if (enKey.length >= 4 && low === enKey) {
      return arVal;
    }
  }

  return polished;
}

// ============================================================================
// 4. محرك الترجمة متعدد الطبقات (Gemini AI + Neural Web API + Cache)
// ============================================================================
const translationCache = new Map();

/**
 * فحص ما إذا كان النص مكتوباً باللغة العربية أصلاً
 */
export function isArabicText(text) {
  if (!text) return false;
  const arabicRegex = /[\u0600-\u06FF]/;
  const arabicMatches = (text.match(/[\u0600-\u06FF]/g) || []).length;
  const latinMatches = (text.match(/[a-zA-Z]/g) || []).length;
  return arabicMatches > latinMatches;
}

/**
 * ترجمة النص باحترافية وسرعة فائقة مع حماية Timeout صارمة (2.5 ثانية كحد أقصى)
 */
export async function translateText(text, engine = 'auto') {
  if (!text || !text.trim()) return '';
  const q = text.trim();

  // إذا كان النص بالعربية أصلاً، لا داعي لترجمته بل نعيده مصقولاً
  if (isArabicText(q)) {
    return q;
  }

  if (translationCache.has(q)) {
    return translationCache.get(q);
  }

  // 1. إذا كان مصطلحاً فردياً موجوداً في القاموس، نعيده فوراً وبدقة مطلقة (0ms)
  const exact = DENTAL_DICTIONARY.get(q.toLowerCase());
  if (exact) {
    translationCache.set(q, exact);
    return exact;
  }

  // 2. إذا توفر مفتاح Gemini AI واستُدعي المحرك
  if (hasGeminiKey() && (engine === 'gemini' || engine === 'auto')) {
    try {
      const geminiRes = await translateWithGemini(q);
      if (geminiRes && geminiRes !== q) {
        translationCache.set(q, geminiRes);
        return geminiRes;
      }
    } catch {}
  }

  // 3. المحرك السريع عالي الدقة (Google Neural Translate مع مهلة 2.5 ثانية فقط)
  let result = '';
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(q)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json && json[0]) {
        for (const part of json[0]) {
          if (part && part[0]) result += part[0];
        }
      }
    }
  } catch {}

  // 4. بديل احتياطي (MyMemory مع مهلة 2 ثانية)
  if (!result || result.trim() === q) {
    try {
      const url2 = `https://api.mymemory.translated.net/get?langpair=en|ar&q=${encodeURIComponent(q)}`;
      const controller2 = new AbortController();
      const timer2 = setTimeout(() => controller2.abort(), 2000);

      const res2 = await fetch(url2, { signal: controller2.signal });
      clearTimeout(timer2);

      if (res2.ok) {
        const json2 = await res2.json();
        const cand = json2?.responseData?.translatedText;
        if (cand && !cand.includes('MYMEMORY WARNING')) {
          result = cand;
        }
      }
    } catch {}
  }

  // 5. إذا تعذرت كافة الوسائل أو لم يُترجم، نفحص مصطلحات القاموس جزئياً
  if (!result) result = q;

  // صقل المصطلحات السريرية الطبية
  result = refineDentalTerms(q, result);
  translationCache.set(q, result);
  return result;
}

/**
 * ترجمة مصفوفة أسطر الشريحة دفعة واحدة بطلب شبكة واحد فقط (فائقة السرعة ومستحيل تعلق)
 */
export async function translateSlideLines(lines) {
  if (!lines || !lines.length) return [];
  const results = new Array(lines.length).fill('');
  const toTranslate = [];

  // فحص الكاش والقاموس الفوري أولاً
  for (let i = 0; i < lines.length; i++) {
    const l = lines[i].trim();
    if (!l) {
      results[i] = '';
      continue;
    }
    if (isArabicText(l)) {
      results[i] = l;
      continue;
    }
    if (translationCache.has(l)) {
      results[i] = translationCache.get(l);
      continue;
    }
    const exact = DENTAL_DICTIONARY.get(l.toLowerCase());
    if (exact) {
      translationCache.set(l, exact);
      results[i] = exact;
      continue;
    }
    toTranslate.push({ idx: i, text: l });
  }

  if (!toTranslate.length) return results;

  if (hasGeminiKey()) {
    try {
      const translatedLines = await translateLinesWithGemini(toTranslate.map((item) => item.text));
      for (let i = 0; i < toTranslate.length; i++) {
        const item = toTranslate[i];
        const translated = refineDentalTerms(item.text, translatedLines[i]);
        translationCache.set(item.text, translated);
        results[item.idx] = translated;
      }
      return results;
    } catch (err) {
      console.warn('[translation] Gemini unavailable; using the standard translator.', err);
    }
  }

  // تجميع الأسطر المفردة بفاصل \n وترجمتها في طلب واحد
  const combinedText = toTranslate.map((t) => t.text).join('\n');
  let translatedBlock = '';

  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=ar&dt=t&q=${encodeURIComponent(combinedText)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);

    if (res.ok) {
      const json = await res.json();
      if (json && json[0]) {
        for (const part of json[0]) {
          if (part && part[0]) translatedBlock += part[0];
        }
      }
    }
  } catch {}

  // إذا نجحت الترجمة المجمعة
  if (translatedBlock) {
    const translatedLines = translatedBlock.split('\n');
    for (let k = 0; k < toTranslate.length; k++) {
      const orig = toTranslate[k];
      let arLine = translatedLines[k] || '';
      if (!arLine || arLine.trim() === orig.text) {
        arLine = refineDentalTerms(orig.text, orig.text);
      } else {
        arLine = refineDentalTerms(orig.text, arLine.trim());
      }
      translationCache.set(orig.text, arLine);
      results[orig.idx] = arLine;
    }
  } else {
    // Fallback سريع مع مصحح المصطلحات السريرية
    for (const item of toTranslate) {
      const fallback = refineDentalTerms(item.text, item.text);
      results[item.idx] = fallback;
    }
  }

  return results;
}

/**
 * ترجمة دفعة من الأسطر أو الفقرات لتفادي الـ Rate Limit
 */
export async function batchTranslate(items, onProgress = () => {}) {
  const results = [];
  const total = items.length;

  for (let i = 0; i < total; i++) {
    const item = items[i];
    try {
      const ar = await translateText(item);
      results.push(ar);
    } catch {
      results.push(item);
    }
    if (i % 5 === 0 || i === total - 1) {
      onProgress(Math.round(((i + 1) / total) * 100));
    }
    // تأخير مجهري 30ms لمنع التقييد
    if (i % 10 === 0) {
      await new Promise((r) => setTimeout(r, 30));
    }
  }

  return results;
}

// ============================================================================
// 5. الملخص الذكي المركز (المطلوب بدقة: عن ماذا تتحدث المحاضرة + ماذا ستستفيد)
// ============================================================================
export async function generateClinicalSummary(fullText, title = '') {
  if (!fullText || !fullText.trim()) {
    return {
      overview: 'محاضرة طب أسنان سريرية تتناول المفاهيم التشخيصية والإجرائية التخصصية.',
      benefits: ['التعرف على المبادئ السريرية', 'تطبيق الإجراءات العلاجية بدقة', 'تفادي الأخطاء الشائعة'],
    };
  }

  // 1. إذا كان مفتاح Gemini متوفراً، نستخدم Gemini الذكي
  if (hasGeminiKey()) {
    try {
      const geminiSummary = await generateSmartSummaryWithGemini(fullText);
      if (geminiSummary && geminiSummary.overview && Array.isArray(geminiSummary.benefits)) {
        return geminiSummary;
      }
    } catch {}
  }

  // 2. المحرك المحلي الذكي للملخص المركز (نبذة + فائدة عملية فقط)
  const isAr = isArabicText(fullText);
  const sentences = fullText
    .replace(/([.!?\n])\s+/g, '$1|')
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 25 && s.length < 280);

  // استخراج النبذة العامة (Overview: 2 إلى 3 جمل معبرة عن البداية والموضوع)
  let overviewEn = sentences.slice(0, 2).join(' ');
  if (!overviewEn && title) overviewEn = `This lecture covers fundamental concepts and clinical techniques regarding ${title}.`;
  
  let overviewAr = '';
  if (isAr) {
    overviewAr = overviewEn;
  } else {
    overviewAr = await translateText(overviewEn);
    overviewAr = refineDentalTerms(overviewEn, overviewAr);
  }

  // استخراج الفوائد السريرية والعملية (Benefits: 3 إلى 4 نقاط جوهرية)
  const candidateBenefits = sentences.slice(2, 10).filter((s) => {
    return (
      /indication|treatment|procedure|technique|method|objective|purpose|step|clinical|advantage|role|prevent/i.test(s) ||
      /علاج|إجراء|طريقة|هدف|أهمية|خطوات|فائدة|سرير/i.test(s)
    );
  });

  const selectedBenefits = (candidateBenefits.length >= 3 ? candidateBenefits : sentences.slice(2, 6)).slice(0, 4);

  let benefitsAr = [];
  if (isAr) {
    benefitsAr = selectedBenefits;
  } else {
    benefitsAr = await translateSlideLines(selectedBenefits);
  }

  if (!benefitsAr.length) {
    benefitsAr = [
      'فهم الخطوات التشخيصية السريرية والمعايير المعتمدة.',
      'التعرف على المواد والأدوات السنية المناسبة لكل حالة.',
      'تطبيق المهارات العملية وتجنب المضاعفات المحتملة.',
    ];
  }

  return {
    overview: overviewAr || 'تتناول هذه المحاضرة المفاهيم والخطوات السريرية التخصصية لدراسة الحالة وتطبيق المعايير الطبية السليمة.',
    benefits: benefitsAr,
  };
}

// ============================================================================
// 6. استخراج مصطلحات المحاضرة (Glossary Extractor)
// ============================================================================
export function extractLectureGlossary(text) {
  if (!text) return [];
  const lower = text.toLowerCase();
  const found = [];

  for (const [en, ar] of DENTAL_DICTIONARY.entries()) {
    if (en.length >= 3 && lower.includes(en)) {
      found.push({ en, ar });
    }
  }

  // إزالة التكرار والترتيب
  const map = new Map();
  found.forEach((item) => {
    if (!map.has(item.en)) map.set(item.en, item);
  });

  return [...map.values()].sort((a, b) => b.en.length - a.en.length);
}

// ============================================================================
// 7. نطق الكلمات والمصطلحات (Text to Speech)
// ============================================================================
export function speakText(text, lang = 'en-US') {
  if (typeof window === 'undefined' || !window.speechSynthesis) return;
  try {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 0.9;
    window.speechSynthesis.speak(utterance);
  } catch {}
}
