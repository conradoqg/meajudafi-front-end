import { StandardDeviation } from '../util';
import allKeys from 'promise-results/allKeys';
import packageJson from '../../package.json';

/* global process */
const API_URL = process.env.API_URL || `api.${window.location.host}`;

module.exports = {
    getFundList: async (options, fromDate = new Date((new Date()).getFullYear(), 0, 1)) => {
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;

        let filterPart = '';
        if (options.filter) {
            Object.keys(options.filter).map(selectedFilterOptionsKey => {
                if (selectedFilterOptionsKey == 'switch') {
                    let switchItems = [];
                    Object.keys(options.filter.switch).map(switchItem => {
                        options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null;
                    });
                    if (switchItems.length > 0) filterPart += `or=(${switchItems.join(',')})&`;
                } else if (Array.isArray(options.filter[selectedFilterOptionsKey])) {
                    const selectedFilterOptionsText = options.filter[selectedFilterOptionsKey].map(selectedFilter => {
                        if (selectedFilter == null) return `${selectedFilterOptionsKey}.is.null`;
                        else return `${selectedFilterOptionsKey}.eq."${selectedFilter}"`;
                    });
                    if (selectedFilterOptionsText.length > 0) filterPart += `or=(${selectedFilterOptionsText.join(',')})&`;
                } else if (typeof options.filter[selectedFilterOptionsKey] === 'object') {
                    if (options.filter[selectedFilterOptionsKey].min != null && options.filter[selectedFilterOptionsKey].min != null) {
                        let minPart = '';
                        let maxPart = '';
                        if (options.filter[selectedFilterOptionsKey].min != '') minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                        if (options.filter[selectedFilterOptionsKey].max != '') maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                        if (minPart && maxPart) filterPart += `and=(${minPart},${maxPart})&`;
                        else if (minPart || maxPart) filterPart += `and=(${minPart}${maxPart})&`;
                    }
                }
            });
        }

        let searchPart = '';
        if (options.search) {
            if (options.search.term != '') {
                // Identify if it's a CNPJ or a fund name
                if (/^\d+$/.test(options.search.term)) {
                    searchPart = `and=(f_cnpj.ilike.*${options.search.term}*)&`;
                } else {
                    searchPart = `or=(f_unaccented_name.ilike.*${options.search.term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*,f_unaccented_short_name.ilike.*${options.search.term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*)&`;
                }
            }
        }

        const fundListObject = await fetch(`//${API_URL}/icf_with_xf_and_bf_and_iry_and_f_of_last_year?select=icf_cnpj_fundo,f_cnpj,f_short_name,iry_accumulated_networth,iry_accumulated_quotaholders,icf_rentab_fundo,iry_investment_return_1y,iry_investment_return_2y,iry_investment_return_3y,iry_risk_1y,iry_risk_2y,iry_risk_3y&${filterPart}${searchPart}iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${sort}`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });

        if (fundListObject.status < 200 || fundListObject.status > 299) throw new Error('Unable to retrieve fund list');

        const CONTENT_RANGE_REGEX = /(\d+)-(\d+)\/(\d+)/gm;
        const contentRange = fundListObject.headers.get('Content-Range');
        const matchResult = CONTENT_RANGE_REGEX.exec(contentRange);
        const totalRows = matchResult && matchResult.length > 3 ? matchResult[3] : 0;

        return {
            range,
            totalRows: parseInt(totalRows),
            data: await fundListObject.json()
        };
    },
    getFundData: async (cnpj, additionalFields) => {
        let additionalFieldsPart = '';

        if (Array.isArray(additionalFields) && additionalFields.length > 0) additionalFieldsPart = ',' + additionalFields.join(',');

        const funds = await fetch(`//${API_URL}/funds_enhanced?select=f_name,f_short_name,f_cnpj,rentab_fundo${additionalFieldsPart}&f_cnpj=eq.${cnpj}`);

        if (funds.status < 200 || funds.status > 299) throw new Error('Unable to retrieve fund data');

        return funds.json();
    },
    getFundStatistic: async (cnpj, benchmark, lastDaysOrFromDate, additionalFields) => {
        let fromDatePart = '';
        let rangePart = null;

        if (lastDaysOrFromDate instanceof Date) fromDatePart = `&ird_dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
        else if (typeof (lastDaysOrFromDate) == 'number') rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };

        let additionalFieldsPart = '';

        if (Array.isArray(additionalFields) && additionalFields.length > 0) additionalFieldsPart = '&' + additionalFields.join(',');

        const result = await fetch(`//${API_URL}/investment_return_daily?select=${additionalFieldsPart}ird_dt_comptc,ird_investment_return,${`ird_${benchmark}_investment_return`},ird_accumulated_quotaholders,ird_accumulated_networth&ird_cnpj_fundo=eq.${cnpj}${fromDatePart}&order=ird_dt_comptc.desc`, rangePart);

        if (result.status < 200 || result.status > 299) throw new Error('Unable to retrieve fund statistic');

        const data = await result.json();

        if (data.length == 0) throw new Error(`No data found for CNPJ ${cnpj}`);

        return calculateStatistics(data, benchmark);
    },
    getBenchmarkStatistic: async (benchmark, lastDaysOrFromDate) => {
        let fromDatePart = '';
        let rangePart = null;

        if (lastDaysOrFromDate instanceof Date) fromDatePart = `&data=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
        else if (typeof (lastDaysOrFromDate) == 'number') rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };

        let tablePart = null;
        if (benchmark == 'cdi') {
            tablePart = 'fbcdata_sgs_12i';
        } else if (benchmark == 'bovespa') {
            tablePart = 'fbcdata_sgs_7i';
        } else if (benchmark == 'dolar') {
            tablePart = 'fbcdata_sgs_1i';
        } else if (benchmark == 'euro') {
            tablePart = 'fbcdata_sgs_21619i';
        }

        const result = await fetch(`//${API_URL}/${tablePart}?select=data,valor${fromDatePart}&order=data.desc`, rangePart);

        if (result.status < 200 || result.status > 299) throw new Error('Unable to retrieve benchmark statistic');

        let data = await result.json();

        return calculateBenchmarkStatistics(data, benchmark);
    },
    getFundIndicators: async (options, fromDate = new Date((new Date()).getFullYear(), 0, 1)) => {
        const range = options.range;

        let filterPart = '';
        if (options.filter) {
            Object.keys(options.filter).map(selectedFilterOptionsKey => {
                if (selectedFilterOptionsKey == 'switch') {
                    let switchItems = [];
                    Object.keys(options.filter.switch).map(switchItem => {
                        options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null;
                    });
                    if (switchItems.length > 0) filterPart += `or=(${switchItems.join(',')})&`;
                } else if (Array.isArray(options.filter[selectedFilterOptionsKey])) {
                    const selectedFilterOptionsText = options.filter[selectedFilterOptionsKey].map(selectedFilter => {
                        if (selectedFilter == null) return `${selectedFilterOptionsKey}.is.null`;
                        else return `${selectedFilterOptionsKey}.eq."${selectedFilter}"`;
                    });
                    if (selectedFilterOptionsText.length > 0) filterPart += `or=(${selectedFilterOptionsText.join(',')})&`;
                } else if (typeof options.filter[selectedFilterOptionsKey] === 'object') {
                    if (options.filter[selectedFilterOptionsKey].min != null && options.filter[selectedFilterOptionsKey].min != null) {
                        let minPart = '';
                        let maxPart = '';
                        if (options.filter[selectedFilterOptionsKey].min != '') minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                        if (options.filter[selectedFilterOptionsKey].max != '') maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                        if (minPart && maxPart) filterPart += `and=(${minPart},${maxPart})&`;
                        else if (minPart || maxPart) filterPart += `and=(${minPart}${maxPart})&`;
                    }
                }
            });
        }

        const makeURL = (field, side) => `//${API_URL}/icf_with_xf_and_bf_and_iry_and_f_of_last_year?select=${field},f_short_name,f_cnpj&${filterPart}&iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${field}.${side}&limit=5`;

        const indicatorsObject = await allKeys({
            investment_return_top: fetch(makeURL(`iry_investment_return_${range}`, 'desc')),
            investment_return_bottom: fetch(makeURL(`iry_investment_return_${range}`, 'asc')),
            networth_top: fetch(makeURL(`iry_networth_${range}`, 'desc')),
            networth_bottom: fetch(makeURL(`iry_networth_${range}`, 'asc')),
            quotaholders_top: fetch(makeURL(`iry_quotaholders_${range}`, 'desc')),
            quotaholders_bottom: fetch(makeURL(`iry_quotaholders_${range}`, 'asc')),
            risk_top: fetch(makeURL(`iry_risk_${range}`, 'desc')),
            risk_bottom: fetch(makeURL(`iry_risk_${range}`, 'asc'))
        });

        if (Object.values(indicatorsObject).some(result => result.status < 200 || result.status > 299)) throw new Error('Unable to retrieve fund indicator');

        const indicatorsResult = await allKeys({
            investment_return_top: indicatorsObject.investment_return_top.json(),
            investment_return_bottom: indicatorsObject.investment_return_bottom.json(),
            networth_top: indicatorsObject.networth_top.json(),
            networth_bottom: indicatorsObject.networth_bottom.json(),
            quotaholders_top: indicatorsObject.quotaholders_top.json(),
            quotaholders_bottom: indicatorsObject.quotaholders_bottom.json(),
            risk_top: indicatorsObject.risk_top.json(),
            risk_bottom: indicatorsObject.risk_bottom.json()
        });

        const toIndicatorObject = (array, field) => array.map(item => {
            return {
                name: item.f_short_name,
                cnpj: item.f_cnpj,
                value: item[field]
            };
        });

        const indicators = {
            [range]: {
                investment_return: {
                    top: toIndicatorObject(indicatorsResult.investment_return_top, `iry_investment_return_${range}`),
                    bottom: toIndicatorObject(indicatorsResult.investment_return_bottom.reverse(), `iry_investment_return_${range}`)
                },
                networth: {
                    top: toIndicatorObject(indicatorsResult.networth_top, `iry_networth_${range}`),
                    bottom: toIndicatorObject(indicatorsResult.networth_bottom.reverse(), `iry_networth_${range}`)
                },
                quotaholders: {
                    top: toIndicatorObject(indicatorsResult.quotaholders_top, `iry_quotaholders_${range}`),
                    bottom: toIndicatorObject(indicatorsResult.quotaholders_bottom.reverse(), `iry_quotaholders_${range}`)
                },
                risk: {
                    top: toIndicatorObject(indicatorsResult.risk_top, `iry_risk_${range}`),
                    bottom: toIndicatorObject(indicatorsResult.risk_bottom.reverse(), `iry_risk_${range}`)
                }
            }
        };

        return indicators;
    },
    getEconomyIndicators: async (lastDaysOrFromDate) => {
        let fromDatePart = '';
        let rangePart = null;

        if (lastDaysOrFromDate instanceof Date) fromDatePart = `&dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
        else if (typeof (lastDaysOrFromDate) == 'number') rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };

        const fundIndicatorsObject = await fetch(`//${API_URL}/running_days_with_indicators?select=dt_comptc,cdi_valor,selic_valor,bovespa_valor,euro_valor,dolar_valor${fromDatePart}&order=dt_comptc.desc`, rangePart);

        if (fundIndicatorsObject.status < 200 || fundIndicatorsObject.status > 299) throw new Error('Unable to retrieve economy indicators');

        let data = await fundIndicatorsObject.json();

        const fields = [
            'date',
            'cdi',
            'selic',
            'bovespa',
            'euro',
            'dolar'
        ];

        const economyIndicators = {};
        const lastValue = {};

        fields.map(field => economyIndicators[field] = []);
        fields.map(field => lastValue[field] = 0);

        data = data.reverse();

        data.map(row => {
            fields.map(field => {
                var value = null;
                if (field == 'date') value = row.dt_comptc;
                else value = row[`${field}_valor`] == null ? lastValue[field] : row[`${field}_valor`];

                economyIndicators[field].push(value);
                lastValue[field] = value;
            });
        });

        return economyIndicators;
    },
    getFundsChanged: async (fromDate) => {
        let fromDatePart = `&or=(row_data->xf_date.gte.${fromDate.toJSON().slice(0, 10)},row_data->bf_date.gte.${fromDate.toJSON().slice(0, 10)})`;
        const fundsChangedObject = await fetch(`//${API_URL}/changed_funds?order=row_data->xf_date.desc,row_data->bf_date.desc${fromDatePart}`);

        if (fundsChangedObject.status < 200 || fundsChangedObject.status > 299) throw new Error('Unable to retrieve changed funds');

        let data = await fundsChangedObject.json();

        return data;
    },
    isInMaintenanceMode: async () => {
        const currentVersionArray = packageJson.version.split('.').map(value => parseInt(value));
        const minor = currentVersionArray[currentVersionArray.length - 2];

        const lastMigrationObject = await fetch(`//${API_URL}/migrations?order=name.desc&limit=1`);

        if (lastMigrationObject.status < 200 || lastMigrationObject.status > 299) throw new Error('Unable to retrieve maintenance mode');

        const lastMigrationData = await lastMigrationObject.json();

        let migrationMinor = 0;

        if (lastMigrationData.length > 0) {
            migrationMinor = parseInt(lastMigrationData[0].name.substring(0, 8));
        }

        return minor != migrationMinor;
    }
};

