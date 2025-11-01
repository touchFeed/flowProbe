import {FpConfig as Config} from "./fp-config.js";
import {FpUtil as Util} from "./fp-util.js";

const {d3} = window;

class FPService {

    entity;

    svg;

    pods;
    podRadius = Config.BLOCK * .09;

    service;

    xPods;
    yPods;

    lastCountPerSecond = 0;

    PODS_IN_ROW = 4;
    ROWS = 3;

    meshTranslate = (d, i) => {
        return `translate(${this.xPods(i)},${this.yPods(i)})`;
    }

    chainTransition = (transition, radius) => {
        return transition.transition()
            .duration(400)
            .ease(d3.easeLinear)
            .attr("r", radius)
    };

    transitionRadiuses = (radiusArray, pods) => {
        radiusArray.forEach(radius => pods = this.chainTransition(pods, radius));
        return pods;
    }

    constructor(entity, svg) {
        this.entity = entity;
        this.svg = svg;
    }

    appendService(service, position) {

        this.service = service;

        service.id = service.name.toLowerCase();
        service.service = service.name.toLowerCase();
        service.pack = d3.pack(service.children).size([Config.BLOCK, Config.BLOCK]).padding(5);

         // TODO hardcoded to a mesh of 12
        let meshY = d3.scaleLinear()
            .domain([0, this.PODS_IN_ROW])
            .range([0, Config.BLOCK]);
        let meshX = d3.scaleLinear()
            .domain([0, this.ROWS])
            .range([0, Config.BLOCK * .65]);

        let pad = Config.BLOCK / 2;

        this.svg.selectAll('.anchor')
            .data([0, 9])
            .append("circle")
            .attr("r", 5)
            .attr("transform", Config.translate(position.x, -Config.BLOCK, position.y, 0));

        let groups = this.svg.selectAll(`#${service.id}`)
            .data([service])
            .enter()
            .append("g")
            .attr("class", "service")
            .attr("id", "service-" + service.id)
            .attr("transform", Config.translate(position.x, -Config.BLOCK / 2, position.y, -Config.BLOCK / 2));

        let podRadius = pad * 1.4;

        groups.append("circle")
            .attr("class", "service-wrapper")
            .attr("stroke", service.color)
            .attr("transform", `translate(${pad},${pad})`)
            .attr("r", podRadius);

        let mesh = groups.append("g")
            .attr("id", "service-mesh-" + service.id)
            .attr("class", "service-mesh")
            .attr("transform", `translate(${.2 * pad},${.6 * pad})`)
            .attr("r", pad * 1.5);

        this.xPods = index => meshY(Math.floor(index % this.PODS_IN_ROW));
        this.yPods = index => meshX(Math.floor(index / this.PODS_IN_ROW));
        this.pods = service.children;

        mesh
            .selectAll(".pod")
            .data(this.pods)
            .enter()
            .filter(d => !d.children)
            .append("circle")
            .attr("r", this.podRadius)
            .attr("class", "pod")
            .attr("transform", (d, i) => this.meshTranslate(d, i))
            .style("fill", service.color);

        groups
            .append("g")
            .attr("id", "service-caption-" + service.id)
            .append("text")
            .text(service.name)
            .attr("fill", service.color)
            .attr("class", "service-caption " + service.color)
            .attr("transform", `translate(${Config.BLOCK * .5},${Config.BLOCK * .09})`)
            .style("text-anchor", "middle");

        let throughput = groups
            .append("g")
            .attr("id", "service-throughput-" + service.id)
            .attr("class", "service-throughput")
            .append("text")
            .text("0")
            .attr("fill", service.color)
            .attr("class", service.id)
            .attr("id", 'throughput-' + service.id)
            .attr("transform", `translate(${Config.BLOCK * .5},${Config.BLOCK + 5})`)
            .style("text-anchor", "middle");

        groups
            .append("g")
            .attr("class", "service-throughput-unit")
            .append("text")
            .text("per sec")
            .attr("fill", service.color)
            .attr("class", service.id)
            .attr("transform", `translate(${Config.BLOCK * .5},${Config.BLOCK + 22})`)
            .style("text-anchor", "middle");

        throughput._current = 0;
        this.lastCountPerSecond = 0;
    }

    addNode(podId) {
        if (this.pods.length > 11) { // for the presentation's sake
            console.log(`Rejecting node ${podId} : FlowProbe currently limited to 12.`);
            return;
        }
        this.pods.push(podId);
        this.updatePods(this.pods);
    }

    removeNode() {
        if (this.pods.length < 2) { // for the presentation's sake
            console.log(`Cannot delete last ${this.entity} node : ${this.pods[this.pods.length - 1]}`);
            return;
        }
        this.pods = this.pods.slice(0, -1);
        this.updatePods(this.pods);
    }

    updatePods(data) {

        let pods = this.svg
            .select('#service-' + this.entity)
            .select('.service-mesh')
            .selectAll("circle")
            .data(data);

        let index = data.length - 1;

        let newPods = pods
            .enter()
            .append("circle")
            .attr("r", 0)
            .attr("class", "pod")
            .attr("transform", d => this.meshTranslate(d, index))
            .style("fill", this.service.color)
            .each(d => console.log(d));

        let r = this.podRadius

        // adding service
        let rAdd = [r * .6, 2, r * .8, 4, r * 1.2, r];
        this.transitionRadiuses(rAdd, newPods);

        // removing service
        let rRemove = [4, r * .9, 2, r * .6, 1, r * .2, 1];
        let exit = this.transitionRadiuses(rRemove, pods.exit());
        exit.remove();
    }

    update(value) {

        let count = Util.sumSourcesValues(value);

        let diff = count - this.lastCountPerSecond;
        // console.log(`${this.entity} : diff = ${diff} , count = ${count}`);

        if (count === diff) { // prevents the very first update
            this.lastCountPerSecond = count;
            return;
        }

        let format = i => i.toFixed(0);

        d3.select("#throughput-" + this.entity)
            .transition().duration(800)
            // .textTween(() => t => t.toFixed(1))
            .textTween(d => {
                let from = this._current ? this._current : 0;
                const i = d3.interpolate(from, diff);
                return t => format(this._current = i(t));
            })

        this.lastCountPerSecond = count
    }

}

export {FPService}