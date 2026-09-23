# Wild Wire Substation

A personal website with a line-cook theme. Visitors pick food off a griddle to reach each page, or switch to a restaurant-menu view. Built with plain HTML, CSS and JavaScript, with no build step, and hosted on GitHub Pages.

| Dish on the griddle | Page |
| --- | --- |
| Philly cheesesteak | `projects.html` |
| Wings | `about.html` |
| Beef fried rice | `resume.html` |
| Gyro | LinkedIn (external) |

`tools.html` hosts an images-to-PDF converter (`js/img2pdf.js`). It runs entirely in the browser and uploads nothing: images are re-encoded as JPEG on a canvas and written into a PDF by a small built-in writer, so there are no dependencies.

Background music (`assets/music/brasilian-skies.mp3`) is off by default and toggled with the Music button. The sizzle on hover is synthesized in `js/audio.js`, so it needs no audio file. Browsers only allow sound after the visitor's first click or key press on the page.

## Preview locally

```powershell
python -m http.server 8080
```

Then open http://localhost:8080.

## Make it yours

1. **Your info:** search the project for `you@example.com` and `your-username`, and replace them.
2. **Griddle and food art:** the griddle is `assets/img/griddle.svg`. If you replace it with an image that isn't 16:9, change `aspect-ratio` on `.griddle` in `css/griddle.css`.
   - Food photos are 800x800 square WebP crops in `assets/img/food/`. The site masks them into circles inside a cast-iron pan, so keep the food centered. The uncropped originals are in `assets/img/food/originals/` and aren't used by the site.
3. **Positions:** move items by editing the `left`, `top` and `width` percentages for each `.food--*` class near the top of `css/griddle.css`.
4. **Photos:** replace `assets/img/headshot-placeholder.svg` and `assets/img/projects/placeholder.svg`, and update the `src` paths in `about.html` and `projects.html`.
5. **Resume:** overwrite `assets/resume.pdf`, and keep the text version in `resume.html` in sync.
6. **Social preview:** add a 1200x630 `assets/img/og-image.png`.

## Deploy to GitHub Pages

1. Create a public repo named `<your-username>.github.io`.
2. Push this folder to it:

   ```powershell
   git add .
   git commit -m "Initial site"
   git branch -M main
   git remote add origin https://github.com/<your-username>/<your-username>.github.io.git
   git push -u origin main
   ```

3. In the repo, go to **Settings > Pages** and set **Source** to "Deploy from a branch", with branch `main` and folder `/ (root)`.
4. The site goes live at `https://<your-username>.github.io` within a minute or two.

`404.html` uses root-relative paths (`/css/...`). This works for a `<username>.github.io` repo. If you deploy from a project repo instead (`<username>.github.io/<repo>`), change those paths to include the repo name.
