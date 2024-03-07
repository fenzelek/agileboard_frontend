(function ()
{
    'use strict';

    angular
        .module('app.sample')
        .controller('SampleController', SampleController);

    /** @ngInject */
    function SampleController(SampleData, transService)
    {
        var vm = this;
        transService.loadFile('main/sample');

        // Data
        vm.helloText = SampleData.data.helloText;

        // Methods

        //////////
    }
})();
