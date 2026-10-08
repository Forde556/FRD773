/**
 * processingEngine.js — محرك المعالجة الطبية والسريرية المتقدم لمنصة لبلبي
 * تم التحديث الكامل لمنع ترحيل السلايدات (ربط 1:1 حتمي بين الصفحة والنص والصورة)،
 * استخراج صور ورسومات السلايدات بدقة عالية، وتوليد بنك أسئلة سريري وبطاقات استرجاع ثرية.
 */

import {
  translateText,
  translateSlideLines,
  isArabicText,
  generateClinicalSummary,
  extractLectureGlossary,
  getDentalDictionary,
  DENTAL_DICTIONARY,
  refineDentalTerms,
} from './translationService';
import { hasGeminiKey, generateExamWithGemini } from './geminiService';
import { cryptoShuffle, secureRandomInt } from '../utils/cryptoShuffle';

export const NODE_TYPES = {
  definition: { key: 'definition', label: 'Definition', ar: 'تعريف علمي', color: '#10B981' },
  criterion: { key: 'criterion', label: 'Criterion', ar: 'معيار تشخيصي', color: '#38BDF8' },
  procedure: { key: 'procedure', label: 'Procedure', ar: 'إجراء سريري', color: '#818CF8' },
  measurement: { key: 'measurement', label: 'Measurement', ar: 'قياس ورقم سريري', color: '#F59E0B' },
  contraindication: { key: 'contraindication', label: 'Contraindication', ar: 'مضاد استطباب وتحذير', color: '#EF4444' },
  concept: { key: 'concept', label: 'Concept', ar: 'مفهوم رئيسي', color: '#A855F7' },
};

export const PIPELINE_STAGES = [
  { key: 'intake', ar: 'قراءة الملف وتصيير الشرائح والصور بدقة' },
  { key: 'translate', ar: 'الترجمة الطبية (سطر بسطر وفقرة كاملة)' },
  { key: 'summary', ar: 'توليد الملخص الذكي المركز' },
  { key: 'quiz', ar: 'بناء الاختبار المنهجي وألعاب التثبيت' },
];

export function translateSelection(text, lecture) {
  const clean = (text || '').replace(/\s+/g, ' ').trim();
  if (!clean) return null;
  const dict = getDentalDictionary();
  const exact = dict.get(clean.toLowerCase());
  const lectureTerm = lecture?.glossary?.find((t) => t.en.toLowerCase() === clean.toLowerCase());

  if (exact) {
    return {
      query: clean,
      exact: true,
      items: [{ en: clean, ar: exact, cat: 'dental' }],
      definition: null,
    };
  }

  const items = [];
  const low = clean.toLowerCase();
  for (const [en, ar] of dict.entries()) {
    if (low.includes(en) || en.includes(low)) {
      items.push({ en, ar, cat: 'dental' });
      if (items.length >= 6) break;
    }
  }

  return {
    query: clean,
    exact: false,
    items,
    definition: lectureTerm?.definition || null,
  };
}

/* ========================================================================== *
 * 1. استخراج وتصيير ملفات المحاضرات (PDF / PPTX / TXT) بربط 1:1 تام
 * ========================================================================== */
