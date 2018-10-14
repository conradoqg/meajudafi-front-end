
import Typography from '@material-ui/core/Typography';
import React from 'react';

class IndicatorsView extends React.Component {
    state = null;

    render() {
        const { globalClasses } = this.props;

        return (
            <div>
                <div className={globalClasses.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Indicadores</Typography>
                Em desenvolvimento
            </div>
        );
    }
}

module.exports = IndicatorsView;