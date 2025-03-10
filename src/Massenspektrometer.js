// Massenspektrometer.js
// Eine verbesserte Massenspektrometer-Simulation mit HTML5 Canvas

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
            showTrails: options.showTrails !== undefined ? options.showTrails : true,
            trailLength: options.trailLength || 100,
            ...options
        };

        // Canvas-Dimensionen setzen
        this.canvas.width = this.options.width;
        this.canvas.height = this.options.height;

        // Physikalische Parameter
        this.magneticField = 5; // T
        this.accelerationVoltage = 5000; // V
        this.elementaryCharge = 1.602e-19; // C (Elementarladung)
        this.u = 1.66053886e-27; // Atomare Masseneinheit in kg

        // Arrays für Simulation
        this.particleMasses = []; // Array für verschiedene Massen
        this.particles = []; // Array zur Speicherung der Partikel
        this.trails = {}; // Speichert die Spuren der Partikel

        // Kennungen für Partikel
        this.nextParticleId = 1;

        // Detektierte Ionen
        this.detectedIons = [];

        // Standard-Ionenmassen hinzufügen (in u, atomare Masseneinheit)
        this.addIon("H+", 1);
        this.addIon("H₂+", 2);
        this.addIon("He+", 4);
        this.addIon("Li+", 7);
        this.addIon("C+", 12);
        this.addIon("N+", 14);
        this.addIon("O+", 16);
        this.addIon("Na+", 23);
        this.addIon("Cl+", 35.5);

        // Animation
        this.isAnimating = false;
        this.animationId = null;
        this.lastTimestamp = 0;
        this.deltaTime = 0;

        // Virtuelle Skala: 1 Pixel = 1mm im Gerät
        this.scale = 0.2; // Skalierungsfaktor für die Anzeige

        // Konfiguration des Spektrometers
        this.sourceX = 50;
        this.sourceY = this.canvas.height / 2;
        this.fieldStartX = 100;
        this.fieldEndX = this.canvas.width - 150;
        this.detectorX = this.canvas.width - 50;

        // Feld-Region
        this.fieldWidth = this.fieldEndX - this.fieldStartX;
        this.fieldHeight = this.canvas.height - 100;
        this.fieldTop = 50;
        this.fieldBottom = this.fieldTop + this.fieldHeight;

        // Spektrum-Daten
        this.spectrumData = {};
        this.maxPeakIntensity = 0;

        // Flag für Anzeige des Hintergrundbildes (immer neu zeichnen oder nur einmal)
        this.backgroundNeedsUpdate = true;
        this.backgroundCanvas = document.createElement('canvas');
        this.backgroundCanvas.width = this.canvas.width;
        this.backgroundCanvas.height = this.canvas.height;
        this.bgCtx = this.backgroundCanvas.getContext('2d');

        // Benutzeroberfläche erstellen
        this.createUI();

        // Event-Listener für Fenstergrößenänderung
        window.addEventListener('resize', () => this.handleResize());

        // Erste Zeichnung
        this.updateBackground();
        this.draw();
    }

    // Behandelt Fenstergrößenänderungen
    handleResize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;

        // Aktualisiere Hintergrund-Canvas
        this.backgroundCanvas.width = this.canvas.width;
        this.backgroundCanvas.height = this.canvas.height;

        // Aktualisiere Feldregion
        this.fieldEndX = this.canvas.width - 150;
        this.fieldWidth = this.fieldEndX - this.fieldStartX;
        this.fieldHeight = this.canvas.height - 100;
        this.fieldBottom = this.fieldTop + this.fieldHeight;
        this.detectorX = this.canvas.width - 50;

        this.backgroundNeedsUpdate = true;
        this.updateBackground();
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
            '#FF33F3', '#33FFF3', '#FF3333', '#33FF33',
            '#36A2EB', '#FF6384', '#FFCE56', '#4BC0C0'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    // Berechnet den Radius der Kreisbahn für ein Ion (physikalisch korrekt)
    calculateRadius(mass) {
        // r = mv/(qB) mit v = sqrt(2qV/m)
        const massInKg = mass * this.u;
        const velocity = Math.sqrt(2 * this.elementaryCharge * this.accelerationVoltage / massInKg);
        const radius = massInKg * velocity / (this.elementaryCharge * this.magneticField);

        // Skalieren für die Anzeige (mm zu Pixel)
        return radius * 1000 * this.scale; // Konvertiere m zu mm und dann mit Skala
    }

    // Erzeugt ein neues Partikel
    createParticle(massIndex) {
        const massData = this.particleMasses[massIndex];
        const radius = this.calculateRadius(massData.mass);
        const id = this.nextParticleId++;

        // Startposition (linke Seite des Canvas mit leichter y-Variation)
        const x = this.sourceX;
        const y = this.sourceY + (Math.random() * 6 - 3); // Leichte Streuung beim Ausgang

        this.particles.push({
            id: id,
            mass: massData.mass,
            radius: radius,
            name: massData.name,
            color: massData.color,
            angle: Math.PI, // Startwinkel der Kreisbewegung (links)
            centerX: this.fieldStartX + radius, // Mittelpunkt der Kreisbahn wird beim Eintritt gesetzt
            centerY: this.sourceY, // Mittelpunkt auf Höhe der Quelle
            x: x, // Aktuelle x-Position
            y: y, // Aktuelle y-Position
            enteredField: false, // Flag für Eintritt ins Magnetfeld
            exitedField: false,  // Flag für Austritt aus dem Magnetfeld
            dirX: 1, // Richtungsvektor X (für Bewegung nach dem Magnetfeld)
            dirY: 0, // Richtungsvektor Y
            detected: false,
            time: 0, // Zeit seit Erzeugung

            // Berechnete physikalische Eigenschaften
            velocity: Math.sqrt(2 * this.elementaryCharge * this.accelerationVoltage / (massData.mass * this.u)),
            cyclotronFrequency: (this.elementaryCharge * this.magneticField) / (massData.mass * this.u),
            period: (2 * Math.PI * massData.mass * this.u) / (this.elementaryCharge * this.magneticField)
        });

        // Initialisiere Trail für dieses Partikel
        if (this.options.showTrails) {
            this.trails[id] = [{x: x, y: y}]; // Start mit aktueller Position
        }

        return id;
    }

    // Aktualisiert den Hintergrund (statische Elemente)
    updateBackground() {
        if (!this.backgroundNeedsUpdate) return;

        // Hintergrund löschen
        this.bgCtx.fillStyle = this.options.backgroundColor;
        this.bgCtx.fillRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);

        // Quelle zeichnen
        this.drawSource(this.bgCtx);

        // Detektor zeichnen
        this.drawDetector(this.bgCtx);

        // Magnetfeld anzeigen
        this.drawMagneticField(this.bgCtx);

        // Informationstext anzeigen
        this.drawInfoText(this.bgCtx);

        this.backgroundNeedsUpdate = false;
    }

    // Zeichnet die Szene
    draw() {
        // Hintergrund kopieren
        this.ctx.drawImage(this.backgroundCanvas, 0, 0);

        // Partikelspuren zeichnen
        if (this.options.showTrails) {
            this.drawParticleTrails();
        }

        // Partikel zeichnen
        this.drawParticles();

        // Legende zeichnen
        this.drawLegend();

        // Massenspektrum zeichnen
        this.drawSpectrum();
    }

    // Zeichnet die Ionenquelle
    drawSource(ctx) {
        // Ionenquelle
        ctx.fillStyle = '#888888';
        ctx.fillRect(20, this.sourceY - 30, 30, 60);

        // Pfeil für die Beschleunigungsspannung
        ctx.beginPath();
        ctx.moveTo(70, this.sourceY - 40);
        ctx.lineTo(70, this.sourceY + 40);
        ctx.strokeStyle = '#FFFF00';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Spannungslabel
        ctx.fillStyle = this.options.textColor;
        ctx.font = '14px Arial';
        ctx.fillText(`${this.accelerationVoltage} V`, 75, this.sourceY);

        // Beschriftung
        ctx.fillStyle = this.options.textColor;
        ctx.font = '12px Arial';
        ctx.fillText('Ionenquelle', 20, this.sourceY - 40);
    }

    // Zeichnet den Detektor
    drawDetector(ctx) {
        const detectorWidth = 20;

        ctx.fillStyle = '#555555';
        ctx.fillRect(this.detectorX, this.fieldTop, detectorWidth, this.fieldHeight);

        ctx.fillStyle = this.options.textColor;
        ctx.font = '14px Arial';
        ctx.fillText('Detektor', this.detectorX - 30, this.fieldTop - 10);
    }

    // Zeichnet das Magnetfeld
    drawMagneticField(ctx) {
        // Magnetfeldbereich
        ctx.strokeStyle = 'rgba(0, 136, 255, 0.5)';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.strokeRect(this.fieldStartX, this.fieldTop, this.fieldWidth, this.fieldHeight);
        ctx.setLineDash([]);

        // B-Feld-Symbol
        ctx.fillStyle = this.options.textColor;
        ctx.font = '16px Arial';
        ctx.fillText(`B = ${this.magneticField} T`, this.fieldStartX + 20, this.fieldTop - 10);

        // B-Feld Richtung (Kreuz-Symbole für Feld aus der Ebene)
        const spacing = 80;
        for (let x = this.fieldStartX + spacing/2; x < this.fieldEndX; x += spacing) {
            for (let y = this.fieldTop + spacing/2; y < this.fieldBottom; y += spacing) {
                // Kreis zeichnen
                ctx.beginPath();
                ctx.arc(x, y, 8, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(0, 136, 255, 0.2)';
                ctx.fill();
                ctx.strokeStyle = 'rgba(0, 136, 255, 0.6)';
                ctx.lineWidth = 1;
                ctx.stroke();

                // Kreuz für "aus der Ebene heraus" zeichnen
                ctx.beginPath();
                ctx.moveTo(x - 5, y - 5);
                ctx.lineTo(x + 5, y + 5);
                ctx.moveTo(x + 5, y - 5);
                ctx.lineTo(x - 5, y + 5);
                ctx.strokeStyle = '#0088FF';
                ctx.lineWidth = 1.5;
                ctx.stroke();
            }
        }
    }

    // Zeichnet die Partikelspuren
    drawParticleTrails() {
        for (const id in this.trails) {
            const trail = this.trails[id];
            if (trail.length < 2) continue;

            // Finde das zugehörige Partikel für die Farbe
            const particle = this.particles.find(p => p.id === parseInt(id));
            if (!particle) continue;

            // Zeichne die Spur mit Farbverlauf (verblasst mit der Zeit)
            this.ctx.beginPath();
            this.ctx.moveTo(trail[0].x, trail[0].y);

            for (let i = 1; i < trail.length; i++) {
                this.ctx.lineTo(trail[i].x, trail[i].y);
            }

            this.ctx.strokeStyle = particle.color;
            this.ctx.lineWidth = 2;
            this.ctx.globalAlpha = 0.7;
            this.ctx.stroke();
            this.ctx.globalAlpha = 1.0;
        }
    }

    // Zeichnet die Partikel
    drawParticles() {
        this.particles.forEach(particle => {
            // Partikel zeichnen
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, 4, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 1;
            this.ctx.stroke();

            // Kreisbahn andeuten (nur wenn das Partikel im Magnetfeld ist)
            if (particle.x >= this.fieldStartX && particle.x <= this.fieldEndX) {
                this.ctx.beginPath();
                this.ctx.arc(particle.centerX, particle.centerY, particle.radius, 0, Math.PI * 2);
                this.ctx.strokeStyle = particle.color;
                this.ctx.globalAlpha = 0.15;
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
                this.ctx.globalAlpha = 1.0;
            }

            // Partikelname anzeigen
            if (!this.isAnimating || particle.time < 1) { // Nur zu Beginn oder wenn keine Animation läuft
                this.ctx.fillStyle = particle.color;
                this.ctx.font = '12px Arial';
                this.ctx.fillText(particle.name, particle.x + 8, particle.y - 8);
            }
        });
    }

    // Zeichnet die Legende mit den verfügbaren Ionen
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

    // Zeichnet das Massenspektrum
    drawSpectrum() {
        const spectrumWidth = 300;
        const spectrumHeight = 120;
        const startX = this.canvas.width - spectrumWidth - 20;
        const startY = 80;

        // Hintergrund des Spektrums
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.fillRect(startX, startY, spectrumWidth, spectrumHeight);

        // Rahmen
        this.ctx.strokeStyle = '#666666';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(startX, startY, spectrumWidth, spectrumHeight);

        // Titel
        this.ctx.fillStyle = this.options.textColor;
        this.ctx.font = 'bold 14px Arial';
        this.ctx.fillText('Massenspektrum', startX + 10, startY - 8);

        // Achsen
        this.ctx.beginPath();
        this.ctx.moveTo(startX + 40, startY + spectrumHeight - 20);
        this.ctx.lineTo(startX + spectrumWidth - 10, startY + spectrumHeight - 20);
        this.ctx.strokeStyle = '#888888';
        this.ctx.stroke();

        this.ctx.beginPath();
        this.ctx.moveTo(startX + 40, startY + spectrumHeight - 20);
        this.ctx.lineTo(startX + 40, startY + 10);
        this.ctx.stroke();

        // Achsenbeschriftungen
        this.ctx.fillStyle = '#888888';
        this.ctx.font = '12px Arial';
        this.ctx.fillText('m/z', startX + spectrumWidth - 30, startY + spectrumHeight - 5);
        this.ctx.fillText('Intensität', startX + 5, startY + 15);

        // Bestimme den maximalen Massenwert für die Skalierung
        const maxMass = Math.max(...Object.keys(this.spectrumData).map(Number), 40); // Mindestens 40u anzeigen

        // Zeichne die Spektrum-Peaks
        const barWidth = 2;
        const xScale = (spectrumWidth - 60) / maxMass;
        const yScale = (spectrumHeight - 30);

        // Zeichne Skala
        for (let i = 0; i <= maxMass; i += 5) {
            const x = startX + 40 + i * xScale;

            // Kleine Teilstriche
            this.ctx.beginPath();
            this.ctx.moveTo(x, startY + spectrumHeight - 20);
            this.ctx.lineTo(x, startY + spectrumHeight - 15);
            this.ctx.strokeStyle = '#666666';
            this.ctx.stroke();

            // Beschriftung (nur bei geraden Zahlen)
            if (i % 10 === 0) {
                this.ctx.fillStyle = '#888888';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(i.toString(), x - 5, startY + spectrumHeight - 5);
            }
        }

        // Zeichne die Peaks
        for (const mass in this.spectrumData) {
            if (this.spectrumData.hasOwnProperty(mass)) {
                const intensity = this.spectrumData[mass].intensity;
                const normalizedIntensity = this.maxPeakIntensity > 0 ? intensity / this.maxPeakIntensity : 0;

                const x = startX + 40 + parseFloat(mass) * xScale;
                const height = normalizedIntensity * yScale;
                const y = startY + spectrumHeight - 20 - height;

                // Zeichne Balken
                this.ctx.fillStyle = this.spectrumData[mass].color;
                this.ctx.fillRect(x - barWidth/2, y, barWidth, height);

                // Bei hoher Intensität auch Beschriftung anzeigen
                if (normalizedIntensity > 0.3) {
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.font = '10px Arial';
                    this.ctx.fillText(mass, x - 5, y - 5);
                }
            }
        }
    }

    // Zeichnet zusätzliche Informationen
    drawInfoText(ctx) {
        ctx.fillStyle = this.options.textColor;
        ctx.font = 'bold 16px Arial';
        ctx.fillText('Massenspektrometer-Simulation', 20, 30);

        // Physikalische Informationen und Formeln
        ctx.font = '12px Arial';
        ctx.fillText('Bewegung geladener Teilchen im Magnetfeld: F = q·v×B', 20, 50);
        ctx.fillText('Kreisbahn: r = m·v/(q·B)   mit v = √(2·q·V/m)', 20, 70);
    }

    // Aktualisiert die Partikelpositionen für die Animation
    update(dt) {
        // Wenn kein dt geliefert wird, verwende einen Standardwert
        const deltaT = dt || 0.016; // ~ 60fps

        // Animation-Geschwindigkeit (Skalierungsfaktor)
        const animationSpeed = 4.0;
        const scaledDt = deltaT * animationSpeed;

        // Aktualisiere alle Partikel
        this.particles.forEach(particle => {
            // Zeit des Partikels aktualisieren
            particle.time += deltaT;

            // Speichere vorherige Position
            const prevX = particle.x;
            const prevY = particle.y;

            // Partikelbewegung basierend auf dem Zustand des Partikels
            if (particle.x < this.fieldStartX - 5) {
                // ------------------------------------
                // Vor dem Magnetfeld: gerade Bewegung
                // ------------------------------------
                particle.x += 150 * scaledDt;
                particle.y = this.sourceY + (Math.random() * 2 - 1) * 0.2; // Leichte Variation

            } else if (!particle.enteredField && particle.x >= this.fieldStartX - 5) {
                // ------------------------------------
                // Übergangsbereich: Eintritt ins Feld
                // ------------------------------------
                // Markiere, dass das Partikel nun definitiv im Feld ist
                particle.enteredField = true;

                // Initialisiere die Kreisbahn beim Eintritt ins Feld
                particle.angle = Math.PI; // Start am linken Rand des Kreises
                particle.centerX = this.fieldStartX + particle.radius; // Zentrum nach rechts versetzt
                particle.centerY = this.sourceY; // Zentrum auf Höhe der Quelle

                // Berechne erste Position auf der Kreisbahn
                particle.x = particle.centerX + particle.radius * Math.cos(particle.angle);
                particle.y = particle.centerY + particle.radius * Math.sin(particle.angle);

            } else if (particle.enteredField && !particle.exitedField) {
                // ------------------------------------
                // Im Magnetfeld: Kreisbahn
                // ------------------------------------
                // Berechne Winkelgeschwindigkeit basierend auf physikalischen Eigenschaften
                const angularVelocity = (this.elementaryCharge * this.magneticField) / (particle.mass * this.u);

                // Inkrementelle Winkeländerung für flüssige Animation
                particle.angle -= angularVelocity * scaledDt * 60; // Negativer Wert für Bewegung im Uhrzeigersinn

                // Position auf der Kreisbahn berechnen
                particle.x = particle.centerX + particle.radius * Math.cos(particle.angle);
                particle.y = particle.centerY + particle.radius * Math.sin(particle.angle);

                // Prüfen, ob Partikel das Magnetfeld verlässt (rechte Seite)
                if (particle.x > this.fieldEndX + 5) {
                    particle.exitedField = true;

                    // Berechne Richtungsvektor beim Verlassen
                    const dx = particle.x - prevX;
                    const dy = particle.y - prevY;
                    const mag = Math.sqrt(dx*dx + dy*dy);

                    if (mag > 0) {
                        particle.dirX = dx / mag;
                        particle.dirY = dy / mag;
                    } else {
                        particle.dirX = 1;
                        particle.dirY = 0;
                    }
                }

            } else if (particle.exitedField) {
                // ------------------------------------
                // Nach dem Magnetfeld: gerade Bewegung
                // ------------------------------------
                // Stelle sicher, dass die Richtungsvektoren vorhanden sind
                if (!particle.dirX) {
                    particle.dirX = 1;
                    particle.dirY = 0;
                }

                // Bewege mit konstanter Geschwindigkeit in Austrittsrichtung
                const speed = 150 * scaledDt;
                particle.x += particle.dirX * speed;
                particle.y += particle.dirY * speed;
            }

            // Speichere die Positionsdaten für die Spur
            if (this.options.showTrails && !particle.detected) {
                const trail = this.trails[particle.id];
                if (trail) {
                    // Nur hinzufügen, wenn sich die Position signifikant geändert hat
                    const lastPoint = trail.length > 0 ? trail[trail.length - 1] : null;
                    const minDistance = 3; // Minimale Pixeldistanz für neuen Punkt

                    if (!lastPoint ||
                        Math.sqrt(Math.pow(particle.x - lastPoint.x, 2) +
                            Math.pow(particle.y - lastPoint.y, 2)) >= minDistance) {
                        trail.push({x: particle.x, y: particle.y});

                        // Begrenze die Länge der Spur
                        if (trail.length > this.options.trailLength) {
                            trail.shift(); // Entferne den ältesten Punkt
                        }
                    }
                }
            }

            // Prüfen, ob das Partikel den Detektor erreicht hat
            if (!particle.detected && particle.x >= this.detectorX) {
                particle.detected = true;
                this.addToSpectrum(particle);
                console.log(`${particle.name} mit Masse ${particle.mass} u detektiert!`);
            }
        });

        // Partikel entfernen, die den Canvas verlassen haben
        this.particles = this.particles.filter(particle => {
            const isVisible = particle.x <= this.canvas.width + 50 &&
                particle.y >= -50 &&
                particle.y <= this.canvas.height + 50;

            // Wenn Partikel nicht mehr sichtbar, entferne auch seinen Trail
            if (!isVisible && this.trails[particle.id]) {
                delete this.trails[particle.id];
            }

            return isVisible;
        });
    }

    // Fügt ein detektiertes Ion zum Spektrum hinzu
    addToSpectrum(particle) {
        const massKey = particle.mass.toString();

        if (!this.spectrumData[massKey]) {
            this.spectrumData[massKey] = {
                intensity: 0,
                color: particle.color,
                name: particle.name
            };
        }

        // Erhöhe die Intensität dieses Peaks
        this.spectrumData[massKey].intensity += 1;

        // Aktualisiere die maximale Intensität
        if (this.spectrumData[massKey].intensity > this.maxPeakIntensity) {
            this.maxPeakIntensity = this.spectrumData[massKey].intensity;
        }

        // Füge Ion zur Liste der detektierten Ionen hinzu
        this.detectedIons.push({
            name: particle.name,
            mass: particle.mass,
            time: new Date()
        });

        // Aktualisiere die Anzeige der detektierten Ionen im UI
        this.updateDetectedIonsUI();
    }

    // Aktualisiert die UI-Anzeige der detektierten Ionen
    updateDetectedIonsUI() {
        const container = document.getElementById('detectedIonsContainer');
        if (!container) return;

        // Sortiere nach Zeit (neueste zuerst)
        const sortedIons = [...this.detectedIons].sort((a, b) => b.time - a.time);

        // Begrenze auf die letzten 10 Einträge
        const recentIons = sortedIons.slice(0, 10);

        // HTML für die Liste erstellen
        container.innerHTML = recentIons.map(ion => {
            const timeStr = ion.time.toLocaleTimeString();
            return `<div class="detected-ion">
                      <span>${timeStr}</span>: <strong>${ion.name}</strong> (${ion.mass} u)
                    </div>`;
        }).join('');
    }

    // Startet die Animation
    startAnimation() {
        if (this.isAnimating) return;

        this.isAnimating = true;
        this.lastTimestamp = performance.now();

        // Zeichne den Hintergrund einmal
        this.updateBackground();

        const animate = (timestamp) => {
            const delta = (timestamp - this.lastTimestamp) / 1000; // in Sekunden
            this.lastTimestamp = timestamp;

            this.update(delta);
            this.draw();

            if (this.isAnimating) {
                this.animationId = requestAnimationFrame(animate);
            }
        };

        animate(performance.now());
    }

    // Stoppt die Animation
    stopAnimation() {
        this.isAnimating = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    // Berechnet die Radien aller Partikel neu (z.B. nach Änderung von B oder V)
    recalculateParticleRadii() {
        this.particles.forEach(particle => {
            particle.radius = this.calculateRadius(particle.mass);

            // Aktualisiere auch die Geschwindigkeit und Frequenz
            particle.velocity = Math.sqrt(2 * this.elementaryCharge * this.accelerationVoltage / (particle.mass * this.u));
            particle.cyclotronFrequency = (this.elementaryCharge * this.magneticField) / (particle.mass * this.u);
            particle.period = (2 * Math.PI * particle.mass * this.u) / (this.elementaryCharge * this.magneticField);

            // Mittelpunkt der Kreisbahn aktualisieren
            particle.centerY = this.sourceY - particle.radius;
        });

        // Bei Änderung der Parameter soll der Hintergrund neu gezeichnet werden
        this.backgroundNeedsUpdate = true;
    }

    // Zurücksetzen der Simulation
    resetSimulation() {
        this.particles = [];
        this.trails = {};
        this.spectrumData = {};
        this.maxPeakIntensity = 0;
        this.detectedIons = [];
        this.updateDetectedIonsUI();
        this.draw();
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
        uiContainer.style.backdropFilter = 'blur(5px)';

        uiContainer.innerHTML = `
            <h2 style="text-align: center; margin-top: 0;">Massenspektrometer</h2>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                <div style="flex: 1; margin-right: 10px;">
                    <label for="bFieldSlider">Magnetfeld (T): <span id="bFieldValue">${this.magneticField}</span></label>
                    <div style="display: flex; align-items: center;">
                        <input type="range" id="bFieldSlider" min="1" max="10" step="0.5" value="${this.magneticField}" style="flex: 3; margin-right: 5px;">
                        <input type="number" id="bFieldInput" value="${this.magneticField}" step="0.1" min="0.1" max="15" style="flex: 1; width: 60px;">
                    </div>
                </div>
                
                <div style="flex: 1; margin-left: 10px;">
                    <label for="voltageSlider">Spannung (V): <span id="voltageValue">${this.accelerationVoltage}</span></label>
                    <div style="display: flex; align-items: center;">
                        <input type="range" id="voltageSlider" min="1000" max="10000" step="500" value="${this.accelerationVoltage}" style="flex: 3; margin-right: 5px;">
                        <input type="number" id="voltageInput" value="${this.accelerationVoltage}" step="100" min="100" max="20000" style="flex: 1; width: 60px;">
                    </div>
                </div>
            </div>
            
            <div style="display: flex; margin-bottom: 15px;">
                <div style="flex: 1; margin-right: 5px;">
                    <button id="addIonBtn" style="width: 100%; padding: 8px; background: #0066cc; color: white; border: none; border-radius: 4px; cursor: pointer;">Eigenes Ion hinzufügen</button>
                </div>
                <div style="flex: 1; margin-left: 5px;">
                    <button id="resetBtn" style="width: 100%; padding: 8px; background: #cc0000; color: white; border: none; border-radius: 4px; cursor: pointer;">Zurücksetzen</button>
                </div>
            </div>
            
            <div style="display: flex; flex-wrap: wrap; justify-content: space-between; margin-bottom: 15px;">
                <div style="flex: 2; margin-right: 10px;">
                    <div id="ionButtonsContainer" style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${this.particleMasses.map((ion, index) => `
                            <button class="ionBtn" data-index="${index}" style="background-color: ${ion.color}; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; text-shadow: 0 0 2px rgba(0,0,0,0.7);">
                                ${ion.name}
                            </button>
                        `).join('')}
                    </div>
                </div>
                
                <div style="flex: 1; margin-left: 10px; border-left: 1px solid #444; padding-left: 10px;">
                    <h3 style="margin-top: 0; font-size: 14px;">Detektierte Ionen</h3>
                    <div id="detectedIonsContainer" style="font-size: 12px; max-height: 100px; overflow-y: auto;">
                        <!-- Hier werden detektierte Ionen angezeigt -->
                    </div>
                </div>
            </div>
            
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <div style="flex: 1;">
                    <label for="trailsCheckbox" style="display: flex; align-items: center; cursor: pointer;">
                        <input type="checkbox" id="trailsCheckbox" ${this.options.showTrails ? 'checked' : ''} style="margin-right: 5px;">
                        Partikelspuren anzeigen
                    </label>
                </div>
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
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
                this.magneticField = Math.min(Math.max(value, 0.1), 15);
                e.target.value = this.magneticField;
                if (this.magneticField >= 1 && this.magneticField <= 10) {
                    document.getElementById('bFieldSlider').value = this.magneticField;
                }
                document.getElementById('bFieldValue').textContent = this.magneticField;
                this.recalculateParticleRadii();
                this.draw();
            }
        });

        document.getElementById('voltageSlider').addEventListener('input', (e) => {
            this.accelerationVoltage = parseFloat(e.target.value);
            document.getElementById('voltageValue').textContent = this.accelerationVoltage;
            document.getElementById('voltageInput').value = this.accelerationVoltage;
            this.recalculateParticleRadii();
            this.draw();
        });

        document.getElementById('voltageInput').addEventListener('change', (e) => {
            const value = parseFloat(e.target.value);
            if (!isNaN(value) && value > 0) {
                this.accelerationVoltage = Math.min(Math.max(value, 100), 20000);
                e.target.value = this.accelerationVoltage;
                if (this.accelerationVoltage >= 1000 && this.accelerationVoltage <= 10000) {
                    document.getElementById('voltageSlider').value = this.accelerationVoltage;
                }
                document.getElementById('voltageValue').textContent = this.accelerationVoltage;
                this.recalculateParticleRadii();
                this.draw();
            }
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
            this.resetSimulation();
        });

        document.getElementById('trailsCheckbox').addEventListener('change', (e) => {
            this.options.showTrails = e.target.checked;
            if (!this.options.showTrails) {
                // Trails löschen wenn deaktiviert
                this.trails = {};
            } else {
                // Trails für existierende Partikel initialisieren
                this.particles.forEach(particle => {
                    this.trails[particle.id] = [{x: particle.x, y: particle.y}];
                });
            }
            this.draw();
        });

        // Event-Listener für Ion-Buttons
        this.updateIonButtons();
    }

    // Aktualisiert die Ion-Buttons basierend auf den verfügbaren Ionen
    updateIonButtons() {
        const buttonContainer = document.getElementById('ionButtonsContainer');
        if (!buttonContainer) return;

        buttonContainer.innerHTML = this.particleMasses.map((ion, index) => `
            <button class="ionBtn" data-index="${index}" style="background-color: ${ion.color}; color: white; padding: 5px; border: none; border-radius: 4px; cursor: pointer; text-shadow: 0 0 2px rgba(0,0,0,0.7);">
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
}

// Funktion zum Initialisieren des Massenspektrometers
export function initMassSpectrometer() {
    const massSpec = new MassSpectrometer('massSpecCanvas', {
        backgroundColor: '#1a1a1a',
        showTrails: true,
        trailLength: 150
    });

    return massSpec;
}