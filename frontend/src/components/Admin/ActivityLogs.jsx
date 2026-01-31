import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";

const ActivityLogs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    action: "",
    resource: "",
    user_id: "",
    start_date: "",
    end_date: "",
  });
  const [page, setPage] = useState(1);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const params = { page, limit: 50, ...filters };
      Object.keys(params).forEach((key) => !params[key] && delete params[key]);

      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/activity-logs`,
        { params, withCredentials: true },
      );
      setLogs(response.data.data.logs || []);
    } catch (err) {
      console.error("Failed to fetch logs:", err);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const getActionColor = (action) => {
    if (action.includes("create")) return "text-green-400";
    if (action.includes("delete")) return "text-red-400";
    if (action.includes("update")) return "text-cyan-400";
    if (action.includes("login")) return "text-blue-400";
    return "text-zinc-400";
  };

  const getStatusBadge = (success) => {
    return success ? (
      <span className="px-2 py-1 bg-green-500/10 text-green-500 rounded text-xs font-medium">
        Success
      </span>
    ) : (
      <span className="px-2 py-1 bg-red-500/10 text-red-500 rounded text-xs font-medium">
        Failed
      </span>
    );
  };

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Activity Logs</h1>
        <p className="text-zinc-400 text-sm">
          Monitor and audit all user activities across your organization
        </p>
      </div>

      {/* Filters */}
      <div className="mb-6 bg-zinc-950 border border-zinc-800 rounded-lg p-6">
        <h3 className="text-white font-semibold mb-4 flex items-center">
          <svg
            className="w-5 h-5 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"
            />
          </svg>
          Filters
        </h3>
        <div className="grid grid-cols-4 gap-4">
          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Action
            </label>
            <select
              value={filters.action}
              onChange={(e) =>
                setFilters({ ...filters, action: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
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
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Resource
            </label>
            <select
              value={filters.resource}
              onChange={(e) =>
                setFilters({ ...filters, resource: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            >
              <option value="">All Resources</option>
              <option value="user">User</option>
              <option value="chat">Chat</option>
              <option value="message">Message</option>
              <option value="role">Role</option>
              <option value="company">Company</option>
            </select>
          </div>

          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) =>
                setFilters({ ...filters, start_date: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <div>
            <label className="block text-xs text-zinc-500 uppercase tracking-wider mb-2">
              End Date
            </label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) =>
                setFilters({ ...filters, end_date: e.target.value })
              }
              className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() =>
              setFilters({
                action: "",
                resource: "",
                user_id: "",
                start_date: "",
                end_date: "",
              })
            }
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-sm font-medium transition-colors"
          >
            Clear Filters
          </button>
        </div>
      </div>

      {/* Logs */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">
            Loading activity logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">
            No activity logs found
          </div>
        ) : (
          <div className="divide-y divide-zinc-900">
            {logs.map((log) => (
              <div
                key={log.id}
                className="p-6 hover:bg-zinc-900/50 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                      <span
                        className={`font-medium ${getActionColor(log.action)}`}
                      >
                        {log.description || log.action.replace(/_/g, " ")}
                      </span>
                      {getStatusBadge(log.success)}
                    </div>

                    <div className="ml-5 space-y-1">
                      <p className="text-sm text-zinc-400">
                        <span className="text-zinc-600">User:</span>{" "}
                        <span className="text-white">
                          {log.user_name || "System"}
                        </span>
                      </p>
                      <p className="text-sm text-zinc-400">
                        <span className="text-zinc-600">Resource:</span>{" "}
                        <span className="text-cyan-400">{log.resource}</span>
                        {log.resource_id && (
                          <span className="text-zinc-600 ml-2">
                            ({log.resource_id})
                          </span>
                        )}
                      </p>
                      <p className="text-sm text-zinc-400">
                        <span className="text-zinc-600">IP:</span>{" "}
                        {log.ip_address}
                        {" • "}
                        <span className="text-zinc-600">Method:</span>{" "}
                        {log.method} {log.endpoint}
                        {" • "}
                        <span className="text-zinc-600">Status:</span>{" "}
                        {log.status_code}
                      </p>
                      {log.error_message && (
                        <p className="text-sm text-red-400 mt-2">
                          Error: {log.error_message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-zinc-500">
                      {new Date(log.timestamp).toLocaleString()}
                    </p>
                    {log.duration && (
                      <p className="text-xs text-zinc-600 mt-1">
                        {log.duration}ms
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-zinc-800 flex justify-between">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Previous
          </button>
          <span className="text-zinc-500 text-sm py-2">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={logs.length < 50}
            className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogs;
