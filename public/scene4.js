import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "../node_modules/three/build/three.module.js/examples/jsm/controls/OrbitControls";

// Scene elements
let scene, camera, renderer, controls;
let particle, dee1, dee2, tubeMesh;
let isAnimating = false;

// Physical constants and parameters
const params = {
    particleMass: 1.0,        // Mass of the particle (arbitrary units)
    particleCharge: 1.0,      // Charge of the particle (arbitrary units)
    magneticField: 0.5,       // Magnetic field strength - reduced for larger orbits
    voltage: 3.0,             // Voltage (renamed from electricPotential)
    initialRadius: 5.0,       // Initial radius of particle path - increased for visibility
    initialSpeed: 3.0,        // Initial speed increased from 1.0 to 3.0 for faster startup
    deesRadius: 30,           // Radius of the dees
    extractionAngle: 0.15,    // Angle in radians where extraction path is located
    extractionEnabled: true,  // Whether to extract the particle or stop the simulation
    particleExtracted: false  // Whether the particle has been extracted
};

// Simulation variables
let particleVelocity = new THREE.Vector3();
let particlePosition = new THREE.Vector3();
let previousPosition = new THREE.Vector3(); // Added for improved gap detection
let lastGapCrossingTime = 0;
const gapCrossingCooldown = 0.2;  // Moderate cooldown to prevent double accelerations
const dt = 0.01;                  // Time step for simulation
let time = 0;                     // Total simulation time
let previousQuadrant = 0;         // Track which quadrant the particle was in

// Trail variables
const trailPoints = [];
const maxTrailLength = 3000;  // Increased from 1000 for longer trails
let frameCount = 0;

// Colors
const colors = {
    particle: 0x00ff00,
    dee1: 0xff6666,
    dee2: 0x6666ff,
    trail: 0xffff00,
    axis: 0xffffff,
    grid: 0x444444,
    background: 0x111111
};

// ===================================================
//   Initialization Functions
// ===================================================

function initScene() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);

    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 40, 30);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Add lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    // Add helpers
    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    const gridHelper = new THREE.GridHelper(100, 20, colors.grid, colors.grid);
    scene.add(gridHelper);

    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
}

function setupUIControls() {
    // Get DOM elements
    const massSlider = document.getElementById('mass-slider');
    const chargeSlider = document.getElementById('charge-slider');
    const magneticFieldSlider = document.getElementById('magneticfield-slider');
    const voltageSlider = document.getElementById('voltage-slider'); // Changed from potential-slider
    const speedSlider = document.getElementById('speed-slider');
    const deesRadiusSlider = document.getElementById('deesradius-slider');
    const resetButton = document.getElementById('reset-button');

    // Add extraction toggle if it exists in the DOM
    const extractionToggle = document.getElementById('extraction-toggle');
    if (extractionToggle) {
        extractionToggle.addEventListener('change', (e) => {
            params.extractionEnabled = e.target.checked;
            resetSimulation(); // Reset to apply changes
        });
        // Set initial state
        extractionToggle.checked = params.extractionEnabled;
    }

    // Setup event listeners
    massSlider.addEventListener('input', (e) => {
        params.particleMass = parseFloat(e.target.value);
        document.getElementById('mass-value').textContent = params.particleMass.toFixed(1);
    });

    chargeSlider.addEventListener('input', (e) => {
        params.particleCharge = parseFloat(e.target.value);
        document.getElementById('charge-value').textContent = params.particleCharge.toFixed(1);
    });

    magneticFieldSlider.addEventListener('input', (e) => {
        params.magneticField = parseFloat(e.target.value);
        document.getElementById('magneticfield-value').textContent = params.magneticField.toFixed(1);
    });

    voltageSlider.addEventListener('input', (e) => {
        params.voltage = parseFloat(e.target.value);
        document.getElementById('voltage-value').textContent = params.voltage.toFixed(1);
    });

    speedSlider.addEventListener('input', (e) => {
        params.initialSpeed = parseFloat(e.target.value);
        document.getElementById('speed-value').textContent = params.initialSpeed.toFixed(1);
    });

    deesRadiusSlider.addEventListener('input', (e) => {
        params.deesRadius = parseFloat(e.target.value);
        document.getElementById('deesradius-value').textContent = params.deesRadius.toFixed(0);

        // Remove old dees
        scene.remove(dee1);
        scene.remove(dee2);

        // Create new dees with updated size
        createDees();
    });

    resetButton.addEventListener('click', resetSimulation);
}

