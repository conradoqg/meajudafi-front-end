const Plot = createPlotlyComponent(Plotly);

class AppView extends React.Component {
    constructor() {
        super();
        this.state = { x: [], y_performance: [], y_risk: [], y_consistency_1y: [], name: '', fundsOverviewChartConfig: { data: [], layout: [], frames: [] } };
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

        const investment_return_monthly_complete = await fetch('http://localhost:82/xpi_funds_with_investment_return_monthly_complete_and_expanded_');
        const investment_return_monthly_completeObject = await investment_return_monthly_complete.json();

        const fundsOverviewChartConfig = this.createFundsOverviewChartConfig(investment_return_monthly_completeObject);

        this.setState({ x, y_performance, y_risk, y_consistency_1y, name, fundsOverviewChartConfig });
    }

    createFundsOverviewChartConfig(data) {
        // year = irm_dt_comptc
        // Year = irm_dt_comptc
        // continent = icf_classe
        // country = xf_name
        // lifeExp = irm_accumulated_risk
        // gdpPercap = irm_accumulated_investment_return



        // Create a lookup table to sort and regroup the columns of data,
        // first by irm_dt_comptc, then by icf_classe:
        var lookup = {};
        function getData(irm_dt_comptc, icf_classe) {
            var byIRM_dt_comptc, trace;
            if (!(byIRM_dt_comptc = lookup[irm_dt_comptc])) {
                byIRM_dt_comptc = lookup[irm_dt_comptc] = {};
            }
            // If a container for this irm_dt_comptc + icf_classe doesn't exist yet,
            // then create one:
            if (!(trace = byIRM_dt_comptc[icf_classe])) {
                trace = byIRM_dt_comptc[icf_classe] = {
                    x: [],
                    y: [],
                    id: [],
                    text: [],
                    //marker: { size: [] }
                };
            }
            return trace;
        }

        // Go through each row, get the right trace, and append the data:
        for (var i = 0; i < data.length; i++) {
            var datum = data[i];
            var trace = getData(datum.irm_dt_comptc, datum.icf_classe);
            trace.text.push(datum.xf_name);
            trace.id.push(datum.xf_name);
            trace.x.push(datum.irm_accumulated_risk);
            trace.y.push(datum.irm_accumulated_investment_return);
            //trace.marker.size.push(10000);
            //trace.marker.size.push(datum.pop);
        }

        // Get the group names:
        var irm_dt_comptcs = Object.keys(lookup);
        // In this case, every irm_dt_comptc includes every icf_classe, so we
        // can just infer the icf_classes from the *first* irm_dt_comptc:
        var firstIRM_dt_comptc = lookup[irm_dt_comptcs[0]];
        var icf_classes = Object.keys(firstIRM_dt_comptc);

        // Create the main traces, one for each icf_classe:
        var traces = [];
        for (i = 0; i < icf_classes.length; i++) {
            let data = firstIRM_dt_comptc[icf_classes[i]];
            // One small note. We're creating a single trace here, to which
            // the frames will pass data for the different irm_dt_comptcs. It's
            // subtle, but to avoid data reference problems, we'll slice
            // the arrays to ensure we never write any new data into our
            // lookup table:
            traces.push({
                name: icf_classes[i],
                x: data.x.slice(),
                y: data.y.slice(),
                id: data.id.slice(),
                text: data.text.slice(),
                mode: 'markers',
                // marker: {
                //     size: data.marker.size.slice(),
                //     sizemode: 'area',
                //     sizeref: 200000
                // }
            });
        }

        // Create a frame for each irm_dt_comptc. Frames are effectively just
        // traces, except they don't need to contain the *full* trace
        // definition (for example, appearance). The frames just need
        // the parts the traces that change (here, the data).
        var frames = [];
        for (i = 0; i < irm_dt_comptcs.length; i++) {
            frames.push({
                name: irm_dt_comptcs[i],
                data: icf_classes.map(function (icf_classe) {
                    return getData(irm_dt_comptcs[i], icf_classe);
                })
            });
        }

        // Now create slider steps, one for each frame. The slider
        // executes a plotly.js API command (here, Plotly.animate).
        // In this example, we'll animate to one of the named frames
        // created in the above loop.
        var sliderSteps = [];
        for (i = 0; i < irm_dt_comptcs.length; i++) {
            sliderSteps.push({
                method: 'animate',
                label: irm_dt_comptcs[i],
                args: [[irm_dt_comptcs[i]], {
                    mode: 'immediate',
                    transition: { duration: 300 },
                    layout: { xaxis: { autorange: true }, yaxis: { autorange: true } },
                    frame: { duration: 300, redraw: true },
                }]
            });
        }

        var layout = {
            xaxis: {
                title: 'Risco',
                tickformat: '.0%',
                hoverformat: '.2%',
                autorange: true
                //range: [30, 85]
            },
            yaxis: {
                title: 'Performance',
                tickformat: '.0%',
                hoverformat: '.2%',
                autorange: true
                //type: 'log'
            },
            hovermode: 'closest',
            // We'll use updatemenus (whose functionality includes menus as
            // well as buttons) to create a play button and a pause button.
            // The play button works by passing `null`, which indicates that
            // Plotly should animate all frames. The pause button works by
            // passing `[null]`, which indicates we'd like to interrupt any
            // currently running animations with a new list of frames. Here
            // The new list of frames is empty, so it halts the animation.
            updatemenus: [{
                x: 0,
                y: 0,
                yanchor: 'top',
                xanchor: 'left',
                showactive: false,
                direction: 'left',
                type: 'buttons',
                pad: { t: 87, r: 10 },
                buttons: [{
                    method: 'animate',
                    args: [null, {
                        mode: 'immediate',
                        fromcurrent: true,
                        transition: { duration: 300 },
                        //layout: { xaxis: { autorange: true }, yaxis: { autorange: true } },
                        frame: { duration: 500, redraw: false }
                    }],
                    label: 'Play'
                }, {
                    method: 'animate',
                    args: [[null], {
                        mode: 'immediate',
                        transition: { duration: 0 },
                        //layout: { xaxis: { autorange: true }, yaxis: { autorange: true } },
                        frame: { duration: 0, redraw: false }
                    }],
                    label: 'Pause'
                }]
            }],
            // Finally, add the slider and use `pad` to position it
            // nicely next to the buttons.
            sliders: [{
                pad: { l: 130, t: 55 },
                currentvalue: {
                    visible: true,
                    prefix: 'Data:',
                    xanchor: 'right',
                    font: { size: 20, color: '#666' }
                },
                steps: sliderSteps
            }]
        };

        // Create the plot:
        return {
            data: traces,
            layout: layout,
            frames: frames,
        };
    }

    render() {
        return (
            <div>
                <div>
                    <Plot
                        data={this.state.fundsOverviewChartConfig.data}
                        layout={this.state.fundsOverviewChartConfig.layout}
                        frames={this.state.fundsOverviewChartConfig.frames}
                        useResizeHandler={true}
                        style={{ width: '100%', height: '800px' }}
                    />
                </div>
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