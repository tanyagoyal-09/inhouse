const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/* ============================================================
   SAFE HTML HELPERS
============================================================ */

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function text(value, fallback = "Not provided.") {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return `<p class="muted">${esc(fallback)}</p>`;
  }

  return raw
    .split(/\n+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => `<p>${esc(part)}</p>`)
    .join("");
}

function listText(value) {
  const raw = String(value ?? "").trim();

  if (!raw) {
    return `<p class="muted">Not provided.</p>`;
  }

  const items = raw
    .split(/\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

  return `<ul>${items
    .map((item) => `<li>${esc(item)}</li>`)
    .join("")}</ul>`;
}

function valueOr(value, fallback = "Not provided") {
  const raw = String(value ?? "").trim();
  return raw ? esc(raw) : esc(fallback);
}

/* ============================================================
   DRAWING HELPERS
============================================================ */

function getDrawingPath(drawing) {
  if (!drawing) return null;

  const candidates = [];

  if (drawing.filePath) {
    candidates.push(drawing.filePath);
  }

  if (drawing.fileName) {
    candidates.push(
      path.join(process.cwd(), "uploads", drawing.fileName)
    );
  }

  for (const candidate of candidates) {
    if (candidate && fs.existsSync(candidate)) {
      return candidate;
    }
  }

  return null;
}

function imageToDataUri(filePath) {
  try {
    const extension = path.extname(filePath).toLowerCase();
    const mimeTypes = {
      ".png": "image/png",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".webp": "image/webp",
    };

    const mime = mimeTypes[extension];
    if (!mime) return null;

    const buffer = fs.readFileSync(filePath);
    return `data:${mime};base64,${buffer.toString("base64")}`;
  } catch (error) {
    console.error("Unable to embed drawing image:", error.message);
    return null;
  }
}

function drawingsHTML(drawings = []) {
  if (!Array.isArray(drawings) || drawings.length === 0) {
    return `<p class="muted">No drawings have been uploaded for this application.</p>`;
  }

  return drawings
    .map((drawing, index) => {
      const number = drawing.figureNumber || index + 1;
      const filePath = getDrawingPath(drawing);
      const image = filePath ? imageToDataUri(filePath) : null;

      return `
        <div class="drawing">
          <div class="figure-label">FIGURE ${esc(number)}</div>

          ${
            image
              ? `<img class="drawing-image" src="${image}" alt="Figure ${esc(number)}" />`
              : `<div class="drawing-missing">Drawing image unavailable.</div>`
          }

          ${
            drawing.description
              ? `<p><strong>Description:</strong> ${esc(drawing.description)}</p>`
              : ""
          }

          ${
            drawing.referenceNumbers
              ? `<p><strong>Reference Numbers:</strong> ${esc(drawing.referenceNumbers)}</p>`
              : ""
          }
        </div>
      `;
    })
    .join("");
}

/* ============================================================
   INSTITUTIONAL APPLICATION PAGE
   Based on the supplied institutional patent application format.
============================================================ */

function applicationPage(p) {
  const novelty =
    p.novelty ||
    p.summarySolution ||
    p.summaryAdvantages ||
    p.summaryProblem;

  return `
    <section class="institution-page">
      <div class="institution-header">
        <div class="institution-title">INHOUSE PATENT FILING PLATFORM</div>
        <div class="institution-subtitle">PATENT APPLICATION</div>
      </div>

      <div class="form-row">
        <div class="form-number">1.</div>
        <div class="form-label">Title of Invention</div>
        <div class="form-value">${valueOr(p.title)}</div>
      </div>

      <div class="form-row form-row-tall">
        <div class="form-number">2.</div>
        <div class="form-label">Name and address of applicant</div>
        <div class="form-value">
          <p><strong>${valueOr(p.applicantName)}</strong></p>
          <p>${valueOr(p.applicantDepartment)}</p>
          <p>${valueOr(p.applicantEmail)}</p>
        </div>
      </div>

      <div class="form-row form-row-tall">
        <div class="form-number">3.</div>
        <div class="form-label">Name and address of Inventor</div>
        <div class="form-value">
          ${text(p.inventors)}
          ${p.guideName ? `<p><strong>Guide:</strong> ${esc(p.guideName)}</p>` : ""}
          ${p.guideEmail ? `<p>${esc(p.guideEmail)}</p>` : ""}
        </div>
      </div>

      <div class="form-row form-row-tall">
        <div class="form-number">4.</div>
        <div class="form-label">Brief summary of invention (highlight the novelty)</div>
        <div class="form-value">
          ${text(novelty)}
        </div>
      </div>

      <div class="form-row">
        <div class="form-number">5.</div>
        <div class="form-label">Type of intellectual property</div>
        <div class="form-value ip-type">
          <span>Patent (✓)</span>
          <span>Design ( )</span>
          <span>Others ( )</span>
        </div>
      </div>

      <div class="disclaimer">
        <strong>Disclaimer:</strong>
        The information provided by me in the application is true and novel. I have read institutional research promotion scheme and agreed with the mentioned term and condition.
      </div>

      <div class="signature-block">
        <div>Signature of applicants: ______________________________</div>
      </div>

      <div class="committee-box">
        <div class="committee-title">Comments of Institutional R&amp;D Committee</div>
        <div class="committee-lines"></div>
        <div class="committee-lines"></div>
        <div class="committee-signature">Signature of Institution R&amp;D Committee: ______________________________</div>
      </div>

      <div class="committee-box chairman-box">
        <div class="committee-title">Comments of Honorable Sir</div>
        <div class="recommendation">Recommended / Not Recommended</div>
        <div class="committee-signature">Signature Honorable Chairman: ______________________________</div>
      </div>
    </section>
  `;
}

/* ============================================================
   DESCRIPTION SECTIONS
============================================================ */

function descriptionSection(title, content, number) {
  return `
    <section class="content-section">
      <h2><span>${esc(number)}</span> ${esc(title)}</h2>
      <div class="content">${text(content)}</div>
    </section>
  `;
}

function summarySection(p) {
  return `
    <section class="content-section">
      <h2><span>4.</span> Summary of the Invention</h2>
      ${descriptionSection("Problem Addressed", p.summaryProblem, "4.1")}
      ${descriptionSection("Proposed Solution", p.summarySolution, "4.2")}
      ${descriptionSection("Main Components", p.summaryComponents, "4.3")}
      ${descriptionSection("Operation", p.summaryOperation, "4.4")}
      ${descriptionSection("Advantages", p.summaryAdvantages, "4.5")}
    </section>
  `;
}

function detailedDescription(p) {
  return `
    <section class="content-section">
      <h2><span>6.</span> Detailed Description of the Invention</h2>
      ${descriptionSection("Detailed Overview", p.detailedOverview, "6.1")}
      ${descriptionSection("Detailed Architecture", p.detailedArchitecture, "6.2")}
      ${descriptionSection("Detailed Operation", p.detailedOperation, "6.3")}
      ${descriptionSection("Detailed Implementation", p.detailedImplementation, "6.4")}
      ${descriptionSection("Detailed Embodiments", p.detailedEmbodiments, "6.5")}
    </section>
  `;
}

function claimsSection(claims = []) {
  if (!Array.isArray(claims) || claims.length === 0) {
    return `
      <section class="content-section">
        <h2><span>7.</span> Claims</h2>
        <p class="muted">No claims have been added to this application.</p>
      </section>
    `;
  }

  return `
    <section class="content-section">
      <h2><span>7.</span> Claims</h2>
      ${claims
        .map((claim, index) => {
          const number = claim.number || index + 1;
          const meta = [
            claim.type,
            claim.dependsOn ? `Depends on Claim ${claim.dependsOn}` : "",
          ]
            .filter(Boolean)
            .join(" · ");

          return `
            <div class="claim">
              <div class="claim-title">Claim ${esc(number)}</div>
              ${meta ? `<div class="claim-meta">${esc(meta)}</div>` : ""}
              <div>${text(claim.text, "No claim text provided.")}</div>
            </div>
          `;
        })
        .join("")}
    </section>
  `;
}

function componentsSection(components = []) {
  if (!Array.isArray(components) || components.length === 0) return "";

  return `
    <section class="content-section">
      <h2><span>6A.</span> Main Components</h2>
      <table class="components-table">
        <thead>
          <tr>
            <th>Reference No.</th>
            <th>Component</th>
            <th>Description</th>
          </tr>
        </thead>
        <tbody>
          ${components
            .map(
              (component, index) => `
                <tr>
                  <td>${valueOr(component.referenceNumber, index + 1)}</td>
                  <td>${valueOr(component.name)}</td>
                  <td>${valueOr(component.description)}</td>
                </tr>
              `
            )
            .join("")}
        </tbody>
      </table>
    </section>
  `;
}

/* ============================================================
   COMPLETE HTML DOCUMENT
============================================================ */

function buildHTML(p) {
  const patent = p || {};

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${valueOr(patent.title, "Patent Application")}</title>
<style>
  @page { size: A4; margin: 18mm 17mm 20mm 17mm; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; }
  body {
    color: #111827;
    background: #fff;
    font-family: "Times New Roman", Times, serif;
    font-size: 11pt;
    line-height: 1.45;
  }
  p { margin: 0 0 7px; text-align: justify; }
  .muted { color: #6b7280; font-style: italic; }

  .institution-page { page-break-after: always; }
  .institution-header { text-align: center; margin-bottom: 14px; }
  .institution-title { font-size: 15pt; font-weight: 700; text-transform: uppercase; }
  .institution-subtitle { margin-top: 4px; font-size: 12pt; font-weight: 700; }

  .form-row {
    display: grid;
    grid-template-columns: 10mm 58mm 1fr;
    border: 1px solid #222;
    border-bottom: 0;
    page-break-inside: avoid;
  }
  .form-row:last-of-type { border-bottom: 1px solid #222; }
  .form-row-tall { min-height: 30mm; }
  .form-number, .form-label, .form-value { padding: 7px 8px; }
  .form-number { border-right: 1px solid #222; font-weight: 700; }
  .form-label { border-right: 1px solid #222; font-weight: 700; }
  .form-value p { margin-bottom: 4px; }
  .ip-type { display: flex; gap: 24px; flex-wrap: wrap; }

  .disclaimer { border: 1px solid #222; border-top: 0; padding: 10px; text-align: justify; }
  .signature-block { padding: 22px 4px 18px; }
  .committee-box { border: 1px solid #222; padding: 9px; margin-top: 10px; page-break-inside: avoid; }
  .committee-title { font-weight: 700; }
  .committee-lines { height: 18px; border-bottom: 1px solid #999; margin-top: 8px; }
  .committee-signature { margin-top: 18px; }
  .recommendation { margin-top: 16px; }

  .description-title {
    text-align: center;
    font-size: 16pt;
    font-weight: 700;
    margin: 0 0 14px;
  }
  .content-section { margin-bottom: 12px; }
  .content-section h2 {
    font-size: 13pt;
    margin: 13px 0 7px;
    padding-bottom: 3px;
    border-bottom: 1px solid #555;
    page-break-after: avoid;
  }
  .content-section h2 span { margin-right: 5px; }
  .content-section .content { margin-top: 3px; }
  .content-section .content-section { margin: 5px 0 0 0; }
  .content-section .content-section h2 {
    font-size: 11.5pt;
    border-bottom: 0;
    margin: 7px 0 4px;
  }

  .drawing { margin: 12px 0 18px; page-break-inside: avoid; }
  .figure-label { text-align: center; font-weight: 700; margin-bottom: 7px; }
  .drawing-image {
    display: block;
    max-width: 155mm;
    max-height: 105mm;
    width: auto;
    height: auto;
    margin: 0 auto 8px;
    object-fit: contain;
  }
  .drawing-missing { border: 1px solid #999; padding: 24px; text-align: center; color: #666; }

  .components-table { width: 100%; border-collapse: collapse; font-size: 10pt; }
  .components-table th, .components-table td { border: 1px solid #333; padding: 6px; vertical-align: top; }
  .components-table th { text-align: left; }

  .claim { margin: 0 0 13px; page-break-inside: avoid; }
  .claim-title { font-weight: 700; }
  .claim-meta { font-size: 9.5pt; color: #666; font-style: italic; margin: 2px 0 4px; }

  .abstract-box { border: 1px solid #444; padding: 10px; }
  .admin-note { margin-top: 15px; border: 1px solid #777; padding: 9px; }

  ul { margin: 4px 0 8px 20px; padding: 0; }
  li { margin-bottom: 3px; }
  strong { font-weight: 700; }

  h1, h2, h3, table, figure, img { page-break-inside: avoid; }
</style>
</head>
<body>

${applicationPage(patent)}

<main>
  <div class="description-title">Description</div>

  <section class="content-section">
    <h2><span>Abstract</span></h2>
    <div class="abstract-box">${text(patent.abstract)}</div>
  </section>

  ${descriptionSection("Field of Invention", patent.field, "1.")}

  <section class="content-section">
    <h2><span>2.</span> Background of the Invention</h2>
    ${descriptionSection("Prior Art / Existing Technology", patent.backgroundPriorArt, "2.1")}
    ${descriptionSection("Problems with Existing Solutions", patent.backgroundProblems, "2.2")}
    ${descriptionSection("Need for the Invention", patent.backgroundNeed, "2.3")}
  </section>

  ${summarySection(patent)}

  <section class="content-section">
    <h2><span>5.</span> Brief Description of the Drawings</h2>
    ${drawingsHTML(patent.drawings)}
  </section>

  ${detailedDescription(patent)}
  ${componentsSection(patent.components)}
  ${claimsSection(patent.claims)}

  <section class="content-section">
    <h2><span>8.</span> Features and Advantages</h2>
    ${text(patent.summaryAdvantages)}
  </section>

  <section class="content-section">
    <h2><span>9.</span> Keywords and Classification</h2>
    <p><strong>Classification:</strong> ${valueOr(patent.classification)}</p>
    <p><strong>Keywords:</strong> ${valueOr(patent.keywords)}</p>
  </section>

  <section class="content-section">
    <h2><span>10.</span> Potential Use / Application</h2>
    ${text(patent.potentialUseCases || patent.detailedEmbodiments)}
  </section>

  <section class="content-section">
    <h2><span>11.</span> Conclusion</h2>
    ${text(patent.conclusion || patent.summaryAdvantages || patent.detailedOverview)}
  </section>

  ${
    patent.reviewComment
      ? `
        <section class="admin-note">
          <strong>Administrative Review Comment:</strong>
          ${text(patent.reviewComment)}
          ${
            patent.reviewedAt
              ? `<p><strong>Reviewed:</strong> ${esc(new Date(patent.reviewedAt).toLocaleString())}</p>`
              : ""
          }
        </section>
      `
      : ""
  }
</main>

</body>
</html>`;
}

/* ============================================================
   PUPPETEER PDF GENERATION
============================================================ */

async function generate(patent) {
  const browser = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
    ],
  });

  try {
    const page = await browser.newPage();

    await page.setViewport({
      width: 1240,
      height: 1754,
      deviceScaleFactor: 1,
    });

    await page.setContent(buildHTML(patent), {
      waitUntil: "load",
    });

    await page.evaluate(async () => {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }
    });

    return await page.pdf({
      format: "A4",
      printBackground: true,
      preferCSSPageSize: true,
      displayHeaderFooter: true,
      headerTemplate: `<div style="width:100%;font-family:Arial,sans-serif;font-size:7px;color:#777;text-align:right;padding-right:15mm;"></div>`,
      footerTemplate: `
        <div style="width:100%;font-family:Arial,sans-serif;font-size:7px;color:#777;text-align:center;">
          PatentFlow &nbsp;|&nbsp; Page <span class="pageNumber"></span> of <span class="totalPages"></span>
        </div>
      `,
      margin: {
        top: "15mm",
        right: "17mm",
        bottom: "17mm",
        left: "17mm",
      },
    });
  } finally {
    await browser.close();
  }
}

module.exports = {
  generate,
  buildHTML,
};
