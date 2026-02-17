'use server'

import { createClient } from '@/utils/supabase/server'
import { format } from 'date-fns'
import { de } from 'date-fns/locale'

export interface EmailExportRequest {
  recipients: string[]
  exportType: string
  exportFormat: 'pdf' | 'xlsx' | 'csv'
  fileName: string
  fileData: Blob
  subject?: string
  message?: string
  includeScheduleInfo?: boolean
}

export interface EmailTemplate {
  subject: string
  html: string
  text: string
}

/**
 * Send export via email
 */
export async function sendExportEmail(request: EmailExportRequest): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Validate recipients
    const validRecipients = validateEmailAddresses(request.recipients)
    if (validRecipients.length === 0) {
      return { success: false, error: 'No valid email recipients provided' }
    }

    // Get user profile for sender info
    const { data: profile } = await supabase
      .from('users_profile')
      .select('full_name, email')
      .eq('id', user.id)
      .single()

    // Generate email template
    const template = generateEmailTemplate({
      exportType: request.exportType,
      exportFormat: request.exportFormat,
      fileName: request.fileName,
      senderName: profile?.full_name || user.email || 'Ordi Pro',
      customMessage: request.message,
      includeScheduleInfo: request.includeScheduleInfo
    })

    // Call Supabase Edge Function to send email
    const { data, error } = await supabase.functions.invoke('send-export-email', {
      body: {
        recipients: validRecipients,
        subject: request.subject || template.subject,
        html: template.html,
        text: template.text,
        fileName: request.fileName,
        fileData: await blobToBase64(request.fileData),
        fileSize: request.fileData.size
      }
    })

    if (error) {
      console.error('Email function error:', error)
      return { success: false, error: 'Failed to send email' }
    }

    // Log email sending to export history
    await logEmailExport(user.id, {
      export_type: request.exportType,
      export_format: request.exportFormat,
      file_name: request.fileName,
      recipients: validRecipients,
      sent_via_email: true
    })

    return { success: true }
  } catch (error) {
    console.error('Error sending export email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Send scheduled export email
 */
export async function sendScheduledExportEmail(
  scheduleId: string,
  recipients: string[],
  fileName: string,
  fileData: Blob
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    // Get schedule details
    const { data: schedule } = await supabase
      .from('export_schedules')
      .select('*')
      .eq('id', scheduleId)
      .eq('user_id', user.id)
      .single()

    if (!schedule) {
      return { success: false, error: 'Schedule not found' }
    }

    // Validate recipients
    const validRecipients = validateEmailAddresses(recipients)
    if (validRecipients.length === 0) {
      return { success: false, error: 'No valid email recipients provided' }
    }

    // Generate template for scheduled export
    const template = generateScheduledExportEmailTemplate({
      scheduleName: schedule.name,
      scheduleType: schedule.schedule_type,
      selectedReports: schedule.selected_reports,
      exportFormat: schedule.export_format,
      fileName: fileName
    })

    // Send email
    const { data, error } = await supabase.functions.invoke('send-export-email', {
      body: {
        recipients: validRecipients,
        subject: template.subject,
        html: template.html,
        text: template.text,
        fileName: fileName,
        fileData: await blobToBase64(fileData),
        fileSize: fileData.size,
        scheduleId: scheduleId
      }
    })

    if (error) {
      console.error('Email function error:', error)
      return { success: false, error: 'Failed to send email' }
    }

    // Update schedule with email sent info
    await supabase
      .from('export_schedules')
      .update({
        email_recipients: validRecipients,
        updated_at: new Date().toISOString()
      })
      .eq('id', scheduleId)

    return { success: true }
  } catch (error) {
    console.error('Error sending scheduled export email:', error)
    return { success: false, error: 'Failed to send email' }
  }
}

/**
 * Test email configuration
 */
export async function testEmailConfiguration(recipient: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()

  try {
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return { success: false, error: 'Authentication required' }
    }

    if (!isValidEmail(recipient)) {
      return { success: false, error: 'Invalid email address' }
    }

    // Send test email
    const { data, error } = await supabase.functions.invoke('send-test-email', {
      body: {
        recipient: recipient,
        subject: 'Test Email - Ordi Pro',
        html: '<p>This is a test email from Ordi Pro export system.</p>',
        text: 'This is a test email from Ordi Pro export system.'
      }
    })

    if (error) {
      console.error('Email test error:', error)
      return { success: false, error: 'Failed to send test email' }
    }

    return { success: true }
  } catch (error) {
    console.error('Error testing email configuration:', error)
    return { success: false, error: 'Failed to test email' }
  }
}

