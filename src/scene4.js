import './style.css'
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, camera, renderer, controls, sphere;
let isAnimating = false;

// Global variables for Dees
let dee1, dee2;

// Physikalische Konstanten
const m = 1;   // Masse des Teilchens
const q = 1;   // Ladung des Teilchens
const B = 1;   // Magnetfeldstärke
const E = 2;   // elektrische Feldstärke
const radius = 5;
const dt = 0.016; // Zeitschritt

// Simulationsvariablen
let ball1Velocity = new THREE.Vector3(0, 0, 0);
let timeSinceLastEField = 0;
const eFieldInterval = 1; // Zeit zwischen elektrischen Feldimpulsen

// --- Trail variables using tubes ---
let tubeMesh;
const maxTrailLength = 10000; // Maximum number of points
const trailPoints = [];
let frameCount = 0;
const recordEveryNthFrame = 2; // Only record a point every 2nd frame

// ===================================================
//   Functions for the Cyclotron Simulation
// ===================================================

function createDees() {
    // Definiere den Spalt zwischen den Dees (in Radiant)
    const gapAngle = 0.1;
    // Erstelle die Geometrie so, dass ein kleiner Abschnitt fehlt
    const deeGeometry = new THREE.CylinderGeometry(
        radius * 2,
        radius * 2,
        0.1,
        32,
        1,
        false,
        gapAngle / 2,
        Math.PI - gapAngle
    );
    const dee1Material = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5 });
    const dee2Material = new THREE.MeshBasicMaterial({ color: 0x0000ff, transparent: true, opacity: 0.5 });

    dee1 = new THREE.Mesh(deeGeometry, dee1Material);
    dee2 = new THREE.Mesh(deeGeometry, dee2Material);

    // Positioniere den zweiten Dee so, dass ein Spalt zwischen den beiden entsteht.
    dee2.rotation.y = Math.PI;

    scene.add(dee1);
    scene.add(dee2);
}

function calculateMagneticForce(velocity) {
    // Lorentzkraft: F = q * (v x B)
    // Magnetfeld in y-Richtung
    const B_field = new THREE.Vector3(0, B, 0);
    return new THREE.Vector3(
        q * (velocity.y * B_field.z - velocity.z * B_field.y),
        q * (velocity.z * B_field.x - velocity.x * B_field.z),
        q * (velocity.x * B_field.y - velocity.y * B_field.x)
    );
}

function calculateElectricForce(position) {
    // Berechne den Winkel in der x-z Ebene relativ zur x-Achse
    const angleFromX = Math.atan2(position.z, position.x);
    // Prüfe, ob das Teilchen im Spalt zwischen den Dees ist
    const isInGap = Math.abs(Math.abs(angleFromX) - Math.PI / 2) < 0.1;

    if (isInGap && timeSinceLastEField > eFieldInterval) {
        timeSinceLastEField = 0;
        console.log("Richtungsänderung");
        // Bestimme die Richtung des elektrischen Felds basierend auf dem Winkel
        const direction = Math.sign(Math.cos(angleFromX));
        // Ändere die Farben der Dees je nach angelegter Spannung
        if (E * direction > 0) {
            dee1.material.color.set(0xff0000); // Dee1 rot
            dee2.material.color.set(0x0000ff); // Dee2 blau
        } else {
            dee1.material.color.set(0x0000ff); // Dee1 blau
            dee2.material.color.set(0xff0000); // Dee2 rot
        }
        // Wende das elektrische Feld in x-Richtung an
        return new THREE.Vector3(E * direction, 0, 0).multiplyScalar(q);
    }
    return new THREE.Vector3(0, 0, 0);
}

function calculateTotalForce(position, velocity) {
    const magneticForce = calculateMagneticForce(velocity);
    const electricForce = calculateElectricForce(position);
    return magneticForce.add(electricForce);
}

function applyForce() {
    const force = calculateTotalForce(sphere.position, ball1Velocity);
    // Berechne die Beschleunigung
    const acceleration = force.clone().divideScalar(m);

    // Aktualisiere die Geschwindigkeit: v = v + a * dt
    ball1Velocity.add(acceleration.multiplyScalar(dt));

    // Aktualisiere die Position: x = x + v * dt
    sphere.position.add(ball1Velocity.clone().multiplyScalar(dt));

    timeSinceLastEField += dt;
}

// ===================================================
//   Functions for the Particle Trail
// ===================================================

function createTrail() {
    // Starte den Trail mit zwei Punkten (damit ein gültiger Curve entsteht)
    const initialPoint = sphere.position.clone();
    const offsetPoint = sphere.position.clone().add(new THREE.Vector3(0.1, 0, 0)); // leicht versetzt
    trailPoints.push(initialPoint, offsetPoint);
    updateTrailMesh();
}

function updateTrailMesh() {
    // Entferne das alte Mesh, falls vorhanden
    if (tubeMesh) {
        scene.remove(tubeMesh);
        tubeMesh.geometry.dispose();
        tubeMesh.material.dispose();
    }
    // Erstelle einen neuen Tube-Pfad, sofern mindestens 2 Punkte vorhanden sind
    if (trailPoints.length >= 2) {
        try {
            const curve = new THREE.CatmullRomCurve3(trailPoints);
            const geometry = new THREE.TubeGeometry(curve, 20, 0.2, 8, false);
            tubeMesh = new THREE.Mesh(geometry, new THREE.MeshBasicMaterial({ color: 0xffff00 }));
            scene.add(tubeMesh);
        } catch (error) {
            console.error("Error creating tube:", error);
        }
    }
}

function updateTrail() {
    frameCount++;
    if (frameCount % recordEveryNthFrame === 0) {
        // Füge die aktuelle Position des Teilchens zum Trail hinzu
        trailPoints.push(sphere.position.clone());
        // Entferne alte Punkte, falls die maximale Länge überschritten wird
        while (trailPoints.length > maxTrailLength) {
            trailPoints.shift();
        }
        // Stelle sicher, dass mindestens zwei Punkte vorhanden sind
        if (trailPoints.length < 2) {
            const lastPoint = trailPoints[0].clone().add(new THREE.Vector3(0.1, 0, 0));
            trailPoints.push(lastPoint);
        }
        updateTrailMesh();
    }
}

// ===================================================
//   Animation und Initialisierung
// ===================================================

function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);

    // Physics update
    applyForce();

    // Update the trail after physics
    updateTrail();

    controls.update();
    renderer.render(scene, camera);
}

export function init(button) {
    // Szene, Kamera und Renderer initialisieren
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    camera.position.setZ(30);

    // Erzeuge das Teilchen (Kugel)
    const sphereGeometry = new THREE.SphereGeometry(0.5, 32, 16);
    const sphereMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
    // Startposition in der x-z Ebene, z.B. bei (radius, 0, 0)
    sphere.position.set(radius, 0, 0);
    scene.add(sphere);

    // Anfangsgeschwindigkeit (tangential zur Kreisbahn)
    ball1Velocity = new THREE.Vector3(0, 0, (q * B * radius) / m);

    // Dees hinzufügen
    createDees();

    // Trail initialisieren
    createTrail();

    // Licht hinzufügen
    const pointLight = new THREE.PointLight(0xffffff, 50);
    pointLight.position.set(0, 0, 5);
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    scene.add(pointLight);

    // OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 20;
    controls.maxDistance = 100;

    const gridHelper = new THREE.GridHelper(200, 50);
    scene.add(gridHelper);

    renderer.render(scene, camera);

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
}

window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}
