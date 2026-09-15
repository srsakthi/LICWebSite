# Sangeetha — LIC & Star Health Insurance Advisor Website

A fast, mobile-responsive static website for Sangeetha, a LIC and Star Health
Insurance advisor based in Coimbatore. Built with plain HTML5, CSS3 and
vanilla JavaScript — no build step, no backend, no database. Ready to deploy
on GitHub Pages or any static host.

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
