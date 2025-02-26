import {FpConfig as Config} from "./fp-config.js";

const { d3 } = window;

class FPGateway {

    // TODO : rename all these to single word

    scaleFont = d3.scaleLinear().domain([0, 100]).range([10, 42]);

    entity;                         // name of the entity e.g. orders
    radius;                         // gateway radius
    state;                          //
    element;

    spawning = {};
    eden = {};

    typeScales;

    svg;
    pie;
    arcs;
    lineRadial;

    updateSnapshot;

    constructPieAngles = direction => {

        // detect placement by direction (north, south, west, east)
        let angleStart, angleEnd;
        switch (direction) {
            case 'north' :
            default:
                angleStart = -80; angleEnd = 80;
                break;
            case 'south' :
                angleStart = 260; angleEnd = 100;
                break;
        }

        let degToRad = deg => (deg * Math.PI) / 180.0;
        return {
            start: degToRad(angleStart),
            end: degToRad(angleEnd)
        }
    }

    createPie = direction => {
        // detect placement by direction (north, south, west, east)
        let angles = this.constructPieAngles(direction);
        return d3.pie()
            .startAngle(angles.start)
            .endAngle(angles.end)
            .sort(null)
            .value(d => d3.sum(Object.values(d.children), c => c.value));
    }

    calculateMinMaxTotal = gateway => {
        let min = 0, max = 0, total = 0;
        gateway.forEach(platform => {
            let sum = d3.sum(Object.values(platform.children), c => c.value);
            platform.value = sum;
            total += sum;
            let minChild = d3.min(Object.values(platform.children), c => c.value);
            if (minChild >= min)
                min = minChild;
            let maxChild = d3.max(Object.values(platform.children), c => c.value);
            if (maxChild >= max)
                max = maxChild;
        });

        return {
            min : min,
            max: max,
            total: total
        }
    }

    calculateMinMaxTotal_Two = platformChildren => {
        let values = platformChildren.map(c => c.value);
        return {
            min : d3.min(values),
            max: d3.max(values),
            total: d3.sum(values)
        }
    }

    constructor(entity, svg) {
        this.entity = entity;
        this.svg = svg;
        this.radius = Config.BLOCK * 1.4;
    }

    getSpawnConfig(name) {
        return this.spawning[name];
    }

    createGateway(name, gateway, direction, position) {

        //                                                                  Calculations and shapes
        this.state = gateway = Object.values(gateway);
        let minMaxTotal = this.calculateMinMaxTotal(gateway);

        let innerRadius = this.radius;
        let outerRadius = this.radius * 1.4;

        let arcs = this.arcs = d3.arc()
            .innerRadius(innerRadius)
            .outerRadius(outerRadius);

        let lineRadial = this.lineRadial = d3.lineRadial()
            .angle((d) => d.angle)
            .radius((d) => d.radius)
            .curve(d3.curveBasis);

        const pie = this.pie = this.createPie(direction);
        let pieData = pie(gateway);

        //                                                                  Append main element
        let gatewayElement = this.element = this.svg.append("g")
            .attr("id", `gateway-${name}`)
            .attr("class", "gateway")
            .attr("transform", Config.translate(position.x, 0, position.y, 0))
            .attr("stroke", "white");

        //                                                                  Append arcs
        gatewayElement.append("g")
            .attr("class", "arcs")
            .selectAll(".arc")
            .data(pieData)
            .enter()
            .append("path")
            .attr("d", arcs)
            .attr("class", "arc")
            .attr("id", d => `path-${d.data.name}`)
            .attr("fill", d => d.data.color);

        //                                                                  Append arc titles
        let arcLabels = gatewayElement.append("g")
            .attr("class", "arc-labels");

        let soFar = 0;
        pieData.forEach(arc => {

            let data = arc.data;
            let percentage = (data.value * 100) / minMaxTotal.total;

            let offset = (percentage / 2) + soFar;
            soFar += percentage;

            arcLabels.append("text")
                .append("textPath")
                .attr("class", "arc-label")
                .attr("xlink:href", "#radial-line-" + name)
                .attr("startOffset", `${offset}%`)
                .attr("font-size", this.scaleFont(percentage))
                .attr("fill", data.color)
                .attr("alignment-baseline", direction === "north" ? "baseline" : "hanging")
                .text(data.name);
        });

        //                                                                  Append circles with icons into arcs
        let circlesRadius = this.radius * 1.2; // TODO : Why this factor ?

        // let scaleCircles = this.scaleCircles = d3.scaleLinear()
        //     .domain([minMaxTotal.min, minMaxTotal.max])
        //     .range([circlesRadius * .07  , circlesRadius * .14]);

        let typeScales = this.typeScales = {};
        gateway.forEach(
            type => {
                let minMaxTotal = this.calculateMinMaxTotal_Two(Object.values(type.children));
                typeScales[type.name] = d3.scaleLinear()
                    .domain([minMaxTotal.min, minMaxTotal.max])
                    .range([circlesRadius * .07, circlesRadius * .14])
            }
        );

        let spawning = this.spawning;

        let pieIcons = [],
            radialLinePoints = [];

        // let distance = d => scaleCircles(d.value);
        let distance = d => 0;

        //                                                                  Data recalculations
        pieData.forEach(arc => {
            let inputSource = arc.data;
            let count = Object.values(inputSource.children).length;
            let stepAngle = (arc.endAngle - arc.startAngle) / (count + 1);

            Object.values(inputSource.children).forEach((child, index) => {
                let step = ++index * stepAngle;
                let angle = arc.startAngle + step;
                child.point = d3.pointRadial(angle, circlesRadius);

                spawning[child.name] = {
                    angle: angle,
                    radius: circlesRadius,
                    parent: child.parent,
                    range: [arc.startAngle, arc.endAngle],
                    amplitude: distance(child) / 2,
                    color: inputSource.color // all children within the arc have the same circle colors
                };
                pieIcons.push(child);
            });
        });

        //                                                                  Fictive points for the radial line
        let angles = this.constructPieAngles(direction);
        let radialLineRadius = outerRadius * 1.02;
        let stepRadialPoints = (angles.end - angles.start) / 10;
        for (let i = 0; i <= 10; i++) {
            radialLinePoints.push({
                angle : angles.start + (stepRadialPoints * i),
                radius: radialLineRadius
            });
        }

        let inputSources = gatewayElement
            .append("g")
            .attr("class", "sources");

        //                                                                  append source backgrounds (circles)
        inputSources
            .append("g")
            .attr("class", "source-circles")
            .selectAll(`.gateway-icon`)
            .data(pieIcons)
            .enter()
                .append("circle")
                .attr("class", `gateway-icon ${name}-icon`)
                .attr("stroke", d => d.color)
                .attr("id", d => d.name)
                .attr("cx", d => d.point[0])
                .attr("cy", d => d.point[1])
                .attr("r", distance);

        //                                                                  append source images
        inputSources
            .append("g")
            .attr("class", "source-images")
            .selectAll(`.${name}-icon`)
            .data(pieIcons)
            .enter()
                .append("image")
                .attr("width", d => 2 * distance(d))
                .attr("height", d => 2 * distance(d))
                .attr("transform", d => `translate(-${distance(d)},-${distance(d)})`)
                .attr("x", d => d.point[0])
                .attr("y", d => d.point[1])
                .attr("xlink:href", d => `/img/${d.name}.png`);

        //                                                                  Radial line (anchor to texts)
        gatewayElement
            .append("path")
            .attr("id", "radial-line-" + name)
            .attr("d", lineRadial(radialLinePoints))
            .attr("stroke", "white")
            .attr("fill", "none")
            .attr("stroke-width", "1");

        //                                                                  initialise Eden
        this.eden = gatewayElement.append("g")
            .attr("class", "eden")
            .attr("id", `eden-${this.entity }`);
    }

