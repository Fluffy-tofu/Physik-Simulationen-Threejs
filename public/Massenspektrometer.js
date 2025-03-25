import './style.css';

// SVG definitions - we'll define these inline rather than loading external files
const SVG_DEFS = {
    EFELD: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="108" viewBox="0 0 6 108">
        <path d="M0.666,4.403L3,0.901L5.334,4.403" style="fill:none;stroke:black;stroke-width:1px;"/>
        <path d="M3,108L3,0.901" style="fill:none;stroke:black;stroke-width:1px;stroke-linejoin:round;stroke-miterlimit:1.5;"/>
    </svg>`,
    EFELD2: `<svg xmlns="http://www.w3.org/2000/svg" width="6" height="108" viewBox="0 0 6 108">
        <g transform="matrix(1,0,0,-1,0,108)">
            <g transform="matrix(1,0,0,-1,-0,108)">
                <path d="M5.334,103.597L3,107.099L0.666,103.597" style="fill:none;stroke:black;stroke-width:1px;"/>
                <path d="M3,0L3,107.099" style="fill:none;stroke:black;stroke-width:1px;stroke-linejoin:round;stroke-miterlimit:1.5;"/>
            </g>
        </g>
    </svg>`,
    MAGNETFELD_ANALYSE: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">
        <path d="M3.373,0.667C4.893,0.667 6.127,1.901 6.127,3.422C6.127,4.942 4.893,6.177 3.373,6.177C1.852,6.177 0.618,4.942 0.618,3.422C0.618,1.901 1.852,0.667 3.373,0.667ZM3.373,1.016C4.701,1.016 5.779,2.094 5.779,3.422C5.779,4.75 4.701,5.828 3.373,5.828C2.045,5.828 0.966,4.75 0.966,3.422C0.966,2.094 2.045,1.016 3.373,1.016Z" style="fill:rgb(247,165,19);" transform="matrix(1.99653,0,0,1.99654,-1.18085,-1.32997)"/>
        <ellipse cx="5.296" cy="5.34" rx="0.729" ry="0.649" style="fill:rgb(247,165,19);" transform="matrix(1.37251,0,0,1.54172,-1.71584,-2.73069)"/>
    </svg>`,
    MAGNETFELD_ANALYSE2: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">
        <path d="M3.373,0.667C4.893,0.667 6.127,1.901 6.127,3.422C6.127,4.942 4.893,6.177 3.373,6.177C1.852,6.177 0.618,4.942 0.618,3.422C0.618,1.901 1.852,0.667 3.373,0.667ZM3.373,1.016C4.701,1.016 5.779,2.094 5.779,3.422C5.779,4.75 4.701,5.828 3.373,5.828C2.045,5.828 0.966,4.75 0.966,3.422C0.966,2.094 2.045,1.016 3.373,1.016Z" style="fill:rgb(247,165,19);" transform="matrix(1.99653,0,0,1.99654,-1.18085,-1.32997)"/>
        <path d="M5.553,0.507L5.553,10.653" style="fill:none;stroke:rgb(247,165,19);stroke-width:1.02px;" transform="matrix(0.689952,-0.689952,0.689952,0.689952,-2.12831,5.56138)"/>
        <path d="M5.553,0.507L5.553,10.653" style="fill:none;stroke:rgb(247,165,19);stroke-width:1.02px;" transform="matrix(-0.689952,-0.689952,0.689952,-0.689952,5.53426,13.2614)"/>
    </svg>`,
    MAGNETFELD_FILTER: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">
        <path d="M3.373,0.667C4.893,0.667 6.127,1.901 6.127,3.422C6.127,4.942 4.893,6.177 3.373,6.177C1.852,6.177 0.618,4.942 0.618,3.422C0.618,1.901 1.852,0.667 3.373,0.667ZM3.373,1.016C4.701,1.016 5.779,2.094 5.779,3.422C5.779,4.75 4.701,5.828 3.373,5.828C2.045,5.828 0.966,4.75 0.966,3.422C0.966,2.094 2.045,1.016 3.373,1.016Z" style="fill:rgb(10,201,19);" transform="matrix(1.90711,0,0,1.90223,-2.1767,-2.73958)"/>
        <ellipse cx="5.074" cy="5.1" rx="0.844" ry="1.173" style="fill:rgb(10,201,19);" transform="matrix(1.13163,0,0,0.812341,-1.48629,-0.375317)"/>
    </svg>`,
    MAGNETFELD_FILTER2: `<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 11 11">
        <path d="M3.373,0.667C4.893,0.667 6.127,1.901 6.127,3.422C6.127,4.942 4.893,6.177 3.373,6.177C1.852,6.177 0.618,4.942 0.618,3.422C0.618,1.901 1.852,0.667 3.373,0.667ZM3.373,1.016C4.701,1.016 5.779,2.094 5.779,3.422C5.779,4.75 4.701,5.828 3.373,5.828C2.045,5.828 0.966,4.75 0.966,3.422C0.966,2.094 2.045,1.016 3.373,1.016Z" style="fill:rgb(10,201,19);" transform="matrix(1.99653,0,0,1.99654,-1.23386,-1.32997)"/>
        <path d="M5.553,0.507L5.553,10.653" style="fill:none;stroke:rgb(10,201,19);stroke-width:1.02px;" transform="matrix(0.689952,-0.689952,0.689952,0.689952,-2.18132,5.56138)"/>
        <path d="M5.553,0.507L5.553,10.653" style="fill:none;stroke:rgb(10,201,19);stroke-width:1.02px;" transform="matrix(-0.689952,-0.689952,0.689952,-0.689952,5.48125,13.2614)"/>
    </svg>`,
    SKALA: `<svg xmlns="http://www.w3.org/2000/svg" width="13.211104mm" height="99.818001mm" viewBox="0 0 13.211104 99.817999">
        <!-- Scale markings - simplified version -->
        <g transform="translate(-42.086815,-28.016009)">
            <path style="fill:none;stroke:#000000;stroke-width:0.3346743px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                d="m 51.329168,125.55 h 3.96875" />
            <path style="fill:none;stroke:#000000;stroke-width:0.3346743px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                d="m 52.652085,123.43334 h 2.645833" />
            <path style="fill:none;stroke:#000000;stroke-width:0.3346743px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                d="m 52.652085,121.31668 h 2.645833" />
            <path style="fill:none;stroke:#000000;stroke-width:0.3346743px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                d="m 52.652085,119.19999 h 2.645833" />
            <path style="fill:none;stroke:#000000;stroke-width:0.3346743px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                d="m 52.652085,117.08333 h 2.645833" />
            <path style="fill:none;stroke:#000000;stroke-width:0.3346743px;stroke-linecap:butt;stroke-linejoin:miter;stroke-opacity:1"
                d="m 51.329169,114.96666 h 3.96875" />
            <!-- More scale markings omitted for brevity -->
            
            <!-- Scale labels -->
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.576752" y="105.17144">3 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.502636" y="126.37839">1 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.557434" y="115.8021">2 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.510609" y="94.595856">4 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.494072" y="84.01252">5 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.494072" y="73.429192">6 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.494072" y="62.829319">7 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.527145" y="52.279057">8 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="43.527145" y="41.679188">9 cm</text>
            <text style="font-size:2.82222223px;line-height:1.25;font-family:sans-serif;letter-spacing:0px;word-spacing:0px;fill:#000000;"
                x="41.70372" y="31.104366">10 cm</text>
        </g>
    </svg>`
};

