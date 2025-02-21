import { ThemeContext } from '@emotion/react';
import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

let scene, camera, renderer, controls;
let isAnimating = false;
let animationButton; // Store reference to the button

// --- Physics variables ---
// Gravity acceleration (units per second²)
const gravity = new THREE.Vector3(0, -9.81, 0);
// A fixed time step (in seconds) used per frame (note: for a more robust simulation you might want to compute deltaTime dynamically)
const dt = 0.016;

const elektronmass = 1;
const C = 1.602176634e-19;  // Coulomb
const elektroncharge = -100000;
const q = elektroncharge * C;
console.log(q);
const bfieldstrenght = 10000000000000; //Tesla
const efieldstrenght = 100000000000000; // V/m
const selectedspeed = 10;
const initialspeed = new THREE.Vector3(selectedspeed,0,0);
//B_feld speed
const lorentzkraft = new THREE.Vector3(0, q*initialspeed.x*bfieldstrenght, 0);

console.log("lorenzkraft:");
console.log(lorentzkraft);

//E-Feld speed
const elektrischekraft = new THREE.Vector3(0, -1*(q*efieldstrenght), 0);
console.log("elktrischekraft:");
console.log(elektrischekraft);

//function calculateacceleration() {

    //const efieldacceratoin = THREE.Vector3(0, (q * efieldstrenght)/elektronmass, 0);
    //const accelerationsmth2 = THREE.Vector3(0, -1 * (q * initialspeed.x * bfieldstrenght)/elektronmass, 0);
//}


//for future toggles
const showarrows = false;
const showefield = false;
const showelektrons = true;





//different Magnets
const Magnets = new THREE.BoxGeometry(10, 1, 1)

//red magnet
const Redmaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000 
});
const postiveMagnet = new THREE.Mesh(Magnets, Redmaterial);
postiveMagnet.position.setY(-5)

//green magnet
const Greenmaterial = new THREE.MeshBasicMaterial({
  color: 0x00FF00
});
const negativeMagnet = new THREE.Mesh(Magnets, Greenmaterial);
negativeMagnet.position.setY(5)

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
PlusZeichen.position.setY(-5);

//MinusZeichen
const MinusZeichen = new THREE.Group();
MinusZeichen.add(WaagerechterStrichMeshfürMinuszeichen);
MinusZeichen.position.setY(5);

//Koordinatensystem
const gridsize = 50;
const griddivisions = 100;
const centerlinecolor = 0xffffff;
const gridlinecolor = 0x444444;
const gridhelper = new THREE.GridHelper(gridsize, griddivisions, centerlinecolor, gridlinecolor);
gridhelper.rotation.x = Math.PI/2;
gridhelper.position.x = -5;
gridhelper.material.transparent = true;
gridhelper.material.opacity = 0.75;



const elektronenkanone = new THREE.BoxGeometry(4, 1);
const elektronenkanonemesh = new THREE.Mesh(elektronenkanone, WhiteMaterial); //change this later to look better
elektronenkanonemesh.position.setX(-8);








function toggleAnimation() {
    isAnimating = !isAnimating;
    if (isAnimating) {
        animationButton.textContent = 'Stop Animation';
        animate();
    } else {
        animationButton.textContent = 'Start Animation';
    }
}



// Handle keyboard controls
function handleKeyPress(event) {
    if (event.code === 'Space') {
        event.preventDefault(); // Prevent page scrolling
        toggleAnimation();
    }
}

export function init(button) {
    animationButton = button; // Store button reference
    
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
    scene.add(gridhelper);
    scene.add(elektronenkanonemesh);

    for (let i = -7; i < 4; i++) {
        const arrowdirection = new THREE.Vector3(); //upwards
        const arroworigin = new THREE.Vector3(0, -5, 0)
        const arrowlength = 9.5;
        const arrowcolor = 0xFFFFFF;
        const arrowheadlength = 1.5;
        const arrowhelper = new THREE.ArrowHelper(arrowdirection, arroworigin, arrowlength, arrowcolor, arrowheadlength);
        arrowhelper.position.x = i + 2;
    
        if (showarrows == true) {
            scene.add(arrowhelper);
            console.log("arrows are enabled");
        } else {
            console.log("arrows are disabled");
        };
    }

    for (let i = -7; i<4; i++){
        for(let y = -6; y<3; y++){

            const efliedinnerradius = 0.2;
            const efliedouterradius = efliedinnerradius + 0.05;
            const efieldsegments = 32;
            const efield = new THREE.RingGeometry(efliedinnerradius, efliedouterradius, efieldsegments);
            
            const efliedinnterpoint = new THREE.CircleGeometry(efliedinnerradius/4);
            const efieldmesh = new THREE.Mesh(efield);
            const efieldinnerpointmesh = new THREE.Mesh(efliedinnterpoint);

            const completeefield = new THREE.Group();
            completeefield.add(efieldmesh);
            completeefield.add(efieldinnerpointmesh);
            
            completeefield.position.x = i + 2;
            completeefield.position.y = y + 2;
            //Philip help how tf do i make it go in both x and y without makeing a whole new one??
            //completeefield.position.y = i + 2;

            completeefield.visible = showefield;
            scene.add(completeefield);
        }
    }

    //elektronen versuchen zu machen
    



    // Setup controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Initial render
    renderer.render(scene, camera);

    // Setup animation toggle via button
    button.addEventListener('click', toggleAnimation);
    
    // Setup animation toggle via spacebar
    document.addEventListener('keydown', handleKeyPress);
}



const elektronradius = 10;
const elektron = new THREE.SphereGeometry(elektronradius);
const elektronmesh = new THREE.Mesh(
    elektron,
    new THREE.MeshBasicMaterial({ color: 0xFFFF })
);
elektronmesh.position.setX(-8); //approx position of the elektronenekanone


const elektronvelocity = new THREE.Vector3(0, 0, 0);

function animate() {
    if (!isAnimating) return;

    requestAnimationFrame(animate);

    // Update velocity with gravity
    elektronvelocity.add(gravity.clone().multiplyScalar(dt));
    elektronvelocity.add(initialspeed.clone().multiplyScalar(dt));
    elektronvelocity.add(lorentzkraft.clone().multiplyScalar(dt));
    elektronvelocity.add(elektrischekraft.clone().multiplyScalar(dt));


    // Update position using velocity
    elektronmesh.position.add(elektronvelocity.clone().multiplyScalar(dt));

    // Update visibility
    elektronmesh.visible = showelektrons;
    scene.add(elektronmesh);
    renderer.render(scene, camera);
}


// Handle window resizing
window.addEventListener('resize', onWindowResize, false);

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}