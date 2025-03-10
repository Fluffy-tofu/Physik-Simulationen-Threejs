// src/js/main.js
// noinspection LanguageDetectionInspection

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

class HallEffectSimulation {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.electrons = [];
        this.arrows = new Map();
        this.isPaused = false;
        this.magnetGroup = null;
        this.tutorialActive = false;
        this.currentTutorialStep = 0;
        this.originalMaterials = new Map();
        this.tutorialSteps = [
            {
                text: "Dies ist der Leiter, durch den ein elektrischer Strom fließt. Die blauen Kugeln repräsentieren die Elektronen, die sich von links nach rechts bewegen. Der Hall-Effekt entsteht, wenn diese Elektronen einem Magnetfeld ausgesetzt werden.",
                highlight: "conductor"
            },
            {
                text: "Das externe Magnetfeld (grüne Pfeile) verläuft senkrecht zum Stromfluss. Nach der rechten-Hand-Regel übt dieses Magnetfeld eine Kraft auf bewegte Ladungsträger aus. Diese Kraft ist sowohl zur Bewegungsrichtung als auch zum Magnetfeld senkrecht.",
                highlight: "magnetGroup"
            },
            {
                text: "Die Lorentzkraft (Fₗ, blaue Pfeile) ist die physikalische Kraft, die auf bewegte Ladungsträger im Magnetfeld wirkt. Sie folgt der Formel F = q·(v×B). Bei negativen Ladungen wie Elektronen ist die Kraftrichtung entgegengesetzt zur Regel für positive Ladungen.",
                highlight: "lorentz"
            },
            {
                text: "Die Ablenkung der Elektronen bewirkt eine Ladungstrennung im Material: Elektronen sammeln sich auf einer Seite, während auf der gegenüberliegenden Seite ein Elektronenmangel entsteht. Dadurch bildet sich ein elektrisches Feld mit einer messbaren Querspannung (gelbe Pfeile) – die Hall-Spannung UH.",
                highlight: "hallVoltageArrows"
            },
            {
                text: "Mit den Reglern können Sie experimentieren: Die Stromstärke (I) bestimmt die Elektronengeschwindigkeit, das Magnetfeld (B) die Stärke der Lorentzkraft. Der Hall-Koeffizient RH hängt vom Material ab und bestimmt das Vorzeichen und die Größe der Hall-Spannung nach der Formel UH = RH·(I·B)/d, wobei d die Leiterdicke ist.",
                highlight: "controls"
            }
        ];

        // Konstanten für die Simulation
        this.CONDUCTOR_LENGTH = 6;
        this.CONDUCTOR_HEIGHT = 0.5;
        this.CONDUCTOR_WIDTH = 1.5; // 'd' in der Hall-Formel
        this.ELECTRON_SPEED = 0.03;
        this.ELECTRON_SIZE = 0.125;
        this.ARROW_LENGTH = 0.3;

        // Magnetfeldgrenzen
        this.MAGNETIC_FIELD_BOUNDS = {
            minX: -1.5,
            maxX: 1.5,
            minY: -1.5,
            maxY: 1.5,
            minZ: -1.5,
            maxZ: 1.5
        };

        // Pfeile zur Visualisierung der Hall-Spannung
        this.hallVoltageArrows = [];