// Global state
let simulationState = {
    isAnimating: false,
    time: 0,
    particles: [],
    Bf: 0, // B-field strength in filter
    Ba: 0, // B-field strength in analyzer
    Ef: 0, // E-field strength
    sampleType: "A" // Sample type A or B
};

// Initialize the simulation
document.addEventListener('DOMContentLoaded', () => {
    // Create the simulation structure
    setupSimulation();
    
    // Add event listeners to controls
    setupEventListeners();
    
    // Set initial values for fields
    updateFields();
    
    // Load MathJax if it exists
    if(window.MathJax) {
        window.MathJax.typeset();
    }
});

// Create the HTML structure for the simulation
function setupSimulation() {
    const root = document.getElementById('root');
    
    // Create simulation container
    const simulationDiv = document.createElement('div');
    simulationDiv.className = 'ms-simulation';
    simulationDiv.id = 'simulation';
    
    // Add simulation elements
    simulationDiv.innerHTML = `
        <div class="blendeOben"></div>
        <div class="blendeUnten"></div>
        <div id="magnetfeldZeichen" class="magnetfeldZeichen"></div>
        <div id="magnetfeldZeichen2" class="magnetfeldZeichen2" style="display:none;"></div>
        <div id="efeldZeichen" class="efeldZeichen"></div>
        <div id="efeldZeichen2" class="efeldZeichen2" style="display:none;"></div>
        <div class="kondensator kondensatorOben"></div>
        <div class="kondensator kondensatorUnten"></div>
        <div class="ionenQuelle">
            <div class="quelle">Quelle</div>
            <div class="ladung">\\(q = -e\\)</div>
        </div>
        <div class="blendeUnten blendeAnalysatorUnten"></div>
        <div class="schirm"></div>
        <div class="skala" id="skala"></div>
        <div class="analysator">
            <div id="magnetfeldFilter" class="magnetfeldFilter"></div>
            <div id="magnetfeldFilter2" class="magnetfeldFilter2" style="display:none;"></div>
        </div>
    `;
    
    root.appendChild(simulationDiv);
    
    // Create controls
    const controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = `
        <select id="sampleSelect">
            <option value="A">Probe A</option>
            <option value="B">Probe B</option>
        </select>
        <input type="button" id="startStopBtn" value="Start" />
        <input type="button" id="resetBtn" value="Zurücksetzen" />
    `;
    
    root.appendChild(controls);
    
    // Create field settings
    const settingFilter = document.createElement('div');
    settingFilter.className = 'settingFilter setting';
    settingFilter.innerHTML = `
        <input type="range" id="bFieldFilter" min="0" max="0.01" step="0.0005" value="0" />
        \\( B_{\\rm{F}} = \\) <span id="bFieldFilterValue">0</span> \\(\\rm{T} \\)<br />
        <input type="range" id="eField" min="0" max="0.02" step="0.001" value="0" />
        \\( E_{\\mathrm{F}} = \\) <span id="eFieldValue">0</span> \\( \\rm{\\frac{V}{m}} \\)
    `;
    
    const settingAnalysator = document.createElement('div');
    settingAnalysator.className = 'settingAnalysator setting';
    settingAnalysator.innerHTML = `
        <input type="range" id="bFieldAnalysator" min="0" max="0.08" step="0.005" value="0" />
        \\( B_{\\mathrm{A}} = \\) <span id="bFieldAnalysatorValue">0</span> \\(\\mathrm{T} \\)
    `;
    
    const constants = document.createElement('div');
    constants.className = 'constants';
    constants.innerHTML = `
        Konstanten: <br>
        <span>\\( 1 \\, e = 1{,}6 \\cdot 10^{-19} \\, \\mathrm{C} \\)</span> <br>
        <span>\\( 1 \\, u = 1{,}66 \\cdot 10^{-27} \\, \\mathrm{kg} \\)</span>
    `;
    
    root.appendChild(settingFilter);
    root.appendChild(settingAnalysator);
    root.appendChild(constants);
    
    // Add SVG elements for fields
    updateFieldVisuals();
    updateScaleImage();
}

