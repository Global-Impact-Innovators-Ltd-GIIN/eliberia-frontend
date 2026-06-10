# eLiberia Frontend

A modern, responsive frontend application for the eLiberia project built with **Next.js** and **TypeScript**.

## Tech Stack

- **Framework**: Next.js 14+
- **Language**: TypeScript
- **Styling**: PostCSS (with Tailwind CSS support)
- **Linting**: ESLint
- **Package Manager**: npm/yarn

## Project Structure

```
src/
├── components/    # Reusable React components
├── pages/        # Next.js pages/routes
├── hooks/        # Custom React hooks
├── utils/        # Utility functions
├── styles/       # Global styles
└── types/        # TypeScript type definitions

public/           # Static assets (images, fonts, etc.)
```

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Create .env.local file with required environment variables
cp .env.example .env.local
```

### Development

```bash
# Start development server
npm run dev
```

The application will be available at `http://localhost:3000`

### Build

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Linting

```bash
# Run ESLint
npm run lint

# Fix linting issues
npm run lint --fix
```

## Environment Variables

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_API_URL=http://localhost:5000
NEXT_PUBLIC_APP_NAME=eLiberia
```

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit your changes (`git commit -m 'Add amazing feature'`)
3. Push to the branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

## License

This project is part of Global Impact Innovators Ltd (GIIN)

## Support

For issues and questions, please open an issue in the repository.
