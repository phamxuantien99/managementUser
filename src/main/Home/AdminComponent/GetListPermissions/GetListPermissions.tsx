import CloseIcon from "@mui/icons-material/Close";
import {
  AppBar,
  Box,
  Button,
  Container,
  Dialog,
  DialogContent,
  IconButton,
  Paper,
  Slide,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Toolbar,
  Typography,
} from "@mui/material";
import { TransitionProps } from "@mui/material/transitions";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import React, { useState } from "react";
import apiAxios from "../../../../api/api";

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

const Transition = React.forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const PermissionPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<Omit<Permission, "id">>({
    name: "",
    resource: "",
    action: "",
    description: "",
    endpoint: "",
    method: "",
  });

  const [openDialog, setOpenDialog] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    success: boolean;
  }>({
    open: false,
    message: "",
    success: true,
  });

  const { data: permissions = [], isLoading } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await apiAxios.get(API_URL);
      return res.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (newPermission: Omit<Permission, "id">) => {
      await apiAxios.post(API_URL, newPermission);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["permissions"] });
      setSnackbar({
        open: true,
        message: "Permission added successfully!",
        success: true,
      });
      setFormData({
        name: "",
        resource: "",
        action: "",
        description: "",
        endpoint: "",
        method: "",
      });
      setOpenDialog(false);
    },
    onError: () => {
      setSnackbar({
        open: true,
        message: "Failed to add permission.",
        success: false,
      });
    },
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  console.log({ formData });

  const handleSubmit = () => {
    mutation.mutate(formData);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>
        Permissions Management
      </Typography>

      <Box textAlign="right" mb={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={() => setOpenDialog(true)}
        >
          + Add Permission
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <strong>Name</strong>
              </TableCell>
              <TableCell>
                <strong>Resource</strong>
              </TableCell>
              <TableCell>
                <strong>Action</strong>
              </TableCell>
              <TableCell>
                <strong>Description</strong>
              </TableCell>
              <TableCell>
                <strong>Endpoint</strong>
              </TableCell>
              <TableCell>
                <strong>Method</strong>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6}>Loading...</TableCell>
              </TableRow>
            ) : (
              permissions.map((perm) => (
                <TableRow key={perm.id}>
                  <TableCell>{perm.name}</TableCell>
                  <TableCell>{perm.resource}</TableCell>
                  <TableCell>{perm.action}</TableCell>
                  <TableCell>{perm.description}</TableCell>
                  <TableCell>{perm.endpoint}</TableCell>
                  <TableCell>{perm.method}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Fullscreen Dialog */}
      <Dialog
        fullScreen
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: "relative" }}>
          <Toolbar>
            <IconButton
              edge="start"
              color="inherit"
              onClick={() => setOpenDialog(false)}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6" component="div">
              Add New Permission
            </Typography>
            <Button
              autoFocus
              color="inherit"
              onClick={handleSubmit}
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Submitting..." : "Save"}
            </Button>
          </Toolbar>
        </AppBar>
        <DialogContent>
          <Box
            display="grid"
            gridTemplateColumns="repeat(2, 1fr)"
            gap={2}
            mt={3}
          >
            {Object.keys(formData).map((key) => (
              <TextField
                key={key}
                name={key}
                label={key.charAt(0).toUpperCase() + key.slice(1)}
                value={(formData as any)[key]}
                onChange={handleChange}
                fullWidth
              />
            ))}
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        message={snackbar.message}
        autoHideDuration={3000}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        ContentProps={{
          sx: { background: snackbar.success ? "green" : "red" },
        }}
      />
    </Container>
  );
};

export default PermissionPage;
