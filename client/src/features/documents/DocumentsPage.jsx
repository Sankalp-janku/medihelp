import { useState } from 'react';
import { documentsApi } from '../../services/api.js';
import { useToast } from '../../app/providers.jsx';
import { Button, Icon } from '../../components/ui/index.jsx';
import DocumentBrowser from './DocumentBrowser.jsx';

export default function DocumentsPage() {
  const [uploading, setUploading] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const toast = useToast();
  const today = new Date().toISOString().slice(0, 10); // report date cannot be in the future

  const upload = async (e) => {
    e.preventDefault();
    const form = e.target;
    setUploading(true);
    try { await documentsApi.upload(new FormData(form)); form.reset(); toast('Document uploaded'); setRefreshKey((k) => k + 1); }
    catch (err) { toast(err.message, 'error'); }
    finally { setUploading(false); }
  };
  return (
    <>
      <h1>My documents</h1>
      <form className="card upload" onSubmit={upload}>
        <label className="field"><span>Title</span><input name="title" placeholder="e.g. Blood test report" required /></label>
        <label className="field"><span>Type</span><select name="type"><option value="prescription">Prescription</option><option value="lab_report">Lab report</option><option value="scan">Scan</option><option value="discharge_summary">Discharge summary</option><option value="other">Other</option></select></label>
        <label className="field"><span>Report date (optional)</span><input name="documentDate" type="date" max={today} /></label>
        <label className="field"><span>File (PDF, JPG, PNG)</span><input name="file" type="file" accept=".pdf,image/*" required /></label>
        <Button loading={uploading}><Icon name="upload" size={16} /> Upload</Button>
      </form>
      <DocumentBrowser canDelete refreshKey={refreshKey} />
    </>
  );
}
