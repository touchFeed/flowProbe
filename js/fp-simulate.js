import {FpUtil as Util} from "./fp-util";

class FpSimulate {

    lowOrder = 40;
    highOrder = 250;

    lowPayment = 50;
    highPayment = 250;

    constructor() {



    }

    static startSimulation() {


        // let it tell a story i.e.
        // personify / relate this to a typical day of a large fashion group
        // owning few major brands e.g. IMAGINERY_PARENT_FASION = Zara + H&M & JDSports & ...
        // retail wave in the morning , desktop usage peaking lunch time and
        // mobile everywhere in between , retail again in the evening

        let randomOrder = () => {
            flowProbe.spawn(randomOffspring("order", fullData.orders));
            setTimeout(randomOrder, randomInteger(lowOrder, highOrder));
        }
        let randomPayment = () => {
            flowProbe.spawn(randomOffspring("payment", fullData.payments));
            setTimeout(randomPayment, Util.randomInteger(50, 300));
        }

        randomOrder();
        randomPayment();




    }



}