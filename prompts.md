# Prompts Given to an LLM

This file contains the main prompts used during development, debugging, testing, and deployment of the project.

## 1. Initial Build

Provided the complete assignment requirements for the OTP-based checkout application, including registration, 6-digit OTP login, checkout form, email validation, guest checkout, database storage, separate frontend/backend/database layers, SQL schema, deployment, and prompt documentation.

## 2. Technology Stack

Initially explored the MERN stack. Since the assignment required an SQL schema, PostgreSQL was selected as the database.

Final stack:

* React + TypeScript + Vite
* Node.js + Express
* PostgreSQL
* Vercel
* Render

## 3. Application Development

Build the complete checkout application with separate `web`, `server`, and `db` folders.

Implement:

* User registration with email, first name, and last name
* Random 6-digit OTP generation
* Secure OTP hashing using bcrypt
* Checkout form with email, phone, and shipping address
* Email validation and registered-user detection
* OTP login and guest checkout
* Logged-in user name display
* PostgreSQL database storage
* REST API communication
* Responsive UI

## 4. Debugging Registration

Registration was not working after deployment.

Trace the complete flow:

`Frontend → API → Express Route → Controller → PostgreSQL → Response → Frontend`

Check the API URL, route, request payload, CORS, environment variables, database connection, SQL query, and error handling. Identify the actual issue and make the required fix without changing unrelated functionality.

## 5. API and Deployment Checks

Verify that the frontend and backend use the correct API endpoints, request fields, environment variables, and CORS configuration.

Check the production setup:

`Vercel → Render → PostgreSQL`

Verify the deployed frontend, backend API, database connection, build/start commands, and production API URL.

## 6. Security and Testing

Review the implementation for common security issues such as SQL injection, OTP storage, session handling, input validation, CORS, and brute-force protection.

Test registration, login, invalid OTP, duplicate users, guest checkout, logged-in checkout, form validation, database persistence, and the complete deployed flow.

## 7. Final Review

Review the complete application against the assignment requirements and fix any remaining functional or deployment issues.
