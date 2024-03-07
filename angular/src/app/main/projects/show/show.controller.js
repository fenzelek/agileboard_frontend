(function ()
{
    'use strict';

    angular
        .module('app.projects-show')
        .controller('ProjectsShowController', ProjectsShowController);

    /** @ngInject */
    function ProjectsShowController(transService, api, $stateParams, projectsService, $auth)
    {
        var vm = this;
        transService.loadFile('main/projects/show');

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.project = {};
        vm.users = {};
        vm.role = '';

        vm.getAvatar = $auth.getAvatar;
        vm.formatEstimate = projectsService.formatEstimate;
        vm.hasAccess = projectsService.hasAccess;


        init();

        function init() {
            $auth.getMyRole(function (role) {
                vm.role = role;
            });
            projectsService.setCurrent($stateParams.id, function (project) {
                vm.project = project;
            });
            api.projectUsers.get({id:$stateParams.id}, function (response) {
                vm.users = response.data;
            });
        }

        //////////
    }
})();
