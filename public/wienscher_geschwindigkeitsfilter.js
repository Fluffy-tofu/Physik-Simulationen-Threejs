import * as THREE from 'https://unpkg.com/three@0.137.0/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.137.0/examples/jsm/controls/OrbitControls.js';

let scene, camera, renderer, controls;
let isAnimating = false;
let animationButton;

// Zeitschritt (kleiner für langsamere Bewegung)
const dt = 0.01;

// Simulation parameters - DIREKTE WERTE OHNE KOMPLIZIERTE BERECHNUNGEN
let eFieldStrength = 5;   // Elektrisches Feld in y-Richtung
let bFieldStrength = 2;   // Magnetisches Feld in z-Richtung
let particleSpeed = 5;    // Anfangsgeschwindigkeit in x-Richtung
let particleCharge = -1;  // Negative Ladung = Elektron, Positive Ladung = Proton

// Geschwindigkeitsvektor
let velocity = new THREE.Vector3(particleSpeed, 0, 0);

// Flags
let useGravity = false;
let showEField = true;
let showArrows = true;
let showForce = true;

// Visualisierungscontainer
let eFieldVisualization = [];
let arrowsVisualization = [];

// Visuelles Setup - ORIGINAL
const gridsize = 50;
const griddivisions = 100;
const centerlinecolor = 0xffffff;
const gridlinecolor = 0x444444;
const gridhelper = new THREE.GridHelper(gridsize, griddivisions, centerlinecolor, gridlinecolor);
gridhelper.rotation.x = Math.PI/2;
gridhelper.position.x = -5;
gridhelper.material.transparent = true;
gridhelper.material.opacity = 0.75;

// Magnete - ORIGINAL
const Magnets = new THREE.BoxGeometry(10, 1, 1);

// Materialien für die Magnete
const Redmaterial = new THREE.MeshStandardMaterial({
    color: 0xFF0000
});
const Greenmaterial = new THREE.MeshStandardMaterial({
    color: 0x00FF00
});

// Magnete erzeugen (wir tauschen sie später je nach Polarität)
const positiveMagnet = new THREE.Mesh(Magnets, Redmaterial);
const negativeMagnet = new THREE.Mesh(Magnets, Greenmaterial);

// Zeichen auf den Magneten - ORIGINAL
const WaagerechterStrich = new THREE.BoxGeometry(0.9, 0.1, 1.1);
const SenkrechterStrich = new THREE.BoxGeometry(0.1, 0.9, 1.1);

const WhiteMaterial = new THREE.MeshStandardMaterial({
    color: 0xffffff
});

// Meshes machen um sie groupen zu können - ORIGINAL
const WaagerechterStrichMeshfürPluszeichen = new THREE.Mesh(WaagerechterStrich, WhiteMaterial);
const SenkrechterStrichMeshfürPlusZeichen = new THREE.Mesh(SenkrechterStrich, WhiteMaterial);
const WaagerechterStrichMeshfürMinuszeichen = new THREE.Mesh(WaagerechterStrich, WhiteMaterial);

// Groupen - ORIGINAL
// Plusszeichen
const PlusZeichen = new THREE.Group();
PlusZeichen.add(WaagerechterStrichMeshfürPluszeichen);
PlusZeichen.add(SenkrechterStrichMeshfürPlusZeichen);

// MinusZeichen
const MinusZeichen = new THREE.Group();
MinusZeichen.add(WaagerechterStrichMeshfürMinuszeichen);

// Elektronenkanone - ORIGINAL
const elektronenkanone = new THREE.BoxGeometry(4, 1);
const elektronenkanonemesh = new THREE.Mesh(elektronenkanone, WhiteMaterial);
elektronenkanonemesh.position.setX(-8);

// Beleuchtung - ORIGINAL
const lightning = new THREE.AmbientLight(0xFFFFFF, 10);

// Elektron (verbessert)
const elektronradius = 0.3; // Etwas größer für bessere Sichtbarkeit
const elektron = new THREE.SphereGeometry(elektronradius);
const elektronmaterial = new THREE.MeshBasicMaterial({ color: 0x00FFFF }); // Hellblaue Farbe für bessere Sichtbarkeit
const elektronmesh = new THREE.Mesh(elektron, elektronmaterial);

