(function () {
    'use strict';

    angular
        .module('app.time-tracker')
        .controller('ScreensController', ScreensController);

    /** @ngInject */
    function ScreensController(transService, api, projectsService, dialogService, $filter, $auth) {
        var vm = this;

        vm.loading = false;

        vm.is_admin = false;
        vm.lang = transService.getLanguage();

        vm.query = {
            project_id: null,
            user_id: null,
            min_utc_started_at: null,
            max_utc_started_at: null,
            sum_ticket_times: false,
            all: 1,
        };

        // public props
        vm.users = null; // empty if not admin
        vm.projects = [];
        vm.summary = {};
        vm.activities = null;
        vm.date = moment().format('YYYY-MM-DD');
        vm.projectSearch = '';

        // public methods
        vm.getScreensAndMetadata = getScreensAndMetadata;
        vm.onProjectChange = onProjectChange;
        vm.onUserChange = onUserChange;
        vm.onDateChange = onDateChange;
        vm.filterProjects = filterProjects;
        vm.previewImage = previewImage;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.stopPropagation = stopPropagation;

        init();


        function init() {
            transService.loadFile('main/time-tracker');

            getProjects();

            getUserRole(function () {
                if (vm.is_admin) {
                    getUsers();
                } else {
                    getScreens();
                    getSummary();
                }
            });
        }

        // public methods

        function getScreensAndMetadata() {

            getScreens();
            getSummary();
        }

        function getScreens() {
            vm.loading = true;

            vm.activities = null;

            var resource = vm.is_admin ? api.screens.all : api.screens.own;

            var query = {
                project_id: vm.query.project_id,
                user_id: vm.query.user_id,
                date: vm.date,
            };

            var promise = resource.get(query, function (response) {
                parseActivities(response.data);
                vm.activities = response.data;
                vm.loading = false;
            }, function () {
                vm.loading = false;
            }).$promise;

            return promise;
        }

        function getSummary() {
            vm.summary = {};

            vm.query.min_utc_started_at = $filter('localToUtc')(vm.date + ' 00:00:00', 'YYYY-MM-DD HH:mm:ss');
            vm.query.max_utc_started_at = $filter('localToUtc')(vm.date + ' 23:59:59', 'YYYY-MM-DD HH:mm:ss');

            api.integrations.activitiesSummary.get(vm.query, function (response) {
                vm.summary = response.data;
            });
        }

        function onDateChange() {
            if (!vm.date) {
                vm.activities = null;
                return;
            }

            var requiredFiltersSelected = !!vm.query.user_id;

            if (!vm.is_admin || (vm.is_admin && requiredFiltersSelected)) {
                getScreensAndMetadata();
            }
        }

        function onProjectChange() {
            vm.query.user_id = null;
            vm.activities = null;

            var projectSelected = vm.query.project_id;

            if (vm.is_admin && projectSelected) {
                getUsers();
            }

            if (!vm.is_admin) {
                getScreensAndMetadata();
            }
        }

        function onUserChange() {
            if (vm.query.user_id)
                getScreensAndMetadata();
            else
                vm.activities = null;
        }

        function filterProjects(name) {
            if (vm.projectSearch === '') {
                return true;
            }
            var query = vm.projectSearch.toLowerCase();
            var project = name ? name.toLowerCase() : '';
            return project.indexOf(query) !== -1;
        }

        function previewImage(screens) {
            var urls;
            var onlyOneScreen = screens.length === 1;

            if (onlyOneScreen) {
                urls = screens[0].url;
            } else {
                urls = screens.map(function (screen) {
                    return screen.url;
                });
            }

            dialogService.customDialog(null, 'ImagePreviewController', 'app/main/pages/image-preview/image-preview.html', {
                url: urls,
            });
        }

        function stopPropagation($event) {
            $event.stopPropagation();
        }

        // private methods

        function getUserRole(cb) {
            $auth.getMyRole(function (role) {
                if (role == 'admin' || role == 'owner') {
                    vm.is_admin = true;
                }
                if (cb) cb();
            });
        }

        function getUsers() {
            if (vm.query.project_id) {
                api.projectUsers.get({ id: vm.query.project_id }, function (response) {
                    vm.users = [];
                    angular.forEach(response.data, function (user) {
                        vm.users.push(user.user.data);
                    });
                });
            } else {
                api.company.users.get({ company_status: 1 }, function (response) {
                    vm.users = response.data;
                });
            }
        }

        function getProjects() {
            api.projects.get({ limit: 200, status: 'opened' }, function (response) {
                vm.projects = response.data;
            });
        }

        function parseActivities(activities) {
            angular.forEach(activities, function (activity) {
                parseTimePeriod(activity);
                parseActivityLevel(activity);
            });
        }

        function parseTimePeriod(activity) {
            var from = $filter('utcToLocal')(activity.utc_started_at);
            var to = $filter('utcToLocal')(activity.utc_finished_at);

            from = moment(from).format('H:mm');
            to = moment(to).format('H:mm');

            activity.from = from;
            activity.to = to;
        }

        function parseActivityLevel(activity) {
            if (typeof activity.activity_level === 'number') return;

            var level = activity.activity / activity.tracked;
            level = level * 100; // percentage
            level = Math.round(level);

            activity.activity_level = level;
        }

    }
})();
