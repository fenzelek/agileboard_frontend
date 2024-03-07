(function ()
{
    'use strict';

    angular
        .module('app.backlog')
        .controller('SprintCloseDialogController', SprintCloseDialogController);

    /** @ngInject */
    function SprintCloseDialogController(transService, $mdDialog, api, apiErrorsService, project_id, id, sprints)
    {
        var vm = this;
        transService.loadFile('main/agile/sprint-close');

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.sprints = sprints;

        vm.form = {
            project_id: project_id,
            id: id,
            sprint_id: null
        };

        vm.hide = hide;
        vm.send = send;

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Create user
         */
        function send() {

            vm.request_sending = true;
            apiErrorsService.clear('#sprintClose', vm);

            api.sprint.close.put(vm.form,
                // success
                function() {
                    $mdDialog.hide({sprint_closed_id: vm.form.id, sprint_move_id: vm.form.sprint_id});
                },
                // error
                function(response) {
                    apiErrorsService.show('#sprintClose', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }
    }

})();
