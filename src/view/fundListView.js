import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
import { JsonParam, NumberParam, StringParam, useQueryParam, withDefault } from 'use-query-params';
import { makeStyles } from '@material-ui/core/styles';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Paper from '@material-ui/core/Paper';
import TablePagination from '@material-ui/core/TablePagination';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import IconButton from '@material-ui/core/IconButton';
import Menu from '@material-ui/core/Menu';
import MenuItem from '@material-ui/core/MenuItem';
import SortIcon from '@material-ui/icons/Sort';
import ArrowUpwardIcon from '@material-ui/icons/ArrowUpward';
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import FilterListIcon from '@material-ui/icons/FilterList';
import Collapse from '@material-ui/core/Collapse';
import Tooltip from '@material-ui/core/Tooltip';
import Skeleton from '@material-ui/lab/Skeleton';
import Hidden from '@material-ui/core/Hidden';
import API from '../api';
import FundFilterComponent, { emptyState as FundFilterComponentEmptyState } from './component/fundFilterComponent';
import FundSearchComponent from './component/fundSearchComponent';
import ShowStateComponent from './component/showStateComponent';
import { sortOptions } from './option';
import { settle, reportErrorIfNecessary, isError, formatters, useRendering, useState, useEffect } from '../util';


const useStyles = makeStyles(theme => ({
    filterPaperContent: {
        padding: theme.spacing(2)
    },
    optionsBar: {
        padding: theme.spacing(1)
    },
    progress: {
        margin: theme.spacing(2)
    },
    chartSelect: {
        margin: theme.spacing(1)
    },
    appBarSpacer: theme.mixins.toolbar,
    withTooltip: theme.withTooltip,
    link: theme.link
}));

const emptyState = {
    data: {
        fundList: null,
        fundDetail: {},
        totalRows: null
    },
    config: {
        page: 0,
        rowsPerPage: 25,
        sort: sortOptions[0],
        filter: FundFilterComponentEmptyState.config.filter,
        chart: {
            range: 'all',
            benchmark: 'cdi'
        },
        search: ''
    },
    layout: {
        anchorEl: null,
        showingFundDetail: {},
        showingFilter: false
    }
};

