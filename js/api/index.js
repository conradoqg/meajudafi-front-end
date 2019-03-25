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

        const fundListObject = await fetch(`//${API_URL}/icf_with_xf_and_bf_and_iry_and_f_of_last_year?select=icf_cnpj_fundo,f_short_name,iry_accumulated_networth,iry_accumulated_quotaholders,icf_rentab_fundo,iry_investment_return_1y,iry_investment_return_2y,iry_investment_return_3y,iry_risk_1y,iry_risk_2y,iry_risk_3y&${filterPart}${searchPart}iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${sort}`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range,
                'Prefer': 'count=exact'
            }
        });

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
    getFundData: async (cnpj) => {
        const infCadastral = await fetch(`//${API_URL}/inf_cadastral_fi?select=denom_social&cnpj_fundo=eq.${cnpj}`);
        return infCadastral.json();
    },
    getFundStatistic: async (cnpj, reference, lastDaysOrFromDate, additionalFields) => {
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

        const result = await fetch(`//${API_URL}/investment_return_daily?select=${additionalFieldsPart}ird_dt_comptc,ird_investment_return,${`ird_${reference}_investment_return`},ird_accumulated_quotaholders,ird_accumulated_networth&ird_cnpj_fundo=eq.${cnpj}${fromDatePart}&order=ird_dt_comptc.desc`, rangePart);

        const data = await result.json();

        const statistics = {
            date: [],
            investment_return: [],
            benchmark_investment_return: [],
            risk: [],
            sharpe: [],
            benchmark_consistency: [],
            networth: [],
            quotaholders: [],
            min_investment_return: 0,
            max_investment_return: 0,
            min_benchmark_investment_return: 0,
            max_benchmark_investment_return: 0,
        };

        let date = null;
        let investment_return = 0;
        let benchmark_investment_return = 0;
        let risk = 0;
        let sharpe = 0;
        let benchmark_consistency = 0;
        let networth = 0;
        let quotaholders = 0;

        let riskCalculator = new StandardDeviation();
        let benchmarkConsistencyReached = 0;
        let lastBenchmarkConsistency = [];

        const calcSharpeForPeriod = (risk, investment_return, cdi_investment_return, length) => {
            if (risk == 0) return 0;
            const annualizedAccInvestmentReturn = ((investment_return / length) * 252);
            const annualizedAccCDIInvestmentReturn = ((cdi_investment_return / length) * 252);
            return (annualizedAccInvestmentReturn - annualizedAccCDIInvestmentReturn) / risk;
        };

        const calcConsistencyForPeriod = (investment_return, cdi_investment_return, period, consistencyReached, lastConsistency) => {
            let consistencyPoint = 0;
            if (investment_return >= cdi_investment_return) consistencyPoint = 1;
            if (period != 0 && lastConsistency.length >= period) consistencyReached -= lastConsistency.shift();
            consistencyReached += consistencyPoint;
            lastConsistency.push(consistencyPoint);
            return consistencyReached;
        };
        const getConsistencyForPeriod = (consistencyReached, lastConsistency) => ((100 * consistencyReached) / lastConsistency.length) / 100;

        for (let index = data.length - 1; index >= 0; index--) {
            const item = data[index];

            date = item.ird_dt_comptc;

            if (index == data.length - 1) {
                statistics.date.push(date);
                statistics.investment_return.push(investment_return);
                statistics.benchmark_investment_return.push(benchmark_investment_return);
                statistics.risk.push(risk);
                statistics.sharpe.push(sharpe);
                statistics.benchmark_consistency.push(benchmark_consistency);
                statistics.networth.push(networth);
                statistics.quotaholders.push(quotaholders);
                statistics.min_investment_return = Math.min(statistics.min_investment_return, investment_return);
                statistics.max_investment_return = Math.max(statistics.max_investment_return, investment_return);
                statistics.min_benchmark_investment_return = Math.min(statistics.min_benchmark_investment_return, benchmark_investment_return);
                statistics.max_benchmark_investment_return = Math.max(statistics.max_benchmark_investment_return, benchmark_investment_return);
                continue;
            }

            investment_return = ((1 + investment_return) * (1 + item.ird_investment_return)) - 1;
            benchmark_investment_return = ((1 + benchmark_investment_return) * (1 + item[`ird_${reference}_investment_return`])) - 1;
            riskCalculator.addMeasurement(item.ird_investment_return);
            risk = riskCalculator.get() * Math.sqrt(252);
            sharpe = calcSharpeForPeriod(risk, investment_return, benchmark_investment_return, data.length - 1);
            benchmarkConsistencyReached = calcConsistencyForPeriod(item.ird_investment_return, item[`ird_${reference}_investment_return`], data.length - 1, benchmarkConsistencyReached, lastBenchmarkConsistency);
            benchmark_consistency = getConsistencyForPeriod(benchmarkConsistencyReached, lastBenchmarkConsistency);
            networth = item.ird_accumulated_networth;
            quotaholders = item.ird_accumulated_quotaholders;

            statistics.date.push(date);
            statistics.investment_return.push(investment_return);
            statistics.benchmark_investment_return.push(benchmark_investment_return);
            statistics.risk.push(risk);
            statistics.sharpe.push(sharpe);
            statistics.benchmark_consistency.push(benchmark_consistency);
            statistics.networth.push(networth);
            statistics.quotaholders.push(quotaholders);
            statistics.min_investment_return = Math.min(statistics.min_investment_return, investment_return);
            statistics.max_investment_return = Math.max(statistics.max_investment_return, investment_return);
            statistics.min_benchmark_investment_return = Math.min(statistics.min_benchmark_investment_return, benchmark_investment_return);
            statistics.max_benchmark_investment_return = Math.max(statistics.max_benchmark_investment_return, benchmark_investment_return);
        }

        return statistics;
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

        let data = await result.json();

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
            date: [],
            investment_return: [],
            risk: [],
            min_investment_return: 0,
            max_investment_return: 0
        };

        let date = null;
        let investment_return = 0;
        let prevValue = null;
        let risk = 0;

        let riskCalculator = new StandardDeviation();

        for (let index = data.length - 1; index >= 0; index--) {
            const item = data[index];

            date = item.data;

            const value = fromQuoteToPercentage(item.valor, prevValue);            
            prevValue = item.valor;

            investment_return = ((1 + investment_return) * (1 + value)) - 1;            
            riskCalculator.addMeasurement(value);
            risk = riskCalculator.get() * Math.sqrt(252);

            statistics.date.push(date);
            statistics.investment_return.push(investment_return);
            statistics.risk.push(risk);
            statistics.min_investment_return = Math.min(statistics.min_investment_return, investment_return);
            statistics.max_investment_return = Math.max(statistics.max_investment_return, investment_return);
        }

        return statistics;
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

        const makeURL = (field, side) => `//${API_URL}/icf_with_xf_and_bf_and_iry_and_f_of_last_year?select=${field},f_short_name&${filterPart}&iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${field}.${side}&limit=5`;

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

        let data = await fundsChangedObject.json();

        return data;
    },
    isInMaintenanceMode: async () => {
        const currentVersionArray = packageJson.version.split('.').map(value => parseInt(value));
        const minor = currentVersionArray[currentVersionArray.length - 1];

        const lastMigrationObject = await fetch(`//${API_URL}/migrations?order=name.desc&limit=1`);
        const lastMigrationData = await lastMigrationObject.json();

        let migrationMinor = 0;

        if (lastMigrationData.length > 0) {
            migrationMinor = parseInt(lastMigrationData[0].name.substring(0, 8));
        }

        return minor != migrationMinor;
    }
};