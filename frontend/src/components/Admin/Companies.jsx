import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import toast from "react-hot-toast";

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
  const [formData, setFormData] = useState({
    company_name: "",
    domain: "",
    email: "",
    phone: "",
    address: "",
    admin_name: "",
    admin_email: "",
    admin_password: "",
    subscription_tier: "basic",
  });

  const fetchCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/companies`,
        {
          params: { page, limit: 20, search: searchQuery },
          withCredentials: true,
        },
      );
      setCompanies(response.data.data.companies || []);
      setTotalCompanies(response.data.data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch companies");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/companies`,
        formData,
        { withCredentials: true },
      );
      setShowCreateModal(false);
      setFormData({
        company_name: "",
        domain: "",
        email: "",
        phone: "",
        address: "",
        admin_name: "",
        admin_email: "",
        admin_password: "",
        subscription_tier: "basic",
      });
      fetchCompanies();
      toast.success("Company created successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create company", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  const handleEditCompany = (company) => {
    setEditingCompany(company);
    setFormData({
      company_name: company.name,
      domain: company.domain,
      email: company.email,
      phone: company.phone || "",
      address: company.address || "",
      subscription_tier: company.subscription_tier || "basic",
      // Don't need admin fields for edit
      admin_name: "",
      admin_email: "",
      admin_password: "",
    });
    setShowEditModal(true);
  };

  const handleUpdateCompany = async (e) => {
    e.preventDefault();

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/companies/${editingCompany.id}`,
        {
          name: formData.company_name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          subscription_tier: formData.subscription_tier,
        },
        { withCredentials: true },
      );

      setShowEditModal(false);
      setEditingCompany(null);
      setFormData({
        company_name: "",
        domain: "",
        email: "",
        phone: "",
        address: "",
        admin_name: "",
        admin_email: "",
        admin_password: "",
        subscription_tier: "basic",
      });
      fetchCompanies();
      toast.success("Company updated successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update company", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  const handleDeactivate = async (companyId, companyName) => {
    if (
      !window.confirm(
        `Are you sure you want to deactivate ${companyName}? This will disable all users in this company.`,
      )
    )
      return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/companies/${companyId}`,
        { withCredentials: true },
      );
      fetchCompanies();
      toast.success("Company deactivated successfully", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Failed to deactivate company",
        {
          duration: 4000,
          position: "top-right",
        },
      );
    }
  };

  const totalPages = Math.ceil(totalCompanies / 20);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">
          Company Management
        </h1>
        <p className="text-zinc-400 text-sm">
          Create and manage companies across the platform
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search companies by name, domain, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded transition-colors"
        >
          Create Company
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-6 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-2 uppercase tracking-wider">
            Total Companies
          </div>
          <div className="text-3xl font-bold text-white">{totalCompanies}</div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-2 uppercase tracking-wider">
            Active
          </div>
          <div className="text-3xl font-bold text-green-400">
            {companies.filter((c) => c.is_active).length}
          </div>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <div className="text-zinc-400 text-sm mb-2 uppercase tracking-wider">
            Inactive
          </div>
          <div className="text-3xl font-bold text-red-400">
            {companies.filter((c) => !c.is_active).length}
          </div>
        </div>
      </div>

      {/* Companies Table */}
      {loading ? (
        <div className="text-center py-12 text-zinc-400">Loading...</div>
      ) : error ? (
        <div className="bg-red-500/10 border border-red-500/20 rounded p-4 text-red-400">
          {error}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-12 text-zinc-400">
          No companies found
        </div>
      ) : (
        <>
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-zinc-950">
                <tr>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Domain
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Subscription
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Max Users
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-6 py-4 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800">
                {companies.map((company) => (
                  <tr key={company.id} className="hover:bg-zinc-800/50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-white">
                        {company.name}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <code className="text-cyan-400 text-sm">
                        {company.domain}
                      </code>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {company.email}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex px-2 py-1 text-xs font-medium rounded capitalize bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                        {company.subscription_tier}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-zinc-400">
                      {company.max_users}
                    </td>
                    <td className="px-6 py-4">
                      {company.is_active ? (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-green-500/10 text-green-400 border border-green-500/20">
                          Active
                        </span>
                      ) : (
                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-red-500/10 text-red-400 border border-red-500/20">
                          Inactive
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleEditCompany(company)}
                        className="text-cyan-400 hover:text-cyan-300 text-sm font-medium mr-4"
                      >
                        Edit
                      </button>
                      {company.is_active && (
                        <button
                          onClick={() =>
                            handleDeactivate(company.id, company.name)
                          }
                          className="text-red-400 hover:text-red-300 text-sm font-medium"
                        >
                          Deactivate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-zinc-400">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-zinc-800"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Create Company Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">
                Create New Company
              </h2>
            </div>
            <form onSubmit={handleCreateCompany} className="p-6 space-y-6">
              {/* Company Information */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Company Name *
                    </label>
                    <input
                      type="text"
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Domain *
                    </label>
                    <input
                      type="text"
                      value={formData.domain}
                      onChange={(e) =>
                        setFormData({ ...formData, domain: e.target.value })
                      }
                      required
                      placeholder="acme-corp"
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Company Email *
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Address
                    </label>
                    <input
                      type="text"
                      value={formData.address}
                      onChange={(e) =>
                        setFormData({ ...formData, address: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Subscription Tier *
                    </label>
                    <select
                      value={formData.subscription_tier}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subscription_tier: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    >
                      <option value="free">Free</option>
                      <option value="basic">Basic</option>
                      <option value="premium">Premium</option>
                      <option value="enterprise">Enterprise</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Admin User */}
              <div>
                <h3 className="text-lg font-semibold text-white mb-4">
                  Company Admin User
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Admin Name *
                    </label>
                    <input
                      type="text"
                      value={formData.admin_name}
                      onChange={(e) =>
                        setFormData({ ...formData, admin_name: e.target.value })
                      }
                      required
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Admin Email *
                    </label>
                    <input
                      type="email"
                      value={formData.admin_email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admin_email: e.target.value,
                        })
                      }
                      required
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-xs text-zinc-400 uppercase tracking-wider mb-2">
                      Admin Password *
                    </label>
                    <input
                      type="password"
                      value={formData.admin_password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          admin_password: e.target.value,
                        })
                      }
                      required
                      minLength={6}
                      className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-6 py-3 bg-zinc-800 hover:bg-zinc-700 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded transition-colors"
                >
                  Create Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Company Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">Edit Company</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Update company information
              </p>
            </div>

            <form onSubmit={handleUpdateCompany} className="p-6">
              {/* Company Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Company Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.company_name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          company_name: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Acme Corporation"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Domain
                    </label>
                    <input
                      type="text"
                      disabled
                      value={formData.domain}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-500 cursor-not-allowed"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Domain cannot be changed
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Company Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="contact@acme.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Phone
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) =>
                        setFormData({ ...formData, phone: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="+1 (555) 000-0000"
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className="block text-sm text-zinc-400 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) =>
                      setFormData({ ...formData, address: e.target.value })
                    }
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    placeholder="123 Main St, City, State, ZIP"
                  />
                </div>
              </div>

              {/* Subscription */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Subscription
                </h3>
                <div>
                  <label className="block text-sm text-zinc-400 mb-2">
                    Subscription Tier <span className="text-red-500">*</span>
                  </label>
                  <select
                    required
                    value={formData.subscription_tier}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        subscription_tier: e.target.value,
                      })
                    }
                    className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                  >
                    <option value="free">Free (10 users)</option>
                    <option value="basic">Basic (50 users)</option>
                    <option value="pro">Pro (200 users)</option>
                    <option value="enterprise">Enterprise (Unlimited)</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingCompany(null);
                    setFormData({
                      company_name: "",
                      domain: "",
                      email: "",
                      phone: "",
                      address: "",
                      admin_name: "",
                      admin_email: "",
                      admin_password: "",
                      subscription_tier: "basic",
                    });
                  }}
                  className="flex-1 px-6 py-3 bg-zinc-900 hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded transition-colors"
                >
                  Update Company
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Companies;
