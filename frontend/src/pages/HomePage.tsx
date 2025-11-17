import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  Alert,
  Chip,
  CircularProgress,
} from '@mui/material';
import { QrCodeScanner, CheckCircle } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { checkoutService } from '../services/checkoutService';
import { useAuth } from '../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

export const HomePage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutDuration, setCheckoutDuration] = useState<string>('');

  const { data: currentCheckout, isLoading, error } = useQuery({
    queryKey: ['currentCheckout'],
    queryFn: checkoutService.getCurrentUserCheckout,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  useEffect(() => {
    if (currentCheckout?.checkedOutAt) {
      const updateDuration = () => {
        const duration = formatDistanceToNow(new Date(currentCheckout.checkedOutAt), {
          includeSeconds: true,
        });
        setCheckoutDuration(duration);
      };

      updateDuration();
      const interval = setInterval(updateDuration, 1000);

      return () => clearInterval(interval);
    }
  }, [currentCheckout]);

  const isOverdue = currentCheckout
    ? new Date().getTime() - new Date(currentCheckout.checkedOutAt).getTime() > 24 * 60 * 60 * 1000
    : false;

  const isApproaching3Hours = currentCheckout
    ? new Date().getTime() - new Date(currentCheckout.checkedOutAt).getTime() > 2.5 * 60 * 60 * 1000
    : false;

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Welcome, {user?.name}!
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          Failed to load checkout information. Please try again.
        </Alert>
      )}

      <Grid container spacing={3}>
        {/* Current Checkout Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Current Checkout
              </Typography>

              {currentCheckout ? (
                <Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Laptop Details
                    </Typography>
                    <Typography variant="h6">
                      {currentCheckout.laptop?.make} {currentCheckout.laptop?.model}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Serial: {currentCheckout.laptop?.serialNumber}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Duration
                    </Typography>
                    <Typography variant="h5" color={isOverdue ? 'error' : isApproaching3Hours ? 'warning.main' : 'success.main'}>
                      {checkoutDuration}
                    </Typography>
                    {isOverdue && (
                      <Chip label="OVERDUE" color="error" size="small" sx={{ mt: 1 }} />
                    )}
                    {isApproaching3Hours && !isOverdue && (
                      <Chip label="Approaching 3 hours" color="warning" size="small" sx={{ mt: 1 }} />
                    )}
                  </Box>

                  {isOverdue && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                      This laptop is overdue! Please return it immediately.
                    </Alert>
                  )}

                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    startIcon={<QrCodeScanner />}
                    onClick={() => navigate('/scan')}
                    size="large"
                  >
                    Scan to Check-in
                  </Button>
                </Box>
              ) : (
                <Box sx={{ textAlign: 'center', py: 3 }}>
                  <CheckCircle sx={{ fontSize: 48, color: 'success.main', mb: 2 }} />
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    You don't have any laptop checked out.
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Scan a QR code on a laptop to check it out.
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<QrCodeScanner />}
                    onClick={() => navigate('/scan')}
                    size="large"
                  >
                    Scan QR Code
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions Card */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                How It Works
              </Typography>
              <Box component="ol" sx={{ pl: 2 }}>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Find a laptop you want to borrow
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Scan the QR code on the laptop using your mobile device
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Confirm the check-out
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Use the laptop (please return within 3 hours)
                </Typography>
                <Typography component="li" variant="body2" sx={{ mb: 1 }}>
                  Scan the same QR code to check-in when done
                </Typography>
              </Box>

              <Alert severity="warning" sx={{ mt: 3 }}>
                <Typography variant="body2" fontWeight="bold">
                  Important:
                </Typography>
                <Typography variant="body2">
                  Please return laptops within 3 hours. Laptops not returned within 24 hours will be marked as overdue.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