const calculateBenchmarkStatistics = (data, benchmark) => {
    let fromQuoteToPercentage = null;
    if (benchmark == 'cdi') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : value / 100;
    } else if (benchmark == 'bovespa') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
    } else if (benchmark == 'dolar') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
    } else if (benchmark == 'euro') {
        fromQuoteToPercentage = (value, prevValue) => prevValue == null ? 0 : (value / prevValue) - 1;
    }

    const statistics = {
        daily: {
            date: [],
            investment_return: [],
            risk: [],
            min_investment_return: 0,
            max_investment_return: 0
        },
        accumulated: {}
    };

    let prevValue = null;
    let investment_return = 0;
    let riskCalculator = new StandardDeviation();

    for (let index = data.length - 1; index >= 0; index--) {
        const item = data[index];

        const date = item.data;

        const value = fromQuoteToPercentage(item.valor, prevValue);
        prevValue = item.valor;

        investment_return = ((1 + investment_return) * (1 + value)) - 1;
        riskCalculator.addMeasurement(value);
        const risk = riskCalculator.get() * Math.sqrt(252);
        const min_investment_return = Math.min(statistics.daily.min_investment_return, investment_return);
        const max_investment_return = Math.max(statistics.daily.max_investment_return, investment_return);

        statistics.daily.date.push(date);
        statistics.daily.investment_return.push(investment_return);
        statistics.daily.risk.push(risk);
        statistics.daily.min_investment_return = min_investment_return;
        statistics.daily.max_investment_return = max_investment_return;

        statistics.accumulated = {
            investment_return,
            risk,
            min_investment_return,
            max_investment_return
        };
    }

    return statistics;
};

