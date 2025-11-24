// Data for the visualization
const data = [
    { 
        industry: "Accommodation/Food Service", 
        users: 1, 
        total: 5,
        people: [
            { name: "Maria", job: "Hotel Front Desk Clerk", drug: "Marijuana", isUser: true },
            { name: "James", job: "Restaurant Server", drug: null, isUser: false },
            { name: "Sarah", job: "Kitchen Manager", drug: null, isUser: false },
            { name: "David", job: "Housekeeper", drug: null, isUser: false },
            { name: "Emily", job: "Bartender", drug: null, isUser: false }
        ]
    },
    { 
        industry: "Arts/Entertainment/Recreation", 
        users: 1, 
        total: 6,
        people: [
            { name: "Alex", job: "Stage Technician", drug: "Cocaine", isUser: true },
            { name: "Jordan", job: "Museum Curator", drug: null, isUser: false },
            { name: "Taylor", job: "Fitness Instructor", drug: null, isUser: false },
            { name: "Casey", job: "Sound Engineer", drug: null, isUser: false },
            { name: "Morgan", job: "Event Coordinator", drug: null, isUser: false },
            { name: "Riley", job: "Park Ranger", drug: null, isUser: false }
        ]
    },
    { 
        industry: "Construction", 
        users: 1, 
        total: 7,
        people: [
            { name: "Michael", job: "Heavy Equipment Operator", drug: "Opioids", isUser: true },
            { name: "Robert", job: "Construction Foreman", drug: null, isUser: false },
            { name: "Alexa", job: "Carpenter", drug: null, isUser: false },
            { name: "John", job: "Electrician", drug: null, isUser: false },
            { name: "Danielle", job: "Plumber", drug: null, isUser: false },
            { name: "Matthew", job: "Welder", drug: null, isUser: false },
            { name: "Olivia", job: "Roofer", drug: null, isUser: false }
        ]
    },
    { 
        industry: "Fishing, Farming, Forestry", 
        users: 1, 
        total: 8,
        people: [
            { name: "Thomas", job: "Commercial Fisherman", drug: "Methamphetamine", isUser: true },
            { name: "Christina", job: "Farm Manager", drug: null, isUser: false },
            { name: "Harper", job: "Agricultural Worker", drug: null, isUser: false },
            { name: "Joshua", job: "Livestock Handler", drug: null, isUser: false },
            { name: "Ava", job: "Forest Logger", drug: null, isUser: false },
            { name: "Brandon", job: "Tractor Operator", drug: null, isUser: false },
            { name: "Elizabeth", job: "Irrigation Technician", drug: null, isUser: false },
            { name: "Samuel", job: "Pest Control Specialist", drug: null, isUser: false }
        ]
    },
    { 
        industry: "Healthcare (support roles)", 
        users: 1, 
        total: 10,
        people: [
            { name: "Jessica", job: "Medical Receptionist", drug: "Prescription Stimulants", isUser: true },
            { name: "Theo", job: "Medical Assistant", drug: null, isUser: false },
            { name: "Amanda", job: "Pharmacy Technician", drug: null, isUser: false },
            { name: "Daniel", job: "Patient Transport", drug: null, isUser: false },
            { name: "Melissa", job: "Medical Billing Specialist", drug: null, isUser: false },
            { name: "Nicholas", job: "Environmental Services", drug: null, isUser: false },
            { name: "Stephanie", job: "Lab Assistant", drug: null, isUser: false },
            { name: "Robert", job: "Dietary Aide", drug: null, isUser: false },
            { name: "Rachel", job: "Medical Records Clerk", drug: null, isUser: false },
            { name: "Oliver", job: "Physical Therapy Aide", drug: null, isUser: false }
        ]
    }
];

// Create human figure SVG
function createFigure(isUser) {
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("viewBox", "0 0 100 180");
    svg.classList.add("figure");
    svg.classList.add(isUser ? "user" : "non-user");

    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    
    // Head
    const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    head.setAttribute("cx", "50");
    head.setAttribute("cy", "30");
    head.setAttribute("r", "18");
    
    // Torso
    const torso = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    torso.setAttribute("x", "35");
    torso.setAttribute("y", "48");
    torso.setAttribute("width", "30");
    torso.setAttribute("height", "50");
    torso.setAttribute("rx", "8");
    
    // Left arm
    const leftArm = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    leftArm.setAttribute("x", "23");
    leftArm.setAttribute("y", "48");
    leftArm.setAttribute("width", "10");
    leftArm.setAttribute("height", "45");
    leftArm.setAttribute("rx", "5");
    leftArm.setAttribute("transform", "rotate(20 28 50)");
    
    // Right arm
    const rightArm = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rightArm.setAttribute("x", "67");
    rightArm.setAttribute("y", "48");
    rightArm.setAttribute("width", "10");
    rightArm.setAttribute("height", "45");
    rightArm.setAttribute("rx", "5");
    rightArm.setAttribute("transform", "rotate(-20 72 50)");
    
    // Left leg
    const leftLeg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    leftLeg.setAttribute("x", "38");
    leftLeg.setAttribute("y", "98");
    leftLeg.setAttribute("width", "12");
    leftLeg.setAttribute("height", "70");
    leftLeg.setAttribute("rx", "6");
    
    // Right leg
    const rightLeg = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    rightLeg.setAttribute("x", "50");
    rightLeg.setAttribute("y", "98");
    rightLeg.setAttribute("width", "12");
    rightLeg.setAttribute("height", "70");
    rightLeg.setAttribute("rx", "6");
    
    g.appendChild(leftArm);
    g.appendChild(rightArm);
    g.appendChild(torso);
    g.appendChild(leftLeg);
    g.appendChild(rightLeg);
    g.appendChild(head);
    
    svg.appendChild(g);
    return svg;
}

