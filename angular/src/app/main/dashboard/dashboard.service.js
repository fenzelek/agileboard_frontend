(function () {
    'use strict';

    angular
        .module('app.dashboard')
        .factory('dashboardService', dashboardService);

    /** @ngInject */
    function dashboardService($timeout, $filter, api) {

        return {
            fetchCompanyProjects: fetchCompanyProjects,
            getProjectStatuses: getProjectStatuses,
            getProjectSprints: getProjectSprints,
            getProjectTickets: getProjectTickets,
            getLatests: getLatests,
            getCompanyProjectsNumber: getCompanyProjectsNumber
        }


        /**
         * Public functions
         */

        function fetchCompanyProjects(company, companies, callback) {
            // If one company selected:
            if (company) {
                fetchProject(company, callback);
            // If "All companies" selected:
            } else {
                fetchProjects(companies, callback);
            }
        }

        function getProjectStatuses(project, callback) {
            if (project) {
                fetchStatuses(project, callback);
            }
        }

        function getProjectSprints(project, callback) {
            if (project) {
                fetchSprints(project, callback);
            }
        }

        function getProjectTickets(tickets, projects, user, callback) {
            // If one project selected:
            if (tickets.project) {
                fetchProjectTickets(tickets.project, tickets.sprint, tickets.status, user, callback);
            // If "All projects" selected:
            } else {
                fetchProjectsTickets(projects, tickets.sprint, tickets.status, user, callback);
            }
        }

        function getLatests(type, projects, user, peroid, callback) {
            if (type === 'TICKETS') {
                fetchLatestsTickets(projects, user, peroid, callback);
            }
        }

        function getCompanyProjectsNumber(company, projects) {
            var result = 0;
            angular.forEach(projects, function (project) {
                if (project.company_id == company.id) result++;
            });
            return result;
        }



        /**
         * Private functions
         */

        function fetchProject(company, callback) {
            api.projects.get({
                has_access: 1,
                status: 'opened',
                selected_company_id: company.id,
                limit: 50
            }, function (res) {
                callback(res.data);
            });
        }

        function fetchProjects(companies, callback) {
            var promises = [];
            angular.forEach(companies, function (company, i) {
                var promise = api.projects.get({
                    has_access: 1,
                    status: 'opened',
                    selected_company_id: company.id,
                    limit: 50
                }).$promise;
                promises.push(promise);
            });
            resolvePromises(promises, callback);
        }

        function fetchStatuses(project, callback) {
            api.agileStatuses.get({
                project_id: project.id,
                tickets: 0,
                selected_company_id: project.company_id
            }, function (res) {
                callback(res.data);
            });
        }

        function fetchSprints(project, callback) {
            api.sprint.sprints.get({
                project_id: project.id,
                status: 'not-closed',
                selected_company_id: project.company_id,
                limit: 20
            }, function (res) {
                callback(filterSprints(res.data));
            });
        }

        function fetchProjectTickets(project, sprint, status, user, callback) {
            api.agileStatuses.get({
                project_id: project.id,
                sprint_id: sprint? sprint.id : null,
                selected_company_id: project.company_id,
                tickets: 1
            }, function (res) {
                    var tickets = [];
                    var lastStatus = res.data[res.data.length - 1];
                    angular.forEach(res.data, function (status) {
                        tickets = tickets.concat(status.tickets.data);
                    });
                callback(filterTickets(tickets, user, status, null, lastStatus));
            });
        }

        function fetchProjectsTickets(projects, sprint, status, user, callback) {
            var promises = [];
            angular.forEach(projects, function (project) {
                var promise = api.agileStatuses.get({
                    project_id: project.id,
                    sprint_id: sprint? sprint.id : null,
                    selected_company_id: project.company_id,
                    tickets: 1
                }).$promise;
                promises.push(promise);
            });
            // get promises data
            resolvePromises(promises, function (statuses) {
                var tickets = [];
                // filter only "undone" tickets by default
                if (!status) {
                    statuses = removeLastProjectStatus(statuses);
                }
                angular.forEach(statuses, function (status) {
                    tickets = status.tickets ? tickets.concat(status.tickets.data) : tickets;
                });
                var filtered = filterTickets(tickets, user, status);
                callback(filtered);
            });
        }

        function fetchLatestsTickets(projects, user, peroid, callback) {
            var promises = [];
            angular.forEach(projects, function (project) {
                var promise = api.ticket.tickets.get({
                    project_id: project.id,
                    selected_company_id: project.company_id
                }).$promise;
                promises.push(promise);
            });
            // get promises data
            resolvePromises(promises, function (tickets) {
                var filtered = filterTickets(tickets, user, null, peroid);
                var ordered = orderTicketsBy(filtered, 'created_at');
                callback(ordered);
            });

        }

        function filterTickets(tickets, user, status, peroid, lastStatus) {
            var result = [];

            // filter through "assigned to me"
            if (user) {
                angular.forEach(tickets, function (ticket) {
                    if (ticket.assigned_id == user.id) result.push(ticket);
                });
            }
            // filter through status if defined
            if (status) {
                var new_result = [];
                angular.forEach(result, function (ticket) {
                    if (ticket.status_id == status.id) new_result.push(ticket);
                });
                result = new_result;
            }
            // filter through peroid (now -> X days from now) if defined
            if (peroid) {
                var new_result = [];
                angular.forEach(result, function (ticket) {
                    if (moment().diff(moment(ticket.created_at).format('YYYY-MM-DD'), 'days') <= peroid) new_result.push(ticket);
                });
                result = new_result;
            }
            // filter only "undone" tickets by default (if ticket status === last status -> do not display tikcet)
            if (!status && lastStatus) {
                var new_result = [];
                angular.forEach(result, function (ticket) {
                    if (ticket.status_id !== lastStatus.id) new_result.push(ticket);
                });
                result = new_result;
            }

            return result;
        }

        function orderTicketsBy(tickets, param) {
            if (param === 'created_at' || param === 'updated_at') {
                tickets.sort(function (a, b) {
                    a[param + '_friendly'] = moment($filter('utcToLocal')(a[param])).fromNow();
                    b[param + '_friendly'] = moment($filter('utcToLocal')(b[param])).fromNow();
                    var keyA = new Date(a[param]),
                        keyB = new Date(b[param]);
                    // Compare the 2 dates
                    if(keyA < keyB) return 1;
                    if(keyA > keyB) return -1;
                    return 0;
                });
            }
            return tickets;
        }

        function filterSprints(sprints) {
            var result = [];
            angular.forEach(sprints, function(sprint) {
                if (sprint.status == 'active') {
                    result.push(sprint);
                }
            });
            return result;
        }

        function removeLastProjectStatus(statuses) {
            var grouped = statuses.reduce(function(rv, x) {
                (rv[x['project_id']] = rv[x['project_id']] || []).push(x);
                return rv;
            }, {});
            grouped = Object.values(grouped);
            // remove last status
            angular.forEach(grouped, function (group) {
                group.pop();
            });
            // flatten array
            return [].concat.apply([], grouped);
        }

        function resolvePromises(promises, callback) {
            Promise.all(promises).then(function (resources) {
                var result = [];
                angular.forEach(resources, function (res) {
                    if (res.data) {
                        result = result.concat(res.data);
                    }
                });
                $timeout(function () {
                    callback(result);
                });
            });
        }

    }
})();
