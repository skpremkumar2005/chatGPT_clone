import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const MIME_ICONS = {
  "application/pdf": "📄",
  "application/msword": "📝",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "📝",
  "text/plain": "📃",
};
const mimeIcon = (mime) => MIME_ICONS[mime] || "📎";

const StatusBadge = ({ status }) => {
  const map = {
    synced: "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
    pending_sync: "bg-amber-50 dark:bg-yellow-500/10 text-amber-700 dark:text-yellow-400 border-amber-200 dark:border-yellow-500/20",
    failed: "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };
  const cls = map[status] || "bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700";
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-semibold border capitalize ${cls}`}>
      {status?.replace(/_/g, " ") || "unknown"}
    </span>
  );
};

const FileManager = () => {
  const { permissions } = useSelector((state) => state.auth);
  const canDelete = permissions?.includes("manage:users");
  const canUpload = permissions?.includes("upload:documents");

  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [viewing, setViewing] = useState(null);
  const [uploading, setUploading] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/knowledge-base/documents`, { withCredentials: true });
      setDocs(r.data.data || []);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load documents");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleView = async (doc) => {
    setViewing({ doc, loading: true, content: null });
    try {
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/knowledge-base/documents/${doc.id}`, { withCredentials: true });
      setViewing({ doc, loading: false, content: r.data.data?.extracted_text || "" });
    } catch {
      setViewing({ doc, loading: false, content: "Failed to load content." });
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${process.env.REACT_APP_API_URL}/knowledge-base/documents/${docId}`, { withCredentials: true });
      toast.success("Document deleted");
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) { toast.error(err.response?.data?.message || "Failed to delete"); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds 10 MB limit"); return; }
    const formData = new FormData();
    formData.append("document", file);
    setUploading(true);
    try {
      await axios.post(`${process.env.REACT_APP_API_URL}/knowledge-base/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" }, withCredentials: true,
      });
      toast.success(`"${file.name}" uploaded successfully`);
      fetchDocs();
    } catch (err) { toast.error(err.response?.data?.message || "Upload failed"); }
    finally { setUploading(false); e.target.value = ""; }
  };

  const filtered = docs.filter(d => d.filename?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">File Manager</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">All documents uploaded to the company knowledge base</p>
        </div>
        {canUpload && (
          <label className={`relative px-5 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${uploading ? "bg-zinc-200 dark:bg-zinc-700 text-zinc-400 cursor-not-allowed" : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-sm shadow-cyan-500/20"}`}>
            {uploading ? "Uploading…" : "Upload Document"}
            <input type="file" accept=".pdf,.doc,.docx,.txt" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleUpload} disabled={uploading} />
          </label>
        )}
      </div>

      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by filename…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full max-w-sm px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all"
        />
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Files", value: docs.length, cls: "text-zinc-900 dark:text-white" },
          { label: "Synced", value: docs.filter(d => d.status === "synced").length, cls: "text-green-600 dark:text-green-400" },
          { label: "Pending Sync", value: docs.filter(d => d.status === "pending_sync").length, cls: "text-amber-600 dark:text-yellow-400" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-400">Loading documents…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-zinc-400">{docs.length === 0 ? "No documents uploaded yet." : "No documents match your search."}</div>
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {["File", "Type", "Chunks", "Status", "Uploaded", "Actions"].map((h, i) => (
                  <th key={h} className={`px-6 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {filtered.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl flex-shrink-0">{mimeIcon(doc.mime_type)}</span>
                      <span className="text-sm font-medium text-zinc-800 dark:text-white truncate max-w-xs" title={doc.filename}>{doc.filename}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">{doc.mime_type?.split("/").pop()?.toUpperCase() || "—"}</td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{doc.chunks_created || "—"}</td>
                  <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  <td className="px-6 py-4 text-xs text-zinc-400 dark:text-zinc-500">{doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}</td>
                  <td className="px-6 py-4 text-right space-x-3">
                    <button onClick={() => handleView(doc)} className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors">View</button>
                    {canDelete && <button onClick={() => handleDelete(doc.id, doc.filename)} className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-400 transition-colors">Delete</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {viewing && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl animate-fade-in">
            <div className="flex items-start justify-between p-6 border-b border-zinc-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-2xl flex-shrink-0">{mimeIcon(viewing.doc.mime_type)}</span>
                <div className="min-w-0">
                  <h2 className="text-base font-bold text-zinc-900 dark:text-white truncate">{viewing.doc.filename}</h2>
                  <div className="flex items-center gap-3 mt-1">
                    <StatusBadge status={viewing.doc.status} />
                    {viewing.doc.chunks_created > 0 && <span className="text-xs text-zinc-400">{viewing.doc.chunks_created} chunks</span>}
                  </div>
                </div>
              </div>
              <button onClick={() => setViewing(null)} className="ml-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-white text-xl flex-shrink-0 transition-colors">×</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {viewing.loading ? (
                <div className="text-center py-12 text-zinc-400">Loading content…</div>
              ) : viewing.content ? (
                <pre className="text-sm text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap leading-relaxed font-sans">{viewing.content}</pre>
              ) : (
                <p className="text-zinc-400 text-sm">No extracted text available.</p>
              )}
            </div>
            <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-xs text-zinc-400">Uploaded {viewing.doc.created_at ? new Date(viewing.doc.created_at).toLocaleString() : "—"}</span>
              <button onClick={() => setViewing(null)} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileManager;
