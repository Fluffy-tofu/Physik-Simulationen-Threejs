import * as THREE from 'https://unpkg.com/three@0.137.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.137.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let particle, dee1, dee2, tubeMesh;
let isAnimating = false;
let isRealisticMode = false;

const params = {
    particleMass: 1.0,
    particleCharge: 0.4,
    magneticField: 0.5,
    voltage: 3.0,
    initialRadius: 5.0,
    initialSpeed: 1.0,
    deesRadius: 25,
    extractionAngle: 0.15,
    extractionEnabled: false, // Disabled extraction by default
    particleExtracted: false,
    timeScale: 1.0
};

const realParams = {
    protonMass: 1.6726e-27,
    protonCharge: 1.602e-19,
    maxMagneticField: 2.0,
    maxVoltage: 50000,
    speedScale: 1e-7,
    massScale: 1e27,
    chargeScale: 1e19,
    magneticFieldScale: 1,
    voltageScale: 1e-4
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
    camera.position.set(0, 40, 30);
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

    const axesHelper = new THREE.AxesHelper(20);
    scene.add(axesHelper);

    const gridHelper = new THREE.GridHelper(100, 20, colors.grid, colors.grid);
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

    // Removed extraction toggle reference

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
    isRealisticMode = !isRealisticMode;

    const button = document.getElementById('realistic-mode-button');
    if (isRealisticMode) {
        button.textContent = 'Einfache Werte aktivieren';

        // Fix: Adjusted timeScale and values for realistic mode to make it work
        params.particleMass = realParams.protonMass * realParams.massScale;
        params.particleCharge = realParams.protonCharge * realParams.chargeScale;
        params.magneticField = 1.5;
        params.voltage = 20000 * realParams.voltageScale;
        params.timeScale = 0.05; // Increased from 0.001 to make movement visible
        params.initialSpeed = 2.0; // Give it a bit more initial speed
    } else {
        button.textContent = 'Realistische Werte aktivieren';

        params.particleMass = 1.0;
        params.particleCharge = 0.4;
        params.magneticField = 0.5;
        params.voltage = 3.0;
        params.timeScale = 1.0;
        params.initialSpeed = 1.0;
    }

    updateUIValues();
    resetSimulation();
}

function updateUIValues() {
    // Create properly formatted values for realistic mode
    if (isRealisticMode) {
        // Update mass with better formatting
        const massEl = document.getElementById('mass-value');
        massEl.innerHTML = '1.67 × 10<sup>-27</sup> kg';
        massEl.style.whiteSpace = 'nowrap';

        // Update charge with better formatting
        const chargeEl = document.getElementById('charge-value');
        chargeEl.innerHTML = '1.60 × 10<sup>-19</sup> C';
        chargeEl.style.whiteSpace = 'nowrap';

        // Update magnetic field
        document.getElementById('magneticfield-value').textContent =
            (params.magneticField * realParams.magneticFieldScale).toFixed(1) + ' T';

        // Update voltage
        document.getElementById('voltage-value').textContent =
            (params.voltage / realParams.voltageScale).toFixed(0) + ' V';
    } else {
        // Regular mode
        document.getElementById('mass-value').textContent = params.particleMass.toFixed(1);
        document.getElementById('charge-value').textContent = params.particleCharge.toFixed(1);
        document.getElementById('magneticfield-value').textContent = params.magneticField.toFixed(1);
        document.getElementById('voltage-value').textContent = params.voltage.toFixed(1);
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

    particle.position.set(params.initialRadius, 0, 0);
    particlePosition = particle.position.clone();
    previousPosition = particle.position.clone();

    const cyclotronFrequency = (params.particleCharge * params.magneticField) / params.particleMass;

    let initialSpeedForCircularMotion = params.initialRadius * cyclotronFrequency;
    initialSpeedForCircularMotion = Math.max(initialSpeedForCircularMotion, params.initialSpeed);

    particleVelocity = new THREE.Vector3(0, 0, initialSpeedForCircularMotion);

    scene.add(particle);

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

    const deeGeometry1 = new THREE.CylinderGeometry(
        params.deesRadius,
        params.deesRadius,
        0.5,
        32,
        1,
        false,
        0,
        Math.PI
    );

    const deeGeometry2 = new THREE.CylinderGeometry(
        params.deesRadius,
        params.deesRadius,
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
    const B_field = new THREE.Vector3(0, params.magneticField, 0);

    const force = new THREE.Vector3();
    force.crossVectors(particleVelocity, B_field);
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
        const deltaPosition = particleVelocity.clone().multiplyScalar(dt * params.timeScale);
        particlePosition.add(deltaPosition);
        particle.position.copy(particlePosition);
        return;
    }

    const radius = Math.sqrt(particlePosition.x * particlePosition.x + particlePosition.z * particlePosition.z);

    if (radius > params.deesRadius) {
        // Simplified extraction logic - particle just stops
        isAnimating = false;
        return;
    }

    const currentSpeed = particleVelocity.length();
    const energyGained = applyElectricField();
    const lorentzForce = calculateLorentzForce();
    const acceleration = lorentzForce.divideScalar(params.particleMass);

    const halfDt = dt * params.timeScale * 0.5;
    particleVelocity.add(acceleration.clone().multiplyScalar(halfDt));

    const deltaPosition = particleVelocity.clone().multiplyScalar(dt * params.timeScale);
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

    time += dt * params.timeScale;
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
        velocityEl.innerHTML = (realSpeed / 1e6).toFixed(2) + ' × 10<sup>6</sup> m/s';
        velocityEl.style.whiteSpace = 'nowrap';

        document.getElementById('energy-value').textContent = realEnergyInMeV.toFixed(2) + ' MeV';
        document.getElementById('frequency-value').textContent = (cyclotronFrequency * 1e6).toFixed(3) + ' MHz';
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