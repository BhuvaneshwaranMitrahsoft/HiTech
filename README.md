# HiTech — Mobile Phones, Accessories & Expert Repair Services

> Modern, high-performance, **pure static** Angular 19 E-Commerce & Service Booking Web Application featuring multi-role authentication (Customer, Shop Owner Partner, Super Admin), two-factor 1-minute email OTP verification, wholesale bulk discounting, and automated GitHub Actions CI/CD deployment to **Render**.

---

## 🚀 Live Repository & Deployment

- **GitHub Repository**: [https://github.com/BhuvaneshwaranMitrahsoft/HiTech.git](https://github.com/BhuvaneshwaranMitrahsoft/HiTech.git)
- **Render Project Dashboard**: [https://dashboard.render.com/project/prj-dahretifngtc73donpkg](https://dashboard.render.com/project/prj-dahretifngtc73donpkg)

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Framework** | Angular 19 (Standalone Components, Signals Reactive State, Vite Application Builder) |
| **Styling** | Custom Vanilla SCSS Design System (Obsidian Dark Cyber Theme, Glassmorphism, Responsive) |
| **Typography** | Google Fonts: `Outfit` (Headings & Badges), `Inter` (UI & Body) |
| **Email & OTP Delivery** | EmailJS (`@emailjs/browser`) with built-in development simulation fallback |
| **Data Persistence** | Pure Static JSON Catalogs (`public/data/`) + Browser `localStorage` Overlays |
| **CI / CD Pipeline** | GitHub Actions (`deploy-dev.yml` & `deploy-prod.yml`) targeting Render environments |

---

## 📱 User Flows & Role Specifications

### 1. Customer User Flow
1. **Landing on Dashboard**:
   - Hero banner with quick action triggers ("Purchase Products", "Book a Service", "Register Shop").
   - Live trust stats (15,000+ repairs, 100% OEM spares, 60-min express fix, 10+ wholesale hubs).
   - Category switcher & featured smartphones and accessories.
2. **Product Catalog & Favourites**:
   - Filter by brand, category (Smartphones vs Accessories), and subcategories (Cases, GaN Chargers, Earbuds, Screen Protectors).
   - Bookmark any product to the **Favourites Wishlist** with a single click.
3. **Cart & Mandatory Checkout**:
   - Quantity controls with subtotal, tax, and free delivery thresholds (> ₹1,000).
   - Mandatory personal details collection: **Full Name**, **10-Digit Mobile Number**, and **Complete Delivery Address**.
4. **Order Confirmation & Email Notification**:
   - Submitting an order triggers an automated email notification formatted and dispatched to the shop owner at **`bhuvaneshwaranaj@gmail.com`**.
   - Displays the Order Success confirmation: *"Your Order Has Been Placed! Our team will contact you shortly."*

### 2. Shop Owner Partner Flow (B2B Wholesale)
1. **Registration**:
   - From dashboard, click **"Register Shop"**.
   - Fill out the partner onboarding form:
     - **Mandatory**: Shop Name, Proprietor / Owner Name, Location / Address, Shop Storefront Photo (file upload with instant preview or choose from sample retail store presets).
     - **Optional**: GST Number, Phone, Business Email, Additional Notes.
   - On submission, an active shop record is provisioned with default login credentials (`Owner@HiTech123`) and a **15% Wholesale Discount Tier**.
2. **Partner Portal & Bulk Order**:
   - Log in using credentials -> receive 1-minute OTP -> access **Shop Owner Workspace**.
   - The entire catalog automatically reflects partner pricing with **15% wholesale discount** deducted from all orders.

### 3. Super Admin Flow
1. **Secure Admin Authentication**:
   - Click **"Admin / Owner"** in the top navigation.
   - Credentials:
     - **Email**: `bhuvaneshwaranaj@gmail.com`
     - **Password**: `Bhuvi@02#1` (Protected by SHA-256 static cryptographic validation).
   - Generates and dispatches a **6-digit OTP** with a strict **1-minute (60 seconds) live countdown timer**.
2. **Admin Management Console**:
   - **Products & Stock Control**: 1-click toggle switch to mark any smartphone or accessory **In Stock** or **Out of Stock** with instant persistence.
   - **Unified Category-Wise Pricing Hub**: Audit and edit prices across Smartphones, Accessories, and Repair Services in a single page.
   - **Shop Owner Directory**: Manage the 10 static accounts + newly registered partners, toggle active/suspended status, edit credentials, and 1-click "Share Access" to copy credentials.
   - **Orders & Service Requests Desk**: Track customer retail and wholesale bulk orders, inspect delivery addresses, and change fulfillment status.
   - **Data Sync & Static JSON Export**: Download updated `products.json`, `accessories.json`, `services.json`, or `shop-owners.json` to commit to Git for permanent global deployments.

---

## 🔐 Credentials Cheat Sheet (Demo & Testing)

| Role | Email | Password | OTP Flow |
|---|---|---|---|
| **Super Admin** | `bhuvaneshwaranaj@gmail.com` | `Bhuvi@02#1` | 6-Digit OTP (1-minute countdown) |
| **Shop Owner 1** | `owner1@hitech.com` | `Owner@HiTech123` | 6-Digit OTP (1-minute countdown) |
| **Shop Owner 2** | `owner2@hitech.com` | `Owner@HiTech123` | 6-Digit OTP (1-minute countdown) |
| *(Owners 3 to 10)* | `owner3@hitech.com` ... `owner10@hitech.com` | `Owner@HiTech123` | 6-Digit OTP (1-minute countdown) |

> 💡 **Developer Mode Helper**: If EmailJS keys have not yet been provided, the application runs in testing mode and automatically displays the generated 6-digit code in a high-visibility badge with a **"Click to Auto-Fill"** button so review is never blocked.

---

## 📦 How Data Works on a Pure Static Site

```
┌─────────────────────────────────────────────────────────────┐
│                    HiTech Static Architecture               │
├──────────────────────────────┬──────────────────────────────┤
│ 1. Bundled JSON Catalogs     │ Ships in public/data/        │
│ 2. localStorage Overlays     │ Admin edits apply instantly  │
│ 3. Git-Backed Persistence    │ Admin exports updated JSON & │
│                              │ commits to Git repo!         │
└──────────────────────────────┴──────────────────────────────┘
```

1. The site loads initial datasets from `public/data/` (`products.json`, `accessories.json`, `services.json`, `shop-owners.json`).
2. When the Admin toggles stock availability, edits prices, or approves shop partners, changes are saved to `localStorage`.
3. In the **Admin Console -> Data Sync**, the admin can click **"Download Updated JSON"** and commit the files back to GitHub. Once pushed, Render automatically redeploys with the updated baseline data.

---

## 🚀 GitHub Actions CI/CD Pipeline to Render

This project contains two automated GitHub Actions workflows under `.github/workflows/`:

1. **`deploy-dev.yml`**: Triggers on push to `develop` branch.
2. **`deploy-prod.yml`**: Triggers on push to `main` branch.

### Configuring Secrets in GitHub
In your GitHub repository ([Settings > Secrets and variables > Actions](https://github.com/BhuvaneshwaranMitrahsoft/HiTech/settings/secrets/actions)), add the following repository secrets:

| Secret Name | Description | Where to Find |
|---|---|---|
| `RENDER_API_KEY` | Render Account API Token | Render Dashboard -> Account Settings -> API Keys |
| `RENDER_DEV_SERVICE_ID` | Service ID for Development Static Site | Render Dashboard -> Dev Environment -> Service Settings |
| `RENDER_PROD_SERVICE_ID` | Service ID for Production Static Site | Render Dashboard -> Production Environment -> Service Settings |
| `RENDER_DEV_DEPLOY_HOOK` | (Optional) Deploy Hook URL for Dev | Render Service -> Settings -> Deploy Hook |
| `RENDER_PROD_DEPLOY_HOOK` | (Optional) Deploy Hook URL for Prod | Render Service -> Settings -> Deploy Hook |

---

## 🌐 Deploying Manually on Render (Static Site)

1. Go to [Render Dashboard](https://dashboard.render.com/project/prj-dahretifngtc73donpkg).
2. Click **New +** -> **Static Site**.
3. Connect GitHub repository `BhuvaneshwaranMitrahsoft/HiTech`.
4. Configure settings:
   - **Branch**: `main` (for Production) or `develop` (for Dev)
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist/hi-tech`
5. **SPA Routing Rule (Important)**:
   - Go to **Redirects/Rewrites** in the Render service settings.
   - Add rule:
     - **Source**: `/*`
     - **Destination**: `/index.html`
     - **Action**: `Rewrite`

---

## 💻 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/BhuvaneshwaranMitrahsoft/HiTech.git
cd HiTech

# 2. Install dependencies
npm install

# 3. Start local development server
npm start
# App will run at http://localhost:4200/

# 4. Production build check
npm run build
```

---

## 📄 License & Attribution
Designed and built for **HiTech Mobiles & Spares** by pair programming with Antigravity AI.
