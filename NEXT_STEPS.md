# 🎯 Next Steps - Acorn Implementation Roadmap

## ✅ Completed
- ✅ Backend implementation (all services, routes, models)
- ✅ AI providers (Claude, OpenAI, Ollama, Gemini, Stub)
- ✅ Database schema design (10 new tables)
- ✅ Frontend design system (colors, gradients, tokens)
- ✅ Tailwind config with Acorn branding
- ✅ Python 3.9 compatibility
- ✅ Local server running and tested
- ✅ Git commits pushed to GitHub

---

## 🚀 Immediate Next Steps (Critical)

### 1. **Run Database Migration** ⚠️ REQUIRED
**Priority**: Critical  
**Time**: 5 minutes  
**Why**: New features need database tables to work

**Steps**:
```bash
1. Go to: https://supabase.com/dashboard/project/qscbybwxuybptijwdyvc/sql
2. Open file: supabase/migrations/003_add_new_features.sql
3. Copy entire contents
4. Paste into Supabase SQL Editor
5. Click "Run"
6. Verify: "Success. No rows returned"
```

**Tables Created**:
- `personas` - User personas
- `user_stories` - User stories
- `srs_audits` - Audit reports
- `audit_findings` - Audit details
- `stakeholders` - Stakeholder registry
- `stakeholder_feedback` - Feedback tracking
- `impact_analyses` - Impact analysis
- `subscriptions` - Subscription management
- `payment_methods` - Payment methods
- `invoices` - Invoice tracking

---

### 2. **Verify Render Deployment** 
**Priority**: High  
**Time**: 2-3 minutes (auto)  
**Status**: Should be deploying now

**Check**:
```bash
# Wait 2-3 minutes, then test:
curl https://gp2official.onrender.com/
curl https://gp2official.onrender.com/api/health
curl https://gp2official.onrender.com/api/billing/plans
```

**If deployment fails**:
- Check Render logs for Python 3.9 compatibility issues
- Verify all dependencies in requirements.txt
- Check environment variables

---

### 3. **Add AI Provider API Keys** (Optional)
**Priority**: Medium  
**Time**: 2 minutes  
**Why**: Enable Claude and OpenAI providers

**In Render Dashboard**:
```
Environment Variables:
- CLAUDE_API_KEY=your_anthropic_key_here
- OPENAI_API_KEY=your_openai_key_here
- OLLAMA_BASE_URL=http://localhost:11434 (if using Ollama)
```

**Without keys**:
- Gemini provider will work (existing key)
- Stub provider will work (mock responses)
- Claude and OpenAI will be unavailable

---

## 🎨 Frontend Implementation (Next Phase)

### 4. **Landing Page Refactor**
**Priority**: High  
**Time**: 2-3 hours  
**File**: `frontend/src/pages/LandingPage.tsx`

**Changes**:
```tsx
// Use Acorn design tokens
import { colors, gradients, shadows } from '@/design-system/tokens';

// Update hero section
- Old: Generic blue gradient
+ New: Acorn gradient (orange → blue → navy)

// Add Acorn logo
<img src="/logo.png" alt="Acorn" className="h-12" />

// Update CTA buttons
className="bg-gradient-primary text-white shadow-acorn"

// Update feature cards
className="bg-white border-orange-200 shadow-arrow"
```

**Key Areas**:
- [ ] Hero section with Acorn gradient background
- [ ] Logo in header (replace "GP2")
- [ ] Feature cards with orange/blue accents
- [ ] CTA buttons with Acorn gradient
- [ ] Footer with Acorn branding

---

### 5. **Auth Pages Refactor**
**Priority**: High  
**Time**: 1-2 hours  
**Files**: 
- `frontend/src/pages/LoginPage.tsx`
- `frontend/src/pages/SignupPage.tsx`

**Changes**:
```tsx
// Login/Signup forms
- Old: Generic styling
+ New: Acorn gradient background, orange accents

// Logo
<img src="/logo.png" alt="Acorn" className="h-16 mb-8" />

// Input fields
className="border-orange-200 focus:border-orange-400 focus:ring-orange-400"

// Submit button
className="bg-gradient-primary text-white shadow-acorn hover:shadow-arrow"
```

---

### 6. **Dashboard Refactor**
**Priority**: High  
**Time**: 3-4 hours  
**File**: `frontend/src/pages/DashboardPage.tsx`

**Changes**:
```tsx
// Header with logo
<img src="/logo.png" alt="Acorn" className="h-10" />

// Project cards
className="bg-white border-l-4 border-orange-400 shadow-arrow"

// Stats cards
- Old: Blue accents
+ New: Orange/blue gradient backgrounds

// Action buttons
className="bg-gradient-orange text-white"
```

