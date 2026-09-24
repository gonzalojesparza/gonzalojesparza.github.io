(function () {
  "use strict";

  // To add a write-up: put the PDF in assets/writeups/ and add an entry here.
  // Link to it with writeup.html?doc=<key>. "kind" is the label above the title.
  var WRITEUPS = {
    "people-counter": { title: "IR Break-Beam People Counter", kind: "Final presentation", pdf: "assets/writeups/people-counter.pdf" },
    "cp-antennas": { title: "Circularly Polarized Antennas", kind: "Project write-up", pdf: "assets/writeups/cp-antennas.pdf" },
    "rtl-tft": { title: "RTL Logic with Thin-Film Transistors", kind: "Project write-up", pdf: "assets/writeups/rtl-tft.pdf" }
  };

  var key = new URLSearchParams(window.location.search).get("doc");
  var entry = Object.prototype.hasOwnProperty.call(WRITEUPS, key) ? WRITEUPS[key] : null;

  var kindEl = document.getElementById("writeup-kind");
  var titleEl = document.getElementById("writeup-title");
  var actions = document.getElementById("writeup-actions");
  var viewer = document.getElementById("writeup-viewer");
  var message = document.getElementById("writeup-message");

  function showMessage(text) {
    message.textContent = text;
    message.hidden = false;
  }

  function showPdf() {
    document.getElementById("writeup-download").href = entry.pdf;
    document.getElementById("writeup-open").href = entry.pdf;
    actions.hidden = false;

    var embed = document.createElement("object");
    embed.className = "resume-embed";
    embed.type = "application/pdf";
    embed.data = entry.pdf + "#toolbar=0&navpanes=0&view=FitH";
    embed.setAttribute("aria-label", entry.title + " (PDF)");

    var fallback = document.createElement("p");
    fallback.innerHTML = 'Your browser can\'t display the PDF here. <a href="' + entry.pdf + '">Download it instead.</a>';
    embed.appendChild(fallback);
    viewer.appendChild(embed);
  }

  if (!entry) {
    titleEl.textContent = "Write-up not found";
    showMessage("That write-up doesn't exist. Head back to the projects page to pick one.");
    return;
  }

  kindEl.textContent = entry.kind;
  titleEl.textContent = entry.title;
  document.title = entry.title + " | Gonzalo Esparza";

  // fetch() rejects on file:// pages, so only a real 404 counts as missing.
  fetch(entry.pdf, { method: "HEAD" }).then(function (response) {
    if (response.status === 404) {
      showMessage("This write-up hasn't been uploaded yet. Check back soon.");
    } else {
      showPdf();
    }
  }).catch(showPdf);
})();
