(function ()
{
    'use strict';

    angular
        .module('app.projects-form')
        .controller('ProjectWizardDialogController', ProjectWizardDialogController);

    /** @ngInject */
    function ProjectWizardDialogController($location, $mdDialog, $timeout, $auth, transService, api)
    {
        var vm = this;
        transService.loadFile('main/projects/wizard');

        vm.loading = false;
        vm.currentStep = 1;
        vm.form = {
            name: '',
            statuses: [{ name: '' }],
            sprint: '',
            ticket: ''
        }
        vm.steps = new Array(Object.keys(vm.form).length + 1).fill(null);
        vm.shortName = '';
        vm.shortNameError = false;
        vm.errors = [];
        vm.errorCode = '';

        vm.prev = prev;
        vm.next = next;
        vm.hide = hide;
        vm.generateShort = generateShort;
        vm.checkShortName = checkShortName;
        vm.removeStatus = removeStatus;
        vm.addStatus = addStatus;
        vm.send = send;

        init();
        function init() {
            setInitFormValues();
            setDarkBackdrop();
        }

        function setInitFormValues() {
            api.agileStatusesList.get({ lang: transService.getLanguage() }, function (response) {
                vm.form.statuses = response.data && response.data[0] ? response.data[0].statuses : [{ name: '' }];
            });
            $timeout(function () {
                vm.form.sprint = transService.translate('PROJECT_WIZARD.SPRINT_FIRST');
                vm.form.ticket = transService.translate('PROJECT_WIZARD.TICKET_FIRST');
            })
        }

        function setDarkBackdrop() {
            $timeout(function () {
                var el = angular.element(document.querySelector('md-backdrop.md-opaque'));
                el.addClass('wizard-backdrop');
            });
        }

        function removeStatus(index) {
            vm.form.statuses.splice(index, 1);
        }

        function addStatus() {
            $timeout(function () {
                vm.form.statuses.push({ name: '' });
            }, 50);
        }

        function prev() {
            vm.currentStep--;
        }

        function next() {
            // reset errors
            if (vm.currentStep === vm.steps.length - 1) {
                vm.errors = [];
                vm.errorCode = '';
            }
            vm.currentStep++;
        }

        function hide() {
            $mdDialog.hide();
        }

        function send() {
            createProject();
        }

        function checkShortName() {
            vm.shortNameError = false;
            if (vm.shortName) {
                api.projectExist.get({ short_name: vm.shortName }, function () {
                    vm.shortNameError = true;
                }, function () {
                    vm.shortNameError = false;
                });
            }
        }

        function createProject() {
            vm.loading = true;
            // clear message
            $auth.getUser(function (user) {
                // Create request
                api.projects.save({
                    id: null,
                    name: vm.form.name,
                    short_name: vm.shortName,
                    status_for_calendar_id: null,
                    time_tracking_visible_for_clients: false,
                    ticket_scheduled_dates_with_time: false,
                    email_notification_enabled: false,
                    slack_notification_enabled: false,
                    slack_webhook_url: '',
                    slack_channel: '',
                    color: 'md-teal-500-bg',
                    language: transService.getLanguage(),
                    first_number_of_tickets: 1,
                    users: [{ user_id: user.id, role_id: 1 }] // role = owner
                }, function (response) {
                        createStatuses(response.data.id)
                }, showError);
            });

        }

        function createStatuses(project_id) {
            api.agileStatuses.save({
                project_id: project_id,
                statuses: vm.form.statuses
            }, function (response) {
                    createSprint(project_id);
            }, showError);
        }

        function createSprint(project_id) {
            api.sprint.sprints.save({
                project_id: project_id,
                name: vm.form.sprint
            }, function (response) {
                    activateSprint(project_id, response.data.id);
            }, showError);
        }

        function activateSprint(project_id, sprint_id) {
            api.sprint.activate.put({
                project_id: project_id,
                id: sprint_id
            }, function (response) {
                    createTask(project_id, response.data.id);
            }, showError);
        }

        function createTask(project_id, sprint_id) {
            $auth.getUser(function (user) {
                api.ticket.tickets.save({
                    project_id: project_id,
                    sprint_id: sprint_id,
                    name: vm.form.ticket,
                    reporter_id: user.id,
                    assigned_id: null,
                    estimate_time: 0, // required
                    type_id: 2 // task
                }, function (response) {
                    $location.path('/projects/' + project_id + '/agile');
                    vm.loading = false;
                    hide();
                }, showError);
            });
        }

        function generateShort() {
            vm.shortName = ''
            if (vm.form.name) {
                var arr = vm.form.name.split(' ');
                if (arr.length == 1) {
                    vm.shortName = arr[0].substring(0,3);
                }
                if (arr.length == 2) {
                    vm.shortName = (arr[0].substring(0,2) + arr[1].substring(0,2));
                }

                if (arr.length > 2) {
                    angular.forEach(arr, function (value, key) {
                        vm.shortName += arr[key].substring(0,1);
                    });
                }
            }

            vm.shortName = vm.shortName.toUpperCase();
        }

        function showError(e) {
            vm.loading = false;
            vm.errorCode = e.data.code;
            angular.forEach(Object.keys(e.data.fields), function (key) {
                vm.errors.push(key + ': ' + e.data.fields[key][0]);
            });
        }
    }

})();
