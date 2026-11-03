import { Link } from 'react-router-dom';
import { config } from '../../config/env.js';
import { Icon } from '../../components/ui/index.jsx';

const FEATURES = [['file', 'All records in one place', 'Upload prescriptions, lab reports and scans as photos or PDFs and find them with search.'],
  ['lock', 'You stay in control', 'Doctors see your records only after you or your guardian approve with a one-time code.'],
  ['clock', 'Permanent history', 'Every upload, deletion and doctor access is recorded and cannot be edited.'],
  ['bell', 'Medicine reminders', 'Coming soon: alarms for medicines and appointments with guardian alerts.'],
  ['shield', 'Verified doctors', 'Doctors submit their licence and are approved by an administrator before they can request access.'],
  ['heart', 'Emergency ready', 'Coming soon: a quick emergency profile with blood group and guardian contact.']];
const STEPS = ['Create an account and add your profile photo.', 'Upload your medical documents.', 'At the hospital, the doctor enters your Disha ID.', 'You and your guardian receive an OTP; sharing it gives the doctor time-limited, read-only access.'];

export default function LandingPage() {
  return (
    <>
      <section className="hero">
        <p className="eyebrow">Disha</p>
        <h1>Your health records, with your consent.</h1>
        <p className="lead">Disha keeps your medical history safe in one place and lets doctors see it only when you say yes.</p>
        <div className="cta"><Link className="btn btn-primary" to="/register">Create user account</Link><Link className="btn btn-ghost" to="/login">User login</Link></div>
      </section>
      <section aria-labelledby="who"><h2 id="who">Choose how you use Disha</h2>
        <div className="grid two">
          <div className="card"><Icon name="user" size={28} /><h3>Users</h3><p>Store documents, control who sees them and keep a history of all activity.</p>
            <div className="actions"><Link className="btn btn-primary" to="/login">Log in</Link><Link className="btn btn-ghost" to="/register">Register</Link></div></div>
          <div className="card"><Icon name="shield" size={28} /><h3>Doctors</h3><p>Register with your licence, get verified, then request user access by Disha ID.</p>
            <div className="actions"><Link className="btn btn-primary" to="/login?role=doctor">Doctor login</Link><Link className="btn btn-ghost" to="/register?role=doctor">Register as doctor</Link></div></div>
        </div></section>
      <section aria-labelledby="features"><h2 id="features">Key features</h2>
        <div className="grid three">{FEATURES.map(([icon, title, text]) => (
          <div className="card" key={title}><Icon name={icon} size={26} /><h3>{title}</h3><p>{text}</p></div>))}</div></section>
      <section aria-labelledby="how"><h2 id="how">How it works</h2>
        <ol className="steps">{STEPS.map((s) => <li key={s}>{s}</li>)}</ol></section>
      <section aria-labelledby="video"><h2 id="video">See Disha in action</h2>
        {config.demoVideoUrl
          ? <iframe className="video-box" src={config.demoVideoUrl} title="Disha demonstration video" allowFullScreen />
          : <div className="video-box video-placeholder"><Icon name="play" size={40} /><p>Demo video coming soon</p></div>}
      </section>
    </>
  );
}
