const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

/*
 * ============================================================
 * PatentFlow - SRMS Patent PDF Generator
 * ============================================================
 *
 * PDF engine:
 *   Puppeteer + Chrome
 *
 * Logo:
 *   backend/assets/srms-logo.png
 *
 * Dynamic content:
 *   Patent data received from patents.js
 *
 * IMPORTANT:
 *   This file only controls PDF generation and formatting.
 *   It does NOT change the patent data stored in MongoDB.
 * ============================================================
 */


/* ============================================================
   HTML ESCAPING
   ============================================================ */

function escapeHtml(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}


/* ============================================================
   BASIC TEXT HELPERS
   ============================================================ */

function clean(value) {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}


function text(value, fallback = "Not provided.") {
  const valueClean = clean(value);

  return escapeHtml(
    valueClean || fallback
  );
}


/* ============================================================
   ARRAY TO TEXT
   ============================================================ */

function arrayText(
  value,
  fallback = "Not provided."
) {
  if (Array.isArray(value)) {
    const parts = value
      .map((item) => {
        if (
          item === null ||
          item === undefined
        ) {
          return "";
        }

        if (
          typeof item === "object"
        ) {
          return clean(
            item.name ||
            item.text ||
            item.email ||
            JSON.stringify(item)
          );
        }

        return clean(item);
      })
      .filter(Boolean);

    return escapeHtml(
      parts.length
        ? parts.join(", ")
        : fallback
    );
  }

  return text(
    value,
    fallback
  );
}


/* ============================================================
   MIME TYPE
   ============================================================ */

function mimeFromExtension(filePath) {
  const extension =
    path
      .extname(filePath || "")
      .toLowerCase();

  const mimeTypes = {
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".webp": "image/webp",
    ".gif": "image/gif",
    ".svg": "image/svg+xml"
  };

  return (
    mimeTypes[extension] ||
    "application/octet-stream"
  );
}


/* ============================================================
   FILE -> DATA URL
   ============================================================ */

function fileToDataUrl(filePath) {
  try {
    if (!filePath) {
      return null;
    }

    const absolutePath =
      path.isAbsolute(filePath)
        ? filePath
        : path.resolve(filePath);

    if (!fs.existsSync(absolutePath)) {
      console.warn(
        "PDF file not found:",
        absolutePath
      );

      return null;
    }

    const buffer =
      fs.readFileSync(
        absolutePath
      );

    if (!buffer.length) {
      console.warn(
        "PDF file is empty:",
        absolutePath
      );

      return null;
    }

    const mime =
      mimeFromExtension(
        absolutePath
      );

    /*
     * IMPORTANT:
     * Use normal string concatenation here.
     *
     * This avoids the template-string syntax error
     * that occurred previously around:
     *
     * data:${mime};base64,...
     */

    return (
      "data:" +
      mime +
      ";base64," +
      buffer.toString("base64")
    );

  } catch (error) {

    console.error(
      "Unable to convert file to data URL:",
      error.message
    );

    return null;
  }
}


/* ============================================================
   SECTION
   ============================================================ */

function section(
  title,
  body,
  options = {}
) {
  const pageBreak =
    options.pageBreak
      ? "page-break-before"
      : "";

  return `
    <section
      class="section ${pageBreak}"
    >

      <h2>
        ${escapeHtml(title)}
      </h2>

      <div class="section-body">
        ${body}
      </div>

    </section>
  `;
}


/* ============================================================
   PARAGRAPH FIELD
   ============================================================ */

function paragraph(
  label,
  value
) {
  return `
    <div class="field">

      <div class="field-label">
        ${escapeHtml(label)}
      </div>

      <div class="field-value">
        ${text(value)}
      </div>

    </div>
  `;
}


/* ============================================================
   CLAIMS
   ============================================================ */

