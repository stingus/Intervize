import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from '@mui/material';
import { CheckCircle, Warning, Laptop, People } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { dashboardService } from '../../services/dashboardService';
import { formatDistanceToNow } from 'date-fns';

export const DashboardPage = () => {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['dashboardSummary'],
    queryFn: dashboardService.getSummary,
    refetchInterval: 30000,
  });

  const { data: activeCheckouts, isLoading: checkoutsLoading } = useQuery({
    queryKey: ['activeCheckouts'],
    queryFn: dashboardService.getActiveCheckouts,
    refetchInterval: 30000,
  });

  const { data: overdueCheckouts } = useQuery({
    queryKey: ['overdueCheckouts'],
    queryFn: dashboardService.getOverdueCheckouts,
    refetchInterval: 30000,
  });

  const { data: lostFoundEvents } = useQuery({
    queryKey: ['lostFoundEvents'],
    queryFn: dashboardService.getLostFoundEvents,
  });

  const isOverdue = (checkedOutAt: string) => {
    const hours = (new Date().getTime() - new Date(checkedOutAt).getTime()) / (1000 * 60 * 60);
    return hours > 24;
  };

  const isApproaching3Hours = (checkedOutAt: string) => {
    const hours = (new Date().getTime() - new Date(checkedOutAt).getTime()) / (1000 * 60 * 60);
    return hours > 2.5 && hours <= 24;
  };

  if (summaryLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Total Laptops
                  </Typography>
                  <Typography variant="h4">{summary?.totalLaptops || 0}</Typography>
                </Box>
                <Laptop sx={{ fontSize: 40, color: 'primary.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Available
                  </Typography>
                  <Typography variant="h4" color="success.main">
                    {summary?.availableLaptops || 0}
                  </Typography>
                </Box>
                <CheckCircle sx={{ fontSize: 40, color: 'success.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Checked Out
                  </Typography>
                  <Typography variant="h4" color="info.main">
                    {summary?.checkedOutLaptops || 0}
                  </Typography>
                </Box>
                <People sx={{ fontSize: 40, color: 'info.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography color="text.secondary" variant="body2">
                    Overdue
                  </Typography>
                  <Typography variant="h4" color="error.main">
                    {summary?.overdueLaptops || 0}
                  </Typography>
                </Box>
                <Warning sx={{ fontSize: 40, color: 'error.main' }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Overdue Laptops */}
      {overdueCheckouts && overdueCheckouts.length > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom color="error">
              Overdue Laptops
            </Typography>
            <Alert severity="error" sx={{ mb: 2 }}>
              {overdueCheckouts.length} laptop(s) are overdue and need immediate attention!
            </Alert>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Laptop</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {overdueCheckouts.map((checkout) => (
                    <TableRow key={checkout.id}>
                      <TableCell>
                        <Typography variant="body2" fontWeight="bold">
                          {checkout.laptop?.make} {checkout.laptop?.model}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {checkout.laptop?.serialNumber}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{checkout.user?.name}</Typography>
                        <Typography variant="caption" color="text.secondary">
                          {checkout.user?.email}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="error">
                          {formatDistanceToNow(new Date(checkout.checkedOutAt))}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip label="OVERDUE" color="error" size="small" />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}

      {/* Active Checkouts */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Active Checkouts
          </Typography>
          {checkoutsLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress />
            </Box>
          ) : activeCheckouts && activeCheckouts.length > 0 ? (
            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Laptop</TableCell>
                    <TableCell>User</TableCell>
                    <TableCell>Checked Out</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeCheckouts.map((checkout) => {
                    const overdue = isOverdue(checkout.checkedOutAt);
                    const approaching = isApproaching3Hours(checkout.checkedOutAt);

                    return (
                      <TableRow key={checkout.id}>
                        <TableCell>
                          <Typography variant="body2" fontWeight="bold">
                            {checkout.laptop?.make} {checkout.laptop?.model}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {checkout.laptop?.serialNumber}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">{checkout.user?.name}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {checkout.user?.email}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {new Date(checkout.checkedOutAt).toLocaleString()}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography
                            variant="body2"
                            color={overdue ? 'error' : approaching ? 'warning.main' : 'text.primary'}
                          >
                            {formatDistanceToNow(new Date(checkout.checkedOutAt))}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          {overdue ? (
                            <Chip label="Overdue" color="error" size="small" />
                          ) : approaching ? (
                            <Chip label="Approaching 3h" color="warning" size="small" />
                          ) : (
                            <Chip label="Normal" color="success" size="small" />
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Alert severity="info">No active checkouts at the moment.</Alert>
          )}
        </CardContent>
      </Card>

      {/* Lost & Found Events */}
      {lostFoundEvents && lostFoundEvents.length > 0 && (
        <Card sx={{ mt: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recent Lost & Found Events
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Laptop</TableCell>
                    <TableCell>Original User</TableCell>
                    <TableCell>Found By</TableCell>
                    <TableCell>Duration Lost</TableCell>
                    <TableCell>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {lostFoundEvents.slice(0, 5).map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <Typography variant="body2">
                          {event.laptop?.make} {event.laptop?.model}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.originalUser?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{event.finderUser?.name}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {Math.round(event.durationMinutes / 60)} hours
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(event.eventTimestamp).toLocaleDateString()}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
