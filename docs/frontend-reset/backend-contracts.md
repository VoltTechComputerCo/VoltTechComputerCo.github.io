# Backend contract index

Literal source references, with file and line. These are repository evidence, not a claim about the deployed schema.

## table

| Name | Source references |
|---|---|
| `account_deletion_requests` | `admin-deletions.js:8`, `assets/js/services/account-data.js:71`, `assets/js/services/privacy-data.js:24`, `assets/js/services/privacy-data.js:30`, `assets/js/services/privacy-data.js:41` |
| `creator_discovery_config` | `Supabase/functions/discover-sa-streamers/index.ts:53` |
| `creator_discovery_hits` | `Supabase/functions/discover-sa-streamers/index.ts:75` |
| `creator_registrations` | `Supabase/functions/creator-register/index.ts:52`, `Supabase/functions/creator-register/index.ts:62`, `Supabase/functions/discover-sa-streamers/index.ts:80`, `Supabase/functions/discover-sa-streamers/index.ts:82` |
| `customer_addresses` | `assets/js/services/account-data.js:34`, `assets/js/services/account-data.js:57`, `assets/js/services/privacy-data.js:48`, `commerce/js/store-core.js:31`, `volttech-dialog.js:98` |
| `customer_documents` | `assets/js/services/privacy-data.js:58` |
| `email_delivery_log` | `assets/js/services/privacy-data.js:60` |
| `invoices` | `admin-customer.js:1`, `admin-records.js:20`, `admin-workflow.js:29`, `admin.js:64`, `assets/js/services/account-data.js:70`, `assets/js/services/customer-documents.js:40`, `assets/js/services/customer-documents.js:46`, `assets/js/services/customer-records.js:43`, `assets/js/services/customer-records.js:76`, `assets/js/services/privacy-data.js:53` |
| `notifications` | `Supabase/functions/submit-store-checkout/index.ts:112`, `assets/js/services/customer-notifications.js:50`, `assets/js/services/customer-notifications.js:51`, `assets/js/services/customer-notifications.js:52`, `assets/js/services/privacy-data.js:59`, `notifications.js:288`, `notifications.js:345`, `notifications.js:350` |
| `orders` | `admin-customer.js:1`, `admin-records.js:22`, `assets/js/services/customer-documents.js:47`, `assets/js/services/customer-records.js:44`, `assets/js/services/customer-records.js:79`, `assets/js/services/privacy-data.js:55` |
| `payments` | `assets/js/services/privacy-data.js:54` |
| `profiles` | `assets/js/services/account-data.js:21`, `assets/js/services/account-data.js:5`, `assets/js/services/customer-documents.js:36`, `assets/js/services/privacy-data.js:47`, `commerce/js/store-core.js:31` |
| `proformas` | `admin-records.js:24`, `assets/js/services/customer-documents.js:45`, `assets/js/services/customer-records.js:81`, `assets/js/services/privacy-data.js:57` |
| `quote_acceptances` | `assets/js/services/privacy-data.js:51` |
| `quote_events` | `assets/js/services/privacy-data.js:52` |
| `quotes` | `admin-customer.js:1`, `admin-records.js:19`, `admin-workflow.js:47`, `assets/js/services/account-data.js:69`, `assets/js/services/customer-documents.js:34`, `assets/js/services/customer-documents.js:42`, `assets/js/services/customer-documents.js:51`, `assets/js/services/customer-records.js:42`, `assets/js/services/customer-records.js:65`, `assets/js/services/customer-records.js:77`, `assets/js/services/privacy-data.js:50` |
| `saved_builds` | `admin-builds.js:22`, `admin-customer.js:1`, `admin-records.js:21`, `admin-workflow.js:32`, `assets/js/services/builder-account.js:213`, `assets/js/services/builder-account.js:247`, `assets/js/services/builder-account.js:249`, `assets/js/services/customer-documents.js:49`, `assets/js/services/customer-records.js:41`, `assets/js/services/customer-records.js:60`, `assets/js/services/customer-records.js:62`, `assets/js/services/customer-records.js:78`, `assets/js/services/privacy-data.js:49` |
| `service_jobs` | `admin-customer.js:1`, `admin-records.js:23`, `assets/js/services/customer-documents.js:54`, `assets/js/services/customer-records.js:45`, `assets/js/services/customer-records.js:80`, `assets/js/services/privacy-data.js:56` |
| `static_newsletter_deliveries` | `Supabase/functions/process-static-mailer/index.ts:220`, `Supabase/functions/process-static-mailer/index.ts:227` |
| `static_newsletter_runs` | `Supabase/functions/process-static-mailer/index.ts:159`, `Supabase/functions/process-static-mailer/index.ts:175`, `Supabase/functions/process-static-mailer/index.ts:237` |
| `static_subscribers` | `Supabase/functions/process-static-mailer/index.ts:167`, `Supabase/functions/static-confirm/index.ts:44`, `Supabase/functions/static-confirm/index.ts:53`, `Supabase/functions/static-subscribe/index.ts:109`, `Supabase/functions/static-subscribe/index.ts:119`, `Supabase/functions/static-subscribe/index.ts:144`, `Supabase/functions/static-subscribe/index.ts:91`, `Supabase/functions/static-unsubscribe/index.ts:56` |
| `store_automation_events` | `Supabase/functions/bobgo-book-shipment/index.ts:14`, `Supabase/functions/submit-store-checkout/index.ts:108` |
| `store_categories` | `commerce/js/store-core.js:26` |
| `store_payments` | `Supabase/functions/create-store-payment/index.ts:25`, `Supabase/functions/create-store-payment/index.ts:27`, `Supabase/functions/create-store-payment/index.ts:30` |
| `store_private_settings` | `Supabase/functions/bobgo-book-shipment/index.ts:11`, `Supabase/functions/bobgo-checkout-rates/index.ts:26` |
| `store_product_documents` | `commerce/js/store-core.js:29` |
| `store_product_relations` | `commerce/js/store-core.js:29` |
| `store_products` | `Supabase/functions/bobgo-checkout-rates/index.ts:27`, `Supabase/functions/submit-store-checkout/index.ts:94`, `builder/js/data-loader.js:117`, `commerce/js/admin-catalogue-qa.js:281`, `commerce/js/admin-catalogue-qa.js:311`, `commerce/js/admin-catalogue-qa.js:326`, `commerce/js/admin-store.js:22`, `commerce/js/admin-store.js:8`, `commerce/js/store-core.js:26`, `commerce/js/store-core.js:27`, `commerce/js/store-core.js:28` |
| `store_request_items` | `Supabase/functions/submit-store-checkout/index.ts:107` |
| `store_requests` | `Supabase/functions/bobgo-book-shipment/index.ts:12`, `Supabase/functions/bobgo-book-shipment/index.ts:14`, `Supabase/functions/create-store-payment/index.ts:24`, `Supabase/functions/create-store-payment/index.ts:30`, `Supabase/functions/store-checkout-status/index.ts:24`, `Supabase/functions/submit-store-checkout/index.ts:101`, `Supabase/functions/submit-store-checkout/index.ts:107`, `commerce/js/admin-store.js:8` |
| `store_settings` | `Supabase/functions/submit-store-checkout/index.ts:92`, `admin-launch-controls.js:125`, `admin-launch-controls.js:65`, `commerce/js/store-core.js:26` |
| `streamer_status` | `Supabase/functions/creator-register/index.ts:59`, `Supabase/functions/discover-sa-streamers/index.ts:79`, `Supabase/functions/refresh-sa-streamers/index.ts:156`, `Supabase/functions/refresh-sa-streamers/index.ts:80` |
| `streamers` | `Supabase/functions/creator-register/index.ts:56`, `Supabase/functions/discover-sa-streamers/index.ts:78`, `Supabase/functions/refresh-sa-streamers/index.ts:151`, `Supabase/functions/refresh-sa-streamers/index.ts:162`, `Supabase/functions/refresh-sa-streamers/index.ts:68` |