function buildClaims(claims) {

  if (
    !Array.isArray(claims) ||
    claims.length === 0
  ) {
    return `
      <p class="muted">
        No claims have been provided.
      </p>
    `;
  }


  return claims
    .map(
      (claim, index) => {

        const number =
          claim?.number ??
          index + 1;

        const type =
          clean(
            claim?.type
          );

        const dependsOn =
          clean(
            claim?.dependsOn
          );


        return `
          <div class="claim">

            <div class="claim-heading">

              <span class="claim-number">
                ${escapeHtml(number)}.
              </span>

              ${
                type
                  ? `
                    <span class="claim-type">
                      [${escapeHtml(type)}]
                    </span>
                  `
                  : ""
              }

              ${
                dependsOn
                  ? `
                    <span class="depends">
                      Depends on Claim
                      ${escapeHtml(dependsOn)}
                    </span>
                  `
                  : ""
              }

            </div>


            <div class="claim-text">
              ${text(claim?.text)}
            </div>

          </div>
        `;
      }
    )
    .join("");
}


/* ============================================================
   DRAWING PATH
   ============================================================ */

function resolveDrawingPath(
  drawing
) {

  if (
    !drawing ||
    typeof drawing !== "object"
  ) {
    return "";
  }


  if (drawing.filePath) {

    return path.isAbsolute(
      drawing.filePath
    )
      ? drawing.filePath
      : path.resolve(
          process.cwd(),
          drawing.filePath
        );
  }


  if (drawing.fileName) {

    return path.resolve(
      process.cwd(),
      "uploads",
      drawing.fileName
    );
  }


  return "";
}


/* ============================================================
   DRAWINGS
   ============================================================ */

function buildDrawings(
  drawings
) {

  if (
    !Array.isArray(drawings) ||
    drawings.length === 0
  ) {
    return `
      <p class="muted">
        No technical drawings have been provided.
      </p>
    `;
  }


  return drawings
    .map(
      (drawing, index) => {

        const figureNumber =
          drawing?.figureNumber ??
          index + 1;


        const drawingPath =
          resolveDrawingPath(
            drawing
          );


        const imageData =
          fileToDataUrl(
            drawingPath
          );


        return `
          <div class="drawing">

            ${
              imageData
                ? `
                  <img
                    class="drawing-image"
                    src="${imageData}"
                    alt="Figure ${escapeHtml(
                      figureNumber
                    )}"
                  />
                `
                : `
                  <div class="image-missing">
                    Drawing image unavailable
                  </div>
                `
            }


            <div class="figure-caption">

              <strong>
                FIG. ${escapeHtml(
                  figureNumber
                )}
              </strong>


              ${
                clean(
                  drawing?.description
                )
                  ? `
                    <div>
                      ${escapeHtml(
                        drawing.description
                      )}
                    </div>
                  `
                  : ""
              }


              ${
                clean(
                  drawing?.referenceNumbers
                )
                  ? `
                    <div class="reference">
                      Reference numbers:
                      ${escapeHtml(
                        drawing.referenceNumbers
                      )}
                    </div>
                  `
                  : ""
              }

            </div>

          </div>
        `;
      }
    )
    .join("");
}


/* ============================================================
   BUILD COMPLETE HTML
   ============================================================ */

