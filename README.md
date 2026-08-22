# Prayer Journal

A desktop-web journal for one small circle. Log prayer requests, mark “I prayed,” leave short notes, and move answered requests aside.

See [docs/brainstorms/2026-08-22-prayer-journal-brainstorm.md](docs/brainstorms/2026-08-22-prayer-journal-brainstorm.md) and [docs/plans/2026-08-22-feat-prayer-journal-v1-plan.md](docs/plans/2026-08-22-feat-prayer-journal-v1-plan.md).

## Requirements

- Ruby 3.4 (this repo pins `3.4.10` in `.ruby-version`)
- SQLite

If system Ruby is too old, install with [mise](https://mise.jdx.dev/):

```bash
mise install ruby@3.4
export PATH="$HOME/.local/share/mise/installs/ruby/3.4.10/bin:$PATH"
```

## Setup

```bash
bin/setup
bin/rails server
```

Open http://localhost:3000. The first email that signs in becomes the circle owner. Everyone else needs the invite link from **Circle** (owner only), then owner approval.

## Mail in development

Action Mailer writes files under `tmp/mails`. Open the newest file after you request a sign-in link. Clicking the link shows a confirm page (POST) so email scanners do not burn it.

## Tests

```bash
bin/rails test
```

## Production notes

- `APP_HOST` — public hostname for mail links
- `MAIL_FROM` — e.g. `Prayer Journal <prayer@yourdomain.com>`
- Point Action Mailer SMTP at [Resend](https://resend.com/docs/send-with-ruby) (`smtp.resend.com`, user `resend`, password = API key)
- Verify the sending domain (SPF/DKIM) or mail lands in spam
- `force_ssl` is on in production
