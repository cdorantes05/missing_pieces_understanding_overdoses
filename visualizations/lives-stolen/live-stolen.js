// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, starting visualization...');
    console.log('D3 version:', d3.version);
    
    // Configuration
    const width = 1200;
    const height = 1500; // Increased height for vertical stacking
    const arcHeight = 15;
    const arcSpacing = 5;
    const expectedLifespan = 78; // Average life expectancy in years

    // Generate sample data (replace with real data)
    function generateSampleData(count) {
        const data = [];
        for (let i = 0; i < count; i++) {
            // Random ages weighted toward younger ages for realism
            const ageAtDeath = Math.floor(Math.random() * 70) + 5;
            data.push({
                id: i,
                age: ageAtDeath,
                expectedAge: expectedLifespan,
                stolenYears: expectedLifespan - ageAtDeath
            });
        }
        return data.sort((a, b) => a.age - b.age);
    }

    const data = generateSampleData(200);
    console.log('Generated data:', data.length, 'entries');

    // Calculate total stolen years
    const totalStolenYears = data.reduce((sum, d) => sum + d.stolenYears, 0);
    console.log('Total stolen years:', totalStolenYears);

    // Setup SVG
    const svg = d3.select('#visualization')
        .attr('width', width)
        .attr('height', height);
    
    console.log('SVG element:', svg.node());
    console.log('SVG dimensions:', width, 'x', height);

    // Scale for arc width (years to pixels)
    const xScale = d3.scaleLinear()
        .domain([0, expectedLifespan])
        .range([0, width - 100]);

    // Create arc generator
    function createArc(years, radius) {
        const arcWidth = xScale(years);
        const path = d3.path();
        
        // Create a semi-circular arc
        const startX = 50;
        const startY = 0;
        const endX = startX + arcWidth;
        
        // Control point for bezier curve (creates the arc)
        const controlY = -radius;
        
        path.moveTo(startX, startY);
        path.quadraticCurveTo(startX + arcWidth / 2, controlY, endX, startY);
        
        return path.toString();
    }

    // Create groups for each person - stacked vertically with overlap
    const arcGroups = svg.selectAll('.arc-group')
        .data(data)
        .join('g')
        .attr('class', 'arc-group')
        .attr('transform', (d, i) => {
            // Stack vertically with minimal spacing for overlap effect
            const y = i * 3 + 100; // Much tighter spacing (3px instead of 20px)
            return `translate(0, ${y})`;
        });
    
    console.log('Created arc groups:', arcGroups.size());

    // Animation delay function that starts slow and accelerates
    function getDelay(index, total) {
        // Quadratic easing - starts slow, speeds up
        const normalizedIndex = index / total;
        const easedValue = normalizedIndex * normalizedIndex; // quadratic easing
        return easedValue * 3000; // spread over 3 seconds
    }

    // Add stolen years arc (background - gray dashed)
    arcGroups.append('path')
        .attr('class', 'arc-stolen')
        .attr('d', d => createArc(d.expectedAge, 30))
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => getDelay(i, data.length))
        .attr('opacity', 0.3);

    // Add lived years arc (foreground - orange)
    arcGroups.append('path')
        .attr('class', 'arc-lived')
        .attr('d', d => createArc(0, 30))
        .attr('opacity', 0)
        .transition()
        .duration(800)
        .delay((d, i) => getDelay(i, data.length))
        .attr('d', d => createArc(d.age, 30))
        .attr('opacity', 0.7);

    // Tooltip interaction
    const tooltip = d3.select('#tooltip');

    arcGroups
        .on('mouseover', function(event, d) {
            tooltip
                .style('opacity', 1)
                .html(`
                    <strong>Age at death:</strong> ${d.age}<br>
                    <strong>Expected age:</strong> ${d.expectedAge}<br>
                    <strong>Years stolen:</strong> ${d.stolenYears}
                `);
        })
        .on('mousemove', function(event) {
            tooltip
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 10) + 'px');
        })
        .on('mouseout', function() {
            tooltip.style('opacity', 0);
        });

    // Animate statistics
    function animateNumber(selector, target) {
        d3.select(selector)
            .transition()
            .duration(2000)
            .tween('text', function() {
                const interpolator = d3.interpolateNumber(0, target);
                return function(t) {
                    this.textContent = Math.round(interpolator(t)).toLocaleString();
                };
            });
    }

    setTimeout(() => {
        animateNumber('#people-killed', data.length);
        animateNumber('#stolen-years', totalStolenYears);
    }, 500);
    
});