function buildHtml(
  patent,
  logoData
) {

  /*
   * Applicant
   */

  const applicantName =
    clean(
      patent?.applicantName
    ) ||
    (
      patent?.applicantId &&
      typeof patent.applicantId ===
        "object"
        ? clean(
            patent.applicantId.name
          )
        : ""
    ) ||
    "Not provided.";


  /*
   * Applicant email
   */

  const applicantEmail =
    clean(
      patent?.applicantEmail
    ) ||
    (
      patent?.applicantId &&
      typeof patent.applicantId ===
        "object"
        ? clean(
            patent.applicantId.email
          )
        : ""
    ) ||
    "Not provided.";


  /*
   * Patent title
   */

  const title =
    clean(
      patent?.title
    ) ||
    "Untitled Patent Application";


  /*
   * Logo
   */

  const logoMarkup =
    logoData
      ? `
        <img
          class="srms-logo"
          src="${logoData}"
          alt="SRMS"
        />
      `
      : `
        <div class="logo-placeholder">
          SRMS
        </div>
      `;


  /*
   * HTML
   */

  return `
<!DOCTYPE html>

<html>

<head>

<meta charset="UTF-8">

<title>
  ${escapeHtml(title)}
</title>


<style>

/* ============================================================
   PAGE
   ============================================================ */

@page {

  size: A4;

  margin:
    25mm
    18mm
    22mm
    18mm;

}


/* ============================================================
   GLOBAL
   ============================================================ */

* {
  box-sizing: border-box;
}


html,
body {

  margin: 0;

  padding: 0;

  background: #ffffff;

}


body {

  color: #111111;

  font-family:
    "Times New Roman",
    Times,
    serif;

  font-size: 11pt;

  line-height: 1.55;

}


/* ============================================================
   DOCUMENT
   ============================================================ */

.document {

  width: 100%;

}


/* ============================================================
   SRMS HEADER
   ============================================================ */

.institution-header {

  width: 100%;

  border-bottom:
    1.5px solid
    #333333;

  padding-bottom: 6px;

  margin-bottom: 15px;

}


.srms-logo {

  display: block;

  width: 100%;

  max-width: 174mm;

  height: auto;

  max-height: 25mm;

  object-fit: contain;

  object-position:
    left
    center;

}


.logo-placeholder {

  height: 20mm;

  display: flex;

  align-items: center;

  justify-content: center;

  border:
    1px solid
    #777777;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 20pt;

  font-weight: bold;

}


.institution-subtitle {

  text-align: center;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 8.5pt;

  font-weight: bold;

  letter-spacing: .4px;

  margin-top: 3px;

}


/* ============================================================
   COVER PAGE
   ============================================================ */

.cover {

  min-height: 245mm;

  page-break-after: always;

}


.title-block {

  text-align: center;

  margin:
    18mm
    0
    12mm
    0;

}


.document-heading {

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 13pt;

  font-weight: bold;

  letter-spacing: .5px;

  text-transform: uppercase;

  margin-bottom: 12px;

}


.patent-title {

  font-family:
    "Times New Roman",
    Times,
    serif;

  font-size: 17pt;

  line-height: 1.35;

  font-weight: bold;

  text-transform: uppercase;

  max-width: 160mm;

  margin:
    0
    auto;

}


.title-rule {

  width: 70mm;

  margin:
    9mm
    auto;

  border-top:
    1px solid
    #333333;

}


.cover-details {

  width: 135mm;

  margin:
    0
    auto;

  border-collapse:
    collapse;

  font-size: 10.5pt;

}


.cover-details td {

  padding:
    4px
    6px;

  vertical-align: top;

}


.cover-details td:first-child {

  width: 38%;

  font-weight: bold;

}


.cover-note {

  margin-top: 20mm;

  text-align: center;

  font-size: 9pt;

}


/* ============================================================
   SECTIONS
   ============================================================ */

.section {

  margin:
    0
    0
    13px
    0;

}


.section.page-break-before {

  page-break-before: always;

}


.section h2 {

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 12.5pt;

  line-height: 1.3;

  font-weight: bold;

  margin:
    0
    0
    8px
    0;

  padding-bottom: 4px;

  border-bottom:
    1px solid
    #222222;

  page-break-after: avoid;

}


.section-body {

  text-align: justify;

}


/* ============================================================
   FIELD
   ============================================================ */

.field {

  margin:
    0
    0
    10px
    0;

  page-break-inside: avoid;

}


.field-label {

  font-weight: bold;

  margin-bottom: 3px;

}


.field-value {

  white-space: pre-wrap;

  overflow-wrap: anywhere;

  text-align: justify;

}


/* ============================================================
   METADATA TABLE
   ============================================================ */

.metadata {

  width: 100%;

  border-collapse:
    collapse;

  margin:
    2px
    0
    12px
    0;

  font-size: 10.5pt;

}


.metadata tr {

  page-break-inside: avoid;

}


.metadata td {

  border:
    1px solid
    #555555;

  padding:
    6px
    7px;

  vertical-align: top;

}


.metadata td:first-child {

  width: 30%;

  font-weight: bold;

}


/* ============================================================
   CLAIMS
   ============================================================ */

.claims-intro {

  margin-bottom: 10px;

}


.claim {

  margin:
    0
    0
    13px
    0;

  page-break-inside: avoid;

  text-align: justify;

}


.claim-heading {

  font-weight: bold;

  margin-bottom: 4px;

}


.claim-number {

  margin-right: 4px;

}


.claim-type {

  font-weight: normal;

  margin-right: 7px;

}


.depends {

  font-weight: normal;

  font-size: 9pt;

  margin-left: 6px;

}


.claim-text {

  white-space: pre-wrap;

  overflow-wrap: anywhere;

}


/* ============================================================
   DRAWINGS
   ============================================================ */

.drawing {

  text-align: center;

  margin:
    0
    0
    18px
    0;

  page-break-inside: avoid;

}


.drawing-image {

  display: block;

  width: auto;

  height: auto;

  max-width: 155mm;

  max-height: 185mm;

  margin:
    0
    auto
    6px
    auto;

  object-fit: contain;

}


.image-missing {

  width: 150mm;

  height: 70mm;

  margin:
    0
    auto
    8px
    auto;

  border:
    1px dashed
    #777777;

  display: flex;

  align-items: center;

  justify-content: center;

  color: #666666;

  font-family:
    Arial,
    Helvetica,
    sans-serif;

  font-size: 9pt;

}


.figure-caption {

  font-size: 9.5pt;

  line-height: 1.4;

}


.reference {

  font-size: 8.5pt;

  color: #444444;

  margin-top: 2px;

}


/* ============================================================
   MISC
   ============================================================ */

.muted {

  color: #555555;

}


.small {

  font-size: 9pt;

}


/* ============================================================
   SIGNATURE
   ============================================================ */

.signature-table {

  width: 100%;

  border-collapse:
    collapse;

  margin-top: 22mm;

}


.signature-table td {

  width: 50%;

  padding:
    4px
    15px;

  vertical-align: top;

  text-align: center;

}


.signature-line {

  border-top:
    1px solid
    #222222;

  margin:
    16mm
    auto
    4px
    auto;

  width: 55mm;

}


/* ============================================================
   PAGE BREAKS
   ============================================================ */

h2,
.field-label,
.claim-heading,
.figure-caption {

  page-break-after: avoid;

}

</style>

</head>


<body>


<div class="document">


<!-- =========================================================
     COVER PAGE
     ========================================================= -->

<div class="cover">


  <div class="institution-header">

    ${logoMarkup}

    <div class="institution-subtitle">
      PATENT APPLICATION DOCUMENT
    </div>

  </div>


  <div class="title-block">


    <div class="document-heading">
      Patent Application Specification
    </div>


    <div class="patent-title">
      ${escapeHtml(title)}
    </div>


    <div class="title-rule"></div>


    <table class="cover-details">


      <tr>

        <td>
          Applicant
        </td>

        <td>
          ${escapeHtml(applicantName)}
        </td>

      </tr>


      <tr>

        <td>
          Applicant Email
        </td>

        <td>
          ${escapeHtml(applicantEmail)}
        </td>

      </tr>


      <tr>

        <td>
          Patent Type
        </td>

        <td>
          ${text(patent?.patentType)}
        </td>

      </tr>


      <tr>

        <td>
          Classification
        </td>

        <td>
          ${text(patent?.classification)}
        </td>

      </tr>


      <tr>

        <td>
          Status
        </td>

        <td>
          ${text(
            patent?.status,
            "Draft"
          )}
        </td>

      </tr>


    </table>


  </div>


  <div class="cover-note">

    Prepared through the
    Inhouse Patent Filing System

  </div>


</div>


<!-- =========================================================
     MAIN DOCUMENT HEADER
     ========================================================= -->

<div class="institution-header">

  ${logoMarkup}

  <div class="institution-subtitle">
    PATENT APPLICATION SPECIFICATION
  </div>

</div>


<!-- =========================================================
     1. PATENT INFORMATION
     ========================================================= -->

${section(
  "1. Patent Information",
  `

    <table class="metadata">


      <tr>

        <td>
          Title of the Invention
        </td>

        <td>
          ${text(
            title,
            "Untitled Patent Application"
          )}
        </td>

      </tr>


      <tr>

        <td>
          Patent Classification
        </td>

        <td>
          ${text(
            patent?.classification
          )}
        </td>

      </tr>


      <tr>

        <td>
          Patent Type
        </td>

        <td>
          ${text(
            patent?.patentType
          )}
        </td>

      </tr>


      <tr>

        <td>
          Status
        </td>

        <td>
          ${text(
            patent?.status,
            "Draft"
          )}
        </td>

      </tr>


      <tr>

        <td>
          Applicant
        </td>

        <td>
          ${escapeHtml(
            applicantName
          )}
        </td>

      </tr>


      <tr>

        <td>
          Applicant Email
        </td>

        <td>
          ${escapeHtml(
            applicantEmail
          )}
        </td>

      </tr>


      <tr>

        <td>
          Inventors
        </td>

        <td>
          ${arrayText(
            patent?.inventors
          )}
        </td>

      </tr>


      <tr>

        <td>
          Guide
        </td>

        <td>
          ${text(
            patent?.guideName
          )}
        </td>

      </tr>


      <tr>

        <td>
          Guide Email
        </td>

        <td>
          ${text(
            patent?.guideEmail
          )}
        </td>

      </tr>


      <tr>

        <td>
          Keywords
        </td>

        <td>
          ${arrayText(
            patent?.keywords
          )}
        </td>

      </tr>


    </table>

  `
)}


<!-- =========================================================
     2. ABSTRACT
     ========================================================= -->

${section(
  "2. Abstract",
  `
    <div class="field-value">
      ${text(
        patent?.abstract
      )}
    </div>
  `
)}


<!-- =========================================================
     3. FIELD OF INVENTION
     ========================================================= -->

${section(
  "3. Field of Invention",
  `
    <div class="field-value">
      ${text(
        patent?.field
      )}
    </div>
  `
)}


<!-- =========================================================
     4. BACKGROUND
     ========================================================= -->

${section(
  "4. Background of the Invention",
  `

    ${paragraph(
      "4.1 Prior Art",
      patent?.backgroundPriorArt
    )}


    ${paragraph(
      "4.2 Problems in Existing Systems",
      patent?.backgroundProblems
    )}


    ${paragraph(
      "4.3 Need for the Invention",
      patent?.backgroundNeed
    )}

  `
)}


<!-- =========================================================
     5. SUMMARY
     ========================================================= -->

${section(
  "5. Summary of the Invention",
  `

    ${paragraph(
      "5.1 Problem Addressed",
      patent?.summaryProblem
    )}


    ${paragraph(
      "5.2 Proposed Solution",
      patent?.summarySolution
    )}


    ${paragraph(
      "5.3 Components",
      patent?.summaryComponents
    )}


    ${paragraph(
      "5.4 Operation",
      patent?.summaryOperation
    )}


    ${paragraph(
      "5.5 Advantages",
      patent?.summaryAdvantages
    )}

  `
)}


<!-- =========================================================
     6. DETAILED DESCRIPTION
     ========================================================= -->

${section(
  "6. Detailed Description",
  `

    ${paragraph(
      "6.1 Detailed Overview",
      patent?.detailedOverview
    )}


    ${paragraph(
      "6.2 Detailed Architecture",
      patent?.detailedArchitecture
    )}


    ${paragraph(
      "6.3 Detailed Operation",
      patent?.detailedOperation
    )}


    ${paragraph(
      "6.4 Detailed Implementation",
      patent?.detailedImplementation
    )}


    ${paragraph(
      "6.5 Embodiments",
      patent?.detailedEmbodiments
    )}

  `,
  {
    pageBreak: true
  }
)}


<!-- =========================================================
     7. CLAIMS
     ========================================================= -->

${section(
  "7. Claims",
  `

    <div class="claims-intro">
      The invention is claimed as follows:
    </div>


    ${buildClaims(
      patent?.claims
    )}

  `
)}


<!-- =========================================================
     8. DRAWINGS
     ========================================================= -->

${section(
  "8. Technical Drawings",
  buildDrawings(
    patent?.drawings
  ),
  {
    pageBreak: true
  }
)}


<!-- =========================================================
     9. ADDITIONAL INFORMATION
     ========================================================= -->

${section(
  "9. Additional Information",
  `

    ${paragraph(
      "Review Comment",
      patent?.reviewComment
    )}


    ${paragraph(
      "Created",
      patent?.createdAt
    )}


    ${paragraph(
      "Submitted",
      patent?.submittedAt
    )}


    ${paragraph(
      "Last Updated",
      patent?.updatedAt
    )}

  `
)}


<!-- =========================================================
     SIGNATURES
     ========================================================= -->

<table class="signature-table">

  <tr>


    <td>

      <div class="signature-line"></div>

      Applicant / Inventor

    </td>


    <td>

      <div class="signature-line"></div>

      Guide / Faculty

    </td>


  </tr>

</table>


</div>


</body>

</html>
`;
}


