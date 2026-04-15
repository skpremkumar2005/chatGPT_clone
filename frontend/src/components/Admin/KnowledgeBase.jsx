import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";

const API = process.env.REACT_APP_API_URL;

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

const KnowledgeBase = () => {
  const { role_name } = useSelector((state) => state.auth);
  const isAdmin = role_name === "company_admin" || role_name === "super_admin";

  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [docs, setDocs] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [dragOver, setDragOver] = useState(false);

  const fetchDocs = useCallback(async () => {
    try {
      setLoadingDocs(true);
      const r = await axios.get(`${API}/knowledge-base/documents`, { withCredentials: true });
      setDocs(r.data.data || []);
    } catch {
      // silently fail — list is non-critical
    } finally {
      setLoadingDocs(false);
    }
  }, []);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  const handleFileChange = (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast.error("File exceeds 10 MB limit"); return; }
    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append("document", selectedFile);
    try {
      const r = await axios.post(`${API}/knowledge-base/documents`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });
      if (r.data?.success) {
        toast.success(`"${selectedFile.name}" uploaded successfully`);
        setSelectedFile(null);
        fetchDocs();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (docId, filename) => {
    if (!window.confirm(`Delete "${filename}"? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/knowledge-base/documents/${docId}`, { withCredentials: true });
      toast.success("Document deleted");
      setDocs(prev => prev.filter(d => d.id !== docId));
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete");
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileChange(file);
  };

  return (
    <div className="p-8 max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Knowledge Base</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {isAdmin ? "Upload and manage company documents for the knowledge base" : "View company knowledge base documents"}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Documents", value: docs.length, cls: "text-zinc-900 dark:text-white" },
          { label: "Synced", value: docs.filter(d => d.status === "synced").length, cls: "text-green-600 dark:text-green-400" },
          { label: "Pending Sync", value: docs.filter(d => d.status === "pending_sync").length, cls: "text-amber-600 dark:text-yellow-400" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {/* Upload section — only for admins */}
      {isAdmin && (
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6 mb-6">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Upload Document</h2>

          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
              dragOver
                ? "border-cyan-400 dark:border-cyan-500 bg-cyan-50 dark:bg-cyan-500/5"
                : "border-zinc-200 dark:border-zinc-700 hover:border-cyan-300 dark:hover:border-cyan-600"
            }`}
          >
            <input
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={(e) => handleFileChange(e.target.files?.[0])}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <svg className="w-8 h-8 mx-auto mb-3 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            {selectedFile ? (
              <p className="text-sm font-medium text-cyan-600 dark:text-cyan-400">{selectedFile.name}</p>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Drop file here or <span className="text-cyan-600 dark:text-cyan-400 font-medium">browse</span>
              </p>
            )}
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">PDF, DOC, DOCX, TXT — max 10 MB</p>
          </div>

          <div className="flex items-center gap-3 mt-4">
            <button
              onClick={handleUpload}
              disabled={!selectedFile || isUploading}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                !selectedFile || isUploading
                  ? "bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed"
                  : "bg-cyan-500 hover:bg-cyan-400 text-white shadow-sm shadow-cyan-500/20"
              }`}
            >
              {isUploading ? "Uploading…" : "Upload to Knowledge Base"}
            </button>
            {selectedFile && !isUploading && (
              <button onClick={() => setSelectedFile(null)} className="text-sm text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors">
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* Documents list */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-100 dark:border-zinc-800">
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Documents</h2>
        </div>

        {loadingDocs ? (
          <div className="text-center py-12 text-zinc-400 text-sm">Loading documents…</div>
        ) : docs.length === 0 ? (
          <div className="text-center py-12 text-zinc-400 text-sm">No documents in the knowledge base yet.</div>
        ) : (
          <table className="w-full">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                {["Filename", "Type", "Chunks", "Status", "Uploaded"].concat(isAdmin ? [""] : []).map((h, i) => (
                  <th key={i} className={`px-6 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider ${i === 4 || i === 5 ? "text-right" : "text-left"}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {docs.map((doc) => (
                <tr key={doc.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-zinc-800 dark:text-white max-w-xs truncate" title={doc.filename}>
                    {doc.filename}
                  </td>
                  <td className="px-6 py-4 text-xs font-mono text-zinc-500 dark:text-zinc-400">
                    {doc.mime_type?.split("/").pop()?.toUpperCase() || "—"}
                  </td>
                  <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">
                    {doc.chunks_created || "—"}
                  </td>
                  <td className="px-6 py-4"><StatusBadge status={doc.status} /></td>
                  <td className="px-6 py-4 text-xs text-right text-zinc-400 dark:text-zinc-500">
                    {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : "—"}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => handleDelete(doc.id, doc.filename)} className="text-xs font-semibold text-red-500 dark:text-red-400 hover:text-red-400 transition-colors">
                        Delete
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default KnowledgeBase;