function createParticle() {
    const geometry = new THREE.SphereGeometry(1.0, 16, 16); // Larger particle for visibility
    const material = new THREE.MeshStandardMaterial({
        color: colors.particle,
        emissive: colors.particle,
        emissiveIntensity: 0.8 // Brighter for visibility
    });

    particle = new THREE.Mesh(geometry, material);

    // Start at center with initial radius for circular motion
    particle.position.set(params.initialRadius, 0, 0);
    particlePosition = particle.position.clone();

    // Initialize previousPosition for gap crossing detection
    previousPosition = particle.position.clone();

    // Calculate initial velocity for circular motion in a magnetic field
    // v = r * ω = r * (qB/m)
    const cyclotronFrequency = (params.particleCharge * params.magneticField) / params.particleMass;

    // Use the higher of initialSpeed or calculated circular motion speed
    // This ensures a faster startup
    let initialSpeedForCircularMotion = params.initialRadius * cyclotronFrequency;
    initialSpeedForCircularMotion = Math.max(initialSpeedForCircularMotion, params.initialSpeed);

    // Initial velocity perpendicular to position vector (for circular motion)
    particleVelocity = new THREE.Vector3(0, 0, initialSpeedForCircularMotion);

    // We removed the initialAcceleration block to prevent immediate acceleration
    // This ensures voltage only affects the particle when crossing the gap

    scene.add(particle);

    // Create a directional indicator (arrow) for the particle
    const arrowHelper = new THREE.ArrowHelper(
        particleVelocity.clone().normalize(),
        particlePosition,
        3, // Length
        0xff0000 // Color - red
    );
    arrowHelper.name = "velocityArrow";
    scene.add(arrowHelper);
}

function createDees() {
    // Dee gap angle in radians
    const gapAngle = 0.2;  // Wider gap for better visibility

    // Create geometries with a small gap
    // Using CylinderGeometry but will rotate properly to make flat half-circles
    const deeGeometry1 = new THREE.CylinderGeometry(
        params.deesRadius,
        params.deesRadius,
        0.5,
        32,
        1,
        false,
        gapAngle / 2,
        Math.PI - gapAngle
    );

    const deeGeometry2 = new THREE.CylinderGeometry(
        params.deesRadius,
        params.deesRadius,
        0.5,
        32,
        1,
        false,
        Math.PI + gapAngle / 2,
        Math.PI - gapAngle
    );

    // Create materials with transparency
    const dee1Material = new THREE.MeshStandardMaterial({
        color: colors.dee1,
        transparent: true,
        opacity: 0.3,  // More transparent to see trajectory better
        side: THREE.DoubleSide
    });

    const dee2Material = new THREE.MeshStandardMaterial({
        color: colors.dee2,
        transparent: true,
        opacity: 0.3,  // More transparent to see trajectory better
        side: THREE.DoubleSide
    });

    // Create meshes
    dee1 = new THREE.Mesh(deeGeometry1, dee1Material);
    dee2 = new THREE.Mesh(deeGeometry2, dee2Material);

    // Position dees on the xz-plane (horizontal)
    // No rotation needed, cylinders are already oriented correctly by default

    // Place at the grid level
    dee1.position.y = 0;
    dee2.position.y = 0;

    scene.add(dee1);
    scene.add(dee2);

    // Create extraction path visual indicator if extraction is enabled
    if (params.extractionEnabled) {
        // Create a visual indicator for the extraction path
        const extractionPathGeometry = new THREE.BoxGeometry(params.deesRadius * 0.5, 1, 3); // Taller and wider
        const extractionPathMaterial = new THREE.MeshStandardMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.5, // More visible
            emissive: 0xffff00,
            emissiveIntensity: 0.3
        });

        const extractionPath = new THREE.Mesh(extractionPathGeometry, extractionPathMaterial);

        // Position the extraction path
        const angle = params.extractionAngle;
        const pathPosition = new THREE.Vector3(
            Math.cos(angle) * params.deesRadius,
            0,
            Math.sin(angle) * params.deesRadius
        );

        extractionPath.position.copy(pathPosition);
        extractionPath.lookAt(new THREE.Vector3(0, 0, 0)); // Orient toward center
        extractionPath.rotateY(Math.PI/2); // Adjust orientation

        scene.add(extractionPath);
    }
}

