(function ()
{
    'use strict';

    angular
        .module('app.backlog')
        .controller('SprintCloneDialogController', SprintCloneDialogController);

    /** @ngInject */
    function SprintCloneDialogController(transService, $mdDialog, api, apiErrorsService, project_id, id)
    {
        var vm = this;
        transService.loadFile('main/agile/sprint-clone');

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;

        vm.form = {
            project_id: project_id,
            id: id,
            name: '',
            activated: false
        };

        vm.hide = hide;
        vm.send = send;

        function hide() {
            $mdDialog.hide();
        }

        /**
         * Clone sprint
         */
        function send() {
            vm.request_sending = true;
            apiErrorsService.clear('#sprintClone', vm);

            api.sprint.clone.save(vm.form,
                function(response) {
                    $mdDialog.hide(response.data);
                },
                function(response) {
                    apiErrorsService.show('#sprintClone', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                }
            );
        }
    }

})();
