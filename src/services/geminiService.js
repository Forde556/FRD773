/**
 * geminiService.js
 * تكامل Google Gemini AI عبر الحصة المجانية المتاحة في AI Studio.
 * مزود بحماية Timeout صارمة لمنع توقف أو تعليق المنصة تحت أي ظرف.
 */

const GEMINI_KEY_STORAGE = 'lablabi_gemini_api_key';
const GEMINI_MODEL = 'gemini-2.5-flash';

async function requestGemini(key, prompt, generationConfig = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': key,
        },
        signal: controller.signal,
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig,
        }),
      },
    );

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data.error?.message || `Gemini API error ${response.status}`);
    }

    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('لم يُرجع Gemini نتيجة نصية.');
    return text.trim();
  } finally {
    clearTimeout(timeoutId);
  }
}

export function getGeminiApiKey() {
  try {
    return localStorage.getItem(GEMINI_KEY_STORAGE) || '';
  } catch {
    return '';
  }
}

export function setGeminiApiKey(key) {
  try {
    if (key && key.trim()) {
      localStorage.setItem(GEMINI_KEY_STORAGE, key.trim());
    } else {
      localStorage.removeItem(GEMINI_KEY_STORAGE);
    }
    return true;
  } catch {
    return false;
  }
}

export function hasGeminiKey() {
  const k = getGeminiApiKey();
  return !!(k && k.length > 10);
}

/**
 * فحص صلاحية مفتاح Gemini API مع مهلة 5 ثوانٍ
 */
export async function testGeminiApiKey(key) {
  const k = key || getGeminiApiKey();
  if (!k) return { success: false, message: 'لم يتم إدخال مفتاح API.' };

  try {
    await requestGemini(k, 'قل كلمة "ناجح" فقط', { maxOutputTokens: 10, temperature: 0.1 }, 10000);
    return { success: true, message: 'مفتاح Gemini API يعمل بنجاح وبشكل سليم!' };
  } catch (err) {
    return {
      success: false,
      message: err.name === 'AbortError' ? 'انتهت مهلة الاتصال بالخادم.' : err.message || 'تعذر الاتصال بخوادم Google Gemini.',
    };
  }
}

export async function translateLinesWithGemini(lines) {
  const key = getGeminiApiKey();
  if (!key) throw new Error('لا يوجد مفتاح Gemini API');

  const prompt = `ترجم أسطر محاضرة طب الأسنان التالية إلى العربية الطبية بدقة. أعد مصفوفة JSON من النصوص فقط، بنفس ترتيب وعدد الأسطر تماماً، ولا تدمج أي سطر أو تضف شرحاً.
${JSON.stringify(lines)}`;

  const text = await requestGemini(
    key,
    prompt,
    { temperature: 0.1, responseMimeType: 'application/json', maxOutputTokens: 4096 },
    30000,
  );
  const translations = JSON.parse(text);
  if (
    !Array.isArray(translations) ||
    translations.length !== lines.length ||
    translations.some((line) => typeof line !== 'string' || !line.trim())
  ) {
    throw new Error('تنسيق ترجمة Gemini غير صالح.');
  }
  return translations.map((line) => line.trim());
}

/**
 * ترجمة متقدمة لطب الأسنان بواسطة Gemini AI مع مهلة 7 ثوانٍ
 */
export async function translateWithGemini(text, context = 'dental lecture') {
  const key = getGeminiApiKey();
  if (!key) throw new Error('لا يوجد مفتاح Gemini API');

  const prompt = `أنت خبير واستشاري طب أسنان ومترجم طبي معتمد.
المطلوب منك ترجمة النص التالي المأخوذ من محاضرة طب أسنان من الإنجليزية إلى العربية الطبية الدقيقة المعتمدة في كليات طب الأسنان.
قواعد الترجمة:
1. استخدم المصطلحات السريرية الدقيقة (مثال: Dentin -> العاج السني، Enamel -> المينا السنية، Impression -> طبعة سنية، Working Cast -> القالب التشغيلي، Pulp -> اللب السني).
2. عند ذكر مصطلح سني رئيسي، اكتب المصطلح العربي ومعه المصطلح الإنجليزي بين قوسين للتوضيح.
3. إذا كان النص بالفعل بالعربية، قم بتدقيقه وتحسين صياغته الطبية فقط.
4. أرجع الترجمة فقط بدون أي مقدمات أو شروحات جانبية.

النص:
"""
${text}
"""`;

  return requestGemini(key, prompt, { temperature: 0.2, maxOutputTokens: 2048 });
}