// ===================================================
//   Physics Functions
// ===================================================

function calculateLorentzForce() {
    // Magnetic field in y-direction: B = (0, B, 0)
    const B_field = new THREE.Vector3(0, params.magneticField, 0);

    // Calculate Lorentz force: F = q * (v × B)
    const force = new THREE.Vector3();
    force.crossVectors(particleVelocity, B_field);
    force.multiplyScalar(params.particleCharge);

    return force;
}

function isInGap(position) {
    // Calculate angle in the xz-plane relative to x-axis
    const angle = Math.atan2(position.z, position.x);

    // Check if particle is near +π/2 or -π/2 (in the gap)
    return (Math.abs(Math.abs(angle) - Math.PI / 2) < 0.1);
}

function applyElectricField() {
    // Determine which quadrant the particle is in (1-4, counterclockwise from positive x)
    // This is more reliable than just checking if we're in the gap
    let currentQuadrant = 0;
    const x = particlePosition.x;
    const z = particlePosition.z;

    if (x > 0 && z >= 0) currentQuadrant = 1;      // Upper right
    else if (x <= 0 && z > 0) currentQuadrant = 2; // Upper left
    else if (x < 0 && z <= 0) currentQuadrant = 3; // Lower left
    else if (x >= 0 && z < 0) currentQuadrant = 4; // Lower right

    // If we haven't recorded a quadrant yet, do so and exit
    if (previousQuadrant === 0) {
        previousQuadrant = currentQuadrant;
        return false;
    }

    // Check if we've crossed a gap - improved detection for high speeds
    let crossedGap = false;

    // Check quadrant transitions
    const quadrantTransition =
        (previousQuadrant === 1 && currentQuadrant === 2) ||
        (previousQuadrant === 3 && currentQuadrant === 4);

    // Backup detection method for high speeds: check if x coordinate has changed sign
    const xSignChanged =
        (previousPosition.x >= 0 && particlePosition.x < 0) ||
        (previousPosition.x <= 0 && particlePosition.x > 0);

    // Combine both detection methods
    crossedGap = quadrantTransition || (xSignChanged && z > 0) || (xSignChanged && z < 0);

    // Store previous position for next detection
    previousPosition.copy(particlePosition);

    // If we haven't crossed a gap, update previous quadrant and exit
    if (!crossedGap) {
        previousQuadrant = currentQuadrant;
        return false;
    }

    // Check cooldown to prevent multiple accelerations for a single crossing
    if (time - lastGapCrossingTime < gapCrossingCooldown) {
        return false;
    }

    // Don't allow ridiculous speeds that would break the simulation
    const currentSpeed = particleVelocity.length();
    if (currentSpeed > 200) {
        console.log("Maximum speed reached. No further acceleration.");
        return false;
    }

    // Visual feedback for gap crossing - flash the gap
    const flashGeometry = new THREE.BoxGeometry(0.5, 1, 10);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(0, 0, 0);
    scene.add(flash);

    // Remove flash after a short delay
    setTimeout(() => {
        scene.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
    }, 150);

    // Update the previous quadrant and record crossing time
    previousQuadrant = currentQuadrant;
    lastGapCrossingTime = time;

    // Toggle dee colors for visual feedback
    if (Math.floor(time) % 2 === 0) {
        dee1.material.color.set(colors.dee1);
        dee2.material.color.set(colors.dee2);
    } else {
        dee1.material.color.set(colors.dee2);
        dee2.material.color.set(colors.dee1);
    }

    // Calculate current kinetic energy: Ekin = 0.5 * m * v²
    const currentKineticEnergy = 0.5 * params.particleMass * currentSpeed * currentSpeed;

    // Calculate energy gain from electric potential: ΔE = q * ΔV
    const energyGain = params.particleCharge * params.voltage;

    // New kinetic energy: Ekin1 = Ekin0 + q * ΔV
    const newKineticEnergy = currentKineticEnergy + energyGain;

    // Calculate new speed from energy: v1 = sqrt(2 * Ekin1 / m)
    const newSpeed = Math.sqrt(2 * newKineticEnergy / params.particleMass);

    // Maintain velocity direction, update magnitude
    particleVelocity.normalize().multiplyScalar(newSpeed);

    // Calculate theoretical radius: r = m*v/(q*B)
    const newRadius = (params.particleMass * newSpeed) / (Math.abs(params.particleCharge * params.magneticField));

    console.log(`Gap crossing at time ${time.toFixed(2)}: Speed increased from ${currentSpeed.toFixed(2)} to ${newSpeed.toFixed(2)} m/s`);
    console.log(`Theoretical radius changed to ${newRadius.toFixed(2)} units`);

    return true;
}

