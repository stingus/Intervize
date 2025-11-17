import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Box, Typography, Alert, CircularProgress } from '@mui/material';

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
  isScanning: boolean;
}

export const QRScanner = ({ onScanSuccess, onScanError, isScanning }: QRScannerProps) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    let mounted = true;
    const qrCodeRegionId = 'qr-reader';

    const initScanner = async () => {
      try {
        // Check if camera is available
        const cameras = await Html5Qrcode.getCameras();
        if (!cameras || cameras.length === 0) {
          setCameraError('No camera found on this device');
          setIsInitializing(false);
          return;
        }

        if (!mounted) return;

        // Initialize scanner
        const html5QrCode = new Html5Qrcode(qrCodeRegionId);
        scannerRef.current = html5QrCode;

        if (!mounted) return;

        // Start scanning - prefer back camera on mobile
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        };

        // Try to use back camera first (for mobile devices)
        const cameraId = cameras.length > 1 && cameras.find(c => c.label.toLowerCase().includes('back'))?.id || cameras[0]?.id;

        await html5QrCode.start(
          cameraId || { facingMode: 'environment' },
          config,
          (decodedText) => {
            if (mounted && isScanning) {
              onScanSuccess(decodedText);
            }
          },
          (errorMessage) => {
            // Silent error handling - QR scanning errors are expected when no QR is visible
            if (onScanError && errorMessage && !errorMessage.includes('NotFoundException')) {
              onScanError(errorMessage);
            }
          }
        );

        if (mounted) {
          setIsInitializing(false);
        }
      } catch (error: any) {
        if (mounted) {
          console.error('Failed to initialize scanner:', error);
          setCameraError(
            error.message || 'Failed to access camera. Please ensure camera permissions are granted.'
          );
          setIsInitializing(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .then(() => {
            scannerRef.current?.clear();
            scannerRef.current = null;
          })
          .catch((err) => {
            console.error('Error stopping scanner:', err);
          });
      }
    };
  }, [onScanSuccess, onScanError, isScanning]);

  if (cameraError) {
    return (
      <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          <Typography variant="body2" fontWeight="bold" gutterBottom>
            Camera Access Error
          </Typography>
          <Typography variant="body2">{cameraError}</Typography>
          <Typography variant="body2" sx={{ mt: 1 }}>
            Please check:
          </Typography>
          <ul style={{ margin: '0.5rem 0', paddingLeft: '1.5rem' }}>
            <li>Camera permissions are granted for this website</li>
            <li>Your device has a working camera</li>
            <li>No other application is using the camera</li>
          </ul>
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', maxWidth: 600, mx: 'auto' }}>
      {isInitializing && (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
          <CircularProgress />
          <Typography variant="body2" color="text.secondary">
            Initializing camera...
          </Typography>
        </Box>
      )}

      <Box
        id="qr-reader"
        sx={{
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          '& video': {
            width: '100% !important',
            height: 'auto !important',
            borderRadius: 2,
          },
        }}
      />

      <Alert severity="info" sx={{ mt: 2 }}>
        <Typography variant="body2">
          Position the QR code within the frame. The scan will happen automatically.
        </Typography>
      </Alert>
    </Box>
  );
};
