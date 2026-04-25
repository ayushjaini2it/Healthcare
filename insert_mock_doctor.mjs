import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkrchvzvewkezmqevdsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcmNodnp2ZXdrZXptcWV2ZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTczMjYsImV4cCI6MjA5MjY5MzMyNn0.j-joXI6slIWSB9aGCAZWZLsnldf74op2o0dyRz_wipQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMockDoctor() {
  console.log('Testing INSERT on users (mock doctor)...');
  const { data, error } = await supabase
    .from('users')
    .insert([
      {
        email: 'dr.smith@example.com',
        full_name: 'Dr. John Smith',
        role: 'doctor',
        specialization: 'General Medicine'
      }
    ])
    .select();

  console.log('INSERT Data:', data);
  console.log('INSERT Error:', error);
}

addMockDoctor();
