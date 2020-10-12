import createFetch from 'fetch-retry';

const API_URL = process.env.REACT_APP_API_URL || `api.${window.location.host}`;
const PROTOCOL = process.env.REACT_APP_PROTOCOL ? process.env.REACT_APP_PROTOCOL + ':' : '';

const retryFetch = createFetch(fetch, {
    retryOn: [404],
    retries: 4,
    retryDelay: function (attempt) {
        return Math.pow(2, attempt) * 1000; // 1000, 2000, 4000
    }
});

async function wrappedFecth(...args) {    
    const URL = `${PROTOCOL}//${API_URL}/${args[0]}`;
    const fetchResult = await retryFetch(URL, ...args.splice(1));

    if (fetchResult.status < 200 || fetchResult.status > 299) throw new Error(`Fetch to BE failed with status ${fetchResult.status} for '${URL}'`);
    else return { data: await fetchResult.json(), headers: fetchResult.headers };
}

export default wrappedFecth;