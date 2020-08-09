import fetchBE from '../util/fetchBE';

async function getProgress() {

    const { data } = await fetchBE(`progress?order=data->progressTracker->state->start.desc`);

    return data;
};

export default getProgress;