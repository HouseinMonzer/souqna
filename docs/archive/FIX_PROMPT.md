# SouqNa — Fix & Verify Everything Prompt

## Your Role
You are a Senior Full-Stack React Engineer. You have **full autonomous permissions** — never ask for confirmation, never ask "should I proceed?". Just do it. Fix everything. Verify everything works by actually running the dev server and checking the site.

---

## HOW TO WORK — MANDATORY PROCESS

For EVERY page and component you fix:
1. Read the file
2. Fix all broken things
3. Save the file
4. Then move to the next one

After fixing everything:
1. Run `cd client && npm run build` to check for TypeScript/build errors
2. Fix any build errors
3. Run the dev server: `cd client && npm run dev` (in background)
4. Use computer/browser to open `http://localhost:5173` and manually click through every page
5. Verify each item in the checklist below is working

---

## BROKEN THINGS TO FIX — ONE BY ONE

### 🔴 FIX 1: HeroSection buttons (client/src/components/home/HeroSection.tsx)

Both buttons have NO onClick. Fix them:

```tsx
// Add at top of file:
import { useNavigate } from 'react-router-dom'

// Inside HeroSection():
const navigate = useNavigate()

// "Browse Shop →" button:
onClick={() => navigate('/shop')}

// "Become a Vendor" button:
onClick={() => navigate('/register')}
```

### 🔴 FIX 2: CategoriesSection (client/src/components/home/CategoriesSection.tsx)

Category cards and "See all →" have no navigation. Fix:
- Import `useNavigate` from react-router-dom
- Each category card `onClick={() => navigate('/shop?category=' + encodeURIComponent(cat.name.toLowerCase()))}`
- "See all →" span: `onClick={() => navigate('/shop')}`
- Make "See all →" look clickable (proper cursor, color)
- The `categories` array is hardcoded — that's fine for now, keep it

### 🔴 FIX 3: Footer (client/src/components/home/Footer.tsx)

ALL links are `href="#"` — completely dead. Fix every single one:

Replace the static `footerLinks` array and wire real routes:

```tsx
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom'

// Replace all <a href="#"> with <Link to="..."> using proper paths:
const footerLinks = [
  {
    title: 'Marketplace',
    links: [
      { label: 'Shop', to: '/shop' },
      { label: 'Categories', to: '/shop' },
      { label: 'Deals', to: '/shop?sort=deals' },
      { label: 'New Arrivals', to: '/shop?sort=newest' },
    ]
  },
  {
    title: 'Vendors',
    links: [
      { label: 'Sell on SouqNa', to: '/register' },
      { label: 'Vendor Dashboard', to: '/dashboard' },
      { label: 'Browse Vendors', to: '/vendors' },
      { label: 'Support', to: '/contact' },
    ]
  },
  {
    title: 'Company',
    links: [
      { label: 'About', to: '/about' },
      { label: 'Contact', to: '/contact' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Terms of Service', to: '/terms' },
    ]
  },
]

// Render with <Link to={link.to}> instead of <a href="#">
// Bottom bar links also use <Link>
```

### 🔴 FIX 4: ProductsSection (client/src/components/home/ProductsSection.tsx)

Check this file. Fix:
- "View All Products" or any CTA button → `navigate('/shop')`
- Each product card `onClick` → `navigate('/product/' + product.slug)`
- "Add to Cart" button → wire to `useCartStore().addItem(...)`
- Any broken/missing imports

### 🔴 FIX 5: VendorsSection (client/src/components/home/VendorsSection.tsx)

Check this file. Fix:
- "View All Vendors" → `navigate('/vendors')`
- Each vendor card `onClick` → `navigate('/vendors/' + vendor.slug)`
- Any dead links or missing handlers

### 🔴 FIX 6: Navbar mobile search (client/src/components/Navbar.tsx)

The mobile search input has NO `onKeyDown` / `onChange` handler for actually searching. Fix:
- Wire the mobile search input to use the same `searchQuery` state and `handleSearch` function
- Mobile search should submit on Enter key press
- Also add the mobile menu links for: Login/Register when not logged in, Dashboard/Admin when logged in, Cart link

### 🔴 FIX 7: ShopPage (client/src/pages/ShopPage.tsx)

Read the full file. Fix everything broken:
- Category filter pills — clicking a category must filter products
- Sort dropdown must actually sort the displayed products
- Search param from URL (`?search=...`) must pre-fill the search and filter results
- Category param from URL (`?category=...`) must pre-select that category
- Each product card click → `navigate('/product/' + product.slug)`
- "Add to Cart" button on product cards → `useCartStore().addItem(product)`
- "Load more" / pagination if broken

