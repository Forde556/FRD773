import React, { useState } from 'react';
import { sound } from '../../utils/soundscape';

/**
 * InteractiveGuideBook - كتيّب تفاعلي ثلاثي الأبعاد لشرح استخدامات المنصة
 * مبني على كود Uiverse.io مع طابع سريري لطب الأسنان
 * 
 * يتضمن:
 * - شرح نقاط استخدامات الموقع ملخصة ومرتبة
 * - مقدم من: عبدالله فاضل
 * - برعاية: شركة FRD
 */
export default function InteractiveGuideBook({ onExploreDrills, onExploreExams }) {
  const [isOpen, setIsOpen] = useState(false);

  const toggleBook = () => {
    sound.tap();
    setIsOpen(!isOpen);
  };

  return (
    <section className="hero-book-banner" aria-label="الكتيب التعريفي للمنصة">
      {/* القسم التعريفي الجانبي */}
      <div className="hero-info-section">
        <div className="hero-brand-tag">
          <span>✦</span>
          <span>المنصة الأولى لطلاب طب الأسنان</span>
        </div>

        <h1 className="hero-main-title">
          الأسـهـل <span className="gradient-text">بطب الأسـنان</span>
        </h1>

        <p className="hero-desc">
          منصة تعليمية وسريرية تفاعلية مصممة خصيصاً لطلاب وأطباء الأسنان؛ تجمع بين الدقة الأكاديمية المطلقة،
          والمحاكاة الوزارية، وتوليد الاختبارات، وتثبيت المصطلحات بطرق حديثة.
        </p>

        {/* أزرار سريعة ورعاية وحساب المطور */}
        <div className="hero-action-row">
          <a
            href="https://t.me/FordeReter"
            target="_blank"
            rel="noopener noreferrer"
            className="hero-badge-credit hero-badge-link"
            title="تواصل مع المطور عبدالله فاضل عبر تيليجرام"
          >
            <span>المطور:</span>
            <strong>عبدالله فاضل</strong>
            <span style={{ fontSize: '0.82rem', color: '#38bdf8' }}>✈️ @FordeReter</span>
          </a>

          <div className="hero-badge-credit">
            <span>برعاية:</span>
            <strong>شركة FRD</strong>
          </div>

          <button
            className="glowbutton purple sm"
            onClick={toggleBook}
          >
            {isOpen ? 'إغلاق الكتيّب ✕' : 'تصفح الكتيّب التفاعلي 📖'}
          </button>
        </div>
      </div>

      {/* مجسم الكتيّب ثلاثي الأبعاد 3D Animated Book */}
      <div className="dental-book-wrapper">
        <div
          className={`dental-book ${isOpen ? 'is-open' : ''}`}
          onClick={toggleBook}
          title="انقر أو مرر الفأرة لفتح الكتيب"
        >
          {/* الصفحات الداخلية للكتاب (استخدامات المنصة) */}
          <div className="dental-book-inside">
            <div className="inside-header">
              <h4>
                <span>📖</span>
                <span>استخدامات المنصة</span>
              </h4>
              <span>دليل المزايا والأدوات السريرية</span>
            </div>

            <ul className="inside-points">
              <li>
                <span className="point-bullet">1</span>
                <span className="point-text">
                  <strong>تنظيم المحاضرات:</strong> تحويل السلايدات لبطاقات سريرية ذكية مع حفظ 100% من الأرقام والمعايير.
                </span>
              </li>
              <li>
                <span className="point-bullet">2</span>
                <span className="point-text">
                  <strong>بنك الاختبارات MCQs:</strong> محاكاة امتحانات تفاعلية مع تعليل دقيق لكل خيار لمنع التخمين.
                </span>
              </li>
              <li>
                <span className="point-bullet">3</span>
                <span className="point-text">
                  <strong>التدريب والبطاقات:</strong> سباق مصطلحات سريرية 60 ثانية وبطاقات استذكار 3D ثلاثية الأبعاد.
                </span>
              </li>
              <li>
                <span className="point-bullet">4</span>
                <span className="point-text">
                  <strong>الطباعة وتصدير A4:</strong> تصدير PDF مخصص للمذاكرة الورقية بدون تقطيع الجداول والبطاقات.
                </span>
              </li>
              <li>
                <span className="point-bullet">5</span>
                <span className="point-text">
                  <strong>المعجم والترجمة:</strong> معجم مصطلحات طب الأسنان وترجمة سريرية فورية للنصوص الطبية.
                </span>
              </li>
            </ul>

            {/* شريط الإهداء داخل الكتاب */}
            <div className="inside-footer">
              <div className="credit-author">مقدم من: عبدالله فاضل</div>
              <a
                href="https://t.me/FordeReter"
                target="_blank"
                rel="noopener noreferrer"
                className="credit-telegram-link"
                onClick={(e) => e.stopPropagation()}
                title="تيليجرام المطور: @FordeReter"
              >
                ✈️ تيليجرام: @FordeReter
              </a>
              <div className="credit-sponsor">
                <span>✦ برعاية شركة FRD ✦</span>
              </div>
            </div>
          </div>

          {/* الغلاف الخارجي ثلاثي الأبعاد (Flipping Cover) */}
          <div className="dental-book-cover">
            <div className="cover-badge">الأسهل بطب الأسنان</div>

            <div className="cover-center">
              <div className="cover-emblem">🦷</div>
              <div className="cover-title">كُتيّب المنصة</div>
              <div className="cover-subtitle">دليل الطالب السريري</div>
            </div>

            <div className="cover-footer">
              <div className="cover-author">مقدم من: عبدالله فاضل</div>
              <div className="cover-sponsor">برعاية: شركة FRD</div>
              <div style={{ fontSize: '0.72rem', color: '#38bdf8', marginTop: 3, fontWeight: 700 }}>
                ✈️ @FordeReter
              </div>
              <div className="cover-hint">
                {isOpen ? 'انقر لإغلاق الغلاف' : 'مرر الماوس أو انقر للفتح 📖'}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
