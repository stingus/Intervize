import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Alert,
  Button,
  CircularProgress,
  Stepper,
  Step,
  StepLabel,
  IconButton,
} from '@mui/material';
import { QrCodeScanner, Close, RestartAlt } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { laptopService } from '../services/laptopService';
import { checkoutService } from '../services/checkoutService';
import { QRScanner } from '../components/QRScanner';
import { LaptopActionCard } from '../components/LaptopActionCard';
import type { Laptop } from '../types';

type ScanStep = 'idle' | 'scanning' | 'processing' | 'action' | 'completed';

export const QRScanPage = () => {
  const [step, setStep] = useState<ScanStep>('idle');
  const [laptop, setLaptop] = useState<Laptop | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { data: currentCheckout, refetch: refetchCurrentCheckout } = useQuery({
    queryKey: ['currentCheckout'],
    queryFn: checkoutService.getCurrentUserCheckout,
  });

  const extractUniqueIdFromUrl = (url: string): string | null => {
    try {
      // Expected format: http://localhost:3001/scan/{uniqueId}
      // Also support: http://localhost:3001/laptops/{uniqueId}
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);

      // Check if it's a valid scan URL
      if (pathParts.length >= 2 && (pathParts[0] === 'scan' || pathParts[0] === 'laptops')) {
        return pathParts[1] ?? null;
      }

      return null;
    } catch {
      return null;
    }
  };

  const handleScanSuccess = async (decodedText: string) => {
    if (step !== 'scanning') return;

    setStep('processing');
    setError(null);

    // Extract unique ID from URL
    const extractedId = extractUniqueIdFromUrl(decodedText);

    if (!extractedId) {
      setError(
        'Invalid QR code. Please scan a valid laptop QR code. Expected format: http://localhost:3001/scan/{uniqueId}'
      );
      setStep('scanning');
      return;
    }

    try {
      // Fetch laptop details
      const laptopData = await laptopService.getLaptopByUniqueId(extractedId);
      setLaptop(laptopData);
      setStep('action');
      await refetchCurrentCheckout();
    } catch (err: any) {
      console.error('Failed to fetch laptop:', err);
      setError(
        err.response?.data?.error?.message ||
          'Failed to fetch laptop details. Please try again.'
      );
      setStep('scanning');
    }
  };

  const handleStartScanning = () => {
    setStep('scanning');
    setError(null);
    setLaptop(null);
  };

  const handleStopScanning = () => {
    setStep('idle');
    setError(null);
  };

  const handleActionComplete = () => {
    setStep('completed');
    setTimeout(() => {
      handleReset();
    }, 3000);
  };

  const handleReset = () => {
    setStep('idle');
    setError(null);
    setLaptop(null);
  };

  const getStepIndex = () => {
    switch (step) {
      case 'idle':
        return 0;
      case 'scanning':
        return 1;
      case 'processing':
        return 2;
      case 'action':
        return 3;
      case 'completed':
        return 4;
      default:
        return 0;
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">QR Code Scanner</Typography>
        {step !== 'idle' && step !== 'completed' && (
          <IconButton onClick={handleReset} color="primary">
            <RestartAlt />
          </IconButton>
        )}
      </Box>

      {/* Progress Stepper */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Stepper activeStep={getStepIndex()} alternativeLabel>
            <Step>
              <StepLabel>Start</StepLabel>
            </Step>
            <Step>
              <StepLabel>Scanning</StepLabel>
            </Step>
            <Step>
              <StepLabel>Processing</StepLabel>
            </Step>
            <Step>
              <StepLabel>Action</StepLabel>
            </Step>
            <Step>
              <StepLabel>Complete</StepLabel>
            </Step>
          </Stepper>
        </CardContent>
      </Card>

      {/* Error Display */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Idle State */}
      {step === 'idle' && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '400px',
                gap: 3,
              }}
            >
              <QrCodeScanner sx={{ fontSize: 100, color: 'primary.main' }} />

              <Typography variant="h6" align="center">
                Ready to Scan
              </Typography>

              <Typography variant="body2" color="text.secondary" align="center" sx={{ maxWidth: 500 }}>
                Click the button below to start scanning laptop QR codes. Make sure to allow
                camera access when prompted.
              </Typography>

              <Button
                variant="contained"
                color="primary"
                size="large"
                startIcon={<QrCodeScanner />}
                onClick={handleStartScanning}
              >
                Start Camera
              </Button>

              <Alert severity="info" sx={{ maxWidth: 600, mt: 2 }}>
                <Typography variant="body2" fontWeight="bold" gutterBottom>
                  How to use:
                </Typography>
                <Typography variant="body2" component="div">
                  <ol style={{ margin: 0, paddingLeft: '1.5rem' }}>
                    <li>Click "Start Camera" to activate your device camera</li>
                    <li>Point your camera at the laptop QR code</li>
                    <li>Wait for automatic detection</li>
                    <li>Choose your action (checkout, checkin, report lost/found)</li>
                  </ol>
                </Typography>
              </Alert>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Scanning State */}
      {step === 'scanning' && (
        <Card>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Scanning for QR Code...</Typography>
              <IconButton onClick={handleStopScanning} color="error">
                <Close />
              </IconButton>
            </Box>

            <QRScanner
              onScanSuccess={handleScanSuccess}
              onScanError={(err) => console.error('Scan error:', err)}
              isScanning={step === 'scanning'}
            />
          </CardContent>
        </Card>
      )}

      {/* Processing State */}
      {step === 'processing' && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                gap: 3,
              }}
            >
              <CircularProgress size={60} />
              <Typography variant="h6">Processing QR Code...</Typography>
              <Typography variant="body2" color="text.secondary">
                Fetching laptop details
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Action State */}
      {step === 'action' && laptop && (
        <Box>
          <Alert severity="success" sx={{ mb: 2 }}>
            QR Code scanned successfully! Choose an action below.
          </Alert>
          <LaptopActionCard
            laptop={laptop}
            currentCheckout={currentCheckout ?? null}
            onActionComplete={handleActionComplete}
          />
        </Box>
      )}

      {/* Completed State */}
      {step === 'completed' && (
        <Card>
          <CardContent>
            <Box
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '300px',
                gap: 3,
              }}
            >
              <QrCodeScanner sx={{ fontSize: 100, color: 'success.main' }} />
              <Typography variant="h5" color="success.main">
                Action Completed!
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Returning to start...
              </Typography>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
