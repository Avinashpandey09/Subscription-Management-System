# Subscription Management Portal

A modern, AI-powered Subscription Management Portal designed to simplify the management of customers, subscriptions, payments, invoices, renewals, and customer communication through a centralized platform.

## Overview

Managing subscriptions manually can lead to missed renewal dates, payment tracking issues, scattered customer information, and inefficient communication.

The Subscription Management Portal provides a centralized solution where subscription-related activities can be managed from a single interface.

The application is built with a modular React and TypeScript architecture and includes AI-powered functionality using the Google Gemini API.

## Key Features

### Dashboard
- Centralized overview of subscription-related activities
- Customer and subscription statistics
- Payment and renewal information
- Quick access to important management sections

### Customer Management
- View customer information
- Manage customer records
- Access subscription-related customer details
- Search and organize customer information

### Subscription Management
- Manage customer subscriptions
- Track subscription plans and billing information
- Monitor subscription status
- Track start and renewal dates
- Manage the subscription lifecycle

### Plan Management
- Manage subscription plans
- Maintain plan information and pricing
- Organize available subscription options

### Payment Management
- Track payment information
- Monitor payment status
- Maintain transaction-related information
- Identify successful, pending, or failed payments

### Invoice Management
- Manage subscription invoices
- Track invoice details and payment status
- Maintain billing information

### Renewal Management
- Monitor upcoming subscription renewals
- Identify subscriptions approaching renewal
- Track expired subscriptions
- Support renewal-related actions

### AI-Powered Email Generation
The application uses Google Gemini AI to assist with professional subscription-related email generation.

Email use cases can include:

- Subscription confirmation
- Renewal reminders
- Payment confirmation
- Payment failure notification
- Subscription expiry notification
- Invoice notification
- Customer follow-up

The generated emails are designed to be professional, concise, personalized, and suitable for business communication.

## Technology Stack

- React
- TypeScript
- Vite
- CSS
- Google Gemini API
- Node.js
- npm

## Project Structure

```text
smart-subscription-system/
│
├── src/
│   ├── components/     # Reusable UI components
│   ├── context/        # Shared application state and context
│   ├── data/           # Application data
│   ├── utils/          # Utility and helper functions
│   ├── App.tsx         # Main application component
│   ├── main.tsx        # Application entry point
│   ├── index.css       # Global styling
│   └── types.ts        # TypeScript type definitions
│
├── .env.example        # Environment variable template
├── index.html          # HTML entry point
├── package.json        # Dependencies and scripts
├── package-lock.json   # Dependency lock file
├── tsconfig.json       # TypeScript configuration
├── vite.config.ts      # Vite configuration
└── README.md           # Project documentation
```

## Prerequisites

Before running the project, make sure the following are installed:

- Node.js
- npm
- A modern web browser

## Installation

### 1. Clone or download the project

Download the project and open the project folder in VS Code.

### 2. Install dependencies

Run:

```bash
npm install
```

If a peer-dependency conflict occurs, use:

```bash
npm install --legacy-peer-deps
```

### 3. Configure the Gemini API

Create a `.env.local` file in the root directory of the project.

Add your Gemini API key:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Replace `YOUR_GEMINI_API_KEY` with your own API key.

### 4. Start the development server

Run:

```bash
npm run dev
```

The terminal will provide a local URL similar to:

```text
http://localhost:3000/
```

or

```text
http://localhost:5173/
```

Open the provided URL in your browser to access the application.

## Environment Variables

The application uses environment variables for sensitive configuration.

Example:

```env
GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

Do not publish or commit your real API key to GitHub.

Use `.env.example` as a template for required environment variables.

## How the Application Works

The overall workflow is:

```text
Customer
   ↓
Subscription
   ↓
Plan & Billing
   ↓
Payment
   ↓
Invoice
   ↓
Renewal Tracking
   ↓
Customer Communication
```

The portal brings these activities together so that subscription information can be managed from one centralized system.

## AI Email Workflow

The AI-powered email workflow can be represented as:

```text
Select Email Type
        ↓
Provide Customer / Subscription Information
        ↓
Generate Professional Email
        ↓
Preview Email
        ↓
Use / Send Email
```

The Gemini API is used to assist in generating professional and context-aware email content.

## Development

To run the project in development mode:

```bash
npm run dev
```

The development server supports fast updates while working on the application.

## Production Build

To create a production build:

```bash
npm run build
```

To preview the production build locally:

```bash
npm run preview
```

## Security

- Keep API keys in environment variables.
- Never expose secret API keys directly in source code.
- Do not upload `.env.local` to public repositories.
- Use `.gitignore` to prevent sensitive configuration files from being committed.

## Future Enhancements

Potential future improvements include:

- Secure user authentication and role-based access
- Cloud database integration
- Real payment gateway integration
- Automated email scheduling
- Automated renewal notifications
- PDF invoice generation and download
- Advanced analytics and reporting
- Subscription revenue forecasting
- Multi-organization support
- Production deployment

## Purpose

The goal of this project is to provide a centralized, efficient, and user-friendly solution for managing the complete subscription lifecycle while reducing manual work and improving customer communication.

## License

This project is intended for educational, demonstration, and hackathon purposes.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
