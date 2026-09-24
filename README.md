# Sangeetha — LIC & Star Health Insurance Advisor Website

A fast, mobile-responsive static website for Sangeetha, a LIC and Star Health
Insurance advisor based in Coimbatore. Built with plain HTML5, CSS3 and
vanilla JavaScript — no build step and no server of its own. Ready to deploy
on GitHub Pages or any static host. The optional contact / customer portal
stores messages in Supabase (see section 8).

## Project structure

```
insurance-website/
│
├── index.html              Main page (all sections)
├── README.md
│
├── css/
│   └── style.css           All styles
│
├── js/
│   └── app.js               Navigation, gallery, map, animations
│
├── images/
│   ├── gallery.json          Gallery manifest (auto-loaded by app.js)
│   ├── logo.svg
│   ├── hero-illustration.svg
│   └── gallery1.svg … gallery6.svg
│
├── account.html            Customer / admin portal (sign in, enquiries, replies)
│
├── js/config.js             Supabase URL + publishable key
├── js/portal.js             Portal logic
├── supabase/migrations/     Database schema, security rules, admin role
│
├── Posters/
│   ├── posters.json          Poster manifest (auto-loaded by app.js)
│   └── P1.jpeg … P7.jpeg, P4.png
│
└── assets/
    └── icons/                Reserved for any extra icon assets
```

## 1. Running locally

Because the gallery loads `images/gallery.json` with `fetch()`, the site
needs to be served over `http://`, not opened directly as a `file://` path
(browsers block `fetch` for local files). Use any simple local server:

```bash
# Python 3
python -m http.server 8080
```

```bash
# Node.js (npx, no install needed)
npx serve .
```

Then open `http://localhost:8080` in your browser.

VS Code's "Live Server" extension also works.

## 2. Adding gallery images

1. Drop your image file (JPG, PNG, WEBP or SVG) into the `images/` folder.
2. Add an entry for it in `images/gallery.json`.
3. Refresh the page — the gallery renders automatically from the JSON list.

No HTML editing is required to add, remove or reorder gallery images.

## 3. How `gallery.json` works

`images/gallery.json` is a plain JSON array. Each entry needs an `image`
filename (relative to `images/`); `title` and `description` are optional.

```json
[
  {
    "image": "gallery1.svg",
    "title": "Family Protection",
    "description": "Plan for your family's financial security."
  },
  {
    "image": "my-photo.jpg"
  }
]
```

- If `title`/`description` are omitted, only the image is shown.
- `js/app.js` fetches this file on page load and builds the gallery cards,
  the auto-scrolling track, and the lightbox from it — nothing is
  hardcoded in `index.html`.
- If an image fails to load, a clean placeholder card is shown instead of
  a broken-image icon.

## 3a. Posters section (`Posters/`)

The "Insurance Awareness Posters" section works exactly like the gallery,
but reads from `Posters/posters.json` and displays a responsive grid
instead of an auto-scrolling track.

```json
[
  {
    "image": "P1.jpeg",
    "title": "Protect Your Family. Plan for Tomorrow.",
    "description": "Reliable guidance for your LIC life insurance and Star Health insurance needs."
  }
]
```

To add a new poster: drop the image file into `Posters/` and add an entry
to `Posters/posters.json`. No HTML editing required. Clicking a poster
opens it in the same lightbox used by the gallery.

## 3b. Video section (`Video/`)

The "Watch & Learn" section (below Posters) works the same way, reading
from `Video/videos.json` and rendering a responsive grid of native
`<video>` players with built-in controls.

```json
[
  {
    "file": "V1.mp4",
    "title": "Insurance Awareness — Video 1",
    "description": "A short video from Sangeetha on LIC and Star Health insurance services in Coimbatore."
  }
]
```

To add a new video: drop the file into `Video/` and add an entry to
`Video/videos.json`. No HTML editing required. Videos use
`preload="metadata"` so only a small amount of data loads until a
visitor presses play, keeping the page fast.

## 4. Changing contact information

Edit the relevant text/links directly in `index.html`:

- Phone number: search for `9524608535` (appears in `tel:` and `wa.me`
  links across the header, hero, contact section and floating buttons).
- Email: search for `srsakthi2014@gmail.com` (`mailto:` links).
- Address: edit the `<address>` block inside the `#contact` section.
- Map coordinates: edit the `lat`/`lng` values inside `initMap()` in
  `js/app.js`, and the `mlat`/`mlon` values in the "Get Directions" link
  in `index.html`.