/* ============================================================
   FIND CHROME
   ============================================================ */

async function findChromeExecutable() {

  const candidates = [

    process.env.PUPPETEER_EXECUTABLE_PATH,

    process.env.CHROME_PATH,


    path.join(
      process.env.LOCALAPPDATA || "",
      "Google",
      "Chrome",
      "Application",
      "chrome.exe"
    ),


    path.join(
      process.env.PROGRAMFILES || "",
      "Google",
      "Chrome",
      "Application",
      "chrome.exe"
    ),


    path.join(
      process.env["PROGRAMFILES(X86)"] || "",
      "Google",
      "Chrome",
      "Application",
      "chrome.exe"
    )

  ].filter(Boolean);


  for (
    const candidate
    of candidates
  ) {

    try {

      if (
        fs.existsSync(candidate)
      ) {

        return candidate;

      }

    } catch (_) {

      /*
       * Ignore this candidate
       * and continue.
       */

    }

  }


  /*
   * Puppeteer-managed Chrome
   */

  try {

    const managedPath =
      puppeteer.executablePath();


    if (
      managedPath &&
      fs.existsSync(managedPath)
    ) {

      return managedPath;

    }

  } catch (error) {

    console.warn(
      "Unable to locate Puppeteer Chrome:",
      error.message
    );

  }


  return undefined;
}


