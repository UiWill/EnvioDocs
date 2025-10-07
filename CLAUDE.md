# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EnvioDocs is a dual-interface document management system for accounting firms and their clients. The application enables accounting firms to manage documents, contracts, and communications with clients through a web interface.

**Technology Stack:**
- Frontend: Vanilla HTML/CSS/JavaScript
- Database/Auth: Supabase
- Email: EmailJS
- PDF Generation: jsPDF
- Animations: GSAP, Lottie, AOS
- Smooth Scrolling: Lenis

## Architecture

### Two Main Application Areas

1. **Public Website (Root Level)**
   - Marketing/landing pages (`index.html`, `comoFunciona.html`, `funcoes.html`, etc.)
   - Located in project root
   - Uses `assets/` folder for CSS, JS, images, fonts
   - Entry point: `index.html`

2. **CONTABILIDADE System (Accounting Portal)**
   - Located in `CONTABILIDADE/` directory
   - Portal for accounting firms to manage clients and documents
   - Key pages:
     - `login.html` - Authentication for accounting firms
     - `dashboard.html` - Main dashboard with overview cards
     - `clientes.html` - Client management (CRUD operations)
     - `clienteDetails.html` - Detailed view of individual client
     - `contratos.html` - Contract management
     - `comunicados.html` - Communications/notifications
     - `verContratos.html`, `verComprovantes.html` - View documents
   - Uses own `assets/` folder (CSS in `assets/css/`, JS in `assets/js/`)

3. **CLIENTES System (Client Portal)**
   - Located in `CLIENTES/` directory
   - Portal for clients to access their documents
   - Key pages:
     - `login.html` - Authentication for clients
     - `clienteDetails.html` - Client's own document view
     - `contratos.html` - View contracts
     - `comprovantes.html` - View receipts/proof documents
     - `comunicados.html` - View notifications

## Key JavaScript Modules

### Supabase Integration (`CONTABILIDADE/assets/js/supabase.js`)
- Initializes Supabase client with credentials
- Provides authentication functions (`loginWithEmail`, `getCurrentUser`, etc.)
- Database query wrappers for tables: `contabilidades`, `clientes`, `contratos`, `comprovantes`, `comunicados`
- **Important:** File encoding appears to be UTF-16 or has encoding issues - handle with care

### Session Management (`CONTABILIDADE/assets/js/session-guard.js`)
- Protects authenticated pages from unauthorized access
- Detects context (CLIENTES vs CONTABILIDADE pages)
- Monitors session state and redirects to login on expiration
- Intercepts navigation and HTTP 401/403 responses
- Implements visibility change detection for tab switches

### Dashboard Logic (`CONTABILIDADE/assets/js/dashboard.js`)
- Loads user data and displays statistics
- Card navigation system for dashboard overview
- Report verification functionality
- Searches for documents with missing fields

### Client Management (`CONTABILIDADE/assets/js/clienteDetails.js`)
- Detailed client information display
- Document management for specific clients
- File operations and uploads

### Communications (`CONTABILIDADE/assets/js/comunicados.js`)
- Handles notifications/announcements to clients

### Public Site Features (`assets/js/`)
- `emailForm.js` - EmailJS integration for contact form
- `menu.js`, `header.js` - Navigation components
- `animations.js` - GSAP/Lottie animations
- `actionButton.js` - Fixed buttons (WhatsApp, back to top)
- `slideSobre.js`, `slidePortfolio.js` - Carousel/slider components

## Database Schema (Supabase Tables)

Based on code analysis, the main tables are:
- `contabilidades` - Accounting firm records
- `clientes` - Client records (linked to accounting firms via CNPJ)
- `contratos` - Contract documents
- `comprovantes` - Proof/receipt documents
- `comunicados` - Notifications/announcements

## Development Workflow

### Running the Application
This is a static HTML/CSS/JS application. No build process required.

**Local Development:**
- Use any local web server (e.g., Live Server for VS Code, Python `http.server`, or similar)
- Open `index.html` for public site
- Navigate to `CONTABILIDADE/login.html` or `CLIENTES/login.html` for respective portals

### Testing Authentication
- Supabase credentials are hardcoded in `supabase.js`
- Test accounts must exist in Supabase database
- Session storage is used for client data in CLIENTES portal
- Local storage is used for Supabase auth tokens

## Important Considerations

### File Encoding Issues
- Some JS files (especially `supabase.js`, `contratos.js`) have UTF-16 or mixed encoding
- When editing these files, preserve the encoding or convert carefully to UTF-8
- Watch for unusual character sequences in existing files

### Path References
The application uses relative paths extensively. Be careful with:
- `CLIENTES/` pages reference `../CONTABILIDADE/assets/` for shared resources
- Navigation between portals requires correct relative paths
- Image paths differ between root and subdirectory pages

### Session Protection
- `session-guard.js` runs automatically on protected pages
- Verifies session on page load, navigation, and visibility changes
- Intercepts fetch requests for 401/403 handling
- Do not bypass or remove session checks without understanding implications

### Supabase Configuration
- Credentials are in plaintext in `supabase.js` (URL and anon key)
- All database operations go through Supabase client
- RLS (Row Level Security) policies likely configured in Supabase dashboard

## Common Tasks

### Adding a New Page to CONTABILIDADE Portal
1. Create HTML file in `CONTABILIDADE/` directory
2. Include standard head section with CSS/JS references:
   - `assets/css/style.css`, `assets/css/responsividade.css`
   - Supabase CDN script
   - `assets/js/supabase.js`
   - `assets/js/session-guard.js` (for protected pages)
3. Follow existing page structure (sidebar, main-content sections)
4. Add navigation link in sidebar of existing pages

### Adding a New Database Query Function
1. Add function to `CONTABILIDADE/assets/js/supabase.js`
2. Follow existing patterns (async/await, error handling)
3. Return `{ data, error }` object structure
4. Log queries for debugging: `console.log('Função chamada com:', params)`

### Updating Styles
- Root site: `assets/css/style.css`, `assets/css/responsividade.css`
- CONTABILIDADE/CLIENTES: `CONTABILIDADE/assets/css/style.css`, `CONTABILIDADE/assets/css/responsividade.css`
- Dashboard-specific: `CONTABILIDADE/assets/css/dashboard.css`
- Use CSS custom properties (variables) defined in `:root` selector

### Working with Git
This is a Git repository. The current branch is `main`.
- Recent commits are automated ("Automatico")
- No specific branching strategy detected
- Standard git commands apply
