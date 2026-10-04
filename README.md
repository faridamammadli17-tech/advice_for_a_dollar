# Advice for a Dollar

A one-person advice service. Someone writes down a problem, pays 1 AZN, and
Farida writes back personally. Approved problems can be shared publicly so that
other people reading them feel less alone.

This file is how to **run and operate** it. `NOTES.md` is the decision log —
why things are the way they are, and what is still outstanding.

---

## Running it on your own machine

You need two things running at once: the **website** and the **server**. Open
two Terminal windows, and in each one first go to the project:

```bash
cd ~/Desktop/"advice for a dollar new"
```

**Window 1 — the server** (the database and the API):

```bash
npm run server
```

**Window 2 — the website:**

```bash
npm run dev
```

Then open **http://localhost:5173**.

To stop either one, click its Terminal window and press `Ctrl` + `C`.

### First time only

```bash
npm install
```

And set an admin password — see below.

---

## Getting into the dashboard

The dashboard at **/admin** is where you read submissions and write replies.

Set a password once:

```bash
npm run admin:hash
```

It asks for a password and prints two lines. Create a file called `.env` in the
project folder and paste them in:

```
ADMIN_PASSWORD_HASH=...
ADMIN_PASSWORD_SALT=...
```

Restart the server. Your password itself is never stored anywhere — keep it in
a password manager. If you lose it, run `npm run admin:hash` again to set a new
one.

### What the dashboard does

It opens on **Needs me** — everything waiting on you, which is the question you
usually have. The other tabs are *Awaiting review*, *Flagged*, and *Everything*.

For each submission you can: write a reply, publish it or decline to publish,
give it a category, and flag it for safety.

Things it deliberately will **not** let you do:

- **Edit what someone wrote.** Your decision, recorded in `NOTES.md`. What they
  wrote is what appears, or it is not published.
- **Publish a private submission.** The database refuses, regardless of which
  buttons are pressed.
- **Publish a safety-flagged submission.** Same.

---

## Adding artwork

Drop PNG files into `src/pixel/assets/`, then:

```bash
npm run art:check
```

It reports each file's **real** format (not just its name), its true size, and
whether it is usable. Then tell Claude and it gets registered.

If a file arrives already enlarged by a whole number, this can often recover
the original exactly:

```bash
npm run art:recover input.png output.png
```

The rules for getting art delivered intact are in `ART_GUIDELINES.md` — that
document is written to be sent to the artist.

---

## Every command

| Command | What it does |
| --- | --- |
| `npm run dev` | the website, on port 5173 |
| `npm run server` | the API and database, on port 8787 |
| `npm test` | all 129 tests |
| `npm run typecheck` | checks the code for type mistakes |
| `npm run lint` | checks code style |
| `npm run build` | builds for release — **refuses if anything unsafe is unfinished** |
| `npm run preflight` | just that safety check, without building |
| `npm run admin:hash` | set the admin password |
| `npm run art:check` | inspect artwork files |
| `npm run art:recover` | recover pixel art from a clean enlargement |

---

## The safety check before release

`npm run build` will **refuse to build** while anything unsafe is unfinished.
Right now it refuses for two reasons:

1. The crisis numbers on the safety screen are still placeholders.
2. The copy still contains `AGE_PLACEHOLDER`.

That is deliberate. The first one matters most: someone in crisis must never be
shown a phone number that does not answer.

To build anyway, for testing only:

```bash
ALLOW_PLACEHOLDER_CONTENT=1 npm run build
```

That bundle must not be put online.

---

## Where things are

```
src/
  content/       every word on the site — placeholder.ts, pages.ts, crisis.ts
  pixel/         the pixel-art engine, and assets/ where artwork goes
  pages/         one file per page
  lib/safety/    the crisis screening rules, and their tests
server/
  db.ts          the database, and the rule about what may be published
  app.ts         the API
  repo.ts        every database operation
data/
  advice.db      the database itself — this is the thing to back up
```

**Backing up is copying `data/advice.db`.** That single file holds every
submission, reply and payment record. Copy it somewhere safe regularly.

---

## What is still outstanding

Waiting on you:

- the real crisis numbers, in `src/content/crisis.ts`
- your age, for the "Why one manat?" line
- a real problem-and-reply for the homepage example

Waiting on others:

- the forest background scene, from the artist
- Epoint and Payriff's API documentation, before real payments can work

Not built yet:

- sending email — the "your answer is ready" reminder, and delivering a
  recovered link to an inbox

Until real payments exist the site runs on a mock provider: everything works
end to end, but no money moves.

---

## Version control

The project lives in Git now, on GitHub at
`faridamammadli17-tech/advice_for_a_dollar`. Every change has an undo.

One thing Git deliberately does **not** hold is `data/advice.db`, the database
itself. It contains what people wrote and must never be pushed anywhere public.
Back it up by copying the file, as described above.