    update() {

        let snapshot = Object.values(this.updateSnapshot);
        if (!snapshot) return;

        let circlesRadius = this.radius * 1.2; // TODO : Why this factor ?
        let minMaxTotal = this.calculateMinMaxTotal(snapshot);

        let typeScales = this.typeScales;

        snapshot.forEach(
            type => {

                let minMaxTotal = this.calculateMinMaxTotal_Two(Object.values(type.children));
                // console.log(`Type ${type.name} : ${minMaxTotal.min}/${minMaxTotal.max}`);
                // console.log(`Type ${type.name}`);
                typeScales[type.name].domain([
                    minMaxTotal.min * .9,
                    minMaxTotal.max * 2
                ]) ; // TODO : kurde
            }
        );

        let sources = [];

        let arc = this.arcs;
        let pieData = this.pie(snapshot);
        let spawning = this.spawning;
        let labelOffsets = [];
        let soFar = 0;

        //                                                                  Update recalculations
        pieData.forEach(arc => {
            let data = arc.data;
            let children = Object.values(data.children);
            let stepAngle = (arc.endAngle - arc.startAngle) / (children.length + 1);

            children.forEach((s, i) => {
                // let anglePad = stepAngle * .45;
                let step = ++i * stepAngle;
                let angle = arc.startAngle + step;
                s.point = d3.pointRadial(angle, circlesRadius);
                spawning[s.name].angle = angle;
                spawning[s.name].range = [arc.startAngle, arc.endAngle];
                sources.push(s);
            });

            let percentage = (data.value * 100) / minMaxTotal.total;

            let offset = (percentage / 2) + soFar;
            labelOffsets.push({
                offset: offset,
                percentage: percentage
            });
            soFar += percentage;
        });

        let distance = d => {
            // let value = this.scaleCircles(d.value);

            let value = typeScales[d.parent](d.value);

            if (value < 3) {
                console.log("How did ? ");
                return 3;
            }
            // console.log(`Distance : ${value} for ${d.name}`);
            return value;
        }
        // console.log(`Distance : ${distance()}`)
        const DURATION = 1500;

        //                                                                  transition arcs
        this.element
            .select(".arcs")
            .selectAll(".arc")
            .data(pieData)
            .transition()
            .duration(DURATION)
            .attrTween("d", function(d) {
                let i = d3.interpolate(this._current, d);
                this._current = i(0);
                return function(t) {
                    return arc(i(t));
                };
            });

        //                                                                  transition source images
        this.element
            .select(".source-images")
            .selectAll(`image`)
            .data(sources)
            .transition()
            .duration(DURATION)
                .attr("width", d => 2 * distance(d))
                .attr("height", d => 2 * distance(d))
                .attr("transform", d => `translate(-${distance(d)},-${distance(d)})`)
                .attr("x", d => d.point[0])
                .attr("y", d => d.point[1]);

        //                                                                  transition source circles
        this.element
            .select(".source-circles")
            .selectAll(`.gateway-icon`)
            .data(sources)
            .transition()
            .duration(DURATION)
                .attr("cx", d => d.point[0])
                .attr("cy", d => d.point[1])
                .attr("r", distance);

        //                                                                  transition arc labels
        this.element
            .select(".arc-labels")
            .selectAll(`textPath`)
            .data(labelOffsets)
            .transition()
            .duration(DURATION)
                .attr("startOffset", d => `${d.offset}%`)
                .attr("font-size", d => `${this.scaleFont(d.percentage)}`);

        this.state = snapshot; //                                           should be the last operation
    }

}

export { FPGateway }