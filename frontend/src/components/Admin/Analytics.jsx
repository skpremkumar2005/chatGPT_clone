import { useState, useEffect, useCallback } from "react";
import axios from "axios";

const StatCard = ({ label, value, sub, color }) => (
  <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
    <p className={`text-3xl font-bold ${color || "text-zinc-900 dark:text-white"}`}>{value ?? "—"}</p>
    {sub && <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1">{sub}</p>}
  </div>
);

const Analytics = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [days, setDays] = useState(30);

  const fetchAnalytics = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${process.env.REACT_APP_API_URL}/admin/analytics`, { params: { days }, withCredentials: true });
      setData(r.data.data);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch analytics");
    } finally { setLoading(false); }
  }, [days]);

  useEffect(() => { fetchAnalytics(); }, [fetchAnalytics]);

  const userStats = data?.user_stats || {};

  return (
    <div className="p-8">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Analytics</h1>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Usage and activity overview for your organization</p>
        </div>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {loading ? (
        <div className="text-center py-16 text-zinc-400">Loading analytics…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>
      ) : (
        <>
          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Users</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Users" value={userStats.total_users} />
            <StatCard label="Active Users" value={userStats.active_users} color="text-green-600 dark:text-green-400" />
            <StatCard label="Inactive Users" value={userStats.inactive_users} color="text-red-500 dark:text-red-400" />
            <StatCard label="Admins" value={userStats.admin_users} sub={`${userStats.manager_users ?? 0} managers`} color="text-cyan-600 dark:text-cyan-400" />
          </div>

          <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Activity (last {days} days)</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard label="Total Actions" value={data?.total_actions} />
            <StatCard label="Successful" value={data?.successful_actions} color="text-green-600 dark:text-green-400" />
            <StatCard label="Failed" value={data?.failed_actions} color="text-red-500 dark:text-red-400" />
            <StatCard label="Unique Active Users" value={data?.unique_users} color="text-violet-600 dark:text-violet-400" />
          </div>

          {data?.actions_by_type && Object.keys(data.actions_by_type).length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Actions by Type</h2>
              <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden mb-8">
                <table className="w-full">
                  <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                    <tr>
                      <th className="px-6 py-3.5 text-left text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3.5 text-right text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Count</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                    {Object.entries(data.actions_by_type).sort(([, a], [, b]) => b - a).map(([action, count]) => (
                      <tr key={action} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                        <td className="px-6 py-3 text-sm text-zinc-700 dark:text-zinc-300 capitalize">{action.replace(/_/g, " ")}</td>
                        <td className="px-6 py-3 text-right text-sm font-semibold text-cyan-600 dark:text-cyan-400">{count}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {userStats.roles_distribution && Object.keys(userStats.roles_distribution).length > 0 && (
            <>
              <h2 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-4">Role Distribution</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(userStats.roles_distribution).map(([role, count]) => (
                  <div key={role} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 capitalize mb-1">{role.replace(/_/g, " ")}</p>
                    <p className="text-3xl font-bold text-zinc-900 dark:text-white">{count}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default Analytics;