// Kraftpfeil (neu)
const forceArrow = new THREE.ArrowHelper(
    new THREE.Vector3(0, 1, 0),
    new THREE.Vector3(0, 0, 0),
    2,
    0xff00ff
);
forceArrow.visible = false;

// Funktion zum Aktualisieren der Polaritäten je nach E-Feld-Vorzeichen
function updateFieldPolarities() {
    // Standard-Konfiguration (eFieldStrength > 0):
    // - Negative Platte (grün) oben
    // - Positive Platte (rot) unten
    // - Pfeile zeigen nach oben

    // Wenn E-Feld negativ ist, umgekehrte Konfiguration:
    // - Positive Platte (rot) oben
    // - Negative Platte (grün) unten
    // - Pfeile zeigen nach unten

    if (eFieldStrength >= 0) {
        // Standardkonfiguration
        positiveMagnet.position.set(0, -5, 0);
        negativeMagnet.position.set(0, 5, 0);

        PlusZeichen.position.set(0, -5, 0);
        MinusZeichen.position.set(0, 5, 0);

        // Pfeile neu erstellen (nach oben)
        createArrows(true);
    } else {
        // Umgekehrte Konfiguration
        positiveMagnet.position.set(0, 5, 0);
        negativeMagnet.position.set(0, -5, 0);

        PlusZeichen.position.set(0, 5, 0);
        MinusZeichen.position.set(0, -5, 0);

        // Pfeile neu erstellen (nach unten)
        createArrows(false);
    }

    // E-Feld-Visualisierung aktualisieren
    createEFieldVisualization();
}

