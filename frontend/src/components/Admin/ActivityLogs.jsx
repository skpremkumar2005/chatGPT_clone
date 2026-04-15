import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const selectCls = "w-full px-3 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ action: "", resource: "", user_id: "", start_date: "", end_date: "" });
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 50, ...filters };
      Object.keys(params).forEach((k) => !params[k] && delete params[k]);
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/admin/activity-logs`, { params, withCredentials: true });
      setLogs(r.data.data.logs || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [page, filters]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const getActionColor = (action) => {
    if (action?.includes("create")) return "text-green-600 dark:text-green-400";
    if (action?.includes("delete")) return "text-red-500 dark:text-red-400";
    if (action?.includes("update")) return "text-cyan-600 dark:text-cyan-400";
    if (action?.includes("login")) return "text-violet-600 dark:text-violet-400";
    return "text-zinc-600 dark:text-zinc-400";
  };

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Activity Logs</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Monitor and audit all user activities across your organization</p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-6">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-4 flex items-center gap-2">
          <svg className="w-4 h-4 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          Filters
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Action</label>
            <select value={filters.action} onChange={(e) => setFilters({ ...filters, action: e.target.value })} className={selectCls}>
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create_user">Create User</option>
              <option value="update_user">Update User</option>
              <option value="delete_user">Delete User</option>
              <option value="create_chat">Create Chat</option>
              <option value="send_message">Send Message</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Resource</label>
            <select value={filters.resource} onChange={(e) => setFilters({ ...filters, resource: e.target.value })} className={selectCls}>
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="chat">Chat</option>
              <option value="message">Message</option>
              <option value="role">Role</option>
              <option value="company">Company</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">Start Date</label>
            <input type="date" value={filters.start_date} onChange={(e) => setFilters({ ...filters, start_date: e.target.value })} className={selectCls} />
          </div>
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1.5">End Date</label>
            <input type="date" value={filters.end_date} onChange={(e) => setFilters({ ...filters, end_date: e.target.value })} className={selectCls} />
          </div>
        </div>
        <div className="mt-4">
          <button onClick={() => setFilters({ action: "", resource: "", user_id: "", start_date: "", end_date: "" })} className="px-4 py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all">
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-400">Loading activity logs…</div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-400">No activity logs found</div>
        ) : (
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {logs.map((log) => (
              <div key={log.id} className="p-5 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2.5 mb-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full flex-shrink-0" />
                      <span className={`text-sm font-semibold ${getActionColor(log.action)}`}>
                        {log.description || log.action?.replace(/_/g, " ")}
                      </span>
                      {log.success ? (
                        <span className="px-2 py-0.5 bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20 rounded-lg text-xs font-medium">Success</span>
                      ) : (
                        <span className="px-2 py-0.5 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/20 rounded-lg text-xs font-medium">Failed</span>
                      )}
                    </div>
                    <div className="ml-4.5 space-y-0.5 text-xs">
                      <p className="text-zinc-500 dark:text-zinc-400">
                        <span className="text-zinc-400 dark:text-zinc-600">User:</span>{" "}
                        <span className="text-zinc-800 dark:text-zinc-200 font-medium">{log.user_name || "System"}</span>
                      </p>
                      <p className="text-zinc-500 dark:text-zinc-400">
                        <span className="text-zinc-400 dark:text-zinc-600">Resource:</span>{" "}
                        <span className="text-cyan-600 dark:text-cyan-400">{log.resource}</span>
                        {log.resource_id && <span className="text-zinc-400 dark:text-zinc-600 ml-1">({log.resource_id})</span>}
                      </p>
                      <p className="text-zinc-400 dark:text-zinc-500">
                        {log.ip_address} · {log.method} {log.endpoint} · {log.status_code}
                      </p>
                      {log.error_message && <p className="text-red-500 dark:text-red-400 mt-1">Error: {log.error_message}</p>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-zinc-400 dark:text-zinc-500">{new Date(log.timestamp).toLocaleString()}</p>
                    {log.duration && <p className="text-xs text-zinc-300 dark:text-zinc-600 mt-0.5">{log.duration}ms</p>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="px-6 py-4 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium disabled:opacity-40 transition-all">Previous</button>
          <span className="text-sm text-zinc-400 dark:text-zinc-500">Page {page}</span>
          <button onClick={() => setPage(p => p + 1)} disabled={logs.length < 50} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium disabled:opacity-40 transition-all">Next</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
