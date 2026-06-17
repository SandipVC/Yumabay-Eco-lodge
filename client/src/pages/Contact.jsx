import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useAssets } from '../hooks/useAssets.js';

export default function Contact() {
  const { t, lang } = useLang();
  const c = t.contact;
  const { state } = useLocation();
  const [searchParams] = useSearchParams();
  const { assets } = useAssets();

  const [form, setForm]       = useState({ name: '', email: '', phone: '', propertyInterest: '', message: '', unitCode: '' });
  const [errors, setErrors]   = useState({});
  const [status, setStatus]   = useState('idle'); // idle | sending | success | error

  const unitParam = searchParams.get('unit');

  useEffect(() => {
    if (state?.interest) setForm(f => ({ ...f, propertyInterest: state.interest }));
  }, [state]);

  useEffect(() => {
    if (unitParam) {
      setForm(f => ({ ...f, unitCode: unitParam.toUpperCase() }));
    }
  }, [unitParam]);

  // Scroll-reveal is wired globally in Layout (useRevealAll, keyed on route).

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
        setForm({ name: '', email: '', phone: '', propertyInterest: '', message: '', unitCode: '' });
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    }
  };

  const allUnits = [];
  if (assets?.inventory) {
    if (Array.isArray(assets.inventory.buildings)) {
      assets.inventory.buildings.forEach(b => {
        if (Array.isArray(b.units)) {
          b.units.forEach(u => {
            allUnits.push({
              code: u.code,
              status: u.status,
              price: u.price,
              buildingName: b.name
            });
          });
        }
      });
    }
    if (Array.isArray(assets.inventory.villas)) {
      assets.inventory.villas.forEach(v => {
        allUnits.push({
          code: v.code,
          status: v.status,
          price: v.price,
          buildingName: lang === 'es' ? 'Villa' : 'Villa'
        });
      });
    }
  }
  allUnits.sort((a, b) => a.code.localeCompare(b.code));

  const getStatusText = (status) => {
    if (lang === 'es') {
      if (status === 'available') return 'Disponible';
      if (status === 'sold') return 'Vendido';
      if (status === 'reserved') return 'Reservado';
      return 'Bloqueado';
    } else {
      if (status === 'available') return 'Available';
      if (status === 'sold') return 'Sold';
      if (status === 'reserved') return 'Reserved';
      return 'Blocked';
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
            <div className="contact-detail-item" style={{ marginTop: 24 }}>
              <span className="contact-detail-label">{lang === 'es' ? 'Descargas' : 'Downloads'}</span>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
                <a
                  href="https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/pdf%2Fyuma-bay-brochure.pdf?alt=media"
                  target="_blank" rel="noopener noreferrer" className="btn-ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', fontSize: 13, textDecoration: 'none' }}
                >
                  📄 {lang === 'es' ? 'Descargar Folleto del Proyecto' : 'Download Project Brochure'}
                </a>
                <a
                  href="https://firebasestorage.googleapis.com/v0/b/vessel-contianer.firebasestorage.app/o/pdf%2Famenidades.pdf?alt=media"
                  target="_blank" rel="noopener noreferrer" className="btn-ghost"
                  style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', padding: '10px 16px', fontSize: 13, textDecoration: 'none' }}
                >
                  📄 {lang === 'es' ? 'Descargar Guía de Amenidades' : 'Download Amenities Guide'}
                </a>
              </div>
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
