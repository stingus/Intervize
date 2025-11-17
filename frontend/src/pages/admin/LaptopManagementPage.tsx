import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
  Alert,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Edit,
  Delete,
  QrCode2,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { laptopService } from '../../services/laptopService';
import { LaptopStatus } from '../../types';

const laptopSchema = z.object({
  serialNumber: z.string().min(1, 'Serial number is required'),
  make: z.string().min(1, 'Make is required'),
  model: z.string().min(1, 'Model is required'),
  status: z.nativeEnum(LaptopStatus),
});

type LaptopFormData = z.infer<typeof laptopSchema>;

export const LaptopManagementPage = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingLaptop, setEditingLaptop] = useState<any>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: laptops, isLoading, error } = useQuery({
    queryKey: ['laptops'],
    queryFn: laptopService.getLaptops,
  });

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LaptopFormData>({
    resolver: zodResolver(laptopSchema),
    defaultValues: {
      serialNumber: '',
      make: '',
      model: '',
      status: LaptopStatus.AVAILABLE,
    },
  });

  const createMutation = useMutation({
    mutationFn: laptopService.createLaptop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laptops'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<LaptopFormData> }) =>
      laptopService.updateLaptop(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laptops'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: laptopService.deleteLaptop,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['laptops'] });
      setDeleteConfirm(null);
    },
  });

  const handleOpenDialog = (laptop?: any) => {
    if (laptop) {
      setEditingLaptop(laptop);
      reset({
        serialNumber: laptop.serialNumber,
        make: laptop.make,
        model: laptop.model,
        status: laptop.status,
      });
    } else {
      setEditingLaptop(null);
      reset({
        serialNumber: '',
        make: '',
        model: '',
        status: LaptopStatus.AVAILABLE,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingLaptop(null);
    reset();
  };

  const onSubmit = async (data: LaptopFormData) => {
    if (editingLaptop) {
      await updateMutation.mutateAsync({ id: editingLaptop.id, data });
    } else {
      await createMutation.mutateAsync(data);
    }
  };

  const handleDelete = async (id: string) => {
    await deleteMutation.mutateAsync(id);
  };

  const handleDownloadQR = async (laptop: any) => {
    try {
      const blob = await laptopService.downloadQRCode(laptop.id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `qr-code-${laptop.uniqueId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download QR code:', error);
    }
  };

  const getStatusColor = (status: LaptopStatus) => {
    switch (status) {
      case LaptopStatus.AVAILABLE:
        return 'success';
      case LaptopStatus.CHECKED_OUT:
        return 'info';
      case LaptopStatus.MAINTENANCE:
        return 'warning';
      case LaptopStatus.RETIRED:
        return 'default';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Laptop Management</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Laptop
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load laptops. Please try again.
        </Alert>
      )}

      <Card>
        <CardContent>
          <TableContainer component={Paper} variant="outlined">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Unique ID</TableCell>
                  <TableCell>Make & Model</TableCell>
                  <TableCell>Serial Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {laptops && laptops.length > 0 ? (
                  laptops.map((laptop) => (
                    <TableRow key={laptop.id}>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {laptop.uniqueId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {laptop.make} {laptop.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{laptop.serialNumber}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={laptop.status.replace('_', ' ').toUpperCase()}
                          color={getStatusColor(laptop.status)}
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download QR Code">
                          <IconButton
                            size="small"
                            onClick={() => handleDownloadQR(laptop)}
                            color="primary"
                          >
                            <QrCode2 />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton
                            size="small"
                            onClick={() => handleOpenDialog(laptop)}
                            color="primary"
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton
                            size="small"
                            onClick={() => setDeleteConfirm(laptop.id)}
                            color="error"
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} align="center">
                      <Typography variant="body2" color="text.secondary" py={3}>
                        No laptops found. Click "Add Laptop" to create one.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogTitle>
            {editingLaptop ? 'Edit Laptop' : 'Add New Laptop'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Controller
                name="make"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Make / Manufacturer"
                    fullWidth
                    error={!!errors.make}
                    helperText={errors.make?.message}
                  />
                )}
              />

              <Controller
                name="model"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Model"
                    fullWidth
                    error={!!errors.model}
                    helperText={errors.model?.message}
                  />
                )}
              />

              <Controller
                name="serialNumber"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Serial Number"
                    fullWidth
                    error={!!errors.serialNumber}
                    helperText={errors.serialNumber?.message}
                  />
                )}
              />

              <Controller
                name="status"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    select
                    label="Status"
                    fullWidth
                    error={!!errors.status}
                    helperText={errors.status?.message}
                  >
                    <MenuItem value={LaptopStatus.AVAILABLE}>Available</MenuItem>
                    <MenuItem value={LaptopStatus.CHECKED_OUT}>Checked Out</MenuItem>
                    <MenuItem value={LaptopStatus.MAINTENANCE}>Maintenance</MenuItem>
                    <MenuItem value={LaptopStatus.RETIRED}>Retired</MenuItem>
                  </TextField>
                )}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <CircularProgress size={24} />
              ) : editingLaptop ? (
                'Update'
              ) : (
                'Create'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this laptop? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(null)}>Cancel</Button>
          <Button
            onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            color="error"
            variant="contained"
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? <CircularProgress size={24} /> : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
