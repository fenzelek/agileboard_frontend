(function () {
    'use strict';

    angular
        .module('app.calendar')
        .controller('SummaryCalendarController', SummaryCalendarController);

    /** @ngInject */
    function SummaryCalendarController($timeout, $http, $window, $httpParamSerializer, transService, $auth, summaryCalendarService, projectsService) {
        var vm = this;
        transService.loadFile('main/calendar');

        vm.loading = false;
        vm.lang = transService.getLanguage();
        vm.date = null;
        vm.pickerDate = null;
        vm.reasons = ['holidays', 'sick_note', 'day_off'];
        vm.role = null;
        vm.user = null;

        vm.monthsPerPage = 6;
        vm.users = [];
        vm.months = [];

        vm.select = {
            all: false,
            selected: {},
        };

        vm.toggleAllSelected = toggleAllSelected;
        vm.toggleSelected = toggleSelected;

        vm.moment = moment;
        vm.setDate = setDate;
        vm.onDateChange = onDateChange;
        vm.getAvatar = $auth.getAvatar;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.getMonthPDF = getMonthPDF;
        vm.getYearPDF = getYearPDF;

        init();

        function init() {
            setDate(new Date());
            fetchSummary();
            $auth.getMyRole(function (role) {
                vm.role = role;
            });
            $auth.getUser(function (user) {
                vm.user = user;
            });
        }


        function toggleAllSelected() {
            var val = !vm.select.all;
            vm.select.all = val;
            
            vm.users.forEach(function (user) {
                vm.select.selected[user.id] = val;
            });
        }

        function setAllSelected(val) {
            vm.select.all = val;
            
            vm.select.selected = {};

            vm.users.forEach(function (user) {
                vm.select.selected[user.id] = val;
            });
        }

        function toggleSelected(event, user) {
            event.stopImmediatePropagation();
            vm.select.selected[user.id] = !vm.select.selected[user.id];
        }

        /**
         *
         * @param {Date | "YYYY-MM-DD" } date
         */
        function setDate(date) {
            vm.date = moment(date).toDate();
            vm.pickerDate = moment(date).format('YYYY-MM');
            vm.dates = [];
            for (var i = 0; i < vm.monthsPerPage; i++) {
                vm.dates.unshift(moment(vm.date).subtract(i, 'months').format('YYYY-MM'));
            }
            fetchSummary();
        }

        /**
         *
         * @param {number} change - number of days to change, eg.
         * "-1" -> 1 day before current date,
         * "2" -> 2 days from current date.
         */
        function onDateChange(change) {
            if (!change || typeof change != 'number' || vm.loading) {
                return;
            }
            setDate(moment(vm.date).add(change, 'months').toDate());
        }

        function fetchSummary() {
            if (vm.loading) {
                return;
            }
            vm.loading = true;
            summaryCalendarService.getSummary(vm.dates[0], vm.dates[vm.dates.length - 1], function (users) {
                $timeout(function () {
                    vm.users = users;
                    vm.loading = false;

                    setAllSelected(true);
                    // force table to render
                    $timeout(function () {
                        $window.dispatchEvent(new Event('resize'));
                    }, 10);
                });
            });
        }

        function getMonthPDF(month) {
            var queryParams = $httpParamSerializer({
                in_year: 0,
                date: moment(month).format('YYYY-MM-DD'),
            });
            
            getReport(queryParams, month);
        }

        function getYearPDF() {
            var queryParams = $httpParamSerializer({
                in_year: 1,
                date: moment(vm.date).format('YYYY-MM-DD'),
            });
            var name = moment(vm.date).format('YYYY');
            
            getReport(queryParams, name);
        }

        function getReport(queryParams, name) {
            var selectedUsersIds = getSelectedUsersIds();

            var noUsersSelected = !selectedUsersIds.length;
            if (noUsersSelected) {
                var msg = transService.translate('CALENDAR.NO_USERS_SELECTED');
                toastr.warning(msg);
                return;
            }

            var url = __env.apiUrl + 'users/availabilities/report?' + queryParams;
            var body = { users_ids: selectedUsersIds };
            var config = { responseType: 'blob' };
            var onSuccess = function (resp) { handlePdf(resp, name) };

            vm.loading = true;

            $http.post(url, body, config).then(onSuccess, onError);
        }

        function getSelectedUsersIds() {
            return Object.keys(vm.select.selected)
                .filter(function (id) { return vm.select.selected[id] })
                .map(function (id) { return parseInt(id) });
        }

        function handlePdf(resp, name) {
            vm.loading = false;
            var blob = new Blob([resp.data], { type: 'application/pdf' });
            var url = URL.createObjectURL(blob);

            // alternative file handling - not consistent behaviour across different browsers
            // var a = document.createElement('a');
            // a.href = url;
            // a.target = '_blank';
            // a.download = name + '.pdf';
            // a.click();

            window.open(url, name);
            URL.revokeObjectURL(url);
        }

        function onError(response) {
            vm.loading = false;
            var msg = transService.getErrorMassage(response);
            toastr.error(msg);
        }

    }
})();
