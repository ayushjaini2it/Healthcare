import { Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import PatientRegistration from './pages/PatientRegistration'
import Consultation from './pages/Consultation'
import Diagnosis from './pages/Diagnosis'
import TreatmentDecision from './pages/TreatmentDecision'
import Pharmacy from './pages/Pharmacy'
import Billing from './pages/Billing'
import Discharge from './pages/Discharge'
import Feedback from './pages/Feedback'

function App() {
  return (
    <Layout>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/registration" element={<PatientRegistration />} />
        <Route path="/consultation" element={<Consultation />} />
        <Route path="/diagnosis" element={<Diagnosis />} />
        <Route path="/treatment" element={<TreatmentDecision />} />
        <Route path="/pharmacy" element={<Pharmacy />} />
        <Route path="/billing" element={<Billing />} />
        <Route path="/discharge" element={<Discharge />} />
        <Route path="/feedback" element={<Feedback />} />
      </Routes>
    </Layout>
  )
}

export default App