const calculateStatistics = (data, benchmark) => {
    const statistics = {
        daily: {
            date: [],
            investment_return: [],
            benchmark_investment_return: [],
            relative_investment_return: [],
            risk: [],
            sharpe: [],
            benchmark_consistency: [],
            networth: [],
            quotaholders: [],
            correlation: [],
            min_investment_return: 0,
            max_investment_return: 0,
            min_benchmark_investment_return: 0,
            max_benchmark_investment_return: 0,
        },
        accumulated: {},
        accumulatedByYear: {},
        byMonth: {},
        byYear: {}
    };

    const createCalculators = () => {
        return {
            entries: 1,
            investmentReturnCalculator: new InvestmentReturnCalculator(),
            benchmarkInvestmentReturnCalculator: new InvestmentReturnCalculator(),
            riskCalculator: new RiskCalculator(),
            consistencyCalculator: new ConsistencyCalculator(),
            networthCalculator: new NetworthCalculator(),
            quotaholdersCalculator: new QuotaholdersCalculator(),
            correlationCalculator: new CorrelationCalculator()
        };
    };

    const calculatorAccumulated = createCalculators();
    const calculatorByMonth = {};
    const calculatorByYear = {};

    for (let index = data.length - 1; index >= 0; index--) {
        const item = data[index];
        const date = item.ird_dt_comptc;
        const year = date.substring(0, 4);
        const month = date.substring(5, 7);

        if (index == data.length - 1) {
            statistics.daily.date.push(date);
            statistics.daily.investment_return.push(0);
            statistics.daily.benchmark_investment_return.push(0);
            statistics.daily.relative_investment_return.push(0);
            statistics.daily.risk.push(0);
            statistics.daily.sharpe.push(0);
            statistics.daily.benchmark_consistency.push(0);
            statistics.daily.networth.push(0);
            statistics.daily.quotaholders.push(0);
            statistics.daily.correlation.push(0);
            statistics.daily.min_investment_return = 0;
            statistics.daily.max_investment_return = 0;
            statistics.daily.min_benchmark_investment_return = 0;
            statistics.daily.max_benchmark_investment_return = 0;
            continue;
        }

        calculatorAccumulated.entries += 1;

        if (!calculatorByMonth[year + month]) calculatorByMonth[year + month] = createCalculators();
        else calculatorByMonth[year + month].entries += 1;

        if (!calculatorByYear[year]) calculatorByYear[year] = createCalculators();
        else calculatorByYear[year].entries += 1;

        const investment_return = calculatorAccumulated.investmentReturnCalculator.add(item.ird_investment_return);
        const month_investment_return = calculatorByMonth[year + month].investmentReturnCalculator.add(item.ird_investment_return);
        const year_investment_return = calculatorByYear[year].investmentReturnCalculator.add(item.ird_investment_return);

        const benchmark_investment_return = calculatorAccumulated.benchmarkInvestmentReturnCalculator.add(item[`ird_${benchmark}_investment_return`]);
        const month_benchmark_investment_return = calculatorByMonth[year + month].benchmarkInvestmentReturnCalculator.add(item[`ird_${benchmark}_investment_return`]);
        const year_benchmark_investment_return = calculatorByYear[year].benchmarkInvestmentReturnCalculator.add(item[`ird_${benchmark}_investment_return`]);

        const relative_investment_return = calcRelativeInvestmentReturn(investment_return, benchmark_investment_return);
        const month_relative_investment_return = calcRelativeInvestmentReturn(month_investment_return, month_benchmark_investment_return);
        const year_relative_investment_return = calcRelativeInvestmentReturn(year_investment_return, year_benchmark_investment_return);

        const risk = calculatorAccumulated.riskCalculator.add(item.ird_investment_return);
        const month_risk = calculatorByMonth[year + month].riskCalculator.add(item.ird_investment_return);
        const year_risk = calculatorByYear[year].riskCalculator.add(item.ird_investment_return);

        const sharpe = calcSharpeForPeriod(risk, investment_return, benchmark_investment_return, calculatorAccumulated.entries);
        const month_sharpe = calcSharpeForPeriod(month_risk, month_investment_return, month_benchmark_investment_return, calculatorByMonth[year + month].entries);
        const year_sharpe = calcSharpeForPeriod(year_risk, year_investment_return, year_benchmark_investment_return, calculatorByYear[year].entries);

        const benchmark_consistency = calculatorAccumulated.consistencyCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorAccumulated.entries);
        const month_consistency = calculatorByMonth[year + month].consistencyCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByMonth[year + month].entries);
        const year_consistency = calculatorByYear[year].consistencyCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByYear[year].entries);

        const networth = calculatorAccumulated.networthCalculator.add(item.ird_accumulated_networth);
        const month_networth = calculatorByMonth[year + month].networthCalculator.add(item.ird_accumulated_networth);
        const year_networth = calculatorByYear[year].networthCalculator.add(item.ird_accumulated_networth);

        const quotaholders = calculatorAccumulated.quotaholdersCalculator.add(item.ird_accumulated_quotaholders);
        const month_quotaholders = calculatorByMonth[year + month].quotaholdersCalculator.add(item.ird_accumulated_quotaholders);
        const year_quotaholders = calculatorByYear[year].quotaholdersCalculator.add(item.ird_accumulated_quotaholders);

        const correlation = calculatorAccumulated.correlationCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorAccumulated.entries);
        const month_correlation = calculatorByMonth[year + month].correlationCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByMonth[year + month].entries);
        const year_correlation = calculatorByYear[year].correlationCalculator.add(item.ird_investment_return, item[`ird_${benchmark}_investment_return`], calculatorByYear[year].entries);

        const min_investment_return = Math.min(statistics.daily.min_investment_return, investment_return);
        const max_investment_return = Math.max(statistics.daily.max_investment_return, investment_return);
        const min_benchmark_investment_return = Math.min(statistics.daily.min_benchmark_investment_return, benchmark_investment_return);
        const max_benchmark_investment_return = Math.max(statistics.daily.max_benchmark_investment_return, benchmark_investment_return);

        statistics.daily.date.push(date);
        statistics.daily.investment_return.push(investment_return);
        statistics.daily.benchmark_investment_return.push(benchmark_investment_return);
        statistics.daily.relative_investment_return.push(relative_investment_return);
        statistics.daily.risk.push(risk);
        statistics.daily.sharpe.push(sharpe);
        statistics.daily.benchmark_consistency.push(benchmark_consistency);
        statistics.daily.networth.push(networth);
        statistics.daily.quotaholders.push(quotaholders);
        statistics.daily.correlation.push(correlation);
        statistics.daily.min_investment_return = min_investment_return;
        statistics.daily.max_investment_return = max_investment_return;
        statistics.daily.min_benchmark_investment_return = min_benchmark_investment_return;
        statistics.daily.max_benchmark_investment_return = max_benchmark_investment_return;
        statistics.accumulated = {
            investment_return,
            benchmark_investment_return,
            relative_investment_return,
            risk,
            sharpe,
            benchmark_consistency,
            networth,
            quotaholders,
            correlation,
            min_investment_return,
            max_investment_return,
            min_benchmark_investment_return,
            max_benchmark_investment_return
        };
        statistics.accumulatedByYear[year] = {
            year,
            investment_return,
            benchmark_investment_return,
            relative_investment_return,
            risk,
            sharpe,
            benchmark_consistency,
            networth,
            quotaholders,
            correlation,
            min_investment_return,
            max_investment_return,
            min_benchmark_investment_return,
            max_benchmark_investment_return
        };
        statistics.byMonth[year + month] = {
            year,
            month,
            investment_return: month_investment_return,
            benchmark_investment_return: month_benchmark_investment_return,
            relative_investment_return: month_relative_investment_return,
            risk: month_risk,
            sharpe: month_sharpe,
            consistency: month_consistency,
            networth: month_networth,
            quotaholders: month_quotaholders,
            correlation: month_correlation
        };
        statistics.byYear[year] = {
            year,
            investment_return: year_investment_return,
            benchmark_investment_return: year_benchmark_investment_return,
            relative_investment_return: year_relative_investment_return,
            risk: year_risk,
            sharpe: year_sharpe,
            consistency: year_consistency,
            networth: year_networth,
            quotaholders: year_quotaholders,
            correlation: year_correlation
        };
    }

    return statistics;
};

