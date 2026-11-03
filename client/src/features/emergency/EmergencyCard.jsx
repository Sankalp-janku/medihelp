import { Avatar } from '../../components/ui/index.jsx';

const show = (v) => (v === null || v === undefined || v === '' ? <span className="muted">Not provided</span> : v);

/** Read-only emergency information card, used on the user's page and on the doctor's lookup result. */
export default function EmergencyCard({ card, children }) {
  const rows = [['Date of birth', card.dateOfBirth && new Date(card.dateOfBirth).toLocaleDateString(undefined, { timeZone: 'UTC' })], ['Age', card.age === null ? null : `${card.age} years`],
    ['Blood group', card.bloodGroup], ['Disha ID', card.dishaId], ['Guardian name', card.guardian.name], ['Guardian phone', card.guardian.phone]];
  return (
    <section className="card emergency" aria-label="Emergency medical profile">
      <div className="page-head"><Avatar userId={card.id} name={card.name} hasPhoto={card.hasPhoto} size={64} /><h2>{card.name}</h2></div>
      <dl className="detail-grid">{rows.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{show(v)}</dd></div>)}</dl>
      {children}
    </section>
  );
}
