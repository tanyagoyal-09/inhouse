# PatentFlow Final Project Audit

## Authentication / Security
- JWT authentication is implemented with `jsonwebtoken`.
- `protect` verifies the bearer token and confirms the user still exists and is active.
- `requireAdmin` and `requireRole` enforce authorization.
- Passwords are hashed and verified with `bcryptjs`.
- Public registration supports Applicant/Faculty only; ADMIN cannot be self-created.
- Administrator login uses `/api/auth/admin-login`.
- Frontend now uses `patentflow-token`, `patentflow-user`, and `patentflow-role` consistently, with one-time legacy IPForge token fallback.
- Password hashes are excluded from normal User queries.

## Connected / Working Modules
1. MongoDB connection
2. User model
3. Authentication: register/login/admin-login/me/verify/logout
4. JWT middleware
5. Role-based authorization
6. Applicant/Faculty patent creation and editing
7. Patent submission/resubmission
8. Patent history
9. Technical drawing upload
10. Patent PDF generation with Puppeteer
11. Generated PDF archival as Document records
12. Document upload
13. Document listing/download/delete
14. Admin patent listing/review/status update
15. Admin document listing/review
16. Admin user listing/role update/create-admin/delete-user
17. Admin dashboard statistics
18. Frontend Axios JWT interceptor
19. Applicant/Faculty dashboard and patent workflow
20. Admin login and admin dashboard
21. Frontend document management
22. Frontend profile

## Important fixes made
- Fixed the invalid email regex pattern.
- Fixed admin seeding: `password` / `isActive` instead of obsolete `passwordHash` / `active`.
- Fixed `checkAdmin.js` to use `bcryptjs` and the current User schema.
- Fixed AdminLogin to call `/api/auth/admin-login` instead of normal login.
- Unified frontend JWT localStorage keys.
- Added Faculty registration support matching the existing UI.
- Added `department` to User schema and authentication response.
- Added missing document upload endpoint.
- Added missing admin patent detail/status endpoints used by the UI.
- Added missing admin document list/review endpoints used by the UI.
- Added document metadata and admin review fields to Document schema.
- Connected generated patent PDFs to the Document archive without changing the existing immediate PDF download behavior.
- Added FormData handling so Axios can set multipart boundaries correctly.

## Validation performed
- Backend JavaScript files pass `node --check` syntax validation.
- Backend models/routes can be loaded together successfully.
- Frontend TypeScript compilation was checked before the temporary dependency installation in this environment became incomplete.
- A full Vite production build could not be completed in this environment because the supplied `node_modules` was platform/incomplete-dependency specific. The final archive intentionally excludes `node_modules`; run `npm install` on the target Windows machine before building.

## Final setup
See `README.md` and the `.env.example` files.
Do not commit or share the real `backend/.env` file.
