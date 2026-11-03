import { useState } from 'react';
import { userApi } from '../../services/api.js';
import { useBlobUrl } from '../../hooks.js';

export const Spinner = () => <span className="spinner" aria-label="Loading" />;
export const Skeleton = ({ lines = 3 }) => (
  <div aria-busy="true">{Array.from({ length: lines }, (_, i) => <div key={i} className="skeleton" />)}</div>
);
export const Button = ({ loading, variant = 'primary', children, ...rest }) => (
  <button className={`btn btn-${variant}`} disabled={loading || rest.disabled} {...rest}>{loading ? <Spinner /> : children}</button>
);
export const Alert = ({ kind = 'error', children }) => (children ? <p className={`alert alert-${kind}`} role="alert">{children}</p> : null);

export function Input({ label, type = 'text', error, ...rest }) {
  const [show, setShow] = useState(false);
  const isPassword = type === 'password';
  return (
    <label className="field">
      <span>{label}</span>
      <div className="field-row">
        <input type={isPassword && show ? 'text' : type} aria-invalid={!!error} {...rest} />
        {isPassword && <button type="button" className="link" onClick={() => setShow(!show)}>{show ? 'Hide' : 'Show'}</button>}
      </div>
      {error && <small className="field-error">{error}</small>}
    </label>
  );
}

export function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  const copy = async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); };
  return <button type="button" className="btn btn-ghost" onClick={copy}>{done ? 'Copied' : 'Copy'}</button>;
}

export const EmptyState = ({ children }) => <p className="empty">{children}</p>;

const ICONS = {
  back: 'M19 12H5m7-7l-7 7 7 7', search: 'M11 19a8 8 0 100-16 8 8 0 000 16zm10 2l-4.3-4.3',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M8 13h8M8 17h8',
  shield: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', check: 'M20 6L9 17l-5-5', x: 'M18 6L6 18M6 6l12 12',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2', lock: 'M5 11h14v10H5zM8 11V7a4 4 0 118 0v4',
  heart: 'M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 00-7.8 7.8l1 1.1L12 21l7.8-7.5 1-1.1a5.5 5.5 0 000-7.8z',
  play: 'M5 3l14 9-14 9z', bell: 'M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 01-3.4 0',
  upload: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12',
};
export const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={ICONS[name]} />
  </svg>
);

/** Shows a user's profile photo (fetched with auth) or their initials. */
export function Avatar({ userId, name = '', hasPhoto = true, size = 40 }) {
  const { url } = useBlobUrl(() => (hasPhoto && userId ? userApi.photo(userId) : Promise.reject(new Error('no photo'))), [userId, hasPhoto]);
  const initials = name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  return url
    ? <img className="avatar" src={url} alt={`${name} profile`} style={{ width: size, height: size }} />
    : <span className="avatar avatar-fallback" style={{ width: size, height: size }} aria-label={name}>{initials || <Icon name="user" />}</span>;
}

export const Badge = ({ status }) => {
  const map = { active: ['Approved', 'ok'], pending_approval: ['Pending', 'warn'], rejected: ['Rejected', 'bad'] };
  const [label, kind] = map[status] || [status, 'warn'];
  return <span className={`badge badge-${kind}`}>{label}</span>;
};

export const Pagination = ({ page, pages, onChange }) => (pages > 1 ? (
  <nav className="pagination" aria-label="Pagination">
    <button className="btn btn-ghost" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
    <span>Page {page} of {pages}</span>
    <button className="btn btn-ghost" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
  </nav>) : null);
