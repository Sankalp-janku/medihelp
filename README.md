# Disha
Phase 1 of the Disha MERN app: accounts with phone OTP, Disha ID, documents, doctor OTP access, permanent Patient History.

## Run
1. MongoDB running locally (or set MONGO_URI).
2. `cd server && cp .env.example .env` (edit JWT_SECRET) `&& npm i && npm run dev`
3. `cd client && cp .env.example .env && npm i && npm run dev` then open http://localhost:5173
4. In development, OTP codes are printed in the server console (no SMS provider yet).
5. Create an admin: `cd server && npm run create-admin -- admin@x.com StrongPass1`. Log in at /login and you land on the Admin dashboard, where doctors are reviewed, approved or rejected (with a reason).

## Layers
routes -> controllers/handlers -> services -> models. Config in server/src/config/env.js (validated at start).
