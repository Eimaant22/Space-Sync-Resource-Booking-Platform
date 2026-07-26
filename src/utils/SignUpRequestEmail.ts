import transporter from '../config/mailer';
import env from '../config/env';

export const sendSignupApprovedEmail = async (
  email: string,
  name: string
) => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Signup Request Approved',
    html: `
      <h2>Congratulations ${name}!</h2>

      <p>Your signup request has been approved by the platform administrator.</p>

      <p>You may now log in using your registered email and password.</p>

      <br/>

      <p>Regards,</p>
      <p>SpaceSync-Resource Booking Platform</p>
    `,
  });
};

export const sendSignupRejectedEmail = async (
  email: string,
  name: string
) => {
  await transporter.sendMail({
    from: env.MAIL_FROM,
    to: email,
    subject: 'Signup Request Rejected',
    html: `
      <h2>Hello ${name}</h2>

      <p>Unfortunately your signup request has been rejected by the platform administrator.</p>

      <p>If you believe this was a mistake, please contact the administrator.</p>

      <br/>

      <p>Regards,</p>
      <p>SpaceSync-Resource Booking Platform</p>
    `,
  });
};