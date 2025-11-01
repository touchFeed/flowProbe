import {FpConfig as Config} from "./fp-config.js"
import {FPGateway as Gateway} from "./fp-gateway.js"
import {FPService as Service} from "./fp-service.js"
import {FPJournal as Journal} from "./fp-journal.js"
import {FpUtil as Util} from "./fp-util.js"

const { d3 } = window;

class FlowProbe {

    //                                                                  Entities
    gateways = {};
    services = {};

    //                                                                  Journal & Data
    journal;
    counters;

    //                                                                  Main SVG element
    svg;

    //                                                                  Dimensions
    width;
    height;

    //                                                                  Scales
    x;
    y;
    inputSourceScale = d3.scaleLinear().domain([0, 50]).range([2, 12]);

    constructor(svg) {
        this.svg = svg;

        // main area (excluding margins)
        let margin = Config.MARGIN;
        let width = svg.attr("width");
        let height = svg.attr("height");
        this.width = width - margin.left - margin.right;
        this.height = height - margin.top - margin.bottom;

        // create Orders & Payments arrangement
        this.journal = new Journal(svg);
        this.gateways.order = new Gateway("orders", svg);
        this.gateways.payment = new Gateway("payments", svg);
        this.services.order = new Service("orders", svg);
        this.services.payment = new Service("payments", svg);

        console.log(`Constructed fP skeleton as ${width}x${height}`);
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
        this.gateways.order.createGateway("orders", orders, 'north', {x: .5, y: .7});
        this.gateways.payment.createGateway("payments", payments, 'south', {x: .5, y: .3});

        // Services
        this.services.order.appendService(services.orders, {x: .5, y: .7})
        this.services.payment.appendService(services.payments, {x: .5, y: .3})

        // Journal
        this.journal.drawBase({x: .5, y: .5});
    }

    update() {
        let metrics = this.counters;
        this.gateways.order.updateSnapshot = metrics.order;
        this.gateways.payment.updateSnapshot = metrics.payment;
        this.gateways.order.update();
        this.gateways.payment.update();
        this.services.order.update(metrics.order);
        this.services.payment.update(metrics.payment);
    }

    spawn(obj) {

        let kind = obj.kind;
        let gateway = this.gateways[kind];
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


    addService(kind, id) {
        this.services[kind].addNode(id);
    }

    removeService(kind) {
        this.services[kind].removeNode();
    }

    journalInfo(statement) {
        this.journal.addEntry(Util.randomHash(32), statement);
    }

    journalScale(entity, factor) {
        this.journal.addEntry(
            Util.randomHash(32),
            `${Util.capitalize(entity)} scale-` + (factor < 0 ? 'down' : 'up'),
            factor
        );
    }

    // handleKeyboardShortcuts = e => {
    //     switch (e.key) {
    //
    //         case "q":   this.rateOrder.mobile += 10;                                       break;
    //         case "a":   if (this.rateOrder.mobile > 10) this.rateOrder.mobile -= 10;            break;
    //         case "w":   this.rateOrder.desktop += 10;                                      break;
    //         case "s":   if (this.rateOrder.desktop > 10) this.rateOrder.desktop -= 10;          break;
    //         case "e":   this.rateOrder.retail += 10;                                       break;
    //         case "d":   if (this.rateOrder.retail > 10) this.rateOrder.retail -= 10;            break;
    //
    //         case "p":   this.ratePayment.cards += 10;                                           break;
    //         case "l":   if (this.ratePayment.cards > 10) this.ratePayment.cards -= 10;          break;
    //         case "o":   this.ratePayment.provider += 10;                                        break;
    //         case "k":   if (this.ratePayment.provider > 10) this.ratePayment.provider -= 10;    break;
    //         case "i":   this.ratePayment.wallet += 10;                                          break;
    //         case "j":   if (this.ratePayment.wallet > 10) this.ratePayment.wallet -= 10;        break;
    //
    //         default: break;
    //     }
    // }

}

export { FlowProbe }