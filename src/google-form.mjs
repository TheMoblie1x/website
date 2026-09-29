// The lead form posts to a Google Form. Google silently rejects a whole submission when a dropdown value
// is not one of the form's options, and a no-cors POST cannot report that. So the site never hard-codes
// options: it renders exactly what the live form accepts, from a committed snapshot.
// Refresh the snapshot after editing the Google Form:  node build.mjs --sync-form
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SNAPSHOT = join(dirname(fileURLToPath(import.meta.url)), 'content', 'google-form.json');
const FORM_ID = '1FAIpQLSeaPjcwVv3HQNo3SUTxMLAs449rchnquXw4jTybsp93HvFJkg';
const TITLES = { 'Full Name': 'name', Email: 'email', 'Project Budget': 'budget', 'Project Type': 'projectType', 'Tell us about your project': 'message' };

export const loadForm = () => JSON.parse(readFileSync(SNAPSHOT, 'utf8'));

export async function syncForm() {
    const html = await (await fetch(`https://docs.google.com/forms/d/e/${FORM_ID}/viewform`)).text();
    const data = JSON.parse(html.match(/FB_PUBLIC_LOAD_DATA_ = (.*?);<\/script>/s)[1]);
    const form = { action: `https://docs.google.com/forms/d/e/${FORM_ID}/formResponse`, fields: {}, budgetOptions: [], projectTypeOptions: [] };
    for (const q of data[1][1]) {
        const key = TITLES[String(q[1]).trim()];
        if (!key) throw new Error(`Google Form has an unmapped question: "${q[1]}". Update TITLES in src/google-form.mjs.`);
        const answer = q[4][0];
        form.fields[key] = `entry.${answer[0]}`;
        const options = (answer[1] || []).map((o) => o[0]);
        if (key === 'budget') form.budgetOptions = options;
        if (key === 'projectType') form.projectTypeOptions = options;
    }
    for (const key of Object.values(TITLES)) if (!form.fields[key]) throw new Error(`Google Form is missing the "${key}" question.`);
    writeFileSync(SNAPSHOT, JSON.stringify(form, null, 2) + '\n');
    return form;
}
