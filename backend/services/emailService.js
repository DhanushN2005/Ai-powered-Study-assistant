const { Resend } = require('resend');

const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY || 're_RBDVghEB_45eij1nSk3qegkbJRviunz86';
if (!apiKey) {
    console.warn('⚠️ RESEND_API_KEY is missing. Email features will not work.');
}
const resend = new Resend(apiKey);

/**
 * Send email notification for a new reply
 * @param {string} to - Recipient email
 * @param {string} discussionTitle - Title of the discussion
 * @param {string} replierName - Name of the person who replied
 * @param {string} discussionId - ID of the discussion for linking
 */
const sendReplyNotification = async (to, discussionTitle, replierName, discussionId) => {
    try {
        const { data, error } = await resend.emails.send({
            from: 'AI Study Assistant <noreply@dhanu.in>',
            to: [to],
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
            If the button doesn't work, copy link into your browser: 
            ${process.env.FRONTEND_URL || 'http://localhost:3000'}/discussions/${discussionId}
          </p>
        </div>
      `,
        });

        if (error) {
            console.error('Error sending email:', error);
            return;
        }

        console.log(`Email sent to ${to}, ID: ${data.id}`);
    } catch (error) {
        console.error('Error sending email:', error);
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
        const { data, error } = await resend.emails.send({
            from: 'AI Study Assistant <noreply@dhanu.in>',
            to: [to],
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
            If the button doesn't work, copy link into your browser: 
            ${link}
          </p>
        </div>
      `,
        });

        if (error) {
            console.error('Error sending assignment email:', error);
            return;
        }

        console.log(`Assignment email sent to ${to}, ID: ${data.id}`);
    } catch (error) {
        console.error('Error sending assignment email:', error);
    }
};

module.exports = {
    sendReplyNotification,
    sendAssignmentNotification
};
