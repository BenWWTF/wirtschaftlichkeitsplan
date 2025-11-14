# Error Handling Guide

This document outlines the standardized error handling patterns used throughout the application.

## Overview

The application implements a consistent error handling strategy across all server actions to ensure:
- **Security**: Error messages don't leak sensitive information
- **Consistency**: Standardized response format for all actions
- **User Experience**: German error messages for German-speaking users
- **Debugging**: Server-side logging of all errors for troubleshooting

## Core Components

### 1. Error Handler Utility (`lib/utils/error-handler.ts`)

Central utility providing standardized error handling functions and types.

### 2. Logger Utility (`lib/utils/logger.ts`)

Server-side only logging that ensures sensitive error details are never exposed to the client.

## Standard Response Format

All server actions should return a standardized response format:

```typescript
interface ActionResponse<T = any> {
  success?: boolean      // true if operation succeeded
  data?: T              // returned data on success
  error?: string        // user-friendly error message on failure
}
```

### Success Response
```typescript
{
  success: true,
  data: { /* returned data */ }
}
```

### Error Response
```typescript
{
  success: false,
  error: "Ein Fehler ist aufgetreten"  // User-friendly German message
}
```

## Usage Patterns

### Pattern 1: Simple Try-Catch with handleActionError

```typescript
export async function createExpense(input: ExpenseInput) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expenses')
      .insert({ user_id: userId, ...input })
      .select()

    if (error) {
      return handleSupabaseError(error, 'createExpense', 'Ausgabe konnte nicht erstellt werden')
    }

    revalidatePath('/dashboard/ausgaben')
    return { success: true, data }
  } catch (error) {
    return handleActionError(error, 'createExpense', {}, 'Ausgabe konnte nicht erstellt werden')
  }
}
```

### Pattern 2: Using wrapAction for Cleaner Code

```typescript
export async function updateExpense(id: string, input: ExpenseInput) {
  return wrapAction(
    async () => {
      const userId = await getAuthUserId()
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('expenses')
        .update(input)
        .eq('id', id)
        .eq('user_id', userId)
        .select()

      if (error) throw error

      revalidatePath('/dashboard/ausgaben')
      return data
    },
    'updateExpense',
    'Ausgabe konnte nicht aktualisiert werden'
  )
}
```

### Pattern 3: Field Validation

```typescript
export async function createTherapy(input: TherapyInput) {
  // Validate required fields
  if (!validateRequired(input.name, 'name', 'createTherapy')) {
    return handleValidationError('createTherapy', 'name', input.name)
  }

  if (!validateNumber(input.price, 'price', 'createTherapy', { min: 0 })) {
    return handleValidationError('createTherapy', 'price', input.price)
  }

  // ... rest of function
}
```

### Pattern 4: Authentication Error Handling

```typescript
export async function deleteExpense(id: string) {
  try {
    const userId = await getAuthUserId()
    if (!userId) {
      return handleAuthError('deleteExpense', 'NOT_AUTHENTICATED')
    }

    // ... rest of function
  } catch (error) {
    return handleActionError(error, 'deleteExpense')
  }
}
```

### Pattern 5: Not Found Error Handling

```typescript
export async function getExpense(id: string) {
  try {
    const userId = await getAuthUserId()
    const supabase = await createClient()

    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (error?.code === 'PGRST116') {  // No rows returned
      return handleNotFoundError('getExpense', 'Ausgabe', id)
    }

    return { success: true, data }
  } catch (error) {
    return handleActionError(error, 'getExpense')
  }
}
```

## Error Message Guidelines

### User-Friendly Messages

Always return user-friendly German error messages. Never expose:
- Database error details
- SQL queries
- Internal API information
- Full stack traces

### Common Error Messages

