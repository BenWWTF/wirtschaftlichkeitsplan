import { MfaVerify } from '@/components/auth/mfa-verify'

export const metadata = {
  title: 'Zwei-Faktor-Authentifizierung | Ordi Pro',
  description: 'Verifizieren Sie Ihre Identität mit Ihrer Authenticator-App',
}

export default function MfaVerifyPage() {
  return <MfaVerify />
}