export async function extractLectureFromFile(file, onProgress = () => {}) {
  const name = file.name || 'lecture';

  // أ. معالجة ملفات PDF بدقة 1:1 مع تصيير الصور والنصوص
  if (/\.pdf$/i.test(name) || file.type === 'application/pdf') {
    onProgress('جارٍ فتح ملف PDF واستخراج الشرائح والرسومات...', 15);
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

    const data = new Uint8Array(await file.arrayBuffer());
    const doc = await pdfjs.getDocument({ data }).promise;
    const numPages = doc.numPages;

    const pages = [];
    const pageImages = [];

    for (let p = 1; p <= numPages; p++) {
      onProgress(`معالجة وتصيير الشريحة ${p} من ${numPages}...`, Math.round((p / numPages) * 75) + 15);
      const page = await doc.getPage(p);

      // 1. تصيير صورة الشريحة بدقة ممتازة لضمان ظهور كافة الصور والرسومات
      let imgData = null;
      try {
        const vp = page.getViewport({ scale: 1.25 });
        const canvas = document.createElement('canvas');
        canvas.width = vp.width;
        canvas.height = vp.height;
        const ctx = canvas.getContext('2d');
        await page.render({ canvasContext: ctx, viewport: vp }).promise;
        imgData = canvas.toDataURL('image/jpeg', 0.85);
      } catch (err) {
        imgData = null;
      }
      pageImages.push(imgData);

      // 2. استخراج النص المرتب هندسياً من نفس الصفحة
      const textContent = await page.getTextContent();
      const pageLines = [];
      let lastY = null;
      let curLine = '';

      for (const item of textContent.items) {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          if (curLine.trim()) pageLines.push(curLine.trim());
          curLine = '';
        }
        curLine += (curLine ? ' ' : '') + item.str;
        if (item.hasEOL) {
          if (curLine.trim()) pageLines.push(curLine.trim());
          curLine = '';
          lastY = null;
          continue;
        }
        lastY = y;
      }
      if (curLine.trim()) pageLines.push(curLine.trim());

      pages.push(pageLines.join('\n'));
    }

    return {
      text: pages.join('\n\n--- SLIDE BREAK ---\n\n'),
      pageImages,
      rawPages: pages,
    };
  }

  // ب. معالجة ملفات البوربوينت PPTX
  if (/\.pptx$/i.test(name)) {
    onProgress('جارٍ قراءة واستخراج شرائح البوربوينت...', 30);
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    const zipDoc = await zip.loadAsync(file);

    const slideFiles = [];
    zipDoc.forEach((path) => {
      if (/^ppt\/slides\/slide\d+\.xml$/i.test(path)) {
        slideFiles.push(path);
      }
    });

    slideFiles.sort((a, b) => {
      const numA = parseInt(a.match(/slide(\d+)\.xml/i)[1], 10);
      const numB = parseInt(b.match(/slide(\d+)\.xml/i)[1], 10);
      return numA - numB;
    });

    const parser = new DOMParser();
    const pages = [];

    for (let i = 0; i < slideFiles.length; i++) {
      onProgress(`استخراج نص شريحة البوربوينت ${i + 1} من ${slideFiles.length}...`, Math.round(((i + 1) / slideFiles.length) * 85));
      const xmlText = await zipDoc.file(slideFiles[i]).async('text');
      const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      const paragraphs = xmlDoc.getElementsByTagName('a:p');
      const lines = [];

      for (let p = 0; p < paragraphs.length; p++) {
        const textRuns = paragraphs[p].getElementsByTagName('a:t');
        let pText = '';
        for (let t = 0; t < textRuns.length; t++) {
          pText += textRuns[t].textContent;
        }
        pText = pText.trim();
        if (pText && pText.length > 1) {
          lines.push(pText);
        }
      }
      pages.push(lines.join('\n'));
    }

    return {
      text: pages.join('\n\n--- SLIDE BREAK ---\n\n'),
      pageImages: [],
      rawPages: pages,
    };
  }

  // ج. ملفات النصوص العادية (TXT / MD)
  if (/\.(txt|md|markdown)$/i.test(name) || file.type.startsWith('text/')) {
    const raw = await file.text();
    return {
      text: raw,
      pageImages: [],
      rawPages: raw.split(/\n\s*---\s*\n/).filter(Boolean),
    };
  }

  throw new Error('صيغة الملف غير مدعومة. يرجى رفع ملف PDF أو بوربوينت PPTX أو ملف نصي TXT.');
}

export async function extractTextFromFile(file) {
  const res = await extractLectureFromFile(file);
  return res.text;
}

