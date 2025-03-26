import './style.css'
import * as THREE from "../node_modules/three/build/three.module.js";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, camera, renderer, sphere1, sphere2, controls;
let isAnimating = false;

// --- Trail variables using tubes ---
let tubeMesh1, tubeMesh2;
const maxTrailLength = 10000;  // Reduced maximum number of points
const trail1Points = [];
const trail2Points = [];
let frameCount = 0;
const recordEveryNthFrame = 2;  // Only record a point every 3rd frame

// --- Physics variables ---
const dt = 0.016;
const Gravity = 3;
const sphereRadius = 15;
const bounce = 0.5;

const sphereMass1 = 10000;
const sphereMass2 = 10000;

// Starting velocities
let ball1Velocity = new THREE.Vector3(0, 20, 20);
let ball2Velocity = new THREE.Vector3(0, 20, -20);

// --- For camera follow ---
// We’ll follow the midpoint between the two spheres.
let previousMidpoint = new THREE.Vector3();

function createTrails() {
    // Initialize with two points to ensure valid curve creation
    const initialPoint1 = sphere1.position.clone();
    const initialPoint2 = sphere1.position.clone().add(new THREE.Vector3(0.1, 0, 0)); // Slightly offset
    trail1Points.push(initialPoint1, initialPoint2);

    const initialPoint3 = sphere2.position.clone();
    const initialPoint4 = sphere2.position.clone().add(new THREE.Vector3(0.1, 0, 0)); // Slightly offset
    trail2Points.push(initialPoint3, initialPoint4);

    // Create initial tubes with the minimum required points
    updateTrailMeshes();
}

function updateTrailMeshes() {
    // Remove old meshes
    if (tubeMesh1) {
        scene.remove(tubeMesh1);
        tubeMesh1.geometry.dispose();
        tubeMesh1.material.dispose();
    }
    if (tubeMesh2) {
        scene.remove(tubeMesh2);
        tubeMesh2.geometry.dispose();
        tubeMesh2.material.dispose();
    }

    // Create new tubes only if we have enough points
    if (trail1Points.length >= 2) {
        try {
            const curve1 = new THREE.CatmullRomCurve3(trail1Points);
            const geometry1 = new THREE.TubeGeometry(curve1, 20, 0.5, 8, false);
            tubeMesh1 = new THREE.Mesh(
                geometry1,
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            scene.add(tubeMesh1);
        } catch (error) {
            console.error("Error creating tube1:", error);
        }
    }

    if (trail2Points.length >= 2) {
        try {
            const curve2 = new THREE.CatmullRomCurve3(trail2Points);
            const geometry2 = new THREE.TubeGeometry(curve2, 20, 0.5, 8, false);
            tubeMesh2 = new THREE.Mesh(
                geometry2,
                new THREE.MeshBasicMaterial({ color: 0x00ff00 })
            );
            scene.add(tubeMesh2);
        } catch (error) {
            console.error("Error creating tube2:", error);
        }
    }
}

function updateTrails() {
    frameCount++;

    // Only record points every Nth frame
    if (frameCount % recordEveryNthFrame === 0) {
        // Add current positions to trails
        trail1Points.push(sphere1.position.clone());
        trail2Points.push(sphere2.position.clone());

        // Remove oldest points if exceeding max length
        while (trail1Points.length > maxTrailLength) {
            trail1Points.shift();
        }
        while (trail2Points.length > maxTrailLength) {
            trail2Points.shift();
        }

        // Ensure we always have at least 2 points
        if (trail1Points.length < 2) {
            const lastPoint = trail1Points[0].clone();
            lastPoint.add(new THREE.Vector3(0.1, 0, 0));
            trail1Points.push(lastPoint);
        }
        if (trail2Points.length < 2) {
            const lastPoint = trail2Points[0].clone();
            lastPoint.add(new THREE.Vector3(0.1, 0, 0));
            trail2Points.push(lastPoint);
        }

        updateTrailMeshes();
    }
}

function acceleration(sphere1, sphere2) {
    const r = sphere1.position.clone().sub(sphere2.position);
    const distance = r.length();
    const direction = r.clone().normalize();

    const forceMagnitude = Gravity * ((sphereMass1 * sphereMass2) / (distance * distance));
    const force = direction.multiplyScalar(forceMagnitude);

    return {
        a1: force.clone().multiplyScalar(-1).divideScalar(sphereMass1),
        a2: force.clone().divideScalar(sphereMass2),
        distance: distance
    };
}

function handleCollision() {
    const temp = ball1Velocity.clone();
    ball1Velocity.multiplyScalar(bounce);
    ball2Velocity.multiplyScalar(bounce);
    ball1Velocity.add(ball2Velocity.clone().multiplyScalar(0.1));
    ball2Velocity.add(temp.multiplyScalar(0.1));

    const direction = sphere1.position.clone().sub(sphere2.position).normalize();
    sphere1.position.add(direction.multiplyScalar(0.1));
    sphere2.position.sub(direction.multiplyScalar(0.1));
}

function applyForce() {
    const acc = acceleration(sphere1, sphere2);

    ball1Velocity.add(acc.a1.multiplyScalar(dt));
    ball2Velocity.add(acc.a2.multiplyScalar(dt));

    sphere1.position.add(ball1Velocity.clone().multiplyScalar(dt));
    sphere2.position.add(ball2Velocity.clone().multiplyScalar(dt));

    if (acc.distance < sphereRadius * 2) {
        handleCollision();
    }
}

function animate() {
    if (!isAnimating) return;

    requestAnimationFrame(animate);

    applyForce();
    updateTrails();

    // --- Camera follow logic ---
    // Compute the current midpoint between the two spheres.
    const currentMidpoint = sphere1.position.clone().add(sphere2.position).multiplyScalar(0.5);
    // Compute how far the midpoint moved since the last frame.
    const delta = currentMidpoint.clone().sub(previousMidpoint);
    // Shift the camera and the orbit controls target by the same offset.
    camera.position.add(delta);
    controls.target.add(delta);
    // Update our previous midpoint for the next frame.
    previousMidpoint.copy(currentMidpoint);

    controls.update();
    renderer.render(scene, camera);
}

export function init(button) {
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);

    // Setup camera
    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    // Setup renderer
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    camera.position.set(0, 30, 70);

    // Create spheres
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 16);
    const material1 = new THREE.MeshBasicMaterial({ color: 0xFF6347, wireframe: true });
    const material2 = new THREE.MeshBasicMaterial({ color: 0x4169E1, wireframe: true });

    sphere1 = new THREE.Mesh(geometry, material1);
    sphere2 = new THREE.Mesh(geometry, material2);

    // Set initial positions
    sphere1.position.set(-20, 50, 0);
    sphere2.position.set(20, 80, 0);

    scene.add(sphere1);
    scene.add(sphere2);

    // Create tube trails for the spheres
    createTrails();

    // Setup OrbitControls
    controls = new OrbitControls(camera, renderer.domElement);

    // Initialize the previous midpoint (center of the two spheres) for camera follow
    previousMidpoint.copy(
        sphere1.position.clone().add(sphere2.position).multiplyScalar(0.5)
    );
    controls.target.copy(previousMidpoint);

    // Toggle animation on button click
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
