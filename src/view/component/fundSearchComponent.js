import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import SearchIcon from '@material-ui/icons/Search';
import Input from '@material-ui/core/Input';
import InputAdornment from '@material-ui/core/InputAdornment';
import Grid from '@material-ui/core/Grid';
import { produce, setAutoFreeze } from 'immer';

setAutoFreeze(false);

const styles = theme => ({
    input: {
        marginLeft: theme.spacing(1)
    },
});

const emptyState = {
    config: {
        search: {
            term: ''
        }
    }
};

class FundSearchComponent extends React.Component {
    state = emptyState;

    static emptyState = emptyState;

    timeout = null;

    triggerOnSearchChanged = () => {
        return this.props.onSearchChanged(this.state.config.search);
    };

    handleSearchChange = (event) => {
        const value = event.target.value;
        this.setState(produce(draft => {
            draft.config.search.term = value;
        }));
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = setTimeout(this.triggerOnSearchChanged, 1000);
    }

    handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            const value = event.target.value;
            this.setState(produce(draft => {
                draft.config.search.term = value;
            }));
            if (this.timeout) clearTimeout(this.timeout);
            this.triggerOnSearchChanged();
        }
    }

    render() {
        const { classes } = this.props;

        return (
            <Grid container alignItems="center" justify="flex-start">
                <Input
                    id="input-with-icon-grid"
                    placeholder="Nome do fundo ou CNPJ"
                    value={this.state.config.search.term}
                    onChange={this.handleSearchChange}
                    onKeyPress={this.handleKeyPress}
                    className={classes.input}
                    autoComplete="new-search"                    
                    fullWidth
                    startAdornment={
                        <InputAdornment position="start">
                            <SearchIcon />
                        </InputAdornment>
                    }
                    inputProps={{
                        'aria-label': 'Procura',
                    }}
                />
            </Grid>
        );
    }

}

export default withStyles(styles)(FundSearchComponent);