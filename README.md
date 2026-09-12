# Sweet Layer Bakery

Simple bakery website built with plain HTML, CSS, and JavaScript.

## Run locally

```powershell
python -m http.server 8080 --bind 127.0.0.1
```

Open:

- Storefront: `http://127.0.0.1:8080/`
- Admin dashboard: `http://127.0.0.1:8080/admin/`

## Publish on GitHub Pages

This is a static HTML/CSS/JavaScript site and can be hosted directly from a
GitHub repository. Upload the project files, then open the repository's
**Settings → Pages** page and choose **Deploy from a branch**, select the
`main` branch and the `/ (root)` folder, and save. The storefront will be
available at the generated GitHub Pages URL; the admin dashboard is at
`/admin/`.

EmailJS settings are stored in browser `localStorage`, so configure them again
from the deployed site's Admin dashboard. Do not commit mailbox passwords or
other secrets to GitHub.

## Render backend and WhatsApp invoices

The Render deployment uses the Node service and Render Postgres. The backend
stores every order, creates a PDF invoice, and sends the invoice to the
customer's checkout phone number and the owner through WhatsApp Cloud API.

Set these Render environment variables before testing orders:

- `WHATSAPP_ACCESS_TOKEN`: Meta WhatsApp Cloud API permanent access token
- `WHATSAPP_PHONE_NUMBER_ID`: Meta WhatsApp sender phone number ID
- `OWNER_WHATSAPP_NUMBER`: owner WhatsApp number with country code
- `WHATSAPP_CUSTOMER_TEMPLATE`: approved customer template name
- `WHATSAPP_OWNER_TEMPLATE`: approved owner template name
- `ADMIN_PASSCODE`: the same passcode used to open the admin dashboard

`DATABASE_URL` is created automatically from the `bakery-db` Render Postgres
database in `render.yaml`. The customer and owner WhatsApp templates must be
approved by Meta and must contain the body variables expected by `server.js`.
Customers must provide a WhatsApp-capable phone number and consent to receive
the order message. Never commit the WhatsApp access token to the repository.

Default admin passcode: `owner123`

## Email setup

The site supports customer and owner order emails through EmailJS because a
browser-only HTML/CSS/JS site cannot send real email by itself.

In `/admin/`, open Settings and fill:

- Owner email
- EmailJS public key
- EmailJS service ID
- Customer template ID
- Owner template ID

Use these EmailJS template variables:

- `bakery_name`
- `owner_email`
- `order_id`
- `order_date`
- `customer_name`
- `customer_email`
- `customer_phone`
- `customer_address`
- `delivery_date`
- `instructions`
- `payment_method`
- `items`
- `order_total`
- `customer_details`
- `order_details`
- `to_email`
- `recipient_name`

Recommended EmailJS template setup:

- Customer template: set the recipient email to `{{to_email}}`, reply-to to `{{reply_to}}`, subject to `{{customer_subject}}`, and put this in the email body:

	`{{customer_message}}`

	`{{order_details}}`

- Owner template: set the recipient email to `{{to_email}}`, reply-to to `{{reply_to}}`, subject to `{{owner_subject}}`, and put this in the email body:

	`{{owner_message}}`

	`{{order_details}}`

The combined variables are important: EmailJS does not automatically display
parameters just because the website sends them. They must be inserted into the
template body using the double-brace names above.

EmailJS must be configured in the Admin dashboard with its public key, service ID,
and both template IDs. Do not put a Gmail password or app password in this static
frontend; revoke any password that was shared and use EmailJS's connected email
service instead.

## Static-site note

Admin changes are saved in browser `localStorage`. That is perfect for a simple
local/static demo. For a real hosted shop where edits must update for every
customer on every device, connect this frontend to a small backend or database.

## Special day items

Special day slider items have their own image, description, details, and kg wise
prices in the admin dashboard. Customers can click a special item on the homepage
to preview it and add the selected kg size to the cart.