class InvestmentReturnCalculator {
    constructor() {
        this.investmentReturn = 0;
    }

    add(investmentReturn) {
        this.investmentReturn = ((1 + this.investmentReturn) * (1 + investmentReturn)) - 1;
        return this.investmentReturn;
    }
}

class CorrelationCalculator {
    constructor() {
        this.sum1 = 0;
        this.sum2 = 0;
        this.sum1Sq = 0;
        this.sum2Sq = 0;
        this.pSum = 0;
    }

    add(investment_return, benchmark_investment_return, n) {
        this.sum1 += investment_return;
        this.sum2 += benchmark_investment_return;
        this.sum1Sq += Math.pow(investment_return, 2);
        this.sum2Sq += Math.pow(benchmark_investment_return, 2);
        this.pSum += investment_return * benchmark_investment_return;
        let num = this.pSum - (this.sum1 * this.sum2 / n);
        let den = Math.sqrt((this.sum1Sq - Math.pow(this.sum1, 2) / n) *
            (this.sum2Sq - Math.pow(this.sum2, 2) / n));

        if (den == 0 || Number.isNaN(den)) return 0;
        else return num / den;
    }
}

const calcRelativeInvestmentReturn = (investment_return, benchmark_investment_return) => investment_return / benchmark_investment_return;