## 5. Changing social media links

Open `js/app.js` and edit the `SOCIAL_LINKS` object near the top of the
file:

```js
var SOCIAL_LINKS = {
  facebook: "",
  x: "",
  instagram: "",
  whatsapp: "https://wa.me/919524608535"
};
```

Any entry left as an empty string `""` is hidden automatically. Paste in
the real profile URL to make that icon appear in the header, contact
section and footer.

## 6. Deploying to GitHub Pages

All asset paths in this project are relative (e.g. `css/style.css`, not
`/css/style.css`), so the site works correctly both at the root of a
domain and at a GitHub Pages project URL such as
`https://USERNAME.github.io/REPOSITORY/`.

```bash
git init
git add .
git commit -m "Initial website"
git branch -M main
git remote add origin YOUR_REPOSITORY_URL
git push -u origin main
```

Then, on GitHub:

1. Go to your repository → **Settings** → **Pages**.
2. Under "Build and deployment", set **Source** to `Deploy from a branch`.
3. Choose branch `main` and folder `/ (root)`.
4. Save. GitHub will publish the site at:

```
https://USERNAME.github.io/REPOSITORY/
```

(Replace `USERNAME` and `REPOSITORY` with your GitHub username and repo
name.)

## 8. Contact form & customer / admin portal (Supabase)

The home page has a **Send a Message** form, and `account.html` is a portal
where:

- **Guests** can send a message without an account.
- **Customers** create an account with their email, then check Sangeetha's
  replies, answer, or ask follow-up questions in a threaded conversation.
  Earlier guest messages sent from the same (confirmed) email appear
  automatically after they sign up.
- **Admin (Sangeetha)** signs in on the *Admin login* tab and sees every
  enquiry in an inbox: filter by status, search, read the thread, reply,
  mark closed / reopen, delete, or reply by email / call.

Everything is stored in Supabase (Postgres + Auth). The website is still fully
static; the browser talks to Supabase with the **publishable** key in
`js/config.js`, and Row Level Security in
`supabase/migrations/20260924000000_contact_portal.sql` decides who can see or
change what (customers see only their own enquiries; only admins can read
everything; message senders are set by the database, never by the browser).

### One-time setup

1. **Apply the schema** (already done for project `dhgipmcrdpyphzrgmglu`). To
   redo it on another project:

   ```bash
   npx supabase login
   npx supabase link --project-ref YOUR_PROJECT_REF
   npx supabase db push
   ```

   (or paste the migration file into the Supabase dashboard's SQL editor.)

2. **Auth URLs** - Supabase dashboard -> Authentication -> URL Configuration:
   - Site URL: `https://srsakthi.github.io/LICWebSite/`
   - Redirect URLs: add `https://srsakthi.github.io/LICWebSite/account.html`
     (and `http://localhost:8080/account.html` for local testing).

3. **Email delivery** - Supabase's built-in mailer only sends to your own
   team members and is heavily rate-limited, so **customers will not receive
   confirmation / password-reset emails until you add a custom SMTP provider**
   (Authentication -> Emails -> SMTP Settings, e.g. Resend, Brevo or Gmail app
   password). Keep "Confirm email" turned **on**.

4. **Create Sangeetha's admin account**: open `account.html`, use
   **Create account** with `srsakthi2014@gmail.com`, confirm the email, then run
   this once in the dashboard SQL editor:

   ```sql
   insert into public.admins (user_id)
   select id from auth.users where email = 'srsakthi2014@gmail.com';
   ```

   After that, sign in on the **Admin login** tab.

### Security notes

- Only the publishable key belongs in this repo. **Never commit the database
  password, a `secret` / `service_role` key, or a `.env` file.**
- Nobody can make themselves admin from the website; the `admins` table can only
  be changed with SQL.
- Guest messages are rate-limited per email and validated in the database.

## Configuration values to update before publishing

- `js/app.js` → `SOCIAL_LINKS` — add real Facebook / X / Instagram URLs.
- `index.html` → `<link rel="canonical" ...>` and Open Graph `og:*` tags —
  update to the site's real published URL once known.
- `images/gallery.json` — replace the placeholder illustrations with real
  photos as they become available.

## Notes on the gallery images

The illustrations shipped in `images/` (`logo.svg`, `hero-illustration.svg`,
`gallery1.svg`–`gallery6.svg`) are original vector graphics created for
this project as placeholders. Replace them with real photographs at any
time by dropping new files into `images/` and updating `gallery.json` —
no other code changes are needed.
