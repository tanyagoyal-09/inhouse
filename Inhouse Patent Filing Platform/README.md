# Inhouse Patent Filing System — Final Setup

## Backend

1. Open a terminal in `backend`.
2. Create `.env` from `.env.example` and fill in your MongoDB URI, JWT secret and admin credentials.
3. Install dependencies:
   `npm install`
4. Create/update the administrator account:
   `npm run seed:admin`
5. Optional admin verification:
   `node src/utils/checkAdmin.js`
6. Start backend:
   `npm run dev`

Backend API: `http://127.0.0.1:5000`

## Frontend

1. Open a second terminal in `frontend`.
2. Create `.env` from `.env.example` if needed.
3. Install dependencies (this also installs `react-router-dom`, newly added for routing):
   `npm install`
   Use `npm install`, not `npm ci`, the first time so `package-lock.json` is refreshed.
4. Start frontend:
   `npm run dev`
5. Production build / preview:
   `npm run build` then `npm run preview`

Frontend: `http://127.0.0.1:5173`

## Routing

The frontend is a single-page app using **React Router** (`BrowserRouter`). Every major feature has its own URL, and the browser Back / Forward buttons follow real navigation history.

| URL | Page | Access |
| --- | --- | --- |
| `/` | Landing | public |
| `/login`, `/register` | Applicant / Faculty sign in, register | public |
| `/admin/login` | Administrator sign in | public |
| `/dashboard` | Dashboard | Applicant, Faculty |
| `/patents` (`?q=` search) | My Patents | Applicant, Faculty |
| `/patents/new` | New patent draft | Applicant, Faculty |
| `/patents/:patentId` | Patent details | Applicant, Faculty |
| `/patents/:patentId/edit` | Edit / resubmit | Applicant, Faculty |
| `/documents` | Documents | Applicant, Faculty |
| `/tracking` | Tracking | Applicant, Faculty |
| `/profile` | Profile | Applicant, Faculty |
| `/admin` | Administration overview | Admin |
| `/admin/patents` | Applications list | Admin |
| `/admin/patents/:patentId` | Application review | Admin |
| `/admin/documents` | Document review | Admin |
| anything else | 404 page | public |

### Deployment note (important)

Because routes like `/patents/123` do not exist as files, the web server must serve `index.html` for every path that is not a real file.

- **Vite dev server / `vite preview`**: already does this.
- **Netlify / Cloudflare Pages**: `frontend/public/_redirects` is included.
- **Vercel**: add a rewrite of `/(.*)` to `/index.html`.
- **nginx**: `location / { try_files $uri /index.html; }`
- **Apache**: enable `mod_rewrite` and rewrite non-file requests to `/index.html`.

Set `VITE_API_URL` (see `frontend/.env.example`) at build time to point at your API.

## Authentication

- Applicant/Faculty registration: `POST /api/auth/register`
- Applicant/Faculty login: `POST /api/auth/login`
- Administrator login: `POST /api/auth/admin-login`
- Current user: `GET /api/auth/me`
- JWT header: `Authorization: Bearer <token>`
- Passwords are hashed with `bcryptjs`.
- Public registration can only create `APPLICANT` or `FACULTY`; it cannot create `ADMIN`.

## Important

The original project `.env` is intentionally not included in the distributed project archive. Keep your existing secret values private and copy them into `backend/.env` locally.
