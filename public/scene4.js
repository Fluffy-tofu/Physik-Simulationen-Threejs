import * as THREE from 'https://unpkg.com/three@0.137.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.137.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let particle, dee1, dee2, tubeMesh;
let isAnimating = false;
let isRealisticMode = false;

const params = {
    particleMass: 0.1, // Actual value is 0.1 but will display as 1.0
    particleCharge: 0.1, // Actual value is 0.1 but will display as 1.0
    magneticField: 0.5,
    voltage: 3.0,
    initialRadius: 5.0,
    initialSpeed: 1.0,
    deesRadius: 25,
    extractionAngle: 0.15,
    extractionEnabled: false, // Disabled extraction by default
    particleExtracted: false,
    timeScale: 1.0,
    visualSlowdownFactor: 1.0, // For slowing down high-speed visuals
    selectedParticleType: 'proton' // Default particle type
};

const realParams = {
    protonMass: 1.6726e-27,
    protonCharge: 1.602e-19,
    electronMass: 9.1094e-31,
    electronCharge: -1.602e-19,
    alphaMass: 6.6447e-27,    // 4 times proton mass
    alphaCharge: 3.204e-19,   // 2 times proton charge
    deuteronMass: 3.3436e-27, // roughly 2 times proton mass
    deuteronCharge: 1.602e-19,
    maxMagneticField: 2.0,
    maxVoltage: 50000,
    speedScale: 1e-7,
    massScale: 1e27,
    chargeScale: 1e19,
    magneticFieldScale: 1,
    voltageScale: 1e-4,
    initialRealisticSpeed: 5e5, // Reduced to 500,000 m/s initial speed
    maxRadius: 40 // Maximum radius to prevent particle from disappearing
};

let particleVelocity = new THREE.Vector3();
let particlePosition = new THREE.Vector3();
let previousPosition = new THREE.Vector3();
let lastGapCrossingTime = 0;
const gapCrossingCooldown = 0.2;
let dt = 0.015;
let time = 0;
let previousQuadrant = 0;

const trailPoints = [];
const maxTrailLength = 3000;
let frameCount = 0;

const colors = {
    particle: 0x00ff00,
    dee1: 0xff6666,
    dee2: 0x6666ff,
    trail: 0xffff00,
    axis: 0xffffff,
    grid: 0x444444,
    background: 0x111111
};

function initScene() {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(colors.background);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 60, 50); // Increased camera height and distance to see larger radius
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 20, 10);
    scene.add(pointLight);

    const axesHelper = new THREE.AxesHelper(40); // Increased size
    scene.add(axesHelper);

    const gridHelper = new THREE.GridHelper(200, 40, colors.grid, colors.grid); // Larger grid
    scene.add(gridHelper);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
}

