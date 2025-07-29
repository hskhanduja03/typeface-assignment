# Personal Finance Assistant

A modern full-stack personal finance management tool that allows users to track, edit, and visualize their expenses effortlessly. This app supports image/PDF receipt parsing, editable transaction lists, insightful charts, and multi-user functionality.

##  Demo

Link : [https://youtube.com/]

---

## Features

- Upload receipts (JPG, PNG, PDF) and auto-extract transactions
- Edit and approve transactions before saving
- Monthly income vs. expense bar chart
- Category-wise spending pie chart
- Responsive and modern UI
- Multi-user support (session-based or auth-enabled)
- Pagination and filtering for transactions
- Smart file renaming and status display
- Dark/light theme adaptable charts

---

## Tech Stack

### Frontend
- **Next.js** (App Router)
- **TypeScript**
- **TailwindCSS** + **ShadCN UI**
- **Recharts** for data visualizations

### Backend
- **Next.js API Routes**
- **Prisma** ORM
- **PostgreSQL** database
- **Google Cloud Vision API** for OCR
- **pdf-parse** for text extraction
- **Gemini / LLM API** for structured transaction extraction


---

## Getting Started

### Prerequisites

- Node.js >= 18.x
- PostgreSQL
- Google Cloud credentials for Vision API
- Gemini (Google GenAI) API key (optional)

### 1. Clone the repository

```bash
git clone https://github.com/hskhanduja03/typeface-assignment.git
cd personal-finance-assistant
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

Create a `.env` file in the root:

```env
# PostgreSQL Database
DATABASE_URL="..."

# AWS S3 Configuration
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="..."
AWS_S3_BUCKET_NAME="..."

# Gemini API Key
GEMINI_API_KEY="..."
```

### 4. Setup database

```bash
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Run the development server

```bash
npm run dev
```

App will be available at `http://localhost:3000`.

---

## Future Improvements

- User authentication (NextAuth.js or Clerk)
- Budgeting goals and insights
- Export to CSV/PDF
- Notifications and recurring payments
- Mobile PWA version