/* ========================================================================== *
 * 2. المحرك المركزي لمعالجة وترجمة المحاضرة (ربط 1:1 حتمي)
 * ========================================================================== */
export async function processLecture(text, opts = {}) {
  const title = opts.title || 'محاضرة طب أسنان';
  const sourceName = opts.sourceName || 'ملف المحاضرة';
  const onStage = opts.onStage || (() => {});
  const pageImages = opts.pageImages || [];
  const rawPages = opts.rawPages || (text.includes('--- SLIDE BREAK ---') ? text.split(/\n*--- SLIDE BREAK ---\n*/).filter(Boolean) : null);

  onStage(0, { name: 'فحص البنية اللغوية وتفكيك المحاضرة' });

  // 1. تقسيم المحاضرة إلى شرائح تطابق تماماً صفحات الملف الأصلية
  let slideTexts = [];
  if (rawPages && rawPages.length > 0) {
    slideTexts = rawPages;
  } else {
    // إذا كان نصاً واحداً طويلاً بدون فواصل، نقسمه حسب العناوين أو الفقرات الكبيرة
    const lines = text.split(/\n+/).map((l) => l.trim()).filter(Boolean);
    const groups = [];
    let cur = [];
    for (const l of lines) {
      if (cur.length >= 7 || (cur.length >= 3 && /^(#|lecture|chapter|slide|مقدمة|أولاً|ثانياً)/i.test(l))) {
        groups.push(cur.join('\n'));
        cur = [];
      }
      cur.push(l);
    }
    if (cur.length) groups.push(cur.join('\n'));
    slideTexts = groups.length ? groups : [text];
  }

  onStage(1, { name: 'ترجمة الشرائح (نظام سطر بسطر والفقرة الكاملة)' });

  // 2. معالجة وترجمة كل شريحة 1:1 مع صورتها
  const slides = [];
  const allNodes = [];
  const totalSlides = slideTexts.length;

  for (let sIdx = 0; sIdx < totalSlides; sIdx++) {
    const slideNumber = sIdx + 1;
    const sText = slideTexts[sIdx] || '';
    const img = pageImages[sIdx] || null;

    // استخراج أسطر الشريحة وتنظيفها
    const rawLines = sText
      .split(/\n+/)
      .map((l) => l.trim())
      .filter((l) => l.length > 0);
    const slideTitle = rawLines[0] || `شريحة ${slideNumber}`;

    onStage(1, {
      idx: 1,
      customMsg: `جارٍ ترجمة الشريحة ${slideNumber} من ${totalSlides}...`,
      pct: Math.round(((sIdx + 1) / totalSlides) * 100),
    });

    // استخراج أسطر الشريحة وتنظيفها
    const blockLines = rawLines.slice(0, 30);
    const cleanedItems = [];

    for (let bIdx = 0; bIdx < blockLines.length; bIdx++) {
      const line = blockLines[bIdx];
      const isBullet = /^([•\-*➢▪]|\d+[.)])\s*/.test(line);
      const cleanLine = line.replace(/^([•\-*➢▪]|\d+[.)])\s*/, '').trim();
      if (!cleanLine) continue;
      const isHeading = cleanLine.length < 65 && !/[.:;,]$/.test(cleanLine) && cleanLine.split(' ').length <= 8;
      cleanedItems.push({ cleanLine, isBullet, isHeading });
    }

    // 1. ترجمة جميع أسطر الشريحة دفعة واحدة وفورياً بطلب واحد فقط!
    const lineTexts = cleanedItems.map((c) => c.cleanLine);
    const translatedLines = await translateSlideLines(lineTexts);

    const blocks = [];
    for (let i = 0; i < cleanedItems.length; i++) {
      const item = cleanedItems[i];
      const ar = translatedLines[i] || item.cleanLine;

      const blockObj = {
        id: `blk_${slideNumber}_${i + 1}`,
        en: item.cleanLine,
        ar,
        isHeading: item.isHeading,
        isBullet: item.isBullet,
        slideNumber,
      };
      blocks.push(blockObj);

      allNodes.push({
        id: `node_${allNodes.length + 1}`,
        text: item.cleanLine,
        ar,
        slideNumber,
        isHeading: item.isHeading,
      });
    }

    // 2. ترجمة الفقرة كنص متصل حتى يحتفظ المحرك بسياق الجمل.
    const paragraphs = [];
    const fullParagraphEn = lineTexts.join(' ').trim();
    if (fullParagraphEn) {
      const fullArPara = await translateText(fullParagraphEn);

      paragraphs.push({
        id: `para_${slideNumber}_1`,
        en: fullParagraphEn,
        ar: fullArPara,
        isHeading: false,
        slideNumber,
      });
    }

    slides.push({
      id: `slide_${slideNumber}`,
      number: slideNumber,
      title: slideTitle,
      img, // صورة الشريحة الحقيقية المطابقة 1:1 بدون أي ترحيل!
      blocks,
      paragraphs,
    });
  }

  onStage(2, { name: 'توليد الملخص الذكي المركز والمصطلحات' });

  // 3. الملخص الذكي المركز (المطلوب بدقة: عن ماذا تتحدث + ماذا ستستفيد)
  let summary = {
    overview: 'تتناول هذه المحاضرة المفاهيم والخطوات السريرية التخصصية لدراسة الحالة.',
    benefits: ['فهم المبادئ السريرية', 'تطبيق الإجراءات العلاجية بدقة', 'تفادي الأخطاء الشائعة'],
  };
  try {
    summary = await generateClinicalSummary(text, title);
  } catch (err) {
    console.error('Summary error:', err);
  }

  // 4. استخراج المصطلحات السنية المفهرسة
  const glossary = extractLectureGlossary(text);

  onStage(3, { name: 'بناء وتجهيز الاختبار المنهجي وألعاب التثبيت' });

  // 5. توليد بنك الأسئلة المنهجي المخصص لهذه المحاضرة
  let quiz = [];
  try {
    quiz = generateLectureQuiz(glossary, { nodes: allNodes, slides, summary, text }, 7);
  } catch (err) {
    console.error('Quiz error:', err);
  }

  const wordsCount = text.split(/\s+/).filter(Boolean).length;

  return {
    id: `lec_${Date.now().toString(36)}_${secureRandomInt(1e6).toString(36)}`,
    title: (title || '').trim() || 'محاضرة طب أسنان',
    createdAt: new Date().toISOString(),
    source: { name: sourceName, chars: text.length },
    rawText: text,
    slides,
    nodes: allNodes,
    glossary,
    summary,
    quiz,
    units: glossary.slice(0, 10).map((g) => ({ term: g.en, ar: g.ar })),
    terms: glossary.map((g) => ({
      key: g.en.toLowerCase(),
      term: g.en,
      ar: g.ar,
      count: 1,
    })),
    metrics: {
      wordsCount,
      slideCount: slides.length,
      glossaryCount: glossary.length,
      readingMinutes: Math.max(1, Math.round(wordsCount / 150)),
    },
  };
}

