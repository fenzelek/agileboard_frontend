(function ()
{
    'use strict';

    angular
        .module('app.calendar')
        .controller('ActivityCalendarController', ActivityCalendarController);

    /** @ngInject */
    function ActivityCalendarController(__env, $scope, $timeout, transService, api, $filter, projectsService, activityCalendarService, dialogService) {
        var vm = this;
        transService.loadFile('main/calendar/activity');
        transService.loadFile('main/time-tracking');

        vm.loading = false;
        vm.lang = transService.getLanguage();
        vm.today = moment().format('YYYY-MM-DD');
        vm.autoRefreshInterval = 600000; // 10 mins
        vm.date = null;
        vm.pickerDate = null;
        vm.readableDate = '';
        vm.hours = new Array(24).fill(null);
        vm.hourHeight = 60; // 60px height - 1px per minute
        vm.userWidth = 250; // good-loking column width :)
        vm.autoSkip = true;
        vm.autoSkipHops = 0;
        vm.lastChange = 'direct';
        vm.blockNext = false;
        vm.fetchEmpty = false;

        vm.activities = [];
        vm.ticketData = {
            loaded: false,
            estimated: null,
            tracked: null
        }

        vm.setDate = setDate;
        vm.onDateChange = onDateChange;
        vm.onAutoSkipChange = onAutoSkipChange;
        vm.onFetchEmptyChange = onFetchEmptyChange;
        vm.onZoomIn = onZoomIn;
        vm.onZoomOut = onZoomOut;
        vm.onActivityClicked = onActivityClicked;
        vm.onTicketDetailsClicked = onTicketDetailsClicked;
        vm.formatTracked = projectsService.formatEstimate;

        init();

        function init() {
            // set previous example day `2017-08-01` on develop server
            if (__env.apiUrl === 'http://dev.api.cep.devpark.pl/') {
                setDate(new Date('2017-08-01'));
            } else {
                setDate(new Date());
            }
            // auto-refresh every X time-peroid
            setInterval(function () {
                fetchActivities();
            }, vm.autoRefreshInterval);
        }

        /**
         *
         * @param {Date | "YYYY-MM-DD" } date
         */
        function setDate(date) {
            vm.date = moment(date).toDate();
            vm.readableDate = moment(date).format('dddd, L');
            vm.pickerDate = moment(date).format('YYYY-MM-DD');
            vm.blockNext = moment().diff(vm.date, 'days') == 0;
            vm.lastChange = 'direct';
            fetchActivities();
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
            if (change < 0 || (change > 0 && !vm.blockNext)) {
                setDate(moment(vm.date).add(change, 'days').toDate());
                vm.lastChange = change > 0 ? 'next' : 'prev';
            }
        }

        function onZoomIn() {
            if (vm.userWidth < 500) {
                vm.userWidth += 50;
                vm.activities = activityCalendarService.setActivitiesPositions(vm.activities, vm.hourHeight, vm.userWidth);
            }
        }
        function onZoomOut() {
            if (vm.userWidth > 150) {
                vm.userWidth -= 50;
                vm.activities = activityCalendarService.setActivitiesPositions(vm.activities, vm.hourHeight, vm.userWidth);
            }
        }

        function onAutoSkipChange() {
            vm.autoSkip = !vm.autoSkip;
        }


        function onFetchEmptyChange() {
            if (vm.loading) {
                return;
            }
            vm.fetchEmpty = !vm.fetchEmpty;
            fetchActivities();
        }

        /**
         *
         * @param {ActivityGroup} activity
         */
        function onActivityClicked(activity) {
            dialogService.customDialog(null, 'addEditTimeTrackingDialogController', 'app/main/time-tracking/add-edit-time-tracking/add-edit-time-tracking.html', {selected: activity.items},
                function (edited) {
                    if (edited) {
                        fetchActivities();
                    }
                }
            );
        }

        function onTicketDetailsClicked(ticket, projectId) {
            vm.ticketData.loaded = false;
            vm.ticketData.estimated = null;
            vm.ticketData.tracked = null;
            api.ticket.ticket.get({
                project_id: projectId,
                id: ticket.id
            }, function (response) {
                vm.ticketData.estimated = response.data.estimate_time;
                vm.ticketData.tracked = 0;
                if (response.data.time_tracking_summary && response.data.time_tracking_summary.data) {
                    angular.forEach(response.data.time_tracking_summary.data, function (tracked) {
                        vm.ticketData.tracked += tracked.tracked_sum;
                    });
                }
                vm.ticketData.loaded = true;
            }, function (err) {
                vm.ticketData.loaded = true;
            });
        }

        function fetchActivities() {
            if (vm.loading) {
                return;
            }
            vm.loading = true;
            var from = moment(vm.date).format('YYYY-MM-DD ') + ' 00:00:00';
            var to = moment(vm.date).format('YYYY-MM-DD ') + ' 23:59:59';
            api.integrations.activities.get({
                min_utc_started_at: $filter('localToUtc')(from, 'YYYY-MM-DD HH:mm:ss'),
                max_utc_started_at: $filter('localToUtc')(to, 'YYYY-MM-DD HH:mm:ss'),
                ticket_id: vm.fetchEmpty ? 'empty' : null,
                sort: 'utc_started_at',
                all: 1
            }, function (response) {
                    vm.loading = false;
                    vm.activities = activityCalendarService.mapUsersActivity(response.data);
                    vm.activities = activityCalendarService.setActivitiesPositions(vm.activities, vm.hourHeight, vm.userWidth);
                    getUsersWorkingHours();
                    // to update "fixed-header-table" sizes
                    // and scroll to the first activity
                    $timeout(function() {
                        $scope.$apply();
                        scrollToFirstActivity();
                    });
                    autoSkipActivities();
            });
        }

        function scrollToFirstActivity() {
            var container = angular.element('.calendar-scroll');
            var array = [];
            angular.forEach(vm.activities, function (user) {
                if (user.activities[0] && user.activities[0].top) {
                    array.push(user.activities[0].top);
                }
            });
            var scrollTo = array.length ? Math.min.apply(null, array) - 15 : 0;
            container.scrollTop(scrollTo);
        }

        function getUsersWorkingHours() {
            var date = $filter('date')(vm.date, 'yyyy-MM-dd');
            api.calendar.users.get({
                from: date,
                limit: 10
            }, function (response) {
                vm.activities = activityCalendarService.setAvailabilitiesData(vm.activities, response.data, date, vm.hourHeight);
            });
        }

        function autoSkipActivities() {
            if (vm.activities.length === 0 && vm.autoSkip && vm.autoSkipHops < 10 && vm.lastChange !== 'direct') {
                onDateChange(vm.lastChange === 'prev' ? -1 : 1);
                vm.autoSkipHops++;
            } else {
                vm.autoSkipHops = 0;
            }
        }

    }
})();
