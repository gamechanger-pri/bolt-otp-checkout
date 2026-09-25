# Prompts given to an LLM

> Add every further prompt you send while iterating (bug fixes, deploy questions, etc.).

## Prompt 1 — initial build
Pasted the full assignment text ("OTP Based User Login": registration flow with a random
6-digit code; checkout form with real-time email validation, background recognition,
login modal with skip option, name display once logged in, form submission stored in a DB
table; distinct frontend/API/database layers; public deployment; schema as .sql; prompts.md).

## Prompt 2 — change stack
"mern stack"

## Prompt 3 — SQL schema
"can we add .sql in node react or not"  (switched MongoDB to Postgres so the schema can be checked in as .sql)

## Prompt 4 — minimal recreation prompt
Build a complete, working checkout app from scratch. Follow these steps:

1. **Set up the project.** Use React, TypeScript, and Vite for the website; Node.js and Express for the API; and PostgreSQL for the database. Keep the website, API, and database files in separate `web`, `server`, and `db` folders.
2. **Add registration.** Let people register with their email and first and last names. Create a random six-digit login code, show it once, and save only a bcrypt-protected version of the code in the database.
3. **Build checkout and login.** Include email, phone, and shipping-address fields. Check the email as the person types, then quietly check whether it belongs to a registered user. If it does, offer a login window where they can enter their six-digit code or continue as a guest. After login, show their name.
4. **Save orders.** Check the form data on the server and save each checkout submission in PostgreSQL. Link it to the logged-in user when possible; allow guest submissions too.
5. **Protect the app.** Use parameterized database queries, store only hashes of random login-session tokens, expire sessions after 24 hours, lock login for 15 minutes after five incorrect codes, and rate-limit sensitive API routes.
6. **Make it ready to run.** Include the SQL schema, example environment settings, local setup instructions, a Vite proxy for API requests, and a concise deployment guide. Make the interface accessible and responsive, and provide working source files rather than a plan.
