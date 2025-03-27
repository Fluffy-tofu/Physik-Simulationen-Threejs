# Physiksimulationen mit Three.js

Eine Sammlung interaktiver 3D-Physiksimulationen, die mit Three.js entwickelt wurden. Dieses Projekt veranschaulicht verschiedene physikalische Konzepte durch visuelle, webbasierte Demonstrationen.

## Simulationen

### 1. Zyklotron
- Simulation der Teilchenbeschleunigung in einem Zyklotron
- Visualisierung der magnetischen und elektrischen Felder
- Darstellung der Teilchenbahn
- Anzeige von Energie, Geschwindigkeit und Frequenz in Echtzeit
- Anpassbare Parameter (Magnetfeld, Spannung, Teilchenmasse)
- Wählbare Teilchentypen (Proton, Elektron, Alpha-Teilchen, Deuteron)
- Realistische Wertedarstellung

### 2. Wienscher Geschwindigkeitsfilter
- Simulation der Bewegung geladener Teilchen in gekreuzten E- und B-Feldern
- Visualisierung der Feldlinien
- Interaktive Anpassung von E-Feld, B-Feld und Teilchenparametern
- Demonstration der Geschwindigkeitsselektion geladener Teilchen
- Anzeige der Lorentzkraft und ihrer Auswirkungen

### 3. Massenspektrometer nach Bainbridge
- Vollständige Simulation eines Massenspektrometers
- Visualisierung der Ablenkung von Ionen unterschiedlicher Masse
- Darstellung von Magnetfeld und elektrischem Feld
- Analyse verschiedener Proben mit unterschiedlichen Ionentypen
- Interaktive Steuerung von Feld- und Filtereigenschaften

### 4. Hall-Effekt
- Interaktive Demonstration des Hall-Effekts
- Visualisierung der Elektronenbewegung in einem Leiter
- Darstellung der Lorentzkraft und der resultierenden Ladungstrennung
- Berechnung und Anzeige der Hall-Spannung
- Auswahl verschiedener Materialien mit unterschiedlichen Hall-Koeffizienten
- Eingebautes Tutorial zur Erklärung des physikalischen Prinzips

## Technische Details

### Verwendete Technologien
- Three.js für die 3D-Rendering
- JavaScript ES6+
- HTML5 Canvas
- CSS3 für Styling
- Vite für Entwicklung und Build-Prozess

### Physik-Implementierung
- Benutzerdefinierte Physik-Engines für jede Simulation
- Zeitschrittbasierte Berechnungen
- Vektorrechnung für Kraftberechnungen
- Kollisionserkennung und -reaktion
- Visualisierung von Teilchenbahnen

## Installation

### Voraussetzungen
- Node.js (Version 14 oder höher empfohlen)
- npm oder yarn Paketmanager

### Installation
1. Repository klonen:
```bash
git clone [repository-url]
```

2. Abhängigkeiten installieren:
```bash
npm install
```

3. Entwicklungsserver starten:
```bash
npm run dev
```

4. Browser öffnen und zu `http://localhost:5173` navigieren

## Verwendung

Auf der Hauptseite kann jede Simulation durch Anklicken des entsprechenden Buttons aufgerufen werden:

- **Zyklotron**: Simulation eines Teilchenbeschleunigers
- **Wienscher Geschwindigkeitsfilter**: Demonstration der Geschwindigkeitsselektion
- **Massenspektrometer**: Analyse verschiedener Ionentypen
- **Hall-Effekt**: Visualisierung und Erklärung des Hall-Effekts

### Steuerung
- Linksklick und Ziehen, um die Kamera zu drehen
- Rechtsklick und Ziehen, um die Kamera zu schwenken
- Mausrad zum Zoomen
- "Start Animation" / "Animation starten" Button zum Starten/Pausieren
- "Back to Menu" / "Zurück zum Menü" Button, um zur Auswahlseite zurückzukehren

### Simulations-spezifische Steuerungen

#### Zyklotron
- Anpassbare Parameter:
  - Teilchentyp (Proton, Elektron, Alpha-Teilchen, Deuteron)
  - Magnetfeldstärke
  - Spannung
  - Anfangsgeschwindigkeit
  - Dee-Größe

#### Wienscher Geschwindigkeitsfilter
- Anpassbare Parameter:
  - E-Feld Stärke
  - B-Feld Stärke
  - Teilchengeschwindigkeit
  - Teilchenladung

#### Massenspektrometer
- Probenauswahl (A oder B)
- Steuerung für B-Feld im Filter
- Steuerung für E-Feld
- Steuerung für B-Feld im Analysator

#### Hall-Effekt
- Anpassbare Parameter:
  - B-Feld Stärke
  - Stromstärke
  - Materialauswahl (mit verschiedenen Hall-Koeffizienten)
- Interaktives Tutorial zur Erklärung der Funktionsweise

## Lizenz

Dieses Projekt steht unter der MIT-Lizenz.
