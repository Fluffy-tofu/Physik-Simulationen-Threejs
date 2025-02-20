import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let scene, camera, renderer, controls;
let isAnimating = false;

//different Magnets
const Magnets = new THREE.BoxGeometry(10, 1, 1)

//red magnet
const Redmaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000 
});
const postiveMagnet = new THREE.Mesh(Magnets, Redmaterial);
postiveMagnet.position.setY(5)

//green magnet
const Greenmaterial = new THREE.MeshBasicMaterial({
  color: 0x00FF00
});
const negativeMagnet = new THREE.Mesh(Magnets, Greenmaterial);
negativeMagnet.position.setY(-5)

//Zeichen auf den Magneten
const WaagerechterStrich = new THREE.BoxGeometry(0.9, 0.1, 1.1);
const SenkrechterStrich = new THREE.BoxGeometry(0.1, 0.9, 1.1);

const WhiteMaterial = new THREE.MeshBasicMaterial({
  color: 0xffffff
});

//Meshes machen um sie groupen zu können
const WaagerechterStrichMeshfürPluszeichen = new THREE.Mesh(WaagerechterStrich, WhiteMaterial);
const SenkrechterStrichMeshfürPlusZeichen = new THREE.Mesh(SenkrechterStrich, WhiteMaterial);
const WaagerechterStrichMeshfürMinuszeichen = new THREE.Mesh(WaagerechterStrich, WhiteMaterial);

//Groupen
//Plusszeichen
const PlusZeichen = new THREE.Group();
PlusZeichen.add(WaagerechterStrichMeshfürPluszeichen);
PlusZeichen.add(SenkrechterStrichMeshfürPlusZeichen);
PlusZeichen.position.setY(5);

//MinusZeichen
const MinusZeichen = new THREE.Group();
MinusZeichen.add(WaagerechterStrichMeshfürMinuszeichen);
MinusZeichen.position.setY(-5);

//Koordinatensystem
const BlackMaterial = new THREE.MeshBasicMaterial({
  color: 0x000000
});
const xAchse = new THREE.BoxGeometry(10, 0.05, 0.2);
const yAchse = new THREE.BoxGeometry(0.05, 10, 0.2);
const WeiserHintergrund = new THREE.BoxGeometry(5, 5, 0.1);

const xAchseMesh = new THREE.Mesh(xAchse, BlackMaterial);
const yAchseMesh = new THREE.Mesh(yAchse, BlackMaterial);
const WeiserHintergrundMesh = new THREE.Mesh(WeiserHintergrund, WhiteMaterial);
const Koordinatensystem = new THREE.Group();
Koordinatensystem.add(yAchseMesh);
Koordinatensystem.add(xAchseMesh);
Koordinatensystem.add(WeiserHintergrundMesh);

function animate() {
    if (!isAnimating) return;
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

export function init(button) {
    // Scene setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
    renderer = new THREE.WebGLRenderer({
        canvas: document.querySelector('#bg')
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Adjust camera position for better view
    camera.position.setZ(20);
    camera.position.setY(10);
    camera.position.setX(-10);

    // Add all objects to scene
    scene.add(postiveMagnet);
    scene.add(negativeMagnet);
    scene.add(PlusZeichen);
    scene.add(MinusZeichen);
    scene.add(Koordinatensystem);

    // Add lighting
    const pointLight = new THREE.PointLight(0xffffff, 50);
    pointLight.position.set(0, 0, 5);
    const ambientLight = new THREE.AmbientLight(0xffffff);
    scene.add(ambientLight);
    scene.add(pointLight);

    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Initial render
    renderer.render(scene, camera);

    // Setup animation toggle
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

// Handle window resizing
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}