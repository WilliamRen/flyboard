/* * variables and functions shared */'use strict';Highcharts.setOptions({    global: {        useUTC: false    }});//default colors used in widgetsvar defaultColors = [    'rgb(47,179,202)',  // 1 blue    'rgb(241, 86, 79)', // 2 red    'rgb(246,150,84)',  // 3 orange    'rgb(252,238,33)',  // 4 yellow    'rgb(124,188,30)',  // 5 green    'rgb(147,112,219)', // 6 purple    'rgb(65,105,225)',  // 7 darkblue    'rgb(240,128,128)', // 8 pink    'rgb(153,204,255)', // 9 lightblue    'rgb(51,204,153)',  // 10 grassgreen    'rgb(245,222,179)', // 11 wheat    'rgb(204,204,255)'  // 12 lightpurple];//format Time: xx年xx月xx日 xx:xx:xfunction formatTime (_date) {    function formatTimeElement(timeElement){        return (timeElement.toString().length === 1)? '0'+ timeElement: timeElement;    }    var date = new Date(_date);    return '' + date.getFullYear() + '-' + formatTimeElement(( date.getMonth() + 1 )) + '-' + formatTimeElement(date.getDate()) + '    '+ formatTimeElement(date.getHours()) + ':' + formatTimeElement(date.getMinutes()) + ':' + formatTimeElement(date.getSeconds());}//format Date: xxxxxxfunction formatDate (_date) {    function formatTimeElement(timeElement){        return (timeElement.toString().length === 1)? '0'+ timeElement: timeElement;    }    var date = new Date(_date);    return '' + date.getFullYear() + formatTimeElement((date.getMonth() + 1)) + formatTimeElement(date.getDate());}function getTimeFromRecord(record) {    return new Date(record.year, record.month - 1, record.day, record.hour, record.minute, record.second).getTime();}/* sort multiRecords -- record order : newest record first *  opts: { *      formatTime: func, *      invalidValue: '--' *  } */function sortMultiRecords(multiRecords, opts) {    var sortedMultiRecords = [];    var stopFlag = false;    var pointers = [];    multiRecords.forEach(function (records, idx) {        pointers[idx] = 0;        sortedMultiRecords[idx] = [];    });    /*jshint loopfunc:true*/    while (!stopFlag) {        var max = null;        var newRecords = [];        multiRecords.forEach(function (records, idx) {            var pointer = pointers[idx];            if (pointer >= records.length) {                return;            }            var time = new Date(records[pointer].date_time).getTime();            if (max === null || max < time) {                max = time;                newRecords = [idx];            }            else if (max === time) {                newRecords.push(idx);            }        });        if (max === null) {            stopFlag = true;            continue;        }        multiRecords.forEach(function (records, idx) {            if (newRecords.indexOf(idx) === -1) {                sortedMultiRecords[idx].push({                    time: (opts && opts.formatTime) ? opts.formatTime(max) : max,                    date_time: new Date(max),                    value: (opts && opts.invalidValue)? opts.invalidValue : 0                });            }            else {                sortedMultiRecords[idx].push({                    time: (opts && opts.formatTime) ? opts.formatTime(max) : max,                    date_time: new Date(max),                    value: records[pointers[idx]].value                });                pointers[idx] = pointers[idx] + 1;            }        });    }    return sortedMultiRecords;}/* aggregation and filter */function aggregationAndFilter(response, dataInfo, opt) {    var resp = null;    if (opt === 'filter') {        resp = [response];        if (dataInfo.dimensions && dataInfo.dimensions.length > 0) {            //VALUE: filter according to dim.value            dataInfo.dimensions.forEach(function (dimensionObj) {                if (dimensionObj.value === 'ignore' || dimensionObj.value === 'sum') {                    return;                }                var data = resp[0];                for (var i = data.length - 1; i >= 0; i--) {                    if (data[i][dimensionObj.key] !== dimensionObj.value) {                        data.splice(i, 1);                    }                }            });            //IGNORE: split array when dim.value === 'ignore'            dataInfo.dimensions.forEach(function (dimensionObj) {                if (dimensionObj.value !== 'ignore') {                    return;                }                var splitedResp = [];                resp.forEach(function (respItem) {                    var splitedRespObj = respItem.reduce(function (memo, curr) {                        if (curr[dimensionObj.key] === null) {                            return memo;                        }                        if (!memo[curr[dimensionObj.key]]) {                            memo[curr[dimensionObj.key]] = [];                        }                        memo[curr[dimensionObj.key]].push(curr);                        return memo;                    }, {});                    angular.element.each(splitedRespObj, function (key) {                        splitedResp.push(splitedRespObj[key]);                    });                });                resp = splitedResp;            });            //SUM: aggregation when dim.value === 'sum'            resp.forEach(function (dataLine) {                var latestRecordIdx = -1;                for (var j = dataLine.length - 1; j >= 0; j--) {                    if (latestRecordIdx !== -1 && dataLine[latestRecordIdx].date_time === dataLine[j].date_time) {                        dataLine[j].value += dataLine[latestRecordIdx].value;                        dataLine.splice(latestRecordIdx, 1);                    }                    latestRecordIdx = j;                }            });        }    }    if (opt === 'aggregation') {        if (!dataInfo.dimensions || dataInfo.dimensions.length === 0) {            return response;        }        resp = response;        //VALUE: filter according to dim.value        dataInfo.dimensions.forEach(function (dimension) {            if (dimension.value !== 'sum') {                for (var i = resp.length - 1; i >= 0; i--) {                    if (resp[i][dimension.key] !== dimension.value) {                        resp.splice(i, 1);                    }                }            }        });        //SUM: aggregation when dim.value === 'sum'        var latestRecordIdx = -1;        for (var j = resp.length - 1; j >= 0; j--) {            if (latestRecordIdx !== -1 && resp[latestRecordIdx].date_time === resp[j].date_time) {                resp[j].value += resp[latestRecordIdx].value;                resp.splice(latestRecordIdx, 1);            }            latestRecordIdx = j;        }    }    return resp;}/** label: dataSource.name + dimensions' name */function additionalLabel(dataInfo, records) {    if (!dataInfo.dimensions || dataInfo.dimensions.length === 0 || !records || records.length === 0) {        return '';    }    var dimensionNameCombineStr = dataInfo.dimensions.map(function (dimension) {        if (dimension.value === 'sum') {            return null;        }        var value = dimension.value === 'ignore' ? records[0][dimension.key] : dimension.value;        return dimension.name + '(' + value + ')';    }).filter(function (item) {        return item !== null;    }).join('|');    return dimensionNameCombineStr.length > 0 ? ':' + dimensionNameCombineStr : dimensionNameCombineStr;}