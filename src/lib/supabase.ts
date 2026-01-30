import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!

// Browser client - safe to use with RLS enabled
export const supabase = createClient(supabaseUrl, supabasePublishableKey)