// E-Feld Visualisierung erstellen - VERBESSERT mit Ring-X für negatives E-Feld
function createEFieldVisualization() {
    // Lösche bestehende Visualisierung
    eFieldVisualization.forEach(obj => scene.remove(obj));
    eFieldVisualization = [];

    const isNegativeField = eFieldStrength < 0;

    for (let i = -7; i < 4; i++) {
        for (let y = -6; y < 3; y++) {
            const efliedinnerradius = 0.2;
            const efliedouterradius = efliedinnerradius + 0.05;
            const efieldsegments = 32;
            const efield = new THREE.RingGeometry(efliedinnerradius, efliedouterradius, efieldsegments);

            const completeefield = new THREE.Group();

            // Ring erstellen
            const efieldmesh = new THREE.Mesh(efield, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
            completeefield.add(efieldmesh);

            if (isNegativeField) {
                // X erstellen für negatives E-Feld
                const crossSize = efliedinnerradius * 0.8;
                const crossThickness = 0.03;

                // Erster Strich des X
                const line1Geo = new THREE.BoxGeometry(crossSize, crossThickness, 0.01);
                const line1Mesh = new THREE.Mesh(line1Geo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
                line1Mesh.rotation.z = Math.PI / 4; // 45 Grad

                // Zweiter Strich des X
                const line2Geo = new THREE.BoxGeometry(crossSize, crossThickness, 0.01);
                const line2Mesh = new THREE.Mesh(line2Geo, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
                line2Mesh.rotation.z = -Math.PI / 4; // -45 Grad

                completeefield.add(line1Mesh);
                completeefield.add(line2Mesh);
            } else {
                // Punkt erstellen für positives E-Feld
                const efliedinnterpoint = new THREE.CircleGeometry(efliedinnerradius/4);
                const efieldinnerpointmesh = new THREE.Mesh(efliedinnterpoint, new THREE.MeshBasicMaterial({ color: 0xFFFFFF }));
                completeefield.add(efieldinnerpointmesh);
            }

            completeefield.position.x = i + 2;
            completeefield.position.y = y + 2;

            completeefield.visible = showEField;
            scene.add(completeefield);
            eFieldVisualization.push(completeefield);
        }
    }
}

// Pfeile für das E-Feld erstellen - modifiziert für Richtungsumkehr
function createArrows(pointUp = true) {
    // Lösche bestehende Pfeile
    arrowsVisualization.forEach(obj => scene.remove(obj));
    arrowsVisualization = [];

    for (let i = -7; i < 4; i++) {
        // Pfeilrichtung je nach Parameter
        const arrowDirection = new THREE.Vector3(0, pointUp ? 1 : -1, 0);
        // Pfeilursprung je nach Richtung
        const arrowOrigin = new THREE.Vector3(0, pointUp ? -5 : 5, 0);
        const arrowLength = 9.5;
        const arrowColor = 0xFFFFFF;
        const arrowHeadLength = 1.5;
        const arrowHeadWidth = 0.75;

        const arrowHelper = new THREE.ArrowHelper(
            arrowDirection,
            arrowOrigin,
            arrowLength,
            arrowColor,
            arrowHeadLength,
            arrowHeadWidth
        );
        arrowHelper.position.x = i + 2;

        arrowHelper.visible = showArrows;
        scene.add(arrowHelper);
        arrowsVisualization.push(arrowHelper);
    }
}

// Toggle-Funktionen für Visualisierungen
function toggleEField(visible) {
    showEField = visible;
    eFieldVisualization.forEach(obj => obj.visible = visible);
}

function toggleArrows(visible) {
    showArrows = visible;
    arrowsVisualization.forEach(obj => obj.visible = visible);
}

// Funktionen
function resetParticle() {
    elektronmesh.position.set(-8, 0, 0);
    velocity.set(particleSpeed, 0, 0);
    updateForceArrow();
}

function updateForceArrow() {
    // Berechne die Kraft und setze den Pfeil entsprechend
    const eForce = new THREE.Vector3(0, eFieldStrength * particleCharge, 0);
    const vCrossB = new THREE.Vector3();
    vCrossB.crossVectors(velocity, new THREE.Vector3(0, 0, bFieldStrength));
    const bForce = vCrossB.multiplyScalar(particleCharge);

    const totalForce = new THREE.Vector3().addVectors(eForce, bForce);
    if (useGravity) {
        totalForce.y -= 9.81;
    }

    if (totalForce.length() > 0.01) {
        const forceMagnitude = Math.min(totalForce.length() * 0.5, 5); // Limit arrow length
        forceArrow.setDirection(totalForce.normalize());
        forceArrow.setLength(forceMagnitude);
        forceArrow.position.copy(elektronmesh.position);
        forceArrow.visible = showForce;
    } else {
        forceArrow.visible = false;
    }
}

function updateUI() {
    document.getElementById('eFieldValue').textContent = eFieldStrength.toFixed(2);
    document.getElementById('bFieldValue').textContent = bFieldStrength.toFixed(2);
    document.getElementById('speedValue').textContent = particleSpeed.toFixed(2);
    document.getElementById('chargeValue').textContent = particleCharge.toFixed(2);

    // Eingabefelder aktualisieren
    document.getElementById('eFieldInput').value = eFieldStrength;
    document.getElementById('bFieldInput').value = bFieldStrength;
    document.getElementById('speedInput').value = particleSpeed;
    document.getElementById('chargeInput').value = particleCharge;

    const idealVelocity = Math.abs(eFieldStrength / bFieldStrength);
    document.getElementById('idealVelocityValue').textContent = idealVelocity.toFixed(2);

    // Update the position display
    document.getElementById('positionX').textContent = elektronmesh.position.x.toFixed(2);
    document.getElementById('positionY').textContent = elektronmesh.position.y.toFixed(2);
}

function calculateAcceleration() {
    // SKALIERTE KRÄFTE für sichtbare Effekte
    const FORCE_SCALE = 2.0; // Original-Multiplikator beibehalten

    // E-Feld Kraft: F = qE
    const eAcc = new THREE.Vector3(0, eFieldStrength * particleCharge * FORCE_SCALE, 0);

    // Magnetische Kraft: F = q(v × B)
    const vCrossB = new THREE.Vector3();
    vCrossB.crossVectors(velocity, new THREE.Vector3(0, 0, bFieldStrength));
    const bAcc = vCrossB.multiplyScalar(particleCharge * FORCE_SCALE);

    // Gesamtbeschleunigung
    const totalAcc = new THREE.Vector3().addVectors(eAcc, bAcc);

    // Schwerkraft (optional)
    if (useGravity) {
        totalAcc.y -= 9.81 * FORCE_SCALE;
    }

    // Debug-Ausgabe
    console.log("E-Feld Beschleunigung:", eAcc.y);
    console.log("B-Feld Beschleunigung:", bAcc.y);
    console.log("Gesamtbeschleunigung:", totalAcc.y);

    return totalAcc;
}

function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) {
        animationButton.textContent = 'Stop Animation';
        animate();
    } else {
        animationButton.textContent = 'Start Animation';
    }
}

function createUI() {
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    uiContainer.style.padding = '10px';
    uiContainer.style.borderRadius = '5px';
    uiContainer.style.color = 'white';
    uiContainer.style.fontFamily = 'Arial, sans-serif';
    uiContainer.style.zIndex = '1000';
    uiContainer.style.width = '340px';

    uiContainer.innerHTML = `
        <h2 style="text-align: center; margin-top: 0;">Geschwindigkeitsfilter</h2>
        
        <div style="margin-bottom: 15px; display: flex; align-items: center;">
            <div style="flex: 4;">
                <label for="eFieldSlider">E-Feld Stärke: <span id="eFieldValue">5.00</span></label>
                <input type="range" id="eFieldSlider" min="-15" max="15" step="0.5" value="5" style="width: 100%;">
            </div>
            <div style="flex: 1; margin-left: 10px;">
                <input type="number" id="eFieldInput" value="5" step="any" style="width: 100%;">
            </div>
        </div>
        
        <div style="margin-bottom: 15px; display: flex; align-items: center;">
            <div style="flex: 4;">
                <label for="bFieldSlider">B-Feld Stärke: <span id="bFieldValue">2.00</span></label>
                <input type="range" id="bFieldSlider" min="-15" max="15" step="0.5" value="2" style="width: 100%;">
            </div>
            <div style="flex: 1; margin-left: 10px;">
                <input type="number" id="bFieldInput" value="2" step="any" style="width: 100%;">
            </div>
        </div>
        
        <div style="margin-bottom: 15px; display: flex; align-items: center;">
            <div style="flex: 4;">
                <label for="speedSlider">Geschwindigkeit: <span id="speedValue">5.00</span></label>
                <input type="range" id="speedSlider" min="0.5" max="15" step="0.5" value="5" style="width: 100%;">
            </div>
            <div style="flex: 1; margin-left: 10px;">
                <input type="number" id="speedInput" value="5" step="any" min="0" style="width: 100%;">
            </div>
        </div>
        
        <div style="margin-bottom: 15px; display: flex; align-items: center;">
            <div style="flex: 4;">
                <label for="chargeSlider">Ladung: <span id="chargeValue">-1.00</span></label>
                <input type="range" id="chargeSlider" min="-3" max="3" step="0.5" value="-1" style="width: 100%;">
            </div>
            <div style="flex: 1; margin-left: 10px;">
                <input type="number" id="chargeInput" value="-1" step="any" style="width: 100%;">
            </div>
        </div>
        
        <div style="border: 1px solid white; padding: 8px; margin-bottom: 15px; text-align: center;">
            Ideale Geschwindigkeit: <span id="idealVelocityValue">2.50</span>
        </div>
        
        <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 15px;">
            <div style="flex: 1 0 50%;">
                <label><input type="checkbox" id="showEField" checked> E-Feld zeigen</label>
            </div>
            <div style="flex: 1 0 50%;">
                <label><input type="checkbox" id="showArrows" checked> Pfeile zeigen</label>
            </div>
            <div style="flex: 1 0 50%;">
                <label><input type="checkbox" id="showForce" checked> Kraft zeigen</label>
            </div>
            <div style="flex: 1 0 50%;">
                <label><input type="checkbox" id="useGravity"> Schwerkraft</label>
            </div>
        </div>
        
        <div style="text-align: center; margin-bottom: 15px;">
            <button id="resetButton" style="padding: 5px 10px; margin-right: 10px;">Reset</button>
            <button id="animationButton" style="padding: 5px 10px;">Start Animation</button>
        </div>
        
        <div style="border: 1px solid white; padding: 8px; text-align: center;">
            Position: X: <span id="positionX">-8.00</span>, Y: <span id="positionY">0.00</span>
        </div>
    `;

    document.body.appendChild(uiContainer);

    // Event-Listener für die UI-Elemente
    document.getElementById('eFieldSlider').addEventListener('input', function(e) {
        eFieldStrength = parseFloat(e.target.value);
        updateUI();
        updateFieldPolarities(); // Aktualisiere die Polaritäten basierend auf dem neuen E-Feld
        resetParticle();
    });

    document.getElementById('eFieldInput').addEventListener('change', function(e) {
        eFieldStrength = parseFloat(e.target.value);
        // Nur den Slider aktualisieren, wenn der Wert innerhalb des Bereichs liegt
        if (eFieldStrength >= -15 && eFieldStrength <= 15) {
            document.getElementById('eFieldSlider').value = eFieldStrength;
        }
        updateUI();
        updateFieldPolarities();
        resetParticle();
    });

    document.getElementById('bFieldSlider').addEventListener('input', function(e) {
        bFieldStrength = parseFloat(e.target.value);
        updateUI();
        resetParticle();
    });

    document.getElementById('bFieldInput').addEventListener('change', function(e) {
        bFieldStrength = parseFloat(e.target.value);
        // Nur den Slider aktualisieren, wenn der Wert innerhalb des Bereichs liegt
        if (bFieldStrength >= -15 && bFieldStrength <= 15) {
            document.getElementById('bFieldSlider').value = bFieldStrength;
        }
        updateUI();
        resetParticle();
    });

    document.getElementById('speedSlider').addEventListener('input', function(e) {
        particleSpeed = parseFloat(e.target.value);
        updateUI();
        resetParticle();
    });

    document.getElementById('speedInput').addEventListener('change', function(e) {
        particleSpeed = parseFloat(e.target.value);
        // Nur den Slider aktualisieren, wenn der Wert innerhalb des Bereichs liegt
        if (particleSpeed >= 0.5 && particleSpeed <= 15) {
            document.getElementById('speedSlider').value = particleSpeed;
        }
        updateUI();
        resetParticle();
    });

    document.getElementById('chargeSlider').addEventListener('input', function(e) {
        particleCharge = parseFloat(e.target.value);
        updateUI();
        resetParticle();
    });

    document.getElementById('chargeInput').addEventListener('change', function(e) {
        particleCharge = parseFloat(e.target.value);
        // Nur den Slider aktualisieren, wenn der Wert innerhalb des Bereichs liegt
        if (particleCharge >= -3 && particleCharge <= 3) {
            document.getElementById('chargeSlider').value = particleCharge;
        }
        updateUI();
        resetParticle();
    });

    document.getElementById('useGravity').addEventListener('change', function(e) {
        useGravity = e.target.checked;
    });

    document.getElementById('showEField').addEventListener('change', function(e) {
        toggleEField(e.target.checked);
    });

    document.getElementById('showArrows').addEventListener('change', function(e) {
        toggleArrows(e.target.checked);
    });

    document.getElementById('showForce').addEventListener('change', function(e) {
        showForce = e.target.checked;
        forceArrow.visible = showForce && isAnimating;
    });

    document.getElementById('resetButton').addEventListener('click', resetParticle);

    animationButton = document.getElementById('animationButton');
    animationButton.addEventListener('click', toggleAnimation);

    // Initialize UI
    updateUI();
}

function animate() {
    if (!isAnimating) return;

    requestAnimationFrame(animate);

    // Beschleunigung berechnen
    const acceleration = calculateAcceleration();

    // Geschwindigkeit aktualisieren
    velocity.addScaledVector(acceleration, dt);

    // Position aktualisieren
    elektronmesh.position.addScaledVector(velocity, dt);

    // Kraftpfeil aktualisieren
    updateForceArrow();

    // UI aktualisieren
    updateUI();

    // Zurücksetzen, wenn das Teilchen zu weit entfernt ist
    if (Math.abs(elektronmesh.position.x) > 8 ||
        Math.abs(elektronmesh.position.y) > 25 ||
        Math.abs(elektronmesh.position.z) > 25) {
        resetParticle();
    }

    // Rendering
    renderer.render(scene, camera);
    controls.update();
}

export function init() {
    // Scene setup
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    camera.position.set(-20, 10, 50);

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
        antialias: true
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Add objects to scene - ORIGINAL STRUCTURE
    scene.add(gridhelper);
    scene.add(positiveMagnet);
    scene.add(negativeMagnet);
    scene.add(PlusZeichen);
    scene.add(MinusZeichen);
    scene.add(elektronenkanonemesh);
    scene.add(lightning);
    scene.add(elektronmesh);
    scene.add(forceArrow);

    // Erstelle Feld-Visualisierungen - ORIGINAL
    createEFieldVisualization();

    // Initialisiere die Polaritäten und Pfeile basierend auf dem Anfangs-E-Feld
    updateFieldPolarities();

    // Create UI
    createUI();

    // Reset particle
    resetParticle();

    // Initial render
    renderer.render(scene, camera);

    // Handle window resize
    window.addEventListener('resize', function() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}