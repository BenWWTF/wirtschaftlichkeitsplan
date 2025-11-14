import { z } from 'zod'

export const TherapyTypeSchema = z.object({
  name: z.string().min(1, 'Therapieart-Name ist erforderlich').max(100),
  price_per_session: z.number().positive('Preis muss positiv sein'),
  variable_cost_per_session: z.number().nonnegative('Kosten können nicht negativ sein')
})

export type TherapyTypeInput = z.infer<typeof TherapyTypeSchema>

export const ExpenseSchema = z.object({
  category: z.string().min(1, 'Kategorie ist erforderlich'),
  subcategory: z.string().optional(),
  amount: z.number().positive('Betrag muss positiv sein'),
  expense_date: z.string().min(1, 'Datum ist erforderlich'),
  is_recurring: z.boolean().default(false),
  recurrence_interval: z.enum(['monthly', 'quarterly', 'yearly']).optional(),
  description: z.string().optional()
})

export type ExpenseInput = z.infer<typeof ExpenseSchema>

export const MonthlyPlanSchema = z.object({
  therapy_type_id: z.string().uuid('Ungültige Therapieart ID'),
  month: z.string().min(1, 'Monat ist erforderlich'),
  planned_sessions: z.number().int().positive('Sitzungen müssen positiv sein'),
  actual_sessions: z.number().int().nonnegative('Sitzungen können nicht negativ sein').optional().nullable(),
  notes: z.string().optional().nullable()
})

export type MonthlyPlanInput = z.infer<typeof MonthlyPlanSchema>

export const PracticeSettingsSchema = z.object({
  practice_name: z.string().min(1, 'Praxisname ist erforderlich'),
  practice_type: z.enum(['kassenarzt', 'wahlarzt', 'mixed']),
  monthly_fixed_costs: z.number().nonnegative('Fixkosten können nicht negativ sein'),
  average_variable_cost_per_session: z.number().nonnegative('Variable Kosten können nicht negativ sein'),
  expected_growth_rate: z.number().min(-100, 'Wachstum kann nicht unter -100% sein').max(1000, 'Wachstum zu hoch'),
  max_sessions_per_week: z.number().int().positive('Maximale Sitzungen müssen positiv sein').optional().nullable()
})

export type PracticeSettingsInput = z.infer<typeof PracticeSettingsSchema>

export const LoginSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(6, 'Passwort muss mindestens 6 Zeichen lang sein')
})

export type LoginInput = z.infer<typeof LoginSchema>

export const SignUpSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse'),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen lang sein'),
  practice_name: z.string().min(1, 'Praxisname ist erforderlich')
})

export type SignUpInput = z.infer<typeof SignUpSchema>
