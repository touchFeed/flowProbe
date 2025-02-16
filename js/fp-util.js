// const { d3 } = window;

class FpUtil {

    static randomInteger(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomFloat(min, max) {
        return (Math.random() * (min - max) + max).toFixed(2)
    }

    static randomHash(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        let counter = 0;
        while (counter < length) {
            result += characters.charAt(Math.floor(Math.random() * charactersLength));
            counter += 1;
        }
        return result;
    }

    static sumSourcesValues(data) {
        let sum = 0;
        Object.values(data).forEach(category =>
            Object.values(category.children).forEach(source => sum += source.value)
        );
        return sum;
    }

}

export { FpUtil }