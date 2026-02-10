import 'server-only'
import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail({
  to,
  subject,
  html,
  text
}: {
  to: string
  subject: string
  html: string
  text: string
}) {
  await transporter.sendMail({
    from: process.env.SMTP_FROM || 'noreply@projectmgmt.com',
    to,
    subject,
    text,
    html,
  })
}

// Templates Helper
export const EmailTemplates = {
  invitation: ({ inviterName, organizationName, invitationUrl, role }: any) => ({
    subject: `You're invited to join ${organizationName}`,
    html: `
            <h1>You're Invited!</h1>
            <p>${inviterName} has invited you to join <strong>${organizationName}</strong> as a ${role}.</p>
            <a href="${invitationUrl}">Accept Invitation</a>
        `,
    text: `${inviterName} invited you to join ${organizationName}. Click here: ${invitationUrl}`
  }),
  taskAssigned: ({ assigneeName, taskTitle, projectName, assignerName, link }: any) => ({
    subject: `New Task Assigned: ${taskTitle}`,
    html: `
            <h2>Hello ${assigneeName},</h2>
            <p><strong>${assignerName}</strong> assigned you a new task in <strong>${projectName}</strong>.</p>
            <p>Task: <strong>${taskTitle}</strong></p>
            <a href="${link}">View Task</a>
        `,
    text: `You have been assigned to task "${taskTitle}" in ${projectName} by ${assignerName}. View it here: ${link}`
  })
}

export async function sendInvitationEmail(data: any) {
  const template = EmailTemplates.invitation(data)
  await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

