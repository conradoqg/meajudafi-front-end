import React from 'react';
import { BrowserRouter as Router, Route, Link, Switch } from 'react-router-dom';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import Button from '@material-ui/core/Button';
import ShowChartIcon from '@material-ui/icons/ShowChart';
import TableChartIcon from '@material-ui/icons/TableChart';
import ScatterPlotIcon from '@material-ui/icons/ScatterPlot';
import GithubCircleIcon from 'mdi-material-ui/GithubCircle';
import Grid from '@material-ui/core/Grid';
import Hidden from '@material-ui/core/Hidden';
import IndicatorsView from './indicatorsView';
import FundListView from './fundListView';
import FundListItemView from './fundListItemView';
import FundComparisonView from './fundComparisonView';
import API from '../api';

const styles = theme => ({
    root: {
        display: 'flex',
    },
    toolbarTitle: {
        flex: 1,
    },
    appBarSpacer: theme.mixins.toolbar,
    content: {
        flexGrow: 1,
        padding: theme.spacing.unit * 3,
        height: '100vh',
        overflow: 'auto',
        backgroundColor: 'ghostwhite'
    },
    chartContainer: {
        marginLeft: -22,
    },
    tableContainer: {
        height: 320,
    },
    centered: {
        position: 'fixed',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)'
    },
    link: {
        textDecoration: 'none',
        color: 'black',
        cursor: 'pointer',
        '&:hover': {
            textDecoration: 'underline'
        },
        [theme.breakpoints.down('md')]: {
            textDecoration: 'underline',
        },
    },
    menuLink: {
        textDecoration: 'none',
        color: 'white'
    },
    menuLinkSelected: {
        textDecoration: 'none',
        color: 'white',
        borderBottom: '2px solid'
    }
});

const routes = [
    {
        path: '/',
        name: 'Indicadores',
        showInMenu: true,
        exact: true,
        icon: () => (<ShowChartIcon />),
        main: (props, classes) => <IndicatorsView {...props} globalClasses={classes} />
    },
    {
        path: '/fundList/:cnpj',
        name: 'Informações sobre o fundo',
        showInMenu: false,
        icon: () => (<TableChartIcon />),
        main: (props, classes) => <FundListItemView {...props} basePath={'/fundList'} globalClasses={classes} />
    },
    {
        path: '/fundList',
        name: 'Lista de Fundos',
        showInMenu: true,
        icon: () => (<TableChartIcon />),
        main: (props, classes) => <FundListView {...props} globalClasses={classes} />
    },
    {
        path: ['/fundComparison/:benchmark/:range/:field/:cnpjs*', '/fundComparison'],
        linkTo: '/fundComparison/cdi/1y/investment_return',
        name: 'Comparação de Fundos',
        showInMenu: true,
        icon: () => (<ScatterPlotIcon />),
        main: (props, classes) => <FundComparisonView basePath={'/fundComparison'} globalClasses={classes} />
    }
];

const MenuLink = ({ label, to, activeOnlyWhenExact, icon, classes }) => (
    <Route
        path={to}
        exact={activeOnlyWhenExact}
        children={({ match }) => (
            <Link to={to} className={match ? classes.menuLinkSelected : classes.menuLink}>
                <Button color="inherit" >{label}</Button>
            </Link>
        )}
    />
);

class Dashboard extends React.Component {
    state = {
        maintenanceMode: false
    };

    componentDidMount = async () => {
        this.setState({ maintenanceMode: await API.isInMaintenanceMode() });
    };

    render() {
        const { classes } = this.props;

        if (this.state.maintenanceMode)
            return (<div className={classes.centered}>
                <Typography variant="title" noWrap>Estamos em manutenção, volte em alguns minutos.</Typography>
            </div>);
        else return (
            <Router>
                <React.Fragment>
                    <CssBaseline />
                    <div className={classes.root}>
                        <AppBar
                            position="absolute">
                            <Toolbar>
                                <Typography variant="title" color="inherit" noWrap className={classes.toolbarTitle}>
                                    Me Ajuda FI
                                </Typography>
                                {routes.filter(route => route.showInMenu).map((route, index) => (
                                    <MenuLink activeOnlyWhenExact={route.exact} to={route.linkTo ? route.linkTo : route.path} classes={classes} label={route.name} icon={route.icon} key={index} />
                                ))}
                                <Hidden smDown>
                                    <IconButton color="inherit" aria-label="Repositório no Github" href="https://github.com/conradoqg/cvm-fund-explorer-stack" target="_new">
                                        <GithubCircleIcon fontSize="default" />
                                    </IconButton>
                                </Hidden>
                            </Toolbar>
                        </AppBar>
                        <main className={classes.content}>
                            <Switch>
                                {routes.map((route, index) => (
                                    <Route
                                        key={index}
                                        path={route.path}
                                        exact={route.exact}
                                        render={(props) => route.main(props, classes)}
                                    />
                                ))}
                                <Route component={() => (
                                    <div>
                                        <div className={classes.appBarSpacer} />
                                        <Grid container spacing={16}>
                                            <Grid item xs={12}>
                                                <Typography variant="title" align="center" noWrap>Página não encontrada.</Typography>
                                            </Grid>
                                        </Grid>
                                    </div>)} />
                            </Switch>
                            <Grid container spacing={16}>
                                <Grid item xs={12}>
                                    <Typography variant="caption" gutterBottom>
                                        <p>Rentabilidade passada não representa garantia de rentabilidade futura.</p>
                                        <p>A rentabilidade divulgada não é líquida de impostos.</p>
                                        <p>Fundos de investimento não contam com garantia do administrador, do gestor, de qualquer mecanismo de seguro ou fundo garantidor de crédito – FGC.</p>
                                        <p>Alguns fundos tem menos de 12 (doze) meses. Para avaliação da performance de um fundo de investimento, é recomendável a análise de, no mínimo, 12 (doze) meses.</p>
                                        <p>Os dados são extraídos do site da CVM diariamente e podem conter erros.</p>
                                    </Typography>
                                </Grid>
                            </Grid>
                        </main>
                    </div>
                </React.Fragment>
            </Router>
        );
    }
}

Dashboard.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(Dashboard);