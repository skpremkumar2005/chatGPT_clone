import { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const API = process.env.REACT_APP_API_URL;
const inputCls = "w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all";
const selectCls = "w-full px-3.5 py-2.5 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-zinc-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-400 dark:focus:border-cyan-500 transition-all";
const labelCls = "block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5";

const emptyForm = { company_name: "", domain: "", email: "", phone: "", address: "", admin_name: "", admin_email: "", admin_password: "", subscription_tier: "basic" };

const Companies = () => {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [formData, setFormData] = useState(emptyForm);

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const r = await axios.get(`${API}/admin/companies`, { params: { page, limit: 20, search: searchQuery }, withCredentials: true });
      setCompanies(r.data.data.companies || []);
      setTotalCompanies(r.data.data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch companies");
    } finally { setLoading(false); }
  }, [page, searchQuery]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API}/admin/companies`, formData, { withCredentials: true });
      setShowCreateModal(false);
      setFormData(emptyForm);
      fetchCompanies();
      toast.success("Company created successfully!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to create company"); }
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({ company_name: company.name, domain: company.domain, email: company.email, phone: company.phone || "", address: company.address || "", subscription_tier: company.subscription_tier || "basic", admin_name: "", admin_email: "", admin_password: "" });
    setShowEditModal(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`${API}/admin/companies/${editingCompany.id}`, { name: formData.company_name, email: formData.email, phone: formData.phone, address: formData.address, subscription_tier: formData.subscription_tier }, { withCredentials: true });
      setShowEditModal(false);
      setEditingCompany(null);
      setFormData(emptyForm);
      fetchCompanies();
      toast.success("Company updated successfully!");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to update company"); }
  };

  const handleDeactivate = async (companyId, companyName) => {
    if (!window.confirm(`Deactivate ${companyName}? This will disable all users in this company.`)) return;
    try {
      await axios.delete(`${API}/admin/companies/${companyId}`, { withCredentials: true });
      fetchCompanies();
      toast.success("Company deactivated");
    } catch (err) { toast.error(err.response?.data?.message || "Failed to deactivate"); }
  };

  const totalPages = Math.ceil(totalCompanies / 20);

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-white mb-1">Company Management</h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">Create and manage companies across the platform</p>
      </div>

      <div className="mb-6 flex items-center gap-3">
        <input type="text" placeholder="Search by name, domain, or email…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className={`${inputCls} max-w-sm`} />
        <button onClick={() => setShowCreateModal(true)} className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-cyan-500/20">Create Company</button>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total Companies", value: totalCompanies, cls: "text-zinc-900 dark:text-white" },
          { label: "Active", value: companies.filter(c => c.is_active).length, cls: "text-green-600 dark:text-green-400" },
          { label: "Inactive", value: companies.filter(c => !c.is_active).length, cls: "text-red-500 dark:text-red-400" },
        ].map(({ label, value, cls }) => (
          <div key={label} className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl p-5">
            <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">{label}</p>
            <p className={`text-3xl font-bold ${cls}`}>{value}</p>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading…</div>
      ) : error ? (
        <div className="p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm">{error}</div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">No companies found</div>
      ) : (
        <>
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  {["Company", "Domain", "Email", "Subscription", "Max Users", "Status", "Actions"].map((h) => (
                    <th key={h} className="text-left px-6 py-3.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors">
                    <td className="px-6 py-4 text-sm font-semibold text-zinc-900 dark:text-white">{company.name}</td>
                    <td className="px-6 py-4"><code className="text-xs font-mono text-cyan-600 dark:text-cyan-400">{company.domain}</code></td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{company.email}</td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2.5 py-1 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-500/20 rounded-lg text-xs font-semibold capitalize">{company.subscription_tier}</span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-500 dark:text-zinc-400">{company.max_users}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-semibold border ${company.is_active ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20" : "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-200 dark:border-red-500/20"}`}>
                        {company.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 space-x-3">
                      <button onClick={() => handleEditCompany(company)} className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 transition-colors">Edit</button>
                      {company.is_active && <button onClick={() => handleDeactivate(company.id, company.name)} className="text-sm font-medium text-red-500 dark:text-red-400 hover:text-red-400 transition-colors">Deactivate</button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {totalPages > 1 && (
            <div className="mt-5 flex items-center justify-between">
              <p className="text-sm text-zinc-400">Page {page} of {totalPages}</p>
              <div className="flex gap-2">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium disabled:opacity-40 transition-all">Previous</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-4 py-2 bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium disabled:opacity-40 transition-all">Next</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Create New Company</h2>
            </div>
            <form onSubmit={handleCreateCompany} className="p-6 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Company Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Company Name <span className="text-red-400">*</span></label><input type="text" value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} required className={inputCls} /></div>
                  <div><label className={labelCls}>Domain <span className="text-red-400">*</span></label><input type="text" value={formData.domain} onChange={(e) => setFormData({ ...formData, domain: e.target.value })} required placeholder="acme-corp" className={inputCls} /></div>
                  <div><label className={labelCls}>Company Email <span className="text-red-400">*</span></label><input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required className={inputCls} /></div>
                  <div><label className={labelCls}>Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputCls} /></div>
                  <div><label className={labelCls}>Subscription Tier</label><select value={formData.subscription_tier} onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })} className={selectCls}><option value="free">Free</option><option value="basic">Basic</option><option value="premium">Premium</option><option value="enterprise">Enterprise</option></select></div>
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-3">Company Admin User</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={labelCls}>Admin Name <span className="text-red-400">*</span></label><input type="text" value={formData.admin_name} onChange={(e) => setFormData({ ...formData, admin_name: e.target.value })} required className={inputCls} /></div>
                  <div><label className={labelCls}>Admin Email <span className="text-red-400">*</span></label><input type="email" value={formData.admin_email} onChange={(e) => setFormData({ ...formData, admin_email: e.target.value })} required className={inputCls} /></div>
                  <div className="col-span-2"><label className={labelCls}>Admin Password <span className="text-red-400">*</span></label><input type="password" value={formData.admin_password} onChange={(e) => setFormData({ ...formData, admin_password: e.target.value })} required minLength={6} className={inputCls} /></div>
                </div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button type="button" onClick={() => { setShowCreateModal(false); setFormData(emptyForm); }} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-cyan-500/20">Create Company</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/40 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl animate-fade-in">
            <div className="p-6 border-b border-zinc-100 dark:border-zinc-800">
              <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Edit Company</h2>
              <p className="text-sm text-zinc-500 mt-0.5">Update company information</p>
            </div>
            <form onSubmit={handleUpdateCompany} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div><label className={labelCls}>Company Name <span className="text-red-400">*</span></label><input type="text" required value={formData.company_name} onChange={(e) => setFormData({ ...formData, company_name: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Domain</label><input type="text" disabled value={formData.domain} className={`${inputCls} opacity-50 cursor-not-allowed`} /><p className="text-xs text-zinc-400 mt-1">Domain cannot be changed</p></div>
                <div><label className={labelCls}>Company Email <span className="text-red-400">*</span></label><input type="email" required value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className={inputCls} /></div>
                <div><label className={labelCls}>Phone</label><input type="tel" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Address</label><input type="text" value={formData.address} onChange={(e) => setFormData({ ...formData, address: e.target.value })} className={inputCls} /></div>
                <div className="col-span-2"><label className={labelCls}>Subscription Tier</label><select required value={formData.subscription_tier} onChange={(e) => setFormData({ ...formData, subscription_tier: e.target.value })} className={selectCls}><option value="free">Free (10 users)</option><option value="basic">Basic (50 users)</option><option value="pro">Pro (200 users)</option><option value="enterprise">Enterprise (Unlimited)</option></select></div>
              </div>
              <div className="flex gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <button type="button" onClick={() => { setShowEditModal(false); setEditingCompany(null); setFormData(emptyForm); }} className="flex-1 px-4 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 rounded-xl text-sm font-medium transition-all">Cancel</button>
                <button type="submit" className="flex-1 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white font-semibold rounded-xl text-sm transition-all shadow-sm shadow-cyan-500/20">Update Company</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
