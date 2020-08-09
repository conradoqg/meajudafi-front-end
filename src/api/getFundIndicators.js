import allKeys from 'promise-results/allKeys';
import dayjs from 'dayjs';
import fetchBE from '../util/fetchBE';

async function getFundIndicators(options, fromDate = dayjs().subtract(1, 'month').toDate()) {
    const range = options.range;
    let filterPart = '';
    if (options.filter) {
        Object.keys(options.filter).forEach(selectedFilterOptionsKey => {
            if (selectedFilterOptionsKey === 'switch') {
                let switchItems = [];
                Object.keys(options.filter.switch).map(switchItem => options.filter.switch[switchItem] ? switchItems.push(`${switchItem}.not.is.null`) : null);
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
    const makeURL = (field, side) => `icf_with_xf_and_bf_and_mf_and_iry_and_f_of_last_year?select=${field},f_short_name,f_cnpj&${filterPart}&iry_dt_comptc=gte.${fromDate.toJSON().slice(0, 10)}&order=${field}.${side}&limit=5`;
    const indicatorsData = await allKeys({
        investment_return_top: fetchBE(makeURL(`iry_investment_return_${range}`, 'desc')),
        investment_return_bottom: fetchBE(makeURL(`iry_investment_return_${range}`, 'asc')),
        networth_top: fetchBE(makeURL(`iry_networth_${range}`, 'desc')),
        networth_bottom: fetchBE(makeURL(`iry_networth_${range}`, 'asc')),
        quotaholders_top: fetchBE(makeURL(`iry_quotaholders_${range}`, 'desc')),
        quotaholders_bottom: fetchBE(makeURL(`iry_quotaholders_${range}`, 'asc')),
        risk_top: fetchBE(makeURL(`iry_risk_${range}`, 'desc')),
        risk_bottom: fetchBE(makeURL(`iry_risk_${range}`, 'asc'))
    });

    Object.keys(indicatorsData).forEach(indicatorKey => indicatorsData[indicatorKey] = indicatorsData[indicatorKey].data);

    const toIndicatorObject = (array, field) => array.map(item => ({
        name: item.f_short_name,
        cnpj: item.f_cnpj,
        value: item[field]
    }));

    const indicators = {
        investment_return: {
            top: toIndicatorObject(indicatorsData.investment_return_top, `iry_investment_return_${range}`),
            bottom: toIndicatorObject(indicatorsData.investment_return_bottom.reverse(), `iry_investment_return_${range}`)
        },
        networth: {
            top: toIndicatorObject(indicatorsData.networth_top, `iry_networth_${range}`),
            bottom: toIndicatorObject(indicatorsData.networth_bottom.reverse(), `iry_networth_${range}`)
        },
        quotaholders: {
            top: toIndicatorObject(indicatorsData.quotaholders_top, `iry_quotaholders_${range}`),
            bottom: toIndicatorObject(indicatorsData.quotaholders_bottom.reverse(), `iry_quotaholders_${range}`)
        },
        risk: {
            top: toIndicatorObject(indicatorsData.risk_top, `iry_risk_${range}`),
            bottom: toIndicatorObject(indicatorsData.risk_bottom.reverse(), `iry_risk_${range}`)
        }
    };
    return indicators;
}

export default getFundIndicators;