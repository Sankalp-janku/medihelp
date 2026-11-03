import { useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { adminApi, metaApi } from '../../services/api.js';
import { useAsync } from '../../hooks.js';
import { useToast } from '../../app/providers.jsx';
import { Alert, Avatar, Badge, Button, EmptyState, Pagination, Skeleton } from '../../components/ui/index.jsx';

const specialityOf = (d) => (d.speciality === 'Other' ? d.specialityOther : d.speciality);

export function AdminDashboard() {
  const { data, loading, error } = useAsync(() => adminApi.stats(), []);
  const cards = [['Total doctors', 'total', ''], ['Approved doctors', 'approved', 'approved'], ['Pending approvals', 'pending', 'pending'], ['Rejected doctors', 'rejected', 'rejected'], ['Registered users', 'users', null]];
  return (
    <>
      <h1>Admin dashboard</h1>
      <Alert>{error?.message}</Alert>
      {loading ? <Skeleton /> : data && <div className="stats">{cards.map(([label, key, status]) => (
        status === null
          ? <div key={key} className="stat"><strong>{data[key]}</strong><span>{label}</span></div>
          : <Link key={key} to={`/admin/doctors${status ? `?status=${status}` : ''}`} className={`stat stat-${key}`}><strong>{data[key]}</strong><span>{label}</span></Link>))}</div>}
    </>
  );
}

export function AdminDoctors() {
  const [params, setParams] = useSearchParams();
  const f = { status: params.get('status') || '', speciality: params.get('speciality') || '', q: params.get('q') || '',
    sort: params.get('sort') || 'createdAt', order: params.get('order') || 'desc', page: Number(params.get('page')) || 1 };
  const specialities = useAsync(() => metaApi.specialities(), []);
  const { data, loading, error } = useAsync(() => adminApi.doctors(f), [f.status, f.speciality, f.q, f.sort, f.order, f.page]);
  const set = (patch) => setParams(Object.fromEntries(Object.entries({ ...f, page: 1, ...patch }).filter(([, v]) => v)));
  const tabs = [['', 'All'], ['approved', 'Approved'], ['pending', 'Pending'], ['rejected', 'Rejected']];

  return (
    <>
      <h1>Doctors</h1>
      <div className="tabs" role="tablist">{tabs.map(([value, label]) => (
        <button key={label} role="tab" aria-selected={f.status === value} className={f.status === value ? 'tab tab-active' : 'tab'} onClick={() => set({ status: value })}>{label}</button>))}</div>
      <div className="toolbar">
        <label className="field grow"><span>Search</span><input type="search" defaultValue={f.q} placeholder="Name, email or reg. no." onKeyDown={(e) => e.key === 'Enter' && set({ q: e.target.value })} onBlur={(e) => e.target.value !== f.q && set({ q: e.target.value })} /></label>
        <label className="field"><span>Speciality</span><select value={f.speciality} onChange={(e) => set({ speciality: e.target.value })}>
          <option value="">All</option>{(specialities.data || []).map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span>Sort by</span><select value={`${f.sort}:${f.order}`} onChange={(e) => { const [sort, order] = e.target.value.split(':'); set({ sort, order }); }}>
          <option value="createdAt:desc">Newest registered</option><option value="createdAt:asc">Oldest registered</option>
          <option value="name:asc">Name A to Z</option><option value="name:desc">Name Z to A</option></select></label>
      </div>
      <Alert>{error?.message}</Alert>
      {loading ? <Skeleton /> : !data?.items.length ? <EmptyState>No doctors match these filters.</EmptyState> : (
        <>
          <div className="table-wrap"><table className="table">
            <thead><tr><th>Doctor</th><th>Email</th><th>Phone</th><th>Speciality</th><th>Reg. no.</th><th>Hospital</th><th>Area</th><th>Registered</th><th>Status</th><th><span className="sr-only">Action</span></th></tr></thead>
            <tbody>{data.items.map((d) => (
              <tr key={d._id}><td><div className="doc-title"><Avatar userId={d._id} name={d.name} size={32} />{d.name}</div></td><td>{d.email}</td><td>{d.phone}</td><td>{specialityOf(d)}</td>
                <td>{d.councilRegNumber}</td><td>{d.hospitalName}</td><td>{d.area}</td><td>{new Date(d.createdAt).toLocaleDateString()}</td><td><Badge status={d.status} /></td>
                <td><Link className="btn btn-ghost" to={`/admin/doctors/${d._id}`}>Review</Link></td></tr>))}</tbody></table></div>
          <Pagination page={data.page} pages={data.pages} onChange={(page) => setParams(Object.fromEntries(Object.entries({ ...f, page }).filter(([, v]) => v)))} />
        </>)}
    </>
  );
}

export function AdminDoctorDetail() {
  const { id } = useParams();
  const { data: d, loading, error, reload } = useAsync(() => adminApi.doctor(id), [id]);
  const [reason, setReason] = useState('');
  const [rejecting, setRejecting] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState('');
  const toast = useToast();

  const act = async (fn, message) => {
    setBusy(true); setActionError('');
    try { await fn(); toast(message); setRejecting(false); reload(); } catch (e) { setActionError(e.details?.[0]?.message || e.message); }
    finally { setBusy(false); }
  };
  const openFile = async (index) => { try { window.open(URL.createObjectURL(await adminApi.verificationFile(id, index))); } catch (e) { toast(e.message, 'error'); } };

  if (loading) return <Skeleton lines={5} />;
  if (error) return <Alert>{error.message}</Alert>;
  const rows = [['Speciality', specialityOf(d)], ['Qualifications', d.qualifications], ['Registration no.', d.councilRegNumber], ['Hospital', d.hospitalName],
    ['Area', d.area], ['Email', d.email], ['Phone', d.phone], ['Registered', new Date(d.createdAt).toLocaleString()],
    ['Reviewed on', d.reviewedAt ? new Date(d.reviewedAt).toLocaleString() : null], ['Reviewed by', d.reviewedBy]];
  return (
    <>
      <p><Link to="/admin/doctors">Back to doctors</Link></p>
      <div className="page-head"><Avatar userId={d._id} name={d.name} hasPhoto={d.hasPhoto} size={80} /><div><h1>{d.name}</h1><Badge status={d.status} /></div></div>
      <section className="card"><dl className="detail-grid">{rows.map(([k, val]) => <div key={k}><dt>{k}</dt><dd>{val || '-'}</dd></div>)}</dl>
        {d.status === 'rejected' && <Alert>Rejection reason: {d.rejectionReason}</Alert>}</section>
      <section className="card"><h2>Verification documents</h2>
        {d.verificationDocs.length ? <ul className="list">{d.verificationDocs.map((f) => (
          <li key={f.index} className="list-item"><span>{f.originalName}</span><button className="btn btn-ghost" onClick={() => openFile(f.index)}>View</button></li>))}</ul>
          : <EmptyState>No documents submitted.</EmptyState>}</section>
      {d.status === 'pending_approval' && (
        <section className="card"><h2>Decision</h2>
          <Alert>{actionError}</Alert>
          {rejecting ? <>
            <label className="field"><span>Reason for rejection (required)</span><textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} /></label>
            <div className="actions"><Button variant="danger" loading={busy} onClick={() => act(() => adminApi.reject(id, reason), 'Doctor rejected')}>Confirm rejection</Button>
              <Button variant="ghost" onClick={() => setRejecting(false)}>Cancel</Button></div></>
            : <div className="actions"><Button loading={busy} onClick={() => confirm('Approve this doctor?') && act(() => adminApi.approve(id), 'Doctor approved')}>Approve</Button>
              <Button variant="danger" onClick={() => setRejecting(true)}>Reject</Button></div>}
        </section>)}
    </>
  );
}