function setupUIControls() {
    const massSlider = document.getElementById('mass-slider');
    const chargeSlider = document.getElementById('charge-slider');
    const magneticFieldSlider = document.getElementById('magneticfield-slider');
    const voltageSlider = document.getElementById('voltage-slider');
    const speedSlider = document.getElementById('speed-slider');
    const deesRadiusSlider = document.getElementById('deesradius-slider');
    const resetButton = document.getElementById('reset-button');

    // Set initial display values
    document.getElementById('mass-value').textContent = "1.0";
    document.getElementById('charge-value').textContent = "1.0";

    massSlider.addEventListener('input', (e) => {
        if (!isRealisticMode) {
            params.particleMass = parseFloat(e.target.value) / 10; // Divide by 10 to get actual value
            updateUIValues();
        }
    });

    chargeSlider.addEventListener('input', (e) => {
        if (!isRealisticMode) {
            params.particleCharge = parseFloat(e.target.value) / 10; // Divide by 10 to get actual value
            updateUIValues();
        }
    });

    magneticFieldSlider.addEventListener('input', (e) => {
        params.magneticField = parseFloat(e.target.value);
        updateUIValues();
    });

    voltageSlider.addEventListener('input', (e) => {
        params.voltage = parseFloat(e.target.value);
        updateUIValues();
    });

    speedSlider.addEventListener('input', (e) => {
        params.initialSpeed = parseFloat(e.target.value);
        updateUIValues();
    });

    deesRadiusSlider.addEventListener('input', (e) => {
        params.deesRadius = parseFloat(e.target.value);
        updateUIValues();

        scene.remove(dee1);
        scene.remove(dee2);
        createDees();
    });

    resetButton.addEventListener('click', resetSimulation);

    // Create realistic mode button and add to controls-panel
    const realisticModeButton = document.createElement('button');
    realisticModeButton.id = 'realistic-mode-button';
    realisticModeButton.className = 'panel-button';
    realisticModeButton.style.width = '100%';
    realisticModeButton.style.marginTop = '10px';
    realisticModeButton.textContent = 'Realistische Werte aktivieren';
    realisticModeButton.addEventListener('click', toggleRealisticMode);

    // Add button to the controls panel's button row
    const controlsPanel = document.getElementById('controls-panel');
    if (controlsPanel) {
        const buttonRow = controlsPanel.querySelector('.button-row');
        if (buttonRow) {
            // Create a new div to hold both buttons to prevent layout issues
            const newButtonRow = document.createElement('div');
            newButtonRow.className = 'button-row';
            newButtonRow.style.marginTop = '10px';
            newButtonRow.appendChild(realisticModeButton);

            // Insert after the existing button row
            buttonRow.parentNode.insertBefore(newButtonRow, buttonRow.nextSibling);
        } else {
            controlsPanel.appendChild(realisticModeButton);
        }
    } else {
        // If controls panel not found, add to body with styling
        realisticModeButton.className = 'control-button';
        realisticModeButton.style.bottom = '20px';
        realisticModeButton.style.right = '20px';
        document.body.appendChild(realisticModeButton);
    }

    translateUIToGerman();
}

function translateUIToGerman() {
    const translations = {
        'Mass': 'Masse',
        'Charge': 'Ladung',
        'Magnetic Field': 'Magnetfeld',
        'Voltage': 'Spannung',
        'Initial Speed': 'Anfangsgeschwindigkeit',
        'Dees Radius': 'Dee-Radius',
        'Dees Size': 'Dee-Größe',
        'Reset': 'Zurücksetzen',
        'Start Animation': 'Animation starten',
        'Stop Animation': 'Animation stoppen',
        'Enable Extraction': 'Extraktion aktivieren',
        'Velocity': 'Geschwindigkeit',
        'Radius': 'Radius',
        'Energy': 'Energie',
        'Frequency': 'Frequenz',
        'Time': 'Zeit',
        'Theoretical Radius': 'Theoretischer Radius',
        'Status': 'Status',
        'Accelerating': 'Beschleunigt',
        'Extracted': 'Extrahiert',
        'Stopped': 'Gestoppt',
        'Ready': 'Bereit',
        'Cyclotron Data': 'Zyklotron Daten',
        'Simulation Controls': 'Simulationssteuerung',
        'Back to Menu': 'Zurück zum Menü',
        'Particle Mass:': 'Teilchenmasse:',
        'Particle Charge:': 'Teilchenladung:'
    };

    document.querySelectorAll('label, span, button, div, h3, td').forEach(element => {
        for (const [english, german] of Object.entries(translations)) {
            if (element.textContent === english) {
                element.textContent = german;
            }
        }
    });

    const buttonStartStop = document.querySelector('button#startButton');
    if (buttonStartStop && buttonStartStop.textContent === 'Start Animation') {
        buttonStartStop.textContent = 'Animation starten';
    }

    // Update specific values with units
    if (document.getElementById('velocity-value')) {
        document.getElementById('velocity-value').textContent = '0.00 Einh./s';
    }
    if (document.getElementById('radius-value')) {
        document.getElementById('radius-value').textContent = '0.00 Einh.';
    }
    if (document.getElementById('energy-value')) {
        document.getElementById('energy-value').textContent = '0.00 Einh.';
    }
    if (document.getElementById('frequency-value')) {
        document.getElementById('frequency-value').textContent = '0.00 Hz';
    }
    if (document.getElementById('time-value')) {
        document.getElementById('time-value').textContent = '0.00 s';
    }
    if (document.getElementById('status')) {
        document.getElementById('status').textContent = 'Bereit';
    }
}

