import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { documentsApi } from '../../services/api.js';
import { useAsync } from '../../hooks.js';
import { useToast } from '../../app/providers.jsx';
import { Alert, Button, EmptyState, Pagination, Skeleton } from '../../components/ui/index.jsx';
import DocumentList from './DocumentList.jsx';

const TYPES = [['prescription', 'Prescription'], ['lab_report', 'Lab report'], ['scan', 'Scan'], ['discharge_summary', 'Discharge summary'], ['other', 'Other']];
const toParams = (values) => Object.fromEntries(Object.entries(values).filter(([, v]) => v));

/** Search, filter, list and paginate documents. Filters live in the URL so they survive navigation. */
export default function DocumentBrowser({ patientId, canDelete = false, refreshKey = 0 }) {
  const [params, setParams] = useSearchParams();
  const applied = { q: params.get('q') || '', type: params.get('type') || '', uploadDate: params.get('uploadDate') || '' };
  const page = Number(params.get('page')) || 1;
  const [title, setTitle] = useState(applied.q);
  const toast = useToast();

  useEffect(() => { // debounce title search so typing does not fire a request per keystroke
    if (title === applied.q) return undefined;
    const timer = setTimeout(() => setParams(toParams({ ...applied, q: title })), 400);
    return () => clearTimeout(timer);
  }, [title]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data, loading, error, reload } = useAsync(() => documentsApi.list(patientId, { ...applied, page }),
    [patientId, applied.q, applied.type, applied.uploadDate, page, refreshKey]);
  const filtered = !!(applied.q || applied.type || applied.uploadDate);
  const change = (key) => (e) => setParams(toParams({ ...applied, q: title, [key]: e.target.value }));
  const clear = () => { setTitle(''); setParams({}); };
  const goTo = (p) => setParams({ ...Object.fromEntries(params), page: p });
  const remove = async (id) => {
    if (!confirm('Delete this document?')) return;
    try { await documentsApi.remove(id); toast('Document deleted'); reload(); } catch (err) { toast(err.message, 'error'); }
  };

  return (
    <section aria-label="Documents">
      <form className="toolbar" onSubmit={(e) => e.preventDefault()} role="search">
        <label className="field grow"><span>Title</span>
          <input type="search" placeholder="Search by title" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
        <label className="field"><span>Category</span>
          <select value={applied.type} onChange={change('type')}><option value="">All categories</option>{TYPES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
        <label className="field"><span>Uploaded Date</span>
          <input type="date" value={applied.uploadDate} onChange={change('uploadDate')} /></label>
        {filtered && <div className="toolbar-actions"><Button type="button" variant="ghost" onClick={clear}>Clear filters</Button></div>}
      </form>
      {loading ? <Skeleton /> : error ? <Alert>{error.message}</Alert> : !data.items.length
        ? <EmptyState>{filtered ? 'No documents match your search. Try different filters.' : 'No documents yet.'}</EmptyState>
        : <>
            <p className="muted">{data.total} document{data.total === 1 ? '' : 's'}</p>
            <DocumentList docs={data.items} patientId={patientId} onDelete={canDelete ? remove : undefined} />
            <Pagination page={data.page} pages={data.pages} onChange={goTo} />
          </>}
    </section>
  );
}
