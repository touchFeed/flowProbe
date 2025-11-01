import { FlowProbe } from "./fp/fp.js";
import { FPSimulate as Simulation } from "./fp/fp-simulate.js";

const { d3 } = window;

const svg = d3.select("svg");
const flowProbe = new FlowProbe(svg);

let fullData = {};

//                                                              report start summary

const printDeltas = counter => {
    let array = Array.isArray(counter1) ? counter : Object.keys(counter).map(key => counter[key]);
    array.forEach((kind, k) => {
        array[k].children
                .forEach((type, t) => {
                    console.log(`${kind.name}|${type.name}:`, array[k].children[t].value);
                })
        }
    );
}

Promise.all([
    d3.json('data/o_services.json'),
    d3.json('data/o_orders.json'),
    d3.json('data/o_payments.json')
])
.then(([services, orders, payments]) => {

    console.log("All JSON resources loaded. Initialising app.");
    console.log("FlowProbe started");

    fullData.orders = orders;
    fullData.payments = payments;

    flowProbe.initScales();
    flowProbe.submitData(orders, payments);
    flowProbe.drawOrdersAndPaymentsSample(orders, payments, services);

    let simulation = new Simulation(flowProbe, orders, payments);
    simulation.startSimulation(); // starts with random spawns of different offsprings
    simulation.playStory(); // starts with random spawns of different offsprings
    document.onkeydown = simulation.handleKeyboardShortcuts; // adjusting rates by user (via keyboard shortcuts)

    // flowProbe.runSimulation("user");
    // flowProbe.runSimulation("manual");

    //
    let source = new EventSource("http://0.0.0.0:8080/stream");
    source.onmessage = function(event) {
        let message = JSON.parse(event.data);
        simulation.handleSSEMessage(message);
    };

    source.onerror = function(event) {
        console.log("SSE connection error", event);
        source.close();
    };

    setInterval(() => {
        flowProbe.update();
        // flowProbe.printDeltas();
    }, 1000);

    // temporary handles for services
    // Kubernetes style of namespacing pods

});

window.onfocus = () => console.log("focus");
window.onblur = () => console.log("blur");