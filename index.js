// currentTimeStamp = datetime.datetime.now()
// fileName = '/var/tmp/' + stockCode + '_' + currentTimeStamp.strftime("%Y%m%d-%H%M%S") + '.txt'
// print('fileName is ' + fileName)
// f = open(fileName, "w")
// f.write(format(chartobjarr))
// f.close()

import axios from 'axios'
import fs from 'fs'
import dateFormat from "dateformat"
import mysql from 'mysql'

let urlPrefix = 'https://query1.finance.yahoo.com/v8/finance/chart/'

async function getPriceFromProvider(endpoint, stockCode) {
    let url = urlPrefix + stockCode + '?region=US&lang=en-US&includePrePost=false&interval=1m&useYfid=true&range=1d&corsDomain=finance.yahoo.com&.tsrc=finance'
    let chartobjarr = []
    let valuesArray = []
    let config = {
        headers: {
            "accept": "*/*",
            "content-type": "application/json",
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36"
        }
    }
    console.log('Url is ' + url)
    let response = await axios.get( url, config)
    let responseJson = response.data
    let timestampArray = responseJson['chart']?.['result']?.[0]?.['timestamp']
    let datapointsArray = responseJson['chart']?.['result']?.[0]?.['indicators']?.['quote']?.[0]
    let closeArray = datapointsArray['close']
    let lowArray = datapointsArray['low']
    let highArray = datapointsArray['high']
    let openArray = datapointsArray['open']
    for (let timestamp in timestampArray) {
        let values = []
        values.push(stockCode)
        values.push(stockCode)
        values.push(timestampArray[timestamp])
        values.push(closeArray[timestamp])
        let mychartData = {
            "timestamp": timestampArray[timestamp],
            "open": openArray[timestamp],
            "close": closeArray[timestamp],
            "low": lowArray[timestamp],
            "high": highArray[timestamp]
        }
        chartobjarr.push(mychartData)
        valuesArray.push(values)
    }
    let insertQuery = "insert ignore into us_equity_feed (name, symbol, timeStamp, price) values ?"
    let currentTimeStamp = new Date()
    let formattedDate = dateFormat(currentTimeStamp, "yyyy-mm-dd-hh:MM:ss");
    let fileName = '/var/tmp/' + stockCode + '_' + formattedDate + '.txt'
    executeInsertQuery(insertQuery, valuesArray)
    console.log('fileName is ' + fileName)
    try {
        fs.writeFileSync(fileName, JSON.stringify(chartobjarr))
    } catch (err) {
        console.error(err);
    }
}

console.log("String args are" + JSON.stringify(process.argv))

async function processFeed() {
    if(process.argv.length < 3) {
        console.log("Please enter the stock codes as input !!")
        return
    }
    let stockCodes = process.argv[2].split(",")
    for(let stockCode in stockCodes) {
        await getPriceFromProvider(urlPrefix, stockCodes[stockCode])
    }
}

let con = mysql.createConnection({
    host: "nse.cluster-clsixnxlvxet.ap-south-1.rds.amazonaws.com",
    user: "stockatlas",
    password: "$t0ckAtlas",
    database: "nse"
});

function executeInsertQuery(sql, values) {
    con.connect(function(err) {
        if (err) throw err;
        console.log("Connected!");
        if(sql != null) {
            con.query(sql, [values], function (err, result) {
                if (err) throw err;
                console.log("Number of records inserted: " + result.affectedRows);
            });
        }
        con.end()
    });
}

processFeed().then(result => {
        console.log('Processed successfully.')
    }
)