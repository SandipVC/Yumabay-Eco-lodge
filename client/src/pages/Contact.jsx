import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';

export default function Contact() {
  const { t, lang } = useLang();
  const c = t.contact;
  const { state } = useLocation();

  const [form, setForm]       = useState({ name: '', email: '', phone: '', propertyInterest: '', message: '' });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error

  useEffect(() => {
    if (state?.interest) setForm(f => ({ ...f, propertyInterest: state.interest }));
  }, [state]);

  useEffect(() => {
    const reveals = document.querySelectorAll('.reveal');
    const observer = new IntersectionObserver(
      (entries) => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); }),
      { threshold: 0.08 }
    );
    reveals.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const validate = () => {
    const errs = {};
    if (form.name.trim().length < 2) errs.name = 'Name is required';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = 'Valid email required';
    if (form.message.trim().length < 5) errs.message = 'Please enter a message';
    return errs;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(er => ({ ...er, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setStatus('sending');
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, language: lang }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStatus('success');
        setForm({ name: '', email: '', phone: '', propertyInterest: '', message: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  return (
    <div className="contact-page">
      <div className="contact-grid">
        <div className="contact-info">
          <p className="section-label reveal">{c.label}</p>
          <h1 className="section-title reveal rd1">
            {c.title} <em>{c.titleEm}</em>
          </h1>
          <p className="section-body reveal rd2">
            {t.location.body}
          </p>
          <div className="contact-detail reveal rd2">
            <div className="contact-detail-item">
              <span className="contact-detail-label">{t.footer.contactCol}</span>
              <span className="contact-detail-value" style={{ whiteSpace: 'pre-line' }}>
                {t.footer.address}
              </span>
            </div>
            <div className="contact-detail-item">
              <span className="contact-detail-label">Email</span>
              <span className="contact-detail-value">
                <a href="mailto:info@yumabay.com" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {t.footer.email}
                </a>
              </span>
            </div>
            <div className="contact-detail-item">
              <span className="contact-detail-label">WhatsApp</span>
              <span className="contact-detail-value">
                <a href="https://wa.me/18090000000" style={{ textDecoration: 'none', color: 'inherit' }}>
                  {t.footer.phone}
                </a>
              </span>
            </div>
          </div>
        </div>

        <div>
          {status === 'success' ? (
            <div className="form-success">
              <h3>{c.successTitle}</h3>
              <p>{c.successBody}</p>
            </div>
          ) : (
            <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label" htmlFor="name">{c.namePlaceholder}</label>
                  <input
                    id="name" name="name" type="text" className="form-input"
                    placeholder={c.namePlaceholder} value={form.name} onChange={handleChange}
                    autoComplete="name"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="email">{c.emailPlaceholder}</label>
                  <input
                    id="email" name="email" type="email" className="form-input"
                    placeholder={c.emailPlaceholder} value={form.email} onChange={handleChange}
                    autoComplete="email"
                  />
                  {errors.email && <span className="form-error">{errors.email}</span>}
                </div>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label className="form-label" htmlFor="phone">{c.phonePlaceholder}</label>
                  <input
                    id="phone" name="phone" type="tel" className="form-input"
                    placeholder={c.phonePlaceholder} value={form.phone} onChange={handleChange}
                    autoComplete="tel"
                  />
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="propertyInterest">{c.interestLabel}</label>
                  <select
                    id="propertyInterest" name="propertyInterest" className="form-select"
                    value={form.propertyInterest} onChange={handleChange}
                  >
                    {c.interestOptions.map((opt, i) => (
                      <option key={i} value={i === 0 ? '' : opt}>{opt}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="message">{c.messagePlaceholder}</label>
                <textarea
                  id="message" name="message" className="form-textarea"
                  placeholder={c.messagePlaceholder} value={form.message} onChange={handleChange}
                  rows={5}
                />
                {errors.message && <span className="form-error">{errors.message}</span>}
              </div>

              {status === 'error' && (
                <div className="form-alert">{c.errorMsg}</div>
              )}

              <button
                type="submit" className="btn-primary"
                disabled={status === 'sending'}
                style={{ opacity: status === 'sending' ? .6 : 1 }}
              >
                {status === 'sending' ? c.sending : c.submitBtn}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
