
import Typography from '@material-ui/core/Typography';
import React from 'react';
import ExpansionPanel from '@material-ui/core/ExpansionPanel';
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import Grid from '@material-ui/core/Grid';

class FundListView extends React.Component {
    state = {
        fundList: []
    };

    async componentDidMount() {
        const fundListObject = await fetch('http://localhost:82/inf_cadastral_fi_fullname', {
            method: 'GET',
            headers: {
                'Range-Unit': 'items',
                'Range': '0-19'
            }
        });

        const fundList = await fundListObject.json();

        this.setState({
            fundList: fundList
        });
    }

    render() {
        const { classes } = this.props;

        return (
            <div>
                <div className={classes.appBarSpacer} />
                <Typography variant="display1" gutterBottom>Lista de Fundos</Typography>
                <Grid container spacing={24}>
                    <Grid item xs={8}>
                        {this.state.fundList.map((fund, index) => (
                            <ExpansionPanel key={index}>
                                <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
                                    {fund.icf_denom_social}
                                </ExpansionPanelSummary>
                            </ExpansionPanel>
                        ))}
                    </Grid>
                    <Grid item xs={4}>

                    </Grid>
                </Grid>
            </div>
        );
    }
}

module.exports = FundListView;