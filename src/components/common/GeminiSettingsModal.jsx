import React, { useState, useEffect } from 'react';
import { getGeminiApiKey, setGeminiApiKey, testGeminiApiKey, hasGeminiKey } from '../../services/geminiService';
import { sound } from '../../utils/soundscape';

export default function GeminiSettingsModal({ isOpen, onClose }) {
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState(null); // { type: 'success' | 'error' | 'loading', msg: '' }
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setApiKey(getGeminiApiKey());
      setStatus(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = () => {
    sound.tap();
    if (!setGeminiApiKey(apiKey)) {
      setStatus({ type: 'error', msg: 'تعذر حفظ المفتاح في هذا المتصفح. تحقق من إعدادات التخزين ثم أعد المحاولة.' });
      return;
    }
    setStatus({
      type: 'success',
      msg: apiKey.trim()
        ? 'تم الحفظ. سيُستخدم Gemini للترجمة والتلخيص والأسئلة، مع الرجوع للمترجم المعتاد عند تعذر الاتصال.'
        : 'تم حذف المفتاح. ستعمل المنصة بالمترجم المعتاد دون Gemini.',
    });
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleTest = async () => {
    sound.tap();
    setIsTesting(true);
    setStatus({ type: 'loading', msg: 'جارٍ اختبار الاتصال بمحرك Gemini AI...' });
    const res = await testGeminiApiKey(apiKey);
    setIsTesting(false);
    if (res.success) {
      sound.success();
      setStatus({ type: 'success', msg: 'الاتصال سليم! مفتاح Gemini AI صالح وجاهز للاستخدام مجاناً.' });
    } else {
      sound.gentleError();
      setStatus({ type: 'error', msg: `فشل التحقق: ${res.message}` });
    }
  };

  const handleClear = () => {
    sound.tap();
    setApiKey('');
    setGeminiApiKey('');
    setStatus({ type: 'info', msg: 'تم حذف المفتاح. عادت المنصة للوضع المحلي فائق السرعة.' });
  };

  return (
    <div
      className="modal-overlay animate-fade-in"
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <div
        className="glass-surface-heavy"
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: 520,
          borderRadius: 24,
          padding: '28px 30px',
          border: '1px solid var(--accent-primary)',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '1.8rem' }}>✨</span>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-main)' }}>
                إعدادات الذكاء الاصطناعي (Gemini AI)
              </h3>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-subtle)', margin: '2px 0 0' }}>
                ترجمة طبية سريرية ذكية + تلخيص دقيق + توليد اختبارات متجددة
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="btn-ghost"
            style={{ fontSize: '1.1rem', padding: '4px 8px', borderRadius: 8 }}
          >
            ✕
          </button>
        </div>

        {/* Info Box */}
        <div
          style={{
            padding: '12px 16px',
            borderRadius: 14,
            background: 'var(--accent-primary-soft)',
            border: '1px solid var(--accent-primary)',
            marginBottom: 20,
            fontSize: '0.82rem',
            lineHeight: 1.6,
            color: 'var(--text-main)',
          }}
        >
          💡 <b>استخدام مجاني:</b> أنشئ مفتاحاً من Google AI Studio للاستفادة من الحصة المجانية المتاحة لنموذج Gemini. قد تتغير حدود الاستخدام أو التوفر حسب المنطقة وسياسات Google؛ لا يلزم إدخال وسيلة دفع ما دمت تستخدم الحصة المجانية.
          <br /><br />
          يُحفظ المفتاح في تخزين هذا المتصفح ويُرسل مباشرة إلى Google عند استخدام Gemini. لا ترفع بيانات مرضى أو معلومات سرية. من دون مفتاح، تستمر المنصة بالمترجم والقاموس المعتادين.
        </div>

        {/* Input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: 6, color: 'var(--text-main)' }}>
            مفتاح Google Gemini API (اختياري):
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            placeholder="AIzaSy..."
            style={{
              width: '100%',
              padding: '12px 14px',
              borderRadius: 12,
              border: '1px solid var(--border-subtle)',
              background: 'var(--surface-ground)',
              color: 'var(--text-main)',
              fontSize: '0.88rem',
              outline: 'none',
              fontFamily: 'monospace',
              direction: 'ltr',
            }}
          />
        </div>

        {/* How to get free key */}
        <div style={{ marginBottom: 20 }}>
          <a
            href="https://aistudio.google.com/app/apikey"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontSize: '0.8rem',
              color: 'var(--accent-primary)',
              textDecoration: 'underline',
              fontWeight: 600,
            }}
          >
            🔗 إنشاء مفتاح وتجربة الحصة المجانية من Google AI Studio
          </a>
        </div>

        {/* Status Message */}
        {status && (
          <div
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              marginBottom: 16,
              fontSize: '0.82rem',
              fontWeight: 600,
              background:
                status.type === 'success'
                  ? 'rgba(16, 185, 129, 0.15)'
                  : status.type === 'error'
                  ? 'rgba(239, 68, 68, 0.15)'
                  : 'var(--surface-ground)',
              color:
                status.type === 'success'
                  ? '#10B981'
                  : status.type === 'error'
                  ? '#EF4444'
                  : 'var(--text-main)',
              border: `1px solid ${
                status.type === 'success'
                  ? '#10B981'
                  : status.type === 'error'
                  ? '#EF4444'
                  : 'var(--border-subtle)'
              }`,
            }}
          >
            {status.msg}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleTest}
              disabled={!apiKey.trim() || isTesting}
              className="btn-secondary"
              style={{ fontSize: '0.84rem', padding: '8px 14px', borderRadius: 10 }}
            >
              {isTesting ? 'جارٍ الفحص...' : '🔍 فحص المفتاح'}
            </button>
            {hasGeminiKey() && (
              <button
                onClick={handleClear}
                className="btn-ghost"
                style={{ fontSize: '0.84rem', color: '#EF4444', padding: '8px 12px' }}
              >
                مسح المفتاح
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={onClose}
              className="btn-ghost"
              style={{ fontSize: '0.84rem', padding: '8px 14px', borderRadius: 10 }}
            >
              إلغاء
            </button>
            <button
              onClick={handleSave}
              className="btn-primary"
              style={{ fontSize: '0.84rem', padding: '8px 18px', borderRadius: 10 }}
            >
              💾 حفظ الإعداد
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