function toggleRealisticMode() {
    // If we're turning ON realistic mode, show warning first
    if (!isRealisticMode) {
        // Show the warning modal
        const modal = document.getElementById('warning-modal');
        modal.style.display = 'block';

        // Setup the accept button
        const acceptButton = document.getElementById('accept-button');
        acceptButton.onclick = function() {
            modal.style.display = 'none';
            // Continue with enabling realistic mode
            enableRealisticMode();
        };

        // Don't proceed further until accept is clicked
        return;
    } else {
        // If we're turning OFF realistic mode, just do it directly
        disableRealisticMode();
    }
}

function enableRealisticMode() {
    isRealisticMode = true;

    const button = document.getElementById('realistic-mode-button');
    button.textContent = 'Einfache Werte aktivieren';

    // Hide mass and charge sliders
    const massGroup = document.getElementById('mass-group');
    const chargeGroup = document.getElementById('charge-group');

    if (massGroup) massGroup.style.display = 'none';
    if (chargeGroup) chargeGroup.style.display = 'none';

    // Add particle selector
    addParticleSelector();

    // Set realistic values for electron (now default since proton was removed)
    setParticleProperties('electron');

    // Add slowdown factor control
    addSlowdownControl();

    // Adjust simulation parameters for realistic mode
    params.initialSpeed = 2.0; // Use a moderate speed that works well
    params.magneticField = 3.0; // Moderate magnetic field for good curvature
    params.voltage = 5000 * realParams.voltageScale;
    params.timeScale = 0.01; // Slow time progression

    updateUIValues();
    resetSimulation();
}

function disableRealisticMode() {
    isRealisticMode = false;

    const button = document.getElementById('realistic-mode-button');
    button.textContent = 'Realistische Werte aktivieren';

    // Show mass and charge sliders
    const massGroup = document.getElementById('mass-group');
    const chargeGroup = document.getElementById('charge-group');

    if (massGroup) massGroup.style.display = 'block';
    if (chargeGroup) chargeGroup.style.display = 'block';

    // Remove particle selector if it exists
    const particleSelectorGroup = document.getElementById('particle-selector-group');
    if (particleSelectorGroup) {
        particleSelectorGroup.remove();
    }

    // Remove slowdown control if it exists
    const slowdownGroup = document.getElementById('slowdown-group');
    if (slowdownGroup) {
        slowdownGroup.remove();
    }

    // Reset to simple values
    params.particleMass = 0.1; // Display as 1.0
    params.particleCharge = 0.1; // Display as 1.0
    params.magneticField = 0.5;
    params.voltage = 3.0;
    params.timeScale = 1.0;
    params.initialSpeed = 1.0;
    params.visualSlowdownFactor = 1.0;

    updateUIValues();
    resetSimulation();
}

function setParticleProperties(particleType) {
    params.selectedParticleType = particleType;

    switch(particleType) {
        case 'electron':
            params.particleMass = realParams.electronMass * realParams.massScale;
            params.particleCharge = realParams.electronCharge * realParams.chargeScale;
            break;
        case 'alpha':
            params.particleMass = realParams.alphaMass * realParams.massScale;
            params.particleCharge = realParams.alphaCharge * realParams.chargeScale;
            break;
        case 'deuteron':
            params.particleMass = realParams.deuteronMass * realParams.massScale;
            params.particleCharge = realParams.deuteronCharge * realParams.chargeScale;
            break;
        default:
            params.particleMass = realParams.electronMass * realParams.massScale;
            params.particleCharge = realParams.electronCharge * realParams.chargeScale;
    }

    updateUIValues();
    resetSimulation();
}

