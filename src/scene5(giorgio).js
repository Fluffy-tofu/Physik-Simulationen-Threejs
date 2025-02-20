import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth/window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg')
});

renderer.setPixelRatio(window.devicePixelRatio);
renderer.setSize(window.innerWidth, window.innerHeight);
camera.position.setZ(3);
camera.position.setY(8);
camera.position.setX(-10);

//different Magnets
const Magnets = new THREE.BoxGeometry(10, 1 , 1)

//red magnet
const Redmaterial = new THREE.MeshBasicMaterial({
  color: 0xFF0000 
});
const postiveMagnet = new THREE.Mesh(Magnets, Redmaterial);
postiveMagnet.position.setY(5)
scene.add(postiveMagnet)



//green magnet
const Greenmaterial = new THREE.MeshBasicMaterial({
  color: 0x00FF00
});
const negativeMagnet = new THREE.Mesh(Magnets, Greenmaterial);
negativeMagnet.position.setY(-5)
scene.add(negativeMagnet)


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
scene.add(PlusZeichen)

//MinusZeichen
const MinusZeichen = new THREE.Group();
MinusZeichen.add(WaagerechterStrichMeshfürMinuszeichen);
MinusZeichen.position.setY(-5);
scene.add(MinusZeichen)

//Koordinatensystem
const BlackMaterial = new THREE.MeshBasicMaterial({
  color: 0x00000
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
scene.add(Koordinatensystem)

//controls with mouse
const contorls = new OrbitControls(camera, renderer.domElement);



//const axesHelper = new THREE.AxesHelper(10);
//scene.add(axesHelper);


function animate() {
  requestAnimationFrame( animate );
  renderer.render( scene, camera);
}

animate()
