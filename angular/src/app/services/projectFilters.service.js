(function ()
{
    'use strict';

    angular
        .module('app.core')
        .factory('projectFiltersService', projectFiltersService);

    /** @ngInject */
    function projectFiltersService($window)
    {
        var service = {
            addTicketFilter: addTicketFilter,
            getTicketFilters: getTicketFilters,
            removeTicketFilter: removeTicketFilter
        };

        return service;

        /**
         *
         *  Add ticket filter into localStorage
         *
         * @param {number[] | number | boolean} filter_value
         * @param {string} type
         * @param {string/int} project_id
         */
        function addTicketFilter(filter_value, type, project_id) {
            var project_index;
            var ticket_filters = [];

            // read localstorage filter
            if (typeof $window.localStorage.ticket_filters != 'undefined') {
                ticket_filters = JSON.parse($window.localStorage.ticket_filters);
                // add search specified project id index in array
                angular.forEach(ticket_filters, function(filter, filter_index) {
                    if (filter.project_id == project_id) {
                        project_index = filter_index;
                    }
                });
                // add new project to filters if not present
                if (typeof project_index == 'undefined') {
                    var filters_length = ticket_filters.push({
                        project_id: parseInt(project_id),
                        agile: {},
                        backlog: {},
                        knowledge: {},
                        files: {}
                    });
                    project_index = filters_length - 1;
                }
            } else {
                // if any - create an object
                ticket_filters = [{
                    project_id: parseInt(project_id),
                    agile: {},
                    backlog: {},
                    knowledge: {},
                    files: {}
                }];
                project_index = 0;
            }

            // check structure of received localstorage data, create empty if not present
            if(!ticket_filters[project_index].agile) ticket_filters[project_index].agile = {};
            if(!ticket_filters[project_index].backlog) ticket_filters[project_index].backlog = {};
            if(!ticket_filters[project_index].knowledge) ticket_filters[project_index].knowledge = {};
            if(!ticket_filters[project_index].files) ticket_filters[project_index].files = {};

            // detect what parameter is setting and set that filter_value
            switch(type) {
                case 'agile_sprint':
                    if (filter_value) ticket_filters[project_index].agile.sprint = filter_value;
                    else delete ticket_filters[project_index].agile.sprint;
                    break;
                case 'agile_story':
                    if(filter_value) ticket_filters[project_index].agile.story = filter_value;
                    else delete ticket_filters[project_index].agile.story;
                    break;
                case 'agile_user':
                    if(filter_value) ticket_filters[project_index].agile.user = filter_value;
                    else delete ticket_filters[project_index].agile.user;
                    break;
                case 'agile_status':
                    if (filter_value) ticket_filters[project_index].agile.status = filter_value;
                    else delete ticket_filters[project_index].agile.status;
                case 'agile_compact_view':
                    if(filter_value) ticket_filters[project_index].agile.compact_view = filter_value;
                    else delete ticket_filters[project_index].agile.compact_view;
                    break;
                case 'backlog_story':
                    if(filter_value) ticket_filters[project_index].backlog.story = filter_value;
                    else delete ticket_filters[project_index].backlog.story;
                    break;
                case 'backlog_user':
                    if(filter_value) ticket_filters[project_index].backlog.user = filter_value;
                    else delete ticket_filters[project_index].backlog.user;
                    break;
                case 'backlog_sprint_hide':
                    // works as toggle
                    // delete filter method not prodive filter_value
                    if(filter_value) {
                        if(ticket_filters[project_index].backlog.sprint_hide && angular.isArray(ticket_filters[project_index].backlog.sprint_hide)) {
                            // sprint_id is present in array of hidden sprints
                            if (ticket_filters[project_index].backlog.sprint_hide.indexOf(filter_value) >= 0) {
                                // remove from array
                                ticket_filters[project_index].backlog.sprint_hide.splice( ticket_filters[project_index].backlog.sprint_hide.indexOf(filter_value), 1 );
                                // if array is empty - remove its
                                if(ticket_filters[project_index].backlog.sprint_hide.length == 0) {
                                    delete ticket_filters[project_index].backlog.sprint_hide;
                                }
                            } else {
                                ticket_filters[project_index].backlog.sprint_hide.push(filter_value)
                            }
                        } else {
                            ticket_filters[project_index].backlog.sprint_hide = [filter_value];
                        }
                    }
                    else delete ticket_filters[project_index].backlog.sprint_hide;
                    break;
                case 'knowledge_story':
                    if(filter_value) ticket_filters[project_index].knowledge.story = filter_value;
                    else delete ticket_filters[project_index].knowledge.story;
                    break;
                case 'files_type':
                    if(filter_value) ticket_filters[project_index].files.type = filter_value;
                    else delete ticket_filters[project_index].files.type;
                    break;
            }

            // remove filter if all fields are empty
            if( angular.equals({}, ticket_filters[project_index].agile) &&
                angular.equals({}, ticket_filters[project_index].backlog) &&
                angular.equals({}, ticket_filters[project_index].knowledge) &&
                angular.equals({}, ticket_filters[project_index].files) ) {
                    ticket_filters.splice(project_index, 1);
            }

            // save localstorage
            $window.localStorage.setItem('ticket_filters', JSON.stringify(ticket_filters));
        }

        /**
         *
         * Returns ticket filters for specified page and specified project
         *
         * @param {string} page
         * @param {int} project_id
         */
        function getTicketFilters(page, project_id) {
            var project_index;
            var ticket_filters = [];

            if (typeof $window.localStorage.ticket_filters != 'undefined') {
                ticket_filters = JSON.parse($window.localStorage.ticket_filters);
                // add search specified project id index in array
                angular.forEach(ticket_filters, function(filter, filter_index) {
                    if (filter.project_id == project_id) {
                        project_index = filter_index;
                    }
                });
                // project is not present in filters
                if (typeof project_index == 'undefined') {
                    return;
                } else {
                    // specify page filters to return
                    switch(page) {
                        case 'agile':
                            return ticket_filters[project_index].agile;
                        case 'backlog':
                            return ticket_filters[project_index].backlog;
                        case 'knowledge':
                            return ticket_filters[project_index].knowledge;
                        case 'files':
                            return ticket_filters[project_index].files;
                        default:
                            return;
                    }
                }
            } else {
                return;
            }
        }

        /**
         * Remove specific filter data from filters localStorage
         * @param {string} filter
         * @param {int/string} project_id
         */
        function removeTicketFilter(filter, project_id) {
            var project_index;
            var ticket_filters = [];

            if (typeof $window.localStorage.ticket_filters != 'undefined') {
                ticket_filters = JSON.parse($window.localStorage.ticket_filters);
                // add search specified project id index in array
                angular.forEach(ticket_filters, function(filter, filter_index) {
                    if (filter.project_id == project_id) {
                        project_index = filter_index;
                    }
                });
                // project is not present in filters
                if (typeof project_index == 'undefined') {
                    return false;
                } else {
                    switch(filter) {
                        case 'agile_sprint':
                            delete ticket_filters[project_index].agile.sprint;
                            break;
                        case 'agile_story':
                            delete ticket_filters[project_index].agile.story;
                            break;
                        case 'agile_user':
                            delete ticket_filters[project_index].agile.user;
                            break;
                        case 'backlog_story':
                            delete ticket_filters[project_index].backlog.story;
                            break;
                        case 'backlog_user':
                            delete ticket_filters[project_index].backlog.user;
                            break;
                        case 'backlog_sprint_hide':
                            delete ticket_filters[project_index].backlog.sprint_hide;
                            break;
                        case 'knowledge_story':
                            delete ticket_filters[project_index].knowledge.story;
                            break;
                        case 'files_type':
                            delete ticket_filters[project_index].files.type;
                            break;
                        default:
                            return false;
                    }
                    $window.localStorage.setItem('ticket_filters', JSON.stringify(ticket_filters));
                    return true;
                }
            } else {
                return false;
            }

        }

        //

    }
})();
