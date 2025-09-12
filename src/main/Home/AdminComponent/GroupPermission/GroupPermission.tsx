import React, { useState } from "react";
import { useGroups } from "../../../service/hooks/useGroup";
import apiAxios from "../../../../api/api";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "react-toastify";

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

const GroupPermission = () => {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissionInput, setPermissionInput] = useState("");
  // const [message, setMessage] = useState("");
  const { data: dataGeroupPermission, isLoading: isGroupsLoading } =
    useGroups();
  const queryClient = useQueryClient();

  // 👉 Submit group creation
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const permission_ids = permissionInput
      .split(",")
      .map((id) => parseInt(id.trim()))
      .filter((id) => !isNaN(id));

    try {
      const body = { name, description, permission_ids };
      await apiAxios.post(
        "https://ec2api.deltatech-backend.com/api/v1/groups",
        body
      );
      queryClient.invalidateQueries({ queryKey: ["groups"] });

      toast.success("✅ Group created successfully!");
      setName("");
      setDescription("");
      setPermissionInput("");
      setTimeout(() => {
        setOpen(false);
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to create group.");
    }
  };

  // 👉 Delete group
  const handleDelete = async (id: number) => {
    const confirm = window.confirm("Bạn có chắc muốn xóa group này?");
    if (!confirm) return;

    try {
      await apiAxios.delete(
        `https://ec2api.deltatech-backend.com/api/v1/groups/${id}`
      );
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      toast.success("Group deleted successfully!");
    } catch (error) {
      console.error("Delete failed", error);
      toast.error("Failed to delete group.");
    }
  };

  return (
    <div>
      <button onClick={() => setOpen(true)} style={buttonOpenStyle}>
        Create New Group
      </button>

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
            {dataGeroupPermission?.founds
              ?.filter((role: Role) => role.is_active) // Lọc chỉ các role có is_active === true
              .map((role: Role) => (
                <tr key={role.id}>
                  <td style={tdStyle}>{role.id}</td>
                  <td style={tdStyle}>{role.name}</td>
                  <td style={tdStyle}>{role.description}</td>
                  <td style={tdStyle}>Yes</td>{" "}
                  {/* Vì đã lọc rồi nên chắc chắn là "Yes" */}
                  <td style={tdStyle}>
                    <table
                      style={{ borderCollapse: "collapse", width: "100%" }}
                    >
                      <thead>
                        <tr>
                          <th style={thStyle}>ID</th>
                          <th style={thStyle}>Name</th>
                          <th style={thStyle}>Resource</th>
                          <th style={thStyle}>Action</th>
                          <th style={thStyle}>Description</th>
                          <th style={thStyle}>Endpoint</th>
                          <th style={thStyle}>Method</th>
                        </tr>
                      </thead>
                      <tbody>
                        {role.permissions.map((perm) => (
                          <tr key={perm.id}>
                            <td style={tdStyle}>{perm.id}</td>
                            <td style={tdStyle}>{perm.name}</td>
                            <td style={tdStyle}>{perm.resource}</td>
                            <td style={tdStyle}>{perm.action}</td>
                            <td style={tdStyle}>{perm.description}</td>
                            <td style={tdStyle}>{perm.endpoint}</td>
                            <td style={tdStyle}>{perm.method}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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

      {open && (
        <div style={overlayStyle}>
          <div style={modalStyle}>
            <div style={headerStyle}>
              <h2 style={{ margin: 0 }}>Create New Group</h2>
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
                  required
                  onChange={(e) => setName(e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={formGroup}>
                <label style={labelStyle}>Description</label>
                <textarea
                  value={description}
                  required
                  onChange={(e) => setDescription(e.target.value)}
                  style={{ ...inputStyle, height: 80 }}
                />
              </div>

              <div style={formGroup}>
                <label style={labelStyle}>
                  Permission IDs (comma-separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1, 2, 3"
                  value={permissionInput}
                  onChange={(e) => setPermissionInput(e.target.value)}
                  style={inputStyle}
                />
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
        </div>
      )}
    </div>
  );
};

// Styles
const thStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  backgroundColor: "#f2f2f2",
  textAlign: "left",
};

const tdStyle: React.CSSProperties = {
  border: "1px solid #ddd",
  padding: "8px",
  verticalAlign: "top",
};

const overlayStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: "rgba(0, 0, 0, 0.5)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  backgroundColor: "#fff",
  borderRadius: 12,
  width: "90%",
  maxWidth: 480,
  padding: "25px 30px",
  boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
  position: "relative",
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
  lineHeight: 1,
  padding: 0,
};

const formGroup: React.CSSProperties = {
  marginBottom: 16,
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontWeight: "bold",
  marginBottom: 6,
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "10px 12px",
  borderRadius: 6,
  border: "1px solid #ccc",
  fontSize: 14,
};

const footerStyle: React.CSSProperties = {
  marginTop: 20,
  display: "flex",
  justifyContent: "flex-end",
  gap: 10,
};

const submitBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#4CAF50",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const cancelBtnStyle: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#ccc",
  color: "#333",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

const buttonOpenStyle: React.CSSProperties = {
  padding: "10px 20px",
  backgroundColor: "#1976d2",
  color: "white",
  border: "none",
  borderRadius: 6,
  cursor: "pointer",
};

export default GroupPermission;
