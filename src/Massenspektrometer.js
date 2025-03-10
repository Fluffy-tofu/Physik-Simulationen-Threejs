// Massenspektrometer.js
// Eine Massenspektrometer-Simulation mit HTML5 Canvas

export class MassSpectrometer {
    constructor(canvasId, options = {}) {
        // Canvas und Kontext
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        // Optionen mit Standardwerten
        this.options = {
            width: options.width || window.innerWidth,
            height: options.height || window.innerHeight,
            backgroundColor: options.backgroundColor || '#111111',
            particleColor: options.particleColor || '#00FFFF',
            fieldColor: options.fieldColor || '#FFFFFF',
            textColor: options.textColor || '#FFFFFF',
            ...options
        };

        // Canvas-Dimensionen setzen
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;

        // Parameter
        this.magneticField = 5; // T
        this.accelerationVoltage = 5000; // V
        this.particleCharge = 1.602e-19; // C (Elementarladung)
        this.particleMasses = []; // Array für verschiedene Massen
        this.particles = []; // Array zur Speicherung der Partikel

        // Standard-Ionenmassen hinzufügen (in u, atomare Masseneinheit)
        this.addIon("H+", 1);
        this.addIon("He+", 4);
        this.addIon("Li+", 7);
        this.addIon("C+", 12);
        this.addIon("O+", 16);
        this.addIon("Na+", 23);
        this.addIon("Cl+", 35.5);

        // Konstanten
        this.u = 1.66053886e-27; // Atomare Masseneinheit in kg

        // Animation
        this.isAnimating = false;
        this.animationId = null;

        // Benutzeroberfläche erstellen
        this.createUI();

        // Erste Zeichnung
        this.draw();

        // Event-Listener für Fenstergrößenänderung
        window.addEventListener('resize', () => this.handleResize());
    }

