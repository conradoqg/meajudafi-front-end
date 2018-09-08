const Plot = createPlotlyComponent(Plotly);

class AppView extends React.Component {
    constructor() {
        super();
        this.state = { x: [], y_performance: [], y_risk: [], y_consistency_1y: [], name: '' };
    }

    async componentDidMount() {
        const cnpj = '17453850000148';
        const dailyReturn = await fetch(`http://localhost:82/investment_return_daily?cnpj_fundo=eq.${cnpj}&order=dt_comptc`);
        const infCadastral = await fetch(`http://localhost:82/inf_cadastral_fi?cnpj_fundo=eq.${cnpj}`);
        const dailyReturnObject = await dailyReturn.json();
        const infCadastralObject = await infCadastral.json();
        const x = dailyReturnObject.map(item => item.dt_comptc);
        const y_performance = dailyReturnObject.map(item => item.accumulated_investment_return);
        const y_risk = dailyReturnObject.map(item => item.accumulated_risk);
        const y_consistency_1y = dailyReturnObject.map(item => item.consistency_1y);
        const name = infCadastralObject[0].denom_social;

        this.setState({ x, y_performance, y_risk, y_consistency_1y, name });
    }

    render() {
        return (
            <div>
                <div>
                    <Plot
                        data={[
                            {
                                x: this.state.x,
                                y: this.state.y_performance,
                                type: 'scatter',
                                name: 'Performance'
                            },
                            {
                                x: this.state.x,
                                y: this.state.y_risk,
                                type: 'scatter',
                                name: 'Risk',
                                yaxis: 'y2'
                            },
                            {
                                x: this.state.x,
                                y: this.state.y_consistency_1y,
                                type: 'scatter',
                                name: 'Consistency 1Y',
                                yaxis: 'y3'
                            }
                        ]}
                        layout={{
                            title: this.state.name,
                            autosize: true,
                            showlegend: true,
                            xaxis: {
                                title: 'Data',
                                showspikes: true,
                                spikemode: 'across',
                                domain: [0, 0.96]
                            },
                            yaxis: {
                                title: 'Performance',
                                tickformat: '.0%',
                                hoverformat: '.2%'
                            },
                            yaxis2: {
                                title: 'Risk',
                                tickformat: '.0%',
                                hoverformat: '.2%',
                                anchor: 'x',
                                overlaying: 'y',
                                side: 'right'
                            },
                            yaxis3: {
                                title: 'Consistency 1Y',
                                tickformat: '.0%',
                                hoverformat: '.2%',
                                anchor: 'free',
                                overlaying: 'y',
                                side: 'right',
                                position: 1
                            }
                        }}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '100%' }}
                    />
                </div>                
            </div>
        );
    }
}

module.exports = AppView;