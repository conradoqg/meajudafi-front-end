import fetchBE from '../util/fetchBE';

async function getFundsChanged(fromDate) {
    const { data } = await fetchBE(`changed_funds?action_tstamp_stm=gte.${fromDate.toISOString().substring(0, 10)}&order=action_tstamp_stm.desc`);

    return data;
};

export default getFundsChanged;