function updatePhysics() {
    // Check if particle has been extracted or should be stopped
    if (params.particleExtracted) {
        // Just move in a straight line
        const deltaPosition = particleVelocity.clone().multiplyScalar(dt);
        particlePosition.add(deltaPosition);

        // Update particle mesh position
        particle.position.copy(particlePosition);
        return;
    }

    // Calculate current radius
    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);

    // Check if particle has exceeded dees radius
    if (radius > params.deesRadius) {
        if (params.extractionEnabled) {
            // Check if particle is within extraction angle
            const angle = Math.atan2(particlePosition.z, particlePosition.x);
            if (Math.abs(angle - params.extractionAngle) < 0.05) {
                // Particle is extracted - continue straight motion
                params.particleExtracted = true;
                console.log("Particle extracted! Final energy: " +
                    (0.5 * params.particleMass * particleVelocity.length() * particleVelocity.length()).toFixed(2));

                // Change particle color to indicate extraction
                particle.material.color.set(0xff00ff); // Magenta
                particle.material.emissive.set(0xff00ff);
                particle.material.emissiveIntensity = 1.0; // Make it brighter
            } else {
                // Reflect particle back into dee (simulate hitting the wall)
                const normal = new THREE.Vector3(particlePosition.x, 0, particlePosition.z).normalize();
                particleVelocity.reflect(normal);

                // Visual feedback for reflection
                const flashGeometry = new THREE.SphereGeometry(1, 16, 16);
                const flashMaterial = new THREE.MeshBasicMaterial({
                    color: 0xff0000,
                    transparent: true,
                    opacity: 0.7
                });
                const flash = new THREE.Mesh(flashGeometry, flashMaterial);
                flash.position.copy(particlePosition);
                scene.add(flash);

                // Remove flash after a short delay
                setTimeout(() => {
                    scene.remove(flash);
                    flash.geometry.dispose();
                    flash.material.dispose();
                }, 150);
            }
        } else {
            // Stop the simulation
            isAnimating = false;
            console.log("Particle reached dee boundary! Final energy: " +
                (0.5 * params.particleMass * particleVelocity.length() * particleVelocity.length()).toFixed(2));
            return;
        }
    }

    // Store current speed before applying forces
    // Magnetic field should only change direction, not speed
    const currentSpeed = particleVelocity.length();

    // Apply electric field acceleration when crossing gap
    // This is the only place where speed should increase
    const energyGained = applyElectricField();

    // Calculate Lorentz force from magnetic field
    const lorentzForce = calculateLorentzForce();

    // Improved integration method: Use a semi-implicit method for better energy conservation
    // Calculate acceleration: a = F/m
    const acceleration = lorentzForce.divideScalar(params.particleMass);

    // Update velocity using the acceleration (Lorentz force) - first half step
    const halfDt = dt * 0.5;
    particleVelocity.add(acceleration.clone().multiplyScalar(halfDt));

    // Update position using the midpoint velocity
    const deltaPosition = particleVelocity.clone().multiplyScalar(dt);
    particlePosition.add(deltaPosition);

    // Recalculate the Lorentz force at the new position
    const newLorentzForce = calculateLorentzForce();
    const newAcceleration = newLorentzForce.divideScalar(params.particleMass);

    // Update velocity using the new acceleration - second half step
    particleVelocity.add(newAcceleration.clone().multiplyScalar(halfDt));

    // If no energy was gained from an electric field (didn't cross gap),
    // preserve the original speed (magnetic field only changes direction)
    if (!energyGained) {
        // Normalize and rescale to maintain original speed (energy conservation)
        particleVelocity.normalize().multiplyScalar(currentSpeed);
    }

    // Update particle mesh position
    particle.position.copy(particlePosition);

    // Update velocity arrow if it exists
    const arrow = scene.getObjectByName("velocityArrow");
    if (arrow) {
        arrow.position.copy(particlePosition);
        arrow.setDirection(particleVelocity.clone().normalize());
        // Scale length with velocity (but cap it to avoid visual clutter)
        const arrowLength = Math.min(3 + particleVelocity.length() * 0.2, 10);
        arrow.setLength(arrowLength);
    }

    // Update time
    time += dt;
}

