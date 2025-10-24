import { useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import apiAxios from "../../../../api/api";
import { useGroups } from "../../../service/hooks/useGroup";
import { useDebounce } from "../../../service/hooks/useDebounce";

interface Permission {
  id: number;
  name: string;
  resource: string;
  action: string;
  description: string;
  endpoint: string;
  method: string;
}

interface Role {
  id: number;
  name: string;
  description: string;
  is_active: boolean;
  permissions: Permission[];
}

const API_URL = "https://ec2api.deltatech-backend.com/api/v1/permissions";

const GroupPermission = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // --- Popup states ---
  const [open, setOpen] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);

  // --- Form data ---
  const [selectedPermissions, setSelectedPermissions] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  // --- Local filters ---
  const [resource, setResource] = useState("");
  const [action, setAction] = useState("");
  const [nameInput, setNameInput] = useState("");
  const debouncedName = useDebounce(nameInput, 500);

  // --- Groups list ---
  const { data: dataGroupPermission, isLoading: isGroupsLoading } = useGroups();

  // --- Permissions query (filtered locally, no URL params) ---
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (resource) params.append("resource", resource);
    if (action) params.append("action", action);
    if (debouncedName) params.append("name", debouncedName);
    return `${API_URL}?${params.toString()}`;
  }, [resource, action, debouncedName]);

  const { data: permissions = [], isLoading: isPermissionsLoading } = useQuery<
    Permission[]
  >({
    queryKey: ["permissions", queryUrl],
    queryFn: async () => {
      const res = await apiAxios.get(queryUrl);
      return res.data;
    },
  });

  // --- Handle group creation ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const body = { name, description, permission_ids: selectedPermissions };
      await apiAxios.post(
        "https://ec2api.deltatech-backend.com/api/v1/groups",
        body
      );
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("✅ Group created successfully!");
      setName("");
      setDescription("");
      setSelectedPermissions([]);
      setTimeout(() => setOpen(false), 1000);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to create group.");
    }
  };

  // --- Delete group ---
  const handleDelete = async (id: number) => {
    if (!window.confirm("Bạn có chắc muốn xóa group này?")) return;
    try {
      await apiAxios.delete(
        `https://ec2api.deltatech-backend.com/api/v1/groups/${id}`
      );
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group deleted successfully!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete group.");
    }
  };

  // --- Toggle permission ---
  const handlePermissionSelect = (id: number) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  return (
    <div>
      <div className="flex gap-3 mb-4">
        <button
          onClick={() => setOpen(true)}
          className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
        >
          Create New Group
        </button>

        <button
          onClick={() => navigate("/home/admin/getListPermissions")}
          className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
        >
          Create New Permission
        </button>
      </div>

      {isGroupsLoading ? (
        <p>Loading groups...</p>
      ) : (
        <table style={{ borderCollapse: "collapse", width: "100%" }}>
          <thead>
            <tr>
              <th style={thStyle}>ID</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Description</th>
              <th style={thStyle}>Active</th>
              <th style={thStyle}>Permissions</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {dataGroupPermission?.founds
              ?.filter((role: Role) => role.is_active)
              .map((role: Role) => (
                <tr key={role.id}>
                  <td style={tdStyle}>{role.id}</td>
                  <td style={tdStyle}>{role.name}</td>
                  <td style={tdStyle}>{role.description}</td>
                  <td style={tdStyle}>Yes</td>
                  <td style={tdStyle}>
                    <ul style={{ margin: 0, paddingLeft: 16 }}>
                      {role.permissions.map((perm) => (
                        <li key={perm.id}>
                          {perm.name} ({perm.action})
                        </li>
                      ))}
                    </ul>
                  </td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => handleDelete(role.id)}
                      style={{
                        padding: "6px 12px",
                        backgroundColor: "#e53935",
                        color: "white",
                        border: "none",
                        borderRadius: 4,
                        cursor: "pointer",
                      }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      )}

      {/* Popup Create Group */}
      {open && (
        <div style={overlayStyle}>
          <div style={{ ...modalStyle, maxWidth: 600 }}>
            <div style={headerStyle}>
              <h2>Create New Group</h2>
              <button onClick={() => setOpen(false)} style={closeBtnStyle}>
                ×
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div style={formGroup}>
                <label style={labelStyle}>Group Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  style={inputStyle}
                />
              </div>

              <div style={formGroup}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  style={{ ...inputStyle, height: 80 }}
                />
              </div>

              <div style={formGroup}>
                <label style={labelStyle}>Permissions</label>
                <button
                  type="button"
                  onClick={() => setPermissionModalOpen(true)}
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#1976d2",
                    color: "#fff",
                    border: "none",
                    borderRadius: 6,
                    cursor: "pointer",
                  }}
                >
                  Choose Permissions
                </button>
                {selectedPermissions.length > 0 && (
                  <p style={{ marginTop: 8 }}>
                    Selected IDs: {selectedPermissions.join(", ")}
                  </p>
                )}
              </div>

              <div style={footerStyle}>
                <button type="submit" style={submitBtnStyle}>
                  Create Group
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  style={cancelBtnStyle}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>

          {/* Nested Permission Modal */}
          {permissionModalOpen && (
            <div style={overlayInnerStyle}>
              <div style={{ ...modalStyle, maxWidth: 1200 }}>
                <h3>Select Permissions</h3>
                {isPermissionsLoading ? (
                  <p>Loading permissions...</p>
                ) : (
                  <>
                    {/* Filter Row */}
                    <div style={{ marginBottom: 10, display: "flex", gap: 10 }}>
                      <input
                        type="text"
                        placeholder="Search name..."
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        style={inputStyle}
                      />
                      <select
                        value={resource}
                        onChange={(e) => setResource(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">All Resources</option>
                        <option value="user">user</option>
                        <option value="installation">installation</option>
                        <option value="measurement">measurement</option>
                        <option value="logistic">logistic</option>
                        <option value="invoice">invoice</option>
                      </select>
                      <select
                        value={action}
                        onChange={(e) => setAction(e.target.value)}
                        style={inputStyle}
                      >
                        <option value="">All Actions</option>
                        <option value="create">create</option>
                        <option value="read">read</option>
                        <option value="update">update</option>
                        <option value="delete">delete</option>
                      </select>
                    </div>

                    <div
                      style={{
                        maxHeight: 400,
                        overflowY: "auto",
                        border: "1px solid #ddd",
                      }}
                    >
                      {permissions.map((perm) => (
                        <div
                          key={perm.id}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "50px 1fr 1fr 1fr",
                            padding: "8px 12px",
                            borderBottom: "1px solid #eee",
                            alignItems: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => handlePermissionSelect(perm.id)}
                          />
                          <div>{perm.name}</div>
                          <div>{perm.resource}</div>
                          <div>{perm.action}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
                <div style={{ textAlign: "right", marginTop: 16 }}>
                  <button
                    onClick={() => setPermissionModalOpen(false)}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: "#4caf50",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      cursor: "pointer",
                    }}
                  >
                    Done
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// --- Styles ---
const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f2f2f2",
  textAlign: "left",
};
const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
};
const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0,0,0,0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};
const overlayInnerStyle = {
  ...overlayStyle,
  backgroundColor: "rgba(0,0,0,0.2)",
};
const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 12,
  padding: "25px 30px",
  position: "relative",
  width: "90%",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
};
const headerStyle: React.CSSProperties = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: 20,
};
const closeBtnStyle: React.CSSProperties = {
  background: "none",
  border: "none",
  fontSize: 24,
  cursor: "pointer",
};
const formGroup = { marginBottom: 16 };
const labelStyle = { display: "block", marginBottom: 6, fontWeight: "bold" };
const inputStyle = {
  padding: "8px 10px",
  borderRadius: 6,
  border: "1px solid #ccc",
  width: "100%",
};
const footerStyle = { display: "flex", justifyContent: "flex-end", gap: 10 };
const submitBtnStyle = {
  padding: "10px 20px",
  backgroundColor: "#4CAF50",
  color: "#fff",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};
const cancelBtnStyle = {
  padding: "10px 20px",
  backgroundColor: "#ccc",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

export default GroupPermission;