// Update the field visualizations based on current values
function updateFieldVisuals() {
    // Magnetic field filter
    const magnetfeldZeichen = document.getElementById('magnetfeldZeichen');
    const magnetfeldZeichen2 = document.getElementById('magnetfeldZeichen2');
    
    // Clear field visualizations
    magnetfeldZeichen.innerHTML = '';
    magnetfeldZeichen2.innerHTML = '';
    
    // Hide visualizations if B-field is zero
    if (simulationState.Bf === 0) {
        magnetfeldZeichen.style.display = 'none';
        magnetfeldZeichen2.style.display = 'none';
    } else {
        const margin = 2.8 / Math.sqrt(Math.abs(simulationState.Bf));
        
        // Show the appropriate field based on polarity
        if (simulationState.Bf > 0) {
            magnetfeldZeichen.style.display = 'flex';
            magnetfeldZeichen2.style.display = 'none';
            
            // Create field indicators
            for (let i = 0; i < 300; i++) {
                const div = document.createElement('div');
                div.style.margin = margin + 'px';
                div.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.MAGNETFELD_FILTER)}')`;
                magnetfeldZeichen.appendChild(div);
            }
        } else {
            magnetfeldZeichen.style.display = 'none';
            magnetfeldZeichen2.style.display = 'flex';
            
            // Create field indicators
            for (let i = 0; i < 300; i++) {
                const div = document.createElement('div');
                div.style.margin = margin + 'px';
                div.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.MAGNETFELD_FILTER2)}')`;
                magnetfeldZeichen2.appendChild(div);
            }
        }
    }
    
    // Electric field
    const efeldZeichen = document.getElementById('efeldZeichen');
    const efeldZeichen2 = document.getElementById('efeldZeichen2');
    
    // Clear field visualizations
    efeldZeichen.innerHTML = '';
    efeldZeichen2.innerHTML = '';
    
    // Hide visualizations if E-field is zero
    if (simulationState.Ef === 0) {
        efeldZeichen.style.display = 'none';
        efeldZeichen2.style.display = 'none';
    } else {
        const spacing = Math.ceil(2.275 / Math.sqrt(Math.abs(simulationState.Ef)));
        
        // Show the appropriate field based on polarity
        if (simulationState.Ef > 0) {
            efeldZeichen.style.display = 'flex';
            efeldZeichen2.style.display = 'none';
            
            // Create field indicators
            for (let i = 0; i < 30; i++) {
                const div = document.createElement('div');
                div.style.marginLeft = spacing + 'px';
                div.style.marginRight = spacing + 'px';
                
                const img = document.createElement('img');
                img.src = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.EFELD)}`;
                img.alt = '';
                
                div.appendChild(img);
                efeldZeichen.appendChild(div);
            }
        } else {
            efeldZeichen.style.display = 'none';
            efeldZeichen2.style.display = 'flex';
            
            // Create field indicators
            for (let i = 0; i < 30; i++) {
                const div = document.createElement('div');
                div.style.marginLeft = spacing + 'px';
                div.style.marginRight = spacing + 'px';
                
                const img = document.createElement('img');
                img.src = `data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.EFELD2)}`;
                img.alt = '';
                
                div.appendChild(img);
                efeldZeichen2.appendChild(div);
            }
        }
    }
    
    // Magnetic field analyzer
    const magnetfeldFilter = document.getElementById('magnetfeldFilter');
    const magnetfeldFilter2 = document.getElementById('magnetfeldFilter2');
    
    // Clear field visualizations
    magnetfeldFilter.innerHTML = '';
    magnetfeldFilter2.innerHTML = '';
    
    // Hide visualizations if B-field is zero
    if (simulationState.Ba === 0) {
        magnetfeldFilter.style.display = 'none';
        magnetfeldFilter2.style.display = 'none';
    } else {
        const mbMargin = 2 / Math.sqrt(Math.abs(simulationState.Ba));
        
        // Show the appropriate field based on polarity
        if (simulationState.Ba > 0) {
            magnetfeldFilter.style.display = 'flex';
            magnetfeldFilter2.style.display = 'none';
            
            // Create field indicators
            for (let i = 0; i < 500; i++) {
                const div = document.createElement('div');
                div.style.margin = mbMargin + 'px';
                div.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.MAGNETFELD_ANALYSE)}')`;
                magnetfeldFilter.appendChild(div);
            }
        } else {
            magnetfeldFilter.style.display = 'none';
            magnetfeldFilter2.style.display = 'flex';
            
            // Create field indicators
            for (let i = 0; i < 500; i++) {
                const div = document.createElement('div');
                div.style.margin = mbMargin + 'px';
                div.style.backgroundImage = `url('data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.MAGNETFELD_ANALYSE2)}')`;
                magnetfeldFilter2.appendChild(div);
            }
        }
    }
}