/* ============================================================
   GENERATE PDF
   ============================================================ */

async function generate(
  patent
) {

  /*
   * Validate patent object
   */

  if (
    !patent ||
    typeof patent !== "object"
  ) {

    throw new Error(
      "Patent data is required for PDF generation."
    );

  }


  let browser = null;


  try {

    /*
     * --------------------------------------------------------
     * SRMS LOGO
     * --------------------------------------------------------
     *
     * __dirname:
     *
     * backend/src/utils
     *
     * ../../assets:
     *
     * backend/assets
     *
     */

    const logoPath =
      path.resolve(
        __dirname,
        "../../assets/srms-logo.png"
      );


    console.log(
      "SRMS logo path:",
      logoPath
    );


    const logoData =
      fileToDataUrl(
        logoPath
      );


    if (!logoData) {

      console.warn(
        "SRMS logo was not found."
      );

      console.warn(
        "Expected location:",
        logoPath
      );

    } else {

      console.log(
        "SRMS logo loaded successfully."
      );

    }


    /*
     * --------------------------------------------------------
     * CHROME
     * --------------------------------------------------------
     */

    const executablePath =
      await findChromeExecutable();


    console.log(
      "Puppeteer Chrome:",
      executablePath ||
      "Puppeteer default"
    );


    /*
     * --------------------------------------------------------
     * PUPPETEER LAUNCH
     * --------------------------------------------------------
     */

    const launchOptions = {

      headless: true,

      protocolTimeout: 120000,

      args: [

        "--no-sandbox",

        "--disable-setuid-sandbox",

        "--disable-dev-shm-usage",

        "--disable-gpu",

        "--disable-software-rasterizer"

      ]

    };


    if (executablePath) {

      launchOptions.executablePath =
        executablePath;

    }


    browser =
      await puppeteer.launch(
        launchOptions
      );


    /*
     * --------------------------------------------------------
     * PAGE
     * --------------------------------------------------------
     */

    const page =
      await browser.newPage();


    await page.setViewport({

      width: 1240,

      height: 1754,

      deviceScaleFactor: 1

    });


    /*
     * --------------------------------------------------------
     * HTML
     * --------------------------------------------------------
     */

    const html =
      buildHtml(
        patent,
        logoData
      );


    if (
      typeof html !== "string" ||
      html.length < 1000
    ) {

      throw new Error(
        "Generated patent HTML is empty or invalid."
      );

    }


    /*
     * --------------------------------------------------------
     * LOAD HTML
     * --------------------------------------------------------
     */

    await page.setContent(
      html,
      {

        waitUntil: "load",

        timeout: 120000

      }
    );


    /*
     * --------------------------------------------------------
     * WAIT FOR IMAGES + FONTS
     * --------------------------------------------------------
     */

    await page.evaluate(
      async () => {

        const images =
          Array.from(
            document.images
          );


        await Promise.all(

          images.map(
            (image) => {

              if (
                image.complete
              ) {

                return Promise.resolve();

              }


              return new Promise(
                (resolve) => {

                  const done =
                    () => resolve();


                  image.addEventListener(
                    "load",
                    done,
                    {
                      once: true
                    }
                  );


                  image.addEventListener(
                    "error",
                    done,
                    {
                      once: true
                    }
                  );

                }
              );

            }
          )

        );


        /*
         * Fonts
         */

        if (
          document.fonts &&
          document.fonts.ready
        ) {

          await document.fonts.ready;

        }

      }
    );


    /*
     * Give Chrome a short time
     * to finish rendering.
     */

    await new Promise(
      (resolve) =>
        setTimeout(
          resolve,
          300
        )
    );


    /*
     * --------------------------------------------------------
     * PDF
     * --------------------------------------------------------
     */

    const pdf =
      await page.pdf({

        format: "A4",

        printBackground: true,

        preferCSSPageSize: true,

        displayHeaderFooter: false,

        margin: {

          top: "25mm",

          right: "18mm",

          bottom: "22mm",

          left: "18mm"

        },

        timeout: 120000

      });


    /*
     * --------------------------------------------------------
     * BUFFER
     * --------------------------------------------------------
     */

    const buffer =
      Buffer.from(pdf);


    /*
     * --------------------------------------------------------
     * VALIDATE
     * --------------------------------------------------------
     */

    if (
      !buffer.length
    ) {

      throw new Error(
        "Puppeteer generated a zero-byte PDF."
      );

    }


    /*
     * PDF signature
     */

    const signature =
      buffer
        .subarray(
          0,
          5
        )
        .toString(
          "ascii"
        );


    if (
      signature !== "%PDF-"
    ) {

      throw new Error(
        "Puppeteer returned invalid PDF data."
      );

    }


    console.log(
      `Puppeteer PDF size: ${buffer.length} bytes`
    );


    return buffer;


  } catch (error) {

    console.error(
      "PDF utility error:",
      error
    );

    throw error;


  } finally {


    /*
     * --------------------------------------------------------
     * CLOSE BROWSER
     * --------------------------------------------------------
     */

    if (browser) {

      try {

        await browser.close();

      } catch (closeError) {

        console.error(
          "Browser close error:",
          closeError.message
        );

      }

    }

  }

}


/* ============================================================
   EXPORT
   ============================================================ */

module.exports = {

  generate

};