# CalendeFi Web Frontend

A beautiful, modern web interface for CalendeFi built with Next.js 14, TypeScript, and shadcn/ui components. The design is inspired by Cal.com with a clean, professional aesthetic.

> **Note**: This is the frontend web application. For the complete CalendeFi experience including the backend agent, see the main project README at the root of this repository.

## Features

- **Modern Design**: Cal.com inspired UI with gradient backgrounds and smooth animations
- **Responsive Layout**: Fully responsive design that works on all devices
- **Interactive Elements**: Click-to-copy service account email, hover effects, and smooth transitions
- **Calendar Mockup**: Interactive calendar UI showing how transactions work
- **Onboarding Flow**: Step-by-step instructions for getting started
- **Feature Showcase**: Comprehensive overview of CalendeFi capabilities
- **Future Roadmap**: Upcoming features and project timeline

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - High-quality, accessible UI components
- **Lucide React** - Beautiful, customizable icons
- **Radix UI** - Unstyled, accessible UI primitives

## Getting Started

### Prerequisites
- The CalendeFi Agent backend must be running (see main project README)
- Node.js 18+ and Yarn

### Quick Start

1. **Install dependencies**:
   ```bash
   cd web
   yarn install
   ```

2. **Run the development server**:
   ```bash
   yarn dev
   ```

3. **Open your browser**:
   Navigate to [http://localhost:3000](http://localhost:3000)

### Full Setup
For complete setup including the backend agent, see the [main project README](../README.md).

## Project Structure

```
web/
├── app/
│   ├── globals.css          # Global styles and Tailwind configuration
│   ├── layout.tsx           # Root layout component
│   └── page.tsx             # Main landing page
├── components/
│   └── ui/                  # shadcn/ui components
│       ├── button.tsx
│       ├── card.tsx
│       ├── input.tsx
│       └── toast.tsx
├── lib/
│   └── utils.ts             # Utility functions
├── package.json
├── tailwind.config.js       # Tailwind configuration
├── tsconfig.json
└── next.config.js
```

## Key Sections

### Hero Section
- Compelling headline with gradient text
- Interactive calendar mockup
- Call-to-action buttons
- Social proof indicators

### Features Section
- 6 key features with icons and descriptions
- Card-based layout with hover effects
- Responsive grid system

### Onboarding Section
- 3-step setup process
- Click-to-copy service account email
- Detailed instructions with code examples
- Visual step indicators

### Future Projects Section
- Roadmap of upcoming features
- Status indicators (Coming Soon, In Development, Planned)
- Card-based layout

### Call-to-Action Section
- Gradient background
- Multiple action buttons
- Compelling copy

## Customization

### Colors
The design uses a blue-to-purple gradient theme. You can customize colors in:
- `tailwind.config.js` - Tailwind color configuration
- `app/globals.css` - CSS custom properties

### Content
Update the landing page content in `app/page.tsx`:
- Hero section text
- Feature descriptions
- Onboarding steps
- Future projects

### Styling
Modify styles in:
- `app/globals.css` - Global styles and custom CSS
- Component files - Individual component styling
- `tailwind.config.js` - Tailwind configuration

## Deployment

The landing page is ready for deployment on:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **AWS Amplify**
- Any static hosting service

### Vercel Deployment
1. Push code to GitHub
2. Connect repository to Vercel
3. Deploy automatically

### Build for Production
```bash
npm run build
npm start
```

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Performance

- Optimized images and assets
- Minimal JavaScript bundle
- CSS-in-JS with Tailwind
- Responsive images
- Lazy loading

## Accessibility

- Semantic HTML structure
- ARIA labels and roles
- Keyboard navigation support
- Screen reader compatibility
- High contrast ratios

## License

This project is part of the CalendeFi ecosystem. See the main project README for licensing information.