**Key Areas**:
- [ ] Logo in header navigation
- [ ] Project cards with orange left border
- [ ] Stats cards with gradient backgrounds
- [ ] New project button with Acorn gradient
- [ ] Sidebar with Acorn color scheme

---

### 7. **Phase Pages Refactor**
**Priority**: Medium  
**Time**: 4-5 hours  
**Files**: All phase-related components

**Changes**:
```tsx
// Phase navigation
- Old: Generic tabs
+ New: Orange active state, blue hover

// Phase cards
className="border-orange-200 hover:border-orange-400 hover:shadow-acorn"

// Progress indicators
- Old: Blue progress bars
+ New: Orange → blue gradient progress bars

// AI generation buttons
className="bg-gradient-primary text-white shadow-arrow"
```

**Key Areas**:
- [ ] Phase navigation tabs
- [ ] Requirement cards
- [ ] Task cards
- [ ] Diagram canvas
- [ ] AI generation UI
- [ ] Export buttons (new feature!)

---

### 8. **Profile Page Refactor**
**Priority**: Low  
**Time**: 1-2 hours  
**File**: `frontend/src/pages/ProfilePage.tsx`

**Changes**:
```tsx
// Avatar border
className="border-4 border-orange-400"

// Save button
className="bg-gradient-primary text-white shadow-acorn"

// Settings sections
className="border-l-4 border-blue-400"
```

---

### 9. **Add New Feature UIs**
**Priority**: High  
**Time**: 6-8 hours  
**New Components Needed**:

#### A. Persona Generation UI
**File**: `frontend/src/components/PersonaGenerator.tsx`
```tsx
// Button to trigger generation
<button className="bg-gradient-orange">
  Generate Personas
</button>

// Persona cards display
<div className="grid grid-cols-3 gap-4">
  {personas.map(persona => (
    <PersonaCard persona={persona} />
  ))}
</div>
```

#### B. SRS Audit UI
**File**: `frontend/src/components/SRSAudit.tsx`
```tsx
// Audit trigger button
<button className="bg-gradient-blue">
  Run SRS Audit
</button>

// Audit results display
<div className="space-y-4">
  <ScoreCard category="Completeness" score={85} />
  <ScoreCard category="Consistency" score={92} />
  <ScoreCard category="Clarity" score={78} />
  <ScoreCard category="Testability" score={88} />
</div>

// Findings list
<FindingsList findings={audit.findings} />
```

#### C. Billing/Subscription UI
**File**: `frontend/src/components/BillingPage.tsx`
```tsx
// Pricing cards
<div className="grid grid-cols-3 gap-6">
  <PricingCard 
    plan="free" 
    price={0}
    features={["5 projects", "Basic AI"]}
    className="border-2 border-gray-200"
  />
  <PricingCard 
    plan="pro" 
    price={29}
    features={["Unlimited projects", "Advanced AI", "Export"]}
    className="border-4 border-orange-400 shadow-acorn"
    featured
  />
  <PricingCard 
    plan="enterprise" 
    price={99}
    features={["Everything", "Custom AI", "Dedicated support"]}
    className="border-2 border-blue-400"
  />
</div>
```

#### D. Export Buttons
**Add to Project Pages**:
```tsx
<div className="flex gap-2">
  <button 
    onClick={() => exportPDF(projectId)}
    className="bg-gradient-primary text-white"
  >
    Export PDF
  </button>
  <button 
    onClick={() => exportDOCX(projectId)}
    className="bg-gradient-blue text-white"
  >
    Export DOCX
  </button>
</div>
```

---

## 🧪 Testing Phase

### 10. **End-to-End Testing**
**Priority**: High  
**Time**: 2-3 hours

**Test Scenarios**:
```bash
# 1. User Registration & Login
- Sign up with new account
- Verify email flow
- Login with credentials

# 2. Project Creation
- Create new project
- Add requirements
- Add tasks

# 3. AI Features
- Generate personas (test new feature!)
- Generate user stories (test new feature!)
- Run SRS audit (test new feature!)
- Generate diagrams

# 4. Billing (Fake Gateway)
- View pricing plans
- Subscribe to Pro plan
- Process payment (always succeeds)
- Cancel subscription

# 5. Export
- Export project as PDF
- Export project as DOCX
- Verify Acorn branding in exports

# 6. UI/UX
- Verify Acorn logo on all pages
- Check gradient backgrounds
- Test responsive design
- Verify color consistency
```