function FundListView(props) {
    // Data
    const [fundList, setFundList] = useState(emptyState.data.fundList);
    const [totalRows, setTotalRows] = useState(emptyState.data.totalRows);

    // Config            
    const [filter, setFilter] = useState(emptyState.config.filter); // TODO: This should be a query param but for that I need to figure out a simpler filtering structure

    // Config from URL
    const [search, setSearch] = useQueryParam('s', withDefault(StringParam, emptyState.config.search));
    const [page, setPage] = useQueryParam('p', withDefault(NumberParam, emptyState.config.page));
    const [rowsPerPage, setRowsPerPage] = useQueryParam('r', withDefault(NumberParam, emptyState.config.rowsPerPage));
    const [sort, setSort] = useQueryParam('sr', withDefault(JsonParam, emptyState.config.sort));

    // Layout
    const [anchorEl, setAnchorEl] = useState(emptyState.layout.anchorEl);
    const [showingFilter, setShowingFilter] = useState(emptyState.layout.showingFilter);

    const styles = useStyles();
    const isSMUp = useMediaQuery(theme => theme.breakpoints.up('sm'));
    useRendering();    

    // Updaters
    const updateFundListAndTotalRows = useCallback(async function updateFundListAndTotalRows(config) {
        const result = await settle(fetchFundList(config));

        if (isError(result)) {
            setFundList(result);
            setTotalRows(emptyState.data.totalRows);
        } else {
            setFundList(result.data);
            setTotalRows(result.totalRows);
        }

        reportErrorIfNecessary(result);
    }, []);

    // Effects    
    useEffect(function fundUpdate() {
        setFundList(emptyState.data.fundList);
        setTotalRows(emptyState.data.totalRows);

        updateFundListAndTotalRows({ search, page, rowsPerPage, sort, filter });

    }, [search, page, rowsPerPage, sort, filter, updateFundListAndTotalRows]);

    // Fetchers
    function fetchFundList(options) {
        return API.getFundList(options);
    }

    // Handlers
    function handleChangePage(object, page) {
        setPage(page);
    }

    function handleChangeRowsPerPage(event) {
        setRowsPerPage(event.target.value);
    }

    function handleSearchChange(search) {
        if (page > 0) setPage(emptyState.config.page);
        setSearch(search);
    }

    function handleSortClick(event) {
        setAnchorEl(event.currentTarget);
    };

    function handleSortClose() {
        setAnchorEl(emptyState.layout.anchorEl);
    };

    function handleSortMenuItemClick(event, index) {
        setAnchorEl(emptyState.layout.anchorEl);
        setSort(sortOptions[index]);
    }

    function handleFilterClick() {
        setShowingFilter(!showingFilter);
    }

    function handleFilterChange(filter) {
        setShowingFilter(false);
        setFilter(filter);
    }

    return (
        <div>
            <div className={styles.appBarSpacer} />
            <Grid container spacing={2} alignItems="center">
                <Grid item xs>
                    <Grid container alignItems="center" spacing={1}>
                        <Grid item>
                            <Tooltip enterTouchDelay={100} leaveTouchDelay={5000} title={
                                <React.Fragment>
                                    <p>Lista de fundos de investimento com gráfico diário.</p>
                                    <p>Por padrão somente fundos listados na BTG Pactual, XP Investimentos e Modal Mais são exibidos. No lado esquerdo é possível procurar fundos pelo nome e no lado direito é possível alterar o filtro, ordem, intervalo e benchmark.</p>
                                    <p>Clique no fundo para visualizar o gráfico.</p>
                                </React.Fragment>
                            }>
                                <Typography variant="h5" className={styles.withTooltip}>Lista de Fundos</Typography>
                            </Tooltip>
                        </Grid>
                    </Grid>
                </Grid>
            </Grid>
            <Grid container spacing={2}>
                <Grid item xs>
                    <Paper elevation={1} square={true} >
                        <Grid container wrap="nowrap" className={styles.optionsBar}>
                            <FundSearchComponent key={search} onSearchChanged={handleSearchChange} search={search} />
                            <Grid container justify="flex-end" spacing={1}>
                                <Grid item>
                                    <Tooltip title="Ordem" aria-label="Ordem">
                                        <IconButton
                                            aria-label="Ordem"
                                            aria-owns={Boolean(anchorEl) ? 'long-menu' : null}
                                            aria-haspopup="true"
                                            onClick={handleSortClick}>
                                            <SortIcon />
                                        </IconButton>
                                    </Tooltip>
                                    <Menu
                                        id="long-menu"
                                        anchorEl={anchorEl}
                                        open={Boolean(anchorEl)}
                                        onClose={handleSortClose}>
                                        {sortOptions.map((option, index) => (
                                            <MenuItem key={option.displayName + option.order} selected={option.displayName === sort.displayName && option.order === sort.order} onClick={event => handleSortMenuItemClick(event, index)}>
                                                {option.displayName}&nbsp;
                                                {option.order === 'asc' ? <ArrowDownwardIcon /> : <ArrowUpwardIcon />}
                                            </MenuItem>
                                        ))}
                                    </Menu>
                                    <Tooltip title="Filtro" aria-label="Filtro">
                                        <IconButton
                                            aria-label="Filtro"
                                            onClick={handleFilterClick}>
                                            <FilterListIcon />
                                        </IconButton>
                                    </Tooltip>
                                </Grid>
                            </Grid>
                        </Grid>
                    </Paper>
                    <Paper elevation={1} square={true}>
                        <Collapse in={showingFilter}>
                            <FundFilterComponent onFilterChanged={handleFilterChange} />
                        </Collapse>
                    </Paper>
                    <ShowStateComponent
                        data={fundList}
                        hasData={() => fundList.map((fund, index) => (
                            <Paper key={index} elevation={1} square={true} className={styles.filterPaperContent}>
                                <Link to={'/funds/' + fund.f_cnpj} className={styles.link}>
                                    <Grid container spacing={1}>
                                        <Grid item xs={8}>
                                            <Typography variant="body2">
                                                <b>{fund.f_short_name}</b><br />
                                                <small>
                                                    <b>Patrimônio:</b> {formatters.field['iry_accumulated_networth'](fund.iry_accumulated_networth)}<br />
                                                    <b>Quotistas:</b> {fund.iry_accumulated_quotaholders} <br />
                                                    <b>Benchmark:</b> {formatters.field['icf_rentab_fundo'](fund.icf_rentab_fundo)}
                                                </small>
                                            </Typography>
                                        </Grid>
                                        <Grid item xs={4}>
                                            <Grid container spacing={1}>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2"><b>Desempenho</b></Typography>
                                                </Grid>
                                                <Hidden smDown>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2"><b>Risco</b></Typography>
                                                    </Grid>
                                                </Hidden>
                                            </Grid>
                                            <Grid container spacing={1}>
                                                <Grid item sm={6} xs={12}>
                                                    <Typography variant="body2">
                                                        <small>
                                                            1A: {formatters.field['iry_investment_return_1y'](fund.iry_investment_return_1y)}<br />
                                                        2A: {formatters.field['iry_investment_return_2y'](fund.iry_investment_return_2y)}<br />
                                                        3A: {formatters.field['iry_investment_return_3y'](fund.iry_investment_return_3y)}
                                                        </small>
                                                    </Typography>
                                                </Grid>
                                                <Hidden smDown>
                                                    <Grid item xs={6}>
                                                        <Typography variant="body2">
                                                            <small>
                                                                1A: {formatters.field['iry_risk_1y'](fund.iry_risk_1y)}<br />
                                                            2A: {formatters.field['iry_risk_2y'](fund.iry_risk_2y)}<br />
                                                            3A: {formatters.field['iry_risk_3y'](fund.iry_risk_3y)}<br />
                                                            </small>
                                                        </Typography>
                                                    </Grid>
                                                </Hidden>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                </Link>
                            </Paper>
                        ))}
                        isNull={() => [...Array(rowsPerPage).keys()].map((fund, index) => (
                            <Paper key={index} elevation={1} square={true} className={styles.filterPaperContent}>
                                <Grid container spacing={1}>
                                    <Grid item xs={8}>
                                        <Typography variant="body2">
                                            <b><Skeleton /></b>
                                            <small>
                                                <Skeleton />
                                                <Skeleton />
                                                <Skeleton />
                                            </small>
                                        </Typography>
                                    </Grid>
                                    <Grid item xs={4}>
                                        <Grid container spacing={1}>
                                            <Grid item xs={6}>
                                                <Typography variant="body2"><b><Skeleton /></b></Typography>
                                            </Grid>
                                            <Hidden smDown>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2"><b><Skeleton /></b></Typography>
                                                </Grid>
                                            </Hidden>
                                        </Grid>
                                        <Grid container spacing={1}>
                                            <Grid item sm={6} xs={12}>
                                                <Typography variant="body2">
                                                    <small>
                                                        <Skeleton />
                                                        <Skeleton />
                                                        <Skeleton />
                                                    </small>
                                                </Typography>
                                            </Grid>
                                            <Hidden smDown>
                                                <Grid item xs={6}>
                                                    <Typography variant="body2">
                                                        <small>
                                                            <Skeleton />
                                                            <Skeleton />
                                                            <Skeleton />
                                                        </small>
                                                    </Typography>
                                                </Grid>
                                            </Hidden>
                                        </Grid>
                                    </Grid>
                                </Grid>
                            </Paper>
                        ))}
                        isErrored={() => (<Paper elevation={1} square={true} className={styles.filterPaperContent}><Typography variant="subtitle1" align="center">Não foi possível carregar o dado, tente novamente mais tarde.</Typography></Paper>)}
                        isEmpty={() => (<Paper elevation={1} square={true} className={styles.filterPaperContent}><Typography variant="subtitle1" align="center">Sem dados à exibir</Typography></Paper>)}
                    />
                    {totalRows ?
                        <TablePagination
                            component="div"
                            count={totalRows}
                            rowsPerPage={rowsPerPage}
                            page={page}
                            backIconButtonProps={{
                                'aria-label': 'Página Anterior',
                            }}
                            nextIconButtonProps={{
                                'aria-label': 'Próxima Página',
                            }}
                            onChangePage={handleChangePage}
                            onChangeRowsPerPage={handleChangeRowsPerPage}
                            labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
                            labelRowsPerPage={isSMUp ? 'Registros por página:' : ''}
                            rowsPerPageOptions={[5, 10, 25, 50, 100]}
                        />
                        : null}
                </Grid>
            </Grid>
        </div >
    );
}

export default FundListView;