# Gonzalo Esparza: personal site

Plain HTML and CSS with no build step, hosted on GitHub Pages.

## Pages

- `index.html`: home
- `about.html`
- `projects.html`, with write-ups in `project-people-counter.html` and `project-cp-antennas.html`
- `resume.html`: embeds `assets/resume.pdf`
- `tools.html`: images-to-PDF converter (`js/img2pdf.js`). It runs entirely in the browser and uploads nothing.

## Styling

All shared styles are in `css/base.css`. Colors are CSS variables at the top of that file, with a separate set for dark mode. The purple-to-blue gradient (`--grad`) is applied to the site name, `h1` and `h2`. `css/writeup.css` styles the project write-ups, and `css/tools.css` styles the converter.

## Preview locally

```powershell
python -m http.server 8080
```

Then open http://localhost:8080.

## Publish changes

```powershell
git add -A
git commit -m "Describe the change"
git push
```

`404.html` uses root-relative paths (`/css/...`), which works for a `<username>.github.io` repo.
