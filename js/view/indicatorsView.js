
import Typography from '@material-ui/core/Typography';
import React from 'react';

class IndicatorsView extends React.Component {
    state = null;

    render() {
        const { classes } = this.props;

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Indicadores</Typography>
                Em desenvolvimento
            </div>
        );
    }
}

module.exports = IndicatorsView;