(function ()
{
    'use strict';

    angular
        .module('app.products-list', [])
        .config(config);

    /** @ngInject */
    function config($stateProvider)
    {
        // State
        $stateProvider
            .state('app.products-list', {
                url    : '/products/list',
                views  : {
                    'content@app': {
                        templateUrl: 'app/main/products/list/list.html',
                        controller : 'ProductsListController as vm'
                    }
                },
                resolve  : {
                    ProductsList: function (apiResolver)
                    {
                        return apiResolver.resolve('products@get', {limit:__env.table_limit_rows});
                    },
                    TaxesList: function (apiResolver)
                    {
                        return apiResolver.resolve('taxs@get');
                    }
                },
            });
    }
})();