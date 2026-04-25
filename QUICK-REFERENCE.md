# Quick Reference & Checklist - Supabase Setup

## 📋 Complete Checklist

### Phase 1: Supabase Project Setup
- [ ] Create Supabase account at supabase.com
- [ ] Create new project
- [ ] Wait for database initialization
- [ ] Note down Project URL and Anon Key
- [ ] Copy credentials to `.env.local`

### Phase 2: Database Schema
- [ ] Execute all SQL in Supabase SQL Editor
- [ ] Verify all tables are created
- [ ] Check relationships and indexes
- [ ] Test table access

### Phase 3: Security & RLS
- [ ] Enable Row-Level Security (RLS)
- [ ] Create RLS policies
- [ ] Test access restrictions
- [ ] Review policies for security

### Phase 4: Frontend Integration
- [ ] Verify Supabase client in `src/lib/supabase.ts`
- [ ] Check `.env.local` has credentials
- [ ] Create `src/services/supabaseServices.ts` (already created)
- [ ] Test one component with Supabase

### Phase 5: Testing
- [ ] Test patient registration (create)
- [ ] Test patient retrieval (read)
- [ ] Test patient update
- [ ] Test patient delete
- [ ] Test all workflows
- [ ] Verify data in Supabase dashboard

---

## 🚀 Quick Start Commands

### 1. Update Environment Variables
```bash
# Open .env.local in editor
code .env.local
```

### 2. Install/Update Packages
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```

### 4. Build for Production
```bash
npm run build
```

### 5. Preview Production Build
```bash
npm run preview
```

---

## 🔑 Supabase Credentials Reference

Save these from your Supabase project:

```
Project URL: https://[project-id].supabase.co
Anon Key: eyJhbGc...
```

Put in `.env.local`:
```env
VITE_SUPABASE_URL=https://[project-id].supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

---

## 📊 Database Schema Overview

```
users
├── id (UUID, Primary Key)
├── email (VARCHAR)
├── full_name (VARCHAR)
├── role (VARCHAR)
└── specialization (VARCHAR)

patients
├── id (UUID, Primary Key)
├── user_id (FK → users)
├── first_name (VARCHAR)
├── last_name (VARCHAR)
├── age (INT)
├── gender (VARCHAR)
├── email (VARCHAR)
├── phone (VARCHAR)
├── address (TEXT)
├── medical_history (TEXT)
├── allergies (TEXT)
├── status (VARCHAR)
└── timestamps

consultations
├── id (UUID, Primary Key)
├── patient_id (FK → patients)
├── doctor_id (FK → users)
├── consultation_date (TIMESTAMP)
├── symptoms (TEXT)
├── diagnosis (TEXT)
├── notes (TEXT)
├── vitalSigns (blood_pressure, heart_rate, temperature, weight, height)
├── status (VARCHAR)
└── timestamps

diagnoses
├── id (UUID, Primary Key)
├── patient_id (FK → patients)
├── consultation_id (FK → consultations)
├── test_type (VARCHAR) - 'lab', 'imaging'
├── test_name (VARCHAR)
├── results (TEXT)
├── interpretation (TEXT)
├── test_date (TIMESTAMP)
├── status (VARCHAR)
└── timestamps

treatments
├── id (UUID, Primary Key)
├── patient_id (FK → patients)
├── consultation_id (FK → consultations)
├── diagnosis_id (FK → diagnoses)
├── treatment_plan (TEXT)
├── procedures (TEXT)
├── follow_up_date (TIMESTAMP)
├── status (VARCHAR)
└── timestamps

medications
├── id (UUID, Primary Key)
├── treatment_id (FK → treatments)
├── medication_name (VARCHAR)
├── dosage (VARCHAR)
├── frequency (VARCHAR)
├── duration (VARCHAR)
├── instructions (TEXT)
├── status (VARCHAR)
└── timestamps

bills
├── id (UUID, Primary Key)
├── patient_id (FK → patients)
├── total_amount (NUMERIC)
├── status (VARCHAR)
├── payment_method (VARCHAR)
├── payment_date (TIMESTAMP)
└── timestamps

billing_items
├── id (UUID, Primary Key)
├── bill_id (FK → bills)
├── description (VARCHAR)
├── quantity (INT)
├── unit_price (NUMERIC)
├── total_price (NUMERIC)
├── category (VARCHAR)
└── timestamps

feedback
├── id (UUID, Primary Key)
├── patient_id (FK → patients)
├── rating (INT)
├── comments (TEXT)
├── category (VARCHAR)
├── status (VARCHAR)
└── timestamps
```

---

## 🔗 API Endpoints & Services

### Patient Services
```typescript
patientServices.registerPatient(data)
patientServices.getAllPatients()
patientServices.getPatientById(id)
patientServices.updatePatientStatus(id, status)
patientServices.updatePatient(id, updates)
```