```typescript
// Validation
'Validierungsfehler: {fieldName}'

// Authentication
'Benutzer konnte nicht authentifiziert werden'
'Sie haben keine Berechtigung für diese Operation'

// Not Found
'{ResourceType} nicht gefunden'

// Conflict
'Dieser Datensatz existiert bereits'

// Referential Integrity
'Abhängige Daten verhindern diese Operation'

// Generic
'Ein Fehler ist aufgetreten'
```

## Supabase Error Handling

The `handleSupabaseError` function maps Supabase-specific errors to user-friendly messages:

```typescript
// Unique constraint violation (23505)
if (error?.code === '23505') {
  return { error: 'Dieser Datensatz existiert bereits' }
}

// Foreign key violation (23503)
if (error?.code === '23503') {
  return { error: 'Abhängige Daten verhindern diese Operation' }
}

// Table not found (42P01)
if (error?.code === '42P01') {
  return { error: defaultMessage }
}
```

## Server-Side Logging

All errors are logged server-side with the `logError` function:

```typescript
logError(
  'functionName',           // Context
  'User-friendly message',  // Description
  error,                    // Error object
  {                        // Contextual details
    userId,
    recordId,
    operation: 'update'
  }
)
```

**Important**: Logs are ONLY visible on the server and never exposed to the client.

## Error Categories

The application defines these error categories for classification:

```typescript
enum ErrorCategory {
  VALIDATION = 'VALIDATION',           // Input validation failed
  AUTHENTICATION = 'AUTHENTICATION',   // User not authenticated
  AUTHORIZATION = 'AUTHORIZATION',    // User not authorized
  NOT_FOUND = 'NOT_FOUND',            // Resource doesn't exist
  CONFLICT = 'CONFLICT',               // Resource already exists
  EXTERNAL_SERVICE = 'EXTERNAL_SERVICE', // External API error
  INTERNAL_ERROR = 'INTERNAL_ERROR',   // Server error
  UNKNOWN = 'UNKNOWN',                 // Unknown error
}
```

## Best Practices

1. **Always log errors server-side** - Use `logError` or `handleActionError`
2. **Never expose internal details** - Return generic messages to users
3. **Use specific error messages** - Provide context for debugging in logs
4. **Validate early** - Check inputs before database operations
5. **Handle Supabase errors** - Use `handleSupabaseError` for DB operations
6. **Revalidate on success** - Clear caches after successful modifications
7. **Return consistent format** - Always use ActionResponse<T> structure

## Testing Error Handling

To test error handling:

1. **Client-side**: Check that error messages are user-friendly
2. **Server-side**: Review logs for complete error context
3. **Integration**: Verify RLS policies prevent unauthorized access
4. **Security**: Confirm no sensitive data in error messages

## Migration Path

For existing functions, migrate to this error handling pattern:

1. Replace all `console.error` with `logError`
2. Replace generic error returns with standardized handlers
3. Update error messages to be user-friendly German text
4. Test to ensure proper error handling
5. Verify no information leakage in error responses

## Common Mistakes to Avoid

❌ **Bad**: Returning raw error messages to client
```typescript
return { error: error.message }  // Might expose SQL details!
```

✅ **Good**: Using standardized error handler
```typescript
return handleActionError(error, 'functionName', {}, 'User-friendly message')
```

---

❌ **Bad**: Logging sensitive data in user-facing messages
```typescript
return { error: `Database error: ${error.details}` }
```

✅ **Good**: Logging to server only
```typescript
logError('functionName', 'Database error', error, { userId, recordId })
return { error: 'Ein Fehler ist aufgetreten' }
```

---

❌ **Bad**: Not validating input
```typescript
const therapy = therapyMap[plan.therapy_type_id]  // Might not exist!
```

✅ **Good**: Validating before use
```typescript
const therapyTypeId = String(plan.therapy_type_id)
const therapy = therapyMap[therapyTypeId]
if (!therapy) {
  logError('functionName', 'Therapy not found', new Error('Missing therapy'), { therapyTypeId })
  return handleNotFoundError('functionName', 'Therapie', therapyTypeId)
}
```