/**
 * Generate email template for export
 */
function generateEmailTemplate(options: {
  exportType: string
  exportFormat: string
  fileName: string
  senderName: string
  customMessage?: string
  includeScheduleInfo?: boolean
}): EmailTemplate {
  const { exportType, exportFormat, fileName, senderName, customMessage, includeScheduleInfo } = options
  const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: de })

  const reportTypeLabel = {
    break_even: 'Break-Even Analyse',
    monthly_planning: 'Monatliche Planung',
    therapy_performance: 'Therapieleistung',
    expense_summary: 'Ausgabenübersicht',
    monthly_results: 'Monatliche Ergebnisse',
    batch: 'Sammelexport'
  }[exportType] || exportType

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
    .info-box strong { color: #1976d2; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
    .button { display: inline-block; background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; margin: 10px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Ordi Pro Export</h1>
    </div>
    <div class="content">
      <p>Hallo ${senderName},</p>

      <p>Ihr angefordeter Bericht wurde erfolgreich erstellt und ist anbei verfügt.</p>

      <div class="info-box">
        <strong>Berichtdetails:</strong><br>
        Berichttyp: ${reportTypeLabel}<br>
        Format: ${exportFormat.toUpperCase()}<br>
        Dateiname: ${fileName}<br>
        Erstellt: ${timestamp}
      </div>

      ${customMessage ? `<div class="info-box"><strong>Zusätzliche Informationen:</strong><br>${customMessage}</div>` : ''}

      ${includeScheduleInfo ? `<div class="info-box"><strong>Geplante Exporte:</strong><br>Dieser Bericht wird automatisch in regelmäßigen Abständen exportiert und per E-Mail versendet.</div>` : ''}

      <h3>Nächste Schritte:</h3>
      <ul>
        <li>Laden Sie die angehängte Datei herunter</li>
        <li>Öffnen Sie die Datei mit der entsprechenden Anwendung</li>
        <li>Überprüfen Sie die Daten auf Vollständigkeit und Korrektheit</li>
      </ul>

      <p>Bei Fragen oder Problemen kontaktieren Sie bitte den Support.</p>

      <div class="footer">
        <p>Diese E-Mail wurde automatisch von Ordi Pro generiert.</p>
        <p>Die angehängte Datei wird nach 30 Tagen automatisch gelöscht. Bitte speichern Sie diese lokal.</p>
        <p>&copy; ${new Date().getFullYear()} Ordi Pro. Alle Rechte vorbehalten.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const text = `
WIRTSCHAFTLICHKEITSPLAN EXPORT

Hallo ${senderName},

Ihr angefordeter Bericht wurde erfolgreich erstellt und ist anbei verfügt.

BERICHTDETAILS:
Berichttyp: ${reportTypeLabel}
Format: ${exportFormat.toUpperCase()}
Dateiname: ${fileName}
Erstellt: ${timestamp}

${customMessage ? `ZUSÄTZLICHE INFORMATIONEN:\n${customMessage}\n` : ''}

Bei Fragen oder Problemen kontaktieren Sie bitte den Support.

Diese E-Mail wurde automatisch von Ordi Pro generiert.
Die angehängte Datei wird nach 30 Tagen automatisch gelöscht. Bitte speichern Sie diese lokal.

Copyright ${new Date().getFullYear()} Ordi Pro. Alle Rechte vorbehalten.
  `

  return {
    subject: `Ordi Pro Export - ${reportTypeLabel}`,
    html,
    text
  }
}

/**
 * Generate email template for scheduled export
 */
function generateScheduledExportEmailTemplate(options: {
  scheduleName: string
  scheduleType: string
  selectedReports: string[]
  exportFormat: string
  fileName: string
}): EmailTemplate {
  const { scheduleName, scheduleType, selectedReports, exportFormat, fileName } = options
  const timestamp = format(new Date(), 'dd.MM.yyyy HH:mm:ss', { locale: de })

  const scheduleLabel = {
    daily: 'Täglich',
    weekly: 'Wöchentlich',
    monthly: 'Monatlich'
  }[scheduleType] || scheduleType

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; border-radius: 0 0 8px 8px; }
    .schedule-info { background: #f0f4c3; border-left: 4px solid #9ccc65; padding: 15px; margin: 15px 0; }
    .footer { font-size: 12px; color: #666; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Geplanter Export - ${scheduleName}</h1>
    </div>
    <div class="content">
      <p>Der planmäßige Export für "${scheduleName}" wurde erfolgreich ausgeführt.</p>

      <div class="schedule-info">
        <strong>Exportplan:</strong><br>
        Name: ${scheduleName}<br>
        Häufigkeit: ${scheduleLabel}<br>
        Format: ${exportFormat.toUpperCase()}<br>
        Erstellt: ${timestamp}
      </div>

      <h3>Enthaltene Berichte:</h3>
      <ul>
        ${selectedReports.map(report => `<li>${report}</li>`).join('')}
      </ul>

      <p>Die angehängte Datei enthält die Ergebnisse des Exports: <strong>${fileName}</strong></p>

      <div class="footer">
        <p>Dies ist ein automatischer Export vom planmäßigen Export "${scheduleName}".</p>
        <p>Die angehängte Datei wird nach 30 Tagen automatisch gelöscht. Bitte speichern Sie diese lokal.</p>
      </div>
    </div>
  </div>
</body>
</html>
  `

  const text = `
GEPLANTER EXPORT - ${scheduleName}

Der planmäßige Export für "${scheduleName}" wurde erfolgreich ausgeführt.

EXPORTPLAN:
Name: ${scheduleName}
Häufigkeit: ${scheduleLabel}
Format: ${exportFormat.toUpperCase()}
Erstellt: ${timestamp}

ENTHALTENE BERICHTE:
${selectedReports.map(r => `- ${r}`).join('\n')}

Die angehängte Datei enthält die Ergebnisse des Exports.

Dies ist ein automatischer Export vom planmäßigen Export.
Die angehängte Datei wird nach 30 Tagen automatisch gelöscht. Bitte speichern Sie diese lokal.
  `

  return {
    subject: `Ordi Pro - Geplanter Export: ${scheduleName}`,
    html,
    text
  }
}

/**
 * Validate email addresses
 */
function validateEmailAddresses(emails: string[]): string[] {
  return emails.filter(isValidEmail)
}

/**
 * Check if email is valid
 */
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email.trim())
}

/**
 * Convert Blob to Base64
 */
async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      // Remove the data:application/...;base64, prefix
      resolve(base64.split(',')[1])
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

/**
 * Log email export to history
 */
async function logEmailExport(
  userId: string,
  data: {
    export_type: string
    export_format: string
    file_name: string
    recipients: string[]
    sent_via_email: boolean
  }
): Promise<void> {
  const supabase = await createClient()

  try {
    await supabase
      .from('export_history')
      .insert([
        {
          user_id: userId,
          ...data,
          status: 'completed'
        }
      ])
  } catch (error) {
    console.error('Error logging email export:', error)
  }
}
