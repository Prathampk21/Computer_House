import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

const id = uuid("id").defaultRandom().primaryKey();
const createdAt = timestamp("created_at", { withTimezone: true })
  .defaultNow()
  .notNull();
const updatedAt = timestamp("updated_at", { withTimezone: true })
  .defaultNow()
  .notNull();

export const appRoleEnum = pgEnum("app_role", [
  "OWNER",
  "ADMIN",
  "STAFF",
  "DEALER",
  "CUSTOMER",
]);

export const productConditionEnum = pgEnum("product_condition", [
  "NEW",
  "USED",
  "REFURBISHED",
]);

export const stockStatusEnum = pgEnum("stock_status", [
  "IN_STOCK",
  "LOW_STOCK",
  "OUT_OF_STOCK",
  "SOLD",
  "COMING_SOON",
]);

export const specDataTypeEnum = pgEnum("spec_data_type", [
  "TEXT",
  "NUMBER",
  "BOOLEAN",
  "DATE",
  "SELECT",
]);

export const leadStatusEnum = pgEnum("lead_status", [
  "NEW",
  "CONTACTED",
  "INTERESTED",
  "NEGOTIATING",
  "WON",
  "LOST",
  "CANCELLED",
]);

export const leadSourceEnum = pgEnum("lead_source", [
  "WEBSITE",
  "WHATSAPP",
  "DEALER_REFERRAL",
  "PHONE",
  "WALK_IN",
  "MANUAL",
]);

export const commissionTypeEnum = pgEnum("commission_type", [
  "PERCENTAGE",
  "FIXED",
  "MANUAL",
]);

export const commissionStatusEnum = pgEnum("commission_status", [
  "PENDING",
  "APPROVED",
  "PAID",
  "REJECTED",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
  "IN_APP",
  "EMAIL",
  "WHATSAPP",
  "WEB_PUSH",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
  "PENDING",
  "PROCESSING",
  "SENT",
  "FAILED",
  "CANCELLED",
]);

export const productChangeEventEnum = pgEnum("product_change_event_type", [
  "PRICE_CHANGED",
  "OFFER_STARTED",
  "OFFER_ENDED",
  "BACK_IN_STOCK",
  "OUT_OF_STOCK",
  "PRODUCT_SOLD",
  "PRODUCT_UPDATED",
  "NEW_ARRIVAL",
]);

