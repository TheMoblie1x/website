// Reusable components. Each returns an HTML string and works on any page.
import { SITE, WHATSAPP_HREF } from './site.mjs';
import { loadForm } from './google-form.mjs';

const GF = loadForm();

export const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const attrs = (o) => Object.entries(o).filter(([, v]) => v !== undefined && v !== false).map(([k, v]) => (v === true ? k : `${k}="${esc(v)}"`)).join(' ');

const PATHS = {
    arrow: '<path d="M5 12h14M12 5l7 7-7 7"/>',
    mail: '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    phone: '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/>',
    calendar: '<rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/>',
    check: '<path d="M20 6 9 17l-5-5"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    close: '<path d="M18 6 6 18M6 6l12 12"/>',
    chevron: '<path d="m6 9 6 6 6-6"/>',
    device: '<rect width="12" height="20" x="6" y="2" rx="3"/><path d="M11 18h2"/>',
    spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/>',
    rocket: '<path d="M5 15c-1.5 1.3-2 5-2 5s3.7-.5 5-2M12 15l-3-3a22 22 0 0 1 2-4 12.9 12.9 0 0 1 11-6c0 2.7-.8 7.5-6 11a22.4 22.4 0 0 1-4 2zM9 12H4s.6-3 2-4c1.6-1.1 5 0 5 0M12 15v5s3-.6 4-2c1.1-1.6 0-5 0-5"/>',
    bank: '<path d="M3 22h18M6 18v-7M10 18v-7M14 18v-7M18 18v-7M12 2 3 7h18z"/>',
};
const WHATSAPP = '<path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.85.484 3.622 1.401 5.184L2 22l5.01-1.502a9.85 9.85 0 004.997 1.359h.005c5.46 0 9.91-4.45 9.91-9.912 0-2.649-1.03-5.14-2.902-7.013A9.855 9.855 0 0012.04 2zm0 18.146a8.19 8.19 0 01-4.185-1.145l-.3-.178-3.121.836.834-3.043-.196-.312a8.184 8.184 0 01-1.256-4.394c0-4.523 3.68-8.203 8.228-8.203 2.198 0 4.263.857 5.816 2.412a8.157 8.157 0 012.408 5.803c0 4.524-3.68 8.224-8.228 8.224z"/>';

export const sprite = () =>
    `<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true">${Object.entries(PATHS)
        .map(([id, d]) => `<symbol id="i-${id}" viewBox="0 0 24 24">${d}</symbol>`).join('')}<symbol id="i-whatsapp" viewBox="0 0 24 24">${WHATSAPP}</symbol></svg>`;