// Initialize the visualization
function initVisualization() {
    const chart = document.getElementById("chart");
    const tooltip = document.getElementById("tooltip");
    
    if (!chart || !tooltip) {
        console.error("Required elements not found");
        return;
    }

    // Clear existing content
    chart.innerHTML = '';

    data.forEach(item => {
        const row = document.createElement("div");
        row.classList.add("industry-row");

        const label = document.createElement("div");
        label.classList.add("industry-label");
        label.textContent = item.industry;
        
        // Add click interaction to highlight industry
        label.addEventListener("click", () => {
            // Remove previous highlights
            document.querySelectorAll('.industry-row').forEach(r => r.classList.remove('highlighted'));
            // Add highlight to current row
            row.classList.add('highlighted');
        });

        const figuresContainer = document.createElement("div");
        figuresContainer.classList.add("figures-container");

        item.people.forEach((person, i) => {
            const figure = createFigure(person.isUser);
            
            // Add click event for mobile
            figure.addEventListener("click", (e) => {
                e.stopPropagation();
                showTooltip(person, e);
            });
            
            figure.addEventListener("mouseenter", (e) => {
                showTooltip(person, e);
            });

            figure.addEventListener("mousemove", (e) => {
                updateTooltipPosition(e);
            });

            figure.addEventListener("mouseleave", () => {
                hideTooltip();
            });

            figuresContainer.appendChild(figure);
        });

        row.appendChild(label);
        row.appendChild(figuresContainer);
        chart.appendChild(row);
    });

    // Calculate and display overall stats
    calculateStats();
    
    // Close tooltip when clicking outside
    document.addEventListener("click", hideTooltip);
}

// Show tooltip with person information
function showTooltip(person, event) {
    const tooltip = document.getElementById("tooltip");
    
    let tooltipHTML = `<div class="tooltip-name">${person.name}</div>`;
    tooltipHTML += `<div class="tooltip-job">${person.job}</div>`;
    
    if (person.isUser && person.drug) {
        tooltipHTML += `<div class="tooltip-drug">Uses: ${person.drug}</div>`;
    } else {
        tooltipHTML += `<div>No drug use</div>`;
    }
    
    tooltip.innerHTML = tooltipHTML;
    tooltip.classList.add("show");
    updateTooltipPosition(event);
}

// Update tooltip position
function updateTooltipPosition(event) {
    const tooltip = document.getElementById("tooltip");
    tooltip.style.left = event.clientX + 15 + "px";
    tooltip.style.top = event.clientY + 15 + "px";
}

// Hide tooltip
function hideTooltip() {
    const tooltip = document.getElementById("tooltip");
    tooltip.classList.remove("show");
}

// Calculate overall statistics
function calculateStats() {
    const totalPeople = data.reduce((sum, item) => sum + item.total, 0);
    const totalUsers = data.reduce((sum, item) => sum + item.users, 0);
    const avgPercentage = ((totalUsers / totalPeople) * 100).toFixed(1);

    const statsElement = document.getElementById("stats");
    if (statsElement) {
        statsElement.textContent = 
            `Overall: ${totalUsers} out of ${totalPeople} employees use drugs (${avgPercentage}% average across shown industries)`;
    }
}

// NEW FEATURES

// Filter by industry
function filterByIndustry(industryName) {
    const rows = document.querySelectorAll('.industry-row');
    rows.forEach(row => {
        const label = row.querySelector('.industry-label');
        if (industryName === 'all' || label.textContent === industryName) {
            row.style.display = 'flex';
        } else {
            row.style.display = 'none';
        }
    });
}

// Highlight drug users
function highlightUsers(highlight = true) {
    const figures = document.querySelectorAll('.figure');
    figures.forEach(figure => {
        if (highlight && figure.classList.contains('user')) {
            figure.style.filter = 'drop-shadow(0 0 8px rgba(251, 146, 60, 0.8))';
        } else {
            figure.style.filter = 'none';
        }
    });
}

// Animate figures on load
function animateFigures() {
    const figures = document.querySelectorAll('.figure');
    figures.forEach((figure, index) => {
        figure.style.opacity = '0';
        figure.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            figure.style.transition = 'all 0.5s ease';
            figure.style.opacity = '1';
            figure.style.transform = 'translateY(0)';
        }, index * 30);
    });
}

// Get statistics by industry
function getIndustryStats(industryName) {
    const industry = data.find(item => item.industry === industryName);
    if (industry) {
        const percentage = ((industry.users / industry.total) * 100).toFixed(1);
        return {
            industry: industry.industry,
            users: industry.users,
            total: industry.total,
            percentage: percentage
        };
    }
    return null;
}

// Get all drug types used
function getAllDrugTypes() {
    const drugs = new Set();
    data.forEach(industry => {
        industry.people.forEach(person => {
            if (person.drug) {
                drugs.add(person.drug);
            }
        });
    });
    return Array.from(drugs);
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            initVisualization();
            setTimeout(animateFigures, 100);
        }, 50);
    });
} else {
    setTimeout(() => {
        initVisualization();
        setTimeout(animateFigures, 100);
    }, 50);
}

// Export functions for external use
window.DrugVisualization = {
    init: initVisualization,
    filter: filterByIndustry,
    highlight: highlightUsers,
    animate: animateFigures,
    getStats: getIndustryStats,
    getDrugs: getAllDrugTypes,
    data: data
};