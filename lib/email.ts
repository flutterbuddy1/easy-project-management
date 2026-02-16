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
  }),
  newComment: ({ recipientName, commenterName, taskTitle, projectName, commentContent, link }: any) => ({
    subject: `New Comment on ${taskTitle}`,
    html: `
            <h2>Hello ${recipientName},</h2>
            <p><strong>${commenterName}</strong> commented on <strong>${taskTitle}</strong> in ${projectName}.</p>
            <blockquote style="border-left: 4px solid #eee; padding-left: 10px; color: #555;">
                ${commentContent}
            </blockquote>
            <a href="${link}">View Comment</a>
        `,
    text: `${commenterName} commented on "${taskTitle}": "${commentContent}". View it here: ${link}`
  }),
  projectStarted: ({ clientName, projectName, projectType, deadline, loginLink }: any) => ({
    subject: `Project Started: ${projectName}`,
    html: `
            <h1>Hello ${clientName},</h1>
            <p>We are excited to inform you that your project <strong>${projectName}</strong> has officially started!</p>
            <p><strong>Project Details:</strong></p>
            <ul>
                <li>Type: ${projectType}</li>
                <li>Deadline: ${deadline ? new Date(deadline).toLocaleDateString() : 'TBD'}</li>
            </ul>
            <p>You can track progress and communicate with us through your client portal.</p>
            <a href="${loginLink}">Access Client Portal</a>
        `,
    text: `Your project ${projectName} has started! Login to view details: ${loginLink}`
  }),
  projectUpdate: ({ clientName, projectName, updateMessage, loginLink }: any) => ({
    subject: `Update on ${projectName}`,
    html: `
          <h3>Hello ${clientName},</h3>
          <p>Here is an update on your project <strong>${projectName}</strong>:</p>
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0;">
              ${updateMessage}
          </div>
          <p>Click below to view full details:</p>
          <a href="${loginLink}">View Project</a>
      `,
    text: `Update for ${projectName}: ${updateMessage}. View here: ${loginLink}`
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

export async function sendTaskAssignedEmail(data: any) {
  const template = EmailTemplates.taskAssigned(data)
  await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

export async function sendNewCommentEmail(data: any) {
  const template = EmailTemplates.newComment(data)
  await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

export async function sendProjectStartedEmail(data: any) {
  const template = EmailTemplates.projectStarted(data)
  await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

export async function sendProjectUpdateEmail(data: any) {
  const template = EmailTemplates.projectUpdate(data)
  await sendEmail({
    to: data.to,
    subject: template.subject,
    html: template.html,
    text: template.text
  })
}