/* ========================================================================== *
 * 3. محرك الاختبار المنهجي الذكي والمتجدد (Dynamic Exam Generator)
 * ========================================================================== */
export function generateLectureQuiz(glossary, lecture = null, count = 7) {
  const questions = [];
  const seenKeys = new Set();
  const dict = getDentalDictionary();
  const allArDefinitions = [...new Set([...dict.values()])];

  // 1. جمع المصطلحات الواردة في المحاضرة
  const candidateGlossary = glossary && glossary.length > 0
    ? [...glossary]
    : [...dict.entries()].slice(0, 30).map(([en, ar]) => ({ en, ar }));

  const shuffledTerms = cryptoShuffle(candidateGlossary);

  // أ. أسئلة معاني المصطلحات السريرية
  for (const item of shuffledTerms) {
    if (questions.length >= Math.ceil(count * 0.5)) break;
    const k = item.en.toLowerCase();
    if (seenKeys.has(k)) continue;
    seenKeys.add(k);

    const wrong = cryptoShuffle(
      allArDefinitions.filter((v) => v !== item.ar && Math.abs(v.length - item.ar.length) < 30)
    ).slice(0, 3);

    while (wrong.length < 3) {
      const fallback = allArDefinitions[secureRandomInt(allArDefinitions.length)];
      if (fallback !== item.ar && !wrong.includes(fallback)) wrong.push(fallback);
    }

    const options = cryptoShuffle([item.ar, ...wrong]);
    const correctLetter = ['A', 'B', 'C', 'D'][options.indexOf(item.ar)] || 'A';
    const qNum = questions.length + 1;

    questions.push({
      id: `q_${qNum}`,
      type: 'term_meaning',
      qNum,
      stem: `سؤال ${qNum}: ما هو المعنى السريري الدقيق للمصطلح الوارد في المحاضرة: [${item.en}]؟`,
      stemEn: `Question ${qNum}: What is the clinical meaning of [${item.en}]?`,
      correctAr: item.ar,
      correctId: correctLetter,
      options: options.map((opt, i) => ({ id: ['A', 'B', 'C', 'D'][i], text: opt })),
      rationale: `المصطلح السني [${item.en}] يعني سريرياً: «${item.ar}».`,
    });
  }

  // ب. أسئلة إكمال الفراغ والمفاهيم السريرية من جمل المحاضرة
  const nodes = lecture?.nodes || [];
  const meaningfulSentences = nodes
    .map((n) => n.text)
    .filter((s) => s.length > 40 && s.length < 240 && !s.startsWith('#'));

  const shuffledSentences = cryptoShuffle(meaningfulSentences);

  for (const sentence of shuffledSentences) {
    if (questions.length >= count) break;
    // ابحث عن مصطلح في الجملة لحذفه
    const foundTerm = candidateGlossary.find((t) => sentence.toLowerCase().includes(t.en.toLowerCase()));
    if (foundTerm) {
      const clozeText = sentence.replace(new RegExp(foundTerm.en, 'i'), '【 ............ 】');
      const wrong = cryptoShuffle(candidateGlossary.filter((t) => t.en !== foundTerm.en).map((t) => t.en)).slice(0, 3);
      if (wrong.length === 3) {
        const options = cryptoShuffle([foundTerm.en, ...wrong]);
        const correctLetter = ['A', 'B', 'C', 'D'][options.indexOf(foundTerm.en)] || 'A';
        const qNum = questions.length + 1;

        questions.push({
          id: `q_${qNum}`,
          type: 'cloze',
          qNum,
          stem: `سؤال ${qNum}: بناءً على نص المحاضرة، أكمل العبارة التالية: "${clozeText}"`,
          correctAr: foundTerm.en,
          correctId: correctLetter,
          options: options.map((opt, i) => ({ id: ['A', 'B', 'C', 'D'][i], text: opt })),
          rationale: `العبارة الصحيحة الواردة في المحاضرة هي: "${sentence}".`,
        });
      }
    }
  }

  // ج. إذا تبقى أسئلة، نكمل من باقي المصطلحات لتغطية العدد المطلوب بدقة
  for (const item of shuffledTerms) {
    if (questions.length >= count) break;
    const k = item.en.toLowerCase();
    if (seenKeys.has(k)) continue;
    seenKeys.add(k);

    const wrong = cryptoShuffle(allArDefinitions.filter((v) => v !== item.ar)).slice(0, 3);
    const options = cryptoShuffle([item.ar, ...wrong]);
    const correctLetter = ['A', 'B', 'C', 'D'][options.indexOf(item.ar)] || 'A';
    const qNum = questions.length + 1;

    questions.push({
      id: `q_${qNum}`,
      type: 'term_meaning',
      qNum,
      stem: `سؤال ${qNum}: اختر التعريف العلمي الصحيح لمصطلح: [${item.en}]:`,
      correctAr: item.ar,
      correctId: correctLetter,
      options: options.map((opt, i) => ({ id: ['A', 'B', 'C', 'D'][i], text: opt })),
      rationale: `المفهوم المعتمد هو: «${item.ar}».`,
    });
  }

  return questions;
}

