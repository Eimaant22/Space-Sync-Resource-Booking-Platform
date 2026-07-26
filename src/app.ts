import express from 'express';
import cors from 'cors';

// Routes
import signupRequestRoutes from './routes/signupRequest.routes'
import authRoutes from './routes/auth.routes';
import userRoutes from './routes/user.routes';
import organizationRoutes from './routes/organization.routes';
import resourceRoutes from './routes/resource.routes';
import accessGroupRoutes from './routes/accessGroup.routes';
import bookingRoutes from './routes/booking.routes';
import approvalRoutes from './routes/approval.routes';
import notificationRoutes from './routes/notification.routes';
import analyticsRoutes from './routes/analytics.routes';
import auditLogRoutes from './routes/auditLog.routes';


// Middleware
import errorHandler from './middleware/errorHandler';
import { globalLimiter } from './middleware/rateLimiter';

const app = express();

// Trust the reverse proxy (Render) to correctly parse client IPs for rate limiting
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

app.use('/api', globalLimiter);

// Routes
app.use('/api/signup-requests', signupRequestRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/organizations', organizationRoutes);
app.use('/api/resources', resourceRoutes);
app.use('/api/access-groups', accessGroupRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/audit-logs', auditLogRoutes);




// Health Check
app.get('/api/health', (_req, res) => {
    res.json({
        success: true,
        data: {
            message: 'Server is running.',
        },
    });
});

// Global Error Handler
app.use(errorHandler);

export default app;