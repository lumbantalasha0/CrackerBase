# BEMACHO Crackers Manager Design Guidelines

## Design Approach
**Reference-Based Approach**: Drawing inspiration from modern business management tools like Linear and Notion for clean productivity interfaces, with visual elements inspired by food industry apps like Toast POS and Square for Business.

## Core Design Elements

### A. Color Palette
**Primary Colors:**
- Primary: 34 85% 55% (warm golden orange - representing crackers/baking)
- Primary Dark: 34 85% 45% (deeper golden tone)
- Accent: 210 75% 65% (complementary blue for actions)

**Neutral Colors:**
- Background: 45 15% 97% (warm cream base)
- Surface: 0 0% 100% (pure white cards)
- Surface Alt: 45 10% 95% (subtle warm tint)
- Border: 210 15% 90% (soft blue-gray)

**Text Colors:**
- Text Primary: 220 15% 25% (dark blue-gray)
- Text Secondary: 220 10% 55% (medium gray)

**Status Colors:**
- Success: 120 60% 50%
- Danger: 0 75% 60%
- Warning: 45 90% 55%

### B. Typography
**Fonts:** Inter (headings) and system fonts (body)
**Scales:**
- H1: 28px (Dashboard headers)
- H2: 22px (Screen titles)
- H3: 18px (Card titles)
- Body: 16px (Default text)
- Small: 14px (Subtitles, metadata)

### C. Layout System
**Spacing Units:** Consistent use of 4, 8, 12, 16, 24px spacing
- p-2 (8px), p-3 (12px), p-4 (16px), p-6 (24px)
- Component spacing follows 8px grid system
- Content padding: 16px standard, 24px for headers

### D. Component Library

**Navigation:**
- Slide-out drawer with warm cream background
- Material Icons for navigation items
- Active state: subtle blue background with darker text

**Cards:**
- White background with soft shadows
- 12px border radius
- Left accent borders (6px) in theme colors
- Generous padding (16px)

**Buttons:**
- Primary: Golden orange background, white text
- Secondary: Light surface with border
- Rounded corners (8px)
- 700 font weight for button text

**Forms:**
- Clean white input fields
- Subtle borders with focus states
- 12px border radius
- Proper spacing between form elements

**Data Display:**
- List items with dividers
- Consistent row heights
- Right-aligned action buttons
- Clear hierarchy with primary/secondary text

**Modals:**
- Full-screen overlays for forms
- Slide animation from bottom
- Consistent header patterns

### E. Business-Specific Elements

**Dashboard Cards:**
- Stock card: Primary accent (golden)
- Sales card: Success green accent
- Expenses card: Danger red accent
- Large numeric displays (34px, bold)

**Financial Display:**
- ZMW currency symbol consistent
- Comma-separated thousands
- Color coding: positive (green), negative (red)

**Inventory Elements:**
- Quantity displays prominently
- Date stamps in secondary text
- Action buttons grouped consistently

**Charts & Reports:**
- Clean line charts with primary color
- Minimal grid lines
- Clear data labels
- Warm background tones

## Visual Hierarchy
- Headers use primary dark color for authority
- Cards create clear content sections
- Left accent borders provide visual categorization
- Consistent iconography throughout
- Proper contrast ratios for accessibility

## Interaction Patterns
- Gentle haptic feedback on important actions
- Smooth slide animations for navigation
- Loading states with branded spinner
- Toast notifications in primary dark color
- Confirmation dialogs for destructive actions

## Brand Expression
Professional yet approachable design reflecting a growing crackers business. Warm color palette evokes trust and food industry authenticity while maintaining modern business app standards.