---

## 🚀 Production Deployment

### 11. **Final Deployment**
**Priority**: High  
**Time**: 30 minutes

**Backend (Render)**:
```bash
# Already auto-deploying from GitHub
# Verify at: https://gp2official.onrender.com
```

**Frontend (Netlify)**:
```bash
cd frontend
npm run build
# Deploy to: https://gp2official-frontend.netlify.app
```

**Environment Variables**:
```env
# Frontend (.env.production)
VITE_API_URL=https://gp2official.onrender.com

# Backend (Render)
CLAUDE_API_KEY=your_key
OPENAI_API_KEY=your_key
SUPABASE_URL=https://qscbybwxuybptijwdyvc.supabase.co
SUPABASE_SERVICE_KEY=your_key
```

---

## 📊 Implementation Timeline

### Week 1: Core UI Refactor (20-25 hours)
- Day 1-2: Landing page + Auth pages (4-5 hours)
- Day 3-4: Dashboard refactor (3-4 hours)
- Day 5-7: Phase pages refactor (4-5 hours)
- Day 7: Profile page (1-2 hours)
- Day 7: New feature UIs (6-8 hours)

### Week 2: Testing & Polish (10-15 hours)
- Day 1-2: End-to-end testing (2-3 hours)
- Day 3-4: Bug fixes and polish (4-6 hours)
- Day 5: Performance optimization (2-3 hours)
- Day 6: Final deployment (2-3 hours)

**Total Estimated Time**: 30-40 hours

---

## 🎨 Design Guidelines

### Color Usage
```css
/* Primary Actions */
.cta-button { @apply bg-gradient-primary text-white shadow-acorn; }

/* Secondary Actions */
.secondary-button { @apply bg-gradient-orange text-white; }

/* Cards */
.card { @apply bg-white border-orange-200 shadow-arrow; }

/* Active States */
.active { @apply border-orange-400 text-orange-600; }

/* Hover States */
.hover { @apply hover:border-orange-400 hover:shadow-acorn; }
```

### Logo Placement
- Header: Left side, 40-48px height
- Landing hero: Center, 64-80px height
- Auth pages: Center top, 64px height
- Footer: Left side, 32px height

---

## 📝 Quick Reference

### Design System Files
- `frontend/src/design-system/tokens.ts` - All design tokens
- `frontend/tailwind.config.js` - Tailwind configuration
- `frontend/public/logo.png` - Acorn logo

### Backend Files
- `backend/services/persona_service.py` - Persona generation
- `backend/services/srs_audit_service.py` - SRS audit
- `backend/services/subscription_service.py` - Billing
- `backend/services/export_service.py` - PDF/DOCX export

### API Endpoints
```
POST /api/projects/{id}/personas/generate
POST /api/projects/{id}/user-stories/generate
POST /api/projects/{id}/srs-audit
GET  /api/billing/plans
POST /api/billing/subscribe
GET  /api/projects/{id}/export/pdf
GET  /api/projects/{id}/export/docx
```

---

## ✅ Success Criteria

**Backend**: ✅ Complete
- All services implemented
- All routes working
- Database schema ready
- Python 3.9 compatible
- Running locally and deploying

**Frontend**: 🔄 In Progress
- [ ] Acorn logo on all pages
- [ ] Gradient backgrounds throughout
- [ ] Orange/blue color scheme consistent
- [ ] New feature UIs implemented
- [ ] Responsive design maintained
- [ ] All pages refactored

**Testing**: ⏳ Pending
- [ ] End-to-end tests pass
- [ ] All features working
- [ ] No console errors
- [ ] Performance optimized

**Deployment**: ⏳ Pending
- [ ] Backend live on Render
- [ ] Frontend live on Netlify
- [ ] Database migration complete
- [ ] Environment variables set

---

## 🎯 Priority Order

1. **CRITICAL**: Run database migration (5 min)
2. **HIGH**: Verify Render deployment (2-3 min)
3. **HIGH**: Landing page refactor (2-3 hours)
4. **HIGH**: Dashboard refactor (3-4 hours)
5. **HIGH**: New feature UIs (6-8 hours)
6. **MEDIUM**: Phase pages refactor (4-5 hours)
7. **MEDIUM**: Auth pages refactor (1-2 hours)
8. **LOW**: Profile page refactor (1-2 hours)
9. **HIGH**: End-to-end testing (2-3 hours)
10. **HIGH**: Production deployment (30 min)

---

**Start with Step 1 (Database Migration) - it's required for all new features to work!** 🚀
