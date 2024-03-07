(function ()
{
    'use strict';

    angular
        .module('app.cash-operations-form', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.cash-operations-form-new', {
                url    : '/cash-operations/form/:type/cashless/:cashless',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/cash-operations/form/form.html',
                        controller : 'CashOperationsFormController as vm'
                    }
                }
            })
            .state('app.cash-operations-form-edit', {
            url    : '/cash-operations/form/:type/:id',
            views  : {
                'content@app': {
                    templateUrl: 'app/main/cash-operations/form/form.html',
                    controller : 'CashOperationsFormController as vm'
                }
            }
        });
    }
})();