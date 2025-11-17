import { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  Box,
  Chip,
  Alert,
  CircularProgress,
  Stack,
  Divider,
} from '@mui/material';
import {
  CheckCircle,
  ReportProblem,
  FindInPage,
  Laptop,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { checkoutService } from '../services/checkoutService';
import { useAuth } from '../contexts/AuthContext';
import type { Laptop as LaptopType, Checkout, LaptopStatus } from '../types';

interface LaptopActionCardProps {
  laptop: LaptopType;
  currentCheckout: Checkout | null;
  onActionComplete: () => void;
}

export const LaptopActionCard = ({
  laptop,
  currentCheckout,
  onActionComplete,
}: LaptopActionCardProps) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [actionResult, setActionResult] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const checkoutMutation = useMutation({
    mutationFn: (data: { laptopUniqueId: string; userId: string }) =>
      checkoutService.checkout(data),
    onSuccess: () => {
      setActionResult({
        type: 'success',
        message: 'Laptop checked out successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['currentCheckout'] });
      setTimeout(() => {
        onActionComplete();
      }, 2000);
    },
    onError: (error: any) => {
      setActionResult({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to checkout laptop',
      });
    },
  });

  const checkinMutation = useMutation({
    mutationFn: (data: { laptopUniqueId: string }) =>
      checkoutService.checkinByUniqueId(data),
    onSuccess: () => {
      setActionResult({
        type: 'success',
        message: 'Laptop checked in successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['currentCheckout'] });
      setTimeout(() => {
        onActionComplete();
      }, 2000);
    },
    onError: (error: any) => {
      setActionResult({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to checkin laptop',
      });
    },
  });

  const reportLostMutation = useMutation({
    mutationFn: (data: { laptopUniqueId: string }) =>
      checkoutService.reportLost(data),
    onSuccess: (data) => {
      setActionResult({
        type: 'success',
        message: data.message || 'Laptop reported as lost successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['currentCheckout'] });
      setTimeout(() => {
        onActionComplete();
      }, 2000);
    },
    onError: (error: any) => {
      setActionResult({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to report laptop as lost',
      });
    },
  });

  const reportFoundMutation = useMutation({
    mutationFn: (data: { laptopUniqueId: string; finderUserId: string }) =>
      checkoutService.reportFound(data),
    onSuccess: () => {
      setActionResult({
        type: 'success',
        message: 'Laptop reported as found and returned successfully!',
      });
      queryClient.invalidateQueries({ queryKey: ['currentCheckout'] });
      setTimeout(() => {
        onActionComplete();
      }, 2000);
    },
    onError: (error: any) => {
      setActionResult({
        type: 'error',
        message: error.response?.data?.error?.message || 'Failed to report laptop as found',
      });
    },
  });

  const handleCheckout = () => {
    if (!user) return;
    checkoutMutation.mutate({
      laptopUniqueId: laptop.uniqueId,
      userId: user.id,
    });
  };

  const handleCheckin = () => {
    checkinMutation.mutate({
      laptopUniqueId: laptop.uniqueId,
    });
  };

  const handleReportLost = () => {
    reportLostMutation.mutate({
      laptopUniqueId: laptop.uniqueId,
    });
  };

  const handleReportFound = () => {
    if (!user) return;
    reportFoundMutation.mutate({
      laptopUniqueId: laptop.uniqueId,
      finderUserId: user.id,
    });
  };

  const getStatusColor = (status: LaptopStatus) => {
    switch (status) {
      case 'available':
        return 'success';
      case 'checked_out':
        return 'warning';
      case 'maintenance':
        return 'info';
      case 'retired':
        return 'error';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: LaptopStatus) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const isLoading =
    checkoutMutation.isPending ||
    checkinMutation.isPending ||
    reportLostMutation.isPending ||
    reportFoundMutation.isPending;

  const userHasCurrentCheckout = currentCheckout !== null;
  const isThisLaptopCheckedOutByUser =
    currentCheckout?.laptop?.uniqueId === laptop.uniqueId;
  const canCheckout = laptop.status === 'available' && !userHasCurrentCheckout;
  const canCheckin = isThisLaptopCheckedOutByUser;
  const canReportLost = isThisLaptopCheckedOutByUser;
  const canReportFound = laptop.status === 'checked_out' && !isThisLaptopCheckedOutByUser;

  return (
    <Card sx={{ maxWidth: 600, mx: 'auto' }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Laptop sx={{ fontSize: 48, color: 'primary.main' }} />
          <Box sx={{ flex: 1 }}>
            <Typography variant="h5" gutterBottom>
              {laptop.make} {laptop.model}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Serial: {laptop.serialNumber}
            </Typography>
            <Chip
              label={getStatusLabel(laptop.status)}
              color={getStatusColor(laptop.status)}
              size="small"
              sx={{ mt: 1 }}
            />
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        {actionResult && (
          <Alert severity={actionResult.type} sx={{ mb: 2 }}>
            {actionResult.message}
          </Alert>
        )}

        {userHasCurrentCheckout && !isThisLaptopCheckedOutByUser && (
          <Alert severity="info" sx={{ mb: 2 }}>
            You currently have another laptop checked out. Please check it in first before
            checking out a new one.
          </Alert>
        )}

        {laptop.status === 'maintenance' && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            This laptop is currently under maintenance and cannot be checked out.
          </Alert>
        )}

        {laptop.status === 'retired' && (
          <Alert severity="error" sx={{ mb: 2 }}>
            This laptop has been retired and is no longer available.
          </Alert>
        )}

        <Stack spacing={2}>
          {canCheckout && (
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
              onClick={handleCheckout}
              disabled={isLoading}
            >
              Checkout Laptop
            </Button>
          )}

          {canCheckin && (
            <Button
              variant="contained"
              color="success"
              size="large"
              fullWidth
              startIcon={isLoading ? <CircularProgress size={20} /> : <CheckCircle />}
              onClick={handleCheckin}
              disabled={isLoading}
            >
              Check-in Laptop
            </Button>
          )}

          {canReportLost && (
            <Button
              variant="outlined"
              color="error"
              size="large"
              fullWidth
              startIcon={isLoading ? <CircularProgress size={20} /> : <ReportProblem />}
              onClick={handleReportLost}
              disabled={isLoading}
            >
              Report as Lost
            </Button>
          )}

          {canReportFound && (
            <Button
              variant="outlined"
              color="primary"
              size="large"
              fullWidth
              startIcon={isLoading ? <CircularProgress size={20} /> : <FindInPage />}
              onClick={handleReportFound}
              disabled={isLoading}
            >
              Report as Found
            </Button>
          )}

          {!canCheckout && !canCheckin && !canReportLost && !canReportFound && (
            <Alert severity="info">
              No actions available for this laptop at the moment.
            </Alert>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
};
