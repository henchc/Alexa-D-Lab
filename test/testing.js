'use strict';

// load packages
var http = require("http");
var cheerio = require("cheerio");

// general assume today
var myRequest = todayDate();

httpGet(myRequest, (myResult) => {
        console.log("sent     : " + myRequest);
        console.log("received : " + myResult);
    }
);

// make GET req to dlab calendar
function httpGet(userRequest, callback) {

    // build URL with date
    var url = 'http://dlab.berkeley.edu/calendar-node-field-date/day/' + userRequest;

    // make request
    var req = http.request(url, res => {
        res.setEncoding('utf8');
        var returnData = "";

        // save response to returnData
        res.on('data', chunk => {
            returnData = returnData + chunk;
        });

        res.on('end', () => {

            // load page source to cheerio parser
            const $ = cheerio.load(returnData);

            // get all events in calendar
            var eventElements = $('div.view-item.view-item-calendar');
            var numEvents = eventElements.length;

            var alexaText = '';

            // cycle through events to get metadata
            eventElements.each(function searchEvents(i) {
                var eventType = $(this).find('div.views-field.views-field-type').text().trim();
                eventType = eventType.replace('Groups', 'Group');
                var eventTitle = $(this).find('div.views-field.views-field-title').text().trim();
                var eventTime = $(this).find('span.date-display-single').text().trim();

                alexaText += 'From ' + eventTime + ' there is the ' + eventType.toLowerCase() + ': ' + eventTitle + '.'
                alexaText += '\n'
            });

            if (userRequest == todayDate()) {
                alexaText = 'There are ' + numEvents + ' events today.\n' + alexaText.trim();
            } else{
                alexaText = 'There are ' + numEvents + ' events on ' + formatDate(userRequest) + '.\n' + alexaText.trim()   
            }

            console.log(alexaText);

        });
    });
    req.end();
}

// format for speaking
function formatDate(dateString) {
    var months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return months[parseInt(dateString.slice(5,7)) - 1] + ' ' + parseInt(dateString.slice(8));
}

// today
function todayDate() {
    var today = new Date();
    var dd = today.getDate();
    var mm = today.getMonth() + 1;
    var yyyy = today.getFullYear();

    if (dd < 10) {
        dd = '0' + dd;
    }

    if (mm < 10) {
        mm = '0' + mm;
    }

    return yyyy + '-' + mm + '-' + dd;
}

// difference in days of two date strings
function differenceInDays(dateString1, dateString2) {
    var rDateObj = new Date(dateString1);
    var tDateObj = new Date(dateString2);
    var difference = tDateObj.getTime() - rDateObj.getTime()
    var differenceDays = Math.ceil(difference / (1000 * 3600 * 24));
    return differenceDays;
}

// verify not in far future
// AMAZON.DATE if not specified automatically
// assumes future date
function verifyDate(dateRequested) {
    var differenceDays = differenceInDays(dateRequested, todayDate());
    var yearRequested = dateRequested.slice(0, 4);

    // if requested date is > 30 days in future
    // it is actually a request for the past
    if (differenceDays < -30) {
        return parseInt(yearRequested) - 1 + dateRequested.slice(4);
    } else {
        return dateRequested;
    }
}