### 🔴 FIX 8: ProductPage (client/src/pages/ProductPage.tsx)

Read the full file. Fix:
- "Add to Cart" button → must call `useCartStore().addItem(product, quantity, selectedVariant)`
- Quantity +/- buttons must work
- Variant selection (if exists) must update price
- "Go to Cart" button → `navigate('/cart')`
- "Back" link → `navigate(-1)` or `navigate('/shop')`
- Related products section — clicking them should navigate to that product

### 🔴 FIX 9: VendorProfilePage (client/src/pages/VendorProfilePage.tsx)

Read the full file. Fix:
- The `handleAddToCart` function has a `// TODO: ربط مع cartStore بعدين` comment — IMPLEMENT IT NOW
  - Must call `useCartStore().addItem(product)` properly
  - Product from VendorProfile must have vendor info — if not, add vendorId/vendorName/vendorSlug/vendorLogo to the product object before calling addItem
- "Add to Cart" button → wire it
- Category filter tabs → actually filter displayed products
- "Back to Vendors" link → `navigate('/vendors')`
- Social links section — render actual icons for Instagram/Facebook/WhatsApp/TikTok/YouTube if vendor has them
- Phone number → `<a href="tel:+...">` 
- WhatsApp → `<a href="https://wa.me/...">`
- Website → `<a href="..." target="_blank">`

### 🔴 FIX 10: DashboardPage (client/src/pages/DashboardPage.tsx)

Read the full file. Fix every broken button:
- "View my shop" link → `navigate('/vendors/' + vendor.slug)`
- Product management — "Add Product", "Edit", "Delete" buttons must work
- Image upload buttons must work (Cloudinary)
- Save/Update profile form must POST to backend
- Tabs (if any) must switch correctly
- If vendor has no active subscription → redirect to `/subscribe`

### 🔴 FIX 11: CheckoutPage (client/src/pages/CheckoutPage.tsx)

Read the full file. Fix:
- Form validation — all required fields must show error if empty
- Payment method selection must visually highlight selected option
- "Wish Money" & "OMT": show a file upload input for proof screenshot
- "Credit Card": show the card form inputs
- Submit button → POST to `/api/orders`, handle success + error
- On success → show order number and "Continue Shopping" button that goes to `/shop`
- "Back to Cart" link → `navigate('/cart')`

### 🔴 FIX 12: SubscriptionPage (client/src/pages/SubscriptionPage.tsx)

Read the full file. Fix:
- Plan selection (monthly/annual) — visually highlight selected
- Payment method selection — highlight selected
- "Wish Money" / "OMT" → show upload for proof + instruction text with real account info
- "Credit Card" → show card form
- "Cash Delivery" → show address form
- Submit → POST to `/api/subscriptions`
- On success → navigate to `/dashboard`
- Back button → `navigate('/dashboard')`

### 🔴 FIX 13: Create Missing Pages

These pages are linked in the footer but DON'T EXIST. Create them in `client/src/pages/`:

**AboutPage.tsx** (`/about`):
- Professional "About SouqNa" page
- Mission statement about connecting Lebanese vendors with buyers
- Team section (placeholder cards)
- Values section
- CTA to shop or become a vendor
- Use the project's color palette and inline style pattern

**ContactPage.tsx** (`/contact`):
- Contact form: name, email, subject, message
- WhatsApp link (placeholder number)
- Email address
- Office location (Lebanon)
- Form submits (can show success message, no need for real backend yet)

**PrivacyPage.tsx** (`/privacy`):
- Professional privacy policy page
- Sections: Data Collection, Usage, Storage, Rights, Contact
- Lebanese law reference

**TermsPage.tsx** (`/terms`):
- Terms of Service
- Sections: Acceptance, Services, Vendors, Buyers, Payments, Prohibited Content
- Professional legal formatting

### 🔴 FIX 14: Wire New Pages in App.tsx

Add all new routes in `client/src/App.tsx`:
```tsx
import AboutPage from './pages/AboutPage'
import ContactPage from './pages/ContactPage'
import PrivacyPage from './pages/PrivacyPage'
import TermsPage from './pages/TermsPage'

// Inside MainLayout routes:
<Route path="/about" element={<AboutPage />} />
<Route path="/contact" element={<ContactPage />} />
<Route path="/privacy" element={<PrivacyPage />} />
<Route path="/terms" element={<TermsPage />} />
<Route path="/subscribe" element={<SubscriptionPage />} />  {/* if not already there */}
```