## rest_endpoint

| Name | Source references |
|---|---|
| `store_products` | `Supabase/functions/resolve-product-image/index.ts:173` |
| `store_settings` | `assets/js/services/home-integrations.js:14`, `site-notifications-loader.js:91` |
| `streamer_directory` | `assets/js/services/creator-feed.js:66`, `streamer-feed.js:44` |

## rpc

| Name | Source references |
|---|---|
| `admin_confirm_store_checkout` | `commerce/js/admin-store.js:17` |
| `admin_create_invoice` | `admin-workflow.js:174`, `admin.js:115` |
| `admin_create_quote` | `admin.js:144` |
| `admin_customers` | `admin-builds.js:26`, `admin-customer.js:1`, `admin-customers.js:1`, `admin-deletions.js:8`, `admin-records.js:17`, `admin-workflow.js:27`, `admin.js:129`, `commerce/js/admin-store.js:8` |
| `admin_get_shipping_config` | `commerce/js/admin-store.js:10`, `commerce/js/admin-store.js:8` |
| `admin_queue_document_email` | `Supabase/functions/send-document-email/index.ts:28` |
| `admin_quote_saved_build` | `admin-builds.js:143` |
| `admin_quotes` | `admin-workflow.js:28`, `admin.js:92` |
| `admin_rotate_store_access_token` | `commerce/js/admin-store.js:18` |
| `admin_send_quote` | `admin-workflow.js:154`, `admin.js:102` |
| `admin_set_shipping_config` | `commerce/js/admin-store.js:10` |
| `admin_store_launch_readiness` | `admin-launch-controls.js:57` |
| `admin_validate_store_product` | `commerce/js/admin-catalogue-qa.js:336` |
| `consume_store_edge_rate_limit` | `Supabase/functions/bobgo-checkout-rates/index.ts:18`, `Supabase/functions/create-store-payment/index.ts:18`, `Supabase/functions/store-checkout-status/index.ts:18`, `Supabase/functions/submit-store-checkout/index.ts:28` |
| `customer_quote_action` | `assets/js/services/customer-documents.js:61`, `assets/js/services/customer-records.js:68` |
| `customer_request_build_quote` | `assets/js/services/builder-account.js:268` |
| `customer_save_address_v1` | `assets/js/services/account-data.js:40` |
| `get_store_secret` | `Supabase/functions/bobgo-book-shipment/index.ts:11`, `Supabase/functions/bobgo-checkout-rates/index.ts:26` |
| `is_volttech_admin` | `Supabase/functions/bobgo-book-shipment/index.ts:11`, `admin-builds.js:11`, `admin-customer.js:1`, `admin-customers.js:1`, `admin-deletions.js:7`, `admin-launch-controls.js:155`, `admin-records.js:16`, `admin-workflow.js:24`, `admin.js:128`, `assets/js/services/account-session.js:104`, `assets/js/services/builder-access.js:71`, `assets/js/services/catalogue.js:42`, `commerce/js/admin-catalogue-qa.js:372`, `commerce/js/admin-store.js:6`, `notifications.js:283` |
| `my_creator_profile` | `assets/js/pages/account.js:159` |
| `record_creator_discovery_result` | `Supabase/functions/discover-sa-streamers/index.ts:84`, `Supabase/functions/discover-sa-streamers/index.ts:88` |
| `record_streamer_refresh_result` | `Supabase/functions/refresh-sa-streamers/index.ts:168`, `Supabase/functions/refresh-sa-streamers/index.ts:181` |
| `snapshot_invoice` | `admin-workflow.js:180`, `admin.js:116` |
| `snapshot_quote` | `admin-workflow.js:160`, `admin.js:103`, `assets/js/services/customer-documents.js:63`, `assets/js/services/customer-records.js:70` |
| `vt_claim_email_outbox` | `Supabase/functions/process-email-outbox/index.ts:146` |
| `vt_email_customer_name` | `Supabase/functions/process-email-outbox/index.ts:155` |
| `vt_email_invoice_context` | `Supabase/functions/process-email-outbox/index.ts:182`, `Supabase/functions/process-email-outbox/index.ts:192` |
| `vt_email_quote_context` | `Supabase/functions/process-email-outbox/index.ts:172` |
| `vt_get_mailer_cron_token` | `Supabase/functions/process-email-outbox/index.ts:131`, `Supabase/functions/process-static-mailer/index.ts:140` |
| `vt_get_resend_api_key` | `Supabase/functions/process-email-outbox/index.ts:143`, `Supabase/functions/process-static-mailer/index.ts:182`, `Supabase/functions/static-confirm/index.ts:65`, `Supabase/functions/static-subscribe/index.ts:126` |
| `vt_get_static_signing_secret` | `Supabase/functions/process-static-mailer/index.ts:183`, `Supabase/functions/static-unsubscribe/index.ts:49` |
| `vt_mark_email_failed` | `Supabase/functions/process-email-outbox/index.ts:231` |
| `vt_mark_email_sent` | `Supabase/functions/process-email-outbox/index.ts:227` |