function addParticleSelector() {
    // Check if the selector already exists
    let particleGroup = document.getElementById('particle-selector-group');
    if (particleGroup) {
        return; // Already exists
    }

    // Create particle selector
    particleGroup = document.createElement('div');
    particleGroup.id = 'particle-selector-group';
    particleGroup.className = 'control-group';

    const label = document.createElement('label');
    label.innerHTML = 'Teilchentyp:';
    particleGroup.appendChild(label);

    // Create radio buttons for each particle type (removed proton)
    const particleTypes = [
        {id: 'electron', name: 'Elektron (e-)'},
        {id: 'alpha', name: 'Alpha-Teilchen (He²⁺)'},
        {id: 'deuteron', name: 'Deuteron (²H⁺)'}
    ];

    particleTypes.forEach(particle => {
        const radioContainer = document.createElement('div');
        radioContainer.style.margin = '5px 0';

        const radio = document.createElement('input');
        radio.type = 'radio';
        radio.id = particle.id;
        radio.name = 'particle-type';
        radio.value = particle.id;
        radio.checked = params.selectedParticleType === particle.id;

        radio.addEventListener('change', () => {
            if (radio.checked) {
                setParticleProperties(particle.id);
            }
        });

        const radioLabel = document.createElement('label');
        radioLabel.htmlFor = particle.id;
        radioLabel.innerHTML = '&nbsp;' + particle.name;

        radioContainer.appendChild(radio);
        radioContainer.appendChild(radioLabel);
        particleGroup.appendChild(radioContainer);
    });

    // Add to the controls panel at the beginning
    const controlsPanel = document.getElementById('controls-panel');
    const firstChild = controlsPanel.firstChild;
    controlsPanel.insertBefore(particleGroup, firstChild.nextSibling);
}

function addSlowdownControl() {
    // Check if the control already exists
    let slowdownGroup = document.getElementById('slowdown-group');
    if (slowdownGroup) {
        return; // Already exists
    }

    // Create new control
    slowdownGroup = document.createElement('div');
    slowdownGroup.id = 'slowdown-group';
    slowdownGroup.className = 'control-group';

    const label = document.createElement('label');
    label.htmlFor = 'slowdown-slider';
    label.innerHTML = 'Zeitlupe-Faktor: <span id="slowdown-value" class="value-display">50.0</span>';

    const slider = document.createElement('input');
    slider.type = 'range';
    slider.id = 'slowdown-slider';
    slider.min = '10';
    slider.max = '500';
    slider.step = '10';
    slider.value = 50; // Default slowdown of 50x
    params.visualSlowdownFactor = 50;

    slider.addEventListener('input', (e) => {
        params.visualSlowdownFactor = parseFloat(e.target.value);
        document.getElementById('slowdown-value').textContent = params.visualSlowdownFactor.toFixed(1);
    });

    slowdownGroup.appendChild(label);
    slowdownGroup.appendChild(slider);

    // Add to the controls panel before the button row
    const controlsPanel = document.getElementById('controls-panel');
    const buttonRow = controlsPanel.querySelector('.button-row');
    controlsPanel.insertBefore(slowdownGroup, buttonRow);
}

