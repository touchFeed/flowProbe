import { FlowProbe } from "./fp/fp.js";
import { FpUtil as Util } from "./fp/fp-util.js";

const { d3 } = window;

const svg = d3.select("svg");
const flowProbe = new FlowProbe(svg);

let fullData = {};

//                                                              report start summary

const printDeltas = counter => {
    let array = Array.isArray(counter) ? counter : Object.keys(counter).map(key => counter[key]);
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

    // flowProbe.runSimulation("user");
    flowProbe.runSimulation("manual");

    setInterval(() => {
        flowProbe.update();
        // flowProbe.printDeltas();
    }, 1000);

    // temporary handles for services
    // Kubernetes style of namespacing pods

    d3.select("#add-order").on("click", () => {
        let id = `order-service-${Util.randomHash(7)}-${Util.randomHash("6")}`;
        console.log("Adding new Node to Orders : " + id);
        flowProbe.addOrderServiceNode(id);
    });

    d3.select("#remove-order").on("click", () => {
        console.log(`Removing node from Orders`);
        flowProbe.removeOrderServiceNode();
    });

    d3.select("#add-payment").on("click", () => {
        let id = `payment-service-${Util.randomHash(7)}-${Util.randomHash("6")}`;
        console.log("Adding new Node to Payments : " + id);
        flowProbe.addPaymentServiceNode(id);
    });

    d3.select("#remove-payment").on("click", () => {
        console.log(`Removing node from Payments`);
        flowProbe.removePaymentServiceNode();
    });

    d3.select("#journal-trigger").on("click", () => {
        console.log(`Journaling`);
        // flowProbe.journalInfo("Here comes the rooster");
        flowProbe.journalScale("Orders", -2);
    });

});