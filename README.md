# Health-Connect 🏥

A modern, comprehensive healthcare supply chain and patient management system built with React, TypeScript, and Supabase.

## 🚀 Features

### Core Patient Workflow
- ✅ **Patient Registration** - Secure intake process linked to user authentication.
- ✅ **Doctor Appointments** - Real-time booking system with specialist selection and status tracking.
- ✅ **Consultation Management** - Clinical workflow for doctors to record vitals and consultation notes.
- ✅ **Diagnosis & Testing** - Integrated lab test and imaging study management.
- ✅ **Pharmacy Management** - Digital medication dispensing and inventory tracking.
- ✅ **Billing & Discharge** - Complete financial processing and discharge documentation.
- ✅ **Patient Feedback** - Post-treatment satisfaction tracking and doctor ratings.

### Specialized Dashboards
- **Patient Portal**: Manage personal records, view upcoming appointments, and provide feedback.
- **Doctor Dashboard**: Manage appointment requests, conduct consultations, and track patient history.

### Modern UX/UI
- **Responsive Design**: Fully optimized for mobile, tablet, and desktop.
- **Premium Aesthetics**: Clean, modern interface with smooth transitions and professional color palettes.
- **Real-time Updates**: Instant status notifications for appointment confirmations/rejections.

## 🛠️ Tech Stack

- **Frontend**: [React 18](https://reactjs.org/) with [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Backend/Database**: [Supabase](https://supabase.com/) (Auth & PostgreSQL)
- **Forms**: [React Hook Form](https://react-hook-form.com/) with [Zod](https://zod.dev/) validation
- **Routing**: [React Router 6](https://reactrouter.com/)

## 🏁 Getting Started

### Prerequisites
- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Healthcare
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

### Available Scripts
- `npm run dev`: Start development server on `localhost:3000`
- `npm run build`: Build the project for production
- `npm run lint`: Run ESLint to check for code issues
- `npm run preview`: Preview the production build locally

## 📄 License
This project is licensed under the MIT License.

---
**Built with ❤️ for modern healthcare management.**