        // Init
        this.init();
        this.createHallVoltageVisualization();
    }

    init() {
        // Renderer
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        document.body.appendChild(this.renderer.domElement);
        this.scene.background = new THREE.Color(0xf5f5dc);

        // Kamera
        this.camera.position.set(5, 5, 10);
        this.camera.lookAt(0, 0, 0);

        // Szenenaufbau
        this.setupLighting();
        this.createConductor();
        this.createMagnet();
        this.createElectrons(15);
        this.createChargeIndicators();

        // Orbit Controls
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // Event Listeners
        this.setupEventListeners();
        this.setupExplanationPanel();
        this.originalExplanationContent = document.getElementById("explanation").innerHTML;


        // Animation
        this.animate();
    }

    setupLighting() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(ambientLight, directionalLight);
    }

    createConductor() {
        const conductorGeometry = new THREE.BoxGeometry(
            this.CONDUCTOR_LENGTH,
            this.CONDUCTOR_HEIGHT,
            this.CONDUCTOR_WIDTH
        );
        const conductorMaterial = new THREE.MeshPhongMaterial({
            color: 0x808080,
            transparent: true,
            opacity: 0.8
        });
        this.conductor = new THREE.Mesh(conductorGeometry, conductorMaterial);
        this.conductor.castShadow = true;
        this.conductor.receiveShadow = true;
        this.scene.add(this.conductor);

        // Kontakte
        const contactGeometry = new THREE.BoxGeometry(0.2, 0.8, 1.2);
        const contactMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });

        const leftContact = new THREE.Mesh(contactGeometry, contactMaterial);
        leftContact.position.x = -this.CONDUCTOR_LENGTH / 2;
        leftContact.scale.z = 1.5;
        this.scene.add(leftContact);

        const rightContact = new THREE.Mesh(contactGeometry, contactMaterial);
        rightContact.position.x = this.CONDUCTOR_LENGTH / 2;
        rightContact.scale.z = 1.5;
        this.scene.add(rightContact);

        // Plus- und Minus-Label
        const addLabel = (text, position) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = 64;
            canvas.height = 64;
            context.fillStyle = "#666666";
            context.font = "bold 48px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(text, 32, 32);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.copy(position);
            sprite.scale.set(0.75, 0.75, 1);
            return sprite;
        };

        const minusPos = new THREE.Vector3(-this.CONDUCTOR_LENGTH / 2 - 0.3, 0, 0);
        const minusLabel = addLabel("-", minusPos);
        this.scene.add(minusLabel);

        const plusPos = new THREE.Vector3(this.CONDUCTOR_LENGTH / 2 + 0.3, 0, 0);
        const plusLabel = addLabel("+", plusPos);
        this.scene.add(plusLabel);
    }

    createMagnet() {
        this.magnetGroup = new THREE.Group();

        const fieldGeometry = new THREE.BoxGeometry(3, 3, 3);
        const fieldMaterial = new THREE.MeshPhongMaterial({
            color: 0x6699ff,
            transparent: true,
            opacity: 0.1
        });
        const fieldRegion = new THREE.Mesh(fieldGeometry, fieldMaterial);
        this.magnetGroup.add(fieldRegion);

        // Magnetfeldlinien mit 3 Layern in jeder Richtung
        const fieldLineMaterial = new THREE.LineBasicMaterial({
            color: 0x00ff00,
            transparent: true,
            opacity: 0.5,
            depthTest: false,
            depthWrite: false
        });

        const layers = 4;
        const spacing = 0.6;
        const numPoints = 50;
        for (let i = 0; i < layers; i++) {
            for (let j = 0; j < layers; j++) {
                const points = [];
                // Calculate centered start positions:
                const startX = (i - (layers - 1) / 2) * spacing;
                const startZ = (j - (layers - 1) / 2) * spacing;

                for (let k = 0; k < numPoints; k++) {
                    const y = (k / (numPoints - 1)) * 4 - 2;
                    let x_pos = startX;
                    let z_pos = startZ;
                    if (Math.abs(y) > 1) {
                        const distanceFromCenter = Math.sqrt(startX * startX + startZ * startZ);
                        const angle = Math.atan2(startZ, startX);
                        const curveFactor = -0.3 * Math.pow(Math.abs(y) - 1, 2);
                        const scaledCurve = curveFactor * (distanceFromCenter / 1.2);
                        x_pos += scaledCurve * Math.cos(angle);
                        z_pos += scaledCurve * Math.sin(angle);
                    }
                    points.push(new THREE.Vector3(x_pos, y, z_pos));
                }
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, fieldLineMaterial);
                this.magnetGroup.add(line);
            }
        }


        // Pole
        const poleGeometry = new THREE.BoxGeometry(1.5, 1, 1.5);
        const southPole = new THREE.Mesh(
            poleGeometry,
            new THREE.MeshPhongMaterial({ color: 0x6666ff })
        );
        southPole.position.y = 2;

        const northPole = new THREE.Mesh(
            poleGeometry,
            new THREE.MeshPhongMaterial({ color: 0xff6666 })
        );
        northPole.position.y = -2;

        this.magnetGroup.add(southPole);
        this.magnetGroup.add(northPole);

        // Pole-Labels
        const addLabel = (text, y, color) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = 64;
            canvas.height = 64;
            context.fillStyle = color;
            context.font = "bold 48px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(text, 32, 32);
            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(0, y, 0);
            sprite.scale.set(0.5, 0.5, 1);
            return sprite;
        };

        this.magnetGroup.add(addLabel("S", 3, "#0000ff"));
        this.magnetGroup.add(addLabel("N", -3, "#ff0000"));

        this.scene.add(this.magnetGroup);
    }

    createElectrons(count) {
        const electronGeometry = new THREE.SphereGeometry(this.ELECTRON_SIZE);
        const electronMaterial = new THREE.MeshPhongMaterial({ color: 0x0000ff });
        for (let i = 0; i < count; i++) {
            const electron = new THREE.Mesh(electronGeometry, electronMaterial);
            electron.position.x = (Math.random() - 0.5) * (this.CONDUCTOR_LENGTH - 1);
            electron.position.y = 0;
            electron.position.z = (Math.random() - 0.5) * (this.CONDUCTOR_WIDTH - 0.2);
            // Ausgangsposition speichern
            electron.userData.originalPosition = electron.position.clone();
            electron.castShadow = true;
            this.scene.add(electron);
            this.electrons.push(electron);
            this.createArrowsForElectron(electron);
        }
    }

    createArrowsForElectron(electron) {
        const arrowSet = {
            I: new THREE.ArrowHelper(
                new THREE.Vector3(1, 0, 0),
                electron.position,
                this.ARROW_LENGTH,
                0xff0000
            ),
            B: new THREE.ArrowHelper(
                new THREE.Vector3(0, 1, 0),
                electron.position,
                this.ARROW_LENGTH,
                0x00ff00
            ),
            Fl: new THREE.ArrowHelper(
                new THREE.Vector3(0, 0, -1),
                electron.position,
                this.ARROW_LENGTH,
                0x0000ff
            ),
            Fe: new THREE.ArrowHelper(
                new THREE.Vector3(0, 0, 1),
                electron.position,
                this.ARROW_LENGTH,
                0xff00ff
            )
        };
        Object.values(arrowSet).forEach(arrow => {
            arrow.line.material.linewidth = 2;
            this.scene.add(arrow);
        });
        this.arrows.set(electron, arrowSet);
    }

    createChargeIndicators() {
        // Boxen für Ladungsüberschuss und -mangel
        const indicatorGeometry = new THREE.BoxGeometry(0.2, this.CONDUCTOR_HEIGHT, 0.3);

        const plusMaterial = new THREE.MeshPhongMaterial({
            color: 0xff0000,
            transparent: true,
            opacity: 0.7,
            depthTest: false,
            depthWrite: false
        });
        const minusMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000ff,
            transparent: true,
            opacity: 0.7,
            depthTest: false,
            depthWrite: false
        });

        this.chargeIndicators = {};
        this.chargeIndicators.plus = new THREE.Mesh(indicatorGeometry, plusMaterial);
        this.chargeIndicators.minus = new THREE.Mesh(indicatorGeometry, minusMaterial);

        // Positionen: Rot (Elektronenüberschuss) auf der negativen Z-Seite, Blau (Elektronenmangel) auf der positiven
        this.chargeIndicators.plus.position.set(0, 0, -this.CONDUCTOR_WIDTH / 2);
        this.chargeIndicators.minus.position.set(0, 0, this.CONDUCTOR_WIDTH / 2);

        this.scene.add(this.chargeIndicators.plus);
        this.scene.add(this.chargeIndicators.minus);

        // Labels für die Indikatoren
        const createLabel = (text, position, color) => {
            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            canvas.width = 256;
            canvas.height = 128;

            context.fillStyle = color;
            context.font = "bold 18px Arial";
            context.textAlign = "center";
            context.textBaseline = "middle";
            context.fillText(text, canvas.width / 2, canvas.height / 2);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });
            spriteMaterial.renderOrder = 9999;

            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.renderOrder = 9999;
            sprite.center.set(0.5, 0.5);
            sprite.position.copy(position);
            sprite.position.x += 0.3;
            sprite.scale.set(1.5, 0.75, 1);

            return sprite;
        };

        this.chargeIndicators.plusLabel = createLabel(
            "Elektronenmangel +",
            this.chargeIndicators.plus.position.clone(),
            "#ff0000"
        );
        this.chargeIndicators.minusLabel = createLabel(
            "Elektronenüberschuss -",
            this.chargeIndicators.minus.position.clone(),
            "#0000ff"
        );

        this.scene.add(this.chargeIndicators.plusLabel);
        this.scene.add(this.chargeIndicators.minusLabel);
    }

    updateChargeIndicators() {
        const hallCoefficient = this.getHallCoefficient();
        // If the material’s Hall coefficient is negative,
        // the red cube (“Elektronenüberschuss”) should be on the negative Z side
        // and the blue cube (“Elektronenmangel”) on the positive Z side.
        if (hallCoefficient < 0) {
            this.chargeIndicators.plus.position.set(0, 0, -this.CONDUCTOR_WIDTH / 2);
            this.chargeIndicators.minus.position.set(0, 0, this.CONDUCTOR_WIDTH / 2);
            this.chargeIndicators.plusLabel.position.set(0.3, 0, -this.CONDUCTOR_WIDTH / 2);
            this.chargeIndicators.minusLabel.position.set(0.3, 0, this.CONDUCTOR_WIDTH / 2);
        } else {
            // For positive Hall coefficient, swap the positions:
            // the red cube moves to the positive Z side and the blue cube to the negative Z side.
            this.chargeIndicators.plus.position.set(0, 0, this.CONDUCTOR_WIDTH / 2);
            this.chargeIndicators.minus.position.set(0, 0, -this.CONDUCTOR_WIDTH / 2);
            this.chargeIndicators.plusLabel.position.set(0.3, 0, this.CONDUCTOR_WIDTH / 2);
            this.chargeIndicators.minusLabel.position.set(0.3, 0, -this.CONDUCTOR_WIDTH / 2);
        }
    }


    createHallVoltageVisualization() {
        const arrowLength = this.CONDUCTOR_WIDTH;
        const arrowOffset = 0.2;

        // Create arrows for both sides of the conductor
        // Arrows on positive Z side (pointing to -Z direction)
        const topArrowPosZ = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, this.CONDUCTOR_HEIGHT / 2 + arrowOffset, this.CONDUCTOR_WIDTH / 2),
            arrowLength,
            0xffff00,
            0.2,
            0.15
        );
        topArrowPosZ.line.material.linewidth = 3;
        this.scene.add(topArrowPosZ);
        
        const bottomArrowPosZ = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, -1),
            new THREE.Vector3(0, -this.CONDUCTOR_HEIGHT / 2 - arrowOffset, this.CONDUCTOR_WIDTH / 2),
            arrowLength,
            0xffff00,
            0.2,
            0.15
        );
        bottomArrowPosZ.line.material.linewidth = 3;
        this.scene.add(bottomArrowPosZ);

        // Arrows on negative Z side (pointing to +Z direction)
        const topArrowNegZ = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, this.CONDUCTOR_HEIGHT / 2 + arrowOffset, -this.CONDUCTOR_WIDTH / 2),
            arrowLength,
            0xffff00,
            0.2,
            0.15
        );
        topArrowNegZ.line.material.linewidth = 3;
        this.scene.add(topArrowNegZ);
        
        const bottomArrowNegZ = new THREE.ArrowHelper(
            new THREE.Vector3(0, 0, 1),
            new THREE.Vector3(0, -this.CONDUCTOR_HEIGHT / 2 - arrowOffset, -this.CONDUCTOR_WIDTH / 2),
            arrowLength,
            0xffff00,
            0.2,
            0.15
        );
        bottomArrowNegZ.line.material.linewidth = 3;
        this.scene.add(bottomArrowNegZ);

        // Store all arrows with their positions for easier reference
        this.hallVoltageArrows = [
            { arrow: topArrowPosZ, side: "posZ" },
            { arrow: bottomArrowPosZ, side: "posZ" },
            { arrow: topArrowNegZ, side: "negZ" },
            { arrow: bottomArrowNegZ, side: "negZ" }
        ];
    }

    isInMagneticField(position) {
        return (
            position.x >= this.MAGNETIC_FIELD_BOUNDS.minX &&
            position.x <= this.MAGNETIC_FIELD_BOUNDS.maxX &&
            position.y >= this.MAGNETIC_FIELD_BOUNDS.minY &&
            position.y <= this.MAGNETIC_FIELD_BOUNDS.maxY &&
            position.z >= this.MAGNETIC_FIELD_BOUNDS.minZ &&
            position.z <= this.MAGNETIC_FIELD_BOUNDS.maxZ
        );
    }

    calculateHallVoltage() {
        const current = this.getCurrentValue();
        const magneticField = this.getMagneticFieldValue();
        const hallCoefficient = this.getHallCoefficient();
        // U_H = RH * (I * B) / d   (wobei d = CONDUCTOR_WIDTH)
        const hallVoltage = hallCoefficient * (current * magneticField) / this.CONDUCTOR_WIDTH;

        const hallVoltageElement = document.getElementById("hallVoltage");
        if (hallVoltageElement) {
            // Show only the value without the formula
            hallVoltageElement.textContent = `Hall-Spannung: ${hallVoltage.toFixed(2)} V`;
        }

        // Update hall voltage arrows visibility based on hall coefficient sign
        this.hallVoltageArrows.forEach(arrowObj => {
            const arrow = arrowObj.arrow;
            const side = arrowObj.side;
            const shouldBeVisible = Math.abs(hallVoltage) > 0.1;
            
            // For negative hall coefficient, show arrows from posZ to negZ
            // For positive hall coefficient, show arrows from negZ to posZ
            if (hallCoefficient < 0) {
                // If negative RH, show arrows on posZ side (default direction is already correct)
                arrow.visible = shouldBeVisible && side === "posZ";
            } else {
                // If positive RH, show arrows on negZ side (default direction is already correct)
                arrow.visible = shouldBeVisible && side === "negZ";
            }
            
            // Set the scale based on voltage magnitude
            if (arrow.visible && shouldBeVisible) {
                const scale = Math.max(0.5, Math.min(2, Math.abs(hallVoltage)));
                arrow.scale.set(scale, scale, scale);
            }
        });

        // Update the charge indicators so that their positions follow the material value
        this.updateChargeIndicators();

        return hallVoltage;
    }


    getCurrentValue() {
        const slider = document.getElementById("current");
        return slider ? parseInt(slider.value) / 50 : 1;
    }

    getMagneticFieldValue() {
        const slider = document.getElementById("magneticField");
        return slider ? parseInt(slider.value) / 50 : 1;
    }

    getHallCoefficient() {
        const select = document.getElementById("materialSelect");
        return select ? parseFloat(select.value) / 10 : 1;
    }

    setupExplanationPanel() {
        const explToggle = document.getElementById("explanation-toggle");
        const explPanel = document.getElementById("explanation");
        if (explToggle && explPanel) {
            explToggle.onclick = () => {
                const currentDisplay = window.getComputedStyle(explPanel).display;
                const newDisplay = currentDisplay === "none" ? "block" : "none";
                explPanel.style.display = newDisplay;
                
                // Render LaTeX when panel is shown
                if (newDisplay === "block" && window.MathJax) {
                    setTimeout(() => {
                        MathJax.typesetPromise([explPanel]).catch((err) => console.log('MathJax error:', err));
                    }, 10);
                }
            };
        }
    }

    resetToDefaults() {
        const magneticFieldSlider = document.getElementById("magneticField");
        const currentSlider = document.getElementById("current");
        const materialSelect = document.getElementById("materialSelect");

        if (magneticFieldSlider) magneticFieldSlider.value = 50;
        if (currentSlider) currentSlider.value = 50;
        if (materialSelect) materialSelect.value = "-5.3";

        const hallVoltageElement = document.getElementById("hallVoltage");
        if (hallVoltageElement) {
            hallVoltageElement.textContent = "Hall-Spannung: 0.00 V";
        }

        this.isPaused = false;
        const pauseBtn = document.getElementById("pauseBtn");
        if (pauseBtn) {
            pauseBtn.textContent = "Pause";
        }

        this.tutorialActive = false;
        this.currentTutorialStep = 0;

        this.calculateHallVoltage();
    }

    setupEventListeners() {
        const pauseBtn = document.getElementById("pauseBtn");
        if (pauseBtn) {
            pauseBtn.addEventListener("click", () => {
                this.isPaused = !this.isPaused;
                pauseBtn.textContent = this.isPaused ? "Fortsetzen" : "Pause";
            });
        }

        const resetBtn = document.getElementById("resetBtn");
        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                this.resetToDefaults();
            });
        }

        const tutorialBtn = document.getElementById("tutorialBtn");
        if (tutorialBtn) {
            tutorialBtn.addEventListener("click", () => {
                this.startTutorial();
            });
        }

        const materialSelect = document.getElementById("materialSelect");
        if (materialSelect) {
            materialSelect.addEventListener("change", () => {
                // Trigger an update to recalculate positions based on the new material's value
                this.calculateHallVoltage();
            });
        }

        window.addEventListener("resize", () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });

        // Click event for electrons
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        window.addEventListener("click", (event) => {
            mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
            raycaster.setFromCamera(mouse, this.camera);
            const intersects = raycaster.intersectObjects(this.electrons);
            if (intersects.length > 0) {
                const electron = intersects[0].object;
                this.displayElectronInfo(electron);
            } else {
                const info = document.getElementById("electronInfo");
                if (info) {
                    info.textContent = "Klicken Sie auf ein Elektron für Details";
                }
            }
        });
    }


    displayElectronInfo(electron) {
        const info = document.getElementById("electronInfo");
        if (info) {
            const hallVoltage = this.calculateHallVoltage();
            const inMagneticField = this.isInMagneticField(electron.position);
            const current = this.getCurrentValue();
            const magneticField = this.getMagneticFieldValue();
            const hallCoefficient = this.getHallCoefficient();
            
            let html = `<p>Elektron ausgewählt</p>
                       <p>Stromstärke: ${current.toFixed(2)}</p>`;
            
            // Only show B-Feld when electron is inside magnetic field
            if (inMagneticField) {
                html += `<p>B-Feld: ${magneticField.toFixed(2)}</p>`;
            }
            
            html += `<p>Hall-Spannung: ${hallVoltage.toFixed(2)} V</p>`;
            
            // Improved LaTeX formula display with better formatting to prevent overflow
            const conductorWidth = this.CONDUCTOR_WIDTH;
            html += `
            <div class="electron-formula formula" style="margin-top: 10px; font-size: 0.85em; padding: 8px; overflow-x: auto;">
                $$U_H = ${hallCoefficient.toFixed(2)} \\cdot \\frac{${current.toFixed(2)} \\cdot ${magneticField.toFixed(2)}}{${conductorWidth}} = ${hallVoltage.toFixed(2)}\\,V$$
            </div>`;
            
            info.innerHTML = html;
            
            // Use a small timeout to ensure the DOM is updated before MathJax processes it
            setTimeout(() => {
                if (window.MathJax) {
                    MathJax.typesetPromise([info]).catch((err) => console.log('MathJax error:', err));
                }
            }, 10);
        }
    }

    // Tutorial-Modus
    startTutorial() {
        this.tutorialActive = true;
        this.currentTutorialStep = 0;
        this.isPaused = true;
        
        // Reset any existing highlights
        this.clearHighlights();
        
        this.showTutorialStep();
    }

    showTutorialStep() {
        if (!this.tutorialActive) return;
        
        // Clear previous highlights
        this.clearHighlights();
        
        const explPanel = document.getElementById("explanation");
        if (explPanel) {
            explPanel.style.display = "block";
            explPanel.innerHTML = `<h3>Tutorial</h3><p>${this.tutorialSteps[this.currentTutorialStep].text}</p><p>Klicken Sie, um fortzufahren...</p>`;
            
            // Apply new highlight based on current step
            const highlightTarget = this.tutorialSteps[this.currentTutorialStep].highlight;
            this.highlightObject(highlightTarget);
            
            // Tell MathJax to render the new content if there might be LaTeX
            if (window.MathJax) {
                setTimeout(() => {
                    MathJax.typesetPromise([explPanel]).catch((err) => console.log('MathJax error:', err));
                }, 10);
            }
        }
        
        explPanel.onclick = () => {
            this.currentTutorialStep++;
            if (this.currentTutorialStep < this.tutorialSteps.length) {
                this.showTutorialStep();
            } else {
                // Tutorial finished -> Restore original explanation content
                explPanel.onclick = null;
                explPanel.style.display = "none";
                explPanel.innerHTML = this.originalExplanationContent;
                
                // Clear any remaining highlights
                this.clearHighlights();
                
                this.tutorialActive = false;
                this.isPaused = false;
                this.setupExplanationPanel();
            }
        };
    }

    // New methods for tutorial highlighting
    highlightObject(targetName) {
        const highlightMaterial = new THREE.MeshBasicMaterial({
            color: 0xffff00,
            transparent: true,
            opacity: 0.6,
            depthTest: false
        });
        
        switch(targetName) {
            case "conductor":
                // Store original material and apply highlight
                this.originalMaterials.set(this.conductor, this.conductor.material);
                this.conductor.material = highlightMaterial;
                
                // Move camera to focus on the conductor
                this.moveCameraToFocus(this.conductor.position, 8);
                break;
                
            case "magnetGroup":
                // Highlight the magnet field box
                if (this.magnetGroup.children.length > 0) {
                    const fieldBox = this.magnetGroup.children[0]; // First child is the field region
                    this.originalMaterials.set(fieldBox, fieldBox.material);
                    fieldBox.material = new THREE.MeshBasicMaterial({
                        color: 0x00ffff,
                        transparent: true,
                        opacity: 0.4
                    });
                }
                
                // Make field lines more visible
                for (let i = 1; i < this.magnetGroup.children.length - 4; i++) { // Skip poles and labels
                    if (this.magnetGroup.children[i].type === "Line") {
                        const line = this.magnetGroup.children[i];
                        this.originalMaterials.set(line, line.material);
                        line.material = new THREE.LineBasicMaterial({
                            color: 0x00ff00,
                            linewidth: 3,
                            transparent: false,
                            opacity: 1
                        });
                    }
                }
                
                // Move camera to focus on the magnet
                this.moveCameraToFocus(this.magnetGroup.position, 10);
                break;
                
            case "lorentz":
                // Highlight the Lorentz force arrows on electrons
                this.electrons.forEach(electron => {
                    if (this.isInMagneticField(electron.position)) {
                        const arrowSet = this.arrows.get(electron);
                        if (arrowSet) {
                            // Make only the Lorentz force arrow highly visible
                            arrowSet.Fl.setLength(this.ARROW_LENGTH * 2);
                            arrowSet.Fl.line.material.color.set(0x00ffff);
                            arrowSet.Fl.cone.material.color.set(0x00ffff);
                            arrowSet.Fl.line.material.opacity = 1;
                            arrowSet.Fl.cone.material.opacity = 1;
                        }
                    }
                });
                
                // Move camera to a good angle to see Lorentz forces
                this.moveCameraToFocus(new THREE.Vector3(0, 0, 0), 8, new THREE.Vector3(0, 1, 1));
                break;
                
            case "hallVoltageArrows":
                // Highlight the Hall voltage arrows
                this.hallVoltageArrows.forEach(arrowObj => {
                    const arrow = arrowObj.arrow;
                    // Make all Hall voltage arrows visible temporarily for tutorial
                    arrow.visible = true;
                    arrow.line.material.color.set(0xffff00);
                    arrow.line.material.opacity = 1;
                    arrow.cone.material.color.set(0xffff00);
                    arrow.cone.material.opacity = 1;
                    arrow.setLength(this.CONDUCTOR_WIDTH * 1.2);
                    arrow.scale.set(1.5, 1.5, 1.5);
                });
                
                // Also highlight charge indicators
                this.chargeIndicators.plus.material.opacity = 1;
                this.chargeIndicators.minus.material.opacity = 1;
                
                // Move camera to see Hall voltage effect
                this.moveCameraToFocus(new THREE.Vector3(0, 0, 0), 8, new THREE.Vector3(1, 0.5, 0.5));
                break;
                
            case "controls":
                // Highlight the control panel in the UI
                const controlsPanel = document.getElementById("controls");
                if (controlsPanel) {
                    controlsPanel.style.boxShadow = "0 0 20px 5px rgba(255,255,0,0.7)";
                    controlsPanel.style.animation = "pulse 1.5s infinite";
                    
                    // Add animation style if it doesn't exist
                    if (!document.getElementById("highlight-animation")) {
                        const style = document.createElement("style");
                        style.id = "highlight-animation";
                        style.textContent = `
                            @keyframes pulse {
                                0% { box-shadow: 0 0 20px 5px rgba(255,255,0,0.5); }
                                50% { box-shadow: 0 0 25px 10px rgba(255,255,0,0.8); }
                                100% { box-shadow: 0 0 20px 5px rgba(255,255,0,0.5); }
                            }
                        `;
                        document.head.appendChild(style);
                    }
                }
                
                // Reset camera to default view
                this.moveCameraToFocus(new THREE.Vector3(0, 0, 0), 10);
                break;
        }
    }

    clearHighlights() {
        // Restore original materials
        this.originalMaterials.forEach((material, object) => {
            object.material = material;
        });
        this.originalMaterials.clear();
        
        // Reset Lorentz arrows
        this.electrons.forEach(electron => {
            const arrowSet = this.arrows.get(electron);
            if (arrowSet) {
                arrowSet.Fl.setLength(this.ARROW_LENGTH);
                arrowSet.Fl.line.material.color.set(0x0000ff);
                arrowSet.Fl.cone.material.color.set(0x0000ff);
                arrowSet.Fl.line.material.opacity = 1;
                arrowSet.Fl.cone.material.opacity = 1;
            }
        });
        
        // Reset Hall voltage arrows
        this.hallVoltageArrows.forEach(arrowObj => {
            arrowObj.arrow.line.material.color.set(0xffff00);
            arrowObj.arrow.cone.material.color.set(0xffff00);
            arrowObj.arrow.setLength(this.CONDUCTOR_WIDTH);
        });
        
        // Reset Hall voltage visibility based on actual physics
        const hallVoltage = this.calculateHallVoltage();
        
        // Reset charge indicators
        this.chargeIndicators.plus.material.opacity = 0.7;
        this.chargeIndicators.minus.material.opacity = 0.7;
        
        // Clear UI highlights
        const controlsPanel = document.getElementById("controls");
        if (controlsPanel) {
            controlsPanel.style.boxShadow = "none";
            controlsPanel.style.animation = "none";
        }
    }

    moveCameraToFocus(targetPosition, distance, offset = new THREE.Vector3(1, 1, 1)) {
        // Normalize the offset direction
        offset.normalize();
        
        // Calculate camera position
        const newPosition = new THREE.Vector3().copy(targetPosition).add(
            offset.multiplyScalar(distance)
        );
        
        // Use TWEEN to animate the camera movement
        const currentPosition = this.camera.position.clone();
        const duration = 1000; // Animation duration in ms
        
        // Simple linear interpolation function
        const startTime = Date.now();
        const updateCamera = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            this.camera.position.lerpVectors(currentPosition, newPosition, progress);
            this.camera.lookAt(targetPosition);
            
            if (progress < 1) {
                requestAnimationFrame(updateCamera);
            }
        };
        
        updateCamera();
    }

    updateElectronPositions() {
        if (this.isPaused) return;
        const currentValue = this.getCurrentValue();
        const hallVoltage = this.calculateHallVoltage();

        this.electrons.forEach(electron => {
            // Stromfluss in x-Richtung
            electron.position.x += this.ELECTRON_SPEED * currentValue;

            // Einfacher „Gravitations“-Effekt
            const GRAVITY_STRENGTH = 0.001;
            electron.position.y -= GRAVITY_STRENGTH;

            // Lorentzkraft nur innerhalb des Magnetfelds
            if (this.isInMagneticField(electron.position)) {
                const lorentzForce = hallVoltage * 0.01;
                // Kleine Modellierung der Gegenkraft (E-Feld), proportional zur Position z
                const electricForce = lorentzForce * (electron.position.z / (this.CONDUCTOR_WIDTH / 2));
                const netForce = lorentzForce - electricForce;
                electron.position.z -= netForce;

                // Elektrische Gegenkraft (Fe) sichtbar machen
                const arrowSet = this.arrows.get(electron);
                if (arrowSet) {
                    arrowSet.Fe.visible = true;
                    const scale = Math.abs(electricForce) * 20;
                    arrowSet.Fe.setLength(this.ARROW_LENGTH * scale);
                }
            } else {
                // Wenn kein Magnetfeld: Zurücksetzen in Richtung ursprünglicher Position (nur z und y)
                electron.position.z = THREE.MathUtils.lerp(
                    electron.position.z,
                    electron.userData.originalPosition.z,
                    0.05
                );
                electron.position.y = THREE.MathUtils.lerp(
                    electron.position.y,
                    electron.userData.originalPosition.y,
                    0.05
                );

                // Elektrische Gegenkraft (Fe) ausblenden
                const arrowSet = this.arrows.get(electron);
                if (arrowSet) {
                    arrowSet.Fe.visible = false;
                }
            }

            // Begrenzung innerhalb des Leiters (Y-Richtung)
            electron.position.y = Math.max(
                -this.CONDUCTOR_HEIGHT / 2 + this.ELECTRON_SIZE,
                Math.min(this.CONDUCTOR_HEIGHT / 2 - this.ELECTRON_SIZE, electron.position.y)
            );
            // Begrenzung innerhalb des Leiters (Z-Richtung)
            electron.position.z = Math.max(
                -this.CONDUCTOR_WIDTH / 2 + this.ELECTRON_SIZE,
                Math.min(this.CONDUCTOR_WIDTH / 2 - this.ELECTRON_SIZE, electron.position.z)
            );

            // Wenn Elektron das rechte Ende erreicht, wieder zurücksetzen (Loop)
            if (electron.position.x > this.CONDUCTOR_LENGTH / 2 - this.ELECTRON_SIZE) {
                electron.position.x = -this.CONDUCTOR_LENGTH / 2 + this.ELECTRON_SIZE;
                electron.position.z = (Math.random() - 0.5) * (this.CONDUCTOR_WIDTH - 0.2);
                // Optional: Aktualisieren der gespeicherten Ausgangsposition
                electron.userData.originalPosition = electron.position.clone();
            }

            // Pfeile aktualisieren
            const arrowSet = this.arrows.get(electron);
            if (arrowSet) {
                Object.values(arrowSet).forEach(arrow => {
                    arrow.position.copy(electron.position);
                });
                arrowSet.Fl.visible = this.isInMagneticField(electron.position);
                // B-Pfeil nur anzeigen, wenn das Elektron im Magnetfeld ist
                arrowSet.B.visible = this.isInMagneticField(electron.position);
            }
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.updateElectronPositions();
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }
}

// Starten der Simulation
const simulation = new HallEffectSimulation();
