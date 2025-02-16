const { d3 } = window;

class FpConfig {

    static MARGIN = { left: 40, right: 40, top: 40, bottom: 40 };
    static BLOCK = 120;
    static WIDTH = d3.select("svg").attr("width");
    static HEIGHT = d3.select("svg").attr("height");

    static X = d3
            .scaleLinear()
            .domain([0, 1])
            .range([FpConfig.MARGIN.left, FpConfig.WIDTH - FpConfig.MARGIN.right]);
    static Y = d3
            .scaleLinear()
            .domain([0, 1])
            .range([FpConfig.HEIGHT - FpConfig.MARGIN.bottom, FpConfig.MARGIN.top]);

    static translate(horizontal, hMove, vertical, vMove) {
        return `translate(${FpConfig.X(horizontal) + hMove}, ${FpConfig.Y(vertical) + vMove})`;
    }

    static flatten(source, asArray) {
        let target = {};
        source.forEach(type => {
            target[type.name] = {};
            type.children.forEach(c => target[type.name][c.name] = asArray ? [c.value] : c.value);
        });
        return target;
    }
    
    static printDiff(current, previous) {
        Object.keys(current).forEach(kind => {
            Object.keys(current[kind]).forEach(type => {
                Object.keys(current[kind][type].children).forEach(name => {

                    let now = current[kind][type].children[name].value;
                    if (previous) { //                                                      utilise as diff

                        let before = previous[kind][type].children[name].value;

                        if (before !== now) {
                            console.log(`${kind}|${type}|${name}`, now);
                        }
                    } else { //                                                             just print current value
                        console.log(`${kind}|${type}|${name}`, now);
                    }

                });
            })
        });
    }

}

export { FpConfig }