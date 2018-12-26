import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Typography from '@material-ui/core/Typography';
import Grid from '@material-ui/core/Grid';
import ListItemText from '@material-ui/core/ListItemText';
import Select from '@material-ui/core/Select';
import Checkbox from '@material-ui/core/Checkbox';
import Input from '@material-ui/core/Input';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Slider from 'rc-slider';
import 'rc-slider/assets/index.css';
import { produce, setAutoFreeze } from 'immer';
import filterOptions from './filterOptions';

setAutoFreeze(false);

const createSliderWithTooltip = Slider.createSliderWithTooltip;
const Range = createSliderWithTooltip(Slider.Range);

const styles = theme => ({
    filterPaperContent: {
        padding: theme.spacing.unit * 2
    },
});

const ITEM_HEIGHT = 48;
const ITEM_PADDING_TOP = 8;
const MenuProps = {
    PaperProps: {
        style: {
            maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP
        },
    },
};

const min = -4;
const max = 4;

const emptyState = {
    data: {
        filterOptions: filterOptions,
        filterRange: {
            iry_investment_return_1y: { min, max },
            iry_investment_return_2y: { min, max },
            iry_investment_return_3y: { min, max },
            iry_risk_1y: { min, max },
            iry_risk_2y: { min, max },
            iry_risk_3y: { min, max }            
        }
    },
    config: {
        filter: {
            class: [],
            iry_investment_return_1y: { min, max },
            iry_investment_return_2y: { min, max },
            iry_investment_return_3y: { min, max },
            iry_risk_1y: { min, max },
            iry_risk_2y: { min, max },
            iry_risk_3y: { min, max }
        }
    }
};

class FundFilterView extends React.Component {
    state = emptyState;

    handleFilterClassChange = event => {
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.filter.class = value;
        }));
    }

    handleFilterRangeClick = iry_investment_return => {
        return range => {
            this.setState(produce(draft => {
                draft.config.filter[iry_investment_return] = { min: range[0], max: range[1] };
            }));
        };
    }

    handleFilterApplyClick = async () => {
        return this.props.onFilterChanged(this.state.config.filter);
    }

    handleFilterClearClick = async () => {        
        this.setState(produce(draft => {
            draft.config.filter.class = [];
            draft.config.filter.iry_investment_return_1y = emptyState.config.filter.iry_investment_return_1y;
            draft.config.filter.iry_investment_return_2y = emptyState.config.filter.iry_investment_return_2y;
            draft.config.filter.iry_investment_return_3y = emptyState.config.filter.iry_investment_return_3y;
            draft.config.filter.iry_risk_1y = emptyState.config.filter.iry_risk_1y;
            draft.config.filter.iry_risk_2y = emptyState.config.filter.iry_risk_2y;
            draft.config.filter.iry_risk_3y = emptyState.config.filter.iry_risk_3y;            
        }));
                
        return this.props.onFilterChanged(null);        
    }

    render = () => {
        const { classes } = this.props;

        return (
            <div className={classes.filterPaperContent}>
                <Typography variant="title" align="center" gutterBottom>Filtros</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={12}>
                        <Typography variant="subheading" align="center" gutterBottom>Classe:</Typography>
                        <Select
                            multiple
                            value={this.state.config.filter.class}
                            onChange={this.handleFilterClassChange}
                            input={<Input id="select-multiple-checkbox" />}
                            renderValue={selected => selected.map(item => this.state.data.filterOptions.class.options.find(clazz => clazz.value == item).displayName).join(', ')}
                            MenuProps={MenuProps}
                            fullWidth>
                            {this.state.data.filterOptions.class.options.map(classOption => (
                                <MenuItem key={classOption.displayName} value={classOption.value}>
                                    <Checkbox checked={this.state.config.filter.class.indexOf(classOption.value) > -1} />
                                    <ListItemText primary={classOption.displayName} />
                                </MenuItem>
                            ))}
                        </Select>
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subheading" align="center" gutterBottom>Desempenho 1A:</Typography>
                        <Range
                            tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                            min={this.state.data.filterRange.iry_investment_return_1y.min}
                            max={this.state.data.filterRange.iry_investment_return_1y.max}
                            step={Math.abs((this.state.data.filterRange.iry_investment_return_1y.max - this.state.data.filterRange.iry_investment_return_1y.min) / 100)}
                            onChange={this.handleFilterRangeClick('iry_investment_return_1y')}
                            value={[this.state.config.filter.iry_investment_return_1y.min, this.state.config.filter.iry_investment_return_1y.max]} />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subheading" align="center" gutterBottom>Risco 1A:</Typography>
                        <Range
                            tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                            min={this.state.data.filterRange.iry_risk_1y.min}
                            max={this.state.data.filterRange.iry_risk_1y.max}
                            step={Math.abs((this.state.data.filterRange.iry_risk_1y.max - this.state.data.filterRange.iry_risk_1y.min) / 100)}
                            onChange={this.handleFilterRangeClick('iry_risk_1y')}
                            value={[this.state.config.filter.iry_risk_1y.min, this.state.config.filter.iry_risk_1y.max]} />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subheading" align="center" gutterBottom>Desempenho 2A:</Typography>
                        <Range
                            tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                            min={this.state.data.filterRange.iry_investment_return_2y.min}
                            max={this.state.data.filterRange.iry_investment_return_2y.max}
                            step={Math.abs((this.state.data.filterRange.iry_investment_return_2y.max - this.state.data.filterRange.iry_investment_return_2y.min) / 100)}
                            onChange={this.handleFilterRangeClick('iry_investment_return_2y')}
                            value={[this.state.config.filter.iry_investment_return_2y.min, this.state.config.filter.iry_investment_return_2y.max]} />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subheading" align="center" gutterBottom>Risco 2A:</Typography>
                        <Range
                            tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                            min={this.state.data.filterRange.iry_risk_2y.min}
                            max={this.state.data.filterRange.iry_risk_2y.max}
                            step={Math.abs((this.state.data.filterRange.iry_risk_2y.max - this.state.data.filterRange.iry_risk_2y.min) / 100)}
                            onChange={this.handleFilterRangeClick('iry_risk_2y')}
                            value={[this.state.config.filter.iry_risk_2y.min, this.state.config.filter.iry_risk_2y.max]} />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subheading" align="center" gutterBottom>Desempenho 3A:</Typography>
                        <Range
                            tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                            min={this.state.data.filterRange.iry_investment_return_3y.min}
                            max={this.state.data.filterRange.iry_investment_return_3y.max}
                            step={Math.abs((this.state.data.filterRange.iry_investment_return_3y.max - this.state.data.filterRange.iry_investment_return_3y.min) / 100)}
                            onChange={this.handleFilterRangeClick('iry_investment_return_3y')}
                            value={[this.state.config.filter.iry_investment_return_3y.min, this.state.config.filter.iry_investment_return_3y.max]} />
                    </Grid>
                    <Grid item xs={6}>
                        <Typography variant="subheading" align="center" gutterBottom>Risco 3A:</Typography>
                        <Range
                            tipFormatter={value => `${(value * 100).toFixed(2)}%`}
                            min={this.state.data.filterRange.iry_risk_3y.min}
                            max={this.state.data.filterRange.iry_risk_3y.max}
                            step={Math.abs((this.state.data.filterRange.iry_risk_3y.max - this.state.data.filterRange.iry_risk_3y.min) / 100)}
                            onChange={this.handleFilterRangeClick('iry_risk_3y')}
                            value={[this.state.config.filter.iry_risk_3y.min, this.state.config.filter.iry_risk_3y.max]} />
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

module.exports = withStyles(styles)(FundFilterView);