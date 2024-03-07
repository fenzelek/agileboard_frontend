(function ()
{
    'use strict';

    angular
        .module('app.core')
        .controller('InvoicesZipDownloadDialogController', InvoicesZipDownloadDialogController);

    /** @ngInject */
    function InvoicesZipDownloadDialogController($rootScope, $mdDialog, transService, tableService, api, $window, $auth)
    {
        var vm = this;
        transService.loadFile('main/invoices/list/zip_download_dialog');
        vm.loading = false;
        vm.packages = [];
        vm.pagination = {};

        vm.getPackages = getPackages;
        vm.downloadPackage = downloadPackage;
        vm.hide = hide;

        init();
        function init() {
            getPackages();
            tableService.setVariables(vm);
        }

        function getPackages() {
            vm.loading = true;
            vm.promise = api.clipboard.get({}, function (response) {
                vm.packages = response.data;
                vm.pagination = response.meta.pagination;
                vm.loading = false;
            }, function (response) {
                vm.loading = false;
            }).$promise;
        }

        function downloadPackage(package_id) {
            $window.open(
                __env.apiUrl + 'clipboard/' + package_id +
                '?token=' + $window.localStorage.token +
                '&selected_company_id=' + $auth.getCurrentCompany(),
                '_blank');
        } 

        function hide() {
            $mdDialog.hide();
        }
    }

})();
