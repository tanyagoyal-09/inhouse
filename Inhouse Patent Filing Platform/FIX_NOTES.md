# PatentFlow – Fixed Admin Document Review

## Main fixes
1. Added a dedicated Admin Document Review section to the admin dashboard.
2. Admin can see all uploaded documents, linked patent, uploader, validation status and upload time.
3. Added admin document review actions:
   - Approve Document
   - Request Changes
   - Reject
4. Added persistent admin document review fields to the Document MongoDB model.
5. Added protected admin API endpoints:
   - GET /api/admin/documents
   - PATCH /api/admin/documents/:id/review
6. Existing secure document download endpoint is used for document viewing.
7. Applicant Documents page now displays administrator review status/comments.
8. Existing patent application review workflow remains intact.

## Important
- `node_modules` and `.env` were intentionally excluded from this ZIP.
- Keep your existing `.env` file in the backend.
- After extracting, run `npm install` in both `frontend` and `backend` if needed.