function updateUIValues() {
    // Create properly formatted values for realistic mode
    if (isRealisticMode) {
        // Update particle properties based on selected type
        const particleInfoEl = document.getElementById('mass-value');
        const chargeInfoEl = document.getElementById('charge-value');

        if (particleInfoEl && chargeInfoEl) {
            switch(params.selectedParticleType) {
                case 'proton':
                    particleInfoEl.innerHTML = '1.67 × 10<sup>-27</sup> kg';
                    chargeInfoEl.innerHTML = '1.60 × 10<sup>-19</sup> C';
                    break;
                case 'electron':
                    particleInfoEl.innerHTML = '9.11 × 10<sup>-31</sup> kg';
                    chargeInfoEl.innerHTML = '-1.60 × 10<sup>-19</sup> C';
                    break;
                case 'alpha':
                    particleInfoEl.innerHTML = '6.64 × 10<sup>-27</sup> kg';
                    chargeInfoEl.innerHTML = '3.20 × 10<sup>-19</sup> C';
                    break;
                case 'deuteron':
                    particleInfoEl.innerHTML = '3.34 × 10<sup>-27</sup> kg';
                    chargeInfoEl.innerHTML = '1.60 × 10<sup>-19</sup> C';
                    break;
                default:
                    particleInfoEl.innerHTML = '1.67 × 10<sup>-27</sup> kg';
                    chargeInfoEl.innerHTML = '1.60 × 10<sup>-19</sup> C';
            }

            particleInfoEl.style.whiteSpace = 'nowrap';
            chargeInfoEl.style.whiteSpace = 'nowrap';
        }

        // Update magnetic field
        document.getElementById('magneticfield-value').textContent =
            (params.magneticField * realParams.magneticFieldScale).toFixed(1) + ' T';

        // Update voltage
        document.getElementById('voltage-value').textContent =
            (params.voltage / realParams.voltageScale).toFixed(0) + ' V';

        // Display initial speed in realistic values
        const initialSpeedInMS = realParams.initialRealisticSpeed;
        let speedDisplay;

        if (initialSpeedInMS >= 1e6) {
            speedDisplay = (initialSpeedInMS / 1e6).toFixed(1) + ' × 10⁶ m/s';
        } else {
            speedDisplay = initialSpeedInMS.toFixed(0) + ' m/s';
        }

        document.getElementById('speed-value').innerHTML = speedDisplay;
    } else {
        // Regular mode - display values as 10x the actual values
        document.getElementById('mass-value').textContent = (params.particleMass * 10).toFixed(1);
        document.getElementById('charge-value').textContent = (params.particleCharge * 10).toFixed(1);
        document.getElementById('magneticfield-value').textContent = params.magneticField.toFixed(1);
        document.getElementById('voltage-value').textContent = params.voltage.toFixed(1);
        document.getElementById('speed-value').textContent = params.initialSpeed.toFixed(1);
    }
}

function createParticle() {
    const geometry = new THREE.SphereGeometry(1.0, 16, 16);
    const material = new THREE.MeshStandardMaterial({
        color: colors.particle,
        emissive: colors.particle,
        emissiveIntensity: 0.8
    });

    particle = new THREE.Mesh(geometry, material);

    // Keep original position for both modes - position on X axis
    particle.position.set(params.initialRadius, 0, 0);
    particlePosition = particle.position.clone();
    previousPosition = particle.position.clone();

    // Calculate the cyclotron frequency
    const cyclotronFrequency = (Math.abs(params.particleCharge) * params.magneticField) / params.particleMass;

    // Calculate initial velocity
    let speedToUse;
    if (isRealisticMode) {
        // Lower speed for realistic mode to ensure better visibility
        speedToUse = 2.0;
    } else {
        // For non-realistic mode, keep the original calculation
        const initialSpeedForCircularMotion = params.initialRadius * cyclotronFrequency;
        speedToUse = Math.max(initialSpeedForCircularMotion, params.initialSpeed);
    }

    // Set initial velocity in Z direction as it was originally
    particleVelocity = new THREE.Vector3(0, 0, speedToUse);

    scene.add(particle);

    // Add velocity arrow
    const arrowHelper = new THREE.ArrowHelper(
        particleVelocity.clone().normalize(),
        particlePosition,
        3,
        0xff0000
    );
    arrowHelper.name = "velocityArrow";
    scene.add(arrowHelper);
}

