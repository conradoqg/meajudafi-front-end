const StandardDeviation = require('./standardDeviation');
const colors = ['#e6194B', '#3cb44b', '#ffe119', '#4363d8', '#f58231', '#911eb4', '#42d4f4', '#f032e6', '#bfef45', '#fabebe', '#469990', '#e6beff', '#9A6324', '#fffac8', '#800000', '#aaffc3', '#808000', '#ffd8b1', '#000075', '#a9a9a9', '#ffffff', '#000000'];

module.exports = {
    formatters: {
        somethingToPercentage: (value) => value != null && !isNaN(value) ? parseFloat((value * 100)).toFixed(2) : value,
        somethingToValue: (value) => value != null && !isNaN(value) ? parseFloat(value).toFixed(2) : null,
        aValueOrTrace: (value) => value == null ? '-' : value.toLocaleString(),
        somethingToMoney: (value) => { return value; }
    },
    nextColorIndex: (i) => colors[(i % colors.length + colors.length) % colors.length],
    StandardDeviation: StandardDeviation
};