import React, { useRef } from 'react';
import { useCoreEngine } from '../../context/CoreEngineContext';
import { sound } from '../../utils/soundscape';

export default function SavedLibrary({ onSelectLecture }) {
  const { savedLectures, deleteLecture, importLectures } = useCoreEngine();
  const fileInputRef = useRef(null);

  const handleExportJson = () => {
    sound.tap();
    const blob = new Blob([JSON.stringify(savedLectures, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', url);
    downloadAnchor.setAttribute('download', `dental-lectures-library-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };

  const handleImportFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const list = JSON.parse(text);
      if (!Array.isArray(list) || list.length === 0) {
        throw new Error('يجب أن يحتوي الملف على قائمة محاضرات غير فارغة.');
      }
      const invalidCount = list.filter(
        (lecture) =>
          !lecture ||
          typeof lecture !== 'object' ||
          typeof lecture.id !== 'string' ||
          !lecture.id.trim() ||
          typeof lecture.title !== 'string' ||
          !Array.isArray(lecture.slides),
      ).length;
      if (invalidCount > 0) {
        throw new Error(`الملف يحتوي على ${invalidCount} سجل غير صالح؛ لم يتم استيراد أي محاضرة.`);
      }

      await importLectures(list);
      sound.complete();
      alert(`تم استيراد ${list.length} محاضرة إلى مكتبتك بنجاح ✓`);
    } catch (err) {
      alert(err.message || 'تعذر استيراد الملف. تحقق من أنه ملف JSON صالح ويحتوي على محاضرات بتنسيق المنصة.');
    } finally {
      e.target.value = '';
    }
  };

  return (
    <div className="container" style={{ padding: '24px 16px', maxWidth: 960 }}>
      <div className="glass-surface-heavy" style={{ padding: '24px 28px', borderRadius: 20, marginBottom: 20 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: '1.8rem' }}>🗂️</span>
              <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', margin: 0 }}>
                مكتبتي المحفوظة
              </h2>
            </div>
            <p style={{ fontSize: '0.84rem', color: 'var(--text-subtle)', marginTop: 4 }}>
              المحاضرات التي قمت بترجمتها وتلخيصها محفوظة محلياً للرجوع إليها فورياً دون إعادة استهلاك الوقت أو البيانات.
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={handleExportJson}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px', borderRadius: 10 }}
            >
              📤 تصدير المكتبة (JSON)
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-secondary"
              style={{ fontSize: '0.82rem', padding: '8px 14px', borderRadius: 10 }}
            >
              📥 استيراد ملف
            </button>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              style={{ display: 'none' }}
              onChange={handleImportFile}
            />
          </div>
        </div>
      </div>

      {/* Lectures List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {savedLectures.length === 0 ? (
          <div className="glass-surface-heavy" style={{ padding: '48px 24px', textAlign: 'center', borderRadius: 20, color: 'var(--text-subtle)' }}>
            لا توجد محاضرات محفوظة حالياً في مكتبتك. ابدأ برفع أول ملف PDF أو كتابة محاضرة!
          </div>
        ) : (
          savedLectures.map((lec) => {
            const slideCount = lec.slides?.length || 0;
            const wordsCount = lec.metrics?.wordsCount ?? (lec.rawText || '').split(/\s+/).filter(Boolean).length;
            const dateStr = lec.createdAt ? new Date(lec.createdAt).toLocaleDateString('ar-EG') : 'محفوظة مسبقاً';

            return (
              <div
                key={lec.id}
                className="glass-surface-heavy"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '16px 20px',
                  borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  transition: 'transform var(--trans-fast)',
                }}
              >
                <div>
                  <b style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-main)', display: 'block' }}>
                    {lec.title}
                  </b>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: '0.78rem', color: 'var(--text-subtle)', marginTop: 4 }}>
                    <span>📅 {dateStr}</span>
                    <span>•</span>
                    <span>📑 {slideCount} سلايد</span>
                    <span>•</span>
                    <span>🔤 {wordsCount} كلمة</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <button
                    onClick={() => {
                      sound.tap();
                      onSelectLecture(lec.id);
                    }}
                    className="btn-primary"
                    style={{ fontSize: '0.82rem', padding: '6px 16px', borderRadius: 10 }}
                  >
                    فتح المحاضرة
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`هل أنت متأكد من حذف محاضرة "${lec.title}" من مكتبتك؟`)) {
                        deleteLecture(lec.id);
                      }
                    }}
                    className="btn-ghost"
                    title="حذف المحاضرة"
                    style={{ padding: '6px 10px', borderRadius: 10, color: '#EF4444', fontSize: '1rem' }}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