function createDees() {
    const gapSize = 2.0;
    const halfGap = gapSize / 2;

    // For realistic mode, make dees larger
    const effectiveDeesRadius = isRealisticMode ? Math.max(params.deesRadius, realParams.maxRadius) : params.deesRadius;

    const deeGeometry1 = new THREE.CylinderGeometry(
        effectiveDeesRadius,
        effectiveDeesRadius,
        0.5,
        32,
        1,
        false,
        0,
        Math.PI
    );

    const deeGeometry2 = new THREE.CylinderGeometry(
        effectiveDeesRadius,
        effectiveDeesRadius,
        0.5,
        32,
        1,
        false,
        Math.PI,
        Math.PI
    );

    const dee1Material = new THREE.MeshStandardMaterial({
        color: colors.dee1,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    const dee2Material = new THREE.MeshStandardMaterial({
        color: colors.dee2,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
    });

    dee1 = new THREE.Mesh(deeGeometry1, dee1Material);
    dee2 = new THREE.Mesh(deeGeometry2, dee2Material);

    dee1.position.set(halfGap, 0, 0);
    dee2.position.set(-halfGap, 0, 0);

    scene.add(dee1);
    scene.add(dee2);

    // Removed extraction path visualization code
}

function calculateLorentzForce() {
    // Magnetic field is in the Y direction (up)
    const B_field = new THREE.Vector3(0, params.magneticField, 0);

    // Calculate v × B (cross product of velocity and magnetic field)
    const force = new THREE.Vector3();
    force.crossVectors(particleVelocity, B_field);

    // Scale by charge (F = q * v × B)
    force.multiplyScalar(params.particleCharge);

    return force;
}

function isInGap(position) {
    const angle = Math.atan2(position.z, position.x);
    return (Math.abs(Math.abs(angle) - Math.PI / 2) < 0.1);
}

function applyElectricField() {
    let currentQuadrant = 0;
    const x = particlePosition.x;
    const z = particlePosition.z;

    if (x > 0 && z >= 0) currentQuadrant = 1;
    else if (x <= 0 && z > 0) currentQuadrant = 2;
    else if (x < 0 && z <= 0) currentQuadrant = 3;
    else if (x >= 0 && z < 0) currentQuadrant = 4;

    if (previousQuadrant === 0) {
        previousQuadrant = currentQuadrant;
        return false;
    }

    let crossedGap = false;

    const quadrantTransition =
        (previousQuadrant === 1 && currentQuadrant === 2) ||
        (previousQuadrant === 3 && currentQuadrant === 4);

    const xSignChanged =
        (previousPosition.x >= 0 && particlePosition.x < 0) ||
        (previousPosition.x <= 0 && particlePosition.x > 0);

    crossedGap = quadrantTransition || (xSignChanged && z > 0) || (xSignChanged && z < 0);

    previousPosition.copy(particlePosition);

    if (!crossedGap) {
        previousQuadrant = currentQuadrant;
        return false;
    }

    if (time - lastGapCrossingTime < gapCrossingCooldown) {
        return false;
    }

    const currentSpeed = particleVelocity.length();
    if (currentSpeed > 200) {
        return false;
    }

    const flashGeometry = new THREE.BoxGeometry(0.5, 1, 10);
    const flashMaterial = new THREE.MeshBasicMaterial({
        color: 0xffff00,
        transparent: true,
        opacity: 0.7
    });
    const flash = new THREE.Mesh(flashGeometry, flashMaterial);
    flash.position.set(0, 0, 0);
    scene.add(flash);

    setTimeout(() => {
        scene.remove(flash);
        flash.geometry.dispose();
        flash.material.dispose();
    }, 150);

    previousQuadrant = currentQuadrant;
    lastGapCrossingTime = time;

    if (Math.floor(time) % 2 === 0) {
        dee1.material.color.set(colors.dee1);
        dee2.material.color.set(colors.dee2);
    } else {
        dee1.material.color.set(colors.dee2);
        dee2.material.color.set(colors.dee1);
    }

    const currentKineticEnergy = 0.5 * params.particleMass * currentSpeed * currentSpeed;
    const energyGain = params.particleCharge * params.voltage;
    const newKineticEnergy = currentKineticEnergy + energyGain;
    const newSpeed = Math.sqrt(2 * newKineticEnergy / params.particleMass);

    particleVelocity.normalize().multiplyScalar(newSpeed);

    return true;
}

function updatePhysics() {
    if (params.particleExtracted) {
        const deltaPosition = particleVelocity.clone().multiplyScalar(dt * params.timeScale / params.visualSlowdownFactor);
        particlePosition.add(deltaPosition);
        particle.position.copy(particlePosition);
        return;
    }

    // Calculate current radius
    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);

    // Check if radius exceeds maximum radius in realistic mode
    if (isRealisticMode && radius > realParams.maxRadius) {
        // Keep particle within visible area by scaling it back
        const scale = realParams.maxRadius / radius;
        particlePosition.x *= scale;
        particlePosition.z *= scale;

        // Reduce speed slightly to prevent rapid expansion
        particleVelocity.multiplyScalar(0.99);

        // Update particle position
        particle.position.copy(particlePosition);
    }
    else if (radius > params.deesRadius) {
        // Standard behavior for hitting dee walls in normal mode
        isAnimating = false;
        return;
    }

    const currentSpeed = particleVelocity.length();
    const energyGained = applyElectricField();
    const lorentzForce = calculateLorentzForce();
    const acceleration = lorentzForce.divideScalar(params.particleMass);

    // Physics update at full speed
    const halfDt = dt * params.timeScale * 0.5;
    particleVelocity.add(acceleration.clone().multiplyScalar(halfDt));

    // Visual update slowed down by visualSlowdownFactor
    const deltaPosition = particleVelocity.clone().multiplyScalar(dt * params.timeScale / params.visualSlowdownFactor);
    particlePosition.add(deltaPosition);

    const newLorentzForce = calculateLorentzForce();
    const newAcceleration = newLorentzForce.divideScalar(params.particleMass);

    particleVelocity.add(newAcceleration.clone().multiplyScalar(halfDt));

    if (!energyGained) {
        particleVelocity.normalize().multiplyScalar(currentSpeed);
    }

    particle.position.copy(particlePosition);

    const arrow = scene.getObjectByName("velocityArrow");
    if (arrow) {
        arrow.position.copy(particlePosition);
        arrow.setDirection(particleVelocity.clone().normalize());
        const arrowLength = Math.min(3 + particleVelocity.length() * 0.2, 10);
        arrow.setLength(arrowLength);
    }

    // Time advances at a rate scaled by visual slowdown factor
    time += dt * params.timeScale / params.visualSlowdownFactor;
}

function updateStatsDisplay() {
    const speed = particleVelocity.length();
    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);
    const kineticEnergy = 0.5 * params.particleMass * speed * speed;

    const cyclotronFrequency = Math.abs(params.particleCharge * params.magneticField) / (2 * Math.PI * params.particleMass);
    const theoreticalRadius = (params.particleMass * speed) / (Math.abs(params.particleCharge * params.magneticField));

    if (isRealisticMode) {
        const realSpeed = speed * realParams.speedScale * 3e8;
        const realEnergy = 0.5 * (realParams.protonMass) * realSpeed * realSpeed;
        const realEnergyInMeV = realEnergy * 6.242e12;

        // Use proper formatting with HTML entities and superscripts
        const velocityEl = document.getElementById('velocity-value');
        // Ensure visibility by using different formats based on speed
        if (realSpeed > 1e8) {
            velocityEl.innerHTML = (realSpeed / 1e8).toFixed(2) + ' × 10<sup>8</sup> m/s';
        } else if (realSpeed > 1e6) {
            velocityEl.innerHTML = (realSpeed / 1e6).toFixed(2) + ' × 10<sup>6</sup> m/s';
        } else {
            velocityEl.innerHTML = realSpeed.toFixed(0) + ' m/s';
        }
        velocityEl.style.whiteSpace = 'nowrap';

        // Use appropriate energy units
        const energyEl = document.getElementById('energy-value');
        if (realEnergyInMeV > 1000) {
            energyEl.textContent = (realEnergyInMeV / 1000).toFixed(2) + ' GeV';
        } else if (realEnergyInMeV > 1) {
            energyEl.textContent = realEnergyInMeV.toFixed(2) + ' MeV';
        } else {
            energyEl.textContent = (realEnergyInMeV * 1000).toFixed(0) + ' keV';
        }

        document.getElementById('frequency-value').textContent = (cyclotronFrequency * 1e6).toFixed(3) + ' MHz';

        // Add visual slowdown info
        if (document.getElementById('slowdown-value')) {
            document.getElementById('slowdown-value').textContent = params.visualSlowdownFactor.toFixed(1) + 'x';
        }
    } else {
        document.getElementById('velocity-value').textContent = speed.toFixed(2) + ' Einh./s';
        document.getElementById('energy-value').textContent = kineticEnergy.toFixed(2) + ' Einh.';
        document.getElementById('frequency-value').textContent = cyclotronFrequency.toFixed(3) + ' Hz';
    }

    document.getElementById('radius-value').textContent = radius.toFixed(2) + ' Einh.';
    document.getElementById('time-value').textContent = time.toFixed(2) + ' s';

    const theoreticalRadiusElement = document.getElementById('theoretical-radius');
    if (theoreticalRadiusElement) {
        theoreticalRadiusElement.textContent = theoreticalRadius.toFixed(2) + ' Einh.';
    }

    const statusElement = document.getElementById('status');
    if (statusElement) {
        if (!isAnimating) {
            statusElement.textContent = 'Gestoppt';
            statusElement.style.color = '#ff0000';
        } else {
            statusElement.textContent = 'Beschleunigt';
            statusElement.style.color = '#00ff00';
        }
    }
}

