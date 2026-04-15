# 🎟️ GetMeATicket — Backend

This is the backend for a simple seat booking system.

At first glance, it looks like:

> “just book a seat”

But underneath, it’s actually a small system handling:

* authentication
* session lifecycle
* concurrency (yes, that too)
* and state consistency

Built without blindly copying stuff. Every part exists because it *needed to exist*.

---

## 🧠 Core Idea

The system answers one simple question:

> “Who are you… and are you allowed to book this seat?”

Everything else is built around that.

---

## ⚙️ Tech Stack

* **Node.js + Express**
* **PostgreSQL (NeonDB)**
* **JWT (Access + Refresh tokens)**
* **Cookies for session handling**
* **pg Pool for DB connections**

No ORM. Just raw queries.
Because sometimes you need to feel the system, not abstract it away.

---

## 🔐 Authentication Flow

This backend uses **Access + Refresh token strategy**.

### 1. Register

* User sends: `username, email, password`
* Password is hashed with a random salt
* Stored in DB

---

### 2. Login

* Credentials verified
* Generates:

  * **Access Token** (short-lived)
  * **Refresh Token** (long-lived)
* Refresh token is **hashed and stored in DB**
* Both tokens sent via **httpOnly cookies**

---

### 3. /me (Identity Check)

* Reads access token from cookies
* Verifies token
* Fetches user from DB
* Returns user info

This endpoint answers:

> “Am I still valid?”

---

### 4. Refresh Token Flow

* If access token expires:

  * Client calls `/auth/refresh`
* Backend:

  * verifies refresh token
  * compares hashed version with DB
  * generates new tokens
  * replaces old refresh token (rotation)

This ensures:

> Old tokens die. New ones replace them.

---

### 5. Logout

* Refresh token removed from DB
* Cookies cleared

After this:

> Your identity is gone. Completely.

---

## 🪑 Seat Booking Logic

This is where things get interesting.

### Endpoint:

```http
PUT /:id/:name
```

### Flow:

1. Start DB transaction
2. Lock seat row:

   ```sql
   SELECT * FROM seats WHERE id=$1 AND isbooked=0 FOR UPDATE
   ```
3. If seat already booked → fail
4. Else:

   * mark as booked
   * store user name
5. Commit transaction

---

### 🧠 Why `FOR UPDATE`?

Because without it:

> Two users could book the same seat at the same time.

With it:

> Only one survives. The other gets rejected.

---

## 🌍 Public vs Protected

* `/seats` → public (anyone can view)
* booking → logically requires identity (handled via frontend + `/me`)
* `/auth/*` → handles identity lifecycle

---

## 🔄 Session Philosophy

The backend never assumes:

> “User is logged in”

Instead, it constantly verifies:

* Access token → quick validation
* Refresh token → recovery mechanism
* DB → final source of truth

---

## 🧪 Error Handling Approach

Not everything throws errors loudly.

Some failures are intentional:

* Invalid token → reject quietly
* Expired session → require refresh
* Seat already booked → controlled failure

---

## 🧠 What This Backend Teaches

This isn’t just CRUD.

It touches:

* how identity flows through a system
* how state changes over time
* how to prevent race conditions
* how frontend and backend coordinate

---

## ⚡ Final Thought

This project started as:

> “Let me book a seat”

It became:

> “Let me understand how systems behave when multiple users, identity, and time all interact.”

---

If something breaks, it’s not a failure.

It’s just the system revealing where your understanding needs to grow.

---
