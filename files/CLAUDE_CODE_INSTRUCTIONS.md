# Claude Code Instructions — Executive Coaching Pages

## What to build

Four new pages under /work/executive-coaching.

---

## Step 1 — Create the folder structure

In the project at C:\PGS_KnowledgeAgent\Scripts\Website\subramaniampg-website

Create these folders if they do not exist:

```
app/work/executive-coaching/
app/work/executive-coaching/approach/
app/work/executive-coaching/outcomes/
app/work/executive-coaching/assessment/
```

---

## Step 2 — Copy the four page files

Copy each file from the downloaded output to the project:

| Source file | Destination in project |
|---|---|
| page.tsx | app/work/executive-coaching/page.tsx |
| approach/page.tsx | app/work/executive-coaching/approach/page.tsx |
| outcomes/page.tsx | app/work/executive-coaching/outcomes/page.tsx |
| assessment/page.tsx | app/work/executive-coaching/assessment/page.tsx |

---

## Step 3 — Add environment variable locally

Open the file `.env.local` in the project root.

Add this line:

```
NEXT_PUBLIC_COACHING_ASSESSMENT_SHEET_URL=
```

Leave the value blank for now. It will be filled in after the Google Sheet is set up.

---

## Step 4 — Add the same variable to Vercel

Go to https://vercel.com
Open the subramaniampg-website project.
Go to Settings → Environment Variables.
Add:

- Name: NEXT_PUBLIC_COACHING_ASSESSMENT_SHEET_URL
- Value: (leave blank for now)
- Environments: Production, Preview, Development

---

## Step 5 — Verify build locally

Run the dev server:

```
npm run dev
```

Check these four routes load without errors:

- http://localhost:3001/work/executive-coaching
- http://localhost:3001/work/executive-coaching/approach
- http://localhost:3001/work/executive-coaching/outcomes
- http://localhost:3001/work/executive-coaching/assessment

---

## Step 6 — Update navigation

Open app/components/Navigation.tsx (or wherever the Work dropdown links are defined).

Add Executive Coaching to the Work dropdown:

```tsx
{ label: 'Executive Coaching', href: '/work/executive-coaching' }
```

Place it after the existing OKR Consulting link.

---

## Step 7 — Update the /work page

Open app/work/page.tsx.

Find the section listing the services (OKR Consulting, Strategy Consulting, etc.).

Make sure Executive Coaching appears as a card linking to /work/executive-coaching.

If a card already exists but links to the old page, update the href to /work/executive-coaching.

---

## Step 8 — Deploy to Vercel

Once the local build is clean:

```
git add .
git commit -m "Add executive coaching pages with assessment"
git push
```

Vercel will auto-deploy. Confirm these routes are live:

- https://subramaniampg.guru/work/executive-coaching
- https://subramaniampg.guru/work/executive-coaching/approach
- https://subramaniampg.guru/work/executive-coaching/outcomes
- https://subramaniampg.guru/work/executive-coaching/assessment

---

## Step 9 — Set up Google Sheet for assessment responses (do this separately)

1. Create a new Google Sheet titled: Coaching Assessment Responses
2. Add these headers in row 1:

timestamp | name | email | organisation | role | outcome | q1 | q2 | q3 | q4 | q5 | q6 | q7 | q8 | q9 | q10

3. Open Extensions → Apps Script
4. Paste this script:

```javascript
function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);
    sheet.appendRow([
      data.timestamp || '',
      data.name || '',
      data.email || '',
      data.organisation || '',
      data.role || '',
      data.outcome || '',
      data.q1 || '',
      data.q2 || '',
      data.q3 || '',
      data.q4 || '',
      data.q5 || '',
      data.q6 || '',
      data.q7 || '',
      data.q8 || '',
      data.q9 || '',
      data.q10 || '',
    ]);

    MailApp.sendEmail({
      to: 'pgs@embiggen.co.in',
      subject: 'New coaching assessment — ' + (data.name || 'Unknown') + ' (' + (data.outcome || '') + ')',
      body: [
        'Name: ' + (data.name || ''),
        'Email: ' + (data.email || ''),
        'Organisation: ' + (data.organisation || ''),
        'Role: ' + (data.role || ''),
        'Result: ' + (data.outcome || ''),
        '',
        'Answers:',
        'Q1: ' + (data.q1 || ''),
        'Q2: ' + (data.q2 || ''),
        'Q3: ' + (data.q3 || ''),
        'Q4: ' + (data.q4 || ''),
        'Q5: ' + (data.q5 || ''),
        'Q6: ' + (data.q6 || ''),
        'Q7: ' + (data.q7 || ''),
        'Q8: ' + (data.q8 || ''),
        'Q9: ' + (data.q9 || ''),
        'Q10: ' + (data.q10 || ''),
      ].join('\n')
    });

    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
```

5. Click Deploy → New Deployment
6. Type: Web App
7. Execute as: Me
8. Who has access: Anyone
9. Click Deploy and copy the web app URL

10. Paste the URL into:
    - .env.local as NEXT_PUBLIC_COACHING_ASSESSMENT_SHEET_URL
    - Vercel environment variable NEXT_PUBLIC_COACHING_ASSESSMENT_SHEET_URL

11. Redeploy on Vercel after adding the variable.

---

## Notes

- The assessment page is a client component ('use client') because it manages multi-step state.
- The other three pages are server components with metadata exports.
- All four pages are self-contained with no shared layout dependency.
- The sheet submission uses mode: 'no-cors' and fails silently — the result always shows even if the sheet call fails.
- Result routing: N wins if 4 or more N answers. Tie between C and M goes to C. Otherwise highest count wins.