### 🔴 FIX 15: CartStore addItem — Verify vendor info is attached

In `client/src/store/cartStore.ts`, the `addItem` function reads `product.vendor.id`, `product.vendor.store_name`, `product.vendor.slug`. 

Verify that when products are fetched in:
- `ProductsSection.tsx`  
- `ShopPage.tsx`
- `ProductPage.tsx`
- `VendorProfilePage.tsx`

...the product objects actually include a `vendor` object with `id`, `store_name`, `slug`, `logo_url`.

If the API returns products WITHOUT vendor info, you need to either:
a) Update the API endpoint to include vendor in product response (add `include: { vendor: true }` in Prisma query in `server/index.js`), OR
b) Pass vendorId/vendorSlug separately to addItem

FIX whichever approach is cleaner. Make sure "Add to Cart" NEVER silently fails.

---

## BACKEND FIXES (server/index.js)

Check these endpoints exist and work:

1. `GET /api/products` — must return products with vendor info: `{ ...product, vendor: { id, store_name, slug, logo_url } }`
2. `GET /api/products/:slug` — same, include vendor
3. `GET /api/vendors/:slug/products` — include vendor info in each product
4. `POST /api/orders` — create order from cart items (check it handles per-vendor items correctly)
5. `POST /api/subscriptions` — create subscription request
6. `GET /api/subscriptions/my` — vendor's own subscription status

If any of these are missing or return wrong shape → FIX THEM in `server/index.js`.

---

## VERIFICATION CHECKLIST — DO THIS AFTER ALL FIXES

Run the dev server and open a browser. Click through EVERY item:

### Homepage (/)
- [ ] "Browse Shop →" button navigates to /shop
- [ ] "Become a Vendor" button navigates to /register
- [ ] Category cards navigate to /shop?category=...
- [ ] "See all →" navigates to /shop
- [ ] Featured products section loads real data (or graceful empty state)
- [ ] Vendors section loads real data
- [ ] Footer: ALL links navigate correctly (no #)
- [ ] Footer bottom links (About, Contact, etc.) work

### Shop (/shop)
- [ ] Products load (or empty state if no products)
- [ ] Search bar works — filtering products
- [ ] Category filter works
- [ ] Sort works
- [ ] Clicking product → /product/slug
- [ ] "Add to Cart" works — cart count increments in navbar

### Product (/product/:slug)
- [ ] Product info loads
- [ ] Qty +/- works
- [ ] "Add to Cart" works — cart increments
- [ ] Back navigation works

### Cart (/cart)
- [ ] Items grouped by vendor
- [ ] Qty +/- works per item
- [ ] Remove item works
- [ ] "Checkout from [Vendor]" button navigates to /checkout/:vendorId
- [ ] Grand total shows correctly
- [ ] "Continue Shopping" goes to /shop

### Checkout (/checkout/:vendorId)
- [ ] Shows only items from that vendor
- [ ] Form fields work
- [ ] Payment method switches UI correctly
- [ ] Submit creates order (or shows auth error if not logged in)
- [ ] Success state shows

### Vendors (/vendors)
- [ ] List loads
- [ ] Clicking vendor → /vendors/slug

### Vendor Profile (/vendors/:slug)
- [ ] Cover photo shows (or gradient fallback)
- [ ] Logo, name, description show
- [ ] Social links show (if vendor has them)
- [ ] Products load
- [ ] "Add to Cart" works per product
- [ ] Category filter works

### Login (/login)
- [ ] Clerk SignIn form renders
- [ ] After login, redirects correctly by role

### Register (/register)
- [ ] Clerk SignUp form renders
- [ ] After register, goes to home or dashboard

### New Pages
- [ ] /about — renders properly
- [ ] /contact — renders properly
- [ ] /privacy — renders properly
- [ ] /terms — renders properly

### Admin (/admin)
- [ ] Only accessible to admin role
- [ ] All tabs load without crashing

---

## FINAL REPORT

After verification, create a file called `FIX_REPORT.md` in the project root with:
- List of every fix made
- List of every verified item (✅ or ❌)
- Any remaining issues and why they weren't fixed
- Overall quality score out of 10 for: Functionality, UI/UX, Code Quality, Mobile, Performance
