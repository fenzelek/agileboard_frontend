(function () {
    'use strict';

    angular
        .module('app.time-tracking')
        .controller('TimeTrackingController', TimeTrackingController);

    /** @ngInject */
    function TimeTrackingController(transService, api, tableService, $stateParams, dialogService, $http, $auth, $filter, projectsService, $timeout, $element, $document, $httpParamSerializer)
    {
        var vm = this;
        transService.loadFile('main/time-tracking');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.activities = [];
        vm.ticket_summary = [];
        vm.summary = {};
        vm.projects = [];
        vm.sourceTypes = ['HUBSTAFF', 'TIME-TRACKER', 'MANUAL'];
        vm.external_projects = [];
        vm.external_users = [];
        vm.users = [];
        vm.time_start = '';
        vm.time_stop = '';
        vm.without_tickets = false;
        vm.sum_ticket_times = false;
        vm.selected = [];
        vm.date_select = '';
        vm.is_admin = false;
        vm.lang = transService.getLanguage();
        vm.projectSearch = '';
        vm.query = {};

        vm.getTimeTracking = getTimeTracking;
        vm.clear = clear;
        vm.selectDate = selectDate;
        vm.selectProject = selectProject;
        vm.edit = edit;
        vm.add = add;
        vm.remove = remove;
        vm.exportToExcel = exportToExcel;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.showProject = showProject;

        init();
        // For "searchable-select"
        $element.find('input.select-search').on('keydown', function(ev) {
            ev.stopPropagation();
        });

        function init() {

            api.projects.get({ limit: 200, status: 'opened' }, function (response) {
                vm.projects = response.data;
            });

            api.integrations.projects.get({limit:200}, function (response) {
                vm.external_projects = response.data;
            });

            tableService.setVariables(vm);
            // vm.query.time_tracking_note_content = '';
            vm.query.min_utc_started_at = null;
            vm.query.max_utc_started_at = null;
            vm.query.min_tracked = null;
            vm.query.max_tracked = null;
            vm.query.min_activity_level = null;
            vm.query.max_activity_level = null;
            vm.query.time_tracking_project_id = null;
            vm.query.project_id = typeof $stateParams.project_id != 'undefined' ? $stateParams.project_id : null;
            vm.query.ticket_id = typeof $stateParams.ticket_id != 'undefined' ? $stateParams.ticket_id : null;
            vm.query.time_tracking_user_id = null;
            vm.query.user_id = typeof $stateParams.user_id != 'undefined' ? $stateParams.user_id : null;
            vm.query.time_tracking_note_content = null;
            vm.query.comment = null;
            vm.query.source = null;

            $auth.getMyRole(function (role) {
                if (role == 'admin' || role == 'owner') {
                    vm.is_admin = true;
                    api.integrations.users.get({}, function (response) {
                        vm.external_users = response.data;
                    });
                }
            });

            selectProject();

            if (typeof $stateParams.project_id != 'undefined') {
                //if is project then get all
                vm.time_start = '2017-01-01 00:00';
                vm.time_stop = moment().format('YYYY-MM-DD ') + ' 23:59:59';
                getTimeTracking();
            } else {
                // select today as default
                vm.date_select = 'today';
                selectDate();
            }
        }

        function selectDate() {
            switch(vm.date_select) {
                case 'today':
                    vm.time_start = moment().format('YYYY-MM-DD ') + ' 00:00:00';
                    vm.time_stop = moment().format('YYYY-MM-DD ') + ' 23:59:59';
                    break;
                case 'yesterday':
                    vm.time_start = moment().add(-1, 'days').format('YYYY-MM-DD ') + ' 00:00:00';
                    vm.time_stop = moment().add(-1, 'days').format('YYYY-MM-DD ') + ' 23:59:59';
                    break;
                case 'current_week':
                    vm.time_start = moment().isoWeekday(1).startOf('week').format('YYYY-MM-DD ') + ' 00:00:00';
                    vm.time_stop = moment().isoWeekday(1).startOf('week').add(6, 'days').format('YYYY-MM-DD ') + ' 23:59:59';
                    break;
                case 'previous_week':
                    vm.time_start = moment().isoWeekday(1).startOf('week').add(-7, 'days').format('YYYY-MM-DD ') + ' 00:00:00';
                    vm.time_stop = moment().isoWeekday(1).startOf('week').add(-1, 'days').format('YYYY-MM-DD ') + ' 23:59:59';
                    break;
                case 'current_month':
                    vm.time_start = moment().startOf('month').format('YYYY-MM-DD ') + ' 00:00:00';
                    vm.time_stop = moment().endOf('month').format('YYYY-MM-DD ') + ' 23:59:59';
                    break;
                case 'previous_month':
                    vm.time_start = moment().add(-1, 'month').startOf('month').format('YYYY-MM-DD ') + ' 00:00:00';
                    vm.time_stop = moment().add(-1, 'month').endOf('month').format('YYYY-MM-DD ') + ' 23:59:59';
                    break;
            }
            getTimeTracking();
            $timeout(function () {
                vm.date_select = '';
            });
        }

        function selectProject() {
            $auth.getMyRole(function (role) {
                if (vm.query.project_id) {
                    api.projectUsers.get({id: vm.query.project_id}, function (response) {
                        vm.users = [];
                        angular.forEach(response.data, function (user) {
                            vm.users.push(user.user.data);
                        });
                    });
                } else {
                    if (role == 'admin' || role == 'owner') {
                        api.company.users.get({ company_status: 1 }, function (response) {
                            vm.users = response.data;
                        });
                    } else {
                        vm.query.user_id = null;
                        vm.users = [];
                    }
                }
            })
        }

        function showProject(name) {
            if (vm.projectSearch === '') {
                return true;
            }
            var query = vm.projectSearch.toLowerCase();
            var project = name ? name.toLowerCase() : '';
            return project.indexOf(query) !== -1;
        }

        /**
         * get contractors
         */
        function getTimeTracking() {

            vm.selected = [];

            if (vm.time_start == '') {
                vm.query.min_utc_started_at = null;
            } else {
                vm.query.min_utc_started_at = $filter('localToUtc')(vm.time_start, 'YYYY-MM-DD HH:mm:ss');
            }
            if (vm.time_stop == '') {
                vm.query.max_utc_started_at = null;
            } else {
                vm.query.max_utc_started_at = $filter('localToUtc')(vm.time_stop, 'YYYY-MM-DD HH:mm:ss');
            }

            if (vm.without_tickets) {
                vm.query.ticket_id = "empty";
            } else {
                vm.query.ticket_id = typeof $stateParams.ticket_id != 'undefined' ? $stateParams.ticket_id : null;
            }

            // Assign "sum_ticket_times" to "query" for display result afer "Search" button clicked
            if (vm.sum_ticket_times) {
                vm.query.sum_ticket_times = true;
                vm.query.all = 1;
            } else {
                vm.query.sum_ticket_times = false;
                vm.query.all = 0;
            }

            vm.summary = {};

            api.integrations.activitiesSummary.get(vm.query, function (response) {
                vm.summary = response.data;
            });

            return vm.promise = api.integrations.activities.get(vm.query, function (response) {
                if (!vm.query.sum_ticket_times) {
                    vm.activities = response.data;
                    vm.pagination = response.meta.pagination;
                } else {
                    vm.ticket_summary = getTicketSummary(response.data);
                }
            }).$promise;
        }

        function clear() {
            tableService.setVariables(vm);
            vm.time_start = '';
            vm.time_stop = '';
            vm.without_tickets = false;
            vm.sum_ticket_times = false;
        }

        function edit() {
            dialogService.customDialog(null, 'addEditTimeTrackingDialogController', 'app/main/time-tracking/add-edit-time-tracking/add-edit-time-tracking.html', {
                selected: vm.selected,
            }, onSuccess);

            function onSuccess(response) {
                vm.selected = [];
                getTimeTracking();
            }
        }

        function add() {
            dialogService.customDialog(null, 'addEditTimeTrackingDialogController', 'app/main/time-tracking/add-edit-time-tracking/add-edit-time-tracking.html', {
                selected: null,
            }, onSuccess);
            
            function onSuccess(response) {
                getTimeTracking();
            }
        }

        function remove() {
            var activities = vm.selected.map(function(item) { return item.id });
            var body = { activities: activities };

            var url = __env.apiUrl + 'integrations/time_tracking/activities';

            if (!vm.is_admin) {
                url += '/own';
            }

            $http({
                method: 'DELETE',
                url: url,
                headers: { 'Content-Type': 'application/json;charset=UTF-8' },
                data: body,
            }).then(onSuccess, onError);

            function onSuccess(response) {
                vm.selected = [];
                getTimeTracking();
            }

            function onError(response) {
                var msg = transService.getErrorMassage(response);
                toastr.error(msg);
            }
        }

        function exportToExcel() {
            var query = Object.assign({}, vm.query);

            if (vm.time_start == '') {
                query.min_utc_started_at = null;
            } else {
                query.min_utc_started_at = $filter('localToUtc')(vm.time_start, 'YYYY-MM-DD HH:mm:ss');
            }
            if (vm.time_stop == '') {
                query.max_utc_started_at = null;
            } else {
                query.max_utc_started_at = $filter('localToUtc')(vm.time_stop, 'YYYY-MM-DD HH:mm:ss');
            }

            if (vm.without_tickets) {
                query.ticket_id = "empty";
            } else {
                query.ticket_id = typeof $stateParams.ticket_id != 'undefined' ? $stateParams.ticket_id : null;
            }

            // Assign "sum_ticket_times" to "query" for display result afer "Search" button clicked
            if (vm.sum_ticket_times) {
                query.sum_ticket_times = true;
                query.all = 1;
            } else {
                query.sum_ticket_times = false;
                query.all = 0;
            }

            $http.get(__env.apiUrl + 'integrations/time_tracking/activities/export?' + $httpParamSerializer(query), { responseType: 'blob' }).then(function (resp) {
                var blob = new Blob([resp.data]);
                var link = $document[0].createElement('a');
                // create a blobURI pointing to our Blob
                link.href = URL.createObjectURL(blob);
                link.download = 'Time Tracking Export ' + Date.now() + '.xlsx';

                // some browser needs the anchor to be in the doc
                $document[0].body.append(link);
                link.click();
                link.remove();

                $timeout(function () {
                    URL.revokeObjectURL(link.href)
                }, 7000);

            }, function (response) {
                var msg = transService.getErrorMassage(response);
                toastr.error(msg);
            });

        }

        /**
         * @param {string} activities
         * @returns {array} ticket_summary { id: number, ticket: {}, tracked: number (s), tracked_formatted: string, users: {}[] }
         */
        function getTicketSummary(activities) {
            if (!vm.query.sum_ticket_times) {
                return [];
            }
            // group activities by ticket
            var result = {}
            angular.forEach(activities, function (activity) {
                // set activity identifier (try: 1.ticket, 2.note)
                var identifier = null;
                if (activity.ticket_id) identifier = activity.ticket_id;
                if (!identifier && activity.time_tracking_note.data) identifier = activity.time_tracking_note.data.content;

                if (!result[identifier]) {
                    result[identifier] = {
                        id: activity.ticket_id,
                        ticket: activity.ticket.data,
                        tracked: activity.tracked,
                        users: [activity.user.data],
                        time_tracking_note: activity.time_tracking_note
                    }
                } else {
                    result[identifier].tracked += activity.tracked;
                    result[identifier].users = pushUserUnique(result[identifier].users, activity.user);
                }
            });

            return formatTimes(Object.values(result), 'HH:mm');
        }

        function pushUserUnique(users, user) {
            var unique = {};
            // add new
            if (user && user.data) {
                unique[user.data.id] = user.data;
            }
            // add the rest of them if unique
            angular.forEach(users, function (u) {
                if (!unique[u.id]) {
                    unique[u.id] = u;
                }
            });
            return Object.values(unique);
        }

        function formatTimes(activities, format) {
            angular.forEach(activities, function (activity) {
                activity.tracked_formatted = moment.utc(activity.tracked * 1000).format(format);
                if (activity.ticket) {
                    activity.ticket.estimate_time_formatted = moment.utc(activity.ticket.estimate_time * 1000).format(format);
                }
            });
            return activities;
        }

    }
})();