const calcSharpeForPeriod = (risk, investment_return, cdi_investment_return, length) => {
    if (risk == 0) return 0;
    const annualizedAccInvestmentReturn = ((investment_return / length) * 252);
    const annualizedAccCDIInvestmentReturn = ((cdi_investment_return / length) * 252);
    return (annualizedAccInvestmentReturn - annualizedAccCDIInvestmentReturn) / risk;
};

class ConsistencyCalculator {
    constructor() {
        this.consistencyReached = 0;
        this.lastConsistency = [];

    }
    add(investment_return, cdi_investment_return, period) {
        let consistencyPoint = 0;
        if (investment_return >= cdi_investment_return) consistencyPoint = 1;
        if (period != 0 && this.lastConsistency.length >= period) this.consistencyReached -= this.lastConsistency.shift();
        this.consistencyReached += consistencyPoint;
        this.lastConsistency.push(consistencyPoint);
        return ((100 * this.consistencyReached) / this.lastConsistency.length) / 100;
    }
}

class NetworthCalculator {
    constructor() {
        this.lastNetworth = null;
    }

    add(networth) {
        if (this.lastNetworth == null) this.lastNetworth = networth;

        return networth - this.lastNetworth;
    }
}

class QuotaholdersCalculator {
    constructor() {
        this.lastQuotaholders = null;
    }

    add(quotaholders) {
        if (this.lastQuotaholders == null) this.lastQuotaholders = quotaholders;

        return quotaholders - this.lastQuotaholders;
    }
}

class RiskCalculator {
    constructor() {
        this.standardDeviation = new StandardDeviation();
    }

    add(investment_return) {
        this.standardDeviation.addMeasurement(investment_return);
        return this.standardDeviation.get() * Math.sqrt(252);
    }
}