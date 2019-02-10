import allKeys from 'promise-results/allKeys';
import { StandardDeviation } from '../util';

/* global process */
const API_URL = process.env.API_URL || 'api.cvmfundexplorer.conradoqg.eti.br';

module.exports = {
    getFundList: async (options) => {
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;

        let filterPart = '';
        if (options.filter) {

            Object.keys(options.filter).map(selectedFilterOptionsKey => {
                if (Array.isArray(options.filter[selectedFilterOptionsKey])) {
                    const selectedFilterOptionsText = options.filter[selectedFilterOptionsKey].map(selectedFilter => {
                        if (selectedFilter == null) return `${selectedFilterOptionsKey}.is.null`;
                        else return `${selectedFilterOptionsKey}.eq."${selectedFilter}"`;
                    });
                    if (selectedFilterOptionsText.length > 0) filterPart += `or=(${selectedFilterOptionsText.join(',')})&`;
                } else if (typeof options.filter[selectedFilterOptionsKey] === 'object') {
                    let minPart = '';
                    let maxPart = '';
                    if (options.filter[selectedFilterOptionsKey].min != '') minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                    if (options.filter[selectedFilterOptionsKey].max != '') maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                    if (minPart && maxPart) filterPart += `and=(${minPart},${maxPart})&`;
                    else if (minPart || maxPart) filterPart += `and=(${minPart}${maxPart})&`;
                } else {
                    if (options.filter[selectedFilterOptionsKey]) filterPart += `and=(${selectedFilterOptionsKey}.not.is.null)&`;
                }
            });
        }

        let searchPart = '';
        if (options.search) {
            if (options.search.term != '') {
                // Identify if it's a CNPJ or a fund name
                if (/^\d+$/.test(options.search.term)) {
                    searchPart = `and=(icf_cnpj_fundo.ilike.*${options.search.term}*)&`;
                } else {
                    searchPart = `and=(icf_denom_social_unaccented.ilike.*${options.search.term.normalize('NFD').replace(/[\u0300-\u036f]/g, '')}*)&`;
                }
            }
        }

        const fundListObject = await fetch(`//${API_URL}/icf_with_xf_and_iry_of_last_year?${filterPart}${searchPart}order=${sort}`, {
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
    getFundDetail: async (cnpj, limit, from) => {
        const range = limit ? `0-${limit}` : '';
        const fromPart = from ? `&ird_dt_comptc=gte.${from.toJSON().slice(0, 10)}` : '';
        const dailyReturn = await fetch(`//${API_URL}/investment_return_daily?ird_cnpj_fundo=eq.${cnpj}${fromPart}&order=ird_dt_comptc.desc`, {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': range
            }
        });
        const infCadastral = await fetch(`//${API_URL}/inf_cadastral_fi?cnpj_fundo=eq.${cnpj}`);

        return allKeys({ dailyReturn: dailyReturn.json(), infCadastral: infCadastral.json() });
    },
    getFundData: async (cnpj) => {
        const infCadastral = await fetch(`//${API_URL}/inf_cadastral_fi?select=denom_social&cnpj_fundo=eq.${cnpj}`);
        return infCadastral.json();
    },
    getFundStatistic: async (cnpj, reference, lastDaysOrFromDate) => {
        let fromDatePart = '';
        let rangePart = null;

        if (lastDaysOrFromDate instanceof Date) fromDatePart = `&ird_dt_comptc=gte.${lastDaysOrFromDate.toJSON().slice(0, 10)}`;
        else if (typeof (lastDaysOrFromDate) == 'number') rangePart = {
            headers: {
                'Range-Unit': 'items',
                'Range': `0-${lastDaysOrFromDate - 1}`
            }
        };

        const result = await fetch(`//${API_URL}/investment_return_daily?select=ird_dt_comptc,ird_investment_return,${`ird_${reference}_investment_return`},ird_quotaholders,ird_networth&ird_cnpj_fundo=eq.${cnpj}${fromDatePart}&order=ird_dt_comptc.desc`, rangePart);

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
            networth = item.ird_networth;
            quotaholders = item.ird_quotaholders;

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
    }
};