function updateTrail() {
    frameCount++;

    const speed = particleVelocity.length();
    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);

    const speedFactor = Math.min(5, Math.max(1, Math.floor(speed / 15)));
    const radiusFactor = Math.min(5, Math.max(1, Math.floor(radius / 10)));
    const recordFrequency = Math.min(speedFactor, radiusFactor);

    if (frameCount % recordFrequency === 0) {
        trailPoints.push({
            position: particlePosition.clone(),
            time: time,
            speed: speed,
            isExtracted: params.particleExtracted
        });

        const minTrailLength = 200;
        const maxLength = Math.max(minTrailLength, Math.min(maxTrailLength, 2000));

        while (trailPoints.length > maxLength) {
            trailPoints.shift();
        }

        updateTrailMesh();
    }
}

function updateTrailMesh() {
    if (tubeMesh) {
        scene.remove(tubeMesh);
        tubeMesh.geometry.dispose();
        tubeMesh.material.dispose();
    }

    if (trailPoints.length >= 2) {
        try {
            const positions = trailPoints.map(point => point.position);

            const curve = new THREE.CatmullRomCurve3(positions);
            curve.closed = false;

            const tubeSegments = Math.max(50, Math.min(positions.length * 2, 400));
            const tubeRadius = 0.25;

            const geometry = new THREE.TubeGeometry(curve, tubeSegments, tubeRadius, 12, false);

            const colors = [];
            const color = new THREE.Color();

            const normalColor = new THREE.Color(0xffff00);
            const extractedColor = new THREE.Color(0xff00ff);
            const fadeColors = [
                new THREE.Color(0xffff00),
                new THREE.Color(0xe6e600),
                new THREE.Color(0xcccc00),
                new THREE.Color(0x999900)
            ];

            const positionCount = geometry.attributes.position.count;
            for (let i = 0; i < positionCount; i++) {
                const alpha = i / positionCount;
                const fadeIndex = Math.min(3, Math.floor(alpha * 4));
                color.copy(fadeColors[fadeIndex]);
                colors.push(color.r, color.g, color.b);
            }

            geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

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
            while (trailPoints.length > 200) {
                trailPoints.shift();
            }
        }
    }
}

function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);

    updatePhysics();
    updateTrail();
    updateStatsDisplay();

    controls.update();
    renderer.render(scene, camera);
}

function resetSimulation() {
    isAnimating = false;
    time = 0;
    params.particleExtracted = false;
    previousQuadrant = 0;
    lastGapCrossingTime = 0;

    if (particle) scene.remove(particle);
    if (tubeMesh) scene.remove(tubeMesh);

    trailPoints.length = 0;

    if (dee1) scene.remove(dee1);
    if (dee2) scene.remove(dee2);

    createDees();
    createParticle();

    frameCount = 0;

    updateStatsDisplay();
    renderer.render(scene, camera);
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

export function init(button) {
    initScene();
    createDees();
    createParticle();
    setupUIControls();

    window.addEventListener('resize', onWindowResize, false);

    button.addEventListener('click', () => {
        if (!isAnimating) {
            isAnimating = true;
            button.textContent = 'Animation stoppen';
            animate();
        } else {
            isAnimating = false;
            button.textContent = 'Animation starten';
        }
    });

    updateStatsDisplay();
    renderer.render(scene, camera);
}