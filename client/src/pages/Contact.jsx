import { useState, useEffect } from 'react';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useLang } from '../context/LanguageContext.jsx';
import { useAssets } from '../hooks/useAssets.js';
import EditMark from '../components/cms/EditMark.jsx';

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
    if (form.phone.trim().length < 7) errs.phone = 'Valid phone number required';
    if (!form.propertyInterest) errs.propertyInterest = 'Please select an option';
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
          <p className="section-label reveal"><EditMark path="contact.label" label="Label">{c.label}</EditMark></p>
          <h1 className="section-title reveal rd1">
            <EditMark path="contact.title" label="Title">{c.title}</EditMark> <em><EditMark path="contact.titleEm" label="Title (Italic)">{c.titleEm}</EditMark></em>
          </h1>
          <p className="section-body reveal rd2">
            <EditMark path="location.body" label="Location Body">{t.location.body}</EditMark>
          </p>
          <div className="contact-detail reveal rd2">
            <div className="contact-detail-item">
              <span className="contact-detail-label"><EditMark path="footer.contactCol" label="Contact Column">{t.footer.contactCol}</EditMark></span>
              <span className="contact-detail-value" style={{ whiteSpace: 'pre-line' }}>
                <EditMark path="footer.address" label="Address">{t.footer.address}</EditMark>
              </span>
            </div>
            <div className="contact-detail-item">
              <span className="contact-detail-label">Email</span>
              <span className="contact-detail-value">
                <a href={`mailto:${t.footer.email}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <EditMark path="footer.email" label="Email">{t.footer.email}</EditMark>
                </a>
              </span>
            </div>
            <div className="contact-detail-item">
              <span className="contact-detail-label">WhatsApp</span>
              <span className="contact-detail-value">
                <a href={`https://wa.me/${t.footer.phone.replace(/[^0-9+]/g, '')}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                  <EditMark path="footer.phone" label="Phone">{t.footer.phone}</EditMark>
                </a>
              </span>
            </div>
          </div>
        </div>

        <div>
          {status === 'success' ? (
            <div className="form-success">
              <h3><EditMark path="contact.successTitle" label="Success Title">{c.successTitle}</EditMark></h3>
              <p><EditMark path="contact.successBody" label="Success Body">{c.successBody}</EditMark></p>
            </div>
          ) : (
            <form className="enquiry-form" onSubmit={handleSubmit} noValidate>
              <div className="form-row">
                <div className="form-field">
                  <label className="form-label" htmlFor="name"><EditMark path="contact.namePlaceholder" label="Name Label">{c.namePlaceholder}</EditMark></label>
                  <input
                    id="name" name="name" type="text" className="form-input"
                    placeholder={c.namePlaceholder} value={form.name} onChange={handleChange}
                    autoComplete="name"
                  />
                  {errors.name && <span className="form-error">{errors.name}</span>}
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="email"><EditMark path="contact.emailPlaceholder" label="Email Label">{c.emailPlaceholder}</EditMark></label>
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
                  <label className="form-label" htmlFor="phone"><EditMark path="contact.phonePlaceholder" label="Phone Label">{c.phonePlaceholder}</EditMark></label>
                  <input
                    id="phone" name="phone" type="tel" className="form-input"
                    placeholder={c.phonePlaceholder} value={form.phone} onChange={handleChange}
                    autoComplete="tel"
                  />
                  {errors.phone && <span className="form-error">{errors.phone}</span>}
                </div>
                <div className="form-field">
                  <label className="form-label" htmlFor="propertyInterest"><EditMark path="contact.interestLabel" label="Interest Label">{c.interestLabel}</EditMark></label>
                  <select
                    id="propertyInterest" name="propertyInterest" className="form-select"
                    value={form.propertyInterest} onChange={handleChange}
                  >
                    {c.interestOptions.map((opt, i) => (
                      <option key={i} value={i === 0 ? '' : opt}>{opt}</option>
                    ))}
                  </select>
                  {errors.propertyInterest && <span className="form-error">{errors.propertyInterest}</span>}
                </div>
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="message"><EditMark path="contact.messagePlaceholder" label="Message Label">{c.messagePlaceholder}</EditMark></label>
                <textarea
                  id="message" name="message" className="form-textarea"
                  placeholder={c.messagePlaceholder} value={form.message} onChange={handleChange}
                  rows={5}
                />
                {errors.message && <span className="form-error">{errors.message}</span>}
              </div>

              {status === 'error' && (
                <div className="form-alert"><EditMark path="contact.errorMsg" label="Error">{c.errorMsg}</EditMark></div>
              )}

              <button
                type="submit" className="btn-primary"
                disabled={status === 'sending'}
                style={{ opacity: status === 'sending' ? .6 : 1 }}
              >
                {status === 'sending' ? <EditMark path="contact.sending" label="Sending">{c.sending}</EditMark> : <EditMark path="contact.submitBtn" label="Submit">{c.submitBtn}</EditMark>}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
