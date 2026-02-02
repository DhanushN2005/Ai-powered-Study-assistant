const { Resend } = require('resend');

const sendEmail = async (options) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    try {
        const { data, error } = await resend.emails.send({
            from: process.env.FROM_EMAIL || 'AI Study Assistant <onboarding@resend.dev>',
            to: [options.email],
            subject: options.subject,
            text: options.message, // Fallback text
            html: options.html || options.message // Use html if provided, else message
        });

        if (error) {
            console.error('Resend API Error:', error);
            throw new Error(error.message);
        }

        console.log('Email sent successfully:', data.id);
    } catch (error) {
        console.error('Send Email Error:', error);
        // Important: Don't crash the server if email fails, but log it
        throw error;
    }
};

module.exports = sendEmail;
