import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import Radio from '@material-ui/core/Radio';
import RadioGroup from '@material-ui/core/RadioGroup';
import FormControl from '@material-ui/core/FormControl';
import FormLabel from '@material-ui/core/FormLabel';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import Button from '@material-ui/core/Button';
import { produce, setAutoFreeze } from 'immer';

setAutoFreeze(false);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
    group: {
        margin: `${theme.spacing.unit}px 0`,
    }
});

const emptyState = {
    config: {
        chartConfig: {
            range: 'all',            
            benchmarkReference: 'cdi'
        }
    }
};

class FundChartConfigView extends React.Component {
    state = emptyState;

    static emptyState = emptyState;

    handleValueChange = field => event => {
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.chartConfig[field] = value;
        }));
    }

    handleFilterApplyClick = async () => {
        return this.props.onChartConfigChanged(this.state.config.chartConfig);
    }

    handleFilterClearClick = async () => {
        this.setState(produce(draft => {
            draft.config = emptyState.config;
        }));

        return this.props.onChartConfigChanged(null);
    }

    render = () => {
        const { classes } = this.props;

        return (
            <div className={classes.filterPaperContent}>
                <Typography variant="title" align="center" gutterBottom>Configurações do Gráfico</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={6}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Período</FormLabel>
                            <RadioGroup
                                aria-label="Período"
                                name="range"
                                className={classes.group}
                                value={this.state.config.chartConfig.range}
                                onChange={this.handleValueChange('range')}
                            >
                                <FormControlLabel value="mtd" control={<Radio />} label="Nesse mês" />
                                <FormControlLabel value="ytd" control={<Radio />} label="Nesse ano" />
                                <FormControlLabel value="1m" control={<Radio />} label="1 mês" />
                                <FormControlLabel value="3m" control={<Radio />} label="3 mêses" />
                                <FormControlLabel value="6m" control={<Radio />} label="6 mêses" />
                                <FormControlLabel value="1y" control={<Radio />} label="1 ano" />
                                <FormControlLabel value="2y" control={<Radio />} label="2 anos" />
                                <FormControlLabel value="3y" control={<Radio />} label="3 anos" />
                                <FormControlLabel value="all" control={<Radio />} label="Desde o início" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>                    
                    <Grid item xs={6}>
                        <FormControl component="fieldset" className={classes.formControl}>
                            <FormLabel component="legend">Referência Benchmark</FormLabel>
                            <RadioGroup
                                aria-label="Referência Benchmark"
                                name="benchmarkReference"
                                className={classes.group}
                                value={this.state.config.chartConfig.benchmarkReference}
                                onChange={this.handleValueChange('benchmarkReference')}
                            >
                                <FormControlLabel value="cdi" control={<Radio />} label="CDI" />
                                <FormControlLabel value="bovespa" control={<Radio />} label="Bovespa" />
                                <FormControlLabel value="ipca" control={<Radio />} label="IPCA" />
                                <FormControlLabel value="igpm" control={<Radio />} label="IGPM" />
                                <FormControlLabel value="igpdi" control={<Radio />} label="IGPDI" />
                                <FormControlLabel value="euro" control={<Radio />} label="Euro" />
                                <FormControlLabel value="dolar" control={<Radio />} label="Dólar" />
                            </RadioGroup>
                        </FormControl>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" color="primary" onClick={this.handleFilterApplyClick} >Aplicar</Button>
                    </Grid>
                    <Grid item xs={6} align="center">
                        <Button variant="contained" color="secondary" onClick={this.handleFilterClearClick} >Limpar</Button>
                    </Grid>
                </Grid>
            </div>
        );
    }

}

module.exports = withStyles(styles)(FundChartConfigView);