import {FpConfig as Config} from "./fp-config.js";
import {FpUtil as Util} from "./fp-util.js";

const {d3} = window;

const JOURNAL_SIZE = 3;

class FPJournal {

    scaleOpacity = d3.scaleLinear().domain([0, JOURNAL_SIZE]).range([1, .4]);
    scaleFontSize = d3.scaleLinear().domain([0, JOURNAL_SIZE]).range([20, 10]);
    scaleVertical = d3.scaleLinear().domain([0,JOURNAL_SIZE]).range([-10, 80]);

    itemKeyFunction = d => d.id;

    svg;

    wrapper;

    constructor(svg, services) {
        this.svg = svg;
        this.journalItems = [];
        this.services = services;
    }

    drawBase(position) {
        this.wrapper = this.svg
            .append("g")
            .attr("class", "journal")
            .attr("id", "journal")
            .attr("transform", Config.translate(position.x, 0, position.y, -10));
    }

    addEntry(id, statement, factor, entity) {

        const scaleVertical = this.scaleVertical;
        const scaleOpacity = this.scaleOpacity;
        const scaleFontSize = this.scaleFontSize;

        // use as a stack of messages
        let items = this.journalItems;
        items.unshift({
            id: id,
            text: statement,
            factor: factor,
            entity: entity
        });

        if (items.length > 3) items.pop();

        let services = this.services;

        this.wrapper.selectAll("text:not(.exit)")
            .data(items, this.itemKeyFunction)
            .join(enter =>
                enter
                    .append("text")
                    .attr("dx", 0)
                    .attr("dy", (d, i) => scaleVertical(i) - 30)
                    .attr("fill", "black")
                    .attr("font-size", (d, i) => scaleFontSize(i))
                    .style("opacity", 0)
                    .style("text-anchor", "middle")
                    .each(function(d){
                        if (d.factor) {
                            let entityColor = services[d.entity + "s"].color; // TODO : to-plural convert hack
                            d3.select(this)
                                .append("tspan")
                                .attr("class", "service-name")
                                .attr("fill", entityColor)
                                .text(Util.capitalize(entity + "s"));
                        }

                        d3.select(this)
                            .append("tspan")
                            .text(d.text);

                        if (d.factor) {
                            let direction = d.factor < 0 ? "down" : "up";
                            let caption = d.factor < 0 ? "▼" : "▲";
                            d3.select(this)
                                .append("tspan")
                                .attr("class", direction)
                                .text(`${caption}(${Math.abs(d.factor)})`);
                        }
                    })
                    .transition()
                    .duration(1000)
                    .attr("dy", (d, i) => scaleVertical(i))
                    .style("opacity", (d, i) => scaleOpacity(i))
                    .selection(),
                update => update
                    .transition()
                    .duration(1000)
                    .attr("dy", (d, i) => scaleVertical(i))
                    .attr("font-size", (d, i) => scaleFontSize(i))
                    .style("opacity", (d, i) => scaleOpacity(i))
                    .selection(),
                exit => exit
                    .classed("exit", true)
                    .transition()
                    .duration(1000)
                    .attr("dy", (d, i) => scaleVertical(i) + 20)
                    .attr("font-size", 6)
                    .style("opacity", 0)
                    .remove()
            );
    }

}

export {FPJournal};