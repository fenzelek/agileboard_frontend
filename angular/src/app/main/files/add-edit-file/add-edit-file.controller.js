(function ()
{
    'use strict';

    angular
        .module('app.files')
        .controller('AddEditFileDialogController', AddEditFileDialogController);

    /** @ngInject */
    function AddEditFileDialogController($auth, transService, $mdDialog, api, apiErrorsService, $timeout, formService, projectsService, filesService, project_id, item, $scope)
    {
        var vm = this;

        vm.msg_success = '';
        vm.msg_error = '';
        vm.request_sending = false;
        vm.roles = [];
        vm.progress = 0;
        vm.form_users = [];
        vm.stories = [];
        vm.file = null;
        vm.file_loaded = false;

        vm.form = {
            id: null,
            user_id: null,
            name: '',
            project_id: project_id,
            description: '',
            roles: [],
            users: [],
            stories: [],
            pages: [],
            tickets: []
        };

        vm.hide = hide;
        vm.send = send;
        vm.searchUser = projectsService.searchUser;
        vm.addFile = addFile;
        vm.searchStories = searchStories;
        vm.getSize = filesService.getSize;

        init();

        function init() {

            $auth.getUser(function (user) {
                vm.form.user_id = user.id;
            });

            api.rolesCompany.get({}, function (response) {
                vm.roles = response.data;
            });
        }

        function hide() {
            $mdDialog.hide();
        }

        filesService.dragAndDropFileInit($scope, vm, 'file', '#drop-files', '#add-edit-file-files-dialog', function(dropped_items) {
            // mark file_loaded flag as file-none
            vm.file_loaded = false;
            // check to upload only one file from d
            if(dropped_items) {
                if (dropped_items.constructor.name == 'FileList') {
                    vm.form.file = dropped_items[0];
                } else {
                    vm.form.file = dropped_items;
                }
                // set file_loaded flag to has-file
                $timeout(function() {
                    vm.file_loaded = true;
                }, 100);
            }
        });
        
        function addFile() {
            $timeout(function() {
                angular.element('#file-to-upload').trigger('click');
            }, 100);
        }

        // search stories by 'name'
        function searchStories(query) {
            return api.stories.get({
                    project_id: project_id,
                    limit: 15,
                    name: query
                }
            ).$promise.then(function (response) {
                return response.data;
            });
        }

        /**
         * Upload file
         */
        function send() {

            vm.request_sending = true;
            apiErrorsService.clear('#addEditFile', vm);

            vm.form.users = [];
            angular.forEach(vm.form_users, function (obj) {
                vm.form.users.push(obj.id);
            });

            // fill file stories arrray with stories IDs
            vm.form.stories = [];
            if(vm.stories.length) {
                angular.forEach(vm.stories, function (story) {
                    vm.form.stories.push(story.id);
                });
            }
            api.fileUpload.save(vm.form,
                // success
                function() {
                    $mdDialog.hide(true);
                },
                // error
                function(response) {
                    apiErrorsService.show('#addEditFile', response, vm, []);
                    vm.request_sending = false;
                    vm.msg_error = transService.getErrorMassage(response);
                },
                // progress
                function(progress) {
                    vm.progress = progress;
                }
            );
        }

    }

})();
