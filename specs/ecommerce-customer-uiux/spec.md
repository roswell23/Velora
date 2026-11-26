# Spec: E-Commerce Customer Storefront UI/UX Improvements

Owner: Shared Status: Approved Version: 1.5

## 1. Purpose

Improve the usability, accessibility, and responsive behavior of the existing VÉLORA customer storefront while preserving its luxury fragrance visual identity and current product, search, filter, sort, bag, and authentication behavior.

## 2. Roles and permissions

- **Public / Unauthenticated:** Browse the storefront and use its search, filters, sort controls, and local shopping bag; access customer login and registration.
- **`CUSTOMER`:** Use the same storefront and see account controls for the active customer session.
- This work changes no backend authorization or API contract.

## 3. Requirements

| ID | Requirement | Priority |
| --- | --- | --- |
| ECA-11 | Storefront navigation, account actions, and search remain usable without clipping or overlap at mobile, tablet, and desktop widths. | Must |
| ECA-12 | Interactive links, buttons, inputs, selects, and filter controls show a visible keyboard focus indicator and have an accessible name. | Must |
| ECA-13 | Search, family filters, and sort controls remain understandable and usable on narrow screens; the result count and no-results state reflect the active search and filter state. | Must |
| ECA-14 | The shopping bag overlay exposes dialog semantics, supports Escape to close, and keeps quantity controls understandable and bounded by available stock. | Must |
| ECA-15 | Login and registration maintain clear labels, inline validation, submission progress, and success/error announcements at mobile and desktop widths. | Must |
| ECA-16 | Motion respects the user's reduced-motion preference, and primary interactive controls have comfortable touch targets on small screens. | Should |
| ECA-17 | The storefront hero uses an airy product-led composition with customer-facing copy, a prominent featured fragrance, product details, and a primary action. | Must |
| ECA-18 | A compact featured-fragrance rail lets shoppers change the hero selection; it adapts to a horizontal strip on smaller screens. | Should |
| ECA-19 | The fragrance collection presents product cards in a responsive horizontal carousel with touch/trackpad scrolling, snap points, and labeled previous/next controls. | Must |
| ECA-20 | The collection carousel advances automatically, loops to its first card, offers a pause/play control, and pauses during user interaction or when reduced motion is preferred. | Must |
| ECA-21 | Product image panels and bottle artwork scale proportionally to the carousel card and viewport, with bounded heights that do not dominate the collection. | Must |
| ECA-22 | The storefront navbar presents the VÉLORA wordmark at left, centered navigation, and compact search/account/bag actions at right, adapting without collisions on smaller screens. | Must |

## 4. Data used

| Data | Read | Written | Notes |
| --- | --- | --- | --- |
| Existing in-memory fragrance list | Product display name, family, size, price, stock, tone and label | None | No catalog source or product behavior change. |
| Existing bag in `localStorage` | Items and quantities | Items and quantities | Keep current storage key and behavior. |
| Existing customer session | User identity and auth loading state | None | Keep existing auth provider and API behavior. |
| Search, family, and sort UI state | Current input/selection | Current input/selection | Remains transient component state. |

## 5. API endpoints

No API changes. Customer auth continues using the existing `POST /api/auth/login`, `POST /api/auth/register`, and `GET /api/auth/me` contract. This UI/UX work does not add password reset or checkout behavior.

## 6. UI pages and behavior

- **Storefront (`/`):** Keep the current VÉLORA hero, collection cards, search, family filters, sort, account controls, and shopping bag. Improve responsive layout, focus visibility, control labels, and result feedback.
- **Visual direction:** Use the supplied beverage storefront screenshot only as a layout reference: generous light space, compact centered navigation, strong left-side product copy, a central hero product, a small side rail of alternate products, and compact product callouts. Translate these elements into VÉLORA's restrained perfume palette, serif typography, and existing bottle illustrations. Do not copy the reference brand, product copy, drink imagery, or bright accent colors.
- **Featured fragrance rail:** Selecting a fragrance updates the hero name, family, price, stock note, bottle tone, and add-to-bag action. On narrow screens, present choices in a horizontally scrollable row.
- **Collection carousel:** Retain existing family filters, search, sorting, product-card content, save controls, and bag actions. Cards scroll horizontally with snap alignment; previous/next buttons scroll the row and disable at the applicable end. Filtering or sorting returns the row to its first card. On phones, show a prominent card with a preview of the next card and support touch scrolling.
- **Automatic carousel:** Advance one product card every 4.5 seconds and loop to the first card after reaching the end. Pause while the pointer is over the carousel, while keyboard focus is inside it, during pointer/touch interaction, while the document is hidden, or when the user pauses it. Provide a pause/play control. Do not autoplay when `prefers-reduced-motion: reduce` is active.
- **Responsive product artwork:** Keep product bottle illustrations centered and contained. Use shorter image panels on desktop and tablet, and viewport-aware sizing on phones so image art does not overpower product names, prices, and stock details.
- **Storefront navbar:** Align the wordmark at the left, center the three storefront navigation links independently of the right-side controls, and group search, account actions, and bag consistently at the right. Keep the existing announcement strip and mobile menu behavior; prevent clipping and overlap at tablet and phone widths.
- **Shopping bag overlay:** Identify the panel as a modal dialog, close on Escape and backdrop action, present item quantity controls with accessible names and disabled states, and show the existing empty state when no items remain.
- **Customer login (`/login`) and registration (`/register`):** Preserve the existing pages and API behavior; ensure form and status feedback remain accessible and responsive.
- **Motion and touch:** Avoid nonessential movement for reduced-motion users; make small-screen controls easy to tap.

