import "dotenv/config";
import crypto from "node:crypto";
import express from "express";
import cors from "cors";
import pg from "pg";
import bcrypt from "bcryptjs";
import rateLimit from "express-rate-limit";

const SESSION_HOURS = 24;

// Validation
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[0-9 ()\-]{7,20}$/;

// Database
const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.PGSSL === "true"
      ? { rejectUnauthorized: false }
      : false,
});

// Express app
const app = express();

app.set("trust proxy", 1);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || false,
  })
);

app.use(
  express.json({
    limit: "100kb",
  })
);

// -------------------------
// Helper functions
// -------------------------

const wrap = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

const fail = (res, status, error) => {
  return res.status(status).json({ error });
};

const normEmail = (value) => {
  return String(value ?? "").trim().toLowerCase();
};

const validEmail = (email) => {
  return email.length <= 254 && EMAIL_RE.test(email);
};

const sha = (value) => {
  return crypto
    .createHash("sha256")
    .update(value)
    .digest("hex");
};

const str = (value) => {
  return typeof value === "string" ? value.trim() : "";
};

// -------------------------
// Basic routes
// -------------------------

app.get("/", (_req, res) => {
  res.send("OTP Login Backend is running!");
});

app.get("/healthz", (_req, res) => {
  res.send("ok");
});

// -------------------------
// Registration
// -------------------------

app.post(
  "/api/register",
  wrap(async (req, res) => {
    const email = normEmail(req.body.email);
    const firstName = str(req.body.firstName);
    const lastName = str(req.body.lastName);

    // Validation
    if (
      !validEmail(email) ||
      !firstName ||
      !lastName ||
      firstName.length > 100 ||
      lastName.length > 100
    ) {
      return fail(
        res,
        400,
        "Enter a valid email, first name and last name."
      );
    }

    // Generate 6-digit OTP
    const code = String(
      crypto.randomInt(0, 1_000_000)
    ).padStart(6, "0");

    // Hash OTP before storing
    const codeHash = await bcrypt.hash(code, 10);

    try {
      await pool.query(
        `
        INSERT INTO users
          (email, first_name, last_name, code_hash)
        VALUES
          ($1, $2, $3, $4)
        `,
        [
          email,
          firstName,
          lastName,
          codeHash,
        ]
      );
    } catch (error) {
      // Duplicate email
      if (error.code === "23505") {
        return fail(
          res,
          409,
          "That email is already registered."
        );
      }

      throw error;
    }

    // For this assignment, show OTP once
    res.status(201).json({
      message: "Registration successful",
      code,
    });
  })
);

// -------------------------
// Recognize user
// -------------------------

app.get(
  "/api/recognize",
  rateLimit({
    windowMs: 60_000,
    limit: 60,
  }),
  wrap(async (req, res) => {
    const email = normEmail(req.query.email);

    if (!validEmail(email)) {
      return fail(res, 400, "Invalid email");
    }

    const { rows } = await pool.query(
      `
      SELECT EXISTS(
        SELECT 1
        FROM users
        WHERE email = $1
      ) AS registered
      `,
      [email]
    );

    res.json({
      registered: rows[0].registered,
    });
  })
);

// -------------------------
// Login
// -------------------------

app.post(
  "/api/login",
  rateLimit({
    windowMs: 15 * 60_000,
    limit: 30,
  }),
  wrap(async (req, res) => {
    const email = normEmail(req.body.email);
    const code = str(req.body.code);

    const bad =
      "That code doesn't match. Check it and try again.";

    if (!validEmail(email) || !code) {
      return fail(res, 401, bad);
    }

    // Find user
    const { rows } = await pool.query(
      `
      SELECT
        id,
        first_name,
        last_name,
        code_hash,
        locked_until,
        failed_attempts
      FROM users
      WHERE email = $1
      `,
      [email]
    );

    const user = rows[0];

    if (!user) {
      return fail(res, 401, bad);
    }

    // Check if account is temporarily locked
    if (
      user.locked_until &&
      user.locked_until > new Date()
    ) {
      return fail(
        res,
        429,
        "Too many attempts. Try again in a few minutes, or continue without logging in."
      );
    }

    // Compare OTP
    const codeMatches = await bcrypt.compare(
      code,
      user.code_hash
    );

    // Wrong OTP
    if (!codeMatches) {
      await pool.query(
        `
        UPDATE users
        SET
          locked_until =
            CASE
              WHEN failed_attempts + 1 >= 5
              THEN now() + interval '15 minutes'
              ELSE locked_until
            END,

          failed_attempts =
            CASE
              WHEN failed_attempts + 1 >= 5
              THEN 0
              ELSE failed_attempts + 1
            END

        WHERE id = $1
        `,
        [user.id]
      );

      return fail(res, 401, bad);
    }

    // Successful login
    await pool.query(
      `
      UPDATE users
      SET
        failed_attempts = 0,
        locked_until = NULL
      WHERE id = $1
      `,
      [user.id]
    );

    // Generate session token
    const token = crypto
      .randomBytes(32)
      .toString("hex");

    // Store only token hash in database
    await pool.query(
      `
      INSERT INTO sessions
        (token_hash, user_id, expires_at)
      VALUES
        ($1, $2, now() + make_interval(hours => $3))
      `,
      [
        sha(token),
        user.id,
        SESSION_HOURS,
      ]
    );

    // Delete expired sessions
    await pool.query(
      `
      DELETE FROM sessions
      WHERE expires_at < now()
      `
    );

    res.json({
      message: "Login successful",
      token,
      firstName: user.first_name,
      lastName: user.last_name,
    });
  })
);

// -------------------------
// Checkout
// -------------------------

app.post(
  "/api/checkout",
  wrap(async (req, res) => {
    const email = normEmail(req.body.email);

    const data = {
      phone: str(req.body.phone),
      addressLine: str(req.body.addressLine),
      city: str(req.body.city),
      postalCode: str(req.body.postalCode),
      country: str(req.body.country),
    };

    // Validate fields
    if (
      Object.values(data).some(
        (value) => !value || value.length > 200
      )
    ) {
      return fail(
        res,
        400,
        "Fill in every field."
      );
    }

    if (
      !validEmail(email) ||
      !PHONE_RE.test(data.phone)
    ) {
      return fail(
        res,
        400,
        "Check your email and phone number."
      );
    }

    // Optional authentication
    let userId = null;

    const authorization =
      req.get("authorization") || "";

    const token = authorization.replace(
      /^Bearer /,
      ""
    );

    if (token) {
      const sessionResult = await pool.query(
        `
        SELECT user_id
        FROM sessions
        WHERE
          token_hash = $1
          AND expires_at > now()
        `,
        [sha(token)]
      );

      if (sessionResult.rows[0]) {
        userId =
          sessionResult.rows[0].user_id;
      }
    }

    // Save checkout
    const { rows } = await pool.query(
      `
      INSERT INTO checkout_submissions
        (
          user_id,
          email,
          phone,
          address_line,
          city,
          postal_code,
          country
        )
      VALUES
        ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id
      `,
      [
        userId,
        email,
        data.phone,
        data.addressLine,
        data.city,
        data.postalCode,
        data.country,
      ]
    );

    res.status(201).json({
      id: String(rows[0].id),
    });
  })
);

// -------------------------
// Error handler
// -------------------------

app.use(
  (error, _req, res, _next) => {
    console.error(error);

    return fail(
      res,
      500,
      "Something went wrong"
    );
  }
);

// -------------------------
// Start server
// -------------------------

const port = process.env.PORT || 8080;

app.listen(port, () => {
  console.log(`Backend listening on :${port}`);
});
