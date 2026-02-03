import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client mit Secret Key
 * NUR für Server-seitige Operationen verwenden!
 * Umgeht RLS - daher mit Vorsicht nutzen.
 */
export function createAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY

  if (!supabaseUrl || !supabaseSecretKey) {
    throw new Error('Missing Supabase environment variables for admin client')
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
