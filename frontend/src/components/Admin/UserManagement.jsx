import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import { useSelector } from "react-redux";
import toast from "react-hot-toast";

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [createLoading, setCreateLoading] = useState(false);

  const { permissions } = useSelector((state) => state.auth);
  const canManageUsers = permissions?.includes("manage:users");

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role_id: "",
    department: "",
  });

  const fetchRoles = useCallback(async () => {
    try {
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/roles`,
        { withCredentials: true },
      );
      setRoles(response.data.data || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
    }
  }, []);

  useEffect(() => {
    if (showCreateModal && roles.length === 0) {
      fetchRoles();
    }
  }, [showCreateModal, roles.length, fetchRoles]);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/admin/users`,
        {
          params: { page, limit: 20, search: searchQuery },
          withCredentials: true,
        },
      );
      setUsers(response.data.data.users || []);
      setTotalUsers(response.data.data.total || 0);
      setError(null);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [page, searchQuery]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/admin/users`,
        {
          ...formData,
          is_active: true, // Set user as active by default
        },
        { withCredentials: true },
      );

      setShowCreateModal(false);
      setFormData({
        name: "",
        email: "",
        password: "",
        role_id: "",
        department: "",
      });
      fetchUsers();
      toast.success("User created successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create user", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: "", // Don't populate password
      role_id: user.role_id,
      department: user.department || "",
    });
    setShowEditModal(true);
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setCreateLoading(true);

    try {
      const updateData = {
        name: formData.name,
        role_id: formData.role_id,
        department: formData.department,
      };

      // Only include password if it was changed
      if (formData.password) {
        updateData.password = formData.password;
      }

      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/users/${editingUser.id}`,
        updateData,
        { withCredentials: true },
      );

      setShowEditModal(false);
      setEditingUser(null);
      setFormData({
        name: "",
        email: "",
        password: "",
        role_id: "",
        department: "",
      });
      fetchUsers();
      toast.success("User updated successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update user", {
        duration: 4000,
        position: "top-right",
      });
    } finally {
      setCreateLoading(false);
    }
  };

  const handleDeactivateUser = async (userId) => {
    if (!window.confirm("Are you sure you want to deactivate this user?"))
      return;

    try {
      await axios.delete(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}`,
        { withCredentials: true },
      );
      fetchUsers();
      toast.success("User deactivated successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to deactivate user", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  const handleActivateUser = async (userId) => {
    if (!window.confirm("Are you sure you want to activate this user?")) return;

    try {
      await axios.put(
        `${process.env.REACT_APP_API_URL}/admin/users/${userId}`,
        { is_active: true },
        { withCredentials: true },
      );
      fetchUsers();
      toast.success("User activated successfully!", {
        duration: 3000,
        position: "top-right",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to activate user", {
        duration: 4000,
        position: "top-right",
      });
    }
  };

  const totalPages = Math.ceil(totalUsers / 20);

  return (
    <div className="p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">User Management</h1>
        <p className="text-zinc-400 text-sm">
          Manage company users, roles, and permissions
        </p>
      </div>

      {/* Search and Actions */}
      <div className="mb-6 flex items-center gap-4">
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search users by name, email, or department..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>
        {canManageUsers && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded transition-colors"
          >
            Create User
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Total Users
          </p>
          <p className="text-2xl font-bold text-white">{totalUsers}</p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Active Users
          </p>
          <p className="text-2xl font-bold text-green-500">
            {users.filter((u) => u.is_active).length}
          </p>
        </div>
        <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-4">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-1">
            Inactive Users
          </p>
          <p className="text-2xl font-bold text-red-500">
            {users.filter((u) => !u.is_active).length}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded text-red-400 text-sm">
          {error}
        </div>
      )}

      {/* Users Table */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-zinc-500">Loading users...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-zinc-500">No users found</div>
        ) : (
          <>
            <table className="w-full">
              <thead className="bg-zinc-900 border-b border-zinc-800">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-zinc-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-zinc-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-900">
                {users.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-zinc-900/50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-cyan-500/10 rounded-full flex items-center justify-center">
                          <span className="text-cyan-400 font-bold text-sm">
                            {user.name?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="text-white font-medium">{user.name}</p>
                          <p className="text-zinc-500 text-sm">{user.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-block px-2 py-1 bg-cyan-500/10 text-cyan-400 rounded text-xs font-medium">
                        {user.role_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {user.department || "-"}
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          user.is_active
                            ? "bg-green-500/10 text-green-500"
                            : "bg-red-500/10 text-red-500"
                        }`}
                      >
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm">
                      {user.last_login_at
                        ? new Date(user.last_login_at).toLocaleDateString()
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {canManageUsers && (
                        <button
                          onClick={() => handleEditUser(user)}
                          className="text-cyan-400 hover:text-cyan-300 text-sm font-medium mr-4"
                        >
                          Edit
                        </button>
                      )}
                      {canManageUsers &&
                        (user.is_active ? (
                          <button
                            onClick={() => handleDeactivateUser(user.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            onClick={() => handleActivateUser(user.id)}
                            className="text-green-400 hover:text-green-300 text-sm font-medium"
                          >
                            Activate
                          </button>
                        ))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 border-t border-zinc-800 flex items-center justify-between">
                <p className="text-sm text-zinc-500">
                  Showing {(page - 1) * 20 + 1} to{" "}
                  {Math.min(page * 20, totalUsers)} of {totalUsers} users
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create User Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">Create New User</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Add a new user to your company
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="p-6">
              {/* User Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="john@company.com"
                    />
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Min 6 characters"
                />
              </div>

              {/* Role & Department */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Role & Department
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.role_id}
                      onChange={(e) =>
                        setFormData({ ...formData, role_id: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Select role...</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name.replace(/_/g, " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Engineering, Sales, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      role_id: "",
                      department: "",
                    });
                  }}
                  className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? "Creating..." : "Create User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-zinc-800">
              <h2 className="text-2xl font-bold text-white">Edit User</h2>
              <p className="text-zinc-400 text-sm mt-1">
                Update user information
              </p>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6">
              {/* User Information */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  User Information
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      disabled
                      value={formData.email}
                      className="w-full px-4 py-2 bg-zinc-800 border border-zinc-700 rounded text-zinc-500 cursor-not-allowed"
                      placeholder="john@company.com"
                    />
                    <p className="text-xs text-zinc-500 mt-1">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div className="mb-6">
                <label className="block text-sm text-zinc-400 mb-2">
                  New Password (leave blank to keep current)
                </label>
                <input
                  type="password"
                  minLength={6}
                  value={formData.password}
                  onChange={(e) =>
                    setFormData({ ...formData, password: e.target.value })
                  }
                  className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                  placeholder="Min 6 characters"
                />
              </div>

              {/* Role & Department */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-white mb-4">
                  Role & Department
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Role <span className="text-red-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.role_id}
                      onChange={(e) =>
                        setFormData({ ...formData, role_id: e.target.value })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                    >
                      <option value="">Select role...</option>
                      {roles.map((role) => (
                        <option key={role.id} value={role.id}>
                          {role.name.replace(/_/g, " ").toUpperCase()}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm text-zinc-400 mb-2">
                      Department
                    </label>
                    <input
                      type="text"
                      value={formData.department}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          department: e.target.value,
                        })
                      }
                      className="w-full px-4 py-2 bg-zinc-900 border border-zinc-800 rounded text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyan-500 focus:border-cyan-500"
                      placeholder="Engineering, Sales, etc."
                    />
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingUser(null);
                    setFormData({
                      name: "",
                      email: "",
                      password: "",
                      role_id: "",
                      department: "",
                    });
                  }}
                  className="px-6 py-2 bg-zinc-900 hover:bg-zinc-800 text-white rounded transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createLoading}
                  className="px-6 py-2 bg-cyan-500 hover:bg-cyan-600 text-black font-semibold rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createLoading ? "Updating..." : "Update User"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