export const icon = (name, cls = '') => `<svg class="i${name === 'whatsapp' ? ' i--fill' : ''}${cls ? ' ' + cls : ''}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

const external = (href) => /^https?:/.test(href) && !href.startsWith(SITE.url);

/** Link styled as a button. `loc` is read by analytics as the CTA location. */
export const btn = ({ href, label, variant = 'primary', ic, arrow = false, sm = false, loc, extra = '' }) =>
    `<a ${attrs({
        class: `btn btn--${variant}${sm ? ' btn--sm' : ''}${extra ? ' ' + extra : ''}`,
        href,
        target: external(href) ? '_blank' : undefined,
        rel: external(href) ? 'noopener noreferrer' : undefined,
        'data-loc': loc,
    })}>${ic ? icon(ic) : ''}${esc(label)}${arrow ? icon('arrow') : ''}</a>`;

export const link = ({ href, label, loc }) =>
    `<a ${attrs({ class: 'link-arrow', href, target: external(href) ? '_blank' : undefined, rel: external(href) ? 'noopener noreferrer' : undefined, 'data-loc': loc })}>${esc(label)}${icon('arrow')}</a>`;

export const sectionHead = ({ eyebrow, title, lede, center = false }) =>
    `<div class="section__head${center ? ' section__head--center' : ''} reveal">${eyebrow ? `<p class="eyebrow">${esc(eyebrow)}</p>` : ''}<h2 class="h2">${esc(title)}</h2>${lede ? `<p class="lede">${esc(lede)}</p>` : ''}</div>`;

export const section = ({ id, loc, cls = '', body }) =>
    `<section class="section ${cls}"${id ? ` id="${id}"` : ''} data-loc="${loc}"><div class="container">${body}</div></section>`;

export const breadcrumbs = (trail) =>
    `<nav class="crumbs" aria-label="Breadcrumb"><ol>${trail.map((t, i) => `<li>${i < trail.length - 1 ? `<a href="${t.href}">${esc(t.name)}</a>` : `<span aria-current="page">${esc(t.name)}</span>`}</li>`).join('')}</ol></nav>`;

export const checks = (items) => `<ul class="checks">${items.map((t) => `<li>${icon('check')}<span>${t}</span></li>`).join('')}</ul>`;

export const serviceCard = (s) =>
    `<article class="card reveal"><span class="icon-badge">${icon(s.icon)}</span><h3><a class="card__link" href="/services/${s.slug}/" data-loc="service">${esc(s.name)}</a></h3><p>${esc(s.blurb)}</p><p class="card__meta">${esc(s.stack)}</p>${link({ href: `/services/${s.slug}/`, label: 'Learn more', loc: 'service' })}</article>`;

const picture = (src, alt, w, h, lazy = true, extra = '') =>
    `<img src="${src}" alt="${esc(alt)}" width="${w}" height="${h}"${lazy ? ' loading="lazy" decoding="async"' : ' fetchpriority="high"'}${extra}>`;

export const phone = (src, alt, opts = {}) => `<div class="phone${opts.offset ? ' phone--offset' : ''}">${picture(src, alt, 640, 1334, !opts.eager)}</div>`;

/** Proof card: real screenshots when we have them, a typographic card when we don't. */
export const productCard = (p) => {
    const shots = p.shots && p.shots.length && p.icon
        ? `<div class="product__shots">${p.shots.slice(0, 3).map((s, i) => phone(s, `${p.name} app screenshot ${i + 1}`)).join('')}</div>`
        : p.shots && p.shots.length
            ? `<div class="product__shots product__shots--wide">${picture(p.shots[0], `${p.name} home page`, 1200, 567)}</div>`
            : '';
    const links = [
        p.case && link({ href: p.case, label: 'Case study', loc: 'case-study' }),
        p.play && link({ href: p.play, label: 'Google Play', loc: 'case-study' }),
        p.appStore && link({ href: p.appStore, label: 'App Store', loc: 'case-study' }),
        !p.case && p.web && link({ href: p.web, label: 'View live', loc: 'case-study' }),
    ].filter(Boolean).join('');
    return `<article class="product reveal">${shots}<div class="product__body"><span class="tag">${esc(p.tag)}</span><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p><div class="product__links">${links}</div></div></article>`;
};

export const pricingCard = ({ name, price, unit, text, items, cta, featured }) =>
    `<article class="card plan${featured ? ' plan--featured' : ''} reveal"><h3>${esc(name)}</h3><p class="plan__price">${esc(price)} <small>${esc(unit)}</small></p><p>${esc(text)}</p>${checks(items)}${cta}</article>`;

export const faq = (items) =>
    `<div class="faq">${items.map((f) => `<details><summary>${esc(f.q)}</summary><p class="faq__answer">${esc(f.a)}</p></details>`).join('')}</div>`;

export const processSteps = (steps) =>
    `<ol class="pipeline">${steps.map((s) => `<li class="reveal"><h3>${esc(s.name)}</h3><p>${esc(s.text)}</p></li>`).join('')}</ol>`;

/** Layered architecture: crawlable HTML, not an image. */
export const archStack = (layers) =>
    `<div class="arch" role="group" aria-label="Typical Mobile1X system architecture">${layers.map((l, i) => `<div class="arch__layer reveal"><span class="arch__index">0${i + 1}</span><div><h3>${esc(l.name)}</h3><ul class="chips">${l.items.map((t) => `<li>${esc(t)}</li>`).join('')}</ul></div></div>`).join('')}</div>`;

export const metricCard = ({ value, label }) => `<div class="metric"><strong>${esc(value)}</strong><span>${esc(label)}</span></div>`;

export const testimonial = ({ quote, name, role }) =>
    `<figure class="quote"><blockquote>${esc(quote)}</blockquote><figcaption>${esc(name)}, ${esc(role)}</figcaption></figure>`;

export const contactCard = ({ ic, label, value, href, loc, ext }) =>
    `<a class="channel" href="${href}" data-loc="${loc}"${ext ? ' target="_blank" rel="noopener noreferrer"' : ''}><span class="icon-badge">${icon(ic)}</span><span><small>${esc(label)}</small><strong>${esc(value)}</strong></span></a>`;

export const contactChannels = (loc = 'contact') => `<div class="contact__channels">${[
    contactCard({ ic: 'phone', label: 'Call Mobile1X', value: SITE.phone, href: SITE.phoneHref, loc }),
    contactCard({ ic: 'whatsapp', label: 'WhatsApp', value: 'Chat with an engineer', href: WHATSAPP_HREF, loc, ext: true }),
    contactCard({ ic: 'calendar', label: 'Discovery call', value: 'Book 30 minutes', href: SITE.calendly, loc, ext: true }),
    contactCard({ ic: 'mail', label: 'Email', value: SITE.email, href: `mailto:${SITE.email}`, loc }),
].join('')}</div>`;

const options = (list) => list.map((t) => `<option>${esc(t)}</option>`).join('');

/**
 * Lead form, posted to the Google Form. Input names for the Google fields are the form's own entry ids
 * and every dropdown option comes from the live-form snapshot (src/google-form.mjs), so a value Google
 * would reject cannot be rendered. Phone, source page and campaign have no Google column, so site.js
 * appends them to the message. A no-cors POST cannot confirm receipt, so the copy says how to follow up.
 */
export const leadForm = ({ source, heading, button = 'Talk to an Engineer' }) =>
    `<form class="form reveal" id="project-form" method="POST" action="${GF.action}" data-source="${esc(source)}" data-message-entry="${GF.fields.message}" novalidate>
    ${heading ? `<h3 class="form__title">${esc(heading)}</h3>` : ''}
    <div class="form__row">
        <div class="field"><label for="f-name">Name</label><input id="f-name" type="text" name="${GF.fields.name}" autocomplete="name" required></div>
        <div class="field"><label for="f-email">Work email</label><input id="f-email" type="email" name="${GF.fields.email}" autocomplete="email" required></div>
    </div>
    <div class="form__row">
        <div class="field"><label for="f-type">Project type</label><select id="f-type" name="${GF.fields.projectType}" required><option value="">Select one</option>${options(GF.projectTypeOptions)}</select></div>
        <div class="field"><label for="f-budget">Budget</label><select id="f-budget" name="${GF.fields.budget}" required><option value="">Select one</option>${options(GF.budgetOptions)}</select></div>
    </div>
    <div class="field"><label for="f-phone">Phone <span class="opt">(optional)</span></label><input id="f-phone" type="tel" name="phone" autocomplete="tel"></div>
    <div class="field"><label for="f-brief">What are you building?</label><textarea id="f-brief" name="${GF.fields.message}" required></textarea></div>
    <p class="hp-field" aria-hidden="true"><label>Leave this empty<input name="bot-field" tabindex="-1" autocomplete="off"></label></p>
    <button class="btn btn--primary" type="submit">${esc(button)}${icon('arrow')}</button>
    <p class="form-status" id="form-status" role="status" aria-live="polite" hidden></p>
    <p class="form__fineprint">We reply within one business day. If you have not heard back, call or WhatsApp. Details are used only to respond to your inquiry. See our <a href="/privacy/">Privacy Policy</a>.</p>
