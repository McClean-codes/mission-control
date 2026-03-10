import { createClient } from '@supabase/supabase-js'

let _supabase: any = null
let _supabaseAdmin: any = null

function ensureSupabase() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set')
    }
    _supabase = createClient(url, key)
  }
  return _supabase
}

function ensureSupabaseAdmin() {
  if (!_supabaseAdmin) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set')
    }
    _supabaseAdmin = createClient(url, key)
  }
  return _supabaseAdmin
}

// Use a proxy to lazily initialize on first use
export const supabase = new Proxy({} as any, {
  get: (target, prop) => {
    const client = ensureSupabase()
    return (client as any)[prop]
  }
})

export const supabaseAdmin = new Proxy({} as any, {
  get: (target, prop) => {
    const client = ensureSupabaseAdmin()
    return (client as any)[prop]
  }
})
