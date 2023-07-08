// Taken from https://stackoverflow.com/questions/16742578/bigdecimal-in-javascript

class BigDecimal {
    // Configuration: constants
    static DECIMALS = 2; // number of decimals on all instances
    static ROUNDED = false; // numbers are truncated (false) or rounded (true)
    static SHIFT = BigInt("1" + "0".repeat(BigDecimal.DECIMALS)); // derived constant
    constructor(value) {
        if (value instanceof BigDecimal) return value;
        let [ints, decis] = String(value).split(".").concat("");
        this._n = BigInt(ints + decis.padEnd(BigDecimal.DECIMALS, "0").slice(0, BigDecimal.DECIMALS)) + BigInt(BigDecimal.ROUNDED && decis[BigDecimal.DECIMALS] >= "5");
    }
    static fromBigInt(bigint) {
        return Object.assign(Object.create(BigDecimal.prototype), { _n: bigint });
    }
    add(num) {
        return BigDecimal.fromBigInt(this._n + new BigDecimal(num)._n);
    }
    subtract(num) {
        return BigDecimal.fromBigInt(this._n - new BigDecimal(num)._n);
    }
    static _divRound(dividend, divisor) {
        return BigDecimal.fromBigInt(dividend / divisor 
            + (BigDecimal.ROUNDED ? dividend  * 2n / divisor % 2n : 0n));
    }
    multiply(num) {
        return BigDecimal._divRound(this._n * new BigDecimal(num)._n, BigDecimal.SHIFT);
    }
    divide(num) {
        return BigDecimal._divRound(this._n * BigDecimal.SHIFT, new BigDecimal(num)._n);
    }
    isGreaterThan(num) {
        return this._n > new BigDecimal(num)._n;
    }
    isGreaterOrEqualThan(num) {
        return this._n >= new BigDecimal(num)._n;
    }
    isLesserThan(num) {
        return this._n < new BigDecimal(num)._n;
    }
    isLesserOrEqualThan(num) {
        return this._n <= new BigDecimal(num)._n;
    }
    toString() {
        const s = this._n.toString().padStart(BigDecimal.DECIMALS+1, "0");
        return s.slice(0, -BigDecimal.DECIMALS) + "." + s.slice(-BigDecimal.DECIMALS).replace(/\.?0+$/, "");
    }
}

module.exports = BigDecimal;