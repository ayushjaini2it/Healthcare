import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const jsonResponse = (status: number, body: Record<string, string>) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (request.method !== 'POST') {
    return jsonResponse(405, { error: 'Method not allowed' })
  }

  const authorization = request.headers.get('Authorization')
  const token = authorization?.replace(/^Bearer\s+/i, '')
  if (!token) return jsonResponse(401, { error: 'Authentication required' })

  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  const resendApiKey = Deno.env.get('RESEND_API_KEY')
  const fromEmail = Deno.env.get('APPOINTMENT_FROM_EMAIL')
  if (!supabaseUrl || !anonKey || !serviceRoleKey || !resendApiKey || !fromEmail) {
    return jsonResponse(503, { error: 'Appointment email notifications are not configured' })
  }

  const authClient = createClient(supabaseUrl, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: { user }, error: authError } = await authClient.auth.getUser(token)
  if (authError || !user) return jsonResponse(401, { error: 'Invalid authentication' })

  let appointmentId: string
  try {
    const body = await request.json()
    appointmentId = typeof body.appointmentId === 'string' ? body.appointmentId : ''
  } catch {
    return jsonResponse(400, { error: 'Invalid request body' })
  }
  if (!appointmentId) return jsonResponse(400, { error: 'Appointment ID is required' })

  const adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: appointment, error: appointmentError } = await adminClient
    .from('appointments')
    .select('patient_id, doctor_id')
    .eq('id', appointmentId)
    .maybeSingle()
  if (appointmentError) return jsonResponse(500, { error: 'Could not verify the appointment' })
  if (!appointment) return jsonResponse(404, { error: 'Appointment not found' })

  const { data: patient, error: patientError } = await adminClient
    .from('patients')
    .select('auth_user_id')
    .eq('id', appointment.patient_id)
    .maybeSingle()
  if (patientError) return jsonResponse(500, { error: 'Could not verify appointment ownership' })
  if (!patient || patient.auth_user_id !== user.id) {
    return jsonResponse(403, { error: 'You cannot notify for this appointment' })
  }

  const { data: doctor, error: doctorError } = await adminClient
    .from('doctors')
    .select('email')
    .eq('id', appointment.doctor_id)
    .maybeSingle()
  if (doctorError) return jsonResponse(500, { error: 'Could not load the doctor email' })
  if (!doctor?.email) return jsonResponse(422, { error: 'The selected doctor has no registered email address' })

  const emailResponse = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: fromEmail,
      to: [doctor.email],
      subject: 'New appointment request',
      text: 'A patient has requested an appointment. Sign in to your Health Connect dashboard to review and respond.',
    }),
  })
  if (!emailResponse.ok) {
    console.error('Appointment email provider returned an error:', emailResponse.status)
    return jsonResponse(502, { error: 'The doctor email notification could not be sent' })
  }

  return jsonResponse(200, { message: 'Doctor email notification sent' })
})
