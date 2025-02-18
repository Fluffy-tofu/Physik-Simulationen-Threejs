import './style.css'
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

let scene, camera, renderer, sphere1, sphere2, controls;
let isAnimating = false;

// --- Physics variables ---
// Gravity acceleration (units per second²)
const gravity = new THREE.Vector3(0, -9.81, 0);
// A fixed time step (in seconds) used per frame (note: for a more robust simulation you might want to compute deltaTime dynamically)
const dt = 0.016;
// Bounce damping factor (a value less than 1 makes each bounce lower)
const bounce = 0.8;
// The radius of the spheres (should match the SphereGeometry radius)
const sphereRadius = 15;
// The y-level of the floor
const floorLevel = 0;

// Velocities for each sphere (starting at rest)
let ball1Velocity = new THREE.Vector3(0, 0, 0);
let ball2Velocity = new THREE.Vector3(0, 0, 0);

export function init(button) {
    scene = new THREE.Scene();

    camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
    );

    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg'),
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);

    // Position the camera a bit away so you can see everything.
    camera.position.set(0, 30, 70);

    // --- Create Spheres ---
    // (Using a sphere geometry with radius = 15)
    const geometry = new THREE.SphereGeometry(sphereRadius, 32, 16);
    const material = new THREE.MeshBasicMaterial({ color: 0xFF6347, wireframe: true });
    sphere1 = new THREE.Mesh(geometry, material);
    sphere2 = new THREE.Mesh(geometry, material);

    // Set initial positions for the spheres (so that they are well above the floor)
    sphere1.position.set(-20, 50, 0);
    sphere2.position.set(20, 80, 0);

    scene.add(sphere1);
    scene.add(sphere2);

    // --- Create Floor ---
    // A large plane to serve as the floor.
    const floorGeometry = new THREE.PlaneGeometry(500, 500);
    const floorMaterial = new THREE.MeshBasicMaterial({
        color: 0xFF6347,
        side: THREE.DoubleSide,
        wireframe: true
    });
    const floorMesh = new THREE.Mesh(floorGeometry, floorMaterial);
    // Rotate the plane so it lies in the XZ plane.
    floorMesh.rotation.x = -Math.PI / 2;
    // Position the floor at y = floorLevel.
    floorMesh.position.y = floorLevel;
    scene.add(floorMesh);

    controls = new OrbitControls(camera, renderer.domElement);

    // Start/stop animation when the button is clicked.
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

function animate() {
    if (!isAnimating) return;

    requestAnimationFrame(animate);

    // --- Update Sphere 1 Physics ---
    // Add gravity (acceleration) to the sphere’s velocity.
    ball1Velocity.addScaledVector(gravity, dt);
    // Update position using the velocity.
    sphere1.position.addScaledVector(ball1Velocity, dt);
    // Check for collision with the floor.
    if (sphere1.position.y - sphereRadius < floorLevel) {
        // Snap sphere to floor (so its bottom just touches y = floorLevel)
        sphere1.position.y = floorLevel + sphereRadius;
        // Reverse and dampen the y-velocity to simulate a bounce.
        ball1Velocity.y = -ball1Velocity.y * bounce;
    }

    // --- Update Sphere 2 Physics ---
    ball2Velocity.addScaledVector(gravity, dt);
    sphere2.position.addScaledVector(ball2Velocity, dt);
    if (sphere2.position.y - sphereRadius < floorLevel) {
        sphere2.position.y = floorLevel + sphereRadius;
        ball2Velocity.y = -ball2Velocity.y * bounce;
    }

    controls.update();
    renderer.render(scene, camera);
}
