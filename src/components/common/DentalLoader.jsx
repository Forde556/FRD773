import React from 'react';

/**
 * DentalLoader - كود التحميل المخصص لمنصة "الأسهل بطب الأسنان"
 * يعرض أحرف متحركة متتابعة مع خلفية ضوئية مموهة ومتحركة
 * 
 * @param {string} text - النص المراد عرضه (الافتراضي: "الأسـهـل بطب الأسـنان")
 * @param {string} variant - نمط الألوان: 'medical' (طبي أزرق لؤلؤي) أو 'vibrant' (ألوان مشعة)
 * @param {boolean} scale - مضاعفة الحجم (scale-2)
 */
export default function DentalLoader({
  text = 'الأسـهـل بطب الأسـنان',
  variant = 'medical',
  scale = false,
  className = '',
}) {
  // تقسيم النص إلى حروف ومسافات
  const characters = Array.from(text);

  return (
    <div
      className={`loader-wrapper ${scale ? 'scale-2' : ''} ${className}`}
      aria-label={`جاري التحميل: ${text}`}
      dir="rtl"
    >
      {/* الطبقة الضوئية المموهة في الخلفية */}
      <div className={`loader ${variant === 'medical' ? 'medical' : 'vibrant'}`} />

      {/* أحرف النص مع تأخير حركي متسلسل */}
      {characters.map((char, index) => {
        const isSpace = char === ' ' || char === '\u00A0';
        return (
          <span
            key={index}
            className={`loader-letter ${isSpace ? 'space' : ''}`}
            style={{
              animationDelay: `${(index + 1) * 0.085}s`,
            }}
          >
            {isSpace ? '\u00A0' : char}
          </span>
        );
      })}
    </div>
  );
}
