const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail', // e.g., 'gmail'
    auth: {
        user: process.env.EMAIL_USER || process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD,
    },
});

/**
 * Send email notification for a new reply
 * @param {string} to - Recipient email
 * @param {string} discussionTitle - Title of the discussion
 * @param {string} replierName - Name of the person who replied
 * @param {string} discussionId - ID of the discussion for linking
 */
const sendReplyNotification = async (to, discussionTitle, replierName, discussionId) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"AI Study Assistant" <noreply@studyassistant.com>',
            to,
            subject: `New Reply to: ${discussionTitle}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Reply Received!</h2>
          <p>Hello,</p>
          <p><strong>${replierName}</strong> has just replied to your discussion thread: <strong>"${discussionTitle}"</strong>.</p>
          <p>Click the button below to view the discussion:</p>
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/discussions/${discussionId}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Discussion
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            If the button doesn't work, copy loop into your browser: 
            ${process.env.FRONTEND_URL || 'http://localhost:3000'}/discussions/${discussionId}
          </p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error('Error sending email:', error);
        // Don't throw error to prevent blocking the request flow
    }
};

/**
 * Send email notification for a new assignment (Material or Quiz)
 * @param {string} to - Recipient email
 * @param {string} type - 'Material' or 'Quiz'
 * @param {string} title - Title of the assignment
 * @param {string} instructorName - Name of the instructor
 * @param {string} link - Link to the assignment
 */
const sendAssignmentNotification = async (to, type, title, instructorName, link) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM || '"AI Study Assistant" <noreply@studyassistant.com>',
            to,
            subject: `New ${type} Assigned: ${title}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>New Assignment Received!</h2>
          <p>Hello,</p>
          <p>Instructor <strong>${instructorName}</strong> has assigned a new ${type.toLowerCase()} to you:</p>
          <p style="font-size: 18px; font-weight: bold; margin: 20px 0;">${title}</p>
          
          <a href="${link}" 
             style="display: inline-block; padding: 10px 20px; background-color: #4F46E5; color: white; text-decoration: none; border-radius: 5px; margin-top: 10px;">
            View Assignment
          </a>
          <p style="margin-top: 20px; color: #666; font-size: 12px;">
            If the button doesn't work, copy loop into your browser: 
            ${link}
          </p>
        </div>
      `,
        };

        await transporter.sendMail(mailOptions);
        console.log(`Assignment email sent to ${to}`);
    } catch (error) {
        console.error('Error sending assignment email:', error);
    }
};

module.exports = {
    sendReplyNotification,
    sendAssignmentNotification
};