## edge_function

| Name | Source references |
|---|---|
| `bobgo-book-shipment` | `commerce/js/admin-store.js:19` |
| `bobgo-checkout-rates` | `commerce/js/store-core.js:33` |
| `create-store-payment` | `commerce/js/store-core.js:35` |
| `finalize-account-deletion` | `admin-deletions.js:23` |
| `send-document-email` | `admin-workflow.js:11`, `admin.js:65`, `assets/js/services/privacy-data.js:35` |
| `store-checkout-status` | `commerce/js/store-core.js:34` |
| `submit-store-checkout` | `commerce/js/store-core.js:32` |

## function_endpoint

| Name | Source references |
|---|---|
| `creator-register` | `assets/js/services/creator-registration.js:5` |
| `discover-sa-streamers` | `Supabase/migrations/20260927132100_schedule_creator_discovery_v1.sql:9` |
| `process-email-outbox` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:317` |
| `process-static-mailer` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:332` |
| `refresh-sa-streamers` | `Supabase/migrations/20260918100639_schedule_streamer_refresh_v1.sql:25` |
| `resolve-product-image` | `Supabase/functions/resolve-product-image/index.ts:213`, `Supabase/migrations/20261003083200_sync_verified_product_media.sql:4`, `index.html:105`, `index.html:106`, `index.html:107`, `index.html:108`, `index.html:110`, `index.html:111`, `index.html:112`, `src/pages/home.html:21`, `src/pages/home.html:22`, `src/pages/home.html:23`, `src/pages/home.html:24`, `src/pages/home.html:26`, `src/pages/home.html:27`, `src/pages/home.html:28` |

