# Acorn - Enterprise AI Project Planning Platform

## Overview
Acorn is an enterprise-grade AI-powered project planning platform that transforms complex requirements into actionable project plans, comprehensive documentation, and compliance-ready specifications.

## Architecture
- **Frontend**: React + TypeScript + Vite + TailwindCSS (Navy & Gold Corporate Theme)
- **Backend**: FastAPI (Python)
- **Database**: Supabase PostgreSQL (primary) with MongoDB fallback
- **Deployment**: Frontend on Netlify, Backend on Render

## Design System
- **Theme**: Corporate Professional - Navy & Gold
- **Primary Colors**: Navy (#0a0f1a, #0d1525, #1e3a5f) + Gold (#d4af37, #e6c358)
- **Typography**: Inter (sans-serif), JetBrains Mono (code)
- **Animations**: Impressive page transitions, staggered reveals, floating effects

## Core Features

### Implemented
- [x] User Authentication (JWT + refresh tokens)
- [x] Project CRUD operations
- [x] AI-powered phase generation (Planning, Requirements, Feasibility)
- [x] Artifact storage and versioning
- [x] Corporate Professional UI with impressive animations
- [x] Responsive sidebar with collapse functionality
- [x] Project search and filtering
- [x] Grid/List view toggle

### Planned Features
- [ ] **Persona Generation** - Create detailed user personas and stories
- [ ] **SRS Audit** - Automated compliance and quality checks
- [ ] **Stakeholder Negotiation** - Impact analysis and tracking
- [ ] **Analytics Dashboard** - Project progress, AI stats, time tracking
- [ ] **Team Collaboration** - Invite members, permissions, comments
- [ ] **Export Center** - PDF, DOCX, PowerPoint exports
- [ ] **Kanban Board** - Visual task management with drag-and-drop
- [ ] **Notifications System** - Real-time alerts for updates
- [ ] **Payment Gateway** - Subscription management (fake for demo)
- [ ] **New Business Model** - Tiered pricing structure

## What's Been Implemented

### Jan 19, 2025 - Database Migration & UI Overhaul
- **Database Migration to Supabase**
  - Fixed UUID → TEXT column type issue
  - Added FORCE_RECREATE_TABLES option for production
  - Intelligent column type detection
  - All repositories now support Supabase

- **Complete UI Overhaul - Corporate Professional**
  - Navy & Gold color scheme
  - Inter + JetBrains Mono typography
  - Impressive animations:
    - `revealUp`, `revealDown` - Blur + translate reveals
    - `dramaticEntrance` - Scale + blur dramatic entry
    - `slideInBounce` - Elastic sliding
    - `flipIn` - 3D flip animation
    - `elasticPop` - Bouncy scale
    - `float` - Gentle floating
    - `glow` - Gold pulse glow
    - `morph` - Shape morphing backgrounds
  - Glass-morphism cards
  - Gradient borders with animation
  - Professional enterprise feel

## Database Fix for Production

To fix the UUID error on Render:
1. Add environment variable: `FORCE_RECREATE_TABLES=true`
2. Redeploy
3. After successful deploy, set `FORCE_RECREATE_TABLES=false`

⚠️ This will clear existing data. Contact support for migration script if data preservation needed.

## Next Steps
1. Push to GitHub
2. Deploy database fix to Render
3. Implement remaining features (Persona, SRS Audit, etc.)
4. Add export functionality
5. Implement team collaboration

## User Personas
1. **Enterprise PM**: Needs comprehensive project documentation and compliance
2. **Product Owner**: Needs feasibility analysis and stakeholder tracking
3. **Technical Lead**: Needs requirements breakdown and task estimation
4. **Executive**: Needs high-level summaries and ROI analysis