function updateStatsDisplay() {
    // Calculate current values
    const speed = particleVelocity.length();
    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);
    const kineticEnergy = 0.5 * params.particleMass * speed * speed;

    // Calculate cyclotron frequency: f = qB/(2πm)
    const cyclotronFrequency = Math.abs(params.particleCharge * params.magneticField) / (2 * Math.PI * params.particleMass);

    // Theoretical period: T = 2π/ω = 2πm/(qB)
    const cyclotronPeriod = 1 / cyclotronFrequency;

    // Calculate theoretical radius for the current speed: r = mv/(qB)
    const theoreticalRadius = (params.particleMass * speed) / (Math.abs(params.particleCharge * params.magneticField));

    // Update display elements
    document.getElementById('velocity-value').textContent = speed.toFixed(2) + ' units/s';
    document.getElementById('radius-value').textContent = radius.toFixed(2) + ' units';
    document.getElementById('energy-value').textContent = kineticEnergy.toFixed(2) + ' units';
    document.getElementById('frequency-value').textContent = cyclotronFrequency.toFixed(3) + ' Hz';
    document.getElementById('time-value').textContent = time.toFixed(2) + ' s';

    // Add theoretical radius if the element exists
    const theoreticalRadiusElement = document.getElementById('theoretical-radius');
    if (theoreticalRadiusElement) {
        theoreticalRadiusElement.textContent = theoreticalRadius.toFixed(2) + ' units';
    }

    // Update status
    const statusElement = document.getElementById('status');
    if (statusElement) {
        if (params.particleExtracted) {
            statusElement.textContent = 'Extracted';
            statusElement.style.color = '#ff00ff';
        } else if (!isAnimating) {
            statusElement.textContent = 'Stopped';
            statusElement.style.color = '#ff0000';
        } else {
            statusElement.textContent = 'Accelerating';
            statusElement.style.color = '#00ff00';
        }
    }
}

// ===================================================
//   Trail Functions
// ===================================================

function updateTrail() {
    frameCount++;

    // Improved adaptive sampling based on both speed and radius
    const speed = particleVelocity.length();
    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);

    // Calculate sampling frequency based on both speed and radius
    // Lower frequency (more samples) for higher speeds and larger radii
    const speedFactor = Math.min(5, Math.max(1, Math.floor(speed / 15)));
    const radiusFactor = Math.min(5, Math.max(1, Math.floor(radius / 10)));
    const recordFrequency = Math.min(speedFactor, radiusFactor);

    // Record at least every few frames
    if (frameCount % recordFrequency === 0) {
        // Add current position to trail with metadata
        trailPoints.push({
            position: particlePosition.clone(),
            time: time,
            speed: speed,
            isExtracted: params.particleExtracted
        });

        // Limit trail length but keep enough points for good visibility
        const minTrailLength = 200;  // Increased minimum
        const maxLength = Math.max(minTrailLength, Math.min(maxTrailLength, 2000));  // Increased maximum

        while (trailPoints.length > maxLength) {
            trailPoints.shift();
        }

        // Update trail visualization
        updateTrailMesh();
    }
}

