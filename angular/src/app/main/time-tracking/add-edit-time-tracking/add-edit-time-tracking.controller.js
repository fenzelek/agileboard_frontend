(function () {
    'use strict';

    angular
        .module('app.time-tracking')
        .controller('addEditTimeTrackingDialogController', addEditTimeTrackingDialogController);

    /** @ngInject */
    function addEditTimeTrackingDialogController(transService, $mdDialog, api, $auth, $filter, $scope, apiErrorsService, selected) {
        var vm = this;

        vm.inEditMode = selected ? true : false;

        vm.lang = transService.getLanguage();
        vm.user = null;
        vm.msg_success = '';
        vm.msg_error = '';

        vm.request_sending = false;
        vm.loadingProject = false;
        vm.loadingTicket = false;

        vm.selected = selected;
        vm.project = null;
        vm.ticket = null;

        vm.enable_locked = false;
        vm.is_admin = false;

        vm.form = {
            user_id: null,
            project_id: 0,
            ticket_id: 0,
            comment: '',
            locked: false,
            date: null,
            from: null,
            to: null,
        };
        $scope.form = vm.form;
        vm.formValid = false;

        $scope.project = vm.project;
        $scope.ticket = vm.ticket;

        vm.searchProjects = searchProjects;
        vm.searchTicket = searchTicket;
        vm.validate = validate;
        vm.scrollToPicker = scrollToPicker;

        vm.save = save;
        vm.cancel = cancel;


        init();


        function init() {
            fetchUser();

            fetchRole(function() {
                if (vm.is_admin) {
                    fetchAllUsers();
                }
            });

            if (vm.inEditMode) {
                setValuesFromSelectedItems();
            }

            setFormValidation();
        }

        function fetchUser() {
            $auth.getUser(function (user) {
                vm.user = user;
            });
        }

        function fetchRole(cb) {
            $auth.getMyRole(function (role) {
                if (role == 'admin' || role == 'owner') {
                    vm.enable_locked = true;
                    vm.is_admin = true;
                }
                if (typeof cb === 'function') {
                    cb();
                }
            });
        }

        function fetchAllUsers() {
            api.company.users.get({ company_status: 1 }, function (response) {
                vm.users = response.data;
            });
        }

        function setValuesFromSelectedItems() {
            var first = selected[0];

            vm.form.project_id = first.project_id;
            vm.form.ticket_id = first.ticket_id;
            vm.form.comment = vm.enable_locked ? first.comment : vm.user.first_name + ' ' + vm.user.last_name;
            vm.form.note = first.time_tracking_note.data ? first.time_tracking_note.data.content : '-';
            vm.form.locked = first.locked;

            vm.form.date = moment(first.utc_started_at).format('YYYY-MM-DD');
            vm.form.from = moment(first.utc_started_at).format('HH:mm:ss');
            vm.form.to = moment(first.utc_finished_at).format('HH:mm:ss');

            angular.forEach(vm.selected, function (value) {

                if (vm.form.project_id != value.project_id) {
                    vm.form.project_id = 0;
                }

                if (vm.form.ticket_id != value.ticket_id) {
                    vm.form.ticket_id = 0;
                }

                if (vm.enable_locked && vm.form.comment != value.comment) {
                    vm.form.comment = '';
                }

                if (vm.form.locked != value.locked) {
                    vm.form.locked = false;
                }
            });

            if (vm.form.project_id) {
                fetchProject(vm.form.project_id);
            }

            if (vm.form.ticket_id) {
                fetchTicket(vm.form.project_id, vm.form.ticket_id);
            }
        }

        function fetchProject(projectId) {
            api.project.get({ id: projectId }, function (response) {
                vm.project = response.data;
            });
        }

        function fetchTicket(projectId, ticketId) {
            api.ticket.ticket.get({ project_id: projectId, id: ticketId }, function (response) {
                vm.ticket = response.data;
            });
        }

        function setFormValidation() {
            $scope.$watch('form', function () {
                validate();
            }, true);

            $scope.$watch(function () {
                vm.form.project_id = vm.project ? vm.project.id : null;
                vm.form.ticket_id = vm.ticket ? vm.ticket.id : null;
            }, true);
        }

        function scrollToPicker() {
            // there is no on-open event in datepicker, so we have to work around this
            setTimeout(function () {
                console.log('scroll');
                document.getElementById('add-edit-time-tracking-dialog').scrollBy({top: 350, behavior: 'smooth'});
            }, 10); // wait for the view to render
        }

        function searchProjects(name) {
            vm.loadingProject = true;
            return api.projects.get({
                    limit: 15,
                    page: 1,
                    search: name
                }
            ).$promise.then(function (response) {
                vm.loadingProject = false;
                return response.data;
            });
        }

        function searchTicket(name) {
            vm.loadingTicket = true;
            return api.ticket.tickets.get({
                    limit: 15,
                    page: 1,
                    project_id: vm.project.id,
                    search: name
                }
            ).$promise.then(function (response) {
                vm.loadingTicket = false;
                return response.data;
            });
        }

        function cancel() {
            $mdDialog.cancel();
        }

        function save() {
            if (vm.inEditMode) {
                update();
            } else {
                add();
            }
        }

        function update() {
            vm.request_sending = true;
            apiErrorsService.clear('#addEditTimeTracking', vm);

            var activities = [];
            
            angular.forEach(vm.selected, function (value) {
                activities.push({
                    id: value.id,
                    project_id: vm.project.id,
                    ticket_id: vm.ticket ? vm.ticket.id : null,
                    comment: vm.form.comment,
                    locked: vm.form.locked
                })
            });

            var data = { activities: activities };

            api.timeTracking.all.put(data, onSuccess, onError);
        }

        function add() {
            vm.request_sending = true;
            apiErrorsService.clear('#addEditTimeTracking', vm);

            var period = getPeriod();

            var data = {
                project_id: vm.project.id,
                ticket_id: vm.ticket ? vm.ticket.id : null,
                from: period.from,
                to: period.to,
                comment: vm.form.comment,
            };

            if (vm.is_admin) {
                data.user_id = vm.form.user_id;
            }

            var resource = vm.is_admin ? api.timeTracking.all : api.timeTracking.own;

            resource.post(data, onSuccess, onError);
        }

        function getPeriod() {
            var from = vm.form.date + ' ' + vm.form.from;
            var to = vm.form.date + ' ' + vm.form.to;

            from = $filter('localToUtc')(from, 'YYYY-MM-DD HH:mm:ss');
            to = $filter('localToUtc')(to, 'YYYY-MM-DD HH:mm:ss');

            return {
                from: from,
                to: to,
            };
        }

        function onSuccess() {
            $mdDialog.hide();
        }

        function onError(response) {
            apiErrorsService.show('#addEditTimeTracking', response, vm, []);
            vm.request_sending = false;
            vm.msg_error = transService.getErrorMassage(response);
        }

        function validate() {
            var valid = ckeckRequired() && checkTime();
            vm.formValid = valid;
        }

        function ckeckRequired() {
            var valid = true;
            var requiredFields = ['project_id', 'ticket_id'];

            if (vm.is_admin && !vm.inEditMode)
                requiredFields.push('user_id');

            if (!vm.inEditMode) {
                requiredFields.push('date', 'from', 'to');
            }

            requiredFields.forEach(function (item) {
                if (!vm.form[item]) valid = false;
            });

            return valid;
        }

        function checkTime() {
            if (vm.inEditMode) return true;

            return ['from', 'to'].find(function (item) {
                var value = vm.form[item];
                var invalid = !validateTime(value);
                return invalid;
            }) ? false : true;
        }

        function validateTime(value) {
            if (!value) return false;

            var maskReg = /^(([0-1][0-9])|(2[0-3])):[0-5][0-9]:[0-5][0-9]$/;
            var match = value.match(maskReg);
    
            return !!match;
        }

    }

})();
