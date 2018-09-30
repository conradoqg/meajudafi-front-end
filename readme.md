# CVM-FUND-EXPORATION-FRONT-END

## Planning

### Data cleaning and transforming

- More data
    - nr_cotst in investment_return
    - vl_patrim_liq in investment_return
    - moviment in investment_return (captc_dia+rest_dia)
    - for Performance, Risk, Consistency, Sharpe
        - YTD
        - MTD
        - 1M
        - 3M
        - 6M
- Cleaning
    - Strange data for CNPJ 20815620000196 after 2018-05-15 (should it filter by nr_cotst? or should it filter bug CNPJs?)
    - What's the deal with Infinity and NaN fields

### Pages

- Main
    - Overall indicators
        - Individual
        - History
    - Top Changes
        - Great Looser
        - Greate Winners
        - Largest
        - Top Performers
        - Top Performer/Risk Ratio
        - Top Consistency
- Fund List
    - Column Selector
    - Filter
        - Risk Range
        - Consistency Range
        - Sharpe Range
        - Performance Range
        - Class
        - Benchmark
        - Avaliable at (Corretora)
        - Quote Fund
        - Exclusive Fund
        - Qualified Investor
        - Long Tax
    - Searcher
    - Table
        - Headers
            - Name
            - Net Worth
            - Risk
                - YTD
                - MTD
                - 1M
                - 3M
                - 6M
                - 1Y
                - 2Y
                - 3Y
            - Consistency
                - YTD
                - MTD
                - 1M
                - 3M
                - 6M
                - 1Y
                - 2Y
                - 3Y
            - Sharpe
                - YTD
                - MTD
                - 1M
                - 3M
                - 6M
                - 1Y
                - 2Y
                - 3Y
            - Performance                
                - YTD
                - MTD
                - 1M
                - 3M
                - 6M
                - 1Y
                - 2Y
                - 3Y
        - Row Content
            - Closed
                - Column selection
            - Open
                - Relative Period Selector
                - Series
                    - Risk
                    - Consistency
                    - Sharpe
                    - Performance
    - Navigator
- Fund Comparison
    - Fund Selector
        - Individual
        - Reference List
            - Broker
            - Class
            - Benchmark
    - Field Selector
        - X
        - Y
        - Size
        - Transparency
    - Bubble Chart
        - X
        - Y
        - Size
        - Transparency


    
