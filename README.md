# Dyson Sphere Program - Recipe Calculator

A web-based production chain calculator for Dyson Sphere Program that helps you optimize factory layouts and resource planning.

## Features

- 🔢 **Recipe Calculation**: Calculate complete production chains from raw materials to final products
- ⚡ **Proliferator Support**: Configure production boost or speed boost (exclusive modes)
- 🏭 **Machine Tiers**: Select different machine ranks for optimal production
- 🔌 **Power Consumption**: Calculate total power requirements including sorters
- 🌳 **Tree View**: Visualize production dependencies in a clear tree structure
- 💾 **Settings Persistence**: Your preferences are saved automatically
- 🔄 **Alternative Recipes**: Choose between multiple production methods

## Technology Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite 5
- **State Management**: Zustand
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI
- **Data Parsing**: fast-xml-parser
- **Calculations**: decimal.js

## Getting Started

### Prerequisites

- Node.js 18 or higher
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/        # React components
│   ├── SettingsPanel/ # Global settings UI
│   ├── RecipeSelector/ # Recipe grid selection
│   └── ResultTree/    # Production chain tree view
├── lib/              # Business logic
│   └── parser.ts     # XML data parser
├── stores/           # Zustand state management
│   ├── gameDataStore.ts    # Game data (items, recipes, machines)
│   └── settingsStore.ts    # User settings
├── types/            # TypeScript type definitions
│   ├── game-data.ts
│   ├── settings.ts
│   └── calculation.ts
├── utils/            # Utility functions
│   └── grid.ts       # Grid calculations
└── App.tsx           # Main application component

public/
└── data/             # Game data XML files
    ├── Items/
    ├── Recipes/
    └── Machines/
```

## Game Data

The calculator uses XML data files exported from Dyson Sphere Program:

- **Items.xml**: All game items and resources
- **Recipes.xml**: Production recipes
- **Machines.xml**: Production facilities and their properties

## Key Concepts

### Proliferators

Proliferators boost production with **exclusive modes**:
- **Production Boost**: Increases output quantity
- **Speed Boost**: Increases production speed

Only one mode can be active at a time.

| Type | Production | Speed | Power |
|------|-----------|-------|-------|
| Mk.I | +12.5% | +25% | +30% |
| Mk.II | +20% | +50% | +70% |
| Mk.III | +25% | +100% | +150% |

### Machine Tiers

Different machine tiers affect production speed:

- **Smelters**: Arc (100%) → Plane (200%) → Negentropy (300%)
- **Assemblers**: Mk.I (75%) → Mk.II (100%) → Mk.III (150%)
- **Chemical Plants**: Standard (100%) → Quantum (200%)
- **Matrix Labs**: Standard (100%) → Self-evolution (200%)

### Power Calculation

Total power = Machine power + Sorter power

- **Machine power**: Based on tier and proliferator settings
- **Sorter power**: Used for material handling (throughput not calculated)

## Development

### Type Safety

This project uses strict TypeScript. All game data is fully typed.

### State Management

- **gameDataStore**: Holds parsed XML data
- **settingsStore**: Persists user preferences to localStorage

### Adding Features

1. Add types to `src/types/`
2. Implement logic in `src/lib/`
3. Create components in `src/components/`
4. Update stores in `src/stores/` if needed

## License

This project is for educational and personal use. Dyson Sphere Program is © Youthcat Studio.

## Contributing

Contributions are welcome! Please ensure:

- TypeScript strict mode compliance
- Proper type definitions
- Component documentation
- Test coverage for calculations

## Roadmap

- [x] Project setup
- [x] XML data parsing
- [x] Type definitions
- [x] Basic UI layout
- [x] Recipe grid display
- [x] Settings panel
- [x] Calculation engine
- [x] Production tree view
- [x] Power optimization
- [x] Dark mode
- [x] Alternative recipes
- [x] Bottleneck detection
- [x] What-if simulator
- [x] Statistics view
- [x] Building cost calculator
- [x] Mining calculator
- [x] Power graph
- [x] Template presets
- [x] Custom XML upload (Hidden: Ctrl+Shift+M)

## Hidden Features

### Mod Settings (Ctrl+Shift+M)

Press `Ctrl+Shift+M` to access advanced mod settings:

- **Custom Recipes.xml Upload**: Replace game recipes with modded versions
  - XML validation and sanitization
  - Security checks for malicious content
  - File size limit: 10MB
  
- **Custom Proliferator Multipliers**: Adjust proliferator effects for modded gameplay
  - Customize production and speed bonuses
  - Supports all three proliferator tiers
  - Reset to default values

**⚠️ Warning**: These features are intended for modded gameplay. Invalid data may cause calculation errors.

## Credits

Built with ❤️ for the Dyson Sphere Program community.