// Update the scale image
function updateScaleImage() {
    const skala = document.getElementById('skala');
    skala.innerHTML = `<img src="data:image/svg+xml;utf8,${encodeURIComponent(SVG_DEFS.SKALA)}" alt="Skala">`;
}

// Set up event listeners for controls
function setupEventListeners() {
    // Start/Stop button
    const startStopBtn = document.getElementById('startStopBtn');
    startStopBtn.addEventListener('click', () => {
        simulationState.isAnimating = !simulationState.isAnimating;
        startStopBtn.value = simulationState.isAnimating ? "Stop" : "Start";
        
        if (simulationState.isAnimating) {
            animateSimulation();
        }
    });
    
    // Reset button
    const resetBtn = document.getElementById('resetBtn');
    resetBtn.addEventListener('click', () => {
        simulationState.particles = [];
        updateSimulation();
    });
    
    // Sample type selector
    const sampleSelect = document.getElementById('sampleSelect');
    sampleSelect.addEventListener('change', (e) => {
        simulationState.sampleType = e.target.value;
        simulationState.particles = [];
    });
    
    // B-field filter slider
    const bFieldFilter = document.getElementById('bFieldFilter');
    bFieldFilter.addEventListener('input', (e) => {
        simulationState.Bf = parseFloat(e.target.value);
        updateFields();
    });
    
    // E-field slider
    const eField = document.getElementById('eField');
    eField.addEventListener('input', (e) => {
        simulationState.Ef = parseFloat(e.target.value);
        updateFields();
    });
    
    // B-field analyzer slider
    const bFieldAnalysator = document.getElementById('bFieldAnalysator');
    bFieldAnalysator.addEventListener('input', (e) => {
        simulationState.Ba = parseFloat(e.target.value);
        updateFields();
    });
}

