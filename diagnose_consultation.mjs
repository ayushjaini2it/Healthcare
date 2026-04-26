import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkrchvzvewkezmqevdsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcmNodnp2ZXdrZXptcWV2ZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTczMjYsImV4cCI6MjA5MjY5MzMyNn0.j-joXI6slIWSB9aGCAZWZLsnldf74op2o0dyRz_wipQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('Step 1: Fetching a patient and a doctor to use for test...');

  const { data: patients, error: pErr } = await supabase.from('patients').select('id').limit(1);
  const { data: doctors, error: dErr } = await supabase.from('doctors').select('id').limit(1);

  if (pErr) { console.error('Failed to fetch patient:', pErr); return; }
  if (dErr) { console.error('Failed to fetch doctor:', dErr); return; }

  if (!patients?.length) { console.error('No patients found. Register a patient first.'); return; }
  if (!doctors?.length) { console.error('No doctors found.'); return; }

  const patientId = patients[0].id;
  const doctorId = doctors[0].id;
  console.log(`Using patient: ${patientId}, doctor: ${doctorId}`);

  console.log('\nStep 2: Attempting consultation insert...');
  const { data, error } = await supabase.from('consultations').insert([{
    patient_id: patientId,
    doctor_id: doctorId,
    consultation_date: new Date(),
    symptoms: 'Test symptom, headache',
    diagnosis: 'Test preliminary diagnosis',
    notes: 'Test consultation notes for diagnosis',
    blood_pressure: '120/80',
    heart_rate: 72,
    temperature: 36.6,
    weight: 70,
    height: 175,
    status: 'completed'
  }]).select();

  if (error) {
    console.error('\nINSERT ERROR:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Details:', error.details);
    console.error('  Hint:', error.hint);
  } else {
    console.log('\nSUCCESS! Consultation created:', data);
  }
}

diagnose();
