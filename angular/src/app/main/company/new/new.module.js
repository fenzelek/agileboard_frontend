(function ()
{
    'use strict';

    angular
        .module('app.company-new', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.company-new', {
                url    : '/company/new',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/company/new/new.html',
                        controller : 'CompanyNewController as vm'
                    }
                }
            });
    }
})();