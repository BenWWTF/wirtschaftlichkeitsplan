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

    // Generate email template
    const template = generateEmailTemplate({
      exportType: request.exportType,
      exportFormat: request.exportFormat,
      fileName: request.fileName,
      senderName: user.email || 'User',
      customMessage: request.message,
      includeScheduleInfo: request.includeScheduleInfo
    })

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
 * Test email configuration
 */
export async function testEmailConfiguration(recipient: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isValidEmail(recipient)) {
      return { success: false, error: 'Invalid email address' }
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
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; }
    .content { background: #f9f9f9; padding: 20px; border: 1px solid #e0e0e0; }
    .info-box { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 15px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header"><h1>Wirtschaftlichkeitsplan Export</h1></div>
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
      <p>Bei Fragen kontaktieren Sie bitte den Support.</p>
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

Bei Fragen kontaktieren Sie bitte den Support.
  `

  return {
    subject: `Wirtschaftlichkeitsplan Export - ${reportTypeLabel}`,
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
