(function ()
{
    'use strict';

    angular
        .module('app.calendar')
        .factory('summaryCalendarService', summaryCalendarService);

    /** @ngInject */
    function summaryCalendarService(api, transService) {
        var availabilities = [];

        return {
            getSummary: getSummary
        }

        /**
         * @param {string} from "YYYY-MM"
         * @param {string} to "YYYY-MM"
         * @param {function} callback returns Users[] with vacations[] param
         */
        function getSummary(from, to, callback) {
            from = from + '-01';
            to = to + '-' + moment(to, 'YYYY-MM').daysInMonth();
            availabilities = [];
            fetchAvailabilitiesFromRange(from, to, function() {
                var filtered = filterUniqueDates(availabilities);
                var groupedByMonth = groupByMonth(filtered);
                callback(groupedByMonth);
            });
        }

        /**
         * Fetches availabilities from API
         * from specified date range (by recurrency)
         *
         * @param {string} from "YYYY-MM"
         * @param {string} to "YYYY-MM"
         * @param {function} finished finished collecting data callback
         */
        function fetchAvailabilitiesFromRange(from, to, finished) {
            api.calendar.users.get({
                from: from,
                limit: moment(from, 'YYYY-MM').daysInMonth()
            }).$promise.then(function (res) {
                availabilities.push(res.data);
                if (moment(res.date_end).isSameOrAfter(to)) {
                    finished();
                } else {
                    fetchAvailabilitiesFromRange(res.date_end, to, finished);
                }
            });
        }


        /**
         * @param {Users[][]} availabilities
         * @return {Users[]} filtered Users array  with vacations[]
         * and working (summary of working hours) params
         */
        function filterUniqueDates(availabilities) {
            // map Users[][] into Users[] with vacations[] param
            var users = {};
            availabilities = [].concat.apply([], availabilities);
            angular.forEach(availabilities, function(user) {
                if (!users[user.id]) {
                    users[user.id] = user;
                    users[user.id].vacations = user.availabilities.data.filter(filterAvailabilityAsVacation);
                    users[user.id].working = user.availabilities.data.filter(fulterAvailabilityAsWorking);
                } else {
                    users[user.id].vacations = users[user.id].vacations.concat(user.availabilities.data.filter(filterAvailabilityAsVacation));
                    users[user.id].working = users[user.id].working.concat(user.availabilities.data.filter(fulterAvailabilityAsWorking));
                }
            });

            // make vacation days and working hours unique (we collect the same days from API sometimes)
            var filtered = [];
            angular.forEach(Object.values(users), function(user) {
                var vacations = {};
                var working = {};
                angular.forEach(user.vacations, function (vacation) {
                    // we can add only one vacation record per day,
                    // so day is the unique identifier
                    vacations[vacation.day] = vacation;
                });
                angular.forEach(user.working, function (w) {
                    // we can add multiple working hours to the single day,
                    // so we have to parse as unique also time_start and time_stop
                    working[w.day + '_' + w.time_start + '_' + w.time_stop] = w;
                });
                user.vacations = Object.values(vacations);
                user.working = Object.values(working);
                filtered.push(user);
            });

            return filtered;
        }

        function filterAvailabilityAsVacation(a) {
            return !a.available && a.description != 'holidays';
        }

        function fulterAvailabilityAsWorking(a) {
            return a.available;
        }

        /**
         * @param {Users[]} users
         * @return {Users[]} users with vacations grouped by month
         */
        function groupByMonth(users) {
            angular.forEach(users, function(user) {
                // group vacations
                var vacations = {};
                angular.forEach(user.vacations, function(v) {
                    var date = moment(v.day).format('YYYY-MM');
                    vacations[date] ? vacations[date].push(v) : vacations[date] = [v];
                });
                user.vacations = vacations;
                // group working and sum hours
                var working = {};
                angular.forEach(user.working, function(w) {
                    var date = moment(w.day).format('YYYY-MM');
                    working[date] ?
                        working[date] += sumWorkingHours(w) :
                        working[date] = sumWorkingHours(w);
                });
                user.working = working;
            });

            return users;
        }

        function sumWorkingHours(working) {
            var start = {
                hour: working.time_start.split(':')[0],
                minute: working.time_start.split(':')[1],
                second: working.time_start.split(':')[2],
            };
            var stop = {
                hour: working.time_stop.split(':')[0],
                minute: working.time_stop.split(':')[1],
                second: working.time_stop.split(':')[2],
            };
            var hours = stop.hour - start.hour;
            var minutes = stop.minute - start.minute;
            var seconds = stop.second - start.second;

            var diffInSeconds = (hours * 3600) + (minutes * 60) + seconds;

            return diffInSeconds;
        }

        // function printMonth(month, users) {
        //     var html = '<h1>' + moment(month).format('MMMM') + ' - <small>' + month + '</small></h1><br />';
        //     html += '<table border="1" cellpadding="5">';
        //     html += '<thead><tr><th>' + transService.translate('CALENDAR.PERSON') + '</th></tr></thead>';
        //     // users.forEach(user => {
        //     //     console.log(user);
        //     // });
        //     html += '</table>'

        //     var newWin = window.open('', '_blank');
        //     newWin.document.write('<html><body style="font-family: sans-serif;">' + html + '</body</html>');
        //     newWin.print();
        //     newWin.close();
        // }
    }

})();
