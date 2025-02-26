import { FpConfig as Config } from "./fp-config.js"
import { FpUtil as Util } from "./fp-util.js"
import { FPGateway as Gateway } from "./fp-gateway.js"
import { FPService as Service } from "./fp-service.js"
import { FPJournal as Journal } from "./fp-journal.js"

const { d3 } = window;

class FlowProbe {

    gatewayOrders;
    gatewayPayments;

    serviceOrders;
    servicePayments;

    journal;

    // main SVG element
    svg;
    
    // dimensions
    width;
    height;

    // scales
    x;
    y;
    inputSourceScale = d3.scaleLinear().domain([0, 50]).range([2, 12]);

    // data
    counters;

    // simulation
    rateOrder = {
        retail: 1000,
        mobile: 1000,
        desktop: 1000
    };
    ratePayment = {
        cards: 1000,
        wallet: 1000,
        provider: 1000
    };

    getGatewayInstance = name => name === "order"
        ? this.gatewayOrders
        : this.gatewayPayments;

    constructor(svgElement) {
        this.svg = svgElement;

        // main area (excluding margins)
        let margin = Config.MARGIN;
        let width = svgElement.attr("width");
        let height = svgElement.attr("height");
        this.width = width - margin.left - margin.right;
        this.height = height - margin.top - margin.bottom;

        this.gatewayOrders = new Gateway("orders", svgElement);
        this.gatewayPayments = new Gateway("payments", svgElement);

        this.serviceOrders = new Service("orders", svgElement);
        this.servicePayments = new Service("payments", svgElement);

        this.journal = new Journal(svgElement);
    }

    submitData(orders, payments) {
        this.counters = {
            order : orders,
            payment : payments
        };
    }

    initScales() {
        this.x = d3
            .scaleLinear()
            .domain([0, 2])
            .range([Config.MARGIN.left, this.width]);

        this.y = d3
            .scaleLinear()
            .domain([0, 1])
            .range([this.height - Config.MARGIN.bottom, Config.MARGIN.top]);
    }

    drawOrdersAndPaymentsSample(orders, payments, services) {

        // Gateways
        this.gatewayOrders.createGateway("orders", orders, 'north', {x: .5, y: .7});
        this.gatewayPayments.createGateway("payments", payments, 'south', {x: .5, y: .3});

        // Services
        this.serviceOrders.appendService(services.orders, {x: .5, y: .7})
        this.servicePayments.appendService(services.payments, {x: .5, y: .3})

        // Journal
        this.journal.drawBase();
    }

    runSimulation(simulationKind) {

        this.journal.addEntry("flowProbe started");

        let randomOrder = type => {
            let source = this.counters.order[type];
            let offspring = Util.randomOffspring("order", source);
            this.spawn(offspring);
            let delay = Util.randomInteger(.1 * this.rateOrder[type], this.rateOrder[type]);
            setTimeout(() => randomOrder(type), delay);
        }
        let randomPayment = type => {
            let source = this.counters.payment[type];
            let offspring = Util.randomOffspring("payment", source);
            this.spawn(offspring);
            let delay = Util.randomInteger(.1 * this.ratePayment[type], this.ratePayment[type]);
            setTimeout(() => randomPayment(type), delay);
        }
        ["mobile", "desktop", "retail"].forEach(type => randomOrder(type));
        ["cards", "provider", "wallet"].forEach(type => randomPayment(type));

        if (simulationKind === "user") {                //          setting the rates by user (via keyboard shortcuts)
            document.onkeydown = this.handleKeyboardShortcuts;
        } else if (simulationKind === "manual") {       //          here assign manual delays for "telling a story"
            this.handleManualSimulation();
        } else if (simulationKind === "server") {
            // SSE or WS pushing socket provided by server
        }
    }

    handleManualSimulation() {

        setTimeout(() => {
            this.rateOrder.retail -= 200;
            this.journalInfo("Awaiting expected increase from retail")
        }, 5000);

        setTimeout(() => this.rateOrder.retail -= 300, 6000);
        setTimeout(() => this.rateOrder.retail -= 300, 6500);
        setTimeout(() => this.rateOrder.retail -= 150, 7000);
        setTimeout(() => {
            console.log("Scale up orders")
            this.journalScale("order", 2);
            this.addOrderServiceNode(Util.randomHash(10))
            this.addOrderServiceNode(Util.randomHash(10))
        }, 15000);
        setTimeout(() => this.rateOrder.retail += 600, 25000);

        setTimeout(() => this.rateOrder.mobile -= 600, 26000);
        setTimeout(() => this.rateOrder.desktop -= 700, 26000);



    }

    update() {
        let metrics = this.counters;
        this.gatewayOrders.updateSnapshot = metrics.order;
        this.gatewayPayments.updateSnapshot = metrics.payment;
        this.gatewayOrders.update();
        this.gatewayPayments.update();
        this.serviceOrders.update(metrics.order);
        this.servicePayments.update(metrics.payment);
    }

    spawn(obj) {

        let kind = obj.kind;
        let gateway = this.getGatewayInstance(kind);
        let spawnConfig = gateway.getSpawnConfig(obj.name);
        let distance = .95 * gateway.radius; // represents how far from the centre the spawn occurs
        let angle = Util.randomFloat(spawnConfig.range[0], spawnConfig.range[1]);
        obj.point = d3.pointRadial(angle, distance);

        let eden = gateway.eden;
        let circle = eden.append("circle")
            .attr("r", this.inputSourceScale(obj.value))
            .attr("fill", spawnConfig.color)
            .attr("class", "born")
            .attr("cx", obj.point[0])
            .attr("cy", obj.point[1]);

        let finishPoint = d3.pointRadial(angle, .3 * gateway.radius);
        circle
            .transition()
            .duration(1111)
            .attr("cx", finishPoint[0])
            .attr("cy", finishPoint[1])
            .remove();

        this.counters[kind][obj.type].children[obj.name].value++;
    }

    addOrderServiceNode(id) {
        this.serviceOrders.addNode(id);
    }

    removeOrderServiceNode() {
        this.serviceOrders.removeNode();
    }

    addPaymentServiceNode(id) {
        this.servicePayments.addNode(id);
    }

    removePaymentServiceNode() {
        this.servicePayments.removeNode();
    }

    journalInfo(statement) {
        this.journal.addEntry(statement);
    }

    journalScale(entity, factor) {
        this.journal.addEntry(`${Util.capitalize(entity)} scale `, factor);
    }

    handleKeyboardShortcuts = e => {
        switch (e.key) {

            case "q":   this.rateOrder.mobile += 10;                                       break;
            case "a":   if (this.rateOrder.mobile > 10) this.rateOrder.mobile -= 10;            break;
            case "w":   this.rateOrder.desktop += 10;                                      break;
            case "s":   if (this.rateOrder.desktop > 10) this.rateOrder.desktop -= 10;          break;
            case "e":   this.rateOrder.retail += 10;                                       break;
            case "d":   if (this.rateOrder.retail > 10) this.rateOrder.retail -= 10;            break;

            case "p":   this.ratePayment.cards += 10;                                           break;
            case "l":   if (this.ratePayment.cards > 10) this.ratePayment.cards -= 10;          break;
            case "o":   this.ratePayment.provider += 10;                                        break;
            case "k":   if (this.ratePayment.provider > 10) this.ratePayment.provider -= 10;    break;
            case "i":   this.ratePayment.wallet += 10;                                          break;
            case "j":   if (this.ratePayment.wallet > 10) this.ratePayment.wallet -= 10;        break;

            default: break;
        }
    }

}

export { FlowProbe }