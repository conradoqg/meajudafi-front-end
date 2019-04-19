import dayjs from 'dayjs';

export default [
    {
        name: 'all',
        displayName: 'Desde o início',
        toDate: () => new Date('0001-01-01T00:00:00Z')
    },
    {
        name: 'mtd',
        displayName: 'Nesse mês',
        toDate: () => dayjs().startOf('month').toDate()
    },
    {
        name: 'ytd',
        displayName: 'Nesse ano',
        toDate: () => dayjs().startOf('year').toDate()
    },
    {
        name: '1w',
        displayName: '1 semana',
        toDate: () => dayjs().subtract(1, 'week').toDate()
    },
    {
        name: '1m',
        displayName: '1 mês',
        toDate: () => dayjs().subtract(1, 'month').toDate()
    },
    {
        name: '3m',
        displayName: '3 meses',
        toDate: () => dayjs().subtract(3, 'month').toDate()
    },
    {
        name: '6m',
        displayName: '6 meses',
        toDate: () => dayjs().subtract(6, 'month').toDate()
    },
    {
        name: '1y',
        displayName: '1 ano',
        toDate: () => dayjs().subtract(1, 'year').toDate()
    },
    {
        name: '2y',
        displayName: '2 anos',
        toDate: () => dayjs().subtract(2, 'year').toDate()
    },
    {
        name: '3y',
        displayName: '3 anos',
        toDate: () => dayjs().subtract(3, 'year').toDate()
    }
];