## 7. Business rules and validations

- Product filtering and sorting retain current behavior and current in-memory data source.
- Bag quantities remain at least one while present and cannot exceed the stored item's available stock.
- Authentication validation and backend error handling continue following the existing auth implementation.
- No wishlist, payment, checkout, product detail, or backend behavior is added by this spec.
- The hero add-to-bag action adds one unit of the selected in-stock fragrance and opens the existing bag drawer; it remains disabled when stock is zero.

## 8. Acceptance criteria

- At 320px and wider viewports, header actions, search, navigation, and filters have no horizontal overflow or overlapping controls.
- Keyboard users can see which interactive element is focused throughout the storefront, bag, login, and registration pages.
- Search/filter result count updates with visible products; the empty state gives a clear way to reset search and family filters.
- Opening the bag gives the panel dialog semantics; Escape closes it; quantity buttons announce the product and action, and the increment control is disabled at stock limit.
- Login and registration retain their existing validation and request flow and display submission and request status accessibly.
- Reduced-motion preference suppresses nonessential transitions and smooth scrolling.
- The hero follows the approved reference direction while remaining recognizably VÉLORA; selecting an alternate fragrance synchronizes the hero content and add-to-bag action.
- The collection is operable with touch, trackpad, and keyboard-focused previous/next buttons; changing filters or sorting starts the carousel from its first result.
- Automatic movement pauses for user interaction and page visibility changes, loops smoothly, and stays off when reduced motion is requested or the shopper pauses it.
- Product images remain fully visible and balanced with their product details on narrow, medium, and wide viewports.
- At desktop width, the wordmark, navigation, and action group align as three distinct regions; at mobile width, the menu and actions remain visible and usable without horizontal overflow.
- Existing visual identity and feature behavior are preserved.

## 9. Test cases

- `TC-ECA-11`: Resize storefront to narrow, medium, and wide viewports; navigation and controls remain readable and operable without overflow.
- `TC-ECA-12`: Navigate with keyboard; focus is visible on links, buttons, inputs, and selects.
- `TC-ECA-13`: Search and filter the collection; result count and empty/reset state stay in sync.
- `TC-ECA-14`: Open bag, close with Escape, and verify quantity controls expose useful labels and stock bounds.
- `TC-ECA-15`: Check login and registration validation and feedback using keyboard and screen-reader semantics.
- `TC-ECA-16`: Enable reduced motion; nonessential transitions and smooth scrolling are disabled.
- `TC-ECA-17`: Inspect the storefront hero; it presents one featured VÉLORA fragrance, its details, and a clear action in the reference-led composition.
- `TC-ECA-18`: Select each hero fragrance option; displayed details and added bag item match the selected fragrance on desktop and mobile layouts.
- `TC-ECA-19`: Scroll the collection carousel by touch and with previous/next buttons; verify controls disable at either end and filtering resets to the first result.
- `TC-ECA-20`: Verify automatic advance and wraparound, pause/play behavior, interaction pauses, hidden-tab pauses, and reduced-motion behavior.
- `TC-ECA-21`: Resize the collection across phone, tablet, and desktop widths; verify product panels remain bounded and bottle art stays centered without crowding product information.
- `TC-ECA-22`: Verify navbar alignment at desktop, tablet, and mobile widths, including guest and signed-in account actions.

## 10. Dependencies on other modules

- Uses existing customer storefront UI in `client/customer`.
- Uses existing customer authentication behavior without changing backend auth or session contracts.
