import allKeys from 'promise-results/allKeys';
import { PROTOCOL, API_URL } from './index';

export default async (options, fromDate = new Date((new Date()).getFullYear(), 0, 1)) => {
    const range = options.range;
    let filterPart = '';
    if (options.filter) {
        Object.keys(options.filter).forEach(selectedFilterOptionsKey => {
            if (selectedFilterOptionsKey === 'switch') {
                let switchItems = [];
                Object.keys(options.filter.switch).map(switchItem => {
                    return options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null;
                });
                if (switchItems.length > 0)
                    filterPart += `or=(${switchItems.join(',')})&`;
            }
            else if (Array.isArray(options.filter[selectedFilterOptionsKey])) {
                const selectedFilterOptionsText = options.filter[selectedFilterOptionsKey].map(selectedFilter => {
                    if (selectedFilter == null)
                        return `${selectedFilterOptionsKey}.is.null`;
                    else
                        return `${selectedFilterOptionsKey}.eq."${selectedFilter}"`;
                });
                if (selectedFilterOptionsText.length > 0)
                    filterPart += `or=(${selectedFilterOptionsText.join(',')})&`;
            }
            else if (typeof options.filter[selectedFilterOptionsKey] === 'object') {
                if (options.filter[selectedFilterOptionsKey].min != null && options.filter[selectedFilterOptionsKey].min != null) {
                    let minPart = '';
                    let maxPart = '';
                    if (options.filter[selectedFilterOptionsKey].min !== '')
                        minPart = `${selectedFilterOptionsKey}.gte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].min) : options.filter[selectedFilterOptionsKey].min}`;
                    if (options.filter[selectedFilterOptionsKey].max !== '')
                        maxPart = `${selectedFilterOptionsKey}.lte.${options.filter[selectedFilterOptionsKey].format ? options.filter[selectedFilterOptionsKey].format(options.filter[selectedFilterOptionsKey].max) : options.filter[selectedFilterOptionsKey].max}`;
                    if (minPart && maxPart)
                        filterPart += `and=(${minPart},${maxPart})&`;
                    else if (minPart || maxPart)
                        filterPart += `and=(${minPart}${maxPart})&`;
                }
            }
        });
    }
    const makeURL = (field, side) => `${PROTOCOL}//${API_URL}/icf_with_xf_and_bf_and_iry_and_f_of_last_year?select=${field},f_short_name,f_cnpj&${filterPart}&iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${field}.${side}&limit=5`;
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
    if (Object.values(indicatorsObject).some(result => result.status < 200 || result.status > 299))
        throw new Error('Unable to retrieve fund indicator');
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
};
