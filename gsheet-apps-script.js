/**
 * Google Apps Script — RSVP → Google Sheet
 *
 * SETUP
 * 1. Create a Google Sheet with header row:
 *    Timestamp | Name | Guests | Attendance
 * 2. Extensions → Apps Script
 * 3. Paste this entire file, Save
 * 4. Deploy → New deployment → Web app
 *    - Execute as: Me
 *    - Who has access: Anyone
 * 5. Copy the Web App URL into script.js → GOOGLE_SCRIPT_URL
 */

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(["Timestamp", "Name", "Guests", "Attendance"]);
    }

    sheet.appendRow([
      data.timestamp || new Date().toISOString(),
      data.name || "",
      data.guests || "",
      data.attendance || "",
    ]);

    return ContentService
      .createTextOutput(JSON.stringify({ result: "success" }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ result: "error", message: String(err) }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doGet() {
  return ContentService
    .createTextOutput(JSON.stringify({ status: "RSVP endpoint live" }))
    .setMimeType(ContentService.MimeType.JSON);
}
