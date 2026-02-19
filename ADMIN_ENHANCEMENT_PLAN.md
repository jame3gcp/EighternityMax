# Eighternity Admin Enhancement Design

This document outlines the next wave of features for the Eighternity Backoffice, based on SaaS best practices and current system analysis.

## 1. Advanced Billing & Support Tools
To handle customer inquiries and manual adjustments efficiently.

- **Manual Subscription Overrides**:
  - Ability for admins to manually set `currentPeriodEnd` or change a user's subscription status.
  - Useful for "VIP" users or resolving payment disputes manually.
- **Refund Integration**:
  - Add a "Refund" button in the payment list that triggers the Stripe/Payment Gateway API.
- **Coupon/Promo System**:
  - New table `coupons` to manage discount codes.
  - UI to create codes (e.g., `SAJU2026`) with expiration dates and usage limits.

## 2. Content Management System (CMS)
Scaling content management without code deployments.

- **Guide CMS**:
  - Transition hardcoded `guideContents` from `Guide.tsx` to a new `guides` database table.
  - UI: CRUD for articles with tags and categories.
- **Lucky Hub CMS**:
  - Manage game availability and logic parameters.
  - UI: CRUD for "Lucky Interpretations" (the text that appears after generating lucky numbers).
- **Energy Map CMS**:
  - New table `energy_spots` to replace any static location data.
  - UI: Manage POIs (Points of Interest) with latitude/longitude and "Purpose" tags.

## 3. Operational Analytics
Better visibility into business health.

- **Retention/Cohort Analysis**:
  - Group users by signup month and track their activity/subscription over time.
- **AI Profitability Heatmap**:
  - Show average AI cost vs. average revenue per user (ARPU).
- **Audit Logs**:
  - New table `admin_audit_logs`.
  - Log every sensitive admin action: `[TIMESTAMP] Admin A updated Role for User B from USER to ADMIN`.

## 4. Technical Architecture Enhancements

### New Tables (Proposed)
- `guides`: `id`, `title`, `content`, `category`, `tags`, `is_published`, `author_id`.
- `energy_spots`: `id`, `name`, `description`, `lat`, `lng`, `purpose`, `metadata`.
- `coupons`: `id`, `code`, `discount_percent`, `expires_at`, `max_redemptions`, `is_active`.
- `admin_audit_logs`: `id`, `admin_id`, `action_type`, `target_id`, `details`, `timestamp`.

### Admin API Expansion
- `PATCH /v1/admin/subscriptions/:id`: Manual end-date/status override.
- `POST /v1/admin/payments/:id/refund`: Trigger refund.
- `GET /v1/admin/audit-logs`: Paginated history of admin actions.
- `GET /v1/admin/analytics/cohort`: JSON data for retention charts.