export function generateExam(lecture, { count = 12 } = {}) {
  const glossary = lecture?.glossary || [];
  return generateLectureQuiz(glossary, lecture, count);
}

/* ========================================================================== *
 * 4. ألعاب التثبيت السريرية (Flashcards & Matching)
 * ========================================================================== */

/**
 * توليد بنك ضخم من بطاقات الاسترجاع (Flashcards) لتغطية كامل المحاضرة
 */
export function buildFlashcards(lecture) {
  if (!lecture) return [];
  const cards = [];
  const seenFronts = new Set();

  // 1. بطاقات المصطلحات السنية المستخرجة من المحاضرة
  const glossary = lecture.glossary || [];
  for (const item of glossary) {
    const k = item.en.toLowerCase().trim();
    if (seenFronts.has(k)) continue;
    seenFronts.add(k);

    cards.push({
      id: `fc_term_${cards.length + 1}`,
      kind: 'term',
      front: item.en,
      frontSub: 'مصطلح سني سريري',
      back: item.ar,
      backDetails: `يقابله في الممارسة السريرية: ${item.ar}.`,
    });
  }

  // 2. بطاقات المفاهيم والأسطر التفسيرية من شرائح المحاضرة
  const slides = lecture.slides || [];
  for (const s of slides) {
    for (const b of (s.blocks || [])) {
      if (b.en && b.ar && b.en !== b.ar && b.en.length > 20 && b.en.length < 180) {
        const k = b.en.toLowerCase().trim();
        if (seenFronts.has(k)) continue;
        seenFronts.add(k);

        cards.push({
          id: `fc_block_${cards.length + 1}`,
          kind: 'concept',
          front: b.en,
          frontSub: `من الشريحة ${s.number || ''}`,
          back: b.ar,
          backDetails: `الترجمة والمدلول السريري للشريحة ${s.number || ''}`,
        });
      }
    }
  }

  // إذا كانت البطاقات قليلة، نضيف من القاموس السني العام المماثل
  if (cards.length < 8) {
    const dict = getDentalDictionary();
    const commonEntries = [...dict.entries()].slice(0, 15);
    for (const [en, ar] of commonEntries) {
      if (!seenFronts.has(en)) {
        seenFronts.add(en);
        cards.push({
          id: `fc_extra_${cards.length + 1}`,
          kind: 'term',
          front: en,
          frontSub: 'مصطلح سني داعم',
          back: ar,
          backDetails: 'من القاموس السني المعتمد للبلبي.',
        });
      }
    }
  }

  return cryptoShuffle(cards);
}

/**
 * تجهيز أزواج مطابقة المصطلحات السريعة مع دعم جولات متعددة
 */
export function buildMatchPairs(lecture) {
  if (!lecture) return [];
  const pairs = [];
  const seen = new Set();

  const glossary = lecture.glossary || [];
  for (const item of glossary) {
    const k = item.en.toLowerCase().trim();
    if (seen.has(k)) continue;
    seen.add(k);
    pairs.push({
      id: `pair_${pairs.length + 1}`,
      left: item.en,
      right: item.ar,
    });
  }

  // إذا كانت قليلة، ندعمها من القاموس
  if (pairs.length < 12) {
    const dict = getDentalDictionary();
    for (const [en, ar] of dict.entries()) {
      if (pairs.length >= 24) break;
      if (!seen.has(en)) {
        seen.add(en);
        pairs.push({
          id: `pair_${pairs.length + 1}`,
          left: en,
          right: ar,
        });
      }
    }
  }

  return pairs;
}
