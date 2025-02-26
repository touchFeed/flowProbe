import {FpConfig as Config} from "./fp-config.js";

const {d3} = window;

class FPJournal {

    svg;

    wrapper;

    // createEntry = statement => {
    //
    //     this.stack.push(statement);
    //
    //     let selection = this.wrapper
    //         .selectAll(`.journal-entry`)
    //         .data(this.stack);
    //
    //     let entry = selection.enter()
    //         .append("g")
    //         .attr("class", "journal-item")
    //
    //     entry.transition()
    //         .duration(1000)
    //         .attr("y", (d, i) => i++ * 25);
    //
    //     return entry;
    // }

    constructor(svg) {
        this.svg = svg;
    }

    drawBase() {
        this.wrapper = this.svg
            .append("g")
            .attr("class", "journal")
            .attr("id", "journal")
            .attr("transform", Config.translate(0.5, 0, 0.5, 0));
    }

    addEntry(statement, factor) {

        let selection = this.wrapper
            .selectAll(`text`)
            .data([statement]);

        // let entries = selection.enter()
            // .append("g")
            // .attr("class", "journal-item")

        // https://stackoverflow.com/questions/49707737/d3-v4-transition-on-entering-elements-using-general-update-pattern-with-merge

        let finish = () => texts.transition()           // 3. Use merged selection from 2.
            .duration(800)
            .attr("y", 50)
            .style("opacity", "0")
            .remove();

        const texts = selection.enter()
            .append("text")
            .text(d => d)
            .attr("fill", "black")
            .attr("x", 0)
            .attr("y", -15)
            .style("opacity", "0");

        if (factor) {
            let direction = factor < 0 ? "down" : "up";
            texts
                .append("tspan")
                .attr("class", direction)
                .text(`${direction}(${Math.abs(factor)})`);
        }

        texts
            .transition()
            .duration(800)
            // .attr("y", (d, i) => i++ * 25)
            .attr("y", 5)
            .style("opacity", "1")

            .on("end", () => setTimeout(() => finish(), 4000))

            .selection().merge(selection);  // 1. Merge stored update into enter selection.
    }

    appendScaleUp(name, factor) {

        let entry = this.createEntry(statement);



    }

}

export {FPJournal};