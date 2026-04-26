import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nkrchvzvewkezmqevdsg.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5rcmNodnp2ZXdrZXptcWV2ZHNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcxMTczMjYsImV4cCI6MjA5MjY5MzMyNn0.j-joXI6slIWSB9aGCAZWZLsnldf74op2o0dyRz_wipQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestDoctor() {
  const email = 'test@example.com';
  const password = 'password123';
  const fullName = 'Dr. Test Assistant';
  const specialization = 'AI Integration';

  console.log(`Creating test user: ${email}...`);

  // 1. Sign up user
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  });

  if (authError) {
    if (authError.message.includes('already registered')) {
      console.log('User already exists in Auth. Proceeding to check profile...');
      // Get the existing user
      const { data: { user } } = await supabase.auth.getUser();
      // We can't easily get the ID of another user without Admin API, 
      // but if the signup failed because it exists, we can't do much without the ID.
      // However, we can try to insert into doctors anyway if we have the ID.
    } else {
      console.error('Auth Error:', authError);
      return;
    }
  }

  const userId = authData.user?.id;
  if (!userId) {
      console.log('Could not get user ID. They might already exist.');
      return;
  }

  console.log(`User created with ID: ${userId}. Creating doctor profile...`);

  // 2. Create doctor profile
  const { data, error } = await supabase
    .from('doctors')
    .insert([
      {
        id: userId,
        full_name: fullName,
        email: email,
        specialization: specialization,
      }
    ])
    .select();

  if (error) {
    console.error('Profile Error:', error);
  } else {
    console.log('Doctor profile created successfully:', data);
  }
}

createTestDoctor();
