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
        retail: 500,
        mobile: 500,
        desktop: 500
    };
    ratePayment = {
        cards: 500,
        wallet: 500,
        provider: 500
    };

    randomOffspring = (kind, source) => {

        let children = Object.values(source.children);
        let child = children[Math.floor(Math.random() * children.length)];

        return {
            kind: kind,
            type: source.name,
            name: child.name,
            value: Util.randomInteger(2, 50)
        }
    }

    handleKeyboardShortcuts = e => {
        switch (e.key) {
            
            case "q":   this.rateOrder.mobile += 10;                                            break;
            case "a":   if (this.rateOrder.mobile > 10) this.rateOrder.mobile -= 10;            break;
            case "w":   this.rateOrder.desktop += 10;                                           break;
            case "s":   if (this.rateOrder.desktop > 10) this.rateOrder.desktop -= 10;          break;
            case "e":   this.rateOrder.retail += 10;                                            break;
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
        this.journal.append("FlowProbe started")
    }

    runSumulation() {

        let randomOrder = type => {
            let source = this.counters.order[type];
            this.spawn(this.randomOffspring("order", source));
            setTimeout(() => randomOrder(type), Util.randomInteger(.1 * this.rateOrder[type], this.rateOrder[type]));
        }
        
        let randomPayment = type => {
            let source = this.counters.payment[type];
            this.spawn(this.randomOffspring("payment", source));
            setTimeout(() => randomPayment(type), Util.randomInteger(.1 * this.ratePayment[type], this.ratePayment[type]));
        }

        ["mobile", "desktop", "retail"].forEach((type) => randomOrder(type));
        ["cards", "provider", "wallet"].forEach((type) => randomPayment(type));
        
        document.onkeydown = this.handleKeyboardShortcuts; // assign shortcuts for increase/decrease rates
    }

    update() {
        //
        // ['order', 'payment'].forEach(kind => {
        //     let current = this.calculatePerSecond(this.counters[kind]);
        //     console.log(current);
        // });

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
        let angle = spawnConfig.angle;
        // let amplitude = Util.randomInteger(spawnConfig.angle * .2, spawnConfig.angle * 1.1) / Math.PI;
        // let amplitude = spawnConfig.amplitude;
        // amplitude = 0; // TODO !
        // console.log(`spawning: ${angle} and amplitude: ${amplitude}`);

        let distance = .95 * gateway.radius; // represents how far from the centre the spawn occurs
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
        this.journal.append(statement);
    }

    journalScale(entity, factor) {
        let direction = factor < 0 ? 'down' : 'up';
        let statement = `Scaling <tspan>${direction} (${factor})</tspan> ${entity}`;
        this.journal.append(statement);
    }


}

export { FlowProbe }