(function ()
{
    'use strict';

    angular
        .module('app.stories-form')
        .controller('StoriesFormController', StoriesFormController);

    /** @ngInject */
    function StoriesFormController(transService, api, $stateParams, projectsService, formService, apiErrorsService, $location, $state, $timeout, Story)
    {
        var vm = this;
        transService.loadFile('main/stories/form');

        // set Current Project from url
        projectsService.setCurrent($stateParams.project_id);

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.edit = false;

        vm.colors = [ '#E53935', '#D81B60', '#8E24AA', '#5E35B1', '#3949AB', '#1E88E5', '#039BE5', '#00ACC1', '#00897B', '#43A047', '#7CB342', '#AFB42B', '#FFB300', '#FB8C00', '#F4511E', '#757575', '#546E7A', '#6D4C41', '#000000' ];
        // vm.hexError = false;

        vm.form = {
            id: null,
            name: '',
            color: '',
            project_id: $stateParams.project_id,
            priority: null
        };

        vm.send = send;
        vm.selectColor = selectColor;
        // vm.checkHex = checkHex;

        init();

        function init() {

            if (typeof $stateParams.success != 'undefined') {
                vm.msg_success = transService.translate('STORIES_FORM.ADD_SUCCESS');
            }

            if ($stateParams.type == 'edit' && !isNaN(Number($stateParams.id)) ) {
                vm.edit = true;
                formService.generateForm(vm.form, Story.data);
            }
        }

        function send() {
            vm.request_sending = true;
            apiErrorsService.clear('#formStory', vm);

            if (vm.edit) {
                api.story.put(vm.form,
                    // success
                    function() {
                        vm.msg_error = '';
                        vm.msg_success = transService.translate('STORIES_FORM.UPDATE_SUCCESS');
                        vm.request_sending = false;

                        $timeout(function () {
                            $location.path('/projects/' + $stateParams.project_id + '/stories');
                        }, 1000);
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#formStory', response, vm, []);
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                    }
                );
            } else {
                api.stories.save(vm.form,
                    // success
                    function() {
                        $location.url('/projects/' + $stateParams.project_id + '/stories/form/new?success=true');
                        $timeout(function () {
                            $state.reload();
                        });
                    },
                    // error
                    function(response) {
                        apiErrorsService.show('#formStory', response, vm, []);
                        vm.msg_error = transService.getErrorMassage(response);
                        vm.msg_success = '';
                        vm.request_sending = false;
                    }
                );
            }
        }

        function selectColor(color) {
            vm.form.color = vm.form.color == color ? '' : color;
        }

        // function checkHex() {
        //     if(vm.form.color) {
        //         var isOk  = /(^#[0-9A-F]{6}$)|(^#[0-9A-F]{3}$)/i.test(vm.form.color);
        //         vm.hexError = !isOk ? true : false;
        //     } else {
        //         vm.hexError = false;
        //     }
        // }
        //////////
    }
})();
