# Supabase Setup Guide - Healthcare Supply Chain Management System

## 📋 Complete Setup Instructions

This guide walks you through setting up your Healthcare App with Supabase.

---

## Step 1: Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Click **"Start your project"** or sign in if you have an account
3. Click **"New project"**
4. Fill in the project details:
   - **Name**: `healthcare-app` (or your preferred name)
   - **Database Password**: Create a strong password (save this!)
   - **Region**: Select the region closest to your users
5. Click **"Create new project"** and wait for initialization (2-3 minutes)

---

## Step 2: Get Your Credentials

After your project is created:

1. Go to **Settings** → **API** in your Supabase dashboard
2. Copy the following values:
   - **Project URL** → Save as `VITE_SUPABASE_URL`
   - **anon public** key → Save as `VITE_SUPABASE_ANON_KEY`
3. Update your `.env.local` file:

```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 3: Create Database Tables

Go to **SQL Editor** in your Supabase dashboard and run the following SQL:

### 3.1 Create Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  full_name VARCHAR(255),
  role VARCHAR(50) DEFAULT 'user', -- 'doctor', 'patient', 'admin'
  specialization VARCHAR(255), -- for doctors
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
```

### 3.2 Create Patients Table
```sql
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  age INT NOT NULL,
  gender VARCHAR(20) NOT NULL, -- 'male', 'female', 'other'
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address TEXT NOT NULL,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  medical_history TEXT,
  allergies TEXT,
  status VARCHAR(50) DEFAULT 'registered', -- 'registered', 'in_consultation', 'diagnosed', 'treatment', 'pharmacy', 'billing', 'discharged'
  registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_patients_user_id ON patients(user_id);
CREATE INDEX idx_patients_status ON patients(status);
```

### 3.3 Create Consultations Table
```sql
CREATE TABLE consultations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  consultation_date TIMESTAMP NOT NULL,
  symptoms TEXT NOT NULL,
  diagnosis TEXT,
  notes TEXT,
  blood_pressure VARCHAR(50),
  heart_rate INT,
  temperature NUMERIC(5,2),
  weight NUMERIC(8,2),
  height NUMERIC(8,2),
  status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_consultations_patient_id ON consultations(patient_id);
CREATE INDEX idx_consultations_doctor_id ON consultations(doctor_id);
CREATE INDEX idx_consultations_status ON consultations(status);
```

### 3.4 Create Diagnoses Table
```sql
CREATE TABLE diagnoses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  test_type VARCHAR(50) NOT NULL, -- 'lab', 'imaging'
  test_name VARCHAR(255) NOT NULL,
  results TEXT,
  interpretation TEXT,
  test_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_diagnoses_patient_id ON diagnoses(patient_id);
CREATE INDEX idx_diagnoses_consultation_id ON diagnoses(consultation_id);
CREATE INDEX idx_diagnoses_status ON diagnoses(status);
```

### 3.5 Create Treatments Table
```sql
CREATE TABLE treatments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  consultation_id UUID NOT NULL REFERENCES consultations(id) ON DELETE CASCADE,
  diagnosis_id UUID REFERENCES diagnoses(id) ON DELETE SET NULL,
  treatment_plan TEXT NOT NULL,
  procedures TEXT,
  follow_up_date TIMESTAMP,
  status VARCHAR(50) DEFAULT 'planned', -- 'planned', 'in_progress', 'completed'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_treatments_patient_id ON treatments(patient_id);
CREATE INDEX idx_treatments_status ON treatments(status);
```

### 3.6 Create Medications Table
```sql
CREATE TABLE medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  treatment_id UUID NOT NULL REFERENCES treatments(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  duration VARCHAR(100) NOT NULL,
  instructions TEXT,
  status VARCHAR(50) DEFAULT 'prescribed', -- 'prescribed', 'dispensed', 'administered'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_medications_treatment_id ON medications(treatment_id);
CREATE INDEX idx_medications_status ON medications(status);
```

### 3.7 Create Billing Table
```sql
CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  total_amount NUMERIC(12,2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'paid', 'partial'
  payment_method VARCHAR(50),
  payment_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bills_patient_id ON bills(patient_id);
CREATE INDEX idx_bills_status ON bills(status);
```

### 3.8 Create Billing Items Table
```sql
CREATE TABLE billing_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  description VARCHAR(255) NOT NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(12,2) NOT NULL,
  total_price NUMERIC(12,2) NOT NULL,
  category VARCHAR(50) NOT NULL, -- 'consultation', 'lab', 'imaging', 'medication', 'procedure', 'room'
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_billing_items_bill_id ON billing_items(bill_id);
```

