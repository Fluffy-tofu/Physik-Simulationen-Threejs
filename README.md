# Physics Simulations with Three.js

A collection of interactive 3D physics simulations built using Three.js. This project demonstrates various physics concepts through visual, interactive web-based demonstrations.

## Features

### 1. Torus Scene (Scene 1)
- Interactive 3D torus with dynamic rotation
- Ambient star field background
- Fully controllable camera with orbit controls
- Lighting effects with point and ambient light

### 2. Bouncing Balls Simulation (Scene 2)
- Simulation of two spheres under gravity
- Realistic bounce physics with damping
- Floor collision detection
- Wireframe visualization
- Adjustable physics parameters (gravity, bounce factor)

### 3. Gravitational Attraction (Scene 3)
- Two-body gravitational simulation
- Particle trails showing movement history
- Camera follows system center of mass
- Collision handling with elastic bouncing
- Real-time position tracking
- Adjustable mass and gravitational constants

### 4. Cyclotron Simulation (Scene 4)
- Particle acceleration simulation
- Magnetic and electric field effects
- Dee electrode visualization
- Particle trajectory tracking
- Color-coded field visualization
- Dynamic field switching

### 5. Magnetic Field Visualization
- Magnetic field line visualization
- Interactive field strength control
- Grid helper for spatial reference
- Vector field representation
- Positive and negative pole visualization

## Technical Details

### Technologies Used
- Three.js for 3D rendering
- JavaScript ES6+
- HTML5 Canvas
- CSS3 for styling
- Vite for development and building

### Physics Implementation
- Custom physics engine for each simulation
- Time-step based calculations
- Vector mathematics for force calculations
- Collision detection and response
- Trail rendering using Three.js TubeGeometry

## Getting Started

### Prerequisites
- Node.js (version 14 or higher recommended)
- npm or yarn package manager

### Installation
1. Clone the repository:
```bash
git clone [repository-url]
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

Each scene can be accessed from the main menu. Use the following controls:
- Left-click and drag to rotate the camera
- Right-click and drag to pan
- Scroll to zoom
- Use the "Start Animation" button to begin/pause simulations
- "Back to Menu" button returns to the scene selection screen

## Scene-Specific Controls

### Torus Scene
- Automatic rotation when animation is started
- Full orbital camera control

### Bouncing Balls
- Physics parameters can be adjusted in the code:
  - `gravity` - Gravitational acceleration
  - `bounce` - Bounce damping factor
  - `sphereRadius` - Size of the spheres

### Gravitational Attraction
- Adjustable parameters:
  - `sphereMass1`, `sphereMass2` - Masses of the bodies
  - `Gravity` - Gravitational constant
  - `maxTrailLength` - Length of trajectory trails

### Cyclotron
- Configurable parameters:
  - `B` - Magnetic field strength
  - `E` - Electric field strength
  - `q` - Particle charge
  - `m` - Particle mass

### Magnetic Field (Giorgio)
- Visualization of magnetic field lines
- Adjustable field strength and direction


## License

This project is open source and available under the MIT License.
