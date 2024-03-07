(function ()
{
    'use strict';

    angular
        .module('app.company-buy-wizard', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.company-buy-wizard', {
                url    : '/company/buy/:id',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/company/buy-wizard/buy-wizard.html',
                        controller : 'CompanyBuyWizardController as vm'
                    }
                },
                resolve  : {
                    CardList: function (apiResolver) {
                        //disable subscriptions
                        return {data:[]};
                        // return apiResolver.resolve('payuCardList@get');
                    },
                    Payment: function (apiResolver, $stateParams) {
                        return apiResolver.resolve('payment@get', {id: $stateParams.id});
                    },
                    PackagesCurrent: function (apiResolver)
                    {
                        return apiResolver.resolve('packagesCurrent@get');
                    },
                }
            });
    }
})();