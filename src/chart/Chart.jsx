import React from 'react'

import fapi from '../urls'

import ReconnectingWebSocket from 'reconnecting-websocket'

import { createChart, CrosshairMode, LineStyle } from 'lightweight-charts'
import { useRef, useEffect } from 'react'

import convertToInternationalCurrencySystem from '../../../utils/convertToInternationalCurrencySystem'
import isEmpty from '../../../utils/isEmpty'

const Chart = React.forwardRef((
  {
    timeFrame,
    scaleHandler,
    entryPrice,
    exitPrice,
    isLong,
    // setCurrentMarketPrice
  },
  {
    chartApiRef,
    candleSeriesApiRef,
    chartContainerRef,
    socketRef,
    currentPriceRef,
    entryLineRef,
    exitLineRef,
    entryCommissionBreakevenLineRef,
    exitCommissionBreakevenLineRef,
    lockBreakevenCommissionBreakevenLineRef,
    lockBreakevenLineRef,
    entryPositionCommissionBreakevenLineRef,
    entryPositionLineRef,
    averageLineRef,
    averageCommissionBreakevenLineRef,
    posRef
  }
) => {
  
  useEffect(
    () => {
      // wait for 2 second before adjusting the slider range on first component load
      setTimeout(() => {
        // slider range setter function
        scaleHandler()
      }, 2000);
    },
    [ timeFrame, scaleHandler ]

  )

  console.log('hello')
  // this is the main useeffect function that renders or mounts the chart displayed in the screen
  useEffect(
    () => {      
      //create the chart using the lightweight-charts library
      const chartApi = createChart(
        chartContainerRef.current,
        //these are the properties according to which the new chart will be created
        {
          width: 0,
          height: 450,
          // color: 'white',
          crosshair: {
            mode: CrosshairMode.Normal
          },
          layout: {
            background: '#151515',
            textColor: 'white',
            fontFamily: 'Azeret Mono',
          },
          grid: {
            vertLines: {
              color: 'rgba(80, 80, 80, 0.5)',
            },
            horzLines: {
              color: 'rgba(80, 80, 80, 0.5)',
            },
          },
          rightPriceScale: {
            borderColor: 'rgba(80, 80, 80, 0.5)',
          },
          //timescale properties that dictate that the seconds while hovering are visible
          timeScale: {
            borderColor: 'rgba(80, 80, 80, 0.5)',
            timeVisible: true,
            secondsVisible: false,
            fixRightEdge: true,
            rightBarStaysOnScroll: true,
            visible: true
          },
          handleScroll: false,
          handleScale: false,
        }
      );
      //again maybe useless will review later
      
      //creating candleseries containing the candlestick data with following properties
      const candleSeriesApi = chartApi.addCandlestickSeries({
        upColor: '#00897B',
        downColor: '#FF5252',
        borderDownColor: '#FF5252',
        borderUpColor: '#00897B',
        wickDownColor: '#FF5252',
        wickUpColor: '#00897B',
      });

      //creating volume series containing the volume bars with the following properties
      const volumeSeriesApi = chartApi.addHistogramSeries({
        color: '#26a69a',
        priceFormat: {
          type: 'volume',
        },
        priceLineVisible: false,
        priceScaleId: '', // set as an overlay by setting a blank priceScaleId
      });

      //adjusting the margin to ensure that the volume bars and candlesticks don't overlap each other
      candleSeriesApi.priceScale().applyOptions({
        scaleMargins: {
          top: 0.15,
          bottom: 0.23
        }
      })

      //adjusting the margin to ensure that the candlesticks and volume bars don't overlap each other
      volumeSeriesApi.priceScale().applyOptions({
        scaleMargins: {
          top: 0.8, // highest point of the series will be 90% away from the top
          bottom: 0,
        },
        // ticksVisible: false,
        // secondsVisible: false,
      })
      
      // listen for any resize events and apply the width resizer function to the chart

      //detect a resize event and resize the width of the chart accordingly
      const handleResize = () => {
        chartApi.applyOptions({ width: chartContainerRef.current.clientWidth });
      };
      
      window.addEventListener('resize', handleResize);
      
      // listen to realtime data from the binance market data websocket to update the chart in realtime
      const marketDataSocket = new ReconnectingWebSocket(`${fapi.wss}ws/btcusdt_perpetual@continuousKline_${timeFrame}`);

      // listen to when the connection to the websocket has been established
      marketDataSocket.onopen = () => {
        console.log("Connection with binance market data stream established...");
      };

      marketDataSocket.addEventListener('open', () => {
        //fetching historical data to display in the chart
        fetch(`${fapi.rest}fapi/v1/continuousKlines?pair=BTCUSDT&contractType=PERPETUAL&interval=${timeFrame}&limit=1500`)
        .then(res => res.json())
        .then(data => {
          //this is the candlestick array
          const candleFetchedData = data.map(d => ({
            time: ( d[0] + 19800000 ) / 1000,
            open: parseFloat(d[1]),
            high: parseFloat(d[2]),
            low: parseFloat(d[3]),
            close: parseFloat(d[4])
          }))
          //this is the volume bar array
          const volumeFetchedData = data.map(d => ({
            time: ( d[0] + 19800000 ) / 1000,
            value: parseInt(d[5]),
            color: parseFloat(d[4]) >= parseFloat(d[1]) ? '#00897B' : '#FF5252'
          }))
          //setting the captured data in the chart series
          candleSeriesApi.setData(candleFetchedData)
          volumeSeriesApi.setData(volumeFetchedData)
        })
        // listen to when the connection is established and incoming message is received
        marketDataSocket.onmessage = function handleIncomingData(event) {
          // parsing the JSON string containing candlestick data to throw into the update function of the specific series of the chart
          const message = JSON.parse(event.data);
          const { t, o, h, l, c, v } = message.k;
          const color = parseFloat(c) >= parseFloat(o) ? '#00897B' : '#FF5252'
          const change = parseFloat(c) >= parseFloat(o) ? `+${(parseFloat(c) - parseFloat(o)).toFixed(1)}` : `-${(parseFloat(o) - parseFloat(c)).toFixed(1)}`
          const percentChange = (((parseFloat(c) - parseFloat(o)) / parseFloat(o)) * 100) >= 0 ? `+${(((parseFloat(c) - parseFloat(o)) / parseFloat(o)) * 100).toFixed(2)}` : `${(((parseFloat(c) - parseFloat(o)) / parseFloat(o)) * 100).toFixed(2)}`
  
          // prerequisites to update legend
          const ohlcLegend = `O<span style="color: ${color}">${parseFloat(o).toFixed(1)}</span> H<span style="color: ${color}">${parseFloat(h).toFixed(1)}</span> L<span style="color: ${color}">${parseFloat(l).toFixed(1)}</span> C<span style="color: ${color}">${parseFloat(c).toFixed(1)}</span> <span style="color: ${color}">${change}</span> <span style="color: ${color}">(${percentChange}%)</span>`
          const volumeLegend = `<span style="color: ${color}">${convertToInternationalCurrencySystem(v)}</span>`
  
          // updating the legend that displays live candle data
          if (updateRow !== null) {
            updateRow.innerHTML = `${symbolName}&nbsp;&nbsp;${ohlcLegend}<br>Vol · BTC&nbsp;&nbsp;${volumeLegend}`
          }
  
          // this is to update the candleseries with the parsed data
          candleSeriesApi.update({
            time: ( t + 19800000 ) / 1000,
            open: parseFloat(o),
            high: parseFloat(h),
            low: parseFloat(l),
            close: parseFloat(c),
          });
  
          // this is to update the volumeseries with the parsed data
          volumeSeriesApi.update({
            time: ( t + 19800000 ) / 1000,
            value: parseInt(v),
            color: color
          });

          const timeFrameIdentifier = {
            '1m': 60,
            '3m': 60 * 3,
            '5m': 300,
            '15m': 60 * 15,
            '1h': 60 * 60,
            '4h': 60 * 60 * 4,
            '1d': 60 * 60 * 24
          }
          

          // fetch the remaining seconds to the close of the current candle
          const remainingSeconds = (timeFrameIdentifier[timeFrame] - ((parseInt(new Date().getTime() / 1000)) % timeFrameIdentifier[timeFrame]))

          // format the remaining seconds in the required format to display in the countdown timer div
          const dateObj = new Date(remainingSeconds * 1000)
          const minutes = dateObj.getUTCMinutes();
          const seconds = dateObj.getSeconds()

          const timeString = minutes.toString().padStart(2, '0') + ':' + seconds.toString().padStart(2, '0');
          // setTimerObject(prev => {
          //   return {
          //   ...timerObject,
          //   color: parseFloat(c) >= parseFloat(o) ? '#00897B' : '#FF5252',
          //   time: timeString,
          //   position: candleSeries.priceToCoordinate(parseFloat(c))
          //   }
          // })

          countDown.innerHTML = timeString

          timer.style.top = `${candleSeriesApi.priceToCoordinate(parseFloat(c)) + 15}px`
          timer.style.backgroundColor = parseFloat(c) >= parseFloat(o) ? '#00897B' : '#FF5252'

          currentPriceRef.current = parseFloat(c)
          // setCurrentMarketPrice(parseFloat(c))
        }
      })

      // listen to when the connection to the websocket has been terminated
      marketDataSocket.onclose = () => {
        console.log("Connection with binance market data stream terminated. Should restart automatically...");
        // setTimeout(subscribeToBinance, 500);
      };

      // listen to any errors that might occur and restart the connection
      marketDataSocket.onerror = () => {
        console.log("An error has occured in the connection to the binance market data stream. Should restart automatically...")
      }

      // display the symbol name when no data is received
      const symbolName = `Bitcoin / TetherUS PERPETUAL FUTURES · ${timeFrame} · BINANCE`

      // create the div required to show the countdown timer
      const timer = document.createElement('div')
      timer.style = `
        all: unset;
        position: absolute;
        left: ${chartContainerRef.current.clientWidth - 85}px;
        top: 45px;
        z-index: 4;
        color: white;
        background-color: #00897b;
        display: inline;
        font-size: 12px;
        width: 79px;
        display: flex;
        justify-content: center;
        align-items: center;
        border-bottom-right-radius: 3px;
        font-family: Azeret Mono
      `
      // timer.style = `
      //   all: unset;
      //   position: relative;
      //   right: 41px;
      //   top: -45px;
      //   z-index: 4;
      //   color: white;
      //   background-color: #00897b;
      //   display: inline;
      //   font-size: 12px;
      //   width: 79px;
      //   display: flex;
      //   justify-content: center;
      //   align-items: center;
      //   border-bottom-right-radius: 3px;
      //   font-family: Azeret Mono
      // `

      const countDown = document.createElement('div')
      countDown.innerHTML = 'Hello'

      timer.appendChild(countDown)

      chartContainerRef.current.appendChild(timer)

      // create the required div where the legend will be placed
      const legend = document.createElement('div');

      // positioning the legend
      legend.style = `position: absolute; color: #a6a6a6; font-weight: bold; left: 12px; top: 16px; z-index: 1; font-size: 15px; font-family: 'JetBrains Mono'; line-height: 25px;`
      chartContainerRef.current.appendChild(legend);

      // two divs to switch on and off alternatively for alternate user action (hovering over candles and when not hovering)
      const hoverRow = document.createElement('div');
      const updateRow = document.createElement('div');
      
      // default configuration to be that user is not hovering over select candles
      updateRow.innerHTML = symbolName;
      hoverRow.style.display = 'none';
      legend.appendChild(hoverRow)
      legend.appendChild(updateRow)

      // function that will feed the relevant data to the legend div depending on the user action
      const handleCrosshairMove = (param) => {
        // when the user is hovering over a specific candle inside the chart
        if (param.time) {
          // switch to the div that will display past data
          updateRow.style.display = 'none'
          hoverRow.style.display = 'block'

          // receive data from candlestick
          const { open, high, low, close } = param.seriesData.get(candleSeriesApi);
          const { value, color } = param.seriesData.get(volumeSeriesApi);

          const change = close >= open ? `+${(close - open).toFixed(1)}` : `-${(open - close).toFixed(1)}`;

          const percentChange = (((close - open) / open) * 100) >= 0 ? `+${(((close - open) / open) * 100).toFixed(2)}` : `${(((close - open) / open) * 100).toFixed(2)}`;

          const ohlcLegend = `O<span style="color: ${color}">${open.toFixed(1)}</span> H<span style="color: ${color}">${high.toFixed(1)}</span> L<span style="color: ${color}">${low.toFixed(1)}</span> C<span style="color: ${color}">${close.toFixed(1)}</span> <span style="color: ${color}">${change}</span> <span style="color: ${color}">(${percentChange}%)</span>`;
          
          const volumeLegend = `<span style="color: ${color}">${convertToInternationalCurrencySystem(Number(value))}</span>`;

          // finally update the chart
          hoverRow.innerHTML = `${symbolName}&nbsp;&nbsp;${ohlcLegend}<br>Vol · BTC&nbsp;&nbsp;${volumeLegend}`
        } else {
          // if the user is not viewing a specific candle, switch to the div displaying live data updated in the incomingData function of the websocket
          hoverRow.style.display = 'none'
          updateRow.style.display = 'block'
        }
      }

      // wait for the data to load completely
      setTimeout(() => {
        chartApi.subscribeCrosshairMove(handleCrosshairMove)
        chartApi.applyOptions({handleScroll: true, handleScale: true})
      }, 2000);

      // assign the api object to a reference value that can be used from the outside
      chartApiRef.current = chartApi
      candleSeriesApiRef.current = candleSeriesApi

      setTimeout(() => {
        chartApi.timeScale().subscribeVisibleTimeRangeChange(scaleHandler)
      }, 2000);


      // creating a price line in the chart that will represent the entry price line
      entryLineRef.current = candleSeriesApi.createPriceLine(
        JSON.parse(localStorage.getItem('entryLineOptions'))
        ??
        {
          id: '1.2',
          price: entryPrice,
          color: "#ffffff",
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false,
        }
      )

      //creating a price line in the chart that will represent the entry along with the 0.02% commission breakeven
      entryCommissionBreakevenLineRef.current = candleSeriesApi.createPriceLine(
        JSON.parse(localStorage.getItem('entryCommissionBreakevenLineOptions'))
        ??
        {
          id: '1.2',
          price: entryPrice + (entryPrice * 0.0002),
          color: isLong ? '#00897B' : '#ff5252',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false,
        }
      )

      //creating a price line in the chart that will represent the exit price
      exitLineRef.current = candleSeriesApi.createPriceLine(
        JSON.parse(localStorage.getItem('exitLineOptions'))
        ??
        {
          id:'10',
          price: exitPrice,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the exit along with the 0.02% commission breakeven
      exitCommissionBreakevenLineRef.current = candleSeriesApi.createPriceLine(
        JSON.parse(localStorage.getItem('exitCommissionBreakevenLineOptions'))
        ??
        {
          id:'19',
          price: exitPrice - (exitPrice * 0.0002),
          color: '#ff5252',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the placed entry position line
      entryPositionLineRef.current = candleSeriesApi.createPriceLine(
        !isEmpty(posRef.current)
        ?
        JSON.parse(localStorage.getItem('entryPositionLineOptions'))
        ??
        {
          id: '478',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
        :
        {
          id: '478',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the placed entry position line
      entryPositionCommissionBreakevenLineRef.current = candleSeriesApi.createPriceLine(
        !isEmpty(posRef.current)
        ?
        JSON.parse(localStorage.getItem('entryPositionCommissionBreakevenLineOptions'))
        ??
        {
          id: '479',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
        :
        {
          id: '479',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the placed entry position line
      averageLineRef.current = candleSeriesApi.createPriceLine(
        {
          id: '475',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the placed entry position line
      averageCommissionBreakevenLineRef.current = candleSeriesApi.createPriceLine(
        {
          id: '459',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the lock breakeven difference from the entry line
      lockBreakevenLineRef.current = candleSeriesApi.createPriceLine(
        JSON.parse(localStorage.getItem('lockBreakevenLineRefOptions'))
        ??
        {
          id: '65',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      //creating a price line in the chart that will represent the lock breakeven commission breakeven line with 0.02% commission
      lockBreakevenCommissionBreakevenLineRef.current = candleSeriesApi.createPriceLine(
        JSON.parse(localStorage.getItem('lockBreakevenCommissionBreakevenLineRefOptions'))
        ??
        {
          id: '678',
          price: 0,
          color: 'white',
          lineWidth: 1,
          lineStyle: LineStyle.LargeDashed,
          axisLabelVisible: false,
          lineVisible: false
        }
      )

      socketRef.current = marketDataSocket

      // return function since the event listeners added require cleanup
      return () => {
        legend.remove()
        window.removeEventListener('resize', handleResize)
        timer.remove()
        chartApi.remove()
        marketDataSocket.close()
        chartApiRef.current = null
        candleSeriesApiRef.current = null
      }
    }
    ,
    [timeFrame]
  )
  
  return (
    <div ref={chartContainerRef}></div>
  )
})

export default Chart
