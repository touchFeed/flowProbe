import { FpUtil as Util } from "./fp-util.js"

class FPSimulate {

    fp;
    
    journal;
    counters;
    
    rate = {
        order : {
            retail: 200,
            mobile: 200,
            desktop: 200
        },
        payment : {
            cards: 200,
            wallet: 200,
            provider: 200
        }
    }
    
    constructor(fp, orders, payments) {
        this.fp = fp;
        this.counters = {
            order : orders,
            payment : payments
        };
    }
    
    startSimulation() {

        this.fp.journalInfo("flowProbe started");

        let randomOrder = type => {
            let source = this.counters.order[type];
            let offspring = Util.randomOffspring("order", source);
            this.fp.spawn(offspring);
            let delay = Util.randomInteger(.1 * this.rate.order[type], this.rate.order[type]);
            setTimeout(() => randomOrder(type), delay);
        }
        let randomPayment = type => {
            let source = this.counters.payment[type];
            let offspring = Util.randomOffspring("payment", source);
            this.fp.spawn(offspring);
            let delay = Util.randomInteger(.1 * this.rate.payment[type], this.rate.payment[type]);
            setTimeout(() => randomPayment(type), delay);
        }
        ["mobile", "desktop", "retail"].forEach(type => randomOrder(type));
        ["cards", "provider", "wallet"].forEach(type => randomPayment(type));
    }