### Consultation Services
```typescript
consultationServices.createConsultation(data)
consultationServices.getPatientConsultations(patientId)
consultationServices.updateConsultation(id, updates)
```

### Diagnosis Services
```typescript
diagnosisServices.createDiagnosis(data)
diagnosisServices.getPatientDiagnoses(patientId)
diagnosisServices.updateDiagnosisStatus(id, status)
```

### Treatment Services
```typescript
treatmentServices.createTreatment(data)
treatmentServices.addMedication(treatmentId, medication)
treatmentServices.getPatientTreatment(patientId)
treatmentServices.getTreatmentMedications(treatmentId)
```

### Billing Services
```typescript
billingServices.createBill(patientId, items, total)
billingServices.getPatientBill(patientId)
billingServices.updateBillStatus(billId, status, method)
```

### Feedback Services
```typescript
feedbackServices.submitFeedback(data)
feedbackServices.getPatientFeedback(patientId)
feedbackServices.getAllFeedback()
```

---

## 🔍 Common Queries for Testing

### Test in Supabase SQL Editor

```sql
-- Count all patients
SELECT COUNT(*) FROM patients;

-- Get recent patients
SELECT * FROM patients ORDER BY created_at DESC LIMIT 10;

-- Get consultation details
SELECT 
  c.*, 
  p.first_name, 
  p.last_name,
  u.full_name as doctor_name
FROM consultations c
JOIN patients p ON c.patient_id = p.id
JOIN users u ON c.doctor_id = u.id
ORDER BY c.consultation_date DESC;

-- Get patient workflow
SELECT 
  p.id,
  p.first_name,
  p.status,
  COUNT(c.id) as consultations,
  COUNT(d.id) as diagnoses,
  COUNT(t.id) as treatments
FROM patients p
LEFT JOIN consultations c ON p.id = c.patient_id
LEFT JOIN diagnoses d ON p.id = d.patient_id
LEFT JOIN treatments t ON p.id = t.patient_id
GROUP BY p.id;
```

---

## 🐛 Troubleshooting Quick Fixes

### "Missing Supabase environment variables"
```bash
# Check .env.local exists
cat .env.local

# Verify values are not empty
# Should see:
# VITE_SUPABASE_URL=https://...supabase.co
# VITE_SUPABASE_ANON_KEY=eyJh...
```

### Ports/Connection Issues
```bash
# Kill process on port 3000
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port
npm run dev -- --port 3001
```

### Database Connection Fails
```
1. Check .env.local has correct URL and key
2. Go to Supabase dashboard → Settings → API
3. Copy URL and Anon Key again
4. Restart dev server: npm run dev
```

### RLS Blocking Access
```sql
-- Temporarily disable RLS for testing
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;

-- Re-enable after testing
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
```

### CORS Errors
```
1. Go to Supabase dashboard → Settings → API
2. Add your domain to allowed origins
3. For local: http://localhost:3000
4. For production: https://yourdomain.com
```

---

## 📚 Documentation Files

- **[SUPABASE-SETUP-GUIDE.md](./SUPABASE-SETUP-GUIDE.md)** - Detailed setup instructions
- **[SUPABASE-INTEGRATION-EXAMPLES.md](./SUPABASE-INTEGRATION-EXAMPLES.md)** - Code examples for components
- **[src/services/supabaseServices.ts](./src/services/supabaseServices.ts)** - Reusable service functions

---

## 🎯 Next Steps

1. ✅ Follow SUPABASE-SETUP-GUIDE.md
2. ✅ Create all database tables (SQL provided)
3. ✅ Add credentials to .env.local
4. ✅ Update one component (use examples from SUPABASE-INTEGRATION-EXAMPLES.md)
5. ✅ Test create/read/update operations
6. ✅ Update remaining components
7. ✅ Test complete workflows
8. ✅ Deploy to production

---

## 📞 Support Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase JS Client](https://supabase.com/docs/reference/javascript)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Discord Community](https://discord.supabase.io)

---

## 🔐 Security Checklist

- [ ] RLS enabled on all tables
- [ ] Row-level policies created
- [ ] Anon key has limited permissions
- [ ] Never commit .env.local to git
- [ ] Use .env.local.example as template
- [ ] Sanitize user inputs
- [ ] Use prepared statements (Supabase handles this)
- [ ] Review database access logs regularly

---

## 📈 Performance Tips

- Use indexes on frequently queried columns
- Implement pagination for large datasets
- Cache data when possible
- Batch insert operations
- Use real-time subscriptions wisely
- Monitor database performance in Supabase dashboard

---

## 🎉 You're Ready!

Once you've completed the checklist, your healthcare app will be fully integrated with Supabase!

**Questions?** Check the documentation files or consult the Supabase docs.

Happy coding! 🚀