export const profiles = pgTable(
  "profiles",
  {
    id,
    authUserId: uuid("auth_user_id").notNull().unique(),
    email: varchar("email", { length: 320 }).notNull(),
    fullName: text("full_name").notNull(),
    role: appRoleEnum("role").default("CUSTOMER").notNull(),
    mobile: varchar("mobile", { length: 32 }),
    active: boolean("active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("profiles_role_idx").on(table.role),
    uniqueIndex("profiles_email_idx").on(table.email),
  ],
);

export const shopSettings = pgTable("shop_settings", {
  id,
  key: varchar("key", { length: 128 }).notNull().unique(),
  value: jsonb("value").$type<Record<string, unknown>>().notNull(),
  description: text("description"),
  createdAt,
  updatedAt,
});

export const featureFlags = pgTable("feature_flags", {
  id,
  key: varchar("key", { length: 128 }).notNull().unique(),
  enabled: boolean("enabled").default(true).notNull(),
  description: text("description"),
  createdAt,
  updatedAt,
});

export const categories = pgTable(
  "categories",
  {
    id,
    parentId: uuid("parent_id").references((): AnyPgColumn => categories.id, {
      onDelete: "set null",
    }),
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    description: text("description"),
    displayOrder: integer("display_order").default(0).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("categories_slug_idx").on(table.slug),
    index("categories_parent_idx").on(table.parentId),
  ],
);

export const brands = pgTable(
  "brands",
  {
    id,
    name: varchar("name", { length: 160 }).notNull(),
    slug: varchar("slug", { length: 180 }).notNull(),
    logoUrl: text("logo_url"),
    active: boolean("active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [uniqueIndex("brands_slug_idx").on(table.slug)],
);

export const products = pgTable(
  "products",
  {
    id,
    name: varchar("name", { length: 220 }).notNull(),
    slug: varchar("slug", { length: 240 }).notNull(),
    sku: varchar("sku", { length: 80 }).notNull(),
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    subcategoryId: uuid("subcategory_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    brandId: uuid("brand_id").references(() => brands.id, {
      onDelete: "set null",
    }),
    shortDescription: text("short_description").notNull(),
    detailedDescription: text("detailed_description"),
    condition: productConditionEnum("condition").notNull(),
    conditionGrade: varchar("condition_grade", { length: 40 }),
    regularPrice: numeric("regular_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    sellingPrice: numeric("selling_price", {
      precision: 12,
      scale: 2,
    }).notNull(),
    stockQuantity: integer("stock_quantity").default(0).notNull(),
    stockStatus: stockStatusEnum("stock_status").notNull(),
    warranty: varchar("warranty", { length: 160 }),
    featured: boolean("featured").default(false).notNull(),
    published: boolean("published").default(false).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("products_slug_idx").on(table.slug),
    uniqueIndex("products_sku_idx").on(table.sku),
    index("products_category_idx").on(table.categoryId),
    index("products_brand_idx").on(table.brandId),
    index("products_condition_idx").on(table.condition),
    index("products_stock_status_idx").on(table.stockStatus),
    index("products_created_at_idx").on(table.createdAt),
    index("products_search_idx").using(
      "gin",
      sql`to_tsvector('english', ${table.name} || ' ' || ${table.sku} || ' ' || ${table.shortDescription})`,
    ),
  ],
);

export const productImages = pgTable(
  "product_images",
  {
    id,
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    storagePath: text("storage_path").notNull(),
    altText: text("alt_text").notNull(),
    displayOrder: integer("display_order").default(0).notNull(),
    isPrimary: boolean("is_primary").default(false).notNull(),
    createdAt,
  },
  (table) => [index("product_images_product_idx").on(table.productId)],
);

export const specificationDefinitions = pgTable(
  "specification_definitions",
  {
    id,
    categoryId: uuid("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "cascade" }),
    key: varchar("key", { length: 120 }).notNull(),
    label: varchar("label", { length: 160 }).notNull(),
    dataType: specDataTypeEnum("data_type").default("TEXT").notNull(),
    unit: varchar("unit", { length: 40 }),
    displayOrder: integer("display_order").default(0).notNull(),
    filterable: boolean("filterable").default(false).notNull(),
    comparable: boolean("comparable").default(true).notNull(),
    required: boolean("required").default(false).notNull(),
    options: jsonb("options").$type<string[]>(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("spec_definitions_category_key_idx").on(
      table.categoryId,
      table.key,
    ),
    index("spec_definitions_category_idx").on(table.categoryId),
  ],
);

export const productSpecificationValues = pgTable(
  "product_specification_values",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    specificationDefinitionId: uuid("specification_definition_id")
      .notNull()
      .references(() => specificationDefinitions.id, { onDelete: "cascade" }),
    value: text("value").notNull(),
    normalizedValue: text("normalized_value"),
    createdAt,
    updatedAt,
  },
  (table) => [
    primaryKey({
      columns: [table.productId, table.specificationDefinitionId],
    }),
    index("product_spec_values_product_idx").on(table.productId),
    index("product_spec_values_definition_idx").on(
      table.specificationDefinitionId,
    ),
  ],
);

export const offers = pgTable("offers", {
  id,
  title: varchar("title", { length: 180 }).notNull(),
  description: text("description"),
  offerType: varchar("offer_type", { length: 60 }).notNull(),
  discountValue: numeric("discount_value", { precision: 12, scale: 2 }),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  active: boolean("active").default(true).notNull(),
  bannerText: varchar("banner_text", { length: 220 }),
  createdAt,
  updatedAt,
});

export const productOffers = pgTable(
  "product_offers",
  {
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    offerId: uuid("offer_id")
      .notNull()
      .references(() => offers.id, { onDelete: "cascade" }),
    createdAt,
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.offerId] }),
    index("product_offers_offer_idx").on(table.offerId),
  ],
);