// Update field values and visualizations
function updateFields() {
    // Update field value displays
    document.getElementById('bFieldFilterValue').textContent = simulationState.Bf;
    document.getElementById('eFieldValue').textContent = (simulationState.Ef * 100).toFixed(1);
    document.getElementById('bFieldAnalysatorValue').textContent = simulationState.Ba;
    
    // Update field visualizations
    updateFieldVisuals();
    
    // Update MathJax if it exists
    if (window.MathJax) {
        window.MathJax.typeset();
    }
}

// Function removed as requested

// Animation loop
function animateSimulation() {
    if (!simulationState.isAnimating) return;
    
    // Increment time
    simulationState.time++;
    
    // Add new particles periodically
    if (simulationState.time % 8 === 0) {
        let mass, color, speed;
        
        if (simulationState.sampleType === "B") {
            const random = Math.random();
            
            if (random < 0.34) {
                mass = -2;
                color = "firebrick";
                speed = 3.0;
            } else if (random < 0.67) {
                mass = -1.223;
                color = "deeppink";
                speed = 3.64;
            } else {
                mass = -2.7;
                color = "LightSeaGreen";
                speed = 2.5;
            }
        } else {
            mass = -1.4;
            color = "DarkViolet";
            speed = 3.2;
        }
        
        simulationState.particles.push({
            x: -40,
            y: 150,
            vx: speed,
            vy: 0,
            m: mass,
            t: color,
            passedFilter: false
        });
    }
    
    // Update particle positions
    simulationState.particles.forEach((particle, index) => {
        // Check if particle is out of bounds or in a "sink"
        if (
            // Particle has passed the filter and is in the detection gap
            (particle.passedFilter && particle.x > 600 && particle.x < 650 && (particle.y < 145 || particle.y > 155)) ||
            // Particle is out of bounds
            (particle.x < 600 && (particle.y > 300 || particle.y < 10)) || 
            (particle.x > 600 && particle.x < 650 && (particle.y < 146 || particle.y > 154)) || 
            particle.x > 915 || 
            particle.y < -260 || 
            particle.y > 300
        ) {
            // Remove particle
            simulationState.particles.splice(index, 1);
            return;
        }
        
        // Flag particles that have passed the filter
        if (particle.x > 660) {
            particle.passedFilter = true;
        }
        
        // Calculate velocity magnitude and direction
        const speed = Math.sqrt(particle.vx * particle.vx + particle.vy * particle.vy);
        const nx = particle.vx / speed;
        const ny = particle.vy / speed;
        
        // Apply magnetic and electric fields
        let bField = 0, eField = 0;
        
        if (particle.x >= 0 && particle.x < 600) {
            // In filter region
            bField = (-1) * simulationState.Bf;
            eField = (-1) * simulationState.Ef;
        } else if (particle.x > 650) {
            // In analyzer region
            bField = (-1) * simulationState.Ba;
            eField = 0;
        }
        
        // Calculate magnetic force (perpendicular to velocity and field)
        const forceMag = (+speed * bField) / particle.m;
        const fx = ny * forceMag;   // Force in x-direction
        const fy = -nx * forceMag;  // Force in y-direction
        
        // Update velocity
        particle.vx += fx;
        particle.vy += fy;
        
        // Apply electric field
        particle.vy += eField / particle.m;
        
        // Update position
        particle.x += particle.vx;
        particle.y += particle.vy;
    });
    
    // Update visual representation
    updateSimulation();
    
    // Continue animation loop
    requestAnimationFrame(animateSimulation);
}

// Update the visual representation of particles
function updateSimulation() {
    const simulation = document.getElementById('simulation');
    
    // Remove existing particle elements
    const existingParticles = simulation.querySelectorAll('.point');
    existingParticles.forEach(p => p.remove());
    
    // Create elements for each particle
    simulationState.particles.forEach(particle => {
        const particleElement = document.createElement('div');
        particleElement.className = 'point';
        particleElement.style.left = particle.x + 'px';
        particleElement.style.top = particle.y + 'px';
        particleElement.style.backgroundColor = particle.t;
        
        simulation.appendChild(particleElement);
    });
}