import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "react-toastify";
import apiAxios from "../../../../api/api";
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

const API_URL = "https://ec2api.deltatech-backend.com/api/v1/permissions";

const PermissionPage: React.FC = () => {
  const navigate = useNavigate();

  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // 🔹 Lấy giá trị filter từ URL
  const resource = searchParams.get("resource") || "";
  const action = searchParams.get("action") || "";
  const name = searchParams.get("name") || "";

  const [formData, setFormData] = useState<Omit<any, "id">>({
    name: "",
    resource: "",
    action: "",
  });

  const [openDialog, setOpenDialog] = useState(false);

  // 🔹 URL động dựa theo filter
  const queryUrl = useMemo(() => {
    const params = new URLSearchParams();
    if (resource) params.append("resource", resource);
    if (action) params.append("action", action);
    if (name) params.append("name", name);
    return `${API_URL}?${params.toString()}`;
  }, [resource, action, name]);

  // 🔹 Lấy danh sách Permission
  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["permissions", queryUrl],
    queryFn: async () => {
      const res = await apiAxios.get(queryUrl);
      return res.data;
    },
  });

  // --- 2️⃣ Thêm state local ---
  const [nameInput, setNameInput] = useState(name);

  // --- 3️⃣ Debounce giá trị nhập ---
  const debouncedName = useDebounce(nameInput, 500);

  // --- 4️⃣ Cập nhật URL sau khi debounce ổn định ---
  useEffect(() => {
    // chỉ cập nhật nếu khác với current URL param
    if (debouncedName !== name) {
      const newParams = new URLSearchParams(searchParams);
      if (debouncedName) newParams.set("name", debouncedName);
      else newParams.delete("name");
      setSearchParams(newParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedName]);

  // Mutation Delete

  const [deletingId, setDeletingId] = useState<number | null>(null);

  const mutationDelete = useMutation({
    mutationFn: async (id: number) => {
      setDeletingId(id); // Ghi nhớ ID đang bị xóa
      await apiAxios.delete(
        `https://ec2api.deltatech-backend.com/api/v1/permissions/${id}`
      );
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      toast.success("Permission deleted successfully!");
    },
    onError: () => {
      toast.error("Failed to delete permission.");
    },
    onSettled: () => {
      setDeletingId(null); // Reset sau khi xóa xong hoặc lỗi
    },
  });

  // 🔹 Mutation thêm mới
  const mutation = useMutation({
    mutationFn: async (newPermission: Omit<Permission, "id">) => {
      await apiAxios.post(API_URL, newPermission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });

      toast.success("Permission added successfully!");
      setFormData({
        name: "",
        resource: "",
        action: "",
      });
      setOpenDialog(false);
    },
    onError: () => {
      toast.error("Failed to add permission.");
    },
  });

  // 🔹 Cập nhật URL khi thay đổi filter
  const handleFilterChange = (key: string, value: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    setSearchParams(newParams);
  };

  // 🔹 Form thay đổi
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = () => {
    mutation.mutate(formData);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate("/home/admin/groupPermission")}
            className="px-3 py-2 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition"
          >
            <ArrowBackIcon />
          </button>

          <Typography variant="h4" gutterBottom>
            Permissions Management
          </Typography>
        </div>

        <button
          onClick={() => setOpenDialog(true)}
          className="px-2 py-5 bg-[#1976d2] text-white rounded-md hover:bg-[#27b771] transition duration-300 ease-in-out min-w-[120px]"
        >
          + Add
        </button>
      </div>

      {/* 🔹 Bảng dữ liệu + Bộ lọc trong header */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            {/* Tiêu đề cột */}
            <TableRow>
              <TableCell sx={{ width: "10%" }}>
                <strong>No.</strong>
              </TableCell>
              <TableCell sx={{ width: "30%" }}>
                <strong>Name</strong>
              </TableCell>
              <TableCell sx={{ width: "30%" }}>
                <strong>Resource</strong>
              </TableCell>
              <TableCell sx={{ width: "30%" }}>
                <strong>Action</strong>
              </TableCell>
              <TableCell sx={{ width: "30%" }}>
                <strong>Delete</strong>
              </TableCell>
            </TableRow>

            {/* Hàng filter ngay bên dưới tiêu đề */}
            <TableRow>
              <TableCell></TableCell>

              {/* Filter Name */}
              <TableCell>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Name"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                />
              </TableCell>

              {/* Filter Resource */}
              <TableCell>
                <Select
                  fullWidth
                  size="small"
                  displayEmpty
                  value={resource}
                  onChange={(e) =>
                    handleFilterChange("resource", e.target.value)
                  }
                >
                  <MenuItem value="">All</MenuItem>
                  {[
                    "user",
                    "installation",
                    "measurement",
                    "logistic",
                    "invoice",
                  ].map((r) => (
                    <MenuItem key={r} value={r}>
                      {r}
                    </MenuItem>
                  ))}
                </Select>
              </TableCell>

              {/* Filter Action */}
              <TableCell>
                <Box display="flex" alignItems="center" gap={1}>
                  <Select
                    fullWidth
                    size="small"
                    displayEmpty
                    value={action}
                    onChange={(e) =>
                      handleFilterChange("action", e.target.value)
                    }
                  >
                    <MenuItem value="">All</MenuItem>
                    {["create", "read", "update", "delete"].map((a) => (
                      <MenuItem key={a} value={a}>
                        {a}
                      </MenuItem>
                    ))}
                  </Select>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={4}>Loading...</TableCell>
              </TableRow>
            ) : permissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4}>No results found.</TableCell>
              </TableRow>
            ) : (
              permissions.map((perm, index) => (
                <TableRow key={perm.id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>
                    {perm.name
                      .replace(/_/g, " ") // thay dấu _ bằng dấu cách
                      .replace(/\b\w/g, (char: any) => char.toUpperCase())}{" "}
                    {/* viết hoa chữ cái đầu */}
                  </TableCell>

                  <TableCell>{perm.resource}</TableCell>
                  <TableCell>{perm.action}</TableCell>
                  <TableCell>
                    <IconButton
                      color="error"
                      onClick={() => mutationDelete.mutate(perm.id)}
                      disabled={deletingId === perm.id}
                    >
                      {deletingId === perm.id ? (
                        <CircularProgress size={20} color="error" />
                      ) : (
                        <DeleteIcon />
                      )}
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* 🔹 Dialog thêm mới */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Add New Permission</DialogTitle>

        <DialogContent dividers>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            {Object.keys(formData).map((key) => {
              const label = key.charAt(0).toUpperCase() + key.slice(1);

              if (key === "action") {
                return (
                  <TextField
                    select
                    key={key}
                    name={key}
                    label="Action"
                    value={(formData as any)[key]}
                    onChange={handleChange}
                    fullWidth
                  >
                    {["create", "read", "update", "delete"].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              if (key === "resource") {
                return (
                  <TextField
                    select
                    key={key}
                    name={key}
                    label="Resource"
                    value={(formData as any)[key]}
                    onChange={handleChange}
                    fullWidth
                  >
                    {[
                      "user",
                      "installation",
                      "measurement",
                      "logistic",
                      "invoice",
                    ].map((option) => (
                      <MenuItem key={option} value={option}>
                        {option}
                      </MenuItem>
                    ))}
                  </TextField>
                );
              }

              return (
                <TextField
                  key={key}
                  name={key}
                  label={label}
                  value={(formData as any)[key]}
                  onChange={handleChange}
                  fullWidth
                />
              );
            })}
          </Box>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Submitting..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PermissionPage;