### 3.9 Create Feedback Table
```sql
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comments TEXT,
  category VARCHAR(50) NOT NULL, -- 'overall', 'staff', 'facility', 'treatment'
  status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'reviewed'
  feedback_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_feedback_patient_id ON feedback(patient_id);
CREATE INDEX idx_feedback_status ON feedback(status);
```

---

## Step 4: Enable Row-Level Security (RLS)

Go to **Authentication** → **Policies** and enable RLS for all tables:

### For Patients Table
```sql
-- Enable RLS
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own patient record
CREATE POLICY "Users can view own patient record"
ON patients FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Admins can view all
CREATE POLICY "Admins can view all patients"
ON patients FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Policy: Users can insert their own patient record
CREATE POLICY "Users can insert own patient record"
ON patients FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own record
CREATE POLICY "Users can update own patient record"
ON patients FOR UPDATE
USING (auth.uid() = user_id);
```

### For Other Tables (Similar Pattern)
```sql
ALTER TABLE consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE diagnoses ENABLE ROW LEVEL SECURITY;
ALTER TABLE treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Basic policy for consultations (can be customized)
CREATE POLICY "Consultations visible to involved parties"
ON consultations FOR SELECT
USING (
  auth.uid() = patient_id OR 
  auth.uid() = doctor_id OR
  EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
);
```

---

## Step 5: Update Environment Variables

Edit your `.env.local` file:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## Step 6: Install Dependencies

Make sure all Supabase dependencies are installed:

```bash
npm install @supabase/supabase-js
```

---

## Step 7: Update Frontend Components

Your Supabase client is already set up in `src/lib/supabase.ts`. Now update your components to use it:

### Example: PatientRegistration Component

```typescript
import { supabase } from '../lib/supabase'

const onSubmit = async (data: PatientFormData) => {
  setIsSubmitting(true)
  try {
    const { data: patient, error } = await supabase
      .from('patients')
      .insert([{
        first_name: data.firstName,
        last_name: data.lastName,
        age: data.age,
        gender: data.gender,
        email: data.email,
        phone: data.phone,
        address: data.address,
        emergency_contact_name: data.emergencyContactName,
        emergency_contact_phone: data.emergencyContactPhone,
        emergency_contact_relationship: data.emergencyContactRelationship,
        medical_history: data.medicalHistory || null,
        allergies: data.allergies || null,
        registration_date: new Date()
      }])
      .select()

    if (error) throw error
    
    console.log('Patient registered:', patient)
    setRegistrationSuccess(true)
    reset()
  } catch (error) {
    console.error('Error:', error)
    // Show error to user
  } finally {
    setIsSubmitting(false)
  }
}
```

---

## Step 8: Test Your Setup

1. Start your development server:
```bash
npm run dev
```

2. Navigate to the Patient Registration page
3. Fill out the form and submit
4. Check Supabase dashboard → **Table Editor** → **patients** to verify data was saved

---

## Step 9: (Optional) Set Up Authentication

To add user authentication:

1. Go to **Authentication** → **Providers** in Supabase
2. Enable desired providers (Email, Google, GitHub, etc.)
3. Configure OAuth apps if needed
4. Create an auth hook using Supabase Auth

---

## Troubleshooting

### Issue: "Missing Supabase environment variables"
- **Solution**: Ensure `.env.local` exists with correct values
- Run `npm run dev` from project root

### Issue: "RLS policy denying access"
- **Solution**: Check that RLS policies match your app's auth model
- Start with relaxed policies, then tighten security

### Issue: "Foreign key constraint failed"
- **Solution**: Ensure parent records exist before inserting child records
- Check table relationships in Supabase SQL editor

### Issue: "CORS errors"
- **Solution**: Go to **Settings** → **API** in Supabase
- Add your domain to allowed origins

---

## Next Steps

1. ✅ Create Supabase project
2. ✅ Create database tables
3. ✅ Set environment variables
4. ✅ Update components to use Supabase
5. Test all features
6. Set up authentication (optional)
7. Deploy to production

---

## Useful Links

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Row-Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)

---

## Support

For issues, check:
1. Supabase Dashboard → **Logs** (check for SQL errors)
2. Browser Console (F12) for JavaScript errors
3. Supabase Documentation
4. GitHub Issues of similar projects
