(function ()
{
    'use strict';

    angular
        .module('app.dashboard', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider.state('app.dashboard', {
            url      : '/dashboard',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/dashboard/dashboard.html',
                    controller : 'DashboardController as vm'
                }
            },
            resolve: {
                CompaniesData: function (apiResolver) {
                    return apiResolver.resolve('companyMyList@get');
                }
            }
        })
        .state('app.fv-dashboard', {
            url      : '/fv-dashboard',
            views    : {
                'content@app': {
                    templateUrl: 'app/main/dashboard/fv/fv-dashboard.html',
                    controller : 'FvDashboardController as vm'
                }
            }
        });
    }
})();
