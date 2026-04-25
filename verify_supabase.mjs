import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkrchvzvewkezmqevdsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcmNodnp2ZXdrZXptcWV2ZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTczMjYsImV4cCI6MjA5MjY5MzMyNn0.j-joXI6slIWSB9aGCAZWZLsnldf74op2o0dyRz_wipQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSupabase() {
  console.log('Testing INSERT on patients...');
  const { data, error } = await supabase
    .from('patients')
    .insert([
      {
        first_name: 'Test',
        last_name: 'Patient',
        age: 30,
        gender: 'other',
        email: 'test@example.com',
        phone: '1234567890',
        address: '123 Test St',
        emergency_contact_name: 'Jane Test',
        emergency_contact_phone: '0987654321',
        emergency_contact_relationship: 'Friend',
        status: 'registered'
      }
    ])
    .select();

  console.log('INSERT Data:', data);
  console.log('INSERT Error:', error);
}

testSupabase();
