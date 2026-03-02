import { FlowProbe } from "./fp/fp.js";
import { FPSimulate as Simulation } from "./fp/fp-simulate.js";

const { d3 } = window;

const svg = d3.select("#tf");

Promise.all([
    d3.json('data/services.json'),
    d3.json('data/orders.json'),
    d3.json('data/payments.json')
])
.then(([services, orders, payments]) => {

    const flowProbe = new FlowProbe(svg, services);
    console.log("All data successfully fetched. Starting flowProbe.");

    // fullData.orders = orders;
    // fullData.payments = payments;

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

    setInterval(() => flowProbe.update(), 1000);

    // temporary handles for services
    // Kubernetes style of namespacing pods
});

window.onfocus = () => console.log("focus");
window.onblur = () => console.log("blur");