/**
 * توليد الملخص الذكي المركز مع مهلة 7 ثوانٍ
 */
export async function generateSmartSummaryWithGemini(fullText) {
  const key = getGeminiApiKey();
  if (!key) throw new Error('لا يوجد مفتاح Gemini API');

  const prompt = `أنت أستاذ طب أسنان وموجه أكاديمي.
اقرأ نص المحاضرة التالي واستخرج ملخصاً ذكياً مركزاً جداً وموجزاً باللغة العربية يتكون حصراً من قسمين فقط:
1. "عن ماذا تتحدث المحاضرة": فقرة واحدة من سطرين إلى 3 أسطر تشرح باختصار شديد موضوع المحاضرة وسياقها العام.
2. "ماذا ستستفيد من المحاضرة": من 3 إلى 5 نقاط عملية وسريرية سريعة توضح ما سيتعلمه طالب طب الأسنان عملياً وسريرياً من هذا الدرس.

التنسيق المطلوب JSON حصراً:
{
  "overview": "نص النبذة هنا في سطرين أو ثلاثة فقط...",
  "benefits": [
    "الفائدة السريرية الأولى...",
    "الفائدة السريرية الثانية...",
    "الفائدة السريرية الثالثة..."
  ]
}

لا تضف أي نص خارج كائن الـ JSON.

نص المحاضرة:
"""
${fullText.slice(0, 10000)}
"""`;

  try {
    const textOut = await requestGemini(key, prompt, {
      temperature: 0.3,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
    });
    return JSON.parse(textOut);
  } catch {
    return null;
  }
}

/**
 * توليد أسئلة اختبار سريرية متقدمة بواسطة Gemini AI مع مهلة 8 ثوانٍ
 */
export async function generateExamWithGemini(fullText, count = 10) {
  const key = getGeminiApiKey();
  if (!key) throw new Error('لا يوجد مفتاح Gemini API');

  const prompt = `أنت أستاذ وممتحن معتمد في طب الأسنان.
بناءً على نص المحاضرة المرفق، قم بتوليد ${count} أسئلة اختبار اختيار من متعدد (MCQ) متقدمة وشاملة ومبنية على محتوى المحاضرة بدقة.
تأكد من:
- تنوع الأسئلة بين: معاني المصطلحات، الحالات السريرية، النسب والأبعاد، والخطوات الإجرائية.
- 4 خيارات لكل سؤال (A, B, C, D).
- تحديد خيار الإجابة الصحيحة وشرح سبب صحتها.

التنسيق المطلوب JSON حصراً كمصفوفة من الكائنات:
[
  {
    "id": "q1",
    "stem": "نص السؤال بالعربية...",
    "options": [
      { "id": "A", "text": "الخيار الأول" },
      { "id": "B", "text": "الخيار الثاني" },
      { "id": "C", "text": "الخيار الثالث" },
      { "id": "D", "text": "الخيار الرابع" }
    ],
    "correctId": "A",
    "rationale": "شرح طبي سريري موجز لسبب صحة هذا الخيار..."
  }
]

نص المحاضرة:
"""
${fullText.slice(0, 12000)}
"""`;

  try {
    const textOut = await requestGemini(key, prompt, {
      temperature: 0.4,
      responseMimeType: 'application/json',
      maxOutputTokens: 4096,
    });
    return JSON.parse(textOut);
  } catch {
    return [];
  }
}
