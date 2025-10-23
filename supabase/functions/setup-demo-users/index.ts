import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create admin client
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    const demoUsers = [
      { email: 'admin@example.com', password: 'admin', role: 'admin' },
      { email: 'doctor@example.com', password: 'admin', role: 'doctor' },
      { email: 'patient@example.com', password: 'admin', role: 'patient' },
      { email: 'labs@example.com', password: 'admin', role: 'labs' },
    ]

    const results = []

    for (const user of demoUsers) {
      // Check if user already exists
      const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers()
      const userExists = existingUser?.users.some(u => u.email === user.email)

      let userId: string

      if (userExists) {
        const foundUser = existingUser?.users.find(u => u.email === user.email)
        userId = foundUser!.id
        results.push({ email: user.email, status: 'already_exists', userId })
      } else {
        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
        })

        if (createError) {
          results.push({ email: user.email, status: 'error', error: createError.message })
          continue
        }

        userId = newUser.user.id
        results.push({ email: user.email, status: 'created', userId })
      }

      // Check if role already assigned
      const { data: existingRole } = await supabaseAdmin
        .from('user_roles')
        .select('*')
        .eq('user_id', userId)
        .eq('role', user.role)
        .single()

      if (!existingRole) {
        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({
            user_id: userId,
            role: user.role,
          })

        if (roleError) {
          results.push({ email: user.email, status: 'role_error', error: roleError.message })
        }
      }

      // Create patient record for patient user
      if (user.role === 'patient') {
        const { data: existingPatient } = await supabaseAdmin
          .from('patients')
          .select('*')
          .eq('user_id', userId)
          .single()

        if (!existingPatient) {
          await supabaseAdmin
            .from('patients')
            .insert({
              user_id: userId,
              full_name: 'Demo Patient',
              email: user.email,
              phone: '+1234567890',
            })
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Demo users setup completed',
        results 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