export const dealers = pgTable(
  "dealers",
  {
    id,
    profileId: uuid("profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    businessName: varchar("business_name", { length: 180 }).notNull(),
    contactName: varchar("contact_name", { length: 160 }).notNull(),
    email: varchar("email", { length: 320 }),
    mobile: varchar("mobile", { length: 32 }).notNull(),
    referralCode: varchar("referral_code", { length: 64 }).notNull(),
    active: boolean("active").default(true).notNull(),
    defaultCommissionType:
      commissionTypeEnum("default_commission_type").default("PERCENTAGE"),
    defaultCommissionValue: numeric("default_commission_value", {
      precision: 12,
      scale: 2,
    }).default("5"),
    activatedAt: timestamp("activated_at", { withTimezone: true }),
    deactivatedAt: timestamp("deactivated_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("dealers_referral_code_idx").on(table.referralCode),
    index("dealers_active_idx").on(table.active),
  ],
);

export const visitorSessions = pgTable(
  "visitor_sessions",
  {
    id,
    visitorToken: varchar("visitor_token", { length: 160 }).notNull(),
    firstDealerId: uuid("first_dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    currentDealerId: uuid("current_dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    attributionStartedAt: timestamp("attribution_started_at", {
      withTimezone: true,
    }),
    attributionExpiresAt: timestamp("attribution_expires_at", {
      withTimezone: true,
    }),
    userAgent: text("user_agent"),
    ipHash: varchar("ip_hash", { length: 128 }),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("visitor_sessions_token_idx").on(table.visitorToken),
    index("visitor_sessions_first_dealer_idx").on(table.firstDealerId),
  ],
);

export const referralClicks = pgTable(
  "referral_clicks",
  {
    id,
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    visitorSessionId: uuid("visitor_session_id").references(
      () => visitorSessions.id,
      { onDelete: "set null" },
    ),
    referralCode: varchar("referral_code", { length: 64 }).notNull(),
    landingPath: text("landing_path").notNull(),
    clickedAt: timestamp("clicked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt,
  },
  (table) => [
    index("referral_clicks_dealer_idx").on(table.dealerId),
    index("referral_clicks_created_at_idx").on(table.clickedAt),
  ],
);

export const productViews = pgTable(
  "product_views",
  {
    id,
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    visitorSessionId: uuid("visitor_session_id").references(
      () => visitorSessions.id,
      { onDelete: "set null" },
    ),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    viewedAt: timestamp("viewed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt,
  },
  (table) => [
    index("product_views_product_idx").on(table.productId),
    index("product_views_dealer_idx").on(table.dealerId),
    index("product_views_created_at_idx").on(table.viewedAt),
  ],
);

export const comparisonEvents = pgTable("comparison_events", {
  id,
  visitorSessionId: uuid("visitor_session_id").references(
    () => visitorSessions.id,
    { onDelete: "set null" },
  ),
  dealerId: uuid("dealer_id").references(() => dealers.id, {
    onDelete: "set null",
  }),
  productIds: jsonb("product_ids").$type<string[]>().notNull(),
  comparedAt: timestamp("compared_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  createdAt,
});

export const whatsappClickEvents = pgTable(
  "whatsapp_click_events",
  {
    id,
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    leadId: uuid("lead_id"),
    visitorSessionId: uuid("visitor_session_id").references(
      () => visitorSessions.id,
      { onDelete: "set null" },
    ),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    clickedAt: timestamp("clicked_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    createdAt,
  },
  (table) => [index("whatsapp_clicks_created_at_idx").on(table.clickedAt)],
);

export const customers = pgTable(
  "customers",
  {
    id,
    authUserId: uuid("auth_user_id"),
    name: varchar("name", { length: 180 }).notNull(),
    mobile: varchar("mobile", { length: 32 }).notNull(),
    email: varchar("email", { length: 320 }),
    notificationConsent: boolean("notification_consent").default(false),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("customers_mobile_idx").on(table.mobile),
    index("customers_email_idx").on(table.email),
  ],
);

export const leads = pgTable(
  "leads",
  {
    id,
    leadNumber: varchar("lead_number", { length: 40 }).notNull(),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    visitorSessionId: uuid("visitor_session_id").references(
      () => visitorSessions.id,
      { onDelete: "set null" },
    ),
    source: leadSourceEnum("source").default("WEBSITE").notNull(),
    status: leadStatusEnum("status").default("NEW").notNull(),
    message: text("message"),
    attributionOverrideReason: text("attribution_override_reason"),
    attributedByProfileId: uuid("attributed_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    attributedAt: timestamp("attributed_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    uniqueIndex("leads_lead_number_idx").on(table.leadNumber),
    index("leads_dealer_idx").on(table.dealerId),
    index("leads_status_idx").on(table.status),
    index("leads_created_at_idx").on(table.createdAt),
  ],
);

export const leadItems = pgTable(
  "lead_items",
  {
    id,
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productNameSnapshot: varchar("product_name_snapshot", {
      length: 220,
    }).notNull(),
    skuSnapshot: varchar("sku_snapshot", { length: 80 }).notNull(),
    sellingPriceSnapshot: numeric("selling_price_snapshot", {
      precision: 12,
      scale: 2,
    }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    createdAt,
  },
  (table) => [index("lead_items_lead_idx").on(table.leadId)],
);

export const leadStatusHistory = pgTable(
  "lead_status_history",
  {
    id,
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    previousStatus: leadStatusEnum("previous_status"),
    newStatus: leadStatusEnum("new_status").notNull(),
    changedByProfileId: uuid("changed_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    note: text("note"),
    createdAt,
  },
  (table) => [index("lead_status_history_lead_idx").on(table.leadId)],
);

export const leadNotes = pgTable(
  "lead_notes",
  {
    id,
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "cascade" }),
    authorProfileId: uuid("author_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    note: text("note").notNull(),
    dealerVisible: boolean("dealer_visible").default(false).notNull(),
    createdAt,
  },
  (table) => [index("lead_notes_lead_idx").on(table.leadId)],
);

export const sales = pgTable(
  "sales",
  {
    id,
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "restrict" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    dealerId: uuid("dealer_id").references(() => dealers.id, {
      onDelete: "set null",
    }),
    saleAmount: numeric("sale_amount", { precision: 12, scale: 2 }).notNull(),
    saleDate: timestamp("sale_date", { withTimezone: true }).notNull(),
    invoiceReference: varchar("invoice_reference", { length: 120 }),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("sales_dealer_idx").on(table.dealerId),
    index("sales_created_at_idx").on(table.createdAt),
  ],
);

export const saleItems = pgTable(
  "sale_items",
  {
    id,
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "set null",
    }),
    productNameSnapshot: varchar("product_name_snapshot", {
      length: 220,
    }).notNull(),
    skuSnapshot: varchar("sku_snapshot", { length: 80 }).notNull(),
    unitPriceSnapshot: numeric("unit_price_snapshot", {
      precision: 12,
      scale: 2,
    }).notNull(),
    quantity: integer("quantity").default(1).notNull(),
    createdAt,
  },
  (table) => [index("sale_items_sale_idx").on(table.saleId)],
);

export const commissions = pgTable(
  "commissions",
  {
    id,
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "restrict" }),
    saleId: uuid("sale_id")
      .notNull()
      .references(() => sales.id, { onDelete: "cascade" }),
    leadId: uuid("lead_id")
      .notNull()
      .references(() => leads.id, { onDelete: "restrict" }),
    baseSaleAmount: numeric("base_sale_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    commissionType: commissionTypeEnum("commission_type").notNull(),
    commissionValue: numeric("commission_value", {
      precision: 12,
      scale: 2,
    }).notNull(),
    calculatedAmount: numeric("calculated_amount", {
      precision: 12,
      scale: 2,
    }).notNull(),
    finalAmount: numeric("final_amount", { precision: 12, scale: 2 }).notNull(),
    status: commissionStatusEnum("status").default("PENDING").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("commissions_dealer_idx").on(table.dealerId),
    index("commissions_status_idx").on(table.status),
  ],
);

export const commissionPayouts = pgTable(
  "commission_payouts",
  {
    id,
    dealerId: uuid("dealer_id")
      .notNull()
      .references(() => dealers.id, { onDelete: "restrict" }),
    amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
    paymentReference: varchar("payment_reference", { length: 160 }),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    notes: text("notes"),
    createdAt,
    updatedAt,
  },
  (table) => [index("commission_payouts_dealer_idx").on(table.dealerId)],
);

export const customerSubscriptions = pgTable(
  "customer_subscriptions",
  {
    id,
    customerId: uuid("customer_id").references(() => customers.id, {
      onDelete: "cascade",
    }),
    productId: uuid("product_id").references(() => products.id, {
      onDelete: "cascade",
    }),
    categoryId: uuid("category_id").references(() => categories.id, {
      onDelete: "cascade",
    }),
    email: varchar("email", { length: 320 }),
    mobile: varchar("mobile", { length: 32 }),
    eventTypes: jsonb("event_types").$type<string[]>().notNull(),
    consentGiven: boolean("consent_given").default(false).notNull(),
    active: boolean("active").default(true).notNull(),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("customer_subscriptions_product_idx").on(table.productId),
    index("customer_subscriptions_category_idx").on(table.categoryId),
  ],
);

export const productChangeEvents = pgTable(
  "product_change_events",
  {
    id,
    productId: uuid("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    eventType: productChangeEventEnum("event_type").notNull(),
    oldValues: jsonb("old_values").$type<Record<string, unknown>>(),
    newValues: jsonb("new_values").$type<Record<string, unknown>>(),
    createdByProfileId: uuid("created_by_profile_id").references(
      () => profiles.id,
      { onDelete: "set null" },
    ),
    createdAt,
  },
  (table) => [
    index("product_change_events_product_idx").on(table.productId),
    index("product_change_events_type_idx").on(table.eventType),
    index("product_change_events_created_at_idx").on(table.createdAt),
  ],
);

export const notificationJobs = pgTable(
  "notification_jobs",
  {
    id,
    productChangeEventId: uuid("product_change_event_id").references(
      () => productChangeEvents.id,
      { onDelete: "cascade" },
    ),
    customerSubscriptionId: uuid("customer_subscription_id").references(
      () => customerSubscriptions.id,
      { onDelete: "cascade" },
    ),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    channel: notificationChannelEnum("channel").notNull(),
    status: notificationStatusEnum("status").default("PENDING").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }),
    failedAt: timestamp("failed_at", { withTimezone: true }),
    errorMessage: text("error_message"),
    createdAt,
    updatedAt,
  },
  (table) => [
    index("notification_jobs_status_idx").on(table.status),
    index("notification_jobs_created_at_idx").on(table.createdAt),
  ],
);

export const notificationLogs = pgTable(
  "notification_logs",
  {
    id,
    notificationJobId: uuid("notification_job_id").references(
      () => notificationJobs.id,
      { onDelete: "set null" },
    ),
    channel: notificationChannelEnum("channel").notNull(),
    recipient: varchar("recipient", { length: 320 }).notNull(),
    status: notificationStatusEnum("status").notNull(),
    providerResponse: jsonb("provider_response").$type<
      Record<string, unknown>
    >(),
    errorMessage: text("error_message"),
    createdAt,
  },
  (table) => [index("notification_logs_job_idx").on(table.notificationJobId)],
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id,
    actorProfileId: uuid("actor_profile_id").references(() => profiles.id, {
      onDelete: "set null",
    }),
    action: varchar("action", { length: 160 }).notNull(),
    entityType: varchar("entity_type", { length: 120 }).notNull(),
    entityId: uuid("entity_id"),
    previousValues: jsonb("previous_values").$type<Record<string, unknown>>(),
    newValues: jsonb("new_values").$type<Record<string, unknown>>(),
    reason: text("reason"),
    createdAt,
  },
  (table) => [
    index("audit_logs_entity_idx").on(table.entityType, table.entityId),
    index("audit_logs_created_at_idx").on(table.createdAt),
  ],
);

export const productRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  subcategory: one(categories, {
    fields: [products.subcategoryId],
    references: [categories.id],
  }),
  brand: one(brands, {
    fields: [products.brandId],
    references: [brands.id],
  }),
  images: many(productImages),
  specificationValues: many(productSpecificationValues),
}));

export const leadRelations = relations(leads, ({ one, many }) => ({
  customer: one(customers, {
    fields: [leads.customerId],
    references: [customers.id],
  }),
  dealer: one(dealers, {
    fields: [leads.dealerId],
    references: [dealers.id],
  }),
  items: many(leadItems),
  statusHistory: many(leadStatusHistory),
  notes: many(leadNotes),
}));
