(function ()
{
    'use strict';

    angular
        .module('app.calendar')
        .factory('calendarService', calendarService);

    /** @ngInject */
    function calendarService($filter)
    {
        var service = {
            getDates: getDates,
            getMonths: getMonths,
            isFutureDate: isFutureDate,
            makeFormatedDate: makeFormatedDate,
            getEvents: getEvents,
            realizationStructure: realizationStructure,
            workloadStructure: workloadStructure,
            lengthBar: lengthBar
        };

        return service;

        /**
         * Prepare dates for calendar
         * It get start and end dates from backend and prepare array with dates for view
         *
         * @param apiData {object} data from api
         * @param toString {boolean} describe if array item must be string or object
         * @returns {Array}
         */
        function getDates(apiData, onlyDates) {
            var startDay = apiData.date_start.split('-');
            var firstDate = new Date(apiData.date_start)
            var secondDate = new Date(apiData.date_end)
            var days = datesCount(firstDate, secondDate);
            var dates = [];

            if (typeof onlyDates != 'undefined') {
                var day = moment(startDay, 'YYYY-MM-DD');
                for (var i = 0; i < days; i++) {
                    dates.push(day.format('YYYY-MM-DD'));
                    day = day.clone().add(1, 'd');
                }
            } else {
                for (var i = 0; i < days; i++) {
                    // create start date from first day
                    // - 1 must exists to set correct month
                    var newDate = new Date(startDay[0], startDay[1] - 1, startDay[2]);
                    newDate.setDate(newDate.getDate() + i);
                    dates.push(newDate);
                }
            }
            return dates;
        }

        function getMonths(days) {
            var months = [];
            for (var i = 0; i < days.length; i++) {
                var day = days[i];
                var month = day.getMonth();
                if(!months[month]) {
                    months[month] = {
                        label: getMonthName(month),
                        days_count: 0
                    }
                }
                if(!months[month].label) months[month].label = getMonthName(month);
                months[month].days_count++;
            }
            return months;
        }

        function getMonthName(month_number) {
            return moment(month_number + 1, 'M').format('MMMM');
        }

        function isFutureDate(date) {
            var currentDate = makeFormatedDate();
            var pickedDate =  $filter('date')(date, 'yyyy-MM-dd');

            return pickedDate >= currentDate;
        }

        function makeFormatedDate(date)
        {
            var dateObject =  date ? new Date(date) : new Date();

            return dateObject.toISOString().slice(0, 10);
        }

        function datesCount(startDate, endDate) {
            var count = 0;
            var curDate = startDate;
            while (curDate <= endDate) {
                count++;
                curDate.setDate(curDate.getDate() + 1);
            }

            return count;
        }


        /**
         * Get current user availabilities from selected day
         *
         * @param  user
         * @param day
         * @return {array|*}
         */
        function getEvents(dataArray, user, day) {
            var user = dataArray.filter(function (el) {
                return el.id === user.id;
            });

            var availabilities = user[0].availabilities.data.filter(function (el) {
                return el.day === day;
            });

            return availabilities;
        }

        /**
         * get structure for view realizations tickets
         * @param response
         */
        function realizationStructure(response) {
            var structure = response.data;
            var dates = getDates(response, true);

            angular.forEach(structure, function (user) {
                var realizations = [];
                angular.forEach(user.ticket_realization.data, function (realization) {

                    //search start date
                    var start_day = 0;
                    var before_days = moment(realization.start_at, 'YYYY-MM-DD').diff(moment(dates[0], 'YYYY-MM-DD'), 'days');
                    if (before_days > 0) {
                        start_day = before_days;
                    }

                    var days = lengthBar(realization, response.data.date_start, response.data.date_end);

                    //select empty row
                    var row = -1;
                    for (var i in realizations) {
                        if (realizations[i][start_day] === null) {
                            row = i;
                            break;
                        }
                    }
                    if (row < 0) {
                        realizations.push(new Array(dates.length).fill(null));
                        row = realizations.length - 1;
                    }

                    //set current realization
                    realizations[row][start_day] = realization;
                    for(var i = start_day + 1; i < start_day + days; ++i) {
                        realizations[row][i] = true;
                    }

                });
                if (realizations.length) {
                    user.realizations = realizations;
                } else {
                    user.realizations = realizations.push(new Array(dates.length).fill(null));
                }
            });
            return structure
        }

        function workloadStructure(response) {
            var structure = response.data;
            var dates = getDates(response, true);

            angular.forEach(structure, function(user) {
                user.projects = [];

                angular.forEach(user.workloads, function(workload) {
                    var workloads = [];

                    var start_day = 0;
                    var before_days = moment(workload.start_at, 'YYYY-MM-DD').diff(moment(dates[0], 'YYYY-MM-DD'), 'days');

                    if (before_days > 0) {
                        start_day = before_days;
                    }

                    var days = lengthBar(workload, response.date_start, response.date_end);

                    // select empty row
                    var row = -1;
                    for (var i in workloads) {
                        if (workloads[start_day] === null) {
                            row = i;
                            break;
                        }
                    }

                    if (row < 0) {
                        workloads = new Array(dates.length).fill(null);
                        row = workloads.length - 1;
                    }

                    //set current realization
                    for(var j = start_day; j < start_day + days; ++j) {
                        workloads[j] = true;
                    }
                    if (start_day <= 0) {
                        for(var k = 0; j < workloads.length; ++j) {
                            if(workloads[k] === true) {
                                workloads[k] = false;
                                break;
                            }
                        }
                    } else {
                        workloads[start_day] = false
                    }

                    if (workloads.length) {
                        workload.arr = workloads;
                    } else {
                        workload.arr = new Array(dates.length).fill(null);
                    }

                    if(!user.projects[workload.project.id]) {
                        user.projects[workload.project.id] = [];
                    }
                    user.projects[workload.project.id].push(workload);
                })
            });
            // console.log(structure);
            return structure
        }

        /**
         * get number days
         * @param {realization || workload}
         * @param {date_start}
         * @param {date_end}
         * @returns {*}
         */
        function lengthBar(object, date_start, date_end) {
            var days = moment(object.end_at, 'YYYY-MM-DD').diff(moment(object.start_at, 'YYYY-MM-DD'), 'days') + 1;

            var before_days = moment(date_start, 'YYYY-MM-DD').diff(moment(object.start_at, 'YYYY-MM-DD'), 'days');
            if (before_days > 0) {
                days -=before_days;
            }

            var after_days = moment(object.end_at, 'YYYY-MM-DD').diff(moment(date_end, 'YYYY-MM-DD'), 'days');
            if (after_days > 0) {
                days -=after_days;
            }

            return days;
        }
    }

})();