function updateTrailMesh() {
    // Remove old mesh if exists
    if (tubeMesh) {
        scene.remove(tubeMesh);
        tubeMesh.geometry.dispose();
        tubeMesh.material.dispose();
    }

    // Create new tube mesh if enough points
    if (trailPoints.length >= 2) {
        try {
            // Extract just the position data for the curve
            const positions = trailPoints.map(point => point.position);

            // Use CatmullRomCurve3 for a smooth path
            const curve = new THREE.CatmullRomCurve3(positions);
            curve.closed = false;

            // Use more segments for smoother appearance
            const tubeSegments = Math.max(50, Math.min(positions.length * 2, 400));

            // Adjust tube radius for better visibility
            const tubeRadius = 0.25;  // Slightly increased from 0.2

            const geometry = new THREE.TubeGeometry(curve, tubeSegments, tubeRadius, 12, false);

            // Create gradient color material for better trail visualization
            // This uses vertex colors to create a gradient effect
            const colors = [];
            const color = new THREE.Color();

            // Define colors for different trail sections
            const normalColor = new THREE.Color(0xffff00);  // Yellow
            const extractedColor = new THREE.Color(0xff00ff);  // Magenta
            const fadeColors = [
                new THREE.Color(0xffff00),  // Brightest yellow
                new THREE.Color(0xe6e600),  // Slightly dimmer
                new THREE.Color(0xcccc00),  // Dimmer still
                new THREE.Color(0x999900)   // Dimmest
            ];

            // Calculate colors for each vertex
            const positionCount = geometry.attributes.position.count;
            for (let i = 0; i < positionCount; i++) {
                // Calculate relative position along the tube (0 to 1)
                const alpha = i / positionCount;

                // For extracted portion, use magenta
                if (params.particleExtracted && alpha > 0.9) {
                    color.copy(extractedColor);
                } else {
                    // For normal trail, use gradient based on age
                    const fadeIndex = Math.min(3, Math.floor(alpha * 4));
                    color.copy(fadeColors[fadeIndex]);
                }

                colors.push(color.r, color.g, color.b);
            }

            // Add colors to geometry
            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

            // Create material with vertex colors
            const material = new THREE.MeshStandardMaterial({
                vertexColors: true,
                emissive: 0xffff00,
                emissiveIntensity: 0.8,
                roughness: 0.3,
                metalness: 0.7
            });

            tubeMesh = new THREE.Mesh(geometry, material);
            scene.add(tubeMesh);
        } catch (error) {
            console.error("Error creating trail:", error);
            // If we encounter an error, try with fewer points but not too few
            while (trailPoints.length > 200) {
                trailPoints.shift();
            }
        }
    }
}

// ===================================================
//   Animation and Control Functions
// ===================================================

function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);

    // Update physics
    updatePhysics();

    // Update trail
    updateTrail();

    // Update information display
    updateStatsDisplay();

    // Update controls and render
    controls.update();
    renderer.render(scene, camera);
}

function resetSimulation() {
    // Stop animation
    isAnimating = false;

    // Reset time
    time = 0;

    // Reset extraction status
    params.particleExtracted = false;

    // Reset quadrant tracking
    previousQuadrant = 0;
    lastGapCrossingTime = 0;

    // Remove old particle and trail
    if (particle) scene.remove(particle);
    if (tubeMesh) scene.remove(tubeMesh);

    // Clear trail points
    trailPoints.length = 0;

    // Remove old dees (in case dee radius was changed)
    if (dee1) scene.remove(dee1);
    if (dee2) scene.remove(dee2);

    // Create new dees and particle
    createDees();
    createParticle();

    // Reset frame counter
    frameCount = 0;

    // Update display
    updateStatsDisplay();

    // Render once
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// ===================================================
//   Main Initialization
// ===================================================

export function init(button) {
    // Initialize scene and components
    initScene();
    createDees();
    createParticle();
    setupUIControls();

    // Add window resize handler
    window.addEventListener('resize', onWindowResize, false);

    // Setup start/stop button
    button.addEventListener('click', () => {
        if (!isAnimating) {
            isAnimating = true;
            button.textContent = 'Stop Animation';
            animate();
        } else {
            isAnimating = false;
            button.textContent = 'Start Animation';
        }
    });

    // Initial render and stats update
    updateStatsDisplay();
    renderer.render(scene, camera);
}