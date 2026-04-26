import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkrchvzvewkezmqevdsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcmNodnp2ZXdrZXptcWV2ZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTczMjYsImV4cCI6MjA5MjY5MzMyNn0.j-joXI6slIWSB9aGCAZWZLsnldf74op2o0dyRz_wipQ';
const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('Fetching a patient...');
  const { data: patients } = await supabase.from('patients').select('id').limit(1);
  if (!patients?.length) { console.error('No patients found'); return; }
  const patientId = patients[0].id;

  console.log('Fetching latest consultation for patient...');
  const { data: consultations } = await supabase
    .from('consultations').select('id').eq('patient_id', patientId)
    .order('consultation_date', { ascending: false }).limit(1);
  const consultationId = consultations?.[0]?.id || null;
  console.log(`Patient: ${patientId}, Consultation: ${consultationId}`);

  console.log('\nAttempting diagnosis insert...');
  const { data, error } = await supabase.from('diagnoses').insert([{
    patient_id: patientId,
    consultation_id: consultationId,
    test_type: 'lab',
    test_name: 'Complete Blood Count (CBC)',
    results: 'Test results',
    interpretation: 'Normal',
    test_date: new Date(),
    status: 'completed'
  }]).select();

  if (error) {
    console.error('\nINSERT ERROR:');
    console.error('  Message:', error.message);
    console.error('  Code:', error.code);
    console.error('  Details:', error.details);
    console.error('  Hint:', error.hint);
  } else {
    console.log('\nSUCCESS:', data);
  }
}

diagnose();
