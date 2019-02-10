const StandardDeviation = require('./standardDeviation');

module.exports = {
    formatters: {
        somethingToPercentage: (value) => value != null && !isNaN(value) ? parseFloat((value * 100)).toFixed(2) : value,
        somethingToValue: (value) => value != null && !isNaN(value) ? parseFloat(value).toFixed(2) : null,
        aValueOrTrace: (value) => value == null ? '-' : value.toLocaleString(),
        somethingToMoney: (value) => { return value; }
    },
    chooseState: (data, hasData, isNull, isError, isEmpty) => {
        if (data == null) return isNull();
        if (typeof (data) == 'string') return isError(data);
        if (Array.isArray(data) && data.length == 0) return isEmpty();
        return hasData();
    },
    StandardDeviation: StandardDeviation
};