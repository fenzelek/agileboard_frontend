(function ()
{
    'use strict';

    angular
        .module('app.calendar')
        .controller('CalendarController', CalendarController);

    /** @ngInject */
    function CalendarController($mdDialog, $document, $window, $filter, api, calendarService, transService, $auth, $timeout, $rootScope, $scope, $stateParams, __env, $http)
    {
        var vm = this;
        transService.loadFile('main/calendar');

        vm.is_admin = false;
        // assign data from resource users
        vm.currentUser = {};
        vm.users = [];
        vm.dates = null;
        vm.ganttDates = null;
        vm.ganttMonths = null;
        vm.errorsBag = [];
        vm.temp = {};
        vm.lang = transService.getLanguage();
        vm.currentDate = '';
        vm.pickerDate = null;
        vm.reasons = ['holidays', 'sick_note', 'day_off'];
        vm.currentView = 'working_hours';
        vm.date_start = null;
        vm.date_end = null;
        vm.realizationCellWidth = 79;
        vm.workloadCellWidth = 20;
        // Methods
        vm.showEventsModal = showEventsModal;
        vm.getPrev = getPrev;
        vm.getNext = getNext;
        vm.setDay = setDay;
        vm.drop = drop;
        vm.moment = moment;
        vm.getAvatar = $auth.getAvatar;
        vm.canModifyEvent = canModifyEvent;
        vm.realizationWidth = realizationWidth;
        vm.realizationResize = realizationResize;
        vm.workloadWidth = workloadWidth;
        vm.workloadRateWidth = workloadRateWidth;
        vm.workloadResize = workloadResize;
        vm.workloadRateColor = workloadRateColor;
        vm.isWeekendDay = isWeekendDay;
        vm.projectTextColor = projectTextColor;
        vm.getAvailabilityCssClass = getAvailabilityCssClass;
        vm.isConfirmed = isConfirmed;

        init();

        function init() {
            $auth.getUser(function (user) {
                vm.currentUser = user;

                if ($stateParams.view == 'working') {
                    vm.currentView = 'working_hours';
                } else if ($stateParams.view == 'realization') {
                    vm.currentView = 'ticket_realization';
                } else {
                    vm.currentView = 'gantt_diagram';
                }

                if (vm.currentDate != '') {
                    getData(vm.currentDate);
                } else {
                    getData(moment().format('YYYY-MM-DD'));
                }
            });

            $auth.getMyRole(function (role) {
                if (role == 'admin' || role == 'owner') {
                    vm.is_admin = true;
                }
            });
        }

        function getEvents(start_date) {
            var date = calendarService.makeFormatedDate(start_date);
            api.calendar.users.get({ from: date, department: $rootScope.current_department }, function (response) {
                // add new users or update items
                response.data.forEach(function (user) {
                    var existing_ids = vm.users.map(function (u) {
                        return u.id;
                    });
                    var index = existing_ids.indexOf(user.id);
                    if (index >= 0) {
                        vm.users[index] = user;
                    } else {
                        vm.users.push(user);
                    }
                });
                vm.dates = calendarService.getDates(response);
                vm.date_start = response.date_start;
                vm.date_end = response.date_end;
                $timeout(function() {
                    $scope.$apply();
                    $window.dispatchEvent(new Event('resize'));
                }, 200);
            });
        }

        function getData(start_date) {
            vm.currentDate = start_date;
            if (vm.currentView == 'ticket_realization') {
                getTicketRealization(start_date);
            } else if (vm.currentView == 'gantt_diagram') {
                getUserWorkload(start_date);
            } else {
                getEvents(start_date);
            }
        }

        function getPrev() {
            getData(moment(vm.currentDate, 'YYYY-MM-DD').add(-7, 'days').format('YYYY-MM-DD'));
        }

        function getNext() {
            getData(moment(vm.currentDate, 'YYYY-MM-DD').add(7, 'days').format('YYYY-MM-DD'));
        }

        function setDay(day) {
            getData(moment(day).format('YYYY-MM-DD'));
        }

        function drop(from, to) {

            //access admin
            if (parseInt(to.id) != vm.currentUser.id && -1 == ["admin", "owner"].indexOf(vm.currentUser.selected_user_company.data.role.data.name)) return;

            angular.forEach(vm.users, function (user) {
                if (user.id == from.id) {

                    var events = [];

                    angular.forEach(user.availabilities.data, function (date) {
                        if (date.day == from.date) {
                            var temp_date = {};
                            angular.copy(date, temp_date);
                            temp_date['day'] = to.date;
                            events.push(temp_date);
                        }
                    });

                    var url;

                    if (vm.is_admin) {
                        url = __env.apiUrl + 'users/' + user.id + '/availabilities/' + to.date;
                    } else {
                        url = __env.apiUrl + 'users/availabilities/own/' + to.date;
                    }

                    var body = { availabilities: events };

                    $http.post(url, body).then(function () {
                        init();
                    });
                }
            });
        }

        /**
         * User can edit events on this day?
         * True for myself and roles: Admin, Owner
         * @return {boolean}
         */
        function canModifyEvent(user, day) {
            if (calendarService.isFutureDate(day) && user.id == vm.currentUser.id) {
                return true;
            }
            if (["admin", "owner"].indexOf(vm.currentUser.selected_user_company.data.role.data.name) !== -1) {
                return true;
            }

            return false;
        }

        /**
         * Show add event modal
         *
         * @param e
         * @param  user user object
         * @param  day day object
         */
        function showEventsModal(e, user, day, errors) {

            // Can't modify other users unless you are admin/owner
            if (user.id != vm.currentUser.id && -1 == ["admin", "owner"].indexOf(vm.currentUser.selected_user_company.data.role.data.name)) return;
            // Can't modify past days unless you are admin/owner
            if(! calendarService.isFutureDate(day) && -1 == ["admin", "owner"].indexOf(vm.currentUser.selected_user_company.data.role.data.name)) return;

            day = $filter('date')(day, 'yyyy-MM-dd');

            var data = {
                user: user,
                day: day,
                currentEvents: calendarService.getEvents(vm.users, user, day),
                errors: errors,
                is_admin: vm.is_admin
            };

            vm.temp = {
                event: e,
                user: user,
                day: day
            }

            showEventFormDialog(e, data);
        }

        /**
         * Show event add/edit form dialog
         *
         * @param e
         * @param data
         */
        function showEventFormDialog(e, data)
        {

            var modalData = {
                controller: 'EventFormDialogController',
                controllerAs: 'vm',
                templateUrl: 'app/main/calendar/dialogs/event-form/event-form-dialog.html',
                parent: angular.element($document.body),
                targetEvent: e,
                clickOutsideToClose: true,
                locals: {
                    dialogData: angular.copy(data)
                }
            };

            $mdDialog
                .show(modalData)
                .then(function (response) {
                    addEvent(response);
                }, function () {});
        }

        /**
         * Add new event to the array
         *
         * @param  data
         */
        function addEvent(responseData) {
            var url;
            var body = { availabilities: responseData.events };

            if (vm.is_admin) {
                url = __env.apiUrl + 'users/' + responseData.user.id + '/availabilities/' + responseData.day;
            } else {
                url = __env.apiUrl + 'users/availabilities/own/' + responseData.day;
            }

            $http.post(url, body).then(
                // success
                function () {
                    // update view
                    init();
                },
                // error
                function (response) {
                    var object = response.data.fields;

                    for (var property in object) {
                        if (object.hasOwnProperty(property)) {
                            for (var i = 0; i < object[property].length; i++) {
                                vm.errorsBag.push(object[property][i]);
                            }
                        }
                    }

                    showEventsModal(vm.temp.event, vm.temp.user, vm.temp.day, vm.errorsBag);
                }
            );
        }

        /**
         * Get task realization data
         *
         * @param {string} start_date
         */
        function getTicketRealization(start_date) {
            var date = calendarService.makeFormatedDate(start_date);
            api.calendar.ticketRealization.get({from: date}, function (response) {
                vm.dates = calendarService.getDates(response);
                vm.users_ticket_realization = calendarService.realizationStructure(response);
                vm.date_start = response.date_start;
                vm.date_end = response.date_end;
                $timeout(function() {
                    $scope.$apply();
                    $window.dispatchEvent(new Event('resize'));
                    $timeout(realizationResize);
                }, 200);
            });
        }

        function getUserWorkload(start_date) {
            var date = calendarService.makeFormatedDate(start_date);
            api.calendar.userWorkload.get({from: date}, function (response) {
                vm.ganttDates = calendarService.getDates(response);
                vm.ganttMonths = calendarService.getMonths(vm.ganttDates);
                vm.users_workloads = calendarService.workloadStructure(response);
                vm.date_start = response.date_start;
                vm.date_end = response.date_end;
                $timeout(function() {
                    $scope.$apply();
                    $window.dispatchEvent(new Event('resize'));
                    $timeout(workloadResize);
                }, 200);
            });
        }

        function realizationWidth(realization) {
            if (!realization.end_at) {
                return vm.realizationCellWidth;
            }

            var days = calendarService.lengthBar(realization, vm.date_start, vm.date_end);

            return vm.realizationCellWidth * days + 17 * (days - 1);
        }

        function workloadWidth(workload) {
            if (!workload.end_at) {
                return vm.workloadCellWidth;
            }

            var days = calendarService.lengthBar(workload, vm.date_start, vm.date_end);

            return vm.workloadCellWidth  * days + days;
        }

        function workloadRateWidth(workload) {
            if (workload.rate && workload.rate < 100) {
                var days = calendarService.lengthBar(workload, vm.date_start, vm.date_end);

                var baseWidth = vm.workloadCellWidth  * days + days;

                return (workload.rate / 100) * baseWidth;
            }
            return 0;
        }

        function realizationResize() {
            if ($('.realization').length) {
                vm.realizationCellWidth = $('.realization').eq(0).width();
            }
        }

        function workloadResize() {
            if ($('.workload').length) {
                vm.workloadCellWidth = $('.workload').eq(0).width();
            }
        }

        function isWeekendDay(date) {
            var day = new Date(date).getDay();
            if (day !== 6 && day !== 0) return false;
            return true;
        }

        function workloadRateColor(classColor) {
            var newColor = '';
            var classColorSplit = classColor.split('-');
            var hue = classColorSplit[2];
            classColorSplit[2] = hue === '800' ? '200' : '100';
            for(var index in classColorSplit) {
                if (index > 0) newColor += '-';
                newColor += classColorSplit[index];
            }
            return newColor;

        }

        function projectTextColor(classColor) {
            var newColor = '';
            var classColorSplit = classColor.split('-');
            classColorSplit[0] = classColorSplit[1];
            delete classColorSplit[1];
            classColorSplit[3] = 'fg';
            for(var index in classColorSplit) {
                if (index > 0) newColor += '-';
                newColor += classColorSplit[index];
            }
            return newColor;
        }

        function getAvailabilityCssClass(availability) {
            var isOvertime = availability.overtime;
            var isAvailable = availability.available;
            var isExternal = availability.source === 'external';
            var confirmedAddOn = isConfirmed(availability) ? ' confirmed' : '';
            var result = 'online ';

            result += isExternal  ? 'md-indigo-500-bg' : 
                      isOvertime  ? 'md-purple-900-bg' : 
                      isAvailable ? 'md-teal-500-bg'   : 'md-red-400-bg';

            return result + confirmedAddOn;
        }

        function isConfirmed(availability) {
            return availability.status === 'CONFIRMED';
        }

    }
})();
