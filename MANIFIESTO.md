# CLIENTS HEADLESS CMS BUILDER
## Architecture & Development Manifesto
**Version:** 1.0
**Stack:** Astro · React · Sanity · Cloudflare Pages · GitHub

---

## 1. Vision

Build a reusable, secure, maintainable and cost-efficient architecture for developing websites for independent clients.

Every client website must be autonomous, individually deployable and independently owned.

We prioritize simplicity, performance, content management, security and long-term maintainability.

**One architecture. Multiple independent clients. Zero unnecessary infrastructure.**

## 2. Core Principles

### Independence by design

Every client must have:

- Its own GitHub repository.
- Its own Sanity project.
- Its own Cloudflare Pages deployment.
- Its own domain and DNS configuration.
- Its own environment variables and credentials.
- Its own users, permissions and billing responsibilities.

No client should depend on another client's infrastructure.

### Reusability without coupling

Projects may share templates, components, patterns, schemas and tooling.

They must never share production credentials, editorial content or deployment configurations.

The builder is a development foundation, not a centralized runtime dependency.

### Static-first architecture

Astro is the primary frontend framework.

React is used selectively for components requiring client-side interactivity.

Websites should be statically generated whenever possible.

Server-side rendering and additional backend services must be introduced only when justified by actual functional requirements.

### Content belongs to the client

Sanity is the source of truth for editorial content.

Clients should be able to update their websites without modifying source code.

Editorial content must be separated from presentation and business logic.

## 3. Technology Stack

**Astro**

- Primary website framework.
- Static site generation.
- SEO-friendly routing.
- Optimized assets and minimal client-side JavaScript.

**React**

- Interactive UI components when required.
- No unnecessary hydration.
- Avoid duplicating Astro functionality.

**Sanity**

- Headless CMS.
- Dedicated project per client.
- Structured content schemas.
- Editorial workflows.
- Independently managed access permissions.

**Cloudflare Pages**

- Static hosting.
- HTTPS.
- CDN distribution.
- GitHub-based deployments.
- Preview environments.
- Production builds triggered by content publication.

**GitHub**

- Version control.
- Independent repositories.
- Pull requests and code reviews.
- Deployment integration.
- Project documentation.

## 4. Repository Strategy

The architecture consists of a reusable builder and independent client repositories.

```text
clients-headless-cms-builder/
    Reusable starter, architecture,
    conventions and documentation.

som-canet-web/
    Existing Som Canet website.

acpo-web/
    Future cultural association website.

empresa-web/
    Future business website.
```

The builder must not become a monorepo containing all client websites.

Each client project must remain independently buildable, deployable and transferable.

## 5. Sanity Architecture

Use **one Sanity project per client**.

Each project should initially contain a `production` dataset.

Additional datasets may be introduced when required for staging, testing or editorial workflows.

Schemas should reflect the actual content requirements of the website.

Potential reusable schema patterns include:

- Site settings
- Navigation
- Pages
- Editorial sections
- News
- Events
- Media
- SEO metadata

Do not introduce unnecessary content types.

Do not create a universal CMS schema that forces every client into the same content structure.

Shared schema utilities may be reused, but each client must retain control over its own content model.

## 6. Deployment and Publishing

The default publishing workflow is:

1. An authorized editor updates content in Sanity Studio.
2. The editor publishes the content.
3. A secure webhook triggers a Cloudflare Pages build.
4. Astro retrieves the published content from Sanity.
5. Astro generates the static website.
6. Cloudflare Pages deploys the generated assets.
7. The website becomes available through the client's domain.

Draft changes must not unintentionally appear in production.

Deployment failures must not silently overwrite a working production deployment.

Content publication and code deployment are separate operations that may both trigger website builds.

## 7. Domain and DNS Policy

Clients retain ownership of their domains.

Existing domain registrars should be preserved unless migration provides a clear benefit.

Websites are connected to Cloudflare Pages using supported DNS configurations.

Existing email services, including Google Workspace and Dinahosting, must remain functional.

Before changing DNS:

- Document existing records.
- Preserve MX, SPF, DKIM and DMARC configurations.
- Verify domain ownership.
- Validate HTTPS.
- Confirm canonical URLs and redirects.
- Prepare a rollback procedure.

Do not redirect the public domain to a temporary `pages.dev` URL as the default production architecture.

## 8. Security Principles

Security must be incorporated from the beginning.

- Never commit secrets to repositories.
- Use environment variables for sensitive configuration.
- Apply least-privilege access.
- Enable multifactor authentication.
- Keep dependencies updated.
- Separate client credentials.
- Protect webhook endpoints and deployment tokens.
- Validate user input.
- Avoid exposing private Sanity datasets or unpublished content.
- Implement backup and recovery procedures.

For websites handling personal data, implement appropriate privacy, retention and data-protection measures.

## 9. Ownership and Billing

Clients should own their production infrastructure wherever practical.

The developer may retain administrative or technical access through delegated permissions.

Hosting, CMS subscriptions, domain registration and email services should be billed directly to the corresponding client.

Development and maintenance fees are independent of infrastructure costs.

A project must be transferable without requiring access to unrelated client systems.

## 10. Existing Project: Som Canet

Repository:

https://github.com/aminch18/som-canet-web

Som Canet is an existing website project, not a blank starter.

Its current design and functionality must be preserved.

The next development milestone is to integrate Sanity as its headless CMS.

Before implementation:

- Audit the existing Astro and React architecture.
- Identify hardcoded editorial content.
- Design appropriate Sanity schemas.
- Plan content migration.
- Verify existing deployment configuration.
- Avoid breaking existing routes, styling and functionality.

The project must use its own Sanity instance and Cloudflare Pages deployment.

Som Canet will serve as the first practical reference implementation for the builder architecture.

However, client-specific code, content and branding must not be copied into the reusable starter.

## 11. Future Clients

### ACPO

Existing infrastructure: Dinahosting.

Objective: replace the current website with Astro and Sanity while preserving domain ownership and any existing email services.

### Business Client

Existing infrastructure: domain associated with Google Workspace.

Objective: build a static corporate website with editable content while preserving the existing email configuration.

### Additional Clients

Future projects should start from the builder template and receive independent infrastructure from the beginning.

## 12. Builder Responsibilities

The `clients-headless-cms-builder` repository should provide:

- Astro starter architecture.
- Optional React integration.
- Sanity integration patterns.
- Reusable content schemas.
- SEO defaults.
- Accessible UI foundations.
- Environment configuration examples.
- Cloudflare Pages deployment instructions.
- Webhook integration guidance.
- Security checklist.
- Client handover documentation.

The builder must remain lightweight and modular.

It must not evolve into an unnecessarily complex framework.

## 13. Engineering Standards

- Prefer TypeScript.
- Prefer simple, explicit abstractions.
- Use Astro components by default.
- Introduce React only when justified.
- Preserve accessibility and semantic HTML.
- Optimize images and loading performance.
- Maintain predictable project structures.
- Document important architectural decisions.
- Validate production builds before deployment.
- Avoid unnecessary dependencies.
- Keep client-specific customization isolated.

## 14. Definition of Done

A client website is considered production-ready when:

- Its design and functionality are complete.
- Editorial content is manageable through Sanity.
- Static builds succeed.
- Production deployment works.
- Domain and HTTPS are configured.
- Existing email services remain unaffected.
- SEO and accessibility have been reviewed.
- Security requirements are satisfied.
- Backup and recovery procedures are documented.
- The client can manage content independently.
- Ownership and access responsibilities are clear.

## 15. Guiding Philosophy

**Build once. Reuse intelligently. Deploy independently.**

The objective is not to create a complex platform.

The objective is to establish a professional, repeatable development system that allows independent clients to own fast, secure and maintainable websites without unnecessary recurring infrastructure costs.

Every technical decision should support at least one of these outcomes:

1. Reduce complexity.
2. Improve maintainability.
3. Increase client independence.
4. Improve security.
5. Reduce operational costs.
6. Accelerate future development.

If a new abstraction, dependency or service does not provide a meaningful benefit, it should not be introduced.
