import { useSearchParams } from 'react-router-dom';
import { config } from '../../config/env.js';

// Draft text for development. Have a lawyer review and replace it before launch.
const POLICIES = [
  ['privacy', 'Privacy Policy', ['Disha collects the details you provide (name, contact details, profile photo, health documents) to run your account.', 'We use this data only to provide the service, send OTPs and reminders, and keep a record of activity on your account.', 'We never sell personal data. You can ask to access, correct or delete your data through the contact address below.']],
  ['terms', 'Terms and Conditions', ['By using Disha you agree to provide accurate information and to keep your login private.', 'Doctors may view a user\'s records only after the user or guardian approves with a one-time code, and only for a limited time.', 'Accounts may be suspended for misuse, false registration or attempts to access records without permission.']],
  ['data-protection', 'Data Protection Policy', ['Documents are accessible only to the user, linked guardians and approved doctors with an active consent session.', 'Passwords and one-time codes are stored as hashes. Every access to records is written to a permanent history.', 'Disha follows the principles of India\'s Digital Personal Data Protection Act: consent, purpose limitation and security safeguards.']],
  ['disclaimer', 'Disclaimer', ['Disha stores and shares records. It does not provide medical advice, diagnosis or treatment.', 'Medicine reminders are a convenience and must not replace a doctor\'s instructions. In an emergency, call your local emergency number.']],
];

export default function PoliciesPage() {
  const [params, setParams] = useSearchParams();
  const active = POLICIES.find(([id]) => id === params.get('tab')) || POLICIES[0];
  return (
    <>
      <h1>Company policies</h1>
      <div className="tabs" role="tablist">{POLICIES.map(([id, title]) => (
        <button key={id} role="tab" aria-selected={active[0] === id} className={active[0] === id ? 'tab tab-active' : 'tab'} onClick={() => setParams({ tab: id })}>{title}</button>))}</div>
      <article className="card"><h2>{active[1]}</h2>{active[2].map((t) => <p key={t}>{t}</p>)}
        <p className="muted">Questions? Contact <a href={`mailto:${config.contactEmail}`}>{config.contactEmail}</a>.</p></article>
    </>
  );
}
