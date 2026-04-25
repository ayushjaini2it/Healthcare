import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkrchvzvewkezmqevdsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcmNodnp2ZXdrZXptcWV2ZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTczMjYsImV4cCI6MjA5MjY5MzMyNn0.j-joXI6slIWSB9aGCAZWZLsnldf74op2o0dyRz_wipQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUsers() {
  const { data, error } = await supabase.from('users').select('*');
  console.log('Users:', data);
  console.log('Error:', error);
}

checkUsers();