</form>`;

/** Closing CTA + form. Present on every page so a visitor is never more than one scroll from contact. */
export const contactSection = ({ source, title = 'Have a product to build?', lede = 'Tell us what you are building. An engineer replies within one business day, or skip the form and call.', form = {} }) =>
    section({
        id: 'contact', loc: 'contact', cls: 'section--contact', body: `<div class="contact"><div class="reveal"><p class="eyebrow">Talk to an engineer</p><h2 class="h2">${esc(title)}</h2><p class="lede">${esc(lede)}</p>${contactChannels()}</div>${leadForm({ source, ...form })}</div>`,
    });

/** Hero showcase: a 3D product stage (rail, preview, rotating device, info panel). Slide 0 is the no-JS state; hero-stage.js animates it. */
const SLICES = 9;
const stageBadge = (p) => (p.play && p.appStore ? 'Live on Google Play & App Store' : p.play ? 'Live on Google Play' : 'Live on the web');
const stageDevice = (p, i) => {
    const wide = !p.icon;
    const face = wide ? picture(p.shots[0], `${p.name} home page`, 1200, 568, i > 0) : picture(p.shots[0], `${p.name} app screenshot`, 640, 1334, i > 0);
    return `<div class="device device--${wide ? 'wide' : 'phone'}${i === 0 ? ' is-active' : ''}" data-index="${i}"><div class="device__slices" aria-hidden="true">${Array.from({ length: SLICES }, (_, n) => `<i style="--i:${n + 1}"></i>`).join('')}</div><div class="device__face">${face}</div></div>`;
};
export const heroStage = (products) => `<div class="stage" id="stage" aria-roledescription="carousel" aria-label="Products Mobile1X has shipped">
    <div class="stage__bg" aria-hidden="true"><i class="stage__sun"></i><div class="stage__petals" data-petals="back"></div></div>
    <div class="stage__side">
        <ol class="rail" aria-label="Choose a product">${products.map((p, i) => `<li><button class="rail__item${i === 0 ? ' is-active' : ''}" type="button" data-index="${i}"${i === 0 ? ' aria-current="true"' : ''}><span class="rail__n">0${i + 1}</span><span class="rail__name">${esc(p.name)}</span><i class="rail__bar"></i></button></li>`).join('')}</ol>
        <button class="stage__pause" type="button" aria-pressed="false" hidden><i aria-hidden="true"></i><span>Pause</span></button>
        <div class="stage__media" aria-hidden="true">${products.map((p, i) => `<figure class="media${i === 0 ? ' is-active' : ''}">${picture(p.shots[1] || p.shots[0], '', 640, 1334, true)}${p.icon ? `<img class="media__icon" src="${p.icon}" alt="" width="40" height="40" loading="lazy" decoding="async">` : ''}</figure>`).join('')}</div>
    </div>
    <div class="stage__product">
        <i class="stage__shadow" aria-hidden="true"></i>
        <div class="stage__float"><div class="stage__tilt">${products.map(stageDevice).join('')}</div></div>
        <button class="stage__spin" type="button" aria-label="Spin the product 360 degrees" hidden>360°</button>
    </div>
    <div class="stage__petals" data-petals="front" aria-hidden="true"></div>
    <div class="stage__infos">${products.map((p, i) => `<article class="info${i === 0 ? ' is-active' : ''}" data-index="${i}">
        <span class="badge">${esc(stageBadge(p))}</span>
        <h2 class="info__title">${esc(p.name)}</h2>
        <p class="info__text">${esc(p.summary)}</p>
        <div class="info__row"><div class="info__meta"><span>Platform</span><strong>${esc(p.tag)}</strong></div>${btn({ href: p.play || p.web, label: p.play ? 'Get it on Google Play' : 'Visit the website', variant: 'light', arrow: true, loc: 'hero' })}</div>
        ${p.case ? link({ href: p.case, label: 'Read the case study', loc: 'hero' }) : ''}
    </article>`).join('')}</div>
</div>`;
