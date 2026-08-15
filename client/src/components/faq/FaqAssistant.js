import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { FAQ_CONTENT } from './faqContent';

const CONTACT_EMAIL = 'petar_vs@outlook.com';

function FaqAssistant() {
  const { i18n } = useTranslation();
  const activeLanguage = i18n.resolvedLanguage || i18n.language;
  const language = activeLanguage === 'bg' ? 'bg' : 'en';
  const content = FAQ_CONTENT[language];
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const triggerRef = useRef(null);
  const headingRef = useRef(null);
  const messageIdRef = useRef(0);

  useEffect(() => { setMessages([]); setInput(''); setLoading(false); }, [language]);
  useEffect(() => { if (open) headingRef.current?.focus(); }, [open]);

  const closeAssistant = () => { setOpen(false); triggerRef.current?.focus(); };

  const submitQuestion = async (question) => {
    const cleanQuestion = question.trim();
    if (!cleanQuestion || loading) return;

    const customerMessage = { id: ++messageIdRef.current, role: 'customer', text: cleanQuestion };
    setMessages((current) => [...current, customerMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await fetch('/api/assistant/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: cleanQuestion, language }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.message || 'Assistant request failed');

      const source = (payload.sources || []).find((item) => item.href);
      setMessages((current) => [...current, {
        id: ++messageIdRef.current,
        role: 'assistant',
        text: payload.answer,
        entry: source,
      }]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: ++messageIdRef.current,
        role: 'assistant',
        text: content.ui.fallback,
        error: true,
      }]);
    } finally {
      setLoading(false);
    }
  };

  const linkLabel = (entry) => {
    if (entry.href === '/help/shipping') return content.ui.shippingLink;
    if (entry.href === '/help/returns') return content.ui.returnsLink;
    return content.ui.moreLink;
  };

  return (
    <aside className="faq-assistant">
      {open && (
        <section className="faq-assistant-panel" role="dialog" aria-modal="false" aria-labelledby="faq-assistant-title" onKeyDown={(event) => { if (event.key === 'Escape') closeAssistant(); }}>
          <header className="faq-assistant-header">
            <div><span aria-hidden="true"><i className="far fa-comments"></i></span><h2 id="faq-assistant-title" ref={headingRef} tabIndex="-1">{content.ui.title}</h2></div>
            <button type="button" className="faq-assistant-close" onClick={closeAssistant} aria-label={content.ui.close}><i className="fas fa-times" aria-hidden="true"></i></button>
          </header>

          <div className="faq-assistant-messages" aria-live="polite" aria-atomic="false">
            <div className="faq-message faq-message-assistant"><p>{content.ui.welcome}</p><small>{content.ui.privacy}</small></div>
            {messages.map((message) => (
              <div key={message.id} className={`faq-message faq-message-${message.role}`}>
                <p>{message.text}</p>
                {message.entry?.href && <Link to={message.entry.href}>{linkLabel(message.entry)}</Link>}
                {message.error && <a className="faq-contact-link" href={`mailto:${CONTACT_EMAIL}`}>{content.ui.contact}</a>}
              </div>
            ))}
            {loading && <div className="faq-message faq-message-assistant"><p>{content.ui.thinking}</p></div>}
            {messages.length === 0 && (
              <div className="faq-suggestions faq-suggestions-popular">
                {content.entries.map((entry) => <button type="button" key={entry.id} disabled={loading} onClick={() => submitQuestion(entry.question)}>{entry.question}</button>)}
              </div>
            )}
          </div>

          <form className="faq-assistant-form" onSubmit={(event) => { event.preventDefault(); submitQuestion(input); }}>
            <label htmlFor="faq-assistant-input">{content.ui.inputLabel}</label>
            <div>
              <input id="faq-assistant-input" type="text" maxLength="500" value={input} placeholder={content.ui.inputPlaceholder} onChange={(event) => setInput(event.target.value)} autoComplete="off" disabled={loading} />
              <button type="submit" disabled={loading}>{loading ? content.ui.thinking : content.ui.send}</button>
            </div>
          </form>
        </section>
      )}
      <button ref={triggerRef} type="button" className="faq-assistant-trigger" onClick={() => setOpen(true)} aria-label={content.ui.open} aria-expanded={open}><i className="far fa-comments" aria-hidden="true"></i><span>FAQ</span></button>
    </aside>
  );
}

export default FaqAssistant;