    // Behandelt Fenstergrößenänderungen
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.draw();
    }

    // Fügt eine neue Ionenmasse hinzu
    addIon(name, mass) {
        const color = this.getRandomColor();
        this.particleMasses.push({
            name: name,
            mass: mass,
            color: color
        });
    }

    // Erzeugt eine zufällige Farbe
    getRandomColor() {
        const colors = [
            '#FF5733', '#33FF57', '#3357FF', '#F3FF33',
            '#FF33F3', '#33FFF3', '#FF3333', '#33FF33'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Berechnet den Radius der Kreisbahn für ein Ion
    calculateRadius(mass) {
        // r = sqrt(2*m*V)/(q*B)
        const massInKg = mass * this.u;
        const velocity = Math.sqrt(2 * this.accelerationVoltage * this.particleCharge / massInKg);
        const radius = massInKg * velocity / (this.particleCharge * this.magneticField);

        // Skalieren für die Anzeige
        return radius * 1e6; // Skalierungsfaktor für die Anzeige
    }

    // Erzeugt ein neues Partikel
    createParticle(massIndex) {
        const massData = this.particleMasses[massIndex];
        const radius = this.calculateRadius(massData.mass);

        // Startposition (linke Seite des Canvas)
        const x = 50;
        const y = this.canvas.height / 2;

        this.particles.push({
            mass: massData.mass,
            radius: radius,
            name: massData.name,
            color: massData.color,
            angle: 0, // Startwinkel der Kreisbewegung
            centerX: x, // Mittelpunkt der Kreisbahn
            centerY: y - radius // Mittelpunkt der Kreisbahn
        });
    }

    // Zeichnet die Szene
    draw() {
        // Canvas löschen
        this.ctx.fillStyle = this.options.backgroundColor;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        // Quelle zeichnen
        this.drawSource();

        // Detektor zeichnen
        this.drawDetector();

        // Magnetfeld anzeigen
        this.drawMagneticField();

        // Partikel zeichnen
        this.drawParticles();

        // Legende zeichnen
        this.drawLegend();

        // Informationstext anzeigen
        this.drawInfoText();
    }

    // Zeichnet die Ionenquelle
    drawSource() {
        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(20, this.canvas.height / 2 - 30, 30, 60);

        // Pfeil für die Beschleunigungsspannung
        this.ctx.beginPath();
        this.ctx.moveTo(70, this.canvas.height / 2 - 40);
        this.ctx.lineTo(70, this.canvas.height / 2 + 40);
        this.ctx.strokeStyle = '#FFFF00';
        this.ctx.lineWidth = 2;
        this.ctx.stroke();

        // Spannungslabel
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.fillText(`${this.accelerationVoltage} V`, 80, this.canvas.height / 2);
    }

    // Zeichnet den Detektor
    drawDetector() {
        this.ctx.fillStyle = '#555555';
        this.ctx.fillRect(this.canvas.width - 40, 50, 20, this.canvas.height - 100);

        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Detektor', this.canvas.width - 80, 30);
    }

    // Zeichnet das Magnetfeld
    drawMagneticField() {
        // Magnetfeldbereich
        this.ctx.strokeStyle = '#0088FF';
        this.ctx.lineWidth = 1;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(100, 50, this.canvas.width - 190, this.canvas.height - 100);
        this.ctx.setLineDash([]);

        // B-Feld-Symbol
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '16px Arial';
        this.ctx.fillText(`B = ${this.magneticField} T`, this.canvas.width / 2 - 40, 30);

        // B-Feld Richtung (Kreuz oder Punkt-Symbol)
        for (let x = 150; x < this.canvas.width - 150; x += 80) {
            for (let y = 100; y < this.canvas.height - 100; y += 80) {
                // Kreis zeichnen
                this.ctx.beginPath();
                this.ctx.arc(x, y, 10, 0, Math.PI * 2);
                this.ctx.fillStyle = '#0088FF';
                this.ctx.fill();

                // Kreuz für "aus der Ebene heraus" zeichnen
                this.ctx.beginPath();
                this.ctx.moveTo(x - 6, y - 6);
                this.ctx.lineTo(x + 6, y + 6);
                this.ctx.moveTo(x + 6, y - 6);
                this.ctx.lineTo(x - 6, y + 6);
                this.ctx.strokeStyle = this.options.backgroundColor;
                this.ctx.lineWidth = 2;
                this.ctx.stroke();
            }
        }
    }

    // Zeichnet die Partikel
    drawParticles() {
        this.particles.forEach(particle => {
            // Kreisbahn berechnen
            const x = particle.centerX + particle.radius * Math.cos(particle.angle);
            const y = particle.centerY + particle.radius * Math.sin(particle.angle);

            // Partikel zeichnen
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();

            // Kreisbahn andeuten
            this.ctx.beginPath();
            this.ctx.arc(particle.centerX, particle.centerY, particle.radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = particle.color;
            this.ctx.globalAlpha = 0.3;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;

            // Partikelname anzeigen
            this.ctx.fillStyle = particle.color;
            this.ctx.font = '12px Arial';
            this.ctx.fillText(particle.name, x + 10, y - 10);
        });
    }

    // Zeichnet die Legende
    drawLegend() {
        const startX = 100;
        const startY = this.canvas.height - 30;

        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Verfügbare Ionen:', startX, startY);

        let xPos = startX + 140;
        let row = 0;
        const itemsPerRow = Math.floor((this.canvas.width - startX - 140) / 100);

        this.particleMasses.forEach((ion, index) => {
            const col = index % itemsPerRow;
            if (col === 0 && index > 0) row++;

            const x = xPos + col * 100;
            const y = startY - row * 25;

            this.ctx.fillStyle = ion.color;
            this.ctx.beginPath();
            this.ctx.arc(x, y - 5, 5, 0, Math.PI * 2);
            this.ctx.fill();

            this.ctx.fillText(`${ion.name} (${ion.mass} u)`, x + 10, y);
        });
    }

    // Zeichnet zusätzliche Informationen
    drawInfoText() {
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = '14px Arial';
        this.ctx.fillText('Massenspektrometer-Simulation', 100, 20);

        // Information zur Berechnung
        const text = 'Formel: r = √(2·m·V)/(q·B)';
        this.ctx.fillText(text, 100, 50);
    }

    // Aktualisiert die Partikelpositionen für die Animation
    update() {
        this.particles.forEach(particle => {
            // Winkel aktualisieren (Geschwindigkeit abhängig von der Masse)
            const speed = 0.02 / Math.sqrt(particle.mass); // Schwerere Teilchen bewegen sich langsamer
            particle.angle += speed;

            // Partikel entfernen, wenn sie den Detektor erreichen
            const x = particle.centerX + particle.radius * Math.cos(particle.angle);
            if (x > this.canvas.width - 40) {
                // Hier könnte ein Detektor-Event ausgelöst werden
                console.log(`${particle.name} mit Masse ${particle.mass} u detektiert!`);
            }
        });

        // Partikel filtern, die den Detektor erreicht haben
        this.particles = this.particles.filter(particle => {
            const x = particle.centerX + particle.radius * Math.cos(particle.angle);
            return x <= this.canvas.width - 40;
        });
    }

    // Startet die Animation
    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        const animate = () => {
            this.update();
            this.draw();
            if (this.isAnimating) {
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate();
    }

    // Stoppt die Animation
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Erzeugt die Benutzeroberfläche
    createUI() {
        const uiContainer = document.createElement('div');
        uiContainer.style.position = 'absolute';
        uiContainer.style.top = '10px';
        uiContainer.style.left = '50%';
        uiContainer.style.transform = 'translateX(-50%)';
        uiContainer.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        uiContainer.style.padding = '10px';
        uiContainer.style.borderRadius = '5px';
        uiContainer.style.color = 'white';
        uiContainer.style.fontFamily = 'Arial, sans-serif';
        uiContainer.style.zIndex = '1000';
        uiContainer.style.width = '600px';

        uiContainer.innerHTML = `
            <h2 style="text-align: center; margin-top: 0;">Massenspektrometer</h2>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="flex: 1; margin-right: 10px;">
                    <label for="bFieldSlider">Magnetfeld (T): <span id="bFieldValue">${this.magneticField}</span></label>
                    <div style="display: flex; align-items: center;">
                        <input type="range" id="bFieldSlider" min="1" max="10" step="0.5" value="${this.magneticField}" style="flex: 3; margin-right: 5px;">
                        <input type="number" id="bFieldInput" value="${this.magneticField}" step="any" style="flex: 1; width: 60px;">
                    </div>
                </div>
                
                <div style="flex: 1; margin-left: 10px;">
                    <label for="voltageSlider">Spannung (V): <span id="voltageValue">${this.accelerationVoltage}</span></label>
                    <div style="display: flex; align-items: center;">
                        <input type="range" id="voltageSlider" min="1000" max="10000" step="500" value="${this.accelerationVoltage}" style="flex: 3; margin-right: 5px;">
                        <input type="number" id="voltageInput" value="${this.accelerationVoltage}" step="any" min="0" style="flex: 1; width: 60px;">
                    </div>
                </div>
            </div>
            
            <div style="margin-bottom: 15px;">
                <button id="addIonBtn" style="width: 100%; padding: 8px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Eigenes Ion hinzufügen</button>
            </div>
            
            <div id="ionButtonsContainer" style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 15px;">
                ${this.particleMasses.map((ion, index) => `
                    <button class="ionBtn" data-index="${index}" style="background-color: ${ion.color}; color: black; padding: 5px; margin: 3px; border: none; border-radius: 4px; cursor: pointer;">
                        ${ion.name}
                    </button>
                `).join('')}
            </div>
            
            <div style="text-align: center; margin-bottom: 15px;">
                <button id="resetBtn" style="padding: 8px; background: #cc0000; color: white; border: none; border-radius: 4px; cursor: pointer; width: 100%;">Zurücksetzen</button>
            </div>
        `;

        document.body.appendChild(uiContainer);

        // Event Listener für die UI-Elemente
        document.getElementById('bFieldSlider').addEventListener('input', (e) => {
            this.magneticField = parseFloat(e.target.value);
            document.getElementById('bFieldValue').textContent = this.magneticField;
            document.getElementById('bFieldInput').value = this.magneticField;
            this.recalculateParticleRadii();
            this.draw();
        });

        document.getElementById('bFieldInput').addEventListener('change', (e) => {
            this.magneticField = parseFloat(e.target.value);
            if (this.magneticField >= 1 && this.magneticField <= 10) {
                document.getElementById('bFieldSlider').value = this.magneticField;
            }
            document.getElementById('bFieldValue').textContent = this.magneticField;
            this.recalculateParticleRadii();
            this.draw();
        });

        document.getElementById('voltageSlider').addEventListener('input', (e) => {
            this.accelerationVoltage = parseFloat(e.target.value);
            document.getElementById('voltageValue').textContent = this.accelerationVoltage;
            document.getElementById('voltageInput').value = this.accelerationVoltage;
            this.recalculateParticleRadii();
            this.draw();
        });

        document.getElementById('voltageInput').addEventListener('change', (e) => {
            this.accelerationVoltage = parseFloat(e.target.value);
            if (this.accelerationVoltage >= 1000 && this.accelerationVoltage <= 10000) {
                document.getElementById('voltageSlider').value = this.accelerationVoltage;
            }
            document.getElementById('voltageValue').textContent = this.accelerationVoltage;
            this.recalculateParticleRadii();
            this.draw();
        });

        document.getElementById('addIonBtn').addEventListener('click', () => {
            const massStr = prompt('Geben Sie die Masse des neuen Ions in u (atomare Masseneinheit) ein:');
            if (massStr !== null && massStr !== '') {
                const mass = parseFloat(massStr);
                if (!isNaN(mass) && mass > 0) {
                    const name = prompt('Geben Sie ein Symbol für das Ion ein:') || `Ion-${mass}`;
                    this.addIon(name, mass);
                    this.updateIonButtons();
                }
            }
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.particles = [];
            this.draw();
        });

        // Event-Listener für Ion-Buttons hinzufügen
        this.updateIonButtons();
    }

    // Aktualisiert die Ion-Buttons basierend auf den verfügbaren Ionen
    updateIonButtons() {
        const buttonContainer = document.getElementById('ionButtonsContainer');
        if (!buttonContainer) return;

        buttonContainer.innerHTML = this.particleMasses.map((ion, index) => `
            <button class="ionBtn" data-index="${index}" style="background-color: ${ion.color}; color: black; padding: 5px; margin: 3px; border: none; border-radius: 4px; cursor: pointer;">
                ${ion.name}
            </button>
        `).join('');

        // Event-Listener für Ion-Buttons
        document.querySelectorAll('.ionBtn').forEach(button => {
            button.addEventListener('click', (e) => {
                const index = parseInt(e.target.getAttribute('data-index'));
                this.createParticle(index);
                this.draw();
            });
        });
    }

    // Berechnet die Radien aller Partikel neu (z.B. nach Änderung von B oder V)
    recalculateParticleRadii() {
        this.particles.forEach(particle => {
            particle.radius = this.calculateRadius(particle.mass);
        });
    }
}

// Funktion zum Initialisieren des Massenspektrometers
export function initMassSpectrometer() {
    const massSpec = new MassSpectrometer('massSpecCanvas', {
        backgroundColor: '#1a1a1a'
    });

    return massSpec;
}