    playStory() {

        let addService = (entity, count) => {
            this.fp.journalScale(entity, count);
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.fp.addService(entity, Util.randomHash(10)), i * 1000);
            }
        }

        let removeService = (entity, count) => {
            this.fp.journalScale(entity, -1 * count);
            for (let i = 0; i < count; i++) {
                setTimeout(() => this.fp.removeService(entity), i * 1000);
            }
        }

        class Quantity {
            static MORE = -1;
            static LESS = 1;
        }

        let alterOrder = (types, value) => types.forEach(type => this.rate.order[type] += value);
        let alterPayment = (types, value) => types.forEach(type => this.rate.payment[type] += value);

        let alterOrderTiny = (types, times) => alterOrder(types,  times * 10);
        let alterOrderSmall = (types, times) => alterOrder(types,  times * 40);
        let alterOrderMedium = (types, times) => alterOrder(types,  times * 80);
        let alterOrderLarge = (types, times) => alterOrder(types, times * 120);
        let alterPaymentTiny = (types, times) => alterPayment(types,  times * 10);
        let alterPaymentSmall = (types, times) => alterPayment(types,  times * 40);
        let alterPaymentMedium = (types, times) => alterPayment(types,  times * 80);
        let alterPaymentLarge = (types, times) => alterPayment(types, times * 120);


        //                                                              Morning rush from retail
        setTimeout(() => {
            alterOrderLarge([ "retail" ], Quantity.MORE);
            alterPaymentLarge([ "wallet" ], Quantity.MORE);
            this.fp.journalInfo("Morning commuters - awaiting retail increase")
        }, 5_000);

        setTimeout(() => {
            alterOrderSmall([ "retail", "mobile" ], Quantity.MORE);
            alterPaymentSmall([ "wallet", "cards"], Quantity.MORE);
        }, 7_000);
        setTimeout(() => {
            addService("order", 2);
        }, 13_000);

        setTimeout(() => {
            addService("payment", 2);
        }, 14_000);

        //                                                              Transition to office / desktop
        setTimeout(() => {
            alterOrderSmall([ "retail", "mobile" ], Quantity.LESS);
            alterPaymentSmall([ "wallet", "cards"], Quantity.LESS);
            alterOrderLarge([ "desktop" ], Quantity.MORE);
            alterPaymentLarge([ "provider"], Quantity.MORE);
            this.fp.journalInfo("Usual in-office/on-site transition to desktops.")
        }, 20_000);
        setTimeout(() => {
            alterOrderSmall([ "desktop" ], Quantity.MORE);
            alterPaymentSmall([ "provider"], Quantity.MORE);
        }, 22_000);

        //                                                              Pre-lunch
        setTimeout(() => {
            alterOrderTiny([ "retail" ], Quantity.MORE);
            alterOrderSmall([ "mobile" ], Quantity.MORE);
            alterPaymentTiny([ "wallet"], Quantity.MORE);
            alterPaymentSmall([ "cards"], Quantity.MORE);
            this.fp.journalInfo("Pre-lunch spike - movability increase.");
        }, 30_000);
        setTimeout(() => {
            addService("order", 2);
            alterOrderSmall([ "desktop" ], Quantity.LESS);
            alterPaymentSmall([ "provider"], Quantity.LESS);
        }, 33_000);
        setTimeout(() => {
            addService("payment", 2);
        }, 34_000);

        //                                                              Lunch rush hour
        setTimeout(() => {
            alterOrderMedium([ "mobile"], Quantity.MORE);
            alterOrderSmall([ "retail"], Quantity.MORE);
        }, 39_000);
        setTimeout(() => {
            alterPaymentSmall([ "wallet"], Quantity.MORE);
            alterPaymentMedium([ "cards"], Quantity.MORE);
        }, 41_000);
        setTimeout(() => {
            this.fp.journalInfo("Lunch rush hour by movable hordes.")
        }, 42_000)
        setTimeout(() => {
            addService("order", 3);
        }, 47_000);
        setTimeout(() => {
            addService("payment", 3);
            alterOrderSmall([ "mobile"], Quantity.MORE); // a small correction
            alterPaymentSmall([ "cards"], Quantity.MORE); // a small correction
        }, 48_000);

        //                                                              Post-lunch chillout, slowly decrease
        setTimeout(() => {
            alterOrderTiny([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterOrderTiny([ "wallet", "cards", "provider"], Quantity.LESS);
        }, 61_000);
        setTimeout(() => {
            this.fp.journalInfo("Post-lunch steady decline")
            alterOrderSmall([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterPaymentSmall([ "wallet", "cards", "provider"], Quantity.LESS);
        }, 63_000);
        setTimeout(() => {
            alterOrderSmall([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterPaymentSmall([ "wallet", "cards", "provider"], Quantity.LESS);
        }, 65_000);
        setTimeout(() => {
            removeService("order", 4);
        }, 69_000);
        setTimeout(() => {
            removeService("payment", 4);
        }, 70_000);

        //                                                              Evening wave
        setTimeout(() => {
            alterOrderTiny([ "retail", "mobile" ], Quantity.MORE);
            alterPaymentTiny([ "wallet", "cards"], Quantity.MORE);
        }, 85_000);
        setTimeout(() => {
            this.fp.journalInfo("Evening wave - commuters returning")
            alterOrderSmall([ "retail", "mobile" ], Quantity.MORE);
            alterPaymentSmall([ "wallet", "cards"], Quantity.MORE);
        }, 85_000);
        setTimeout(() => {
            alterOrderMedium([ "desktop" ], Quantity.MORE);
            alterPaymentMedium([ "provider" ], Quantity.MORE);
        }, 86_000);
        setTimeout(() => {
            addService("order", 2);
        }, 88_000);
        setTimeout(() => {
            addService("payment", 2);
        }, 90_000);

        //                                                              Into the night, slowly turning off
        setTimeout(() => {
            this.fp.journalInfo("Evening wave over. Slowly into the night.")
            alterOrderMedium([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterPaymentMedium([ "wallet", "cards", "provider"], Quantity.LESS);
        }, 98_000);
        setTimeout(() => {
            alterOrderMedium([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterPaymentMedium([ "wallet", "cards", "provider"], Quantity.LESS);
            removeService("order", 4);
        }, 100_000);
        setTimeout(() => {
            alterOrderLarge([ "retail", "order", "desktop" ], Quantity.LESS);
            alterPaymentLarge([ "wallet", "cards", "provider"], Quantity.LESS);
            removeService("payment", 4);
        }, 104_000);

        //                                                              Turn off
        setTimeout(() => {
            removeService("order", 3);
            removeService("payment", 3);
            alterOrderLarge([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterPaymentLarge([ "wallet", "cards", "provider"], Quantity.LESS);
        }, 108_000);
        setTimeout(() => {
            this.fp.journalInfo("Minimum load. Terminating observation. Goodbye")
            alterOrderLarge([ "retail", "mobile", "desktop" ], Quantity.LESS);
            alterPaymentLarge([ "wallet", "cards", "provider"], Quantity.LESS);
        }, 114_000);
        setTimeout(() => {
            this.fp.journalInfo(" ")
        }, 118_000);
        setTimeout(() => {
            this.fp.journalInfo(" ")
        }, 120_000);
        setTimeout(() => {
            this.fp.journalInfo(" ")
        }, 122_000);
    }

    handleKeyboardShortcuts = e => {
        switch (e.key) {

            case "q":   this.rate.order.mobile += 10;                                       break;
            case "a":   if (this.rate.order.mobile > 10) this.rate.order.mobile -= 10;            break;
            case "w":   this.rate.order.desktop += 10;                                      break;
            case "s":   if (this.rate.order.desktop > 10) this.rate.order.desktop -= 10;          break;
            case "e":   this.rate.order.retail += 10;                                       break;
            case "d":   if (this.rate.order.retail > 10) this.rate.order.retail -= 10;            break;

            case "p":   this.rate.payment.cards += 10;                                           break;
            case "l":   if (this.rate.payment.cards > 10) this.rate.payment.cards -= 10;          break;
            case "o":   this.rate.payment.provider += 10;                                        break;
            case "k":   if (this.rate.payment.provider > 10) this.rate.payment.provider -= 10;    break;
            case "i":   this.rate.payment.wallet += 10;                                          break;
            case "j":   if (this.rate.payment.wallet > 10) this.rate.payment.wallet -= 10;        break;

            default: break;
        }
    }
    
    handleSSEMessage(message) {

        let type = message.type;

        if (type === "spawn") {
            let order = message.order;
            order.kind = "order";
            this.fp.spawn(order);
            let payment = message.payment;
            payment.kind = "payment";
            this.fp.spawn(payment);

        } else if (type === "info") {
            this.fp.journalInfo(message.message);
        } else if (type.startsWith("scale")) {
            let factor = message.split("-")[1] === "up" ? 1 : -1; // TODO : replace from message
            this.fp.journalScale(message.entity, factor);
        } else if (type === "start") {
            console.log("Start of the SSE stream at " + new Date().toISOString());
        } else if (type === "end") {
            console.log("SSE stream closed at " + new Date().toISOString());
        } else {
            console.warn("Unknown message type: " + type, message);
        }
    }

    handleSSEOpen() {}
    
}

export { FPSimulate }