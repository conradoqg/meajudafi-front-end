import allKeys from 'promise-results/allKeys';
import packageJson from '../../package.json';
//import calculateStatistics from '../math/calculateStatistics';
import calculateBenchmarkStatistics from '../math/calculateBenchmarkStatistics';
import WebWorker from '../util/webWorker';
import calculateStatistics from '../worker/calculateStatistics';

/* global process */
const API_URL = `api.${window.location.host}`;

export default {
    getFundList: async (options, fromDate = new Date((new Date()).getFullYear(), 0, 1)) => {
        const range = `${(options.page * options.rowsPerPage)}-${((options.page * options.rowsPerPage) + options.rowsPerPage - 1)}`;
        const sort = `${options.sort.field}.${options.sort.order}`;

        let filterPart = '';
        if (options.filter) {
            Object.keys(options.filter).forEach(selectedFilterOptionsKey => {
                if (selectedFilterOptionsKey === 'switch') {
                    let switchItems = [];
                    Object.keys(options.filter.switch).map(switchItem => {
                        return options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null;
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
                        if (options.filter[selectedFilterOptionsKey].min !== '') minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                        if (options.filter[selectedFilterOptionsKey].max !== '') maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                        if (minPart && maxPart) filterPart += `and=(${minPart},${maxPart})&`;
                        else if (minPart || maxPart) filterPart += `and=(${minPart}${maxPart})&`;
                    }
                }
            });
        }

        let searchPart = '';
        if (options.search) {
            if (options.search.term !== '') {
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

        const funds = await fetch(`//${API_URL}/funds_enhanced?select=f_name,f_short_name,f_cnpj,icf_rentab_fundo${additionalFieldsPart}&f_cnpj=eq.${cnpj}`);

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

        if (data.length === 0) throw new Error(`No data found for CNPJ ${cnpj}`);

        return new Promise((resolve, reject) => {
            const worker = new WebWorker(calculateStatistics);

            worker.postMessage({ data, benchmark });

            worker.addEventListener('message', (event) => {
                resolve(event.data);
            });
        });
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
        if (benchmark === 'cdi') {
            tablePart = 'fbcdata_sgs_12i';
        } else if (benchmark === 'bovespa') {
            tablePart = 'fbcdata_sgs_7i';
        } else if (benchmark === 'dolar') {
            tablePart = 'fbcdata_sgs_1i';
        } else if (benchmark === 'euro') {
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
            Object.keys(options.filter).forEach(selectedFilterOptionsKey => {
                if (selectedFilterOptionsKey === 'switch') {
                    let switchItems = [];
                    Object.keys(options.filter.switch).map(switchItem => {
                        return options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null;
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
                        if (options.filter[selectedFilterOptionsKey].min !== '') minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                        if (options.filter[selectedFilterOptionsKey].max !== '') maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
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

        data.forEach(row => {
            fields.forEach(field => {
                var value = null;
                if (field === 'date') value = row.dt_comptc;
                else value = row[`${field}_valor`] == null ? lastValue[field] : row[`${field}_valor`];

                economyIndicators[field].push(value);
                lastValue[field] = value;
            });
        });

        return economyIndicators;
    },
    getFundsChanged: async (fromDate) => {
        const fundsChangedObject = await fetch(`//${API_URL}/changed_funds?action_tstamp_stm=gte.${fromDate.toISOString()}&order=action_tstamp_stm.desc`);

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

        return minor !== migrationMinor;
    }
};