## sql_table

| Name | Source references |
|---|---|
| `private.creator_discovery_config` | `Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql:59` |
| `private.streamer_refresh_config` | `Supabase/migrations/20260918080333_streamer_refresh_private_config_v1.sql:4` |
| `public.creator_discovery_hits` | `Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql:23` |
| `public.creator_registrations` | `Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql:1` |
| `public.email_outbox` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:4` |
| `public.static_newsletter_deliveries` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:264` |
| `public.static_newsletter_runs` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:248` |
| `public.static_subscribers` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:37` |
| `public.streamer_status` | `Supabase/migrations/20260918080157_streamer_directory_backend_v1.sql:15` |
| `public.streamers` | `Supabase/migrations/20260918080157_streamer_directory_backend_v1.sql:1` |

## sql_function

| Name | Source references |
|---|---|
| `private.invoke_creator_discovery` | `Supabase/migrations/20260927132100_schedule_creator_discovery_v1.sql:1` |
| `private.invoke_streamer_refresh` | `Supabase/migrations/20260918100639_schedule_streamer_refresh_v1.sql:4` |
| `public.admin_create_quote` | `Supabase/migrations/20260923164957_builder_handoff_hardening_v1.sql:143` |
| `public.admin_queue_document_email` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:133`, `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:60` |
| `public.admin_quote_saved_build` | `Supabase/migrations/20260923164957_builder_handoff_hardening_v1.sql:218` |
| `public.admin_store_launch_readiness` | `Supabase/migrations/20261002071400_quote_first_store_launch_readiness.sql:1`, `Supabase/migrations/20261002170800_enable_quote_first_builder_with_full_catalogue.sql:80` |
| `public.customer_request_build_quote` | `Supabase/migrations/20260923164957_builder_handoff_hardening_v1.sql:108` |
| `public.customer_save_address_v1` | `Supabase/migrations/20260923210205_customer_address_atomic_v1.sql:1` |
| `public.enforce_store_launch_readiness` | `Supabase/migrations/20261002071500_quote_first_store_launch_guard.sql:1`, `Supabase/migrations/20261002170800_enable_quote_first_builder_with_full_catalogue.sql:1` |
| `public.get_streamer_refresh_secret` | `Supabase/migrations/20260918080333_streamer_refresh_private_config_v1.sql:21` |
| `public.guard_account_deletion_request_update` | `Supabase/migrations/20260923215631_customer_privacy_notifications_hardening_v1.sql:1` |
| `public.my_creator_profile` | `Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql:38` |
| `public.record_creator_discovery_result` | `Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql:69` |
| `public.record_streamer_refresh_result` | `Supabase/migrations/20260918080400_streamer_refresh_telemetry_v1.sql:1` |
| `public.vt_claim_email_outbox` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:133` |
| `public.vt_customer_email` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:65` |
| `public.vt_email_customer_name` | `Supabase/migrations/20261004094500_email_context_helpers_v1.sql:4` |
| `public.vt_email_invoice_context` | `Supabase/migrations/20261004094500_email_context_helpers_v1.sql:40` |
| `public.vt_email_quote_context` | `Supabase/migrations/20261004094500_email_context_helpers_v1.sql:19` |
| `public.vt_get_mailer_cron_token` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:227` |
| `public.vt_get_resend_api_key` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:121` |
| `public.vt_get_static_signing_secret` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:236` |
| `public.vt_guard_notification_customer_update` | `Supabase/migrations/20260923215631_customer_privacy_notifications_hardening_v1.sql:45` |
| `public.vt_guard_saved_build_write` | `Supabase/migrations/20260923164957_builder_handoff_hardening_v1.sql:1` |
| `public.vt_mark_email_failed` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:184` |
| `public.vt_mark_email_sent` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:159` |
| `public.vt_queue_notification_email` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:80`, `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:5` |

## sql_policy

| Name | Source references |
|---|---|
| `"Admins can read STATIC newsletter deliveries"` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:301` |
| `"Admins can read STATIC newsletter runs"` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:297` |
| `"Admins can read STATIC subscribers"` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:61` |
| `"Admins can read email outbox"` | `Supabase/migrations/20261003161000_email_foundation_and_static_subscribers_v1.sql:33` |
| `"Creator can read own linked registration"` | `Supabase/migrations/20260927132000_creator_self_registration_and_discovery_v1.sql:17` |
| `"Public can read enabled streamer status"` | `Supabase/migrations/20260918080157_streamer_directory_backend_v1.sql:41` |
| `"Public can read enabled streamers"` | `Supabase/migrations/20260918080157_streamer_directory_backend_v1.sql:36` |
| `"Service role manages STATIC newsletter deliveries"` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:293` |
| `"Service role manages STATIC newsletter runs"` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:289` |
| `"Service role manages STATIC subscribers"` | `Supabase/migrations/20261004093000_email_transport_static_mailer_sync.sql:285` |
| `saved_builds_insert` | `Supabase/migrations/20260923164957_builder_handoff_hardening_v1.sql:96` |

