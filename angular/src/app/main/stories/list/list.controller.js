(function ()
{
    'use strict';

    angular
        .module('app.stories-list')
        .controller('StoriesListController', StoriesListController);

    /** @ngInject */
    function StoriesListController(transService, $stateParams, projectsService, api, tableService, dialogService, StoriesList)
    {
        var vm = this;
        transService.loadFile('main/stories/list');

        // set Current Project from url
        projectsService.setCurrent($stateParams.project_id);

        // Data
        vm.msg_error = '';
        vm.msg_success = '';
        vm.request_sending = false;
        vm.stories = StoriesList.data;
        vm.pagination = StoriesList.meta.pagination;
        vm.filtered = false;

        vm.getStories = getStories;
        vm.filter = filter;
        vm.filterClear = filterClear;
        vm.deleteStory = deleteStory;

        init();

        function init() {
            tableService.setVariables(vm);
            vm.query.name = '';
            vm.query.project_id = $stateParams.project_id;
        }

        /**
         * get stories
         */
        function getStories() {
            vm.promise = api.stories.get(vm.query, function (response) {
                vm.stories = response.data;
                vm.pagination = response.meta.pagination;
            }).$promise;
        }

        function filterClear() {
            vm.query.name = '';
            getStories();
            vm.promise.then(function() {
                vm.filtered = false;
            });
        }

        function filter() {
            if(vm.query.name) {
                getStories();
                vm.promise.then(function() {
                    vm.filtered = true;
                });
            } else {
                // search query empty
                filterClear();
            }
        }

        /**
         * delete story
         * @param id
         */
        function deleteStory(id) {
            dialogService.confirm(null, 'STORIES_LIST.DELETE_QUESTION', function() {
                api.story.delete({project_id: $stateParams.project_id, id:id}, function () {
                    vm.msg_success = transService.translate('STORIES_LIST.DELETE_SUCCESS');
                    vm.msg_error = '';
                    getStories();

                },function (response) {
                    vm.msg_error = transService.getErrorMassage(response);
                })
            });
        }
        //////////
    }
})();
