# SocialSphere — CodeAlpha Task 2: Social Media Platform

A mini social media web app built for the **CodeAlpha Full Stack Development Internship — Task 2**.

## Features
- **User profiles** — sign up, log in, bio, avatar initials, follower/following/post counts
- **Posts** — create, view, delete (text + optional image URL)
- **Comments** — add and view comments on any post
- **Like system** — like/unlike posts, live like counts
- **Follow system** — follow/unfollow users, "Following" feed filter, "People" directory, "Who to follow" suggestions

## Tech Stack
- **Frontend:** HTML, CSS, JavaScript (vanilla, no frameworks)
- **Backend:** Node.js + Express.js, REST API
- **Auth:** JWT (JSON Web Tokens) + bcrypt password hashing
- **Database:** a JSON file–based data store (`backend/data/db.json`) with four collections — `users`, `posts`, `comments`, `follows` — accessed through a small data-access layer, so it behaves like a database from the rest of the app's point of view without requiring you to install/configure a separate DB server.

  > Want a "real" database instead? Swap `backend/utils/db.js` for a MongoDB (Mongoose) or SQL (Sequelize/Prisma) implementation — the routes only call `readDB()` / `writeDB()` / `nextId()`, so the rest of the app doesn't need to change.

## Project Structure
```
codealpha-social-media/
├── backend/
│   ├── data/
│   │   └── db.json          # the "database"
│   ├── middleware/
│   │   └── auth.js          # JWT verification middleware
│   ├── routes/
│   │   ├── auth.js          # register / login
│   │   ├── users.js         # profiles + follow system
│   │   ├── posts.js         # posts + like system
│   │   └── comments.js      # comments
│   ├── utils/
│   │   └── db.js            # read/write helpers for db.json
│   ├── package.json
│   └── server.js            # Express app entry point
├── frontend/
│   ├── css/style.css
│   ├── js/app.js
│   └── index.html
└── README.md
```

## How to Run

1. Make sure [Node.js](https://nodejs.org) (v16+) is installed.
2. Open a terminal in the `backend` folder and install dependencies:
   ```bash
   cd codealpha-social-media/backend
   npm install
   ```
3. Start the server:
   ```bash
   npm start
   ```
4. Open your browser at **http://localhost:5000** — the Express server serves both the API and the frontend, so that's the only URL you need.

That's it — no separate frontend server and no external database setup required. Data is saved to `backend/data/db.json` and survives server restarts.

## Trying it out
1. Sign up for two or three different accounts (use different browser tabs/incognito windows, or log out/in).
2. Create a few posts from each account.
3. Like posts, add comments, and follow other users.
4. Switch the feed between **Everyone** and **Following** to see the follow system filtering the feed.
5. Visit **People** to browse and follow every registered user.

## API Overview

| Method | Endpoint                        | Description                    | Auth |
|--------|----------------------------------|---------------------------------|------|
| POST   | `/api/auth/register`             | Create an account              | No   |
| POST   | `/api/auth/login`                | Log in                         | No   |
| GET    | `/api/users`                     | List all users                 | No   |
| GET    | `/api/users/:id`                 | Get a user's profile           | No   |
| PUT    | `/api/users/:id`                 | Update bio/avatar              | Yes  |
| POST   | `/api/users/:id/follow`          | Follow a user                  | Yes  |
| POST   | `/api/users/:id/unfollow`        | Unfollow a user                | Yes  |
| GET    | `/api/users/:id/followers`       | List followers                 | No   |
| GET    | `/api/users/:id/following`       | List who a user follows        | No   |
| GET    | `/api/posts`                     | List posts (feed)              | No   |
| POST   | `/api/posts`                     | Create a post                  | Yes  |
| DELETE | `/api/posts/:id`                 | Delete your own post           | Yes  |
| POST   | `/api/posts/:id/like`            | Like a post                    | Yes  |
| POST   | `/api/posts/:id/unlike`          | Unlike a post                  | Yes  |
| GET    | `/api/comments/post/:postId`     | List comments on a post        | No   |
| POST   | `/api/comments/post/:postId`     | Add a comment                  | Yes  |
| DELETE | `/api/comments/:id`              | Delete your own comment        | Yes  |

## Notes for the CodeAlpha submission
- This satisfies the Task 2 requirement list: user profiles, posts, comments, likes, and a follow system, built with HTML/CSS/JS on the frontend and Express.js on the backend, backed by a database layer for users/posts/comments/followers.
- Feel free to record a short demo video walking through: sign up → post → like → comment → follow another user → switch to the Following feed, for your submission/LinkedIn post as required by the internship guidelines.