## storage_key

| Name | Source references |
|---|---|
| `vt_creator_sa_confirmed` | `assets/js/services/creator-registration.js:56`, `assets/js/services/creator-registration.js:83`, `assets/js/services/creator-registration.js:97` |
| `vt_journey_context` | `assets/js/services/service-contact.js:32`, `conversion-context.js:65` |
| `vt_twitch_oauth_state` | `assets/js/services/creator-registration.js:55`, `assets/js/services/creator-registration.js:82`, `assets/js/services/creator-registration.js:96` |

## environment_name

| Name | Source references |
|---|---|
| `SUPABASE_ANON_KEY` | `Supabase/functions/bobgo-book-shipment/index.ts:11`, `Supabase/functions/send-document-email/index.ts:8`, `Supabase/functions/submit-store-checkout/index.ts:44` |
| `SUPABASE_SERVICE_ROLE_KEY` | `Supabase/functions/bobgo-book-shipment/index.ts:11`, `Supabase/functions/bobgo-checkout-rates/index.ts:26`, `Supabase/functions/create-store-payment/index.ts:24`, `Supabase/functions/creator-register/index.ts:13`, `Supabase/functions/process-email-outbox/index.ts:122`, `Supabase/functions/process-static-mailer/index.ts:136`, `Supabase/functions/resolve-product-image/index.ts:4`, `Supabase/functions/static-confirm/index.ts:39`, `Supabase/functions/static-subscribe/index.ts:87`, `Supabase/functions/static-unsubscribe/index.ts:45`, `Supabase/functions/store-checkout-status/index.ts:24`, `Supabase/functions/submit-store-checkout/index.ts:45` |
| `SUPABASE_URL` | `Supabase/functions/bobgo-book-shipment/index.ts:11`, `Supabase/functions/bobgo-checkout-rates/index.ts:26`, `Supabase/functions/create-store-payment/index.ts:24`, `Supabase/functions/creator-register/index.ts:12`, `Supabase/functions/process-email-outbox/index.ts:121`, `Supabase/functions/process-static-mailer/index.ts:135`, `Supabase/functions/resolve-product-image/index.ts:3`, `Supabase/functions/send-document-email/index.ts:7`, `Supabase/functions/static-confirm/index.ts:38`, `Supabase/functions/static-subscribe/index.ts:86`, `Supabase/functions/static-unsubscribe/index.ts:44`, `Supabase/functions/store-checkout-status/index.ts:24`, `Supabase/functions/submit-store-checkout/index.ts:43` |
| `TWITCH_CLIENT_ID` | `Supabase/functions/creator-register/index.ts:11`, `Supabase/functions/discover-sa-streamers/index.ts:49`, `Supabase/functions/refresh-sa-streamers/index.ts:55` |
| `TWITCH_CLIENT_SECRET` | `Supabase/functions/discover-sa-streamers/index.ts:49`, `Supabase/functions/refresh-sa-streamers/index.ts:56` |
| `YOCO_LIVE_SECRET_KEY` | `Supabase/functions/create-store-payment/index.ts:24` |
| `YOCO_TEST_SECRET_KEY` | `Supabase/functions/create-store-payment/index.ts:24` |

